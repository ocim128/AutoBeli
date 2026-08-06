import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { validate, qrisPaymentCreateSchema } from "@/lib/validation";
import {
  createQrisPayment,
  getQrisPayment,
  isQrisBaseAmountSupported,
  isQrisConfigured,
  QRIS_DEFAULT_TIMEOUT_MS,
  QRIS_DEFAULT_TIMEZONE,
} from "@/lib/qris";
import { processQrisPaymentEvent } from "@/lib/orders";
import { getBaseUrl } from "@/lib/baseUrl";
import crypto from "crypto";

/**
 * @swagger
 * /api/payment/qris/create:
 *   post:
 *     description: Create (or reuse) a server-managed Qris payment for an order
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *               retry:
 *                 type: boolean
 *                 description: Required when the order is EXPIRED
 *     responses:
 *       200:
 *         description: Qris payment created or reused
 *       400:
 *         description: Invalid input or order not payable
 *       404:
 *         description: Order not found
 *       409:
 *         description: A payment creation is already in progress for this order
 *       410:
 *         description: The existing Qris payment has expired
 *       503:
 *         description: Payment gateway not configured
 */

// A creation lease older than this is considered stale: the bounded provider
// timeout (5 minutes) guarantees any indeterminately-created provider payment
// has expired by then, so a new create cannot double-charge.
const CREATION_LEASE_STALE_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    if (!isQrisConfigured()) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`payment:qris:${ip}`, RATE_LIMITS.ORDER_CREATE);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = validate(qrisPaymentCreateSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { orderId, retry } = validation.data!;
    const client = await getMongoClient();
    const db = client.db();
    const orderCollection = db.collection<Order>("orders");

    const order = await orderCollection.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // This route only serves orders created under the Qris gateway; it must
    // not become a way to pay for orders stored under another gateway.
    if (order.paymentGateway !== "QRIS") {
      return NextResponse.json(
        { error: "Order does not belong to this payment gateway" },
        { status: 400 }
      );
    }

    if (order.status === "PAID") {
      return NextResponse.json({ error: "Order is not pending payment" }, { status: 400 });
    }

    if (order.status === "EXPIRED" && retry !== true) {
      return NextResponse.json(
        { error: "Order expired; retry is required to create a new payment" },
        { status: 400 }
      );
    }

    // Get product details
    const product = await db.collection<Product>("products").findOne({ _id: order.productId });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const quantity = order.quantity || 1;
    const baseAmount = product.priceIdr * quantity;

    if (!isQrisBaseAmountSupported(baseAmount)) {
      return NextResponse.json(
        { error: "Order total is outside the supported payment range" },
        { status: 400 }
      );
    }

    const metadata = order.paymentMetadata;

    // Reuse path: a pending order that already has a Qris payment
    if (order.status === "PENDING" && metadata?.provider === "qris" && metadata.transaction_ref) {
      const storedExpiry = metadata.expires_at;

      if (storedExpiry !== undefined && storedExpiry > Date.now()) {
        return NextResponse.json({
          success: true,
          paymentId: metadata.transaction_ref,
          amount: metadata.amount,
          expiresAt: storedExpiry,
        });
      }

      // Stored expiry passed (or is unknown): reconcile with the provider
      // before deciding, instead of returning a stale QR.
      const statusCheck = await getQrisPayment(metadata.transaction_ref);

      if (!statusCheck.success) {
        return NextResponse.json(
          { error: "Failed to verify the existing payment status" },
          { status: 502 }
        );
      }

      const providerPayment = statusCheck.data;

      if (providerPayment.status === "pending") {
        const expiresAt = providerPayment.expiresAt ?? storedExpiry;

        if (providerPayment.expiresAt !== undefined && providerPayment.expiresAt > Date.now()) {
          if (providerPayment.expiresAt !== storedExpiry) {
            await orderCollection.updateOne(
              { _id: order._id },
              { $set: { "paymentMetadata.expires_at": providerPayment.expiresAt } }
            );
          }

          return NextResponse.json({
            success: true,
            paymentId: metadata.transaction_ref,
            amount: metadata.amount,
            expiresAt,
          });
        }
        // Provider still reports pending but cannot give a usable expiry:
        // fall through and expire locally rather than show a stale QR.
      }

      if (providerPayment.status === "paid") {
        await processQrisPaymentEvent(
          {
            paymentId: metadata.transaction_ref,
            status: "paid",
            amount: providerPayment.amount,
            paidAmount: providerPayment.paidAmount,
            expiresAt: providerPayment.expiresAt,
          },
          db
        );
        return NextResponse.json({ success: true, alreadyPaid: true });
      }

      // Provider expired (or pending with an unusable expiry): transition the
      // order so the customer can explicitly retry with a fresh payment.
      await processQrisPaymentEvent(
        {
          paymentId: metadata.transaction_ref,
          status: "expired",
          amount: metadata.amount ?? providerPayment.amount,
          expiresAt: providerPayment.expiresAt,
        },
        db
      );
      return NextResponse.json({ error: "Payment expired" }, { status: 410 });
    }

    // Create path: guard against an active/indeterminate creation lease
    const now = new Date();
    const staleBefore = new Date(now.getTime() - CREATION_LEASE_STALE_MS);

    if (order.paymentCreationStartedAt && order.paymentCreationStartedAt >= staleBefore) {
      return NextResponse.json(
        { error: "A payment creation is already in progress for this order" },
        { status: 409 }
      );
    }

    // Short conditional lock so concurrent checkouts cannot create multiple
    // provider payments for one order. Retrying an expired order clears the
    // old Qris metadata in the same atomic step; late events for the cleared
    // payment ID are then ignored.
    const attempt = crypto.randomUUID();
    const lockResult = await orderCollection.updateOne(
      {
        _id: order._id,
        status: order.status,
        $or: [
          { paymentCreationStartedAt: { $exists: false } },
          { paymentCreationStartedAt: { $lt: staleBefore } },
        ],
      },
      {
        $set: {
          ...(order.status === "EXPIRED" ? { status: "PENDING" as const } : {}),
          paymentCreationStartedAt: now,
          paymentCreationAttempt: attempt,
          updatedAt: now,
        },
        ...(order.status === "EXPIRED" ? { $unset: { paymentMetadata: "" } } : {}),
      }
    );

    if (lockResult.modifiedCount === 0) {
      const current = await orderCollection.findOne({ _id: order._id });
      const currentMetadata = current?.paymentMetadata;

      if (current?.status === "PAID") {
        return NextResponse.json({ success: true, alreadyPaid: true });
      }

      if (
        current?.status === "PENDING" &&
        currentMetadata?.provider === "qris" &&
        currentMetadata.transaction_ref
      ) {
        return NextResponse.json({
          success: true,
          paymentId: currentMetadata.transaction_ref,
          amount: currentMetadata.amount,
          expiresAt: currentMetadata.expires_at,
        });
      }

      return NextResponse.json(
        { error: "A payment creation is already in progress for this order" },
        { status: 409 }
      );
    }

    const webhookUrl = `${getBaseUrl()}/api/webhooks/qris?attempt=${encodeURIComponent(attempt)}`;

    const createResult = await createQrisPayment({
      baseAmount,
      timeout: QRIS_DEFAULT_TIMEOUT_MS,
      webhookUrl,
      timezone: QRIS_DEFAULT_TIMEZONE,
    });

    if (!createResult.success) {
      if (!createResult.indeterminate) {
        // Known-safe provider rejection: no payment was created, release the lease.
        await orderCollection.updateOne(
          { _id: order._id, paymentCreationAttempt: attempt },
          { $unset: { paymentCreationStartedAt: "", paymentCreationAttempt: "" } }
        );
        return NextResponse.json({ error: createResult.error }, { status: 502 });
      }

      // Indeterminate outcome (timeout/network/5xx): Qris may have created the
      // payment. Keep the lease; the attempt nonce lets a webhook recover the
      // metadata, and no second provider payment may be created meanwhile.
      console.error("[Qris] Create payment outcome indeterminate:", createResult.error);
      return NextResponse.json(
        { error: "Payment provider did not confirm the payment. Please try again shortly." },
        { status: 504 }
      );
    }

    const payment = createResult.data;

    // Persist provider metadata conditionally. If a signed webhook already
    // attached this payment via the attempt nonce, return the stored metadata.
    const persistResult = await orderCollection.updateOne(
      {
        _id: order._id,
        paymentCreationAttempt: attempt,
        "paymentMetadata.transaction_ref": { $exists: false },
      },
      {
        $set: {
          paymentMetadata: {
            provider: "qris",
            transaction_ref: payment.paymentId,
            amount: payment.amount,
            ...(payment.expiresAt !== undefined ? { expires_at: payment.expiresAt } : {}),
          },
          updatedAt: new Date(),
        },
        $unset: { paymentCreationStartedAt: "", paymentCreationAttempt: "" },
      }
    );

    if (persistResult.modifiedCount === 0) {
      const current = await orderCollection.findOne({ _id: order._id });
      const currentMetadata = current?.paymentMetadata;

      if (currentMetadata?.provider === "qris" && currentMetadata.transaction_ref) {
        return NextResponse.json({
          success: true,
          paymentId: currentMetadata.transaction_ref,
          amount: currentMetadata.amount,
          expiresAt: currentMetadata.expires_at,
        });
      }

      console.error("[Qris] Lost metadata persistence race without stored metadata");
      return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.paymentId,
      amount: payment.amount,
      expiresAt: payment.expiresAt,
    });
  } catch (error) {
    console.error("Qris payment error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
