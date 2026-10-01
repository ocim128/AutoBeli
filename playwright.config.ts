import { defineConfig, devices } from "@playwright/test";
import {
  E2E_ADMIN_PASSWORD,
  E2E_ENCRYPTION_KEY,
  E2E_QRIS_HMAC_KEY,
  getE2EMongoUri,
} from "./e2e/helpers/config";

const e2eMongoUri = getE2EMongoUri();

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
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
    { name: "setup", testMatch: /database\.setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001/api/health",
    // Never reuse a dev server that may be connected to a non-E2E database.
    reuseExistingServer: false,
    env: {
      MONGODB_URI: e2eMongoUri,
      ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
      JWT_SECRET: "e2e-jwt-secret-key-for-testing",
      CONTENT_ENCRYPTION_KEY: E2E_ENCRYPTION_KEY,
      EMAIL_DEV_FALLBACK: "1",
      CLOUDFLARE_EMAIL_API_URL: "",
      CLOUDFLARE_EMAIL_API_KEY: "",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3001",
      // Run E2E under the Qris gateway so the Qris flow is exercised end-to-end.
      // The mock/pakasir tests mock provider endpoints at the network layer and
      // do not depend on the configured gateway value.
      PAYMENT_GATEWAY: "QRIS",
      // Point at the local Qris mock server started by global-setup.ts.
      // HTTP is allowed because NODE_ENV is "development" during `next dev`.
      QRIS_API_BASE_URL: "http://127.0.0.1:9119",
      QRIS_API_KEY: "e2e-qris-api-key",
      QRIS_WEBHOOK_HMAC_KEY: E2E_QRIS_HMAC_KEY,
    },
  },
});
