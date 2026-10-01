import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ProductImageUploadError, saveProductImage } from "@/lib/productImages";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/admin/products/image:
 *   post:
 *     description: Permanently upload a product image (admin session required). Send raw image bytes, up to 4 MB and 20 megapixels. Returns a public image URL.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         image/jpeg:
 *           schema: { type: string, format: binary }
 *         image/png:
 *           schema: { type: string, format: binary }
 *         image/webp:
 *           schema: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Image stored permanently in MongoDB
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl: { type: string }
 *       400:
 *         description: Empty, invalid, or unsupported image
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: Image exceeds 4 MB
 *       500:
 *         description: Image could not be stored
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const imageUrl = await saveProductImage(request);
    return NextResponse.json({ imageUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductImageUploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Product image upload failed:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
