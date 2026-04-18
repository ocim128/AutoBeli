/**
 * MongoDB Index Setup Script
 *
 * Run this script once to create indexes for optimal query performance.
 * Usage: npm run db:setup-indexes
 *
 * Indexes created:
 * - products.slug: Unique index for fast product lookups
 * - products.isActive_createdAt: Compound index for active product listings
 * - orders.status: Index for filtering orders by status
 * - orders.customerContact: Index for looking up orders by customer
 * - orders.productId: Index for order-product joins
 * - tokens.orderId: Index for token lookups by order
 * - tokens.token: Unique index for token validation
 */

import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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

async function setupIndexes() {
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

    // ========================================
    // PRODUCTS COLLECTION INDEXES
    // ========================================
    console.log("📄 Setting up PRODUCTS indexes...");

    // Unique index on slug for fast lookups
    await db
      .collection("products")
      .createIndex({ slug: 1 }, { unique: true, name: "idx_slug_unique" });
    console.log("  ✅ Created unique index: products.slug");

    // Compound index for active product listings (sorted by newest)
    await db
      .collection("products")
      .createIndex({ isActive: 1, createdAt: -1 }, { name: "idx_active_products_sorted" });
    console.log("  ✅ Created compound index: products.{isActive, createdAt}");

    // ========================================
    // ORDERS COLLECTION INDEXES
    // ========================================
    console.log("\n📄 Setting up ORDERS indexes...");

    // Index on status for filtering
    await db.collection("orders").createIndex({ status: 1 }, { name: "idx_order_status" });
    console.log("  ✅ Created index: orders.status");

    // Index on customerContact for customer lookup
    await db
      .collection("orders")
      .createIndex({ customerContact: 1 }, { sparse: true, name: "idx_customer_contact" });
    console.log("  ✅ Created sparse index: orders.customerContact");

    // Index on productId for joins
    await db.collection("orders").createIndex({ productId: 1 }, { name: "idx_order_product" });
    console.log("  ✅ Created index: orders.productId");

    // Compound index for admin order listing
    await db.collection("orders").createIndex({ createdAt: -1 }, { name: "idx_orders_by_date" });
    console.log("  ✅ Created index: orders.createdAt (descending)");

    // TTL index for unpaid orders (expire after 24 hours)
    // partialFilterExpression ensures we only delete PENDING orders
    await db.collection("orders").createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 86400, // 24 hours
        partialFilterExpression: { status: "PENDING" },
        name: "idx_orders_ttl_pending",
      }
    );
    console.log("  ✅ Created TTL index: orders.createdAt (24h expiry for PENDING)");

    // ========================================
    // ACCESS TOKENS COLLECTION INDEXES
    // ========================================
    console.log("\n📄 Setting up TOKENS indexes...");

    // Index on orderId for token lookups
    await db.collection("tokens").createIndex({ orderId: 1 }, { name: "idx_token_order" });
    console.log("  ✅ Created index: tokens.orderId");

    // Unique index on token for validation
    await db
      .collection("tokens")
      .createIndex({ token: 1 }, { unique: true, name: "idx_token_unique" });
    console.log("  ✅ Created unique index: tokens.token");

    // ========================================
    // AUDIENCES COLLECTION INDEXES
    // ========================================
    console.log("\n📄 Setting up AUDIENCES indexes...");

    await db.collection("audiences").createIndex({ email: 1 }, { name: "idx_audience_email" });
    console.log("  ✅ Created index: audiences.email");

    await db
      .collection("audiences")
      .createIndex({ allEmails: 1 }, { unique: true, name: "idx_audience_all_emails_unique" });
    console.log("  ✅ Created unique multikey index: audiences.allEmails");

    await db.collection("audiences").createIndex({ status: 1 }, { name: "idx_audience_status" });
    console.log("  ✅ Created index: audiences.status");

    await db
      .collection("audiences")
      .createIndex({ deletedAt: 1 }, { sparse: true, name: "idx_audience_deleted" });
    console.log("  ✅ Created sparse index: audiences.deletedAt");

    await db
      .collection("audiences")
      .createIndex({ updatedAt: -1 }, { name: "idx_audience_updated_desc" });
    console.log("  ✅ Created index: audiences.updatedAt (descending)");

    // ========================================
    // BROADCASTS COLLECTION INDEXES
    // ========================================
    console.log("\n📄 Setting up BROADCASTS indexes...");

    await db
      .collection("broadcasts")
      .createIndex({ createdAt: -1 }, { name: "idx_broadcast_created_desc" });
    console.log("  ✅ Created index: broadcasts.createdAt (descending)");

    await db
      .collection("broadcasts")
      .createIndex({ productId: 1 }, { name: "idx_broadcast_product" });
    console.log("  ✅ Created index: broadcasts.productId");

    // ========================================
    // SUMMARY
    // ========================================
    console.log("\n" + "=".repeat(50));
    console.log("✅ All indexes created successfully!");
    console.log("=".repeat(50));

    // List all indexes
    console.log("\n📊 Current indexes:\n");

    for (const collection of ["products", "orders", "tokens", "audiences", "broadcasts"]) {
      const indexes = await db.collection(collection).indexes();
      console.log(`  ${collection}:`);
      indexes.forEach((idx) => {
        console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
      console.log();
    }
  } catch (error) {
    console.error("❌ Error setting up indexes:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Connection closed.");
  }
}

setupIndexes();
