/**
 * @vitest-environment node
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { fetchWithTimeout, readBodyWithTimeout } from "@/lib/fetchWithTimeout";

const server = createServer((request, response) => {
  if (request.url === "/headers") return;
  response.writeHead(200, { "Content-Type": "application/json" });
  response.flushHeaders();
  response.write("{");
});
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("upstream request deadlines", () => {
  it("aborts a connection that never returns headers", async () => {
    const deadline = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason));
        })
    );
    const request = fetchWithTimeout(`${baseUrl}/headers`, {}, 100);
    const assertion = expect(request).rejects.toThrow("Request timed out after 100ms");

    expect(fetch).toHaveBeenCalledOnce();
    expect(AbortSignal.timeout).toHaveBeenCalledWith(100);
    deadline.abort(new DOMException("Deadline expired", "TimeoutError"));
    await assertion;
  });

  it("still aborts a stalled body after headers arrive", async () => {
    const deadline = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (_input, init) =>
        new Response(
          new ReadableStream({
            start(controller) {
              init!.signal!.addEventListener("abort", () => controller.error(init!.signal!.reason));
            },
          })
        )
    );
    const response = await fetchWithTimeout(`${baseUrl}/body`, {}, 100);
    const assertion = expect(response.text()).rejects.toThrow("Deadline expired");

    deadline.abort(new DOMException("Deadline expired", "TimeoutError"));
    await assertion;
  });

  it("aborts a real stalled HTTP body", async () => {
    const response = await fetchWithTimeout(`${baseUrl}/body`, {}, 1000);
    await expect(response.text()).rejects.toThrow();
  });

  it("preserves caller cancellation after headers arrive", async () => {
    const controller = new AbortController();
    const response = await fetchWithTimeout(`${baseUrl}/body`, { signal: controller.signal }, 3000);
    const body = response.text();
    const assertion = expect(body).rejects.toThrow();
    controller.abort();
    await assertion;
  });

  it("preserves an already-aborted caller's reason", async () => {
    const reason = new Error("Caller cancelled");
    await expect(
      fetchWithTimeout(`${baseUrl}/headers`, {
        signal: AbortSignal.abort(reason),
      })
    ).rejects.toBe(reason);
  });
});

describe("bounded response reads", () => {
  it("cancels the underlying stream when its body stalls", async () => {
    const cancel = vi.fn();
    const response = new Response(new ReadableStream({ cancel }));
    await expect(readBodyWithTimeout(response, 30)).rejects.toThrow("timed out");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("decodes UTF-8 characters split across chunks", async () => {
    const bytes = new TextEncoder().encode("你好 🌏");
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(bytes.slice(0, 1));
          controller.enqueue(bytes.slice(1));
          controller.close();
        },
      })
    );
    await expect(readBodyWithTimeout(response, 1000)).resolves.toBe("你好 🌏");
  });
});
