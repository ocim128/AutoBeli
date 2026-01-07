import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export const metadata = {
  title: "API Documentation",
  description: "AutoBeli API Documentation",
};

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">AutoBeli API Docs</h1>
      <ReactSwagger spec={spec} />
    </div>
  );
}
