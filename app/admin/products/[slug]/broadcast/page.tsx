import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMongoClient } from "@/lib/db";
import { Product } from "@/lib/definitions";
import { getBroadcastRecipientCount, productHasAvailableStock } from "@/lib/broadcast";
import ProductBroadcastPanel from "@/components/admin/ProductBroadcastPanel";

export default async function ProductBroadcastPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { slug } = await params;
  const client = await getMongoClient();
  const db = client.db();
  const product = await db.collection<Product>("products").findOne({ slug });

  if (!product || !product._id) {
    notFound();
  }

  const recipientCount = await getBroadcastRecipientCount(product._id, db);
  const hasAvailableStock = productHasAvailableStock(product);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/products" className="text-indigo-600 hover:underline text-sm">
          Back to Products
        </Link>
        <h1 className="text-3xl font-bold mt-2">Broadcast Product</h1>
        <p className="text-gray-500 mt-1">
          Send a short product announcement to active audience contacts who have not bought this
          product yet.
        </p>
      </div>

      <ProductBroadcastPanel
        product={{
          title: product.title,
          slug: product.slug,
          isActive: product.isActive,
        }}
        recipientCount={recipientCount}
        canLiveSend={product.isActive && hasAvailableStock}
        hasAvailableStock={hasAvailableStock}
      />
    </div>
  );
}
