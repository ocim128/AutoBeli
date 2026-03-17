import { getMongoClient } from "@/lib/db";
import { Settings } from "@/lib/definitions";

const DEFAULT_SETTINGS: Settings = {
  emailEnabled: false,
};

export async function getSettings(): Promise<Settings> {
  try {
    const client = await getMongoClient();
    const db = client.db();

    const settings = await db
      .collection<Settings>("settings")
      .findOne({ _id: "app_settings" as unknown as import("mongodb").ObjectId });

    if (!settings) {
      return DEFAULT_SETTINGS;
    }

    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const client = await getMongoClient();
  const db = client.db();

  const result = await db.collection<Settings>("settings").findOneAndUpdate(
    { _id: "app_settings" as unknown as import("mongodb").ObjectId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  return result ? { ...DEFAULT_SETTINGS, ...result } : DEFAULT_SETTINGS;
}
