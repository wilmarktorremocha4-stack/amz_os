const RAINFOREST_API_URL = "https://api.rainforestapi.com/request";

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

type RainforestSearchResponse = {
  search_results?: Array<{
    asin: string;
    title: string;
    price?: { value?: number };
    ratings_total?: number;
  }>;
};

type RainforestProductResponse = {
  product?: {
    asin: string;
    title: string;
    rating?: number;
    ratings_total?: number;
    buybox_winner?: { price?: { value?: number } };
    bestsellers_rank?: number;
    is_bestseller?: boolean;
    categories_flat?: string;
  };
};

type RainforestOffersResponse = {
  offers?: Array<{ price?: { value?: number }; is_buybox_winner?: boolean }>;
  offers_total?: number;
  buybox_winner?: { is_amazon?: boolean };
};

function getApiKey() {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RAINFOREST_API_KEY is not configured. Add it in your environment variables.",
    );
  }
  return apiKey;
}

async function rainforestRequest<T>(
  params: Record<string, string>,
): Promise<T> {
  const search = new URLSearchParams({
    api_key: getApiKey(),
    amazon_domain: "amazon.com",
    ...params,
  });

  const res = await fetch(`${RAINFOREST_API_URL}?${search.toString()}`);
  if (!res.ok) {
    throw new Error(`Rainforest API request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/**
 * Thin client for Rainforest API (https://www.rainforestapi.com/), a
 * ToS-friendly real-time Amazon data provider. Returns only fields the API
 * actually exposes — it does not provide sales-volume estimates, so those
 * remain manually entered to avoid presenting guesses as fact.
 */
export async function searchAmazonProducts(
  query: string,
): Promise<RainforestProduct[]> {
  const data = await rainforestRequest<RainforestSearchResponse>({
    type: "search",
    search_term: query,
  });
  const results = data.search_results ?? [];

  return results.map((r) => ({
    asin: r.asin,
    title: r.title,
    price: typeof r.price?.value === "number" ? r.price.value : null,
    ratingsTotal: typeof r.ratings_total === "number" ? r.ratings_total : null,
  }));
}

/** Detailed product info (rank, rating, category) via type=product. */
export async function getProductDetails(
  asin: string,
): Promise<RainforestProductDetails | null> {
  const data = await rainforestRequest<RainforestProductResponse>({
    type: "product",
    asin,
  });
  const p = data.product;
  if (!p) return null;

  return {
    asin: p.asin,
    title: p.title,
    price:
      typeof p.buybox_winner?.price?.value === "number"
        ? p.buybox_winner.price.value
        : null,
    ratingsTotal: typeof p.ratings_total === "number" ? p.ratings_total : null,
    rating: typeof p.rating === "number" ? p.rating : null,
    salesRank: typeof p.bestsellers_rank === "number" ? p.bestsellers_rank : null,
    categoryName: p.categories_flat ?? null,
    isBestSeller: Boolean(p.is_bestseller),
  };
}

/** Live seller/offer count and buy box info via type=offers. */
export async function getOffersSummary(
  asin: string,
): Promise<RainforestOffersSummary> {
  const data = await rainforestRequest<RainforestOffersResponse>({
    type: "offers",
    asin,
  });
  const offers = data.offers ?? [];
  const prices = offers
    .map((o) => o.price?.value)
    .filter((p): p is number => typeof p === "number");

  return {
    sellerCount:
      typeof data.offers_total === "number" ? data.offers_total : offers.length || null,
    lowestPrice: prices.length ? Math.min(...prices) : null,
    buyBoxWinnerIsAmazon:
      typeof data.buybox_winner?.is_amazon === "boolean"
        ? data.buybox_winner.is_amazon
        : null,
  };
}
