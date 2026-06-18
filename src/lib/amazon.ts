// Apify-based Amazon data provider — replaces rainforest.ts

const APIFY_BASE = "https://api.apify.com/v2";

export type RainforestProduct = {
  asin: string;
  title: string;
  price: number | null;
  ratingsTotal: number | null;
};

export type RainforestProductDetails = {
  asin: string;
  title: string;
  price: number | null;
  ratingsTotal: number | null;
  rating: number | null;
  salesRank: number | null;
  categoryName: string | null;
  isBestSeller: boolean;
};

export type RainforestOffersSummary = {
  sellerCount: number | null;
  lowestPrice: number | null;
  buyBoxWinnerIsAmazon: boolean | null;
};

type ApifyItem = {
  asin?: string;
  title?: string;
  productTitle?: string;
  price?: number | string | null;
  stars?: number | null;
  reviewsCount?: number | null;
  salesRank?: number | null;
  categoryName?: string | null;
  isBestSeller?: boolean;
  sellersCount?: number | null;
  buyboxWinner?: { isAmazon?: boolean } | null;
  thumbnailImage?: string;
  url?: string;
};

function getApiKey() {
  const key = process.env.APIFY_API_KEY;
  if (!key) throw new Error("APIFY_API_KEY is not configured. Add it to your environment variables.");
  return key;
}

async function runApifyActor(actorId: string, input: Record<string, unknown>): Promise<ApifyItem[]> {
  const key = getApiKey();
  const res = await fetch(
    `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${key}&timeout=90`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify actor ${actorId} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as ApifyItem[];
}

function parsePrice(val: number | string | null | undefined): number | null {
  if (val == null) return null;
  const n = typeof val === "string" ? parseFloat(val.replace(/[^0-9.]/g, "")) : val;
  return isNaN(n) ? null : n;
}

export async function searchAmazonProducts(query: string): Promise<RainforestProduct[]> {
  const items = await runApifyActor("apify~amazon-product-scraper", {
    keywords: [query],
    maxItemsPerStartUrl: 15,
    proxyConfiguration: { useApifyProxy: true },
  });

  return items.map((item) => ({
    asin: item.asin ?? "",
    title: item.title ?? item.productTitle ?? "",
    price: parsePrice(item.price),
    ratingsTotal: typeof item.reviewsCount === "number" ? item.reviewsCount : null,
  })).filter((p) => p.asin);
}

export async function getProductDetails(asin: string): Promise<RainforestProductDetails | null> {
  const items = await runApifyActor("apify~amazon-product-scraper", {
    asins: [asin],
    proxyConfiguration: { useApifyProxy: true },
  });
  const item = items[0];
  if (!item) return null;

  return {
    asin: item.asin ?? asin,
    title: item.title ?? item.productTitle ?? "",
    price: parsePrice(item.price),
    ratingsTotal: typeof item.reviewsCount === "number" ? item.reviewsCount : null,
    rating: typeof item.stars === "number" ? item.stars : null,
    salesRank: typeof item.salesRank === "number" ? item.salesRank : null,
    categoryName: item.categoryName ?? null,
    isBestSeller: Boolean(item.isBestSeller),
  };
}

export async function getOffersSummary(asin: string): Promise<RainforestOffersSummary> {
  const items = await runApifyActor("apify~amazon-product-scraper", {
    asins: [asin],
    proxyConfiguration: { useApifyProxy: true },
  });
  const item = items[0];

  return {
    sellerCount: item ? (typeof item.sellersCount === "number" ? item.sellersCount : null) : null,
    lowestPrice: item ? parsePrice(item.price) : null,
    buyBoxWinnerIsAmazon: item?.buyboxWinner?.isAmazon ?? null,
  };
}
