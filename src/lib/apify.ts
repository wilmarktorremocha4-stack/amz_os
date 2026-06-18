const APIFY_BASE = "https://api.apify.com/v2";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.APIFY_API_KEY ?? ""}`,
  };
}

export interface ApifyBrandResult {
  brandName: string;
  storeName?: string;
  storeUrl?: string;
  asin?: string;
  productTitle?: string;
  price?: number;
  category?: string;
  seller?: string;
  reviewCount?: number;
  rating?: number;
  bsr?: number;
  imageUrl?: string;
}

export async function runAmazonBrandSearch(query: string): Promise<ApifyBrandResult[]> {
  if (!process.env.APIFY_API_KEY) {
    throw new Error("APIFY_API_KEY is not configured.");
  }

  // Start Apify actor run (Amazon Product Scraper)
  const runRes = await fetch(
    `${APIFY_BASE}/acts/apify~amazon-product-scraper/runs`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        keywords: [query],
        maxResultsPerQuery: 24,
        scrapeProductDetails: false,
        country: "US",
      }),
    }
  );

  if (!runRes.ok) throw new Error(`Apify start failed: ${runRes.status}`);
  const run = await runRes.json();
  const runId: string = run.data?.id;
  if (!runId) throw new Error("No run ID from Apify.");

  // Poll for completion (max 90s)
  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(`${APIFY_BASE}/acts/apify~amazon-product-scraper/runs/${runId}`, { headers: headers() });
    const status = await statusRes.json();
    if (status.data?.status === "SUCCEEDED") break;
    if (status.data?.status === "FAILED") throw new Error("Apify run failed.");
  }

  // Fetch results
  const dataRes = await fetch(
    `${APIFY_BASE}/acts/apify~amazon-product-scraper/runs/${runId}/dataset/items`,
    { headers: headers() }
  );
  const items = await dataRes.json();

  return (items as Record<string, unknown>[]).map((item) => ({
    brandName: String(item.brand ?? item.seller ?? query),
    storeName: item.seller ? String(item.seller) : undefined,
    storeUrl: item.sellerUrl ? String(item.sellerUrl) : undefined,
    asin: item.asin ? String(item.asin) : undefined,
    productTitle: item.title ? String(item.title) : undefined,
    price: item.price ? Number(item.price) : undefined,
    category: item.category ? String(item.category) : undefined,
    seller: item.seller ? String(item.seller) : undefined,
    reviewCount: item.reviewsCount ? Number(item.reviewsCount) : undefined,
    rating: item.stars ? Number(item.stars) : undefined,
    bsr: item.bestSellersRank ? Number(item.bestSellersRank) : undefined,
    imageUrl: item.thumbnailImage ? String(item.thumbnailImage) : undefined,
  }));
}
