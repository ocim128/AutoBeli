import { getMongoClient } from "@/lib/db";
import { Settings } from "@/lib/definitions";
import cache, { CACHE_KEYS, CACHE_TTL, getOrFetch } from "@/lib/cache";

const DEFAULT_SETTINGS: Settings = {
  emailEnabled: false,
};

export async function getSettings(): Promise<Settings> {
  return getOrFetch(
    CACHE_KEYS.SETTINGS,
    async () => {
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
    },
    CACHE_TTL.SETTINGS
  );
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

  // Invalidate settings cache so next getSettings() fetches fresh data
  cache.delete(CACHE_KEYS.SETTINGS);

  return result ? { ...DEFAULT_SETTINGS, ...result } : DEFAULT_SETTINGS;
}
