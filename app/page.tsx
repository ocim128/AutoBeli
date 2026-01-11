import { getActiveProducts } from "@/lib/products";
import { HomeClient } from "@/components/home/HomeClient";

export const revalidate = 60;

export default async function Home() {
  const productsRaw = await getActiveProducts();
  const products = productsRaw.map((p) => ({
    ...p,
    _id: p._id?.toString() ?? "",
    stockItems: p.stockItems?.map((item) => ({
      ...item,
      orderId: item.orderId?.toString(),
      soldAt: item.soldAt ? new Date(item.soldAt).toISOString() : undefined,
    })),
  }));

  return <HomeClient products={products} />;
}
