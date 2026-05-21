const DEFAULT_LOCAL_BASE_URL = "http://localhost:3001";

export function getBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    try {
      const url = new URL(configuredBaseUrl);
      return url.origin.replace(/\/+$/, "");
    } catch {
      throw new Error("NEXT_PUBLIC_BASE_URL must be an absolute URL");
    }
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_BASE_URL must be configured in production");
  }

  return DEFAULT_LOCAL_BASE_URL;
}
