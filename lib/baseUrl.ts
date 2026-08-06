const DEFAULT_LOCAL_BASE_URL = "http://localhost:3001";

export function getBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    let url: URL;
    try {
      url = new URL(configuredBaseUrl);
    } catch {
      throw new Error("NEXT_PUBLIC_BASE_URL must be an absolute URL");
    }

    // A misconfigured HTTP base URL in production would produce insecure
    // webhook URLs that the Qris service cannot reach and that leak the
    // attempt nonce. Fail fast instead.
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_BASE_URL must be an HTTPS URL in production");
    }

    return url.origin.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_BASE_URL must be configured in production");
  }

  return DEFAULT_LOCAL_BASE_URL;
}
