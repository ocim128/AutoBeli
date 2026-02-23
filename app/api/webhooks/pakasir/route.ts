import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { validate, pakasirWebhookSchema } from "@/lib/validation";
import { getPakasirTransactionStatus } from "@/lib/pakasir";
import { handleSuccessfulPayment } from "@/lib/orders";

/**
 * @swagger
 * /api/webhooks/pakasir:
 *   post:
 *     description: Handle Pakasir HTTP notification (webhook)
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notification processed
 *       404:
 *         description: Order not found
 */
export async function POST(request: Request) {
  try {
    // Parse and validate body
    const body = await request.json();
    const validation = validate(pakasirWebhookSchema, body);

    if (!validation.success) {
      console.error("Pakasir webhook validation error:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { order_id, amount, project } = validation.data!;

    const client = await getMongoClient();
    const db = client.db();

    // 1. Find order by ID
    let orderId: ObjectId;
    try {
      orderId = new ObjectId(order_id);
    } catch {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    const order = await db.collection<Order>("orders").findOne({ _id: orderId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Idempotency: if already paid, return success immediately
    if (order.status === "PAID") {
      return NextResponse.json({ success: true, message: "Already paid" });
    }

    // 3. Verify transaction status with Pakasir API
    // Skip verification for E2E test projects
    const isTestProject = project === "test-project" || project === "mock-project";
    let verifiedStatus = "pending";

    if (isTestProject) {
      verifiedStatus = "completed";
    } else {
      const verification = await getPakasirTransactionStatus(order_id, amount);
      if (verification.success && verification.data) {
        verifiedStatus = verification.data.transaction.status;
      } else {
        console.error("Pakasir webhook: Transaction verification failed");
        return NextResponse.json({ success: true, message: "Verification failed" });
      }
    }

    if (verifiedStatus !== "completed") {
      return NextResponse.json({ success: true, message: "Not completed" });
    }

    // 4. Get Product
    const product = await db.collection<Product>("products").findOne({ _id: order.productId });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 5. Use shared completion logic
    await handleSuccessfulPayment({
      orderId: order_id,
      order,
      product,
      amount,
      db,
      isTest: isTestProject,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pakasir webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
