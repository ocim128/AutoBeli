/**
 * Audience Backfill Script
 *
 * One-time script that scans existing PAID orders and builds audience rows.
 * Safe to rerun (idempotent) because upsertAudienceFromPaidOrder is idempotent.
 *
 * Usage: npm run db:backfill-audience
 */

import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  upsertAudienceFromPaidOrder,
  normalizeEmail,
  isValidEmail,
  isTestEmail,
} from "../lib/audience";

// Load .env file manually (since we're running outside Next.js)
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log("📁 Loaded environment from .env file");
  }
}

loadEnv();

async function backfillAudience() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();

    const db = client.db();
    console.log(`📦 Connected to database: ${db.databaseName}\n`);

    // Query all PAID orders that have a customerContact field
    const orders = await db
      .collection("orders")
      .find({
        status: "PAID",
        customerContact: { $exists: true, $ne: "" },
      })
      .toArray();

    console.log(`📊 Found ${orders.length} PAID orders with customerContact\n`);

    let scanned = 0;
    let valid = 0;
    let upserted = 0;
    let skipped = 0;

    for (const order of orders) {
      scanned++;

      const rawEmail = order.customerContact as string;
      const email = normalizeEmail(rawEmail);

      // Skip invalid / test emails
      if (!email || !isValidEmail(email) || isTestEmail(email)) {
        skipped++;
        continue;
      }

      valid++;

      const result = await upsertAudienceFromPaidOrder(email, db);
      if (result) {
        upserted++;
      }

      // Progress log every 100 orders
      if (scanned % 100 === 0) {
        console.log(
          `  ⏳ Progress: ${scanned}/${orders.length} scanned, ${valid} valid, ${upserted} upserted`
        );
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Backfill complete!");
    console.log("=".repeat(50));
    console.log(`  Orders scanned:    ${scanned}`);
    console.log(`  Valid emails:      ${valid}`);
    console.log(`  Audience upserted: ${upserted}`);
    console.log(`  Skipped (invalid/test): ${skipped}`);
  } catch (error) {
    console.error("❌ Error during backfill:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 Connection closed.");
  }
}

backfillAudience();
