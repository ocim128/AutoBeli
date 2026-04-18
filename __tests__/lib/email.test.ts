/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const originalEnv = process.env;

describe("email sender", () => {
  let tempDir: string | undefined;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env = { ...originalEnv };

    delete process.env.CLOUDFLARE_EMAIL_API_URL;
    delete process.env.CLOUDFLARE_EMAIL_API_KEY;
    delete process.env.CLOUDFLARE_EMAIL_FROM;
    delete process.env.CLOUDFLARE_EMAIL_FROM_NAME;
    delete process.env.CLOUDFLARE_EMAIL_REPLY_TO;
    delete process.env.EMAIL_DEV_OUTBOX_DIR;
    delete process.env.EMAIL_DEV_FALLBACK;
  });

  afterEach(async () => {
    process.env = originalEnv;
    vi.restoreAllMocks();

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it("writes to the local outbox when Cloudflare is missing in local development", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "autobeli-email-"));
    process.env = {
      ...process.env,
      NODE_ENV: "development",
      EMAIL_DEV_OUTBOX_DIR: tempDir,
    };

    const { sendPlainTextEmail } = await import("@/lib/email");
    const result = await sendPlainTextEmail("buyer@example.com", "Test Subject", "Test body");

    expect(result.success).toBe(true);
    expect(result.message).toContain("local outbox");

    const files = await readdir(tempDir);
    expect(files).toHaveLength(1);

    const outboxContent = await readFile(path.join(tempDir, files[0]), "utf8");
    const entry = JSON.parse(outboxContent.trim()) as {
      to: string;
      subject: string;
      text: string;
      transport: string;
    };

    expect(entry).toMatchObject({
      to: "buyer@example.com",
      subject: "Test Subject",
      text: "Test body",
      transport: "local-outbox",
    });
  });

  it("returns a detailed config error when Cloudflare is missing outside local fallback", async () => {
    process.env = {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PUBLIC_BASE_URL: "https://beli.akunlama.com",
      EMAIL_DEV_FALLBACK: "0",
    };

    const { sendPlainTextEmail } = await import("@/lib/email");
    const result = await sendPlainTextEmail("buyer@example.com", "Test Subject", "Test body");

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Cloudflare email is not configured. Missing: CLOUDFLARE_EMAIL_API_URL, CLOUDFLARE_EMAIL_API_KEY."
    );
  });

  it("sends auth compatibility headers and surfaces provider error details", async () => {
    process.env = {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PUBLIC_BASE_URL: "https://beli.akunlama.com",
      CLOUDFLARE_EMAIL_API_URL: "https://worker.example/send",
      CLOUDFLARE_EMAIL_API_KEY: "secret-key",
      CLOUDFLARE_EMAIL_FROM: "noreply@akunlama.com",
      CLOUDFLARE_EMAIL_FROM_NAME: "AutoBeli",
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Sender email not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    ) as typeof fetch;

    const { sendPlainTextEmail } = await import("@/lib/email");
    const result = await sendPlainTextEmail(
      "buyer@example.com",
      "Broadcast Subject",
      "Broadcast body"
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "https://worker.example/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer secret-key",
          "Content-Type": "application/json",
          "x-api-key": "secret-key",
        }),
      })
    );

    const requestInit = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as {
      body: string;
    };
    const body = JSON.parse(requestInit.body) as {
      to: string;
      subject: string;
      text: string;
      from: string;
      fromEmail: string;
      fromName: string;
    };

    expect(body).toMatchObject({
      to: "buyer@example.com",
      subject: "Broadcast Subject",
      text: "Broadcast body",
      from: "AutoBeli <noreply@akunlama.com>",
      fromEmail: "noreply@akunlama.com",
      fromName: "AutoBeli",
    });
    expect(result).toEqual({
      success: false,
      error: "Cloudflare email API error: 500 - Sender email not configured",
    });
  });
});
