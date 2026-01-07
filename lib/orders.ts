import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";
import { Order, Product, AccessToken } from "@/lib/definitions";
import { invalidateProductCache } from "@/lib/products";
import { getPaymentStatus } from "@/lib/veripay";
import { generateAccessToken } from "@/lib/tokens";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";

export type OrderWithProduct = Order & { product: Product };

export async function getOrderWithProduct(orderId: string): Promise<OrderWithProduct | null> {
  if (!ObjectId.isValid(orderId)) return null;

  try {
    const client = await clientPromise;
    const db = client.db();

    // Aggregation to join Order with Product
    const pipeline = [
      { $match: { _id: new ObjectId(orderId) } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      // Exclude sensitive content
      { $project: { "product.contentEncrypted": 0 } },
    ];

    const result = await db.collection<Order>("orders").aggregate(pipeline).toArray();

    if (result.length === 0) return null;
    return result[0] as OrderWithProduct;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function syncOrderPaymentStatus(orderId: string): Promise<boolean> {
  if (!ObjectId.isValid(orderId)) return false;

  try {
    const client = await clientPromise;
    const db = client.db();

    const order = await db.collection<Order>("orders").findOne({ _id: new ObjectId(orderId) });

    if (!order || !order.paymentMetadata?.transaction_ref) {
      return false;
    }

    // Only skip if fully synced (PAID and has correct amount)
    if (order.status === "PAID" && order.amountPaid > 0) {
      return false;
    }

    if (order.paymentMetadata.provider === "veripay") {
      const veripayStatus = await getPaymentStatus(order.paymentMetadata.transaction_ref);

      // Veripay documentation says 'PAID', but experience shows 'SUCCESS'
      if (
        veripayStatus.success &&
        (veripayStatus.data?.status === "PAID" || veripayStatus.data?.status === "SUCCESS")
      ) {
        // 1. Update Order Status
        await db.collection<Order>("orders").updateOne(
          { _id: new ObjectId(orderId) },
          {
            $set: {
              status: "PAID",
              amountPaid: veripayStatus.data?.gross_amount || 0,
              paidAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );

        // 2. Mark product as sold (unique digital products can only be sold once)
        await db.collection<Product>("products").updateOne(
          { _id: order.productId },
          {
            $set: {
              isSold: true,
              updatedAt: new Date(),
            },
          }
        );

        // 3. Invalidate product cache so the store reflects the sold status
        invalidateProductCache();

        // 4. Ensure Access Token Exists
        const existingToken = await db.collection<AccessToken>("tokens").findOne({
          orderId: new ObjectId(orderId),
        });

        if (!existingToken) {
          await generateAccessToken(orderId);
        }

        // 5. Send order confirmation email (if customer provided email)
        if (order.customerContact) {
          try {
            const product = await db
              .collection<Product>("products")
              .findOne({ _id: order.productId });

            if (product) {
              await sendOrderConfirmationEmail({
                orderId: orderId,
                productTitle: product.title,
                amountPaid: veripayStatus.data?.gross_amount || 0,
                orderDate: new Date().toLocaleString("en-GB", {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                customerEmail: order.customerContact,
              });
            }
          } catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
          }
        }

        return true;
      }
    }

    return false;
  } catch (e) {
    console.error("Failed to sync order status:", e);
    return false;
  }
}
