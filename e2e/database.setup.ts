import { test as setup } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { encryptContent } from "../lib/crypto";
import { E2E_ENCRYPTION_KEY, E2E_PRODUCT_SLUG, getE2EMongoUri } from "./helpers/config";

setup("seed isolated checkout fixtures", async () => {
  const client = new MongoClient(getE2EMongoUri(), { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    const productId = new ObjectId("e2e000000000000000000001");
    const orderIds = await db
      .collection("orders")
      .find({ productId })
      .project({ _id: 1 })
      .toArray();
    await db
      .collection("tokens")
      .deleteMany({ orderId: { $in: orderIds.map((order) => order._id) } });
    await db.collection("orders").deleteMany({ productId });
    await db.collection("audiences").deleteMany({ allEmails: "qris-e2e@example.com" });

    process.env.CONTENT_ENCRYPTION_KEY = E2E_ENCRYPTION_KEY;
    await db.collection("products").replaceOne(
      { _id: productId },
      {
        title: "E2E Digital Access",
        slug: E2E_PRODUCT_SLUG,
        description: "Deterministic checkout fixture",
        priceIdr: 25000,
        isActive: true,
        isSold: false,
        stockItems: Array.from({ length: 100 }, (_, index) => ({
          id: `e2e-stock-${index}`,
          contentEncrypted: encryptContent(`e2e-user-${index}|e2e-password-${index}`),
          isSold: false,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { upsert: true }
    );

    for (const isSold of [false, true]) {
      await db.collection("products").replaceOne(
        {
          _id: new ObjectId(isSold ? "e2e000000000000000000003" : "e2e000000000000000000002"),
        },
        {
          title: "E2E Legacy Access",
          slug: isSold ? "e2e-legacy-sold" : "e2e-legacy-available",
          description: "Legacy stock-count fixture",
          priceIdr: 25000,
          isActive: false,
          isSold,
          contentEncrypted: encryptContent("e2e-legacy-content"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { upsert: true }
      );
    }
  } finally {
    await client.close();
  }
});
