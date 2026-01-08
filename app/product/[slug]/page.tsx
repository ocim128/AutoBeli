import { getProductBySlug } from "@/lib/products";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductClient } from "@/components/product/ProductClient";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic metadata for SEO
 * This runs at build/request time and improves search engine indexing
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found - AutoBeli",
    };
  }

  const description =
    product.description ||
    `Purchase ${product.title} - Premium digital content with instant delivery.`;

  return {
    title: `${product.title} - AutoBeli`,
    description: description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: description.slice(0, 160),
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const serializedProduct = {
    ...product,
    _id: product._id?.toString() ?? "",
  };

  return <ProductClient product={serializedProduct} />;
}
