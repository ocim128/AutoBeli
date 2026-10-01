import { MongoClient, ObjectId } from "mongodb";
import sharp from "sharp";
import { test, expect } from "./fixtures";
import { E2E_ADMIN_PASSWORD, getE2EMongoUri } from "./helpers/config";

test("product images persist through create, reload, replacement, and public access", async ({
  page,
  playwright,
}) => {
  test.setTimeout(90_000);
  const slug = `e2e-image-${Date.now()}`;
  const imageIds: ObjectId[] = [];
  const client = new MongoClient(getE2EMongoUri());
  const publicRequest = await playwright.request.newContext({ baseURL: "http://localhost:3001" });
  const png = await sharp({ create: { width: 100, height: 100, channels: 3, background: "red" } })
    .png()
    .toBuffer();
  const jpeg = await sharp({ create: { width: 100, height: 100, channels: 3, background: "blue" } })
    .jpeg()
    .toBuffer();

  try {
    expect(
      (
        await publicRequest.post("/api/admin/products/image", {
          headers: { "Content-Type": "image/png" },
          data: png,
        })
      ).status()
    ).toBe(401);
    await page.goto("/admin/login");
    await page.getByPlaceholder("Enter admin password").fill(E2E_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Unlock" }).click();
    await expect(page).toHaveURL("/admin/dashboard", { timeout: 15000 });
    await page.goto("/admin/products/create");
    await page.getByLabel("Title", { exact: true }).fill("E2E Product Image");
    await page.getByLabel("Slug (URL)").fill(slug);
    await page.getByLabel("Content (The Product)").fill("E2E image product content");
    await page
      .getByLabel("Upload Image (Optional)")
      .setInputFiles({ name: "product.png", mimeType: "image/png", buffer: png });
    const imageUrlInput = page.getByLabel("Image URL (Optional)");
    await expect(imageUrlInput).toHaveValue(/^\/api\/images\/[a-f0-9]{24}$/);
    const originalUrl = await imageUrlInput.inputValue();
    imageIds.push(new ObjectId(originalUrl.split("/").pop()));
    await expect(page.getByRole("img", { name: "Product image preview" })).toBeVisible();
    await page.getByRole("button", { name: "Create Product", exact: true }).click();
    await expect(page).toHaveURL("/admin/products");

    await client.connect();
    expect(
      await client.db().collection("productImages").findOne({ _id: imageIds[0] })
    ).toHaveProperty("data");
    expect(await client.db().collection("products").findOne({ slug })).toHaveProperty(
      "imageUrl",
      originalUrl
    );
    await page.goto(`/admin/products/${slug}/edit`);
    await expect(imageUrlInput).toHaveValue(originalUrl);
    await page.reload();
    await expect(imageUrlInput).toHaveValue(originalUrl);
    await page
      .getByLabel("Upload Image (Optional)")
      .setInputFiles({ name: "replacement.jpg", mimeType: "image/jpeg", buffer: jpeg });
    await expect(imageUrlInput).not.toHaveValue(originalUrl);
    await expect(page.getByRole("button", { name: "Update Product" })).toBeEnabled();
    const replacementUrl = await imageUrlInput.inputValue();
    imageIds.push(new ObjectId(replacementUrl.split("/").pop()));
    await page.getByRole("button", { name: "Update Product" }).click();
    await expect(page).toHaveURL("/admin/products");
    await page.goto(`/admin/products/${slug}/edit`);
    await expect(imageUrlInput).toHaveValue(replacementUrl);

    for (const url of [originalUrl, replacementUrl]) {
      const image = await publicRequest.get(url);
      expect(image.status()).toBe(200);
      expect(image.headers()["content-type"]).toBe("image/webp");
      expect(await sharp(await image.body()).metadata()).toMatchObject({
        format: "webp",
        width: 100,
        height: 100,
      });
    }

    await page.goto(`/product/${slug}`);
    await expect(page.locator(`img[src*="${imageIds[1].toHexString()}"]`)).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(`img[src*="${imageIds[1].toHexString()}"]`)
          .evaluate((element) => (element as HTMLImageElement).naturalWidth)
      )
      .toBeGreaterThan(0);
  } finally {
    await publicRequest.dispose();
    await client.connect();
    try {
      await client.db().collection("products").deleteOne({ slug });
      await client
        .db()
        .collection("productImages")
        .deleteMany({ _id: { $in: imageIds } });
    } finally {
      await client.close();
    }
  }
});
