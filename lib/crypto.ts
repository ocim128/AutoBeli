import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Ensure 32 bytes (256 bits) key
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // For AES, this is always 16

function getEncryptionKeyBuffer(): Buffer {
  const encryptionKey = process.env.CONTENT_ENCRYPTION_KEY || "";

  if (Buffer.byteLength(encryptionKey, "utf8") !== 32) {
    throw new Error("CONTENT_ENCRYPTION_KEY must be exactly 32 bytes");
  }

  return Buffer.from(encryptionKey);
}

export function encryptContent(text: string): string {
  if (!text) return "";
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKeyBuffer(), iv);
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
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKeyBuffer(), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
