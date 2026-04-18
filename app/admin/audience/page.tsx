import { getSession } from "@/lib/auth";
import AudienceManager from "@/components/admin/AudienceManager";
import { redirect } from "next/navigation";

export default async function AdminAudiencePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return <AudienceManager />;
}
