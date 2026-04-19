import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Ensure 32 bytes (256 bits) key
const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.CONTENT_ENCRYPTION_KEY || ""; // Must be 32 chars
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY);
const IV_LENGTH = 16; // For AES, this is always 16

if (ENCRYPTION_KEY.length !== 32) {
  // In dev we might warn, in prod we verify this better
  console.warn("Warning: CONTENT_ENCRYPTION_KEY is not 32 bytes! Encryption may fail.");
}

export function encryptContent(text: string): string {
  if (!text) return "";
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY_BUFFER, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptContent(text: string): string {
  if (!text) return "";
  const textParts = text.split(":");
  const ivPart = textParts.shift();
  if (!ivPart) throw new Error("Invalid encrypted text format");

  const iv = Buffer.from(ivPart, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
