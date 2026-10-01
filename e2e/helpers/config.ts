export const E2E_ADMIN_PASSWORD = "e2e-admin-password";
export const E2E_ENCRYPTION_KEY = "abcdefghijklmnopqrstuvwxyz123456";
export const E2E_QRIS_HMAC_KEY = "e2e-qris-webhook-hmac-key";
export const E2E_PRODUCT_SLUG = "e2e-stock-product";

export function getE2EMongoUri(): string {
  const uri = process.env.E2E_MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "E2E_MONGODB_URI is required for Playwright. E2E tests refuse to use the app's normal MONGODB_URI."
    );
  }
  let databaseName: string;
  try {
    databaseName = decodeURIComponent(new URL(uri).pathname.replace(/^\/+/, ""));
  } catch {
    throw new Error("E2E_MONGODB_URI must be a valid MongoDB connection string.");
  }
  if (!/(^|[-_])e2e([-_]|$)/i.test(databaseName)) {
    throw new Error(
      "E2E_MONGODB_URI must point to a dedicated database whose name contains 'e2e'."
    );
  }
  return uri;
}
