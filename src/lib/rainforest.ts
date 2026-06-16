const RAINFOREST_API_URL = "https://api.rainforestapi.com/request";

export type RainforestProduct = {
  asin: string;
  title: string;
  price: number | null;
  ratingsTotal: number | null;
};

type RainforestSearchResponse = {
  search_results?: Array<{
    asin: string;
    title: string;
    price?: { value?: number };
    ratings_total?: number;
  }>;
};

/**
 * Thin client for Rainforest API (https://www.rainforestapi.com/), a
 * ToS-friendly real-time Amazon data provider. Returns only fields the API
 * actually exposes (price, review count from live search results) — it does
 * not provide sales-volume estimates or seller counts, so those remain
 * manually entered to avoid presenting guesses as fact.
 */
export async function searchAmazonProducts(query: string): Promise<RainforestProduct[]> {
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey) {
    throw new Error("RAINFOREST_API_KEY is not configured. Add it in your environment variables.");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "search",
    amazon_domain: "amazon.com",
    search_term: query,
  });

  const res = await fetch(`${RAINFOREST_API_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Rainforest API request failed (${res.status})`);
  }

  const data = (await res.json()) as RainforestSearchResponse;
  const results = data.search_results ?? [];

  return results.map((r) => ({
    asin: r.asin,
    title: r.title,
    price: typeof r.price?.value === "number" ? r.price.value : null,
    ratingsTotal: typeof r.ratings_total === "number" ? r.ratings_total : null,
  }));
}
