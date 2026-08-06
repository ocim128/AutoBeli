import { defineConfig, devices } from "@playwright/test";

const e2eMongoUri = process.env.E2E_MONGODB_URI?.trim();

if (!e2eMongoUri) {
  throw new Error(
    "E2E_MONGODB_URI is required for Playwright. E2E tests refuse to use the app's normal MONGODB_URI."
  );
}

let e2eDatabaseName = "";
try {
  e2eDatabaseName = decodeURIComponent(new URL(e2eMongoUri).pathname.replace(/^\/+/, ""));
} catch {
  throw new Error("E2E_MONGODB_URI must be a valid MongoDB connection string.");
}

if (!/(^|[-_])e2e([-_]|$)/i.test(e2eDatabaseName)) {
  throw new Error("E2E_MONGODB_URI must point to a dedicated database whose name contains 'e2e'.");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001",
    // Never reuse a dev server that may be connected to a non-E2E database.
    reuseExistingServer: false,
    env: {
      MONGODB_URI: e2eMongoUri,
      NEXT_PUBLIC_BASE_URL: "http://localhost:3001",
      // Run E2E under the Qris gateway so the Qris flow is exercised end-to-end.
      // The mock/pakasir tests mock provider endpoints at the network layer and
      // do not depend on the configured gateway value.
      PAYMENT_GATEWAY: "QRIS",
      // Point at the local Qris mock server started by qris-checkout.spec.ts.
      // HTTP is allowed because NODE_ENV is "development" during `next dev`.
      QRIS_API_BASE_URL: "http://127.0.0.1:9119",
      QRIS_API_KEY: "e2e-qris-api-key",
      QRIS_WEBHOOK_HMAC_KEY: "e2e-qris-webhook-hmac-key",
    },
  },
});
