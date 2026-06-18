"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { runAmazonBrandSearch } from "@/lib/apify";

export async function startBrandScan(formData: FormData) {
  const user = await getCurrentUser();
  const query = String(formData.get("query") ?? "").trim();
  if (!query) return { error: "Enter a brand or keyword to search." };

  if (!process.env.APIFY_API_KEY) {
    return { error: "APIFY_API_KEY is not configured. Add it to your environment variables." };
  }

  const scan = await prisma.brandScan.create({
    data: { userId: user.id, query, status: "running" },
  });

  try {
    const results = await runAmazonBrandSearch(query);
    await prisma.brandScan.update({
      where: { id: scan.id },
      data: { status: "complete", results: results as never, completedAt: new Date() },
    });
  } catch (err) {
    await prisma.brandScan.update({
      where: { id: scan.id },
      data: { status: "error", completedAt: new Date() },
    });
    return { error: err instanceof Error ? err.message : "Scan failed." };
  }

  revalidatePath("/brands/finder");
  return { scanId: scan.id };
}

export async function getBrandScans() {
  const user = await getCurrentUser();
  return prisma.brandScan.findMany({
    where: { userId: user.id },
    orderBy: { runAt: "desc" },
    take: 20,
  });
}

export async function saveBrandFromScan(data: {
  name: string;
  category?: string;
  website?: string;
  estimatedMonthlySales?: number;
  sellerCount?: number;
  avgPrice?: number;
}) {
  const user = await getCurrentUser();
  await prisma.brand.create({
    data: {
      userId: user.id,
      name: data.name,
      category: data.category,
      estimatedMonthlySales: data.estimatedMonthlySales,
      sellerCount: data.sellerCount,
      avgPrice: data.avgPrice,
    },
  });
  revalidatePath("/research/brands");
  revalidatePath("/brands/finder");
}

export async function deleteBrandScan(scanId: string) {
  const user = await getCurrentUser();
  await prisma.brandScan.delete({ where: { id: scanId, userId: user.id } });
  revalidatePath("/brands/finder");
}
