"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import {
  searchAmazonProducts,
  getProductDetails,
  getOffersSummary,
} from "@/lib/amazon";

export type ScoutProductResult = {
  asin: string;
  title: string;
  price: number | null;
  ratingsTotal: number | null;
  rating: number | null;
  salesRank: number | null;
  categoryName: string | null;
  isBestSeller: boolean;
  sellerCount: number | null;
  lowestPrice: number | null;
  buyBoxIsAmazon: boolean | null;
};

export type ScoutBrandAnalysis = {
  query: string;
  products: ScoutProductResult[];
  avgPrice: number | null;
  avgRating: number | null;
  avgReviews: number | null;
  avgBsr: number | null;
  totalSellers: number | null;
  buyBoxAmazonPct: number | null;
  opportunityScore: number | null;
  scoreBreakdown: {
    label: string;
    score: number | null;
    weight: number;
    insight: string;
  }[];
};

export async function scoutBrand(formData: FormData): Promise<void> {
  const query = String(formData.get("query") ?? "").trim();
  if (!query) return;
  redirect(`/scout?q=${encodeURIComponent(query)}&type=brand`);
}

export async function scoutAsin(formData: FormData): Promise<void> {
  const asin = String(formData.get("asin") ?? "").trim().toUpperCase();
  if (!asin) return;
  redirect(`/scout?q=${encodeURIComponent(asin)}&type=asin`);
}

