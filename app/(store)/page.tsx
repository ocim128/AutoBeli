import { getActiveProducts, serializeProductForClient } from "@/lib/products";
import { HomeClient } from "@/components/home/HomeClient";

export const revalidate = 60;

export default async function Home() {
  const productsRaw = await getActiveProducts();
  const products = productsRaw.map(serializeProductForClient);

  return <HomeClient products={products} />;
}
