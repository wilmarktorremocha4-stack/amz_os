import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { BrandFinderClient } from "./BrandFinderClient";

export const dynamic = "force-dynamic";

export default async function BrandFinderPage() {
  const user = await getCurrentUser();
  const scans = await prisma.brandScan.findMany({
    where: { userId: user.id },
    orderBy: { runAt: "desc" },
    take: 20,
  });

  const hasApify = !!process.env.APIFY_API_KEY;

  return <BrandFinderClient scans={scans as never} hasApify={hasApify} />;
}
