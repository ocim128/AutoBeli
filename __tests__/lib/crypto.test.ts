/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEncryptionKey = process.env.CONTENT_ENCRYPTION_KEY;
const TEST_ENCRYPTION_KEY = "abcdefghijklmnopqrstuvwxyz123456";

describe("Crypto Module", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CONTENT_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  afterEach(() => {
    process.env.CONTENT_ENCRYPTION_KEY = originalEncryptionKey;
    vi.restoreAllMocks();
  });

  describe("encryptContent", () => {
    it("encrypts text content", async () => {
      const { encryptContent } = await import("@/lib/crypto");
      const plaintext = "Hello, World!";
      const encrypted = encryptContent(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it("returns empty string for empty input", async () => {
      const { encryptContent } = await import("@/lib/crypto");
      expect(encryptContent("")).toBe("");
    });

    it("produces output in correct format (iv:ciphertext)", async () => {
      const { encryptContent } = await import("@/lib/crypto");
      const encrypted = encryptContent("test");
      const parts = encrypted.split(":");

      expect(parts).toHaveLength(2);
      expect(parts[0]).toHaveLength(32);
      expect(parts[0]).toMatch(/^[a-f0-9]+$/);
      expect(parts[1]).toMatch(/^[a-f0-9]+$/);
    });

    it("produces different ciphertext for same plaintext", async () => {
      const { encryptContent } = await import("@/lib/crypto");
      const plaintext = "Same text";

      expect(encryptContent(plaintext)).not.toBe(encryptContent(plaintext));
    });

    it("throws a clear error when key byte length is invalid", async () => {
      process.env.CONTENT_ENCRYPTION_KEY = "short";
      vi.resetModules();
      const { encryptContent } = await import("@/lib/crypto");

      expect(() => encryptContent("test")).toThrow(
        "CONTENT_ENCRYPTION_KEY must be exactly 32 bytes"
      );
    });
  });

  describe("decryptContent", () => {
    it("decrypts encrypted content correctly", async () => {
      const { encryptContent, decryptContent } = await import("@/lib/crypto");
      const original = "Hello, World!";

      expect(decryptContent(encryptContent(original))).toBe(original);
    });

    it("returns empty string for empty input", async () => {
      const { decryptContent } = await import("@/lib/crypto");
      expect(decryptContent("")).toBe("");
    });

    it("decrypts unicode content", async () => {
      const { encryptContent, decryptContent } = await import("@/lib/crypto");
      const original = "\u4f60\u597d\u4e16\u754c \ud83c\udf0d \u0645\u0631\u062d\u0628\u0627";

      expect(decryptContent(encryptContent(original))).toBe(original);
    });

    it("decrypts long content", async () => {
      const { encryptContent, decryptContent } = await import("@/lib/crypto");
      const original = "x".repeat(10000);

      expect(decryptContent(encryptContent(original))).toBe(original);
    });

    it("decrypts content with special characters", async () => {
      const { encryptContent, decryptContent } = await import("@/lib/crypto");
      const original = "!@#$%^&*()_+-={}[]|:\";'<>?,./`~";

      expect(decryptContent(encryptContent(original))).toBe(original);
    });

    it("decrypts content with newlines", async () => {
      const { encryptContent, decryptContent } = await import("@/lib/crypto");
      const original = "Line 1\nLine 2\r\nLine 3";

      expect(decryptContent(encryptContent(original))).toBe(original);
    });

    it("throws error for invalid encrypted format", async () => {
      const { decryptContent } = await import("@/lib/crypto");

      expect(() => decryptContent("invaliddata")).toThrow();
    });

    it("throws error for corrupted ciphertext", async () => {
      const { encryptContent, decryptContent } = await import("@/lib/crypto");
      const encrypted = encryptContent("test");
      const corrupted = encrypted.slice(0, -10) + "corrupted!";

      expect(() => decryptContent(corrupted)).toThrow();
    });
  });

  describe("encrypt-decrypt roundtrip", () => {
    const testCases = [
      "Simple text",
      "12345",
      "",
      "a",
      "Multi\nLine\nContent",
      'JSON: {"key": "value", "num": 123}',
      'HTML: <div class="test">Content</div>',
      "SQL: SELECT * FROM users WHERE id = 1;",
      "Code: const x = () => { return true; };",
      "    Leading and trailing whitespace    ",
    ];

    testCases.forEach((testCase, index) => {
      it(`roundtrip test #${index + 1}`, async () => {
        const { encryptContent, decryptContent } = await import("@/lib/crypto");

        expect(decryptContent(encryptContent(testCase))).toBe(testCase);
      });
    });
  });
});
