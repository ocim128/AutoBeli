import { NextResponse } from "next/server";
import { getProductImage } from "@/lib/productImages";
import { REGEX_PATTERNS } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/images/{id}:
 *   get:
 *     description: Public product image stored in MongoDB
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[a-f0-9]{24}$' }
 *     responses:
 *       200:
 *         description: Immutable WebP image
 *         content:
 *           image/webp:
 *             schema: { type: string, format: binary }
 *       404:
 *         description: Image not found
 *       500:
 *         description: Image could not be loaded
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!REGEX_PATTERNS.objectId.test(id)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  try {
    const image = await getProductImage(id);
    if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    const data = new Uint8Array(image.data.value());
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": data.byteLength.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Product image read failed:", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
