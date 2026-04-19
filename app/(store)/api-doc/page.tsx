import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";
import { ApiDocPageClient } from "./api-doc-client";

export const metadata = {
  title: "API Documentation",
  description: "AutoBeli API Documentation",
};

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <ApiDocPageClient />
      <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
        <ReactSwagger spec={spec} />
      </div>
    </div>
  );
}
