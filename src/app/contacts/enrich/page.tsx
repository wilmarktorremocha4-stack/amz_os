import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { EnrichClient } from "./EnrichClient";

export const dynamic = "force-dynamic";

export default async function EnrichPage() {
  const user = await getCurrentUser();
  const suppliers = await prisma.supplier.findMany({
    where: { userId: user.id, archived: false },
    include: { enrichment: true },
    orderBy: { companyName: "asc" },
  });

  return <EnrichClient suppliers={suppliers as never} />;
}
