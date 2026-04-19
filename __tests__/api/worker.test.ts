/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import worker from "../../worker/src/index.js";

describe("outbound email worker", () => {
  it("requires an exact API key match before sending email", async () => {
    const send = vi.fn().mockResolvedValue({ messageId: "msg_123" });
    const env = {
      OUTBOUND_EMAIL_API_KEY: "supersecretkey",
      OUTBOUND_EMAIL: { send },
      ALLOWED_FROM_DOMAINS: "akunlama.com",
    };

    const unauthorizedResponse = await worker.fetch(
      new Request("https://worker.example/api/send", {
        method: "POST",
        headers: {
          Authorization: "Bearer short",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "buyer@example.com",
          fromEmail: "sender@akunlama.com",
          subject: "Test subject",
          text: "Test body",
        }),
      }),
      env
    );

    expect(unauthorizedResponse.status).toBe(401);
    expect(send).not.toHaveBeenCalled();

    const authorizedResponse = await worker.fetch(
      new Request("https://worker.example/api/send", {
        method: "POST",
        headers: {
          Authorization: "Bearer supersecretkey",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "buyer@example.com",
          fromEmail: "sender@akunlama.com",
          subject: "Test subject",
          text: "Test body",
        }),
      }),
      env
    );

    expect(authorizedResponse.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("does not expose worker secrets from the health endpoint", async () => {
    const response = await worker.fetch(new Request("https://worker.example/api/health"), {
      OUTBOUND_EMAIL: { send: vi.fn() },
      OUTBOUND_EMAIL_API_KEY: "supersecretkey",
      DEFAULT_FROM_EMAIL: "noreply@akunlama.com",
      DEFAULT_REPLY_TO: "reply@akunlama.com",
      ALLOWED_FROM_DOMAINS: "akunlama.com",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "autobeli-outbound-email",
      configured: {
        sendBinding: true,
      },
    });
  });
});