export async function runBrandScout(query: string): Promise<ScoutBrandAnalysis> {
  // Pull top 10 products for the brand query
  const searchResults = await searchAmazonProducts(query);
  const top = searchResults.slice(0, 10);

  // Enrich up to 5 products with detailed data (API call budget)
  const enriched = await Promise.allSettled(
    top.slice(0, 5).map(async (p) => {
      const [details, offers] = await Promise.allSettled([
        getProductDetails(p.asin),
        getOffersSummary(p.asin),
      ]);
      return {
        asin: p.asin,
        title: p.title,
        price: details.status === "fulfilled" ? details.value?.price ?? p.price : p.price,
        ratingsTotal:
          details.status === "fulfilled"
            ? details.value?.ratingsTotal ?? p.ratingsTotal
            : p.ratingsTotal,
        rating: details.status === "fulfilled" ? details.value?.rating ?? null : null,
        salesRank: details.status === "fulfilled" ? details.value?.salesRank ?? null : null,
        categoryName:
          details.status === "fulfilled" ? details.value?.categoryName ?? null : null,
        isBestSeller:
          details.status === "fulfilled" ? details.value?.isBestSeller ?? false : false,
        sellerCount:
          offers.status === "fulfilled" ? offers.value?.sellerCount ?? null : null,
        lowestPrice:
          offers.status === "fulfilled" ? offers.value?.lowestPrice ?? null : null,
        buyBoxIsAmazon:
          offers.status === "fulfilled" ? offers.value?.buyBoxWinnerIsAmazon ?? null : null,
      } satisfies ScoutProductResult;
    })
  );

  // Pad with basic data for products 6-10 (no API enrichment)
  const unenriched: ScoutProductResult[] = top.slice(5).map((p) => ({
    asin: p.asin,
    title: p.title,
    price: p.price,
    ratingsTotal: p.ratingsTotal,
    rating: null,
    salesRank: null,
    categoryName: null,
    isBestSeller: false,
    sellerCount: null,
    lowestPrice: null,
    buyBoxIsAmazon: null,
  }));

  const products: ScoutProductResult[] = [
    ...enriched
      .filter((r): r is PromiseFulfilledResult<ScoutProductResult> => r.status === "fulfilled")
      .map((r) => r.value),
    ...unenriched,
  ];

  // Aggregate metrics
  const withPrice = products.filter((p) => p.price !== null);
  const withRating = products.filter((p) => p.rating !== null);
  const withReviews = products.filter((p) => p.ratingsTotal !== null);
  const withBsr = products.filter((p) => p.salesRank !== null);
  const withSellers = products.filter((p) => p.sellerCount !== null);
  const withBuyBox = products.filter((p) => p.buyBoxIsAmazon !== null);

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const avgPrice = avg(withPrice.map((p) => p.price!));
  const avgRating = avg(withRating.map((p) => p.rating!));
  const avgReviews = avg(withReviews.map((p) => p.ratingsTotal!));
  const avgBsr = avg(withBsr.map((p) => p.salesRank!));
  const avgSellers = avg(withSellers.map((p) => p.sellerCount!));
  const buyBoxAmazonPct =
    withBuyBox.length > 0
      ? (withBuyBox.filter((p) => p.buyBoxIsAmazon).length / withBuyBox.length) * 100
      : null;

  // Opportunity score
  const scoreBreakdown: ScoutBrandAnalysis["scoreBreakdown"] = [
    {
      label: "Competition (sellers)",
      weight: 0.3,
      score: avgSellers !== null ? Math.max(0, Math.round((1 - avgSellers / 50) * 100)) : null,
      insight:
        avgSellers !== null
          ? avgSellers < 5
            ? "Very few sellers — low competition"
            : avgSellers < 15
              ? "Moderate competition"
              : "High competition — harder to enter"
          : "No seller data",
    },
    {
      label: "Review barrier",
      weight: 0.25,
      score:
        avgReviews !== null
          ? Math.max(0, Math.round((1 - Math.min(avgReviews, 2000) / 2000) * 100))
          : null,
      insight:
        avgReviews !== null
          ? avgReviews < 200
            ? "Low review counts — easy to compete"
            : avgReviews < 1000
              ? "Moderate review barrier"
              : "High reviews — tough to enter"
          : "No review data",
    },
    {
      label: "Price point (margin room)",
      weight: 0.25,
      score:
        avgPrice !== null
          ? Math.round(Math.min(100, (avgPrice / 100) * 100))
          : null,
      insight:
        avgPrice !== null
          ? avgPrice > 30
            ? "Good price point — room for margin"
            : "Low price — tight margins"
          : "No price data",
    },
    {
      label: "Buy box availability",
      weight: 0.2,
      score:
        buyBoxAmazonPct !== null
          ? Math.round(100 - buyBoxAmazonPct)
          : null,
      insight:
        buyBoxAmazonPct !== null
          ? buyBoxAmazonPct < 20
            ? "Amazon rarely wins buy box — 3P sellers dominant"
            : buyBoxAmazonPct < 60
              ? "Mixed — some Amazon presence"
              : "Amazon dominates buy box — harder to win"
          : "No buy box data",
    },
  ];

  const usable = scoreBreakdown.filter((c) => c.score !== null);
  const opportunityScore =
    usable.length === 0
      ? null
      : Math.round(
          usable.reduce((sum, c) => sum + c.score! * c.weight, 0) /
            usable.reduce((sum, c) => sum + c.weight, 0)
        );

  return {
    query,
    products,
    avgPrice,
    avgRating,
    avgReviews,
    avgBsr,
    totalSellers: avgSellers,
    buyBoxAmazonPct,
    opportunityScore,
    scoreBreakdown,
  };
}

export async function saveBrandToCrm(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const avgPriceStr = formData.get("avgPrice");
  const sellerCountStr = formData.get("sellerCount");
  const reviewCountStr = formData.get("reviewCount");

  if (!name) return;

  await prisma.brand.create({
    data: {
      userId: user.id,
      name,
      avgPrice: avgPriceStr ? parseFloat(String(avgPriceStr)) : null,
      sellerCount: sellerCountStr ? parseInt(String(sellerCountStr)) : null,
      reviewCount: reviewCountStr ? parseInt(String(reviewCountStr)) : null,
      notes: `Added from Market Scout on ${new Date().toLocaleDateString()}.`,
    },
  });

  revalidatePath("/research/brands");
  redirect("/research/brands");
}

export async function runAsinScout(asin: string) {
  const [details, offers] = await Promise.all([
    getProductDetails(asin),
    getOffersSummary(asin),
  ]);

  if (!details) return null;

  return {
    ...details,
    sellerCount: offers.sellerCount,
    lowestPrice: offers.lowestPrice,
    buyBoxIsAmazon: offers.buyBoxWinnerIsAmazon,
  };
}
