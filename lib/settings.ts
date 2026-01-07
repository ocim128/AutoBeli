import clientPromise from "@/lib/db";
import { Settings } from "@/lib/definitions";

const DEFAULT_SETTINGS: Settings = {
  emailEnabled: false,
  emailFromName: "AutoBeli Store",
  emailFromAddress: "",
  emailSubjectTemplate: "Your purchase is complete - {{productTitle}}",
  emailBodyTemplate: `Hello!

Thank you for your purchase of **{{productTitle}}**.

**Order Details:**
- Order ID: {{orderId}}
- Amount Paid: Rp {{amountPaid}}
- Date: {{orderDate}}

You can access your purchased content anytime at:
{{orderLink}}

If you have any questions, please reply to this email.

Thank you for shopping with us!

Best regards,
AutoBeli Store`,
  mailgunDomain: "",
};

export async function getSettings(): Promise<Settings> {
  try {
    const client = await clientPromise;
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
  const client = await clientPromise;
  const db = client.db();

  // Remove _id from updates if present
  const { ...settingsToUpdate } = updates;

  const result = await db.collection<Settings>("settings").findOneAndUpdate(
    { _id: "app_settings" as unknown as import("mongodb").ObjectId },
    {
      $set: {
        ...settingsToUpdate,
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
