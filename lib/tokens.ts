import { randomBytes } from "crypto";
import { getMongoClient } from "@/lib/db";
import { AccessToken } from "@/lib/definitions";
import { Db, ObjectId } from "mongodb";

async function getDb(db?: Db): Promise<Db> {
  if (db) return db;
  const client = await getMongoClient();
  return client.db();
}

export async function ensureAccessToken(orderId: string, db?: Db): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const database = await getDb(db);
  const orderObjectId = new ObjectId(orderId);

  const tokenRecord = await database.collection<AccessToken>("tokens").findOneAndUpdate(
    { orderId: orderObjectId },
    {
      $setOnInsert: {
        orderId: orderObjectId,
        token,
        usageCount: 0,
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  if (!tokenRecord?.token) {
    throw new Error("Failed to create access token");
  }

  return tokenRecord.token;
}

export async function generateAccessToken(orderId: string): Promise<string> {
  return ensureAccessToken(orderId);
}
