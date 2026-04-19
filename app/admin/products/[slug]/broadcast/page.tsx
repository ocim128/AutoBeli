import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMongoClient } from "@/lib/db";
import { Product } from "@/lib/definitions";
import { getBroadcastRecipientCount, productHasAvailableStock } from "@/lib/broadcast";
import ProductBroadcastPanel from "@/components/admin/ProductBroadcastPanel";
import { PageHeader } from "@/components/ui/page-header";

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
        <Link
          href="/admin/products"
          className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--accent)] hover:underline"
        >
          Back to Products
        </Link>
        <PageHeader
          eyebrow="BROADCAST"
          title="Broadcast Product"
          description="Send a short product announcement to active audience contacts who have not bought this product yet."
        />
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
