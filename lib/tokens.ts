import { randomBytes } from "crypto";
import { getMongoClient } from "@/lib/db";
import { AccessToken } from "@/lib/definitions";
import { ObjectId } from "mongodb";

export async function generateAccessToken(orderId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const client = await getMongoClient();
  const db = client.db();

  const newToken: AccessToken = {
    orderId: new ObjectId(orderId),
    token,
    usageCount: 0,
    createdAt: new Date(),
  };

  await db.collection<AccessToken>("tokens").insertOne(newToken);
  return token;
}
