import { test, expect } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";
import {
  countAudienceRecipientsForProductBroadcast,
  getAudienceRecipientsForProductBroadcast,
} from "../lib/audience";
import { getE2EMongoUri } from "./helpers/config";

test("broadcast selection excludes buyers through canonical addresses and aliases", async () => {
  const client = new MongoClient(getE2EMongoUri());
  await client.connect();
  const db = client.db(`${client.db().databaseName}_broadcast_${randomUUID().replace(/-/g, "")}`);
  try {
    const productId = new ObjectId();
    const contact = (email: string, extra = {}) => ({
      email,
      allEmails: [email],
      status: "ACTIVE",
      ...extra,
    });
    await db
      .collection("audiences")
      .insertMany([
        contact("buyer@example.com"),
        contact("corrected@example.com", {
          allEmails: ["corrected@example.com", "old@example.com"],
        }),
        contact("deleted@example.com", { deletedAt: new Date() }),
        contact("excluded@example.com", { status: "EXCLUDED" }),
        contact("bounced@example.com", { status: "BOUNCED" }),
        contact("eligible@example.com"),
        contact("pending@example.com", { deletedAt: null }),
        contact("other-product@example.com"),
      ]);
    await db.collection("orders").insertMany([
      { productId, status: "PAID", customerContact: " Buyer@Example.com " },
      { productId, status: "PAID", customerContact: "buyer@example.com" },
      { productId, status: "PAID", customerContact: "OLD@example.com" },
      { productId, status: "PENDING", customerContact: "pending@example.com" },
      { productId: new ObjectId(), status: "PAID", customerContact: "other-product@example.com" },
    ]);

    expect(await countAudienceRecipientsForProductBroadcast(productId, db)).toBe(3);
    const recipients = await getAudienceRecipientsForProductBroadcast(productId, db, 4);
    expect(recipients.map((row) => row.email).sort()).toEqual([
      "eligible@example.com",
      "other-product@example.com",
      "pending@example.com",
    ]);
    expect(await getAudienceRecipientsForProductBroadcast(productId, db, 2)).toHaveLength(2);
  } finally {
    await db.dropDatabase();
    await client.close();
  }
});
