import { Binary, ObjectId } from "mongodb";
import sharp from "sharp";
import { getMongoClient } from "@/lib/db";
import { MAX_PRODUCT_IMAGE_BYTES, productImageUploadSchema, validate } from "@/lib/validation";

interface ProductImage {
  _id: ObjectId;
  data: Binary;
  createdAt: Date;
}

export class ProductImageUploadError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export async function saveProductImage(request: Request): Promise<string> {
  const type = request.headers.get("content-type") || "";
  const validation = validate(productImageUploadSchema.shape.type, type);
  if (!validation.success) throw new ProductImageUploadError(validation.error!);
  if (Number(request.headers.get("content-length")) > MAX_PRODUCT_IMAGE_BYTES) {
    throw new ProductImageUploadError("Image must be 4 MB or smaller", 413);
  }
  if (!request.body) throw new ProductImageUploadError("Image is empty");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PRODUCT_IMAGE_BYTES) {
        await reader.cancel();
        throw new ProductImageUploadError("Image must be 4 MB or smaller", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size === 0) throw new ProductImageUploadError("Image is empty");

  let data: Buffer;
  try {
    const image = sharp(Buffer.concat(chunks), { limitInputPixels: 20_000_000 });
    const metadata = await image.metadata();
    if (`image/${metadata.format}` !== type) {
      throw new Error("Image format does not match content type");
    }
    data = await image
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new ProductImageUploadError(
      "Invalid image. Choose a JPEG, PNG, or WebP image up to 20 megapixels."
    );
  }

  const client = await getMongoClient();
  const _id = new ObjectId();
  await client
    .db()
    .collection<ProductImage>("productImages")
    .insertOne({
      _id,
      data: new Binary(data),
      createdAt: new Date(),
    });
  return `/api/images/${_id.toHexString()}`;
}

export async function getProductImage(id: string) {
  const client = await getMongoClient();
  return client
    .db()
    .collection<ProductImage>("productImages")
    .findOne({ _id: new ObjectId(id) });
}
