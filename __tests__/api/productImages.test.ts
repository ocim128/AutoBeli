/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Binary, ObjectId } from "mongodb";
import sharp from "sharp";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  insertOne: vi.fn(),
  findOne: vi.fn(),
  collection: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/lib/db", () => ({
  getMongoClient: async () => ({ db: () => ({ collection: mocks.collection }) }),
}));

import { POST } from "@/app/api/admin/products/image/route";
import { GET } from "@/app/api/images/[id]/route";
import {
  MAX_PRODUCT_IMAGE_BYTES,
  createProductSchema,
  updateProductSchema,
} from "@/lib/validation";

function upload(body: Uint8Array | string, type = "image/png", headers = {}) {
  return new Request("http://localhost/api/admin/products/image", {
    method: "POST",
    headers: { "Content-Type": type, ...headers },
    body: typeof body === "string" ? body : new Uint8Array(body),
  });
}

function read(id: string) {
  return GET(new Request(`http://localhost/api/images/${id}`), { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ role: "ADMIN" });
  mocks.collection.mockReturnValue({ insertOne: mocks.insertOne, findOne: mocks.findOne });
});

describe("permanent product image uploads", () => {
  it.each(["jpeg", "png", "webp"] as const)(
    "stores a real %s image and serves it without an admin session",
    async (format) => {
      const original = await sharp({
        create: { width: 10, height: 20, channels: 4, background: "red" },
      })
        .toFormat(format)
        .toBuffer();
      const response = await POST(upload(original, `image/${format}`));
      expect(response.status).toBe(201);
      const { imageUrl } = await response.json();
      expect(imageUrl).toMatch(/^\/api\/images\/[a-f0-9]{24}$/);
      expect(mocks.collection).toHaveBeenCalledWith("productImages");
      const stored = mocks.insertOne.mock.calls[0][0];
      expect(stored).toMatchObject({
        _id: expect.any(ObjectId),
        data: expect.any(Binary),
        createdAt: expect.any(Date),
      });
      expect(stored).not.toHaveProperty("expiresAt");
      expect(
        createProductSchema.safeParse({
          title: "Product",
          slug: "product",
          priceIdr: 1000,
          content: "secret",
          imageUrl,
        }).success
      ).toBe(true);
      expect(updateProductSchema.safeParse({ slug: "product", imageUrl }).success).toBe(true);

      mocks.session.mockResolvedValue(null);
      mocks.findOne.mockResolvedValue(stored);
      const imageResponse = await read(imageUrl.split("/").pop());
      expect(imageResponse.status).toBe(200);
      expect(mocks.findOne).toHaveBeenCalledWith({ _id: stored._id });
      expect(imageResponse.headers.get("content-type")).toBe("image/webp");
      expect(imageResponse.headers.get("cache-control")).toContain("immutable");
      expect(imageResponse.headers.get("x-content-type-options")).toBe("nosniff");
      const downloaded = Buffer.from(await imageResponse.arrayBuffer());
      expect(downloaded).toEqual(Buffer.from(stored.data.value()));
      expect(await sharp(downloaded).metadata()).toMatchObject({
        format: "webp",
        width: 10,
        height: 20,
      });
    }
  );

  it.each([null, { role: "USER" }])("rejects uploads without an admin session", async (session) => {
    mocks.session.mockResolvedValue(session);
    expect((await POST(upload("not an image"))).status).toBe(401);
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it.each([
    ["", "image/png"],
    ["not an image", "image/png"],
    ["<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>", "image/png"],
    ["<svg/>", "image/svg+xml"],
    ["text", "text/plain"],
  ])("rejects empty, corrupt, and unsupported data", async (body, type) => {
    expect((await POST(upload(body, type))).status).toBe(400);
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("rejects a forged content type", async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } })
      .png()
      .toBuffer();
    expect((await POST(upload(png, "image/jpeg"))).status).toBe(400);
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("rejects an oversized declared upload before reading", async () => {
    expect(
      (
        await POST(
          upload("image", "image/png", { "Content-Length": String(MAX_PRODUCT_IMAGE_BYTES + 1) })
        )
      ).status
    ).toBe(413);
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("limits streamed uploads even when content-length is missing or understated", async () => {
    const cancel = vi.fn();
    const request = new Request("http://localhost/api/admin/products/image", {
      method: "POST",
      headers: { "Content-Type": "image/png", "Content-Length": "1" },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(MAX_PRODUCT_IMAGE_BYTES + 1));
        },
        cancel,
      }),
      duplex: "half",
    } as RequestInit);
    expect((await POST(request)).status).toBe(413);
    expect(cancel).toHaveBeenCalled();
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("rejects images exceeding the pixel limit", async () => {
    const png = await sharp({
      create: { width: 5000, height: 5000, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    expect((await POST(upload(png))).status).toBe(400);
    expect(mocks.insertOne).not.toHaveBeenCalled();
  });

  it("keeps the upload unsuccessful when database persistence fails", async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } })
      .png()
      .toBuffer();
    mocks.insertOne.mockRejectedValue(new Error("Database unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(upload(png))).status).toBe(500);
    log.mockRestore();
  });

  it("returns 404 for invalid and missing image IDs", async () => {
    expect((await read("invalid")).status).toBe(404);
    expect(mocks.findOne).not.toHaveBeenCalled();
    mocks.findOne.mockResolvedValue(null);
    expect((await read(new ObjectId().toHexString())).status).toBe(404);
  });

  it.each([
    "/api/images/not-an-id",
    "/admin/products",
    "//example.com/image",
    "/api/images/abcdef123456789012345678?extra=1",
  ])("rejects an unrelated relative image URL %s", (imageUrl) => {
    expect(updateProductSchema.safeParse({ slug: "product", imageUrl }).success).toBe(false);
  });
});
