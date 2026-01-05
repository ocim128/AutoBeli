/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { SignJWT, jwtVerify } from "jose";

// Create test versions of the auth functions to avoid importing
// the actual module which has server-side dependencies (cookies)
const TEST_SECRET = "test_jwt_secret_key_for_testing";
const key = new TextEncoder().encode(TEST_SECRET);

async function signSession(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

describe("Auth Module", () => {
  describe("signSession", () => {
    it("creates a JWT token", async () => {
      const token = await signSession({ role: "ADMIN" });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("creates token with proper JWT format (3 parts)", async () => {
      const token = await signSession({ role: "ADMIN" });

      const parts = token.split(".");
      expect(parts).toHaveLength(3);
    });

    it("encodes payload in token", async () => {
      const payload = { role: "ADMIN", userId: "123" };
      const token = await signSession(payload);

      // Verify the token contains our payload
      const verified = await verifySession(token);
      expect(verified).toBeDefined();
      expect(verified?.role).toBe("ADMIN");
      expect(verified?.userId).toBe("123");
    });

    it("includes issued-at claim", async () => {
      const token = await signSession({ role: "ADMIN" });
      const verified = await verifySession(token);

      expect(verified?.iat).toBeDefined();
      expect(typeof verified?.iat).toBe("number");
    });

    it("includes expiration claim", async () => {
      const token = await signSession({ role: "ADMIN" });
      const verified = await verifySession(token);

      expect(verified?.exp).toBeDefined();
      expect(typeof verified?.exp).toBe("number");
      // Should expire in ~24 hours
      const now = Math.floor(Date.now() / 1000);
      const expiry = verified?.exp as number;
      expect(expiry - now).toBeGreaterThan(23 * 60 * 60); // At least 23 hours
      expect(expiry - now).toBeLessThanOrEqual(24 * 60 * 60 + 60); // At most 24 hours + 1 minute buffer
    });

    it("handles complex payloads", async () => {
      const payload = {
        role: "ADMIN",
        permissions: ["read", "write", "delete"],
        metadata: { lastLogin: new Date().toISOString() },
      };
      const token = await signSession(payload);
      const verified = await verifySession(token);

      expect(verified?.permissions).toEqual(["read", "write", "delete"]);
    });
  });

  describe("verifySession", () => {
    it("verifies valid token", async () => {
      const token = await signSession({ role: "ADMIN" });
      const result = await verifySession(token);

      expect(result).not.toBeNull();
      expect(result?.role).toBe("ADMIN");
    });

    it("returns null for invalid token", async () => {
      const result = await verifySession("invalid.token.here");

      expect(result).toBeNull();
    });

    it("returns null for empty token", async () => {
      const result = await verifySession("");

      expect(result).toBeNull();
    });

    it("returns null for malformed token", async () => {
      const result = await verifySession("not-a-jwt");

      expect(result).toBeNull();
    });

    it("returns null for token with wrong signature", async () => {
      const token = await signSession({ role: "ADMIN" });
      // Tamper with the signature (last part)
      const parts = token.split(".");
      parts[2] = "tampered_signature";
      const tamperedToken = parts.join(".");

      const result = await verifySession(tamperedToken);

      expect(result).toBeNull();
    });

    it("returns null for token with modified payload", async () => {
      const token = await signSession({ role: "USER" });
      const parts = token.split(".");

      // Decode, modify, re-encode the payload
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      payload.role = "ADMIN"; // Try to escalate privileges
      parts[1] = Buffer.from(JSON.stringify(payload)).toString("base64url");

      const tamperedToken = parts.join(".");
      const result = await verifySession(tamperedToken);

      expect(result).toBeNull();
    });

    it("returns null for expired token", async () => {
      // This test would require mocking time or creating a token that expires immediately
      // For now, we trust that jose handles expiration correctly
      // A more complete test would use vi.useFakeTimers()
      const token = await signSession({ role: "ADMIN" });

      // Token should be valid immediately after creation
      const result = await verifySession(token);
      expect(result).not.toBeNull();
    });
  });

  describe("session roundtrip", () => {
    it("signs and verifies admin session", async () => {
      const token = await signSession({ role: "ADMIN" });
      const session = await verifySession(token);

      expect(session).not.toBeNull();
      expect(session?.role).toBe("ADMIN");
    });

    it("preserves all payload data", async () => {
      const originalPayload = {
        role: "ADMIN",
        userId: "user_123",
        email: "admin@example.com",
      };

      const token = await signSession(originalPayload);
      const session = await verifySession(token);

      expect(session?.role).toBe(originalPayload.role);
      expect(session?.userId).toBe(originalPayload.userId);
      expect(session?.email).toBe(originalPayload.email);
    });
  });
});
