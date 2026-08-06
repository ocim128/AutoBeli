import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { Order } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { REGEX_PATTERNS } from "@/lib/validation";
import { fetchQrisQrImage, isQrisConfigured } from "@/lib/qris";

/**
 * @swagger
 * /api/payment/qris/image:
 *   get:
 *     description: Same-origin proxy for the Qris QR image of an order's pending payment
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR PNG image
 *         content:
 *           image/png: {}
 *       400:
 *         description: Invalid order ID
 *       404:
 *         description: No pending Qris payment for this order
 *       502:
 *         description: QR image fetch failed
 */
export async function GET(request: Request) {
  try {
    if (!isQrisConfigured()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Accept only an AutoBeli order ID; never a provider URL or payment ID
    // supplied by the browser.
    const orderId = new URL(request.url).searchParams.get("orderId") || "";

    if (!REGEX_PATTERNS.objectId.test(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db();

    const order = await db.collection<Order>("orders").findOne({ _id: new ObjectId(orderId) });

    const transactionRef =
      order?.status === "PENDING" && order.paymentMetadata?.provider === "qris"
        ? order.paymentMetadata.transaction_ref
        : undefined;

    if (!transactionRef) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const imageResult = await fetchQrisQrImage(transactionRef);

    if (!imageResult.success) {
      console.error("[Qris] QR image fetch failed:", imageResult.error);
      return NextResponse.json({ error: "Failed to load QR image" }, { status: 502 });
    }

    return new NextResponse(new Uint8Array(imageResult.image), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageResult.image.byteLength.toString(),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Qris image proxy error:", error);
    return NextResponse.json({ error: "Failed to load QR image" }, { status: 500 });
  }
}
