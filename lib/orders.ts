import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";
import { Order, Product, AccessToken } from "@/lib/definitions";
import { invalidateProductCache } from "@/lib/products";
import { getPaymentStatus } from "@/lib/veripay";
import { getTransactionStatus as getMidtransStatus } from "@/lib/midtrans";
import { getPakasirTransactionStatus as getPakasirStatus } from "@/lib/pakasir";
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

    // Only skip if fully synced (PAID and has correct amount AND email was sent)
    if (order.status === "PAID" && order.amountPaid > 0) {
      // If payment is complete but email wasn't sent, try to send it now
      if (!order.emailSent && order.customerContact) {
        try {
          const product = await db
            .collection<Product>("products")
            .findOne({ _id: order.productId });

          if (product) {
            await sendOrderConfirmationEmail({
              orderId: orderId,
              productTitle: product.title,
              amountPaid: order.amountPaid,
              orderDate: new Date(order.paidAt || order.createdAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              customerEmail: order.customerContact,
            });

            // Mark email as sent
            await db
              .collection<Order>("orders")
              .updateOne(
                { _id: new ObjectId(orderId) },
                { $set: { emailSent: true, updatedAt: new Date() } }
              );
          }
        } catch (emailError) {
          console.error("Failed to send order confirmation email on sync:", emailError);
        }
      }
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

        // 2. Mark product/stock item as sold
        const product = await db.collection<Product>("products").findOne({ _id: order.productId });
        const quantityToSell = order.quantity || 1;

        if (product?.stockItems && product.stockItems.length > 0) {
          // Stock-based product: Find the N unsold stock items
          const unsoldIndices = product.stockItems
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => !item.isSold)
            .slice(0, quantityToSell)
            .map(({ index }) => index);

          if (unsoldIndices.length > 0) {
            const soldStockItemIds: string[] = [];
            const updateSet: Record<string, boolean | Date | ObjectId> = { updatedAt: new Date() };

            // Prepare update for all sold items
            unsoldIndices.forEach((index) => {
              const stockItem = product.stockItems![index];
              soldStockItemIds.push(stockItem.id);
              updateSet[`stockItems.${index}.isSold`] = true;
              updateSet[`stockItems.${index}.soldAt`] = new Date();
              updateSet[`stockItems.${index}.orderId`] = new ObjectId(orderId);
            });

            // Mark items as sold
            await db
              .collection<Product>("products")
              .updateOne({ _id: order.productId }, { $set: updateSet });

            // Store stock item IDs in order
            await db.collection<Order>("orders").updateOne(
              { _id: new ObjectId(orderId) },
              {
                $set: {
                  stockItemId: soldStockItemIds[0], // Primary item for legacy compat
                  stockItemIds: soldStockItemIds,
                },
              }
            );

            // Check if all stock items are now sold
            // We need to re-fetch or calculate based on what we just did
            // Simpler: assume we sold some, check if any left
            const totalStock = product.stockItems.length;
            const previousSold = product.stockItems.filter((i) => i.isSold).length;
            const nowSold = previousSold + unsoldIndices.length;

            if (nowSold >= totalStock) {
              await db
                .collection<Product>("products")
                .updateOne({ _id: order.productId }, { $set: { isSold: true } });
            }
          }
        } else {
          // Legacy product: mark entire product as sold
          await db.collection<Product>("products").updateOne(
            { _id: order.productId },
            {
              $set: {
                isSold: true,
                updatedAt: new Date(),
              },
            }
          );
        }

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

              // Mark email as sent
              await db
                .collection<Order>("orders")
                .updateOne({ _id: new ObjectId(orderId) }, { $set: { emailSent: true } });
            }
          } catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
          }
        }

        return true;
      }
    }

    // Handle Midtrans provider
    if (order.paymentMetadata.provider === "midtrans") {
      // For Midtrans, we use order_id to check status
      const midtransStatus = await getMidtransStatus(orderId);

      if (midtransStatus.success && midtransStatus.data) {
        const txStatus = midtransStatus.data.transaction_status;
        const isPaid =
          txStatus === "settlement" ||
          (txStatus === "capture" && midtransStatus.data.fraud_status === "accept");

        if (isPaid) {
          const amount = parseFloat(midtransStatus.data.gross_amount);

          // 1. Update Order Status
          await db.collection<Order>("orders").updateOne(
            { _id: new ObjectId(orderId) },
            {
              $set: {
                status: "PAID",
                amountPaid: amount,
                paidAt: new Date(),
                updatedAt: new Date(),
              },
            }
          );

          // 2. Mark product/stock item as sold
          const product = await db
            .collection<Product>("products")
            .findOne({ _id: order.productId });
          const quantityToSell = order.quantity || 1;

          if (product?.stockItems && product.stockItems.length > 0) {
            const unsoldIndices = product.stockItems
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => !item.isSold)
              .slice(0, quantityToSell)
              .map(({ index }) => index);

            if (unsoldIndices.length > 0) {
              const soldStockItemIds: string[] = [];
              const updateSet: Record<string, boolean | Date | ObjectId> = {
                updatedAt: new Date(),
              };

              unsoldIndices.forEach((index) => {
                const stockItem = product.stockItems![index];
                soldStockItemIds.push(stockItem.id);
                updateSet[`stockItems.${index}.isSold`] = true;
                updateSet[`stockItems.${index}.soldAt`] = new Date();
                updateSet[`stockItems.${index}.orderId`] = new ObjectId(orderId);
              });

              await db
                .collection<Product>("products")
                .updateOne({ _id: order.productId }, { $set: updateSet });

              await db.collection<Order>("orders").updateOne(
                { _id: new ObjectId(orderId) },
                {
                  $set: {
                    stockItemId: soldStockItemIds[0],
                    stockItemIds: soldStockItemIds,
                  },
                }
              );

              const totalStock = product.stockItems.length;
              const previousSold = product.stockItems.filter((i) => i.isSold).length;
              const nowSold = previousSold + unsoldIndices.length;

              if (nowSold >= totalStock) {
                await db
                  .collection<Product>("products")
                  .updateOne({ _id: order.productId }, { $set: { isSold: true } });
              }
            }
          } else {
            await db.collection<Product>("products").updateOne(
              { _id: order.productId },
              {
                $set: {
                  isSold: true,
                  updatedAt: new Date(),
                },
              }
            );
          }

          // 3. Invalidate product cache
          invalidateProductCache();

          // 4. Ensure Access Token Exists
          const existingToken = await db.collection<AccessToken>("tokens").findOne({
            orderId: new ObjectId(orderId),
          });

          if (!existingToken) {
            await generateAccessToken(orderId);
          }

          // 5. Send order confirmation email
          if (order.customerContact) {
            try {
              const product = await db
                .collection<Product>("products")
                .findOne({ _id: order.productId });

              if (product) {
                await sendOrderConfirmationEmail({
                  orderId: orderId,
                  productTitle: product.title,
                  amountPaid: amount,
                  orderDate: new Date().toLocaleString("en-GB", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  customerEmail: order.customerContact,
                });

                // Mark email as sent
                await db
                  .collection<Order>("orders")
                  .updateOne({ _id: new ObjectId(orderId) }, { $set: { emailSent: true } });
              }
            } catch (emailError) {
              console.error("Failed to send order confirmation email:", emailError);
            }
          }

          return true;
        }
      }
    }

    // Handle Pakasir provider
    if (order.paymentMetadata.provider === "pakasir") {
      // We need the product price to verify status because getPakasirStatus requires amount

      const product = await db.collection<Product>("products").findOne({ _id: order.productId });
      if (!product) return false;

      // Calculate total amount based on quantity for Pakasir status check
      const orderQuantity = order.quantity || 1;
      const amount = product.priceIdr * orderQuantity;
      const statusCheck = await getPakasirStatus(orderId, amount);

      if (statusCheck.success && statusCheck.data) {
        const txStatus = statusCheck.data.transaction.status;

        if (txStatus === "completed") {
          // ... Similar completion logic ...
          // To avoid duplication, I should have refactored this shared logic, but for now I will copy the pattern as requested by "maintain style".

          // 1. Update Order Status
          await db.collection<Order>("orders").updateOne(
            { _id: new ObjectId(orderId) },
            {
              $set: {
                status: "PAID",
                amountPaid: amount,
                paidAt: new Date(),
                updatedAt: new Date(),
              },
            }
          );

          // 2. Mark product/stock item as sold
          const quantityToSell = order.quantity || 1;

          if (product?.stockItems && product.stockItems.length > 0) {
            const unsoldIndices = product.stockItems
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => !item.isSold)
              .slice(0, quantityToSell)
              .map(({ index }) => index);

            if (unsoldIndices.length > 0) {
              const soldStockItemIds: string[] = [];
              const updateSet: Record<string, boolean | Date | ObjectId> = {
                updatedAt: new Date(),
              };

              unsoldIndices.forEach((index) => {
                const stockItem = product.stockItems![index];
                soldStockItemIds.push(stockItem.id);
                updateSet[`stockItems.${index}.isSold`] = true;
                updateSet[`stockItems.${index}.soldAt`] = new Date();
                updateSet[`stockItems.${index}.orderId`] = new ObjectId(orderId);
              });

              await db
                .collection<Product>("products")
                .updateOne({ _id: order.productId }, { $set: updateSet });

              await db.collection<Order>("orders").updateOne(
                { _id: new ObjectId(orderId) },
                {
                  $set: {
                    stockItemId: soldStockItemIds[0],
                    stockItemIds: soldStockItemIds,
                  },
                }
              );

              const totalStock = product.stockItems.length;
              const previousSold = product.stockItems.filter((i) => i.isSold).length;
              const nowSold = previousSold + unsoldIndices.length;

              if (nowSold >= totalStock) {
                await db
                  .collection<Product>("products")
                  .updateOne({ _id: order.productId }, { $set: { isSold: true } });
              }
            }
          } else {
            await db.collection<Product>("products").updateOne(
              { _id: order.productId },
              {
                $set: {
                  isSold: true,
                  updatedAt: new Date(),
                },
              }
            );
          }

          // 3. Invalidate product cache
          invalidateProductCache();

          // 4. Ensure Access Token Exists
          const existingToken = await db.collection<AccessToken>("tokens").findOne({
            orderId: new ObjectId(orderId),
          });

          if (!existingToken) {
            await generateAccessToken(orderId);
          }

          // 5. Send order confirmation email
          if (order.customerContact) {
            try {
              await sendOrderConfirmationEmail({
                orderId: orderId,
                productTitle: product.title,
                amountPaid: amount,
                orderDate: new Date().toLocaleString("en-GB", {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                customerEmail: order.customerContact,
              });

              // Mark email as sent
              await db
                .collection<Order>("orders")
                .updateOne({ _id: new ObjectId(orderId) }, { $set: { emailSent: true } });
            } catch (emailError) {
              console.error("Failed to send order confirmation email:", emailError);
            }
          }
          return true;
        }
      }
    }

    return false;
  } catch (e) {
    console.error("Failed to sync order status:", e);
    return false;
  }
}
