import { Search, TrendingUp, Users, Star, BarChart3, ShoppingCart, Trophy, AlertCircle, CheckCircle2 } from "lucide-react";
import { runBrandScout, runAsinScout, scoutBrand, scoutAsin, saveBrandToCrm } from "@/lib/actions/scout";

export const dynamic = "force-dynamic";

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-[var(--muted)]">No data</span>;
  const color =
    score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-[var(--accent-soft)]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-7 text-right text-xs font-semibold tabular-nums text-[var(--foreground)]">
        {score}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <Icon size={13} />
        {label}
      </div>
      <div className="text-xl font-bold text-[var(--foreground)]">{value}</div>
      {sub && <div className="text-[11px] text-[var(--muted)]">{sub}</div>}
    </div>
  );
}

export default async function ScoutPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; error?: string }>;
}) {
  const { q, type, error } = await searchParams;
  const query = (q ?? "").trim();
  const searchType = type === "asin" ? "asin" : "brand";

  let brandResult = null;
  let asinResult = null;
  let fetchError: string | null = error ?? null;

  if (query) {
    try {
      if (searchType === "asin") {
        asinResult = await runAsinScout(query);
      } else {
        brandResult = await runBrandScout(query);
      }
    } catch (err) {
      fetchError =
        err instanceof Error ? err.message : "Failed to fetch Amazon data.";
    }
  }

  const scoreColor = (s: number | null) =>
    s === null ? "text-[var(--muted)]" : s >= 70 ? "text-emerald-500" : s >= 45 ? "text-yellow-500" : "text-red-500";

  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg">
            <Search size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Market Scout
          </h1>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            Live Amazon Data
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Real-time brand and ASIN intelligence — seller counts, BSR, buy box analysis, and opportunity scoring. No SmartScout subscription needed.
        </p>
      </div>

      {/* Search forms */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Brand Search */}
        <form
          action={scoutBrand}
          className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <TrendingUp size={15} className="text-blue-500" />
            Brand Scout
          </div>
          <p className="text-xs text-[var(--muted)]">
            Enter a brand name to analyze market opportunity — seller competition, review barriers, buy box dominance.
          </p>
          <div className="flex gap-2">
            <input
              name="query"
              defaultValue={searchType === "brand" ? query : ""}
              placeholder='e.g. "Stanley", "Hydro Flask", "YETI"'
              required
              className="input flex-1"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              Scout Brand
            </button>
          </div>
        </form>

        {/* ASIN Deep Dive */}
        <form
          action={scoutAsin}
          className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <BarChart3 size={15} className="text-violet-500" />
            ASIN Deep Dive
          </div>
          <p className="text-xs text-[var(--muted)]">
            Enter any ASIN for a complete product breakdown — BSR, rating, seller count, buy box, and price history.
          </p>
          <div className="flex gap-2">
            <input
              name="asin"
              defaultValue={searchType === "asin" ? query : ""}
              placeholder="e.g. B073JYC4XM"
              required
              className="input flex-1 font-mono"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              Deep Dive
            </button>
          </div>
        </form>
      </div>

      {fetchError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong>Lookup failed:</strong> {fetchError}
            <div className="mt-1 text-xs opacity-80">
              Requires RAINFOREST_API_KEY in your environment variables. Make sure it&apos;s set in Netlify.
            </div>
          </div>
        </div>
      )}

      {/* Brand Analysis Results */}
      {brandResult && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Brand Analysis: &ldquo;{brandResult.query}&rdquo;
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Based on top {brandResult.products.length} Amazon results
              </p>
            </div>
            {/* Save to CRM */}
            <form action={saveBrandToCrm}>
              <input type="hidden" name="name" value={brandResult.query} />
              <input type="hidden" name="avgPrice" value={brandResult.avgPrice ?? ""} />
              <input type="hidden" name="sellerCount" value={Math.round(brandResult.totalSellers ?? 0)} />
              <input type="hidden" name="reviewCount" value={Math.round(brandResult.avgReviews ?? 0)} />
              <button type="submit" className="btn-secondary whitespace-nowrap">
                + Save to Brand Research
              </button>
            </form>
          </div>

          {/* Opportunity Score */}
          <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--accent-soft)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-[var(--muted)]">Opportunity Score</div>
                <div className={`mt-1 text-5xl font-bold tabular-nums ${scoreColor(brandResult.opportunityScore)}`}>
                  {brandResult.opportunityScore ?? "—"}
                  <span className="text-2xl font-normal text-[var(--muted)]">/100</span>
                </div>
                <div className="mt-2 text-sm text-[var(--muted)]">
                  {brandResult.opportunityScore === null
                    ? "Insufficient data for scoring"
                    : brandResult.opportunityScore >= 70
                      ? "Strong opportunity — low competition, good margins"
                      : brandResult.opportunityScore >= 45
                        ? "Moderate opportunity — worth deeper analysis"
                        : "Tough market — high competition or low margins"}
                </div>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="flex flex-col gap-3">
                  {brandResult.scoreBreakdown.map((c) => (
                    <div key={c.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-[var(--muted)]">{c.label}</span>
                      </div>
                      <ScoreBar score={c.score} />
                      <div className="mt-0.5 text-[10px] text-[var(--muted)]">{c.insight}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Aggregate Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Avg. Price"
              value={brandResult.avgPrice ? `$${brandResult.avgPrice.toFixed(2)}` : "—"}
              icon={ShoppingCart}
              sub="Across top products"
            />
            <StatCard
              label="Avg. Rating"
              value={brandResult.avgRating ? `${brandResult.avgRating.toFixed(1)} ★` : "—"}
              icon={Star}
              sub="Customer satisfaction"
            />
            <StatCard
              label="Avg. Reviews"
              value={brandResult.avgReviews ? Math.round(brandResult.avgReviews).toLocaleString() : "—"}
              icon={Users}
              sub="Review barrier to entry"
            />
            <StatCard
              label="Avg. Sellers"
              value={brandResult.totalSellers ? Math.round(brandResult.totalSellers).toString() : "—"}
              icon={Users}
              sub="Per product listing"
            />
            <StatCard
              label="Amazon Buy Box"
              value={brandResult.buyBoxAmazonPct !== null ? `${Math.round(brandResult.buyBoxAmazonPct)}%` : "—"}
              icon={Trophy}
              sub="Amazon wins buy box"
            />
          </div>

          {/* Product Table */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Top Products Found
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--accent-soft)] text-left text-xs text-[var(--muted)]">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Reviews</th>
                    <th className="p-3 text-right">BSR</th>
                    <th className="p-3 text-right">Sellers</th>
                    <th className="p-3 text-center">Buy Box</th>
                  </tr>
                </thead>
                <tbody>
                  {brandResult.products.map((p) => (
                    <tr key={p.asin} className="border-t border-[var(--border)]">
                      <td className="p-3">
                        <a
                          href={`https://www.amazon.com/dp/${p.asin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="line-clamp-2 font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                        >
                          {p.title}
                        </a>
                        <div className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">
                          {p.asin}
                          {p.isBestSeller && (
                            <span className="ml-2 rounded bg-orange-100 px-1 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                              Best Seller
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums text-[var(--foreground)]">
                        {p.price ? `$${p.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="p-3 text-right tabular-nums text-[var(--muted)]">
                        {p.ratingsTotal ? p.ratingsTotal.toLocaleString() : "—"}
                      </td>
                      <td className="p-3 text-right tabular-nums text-[var(--muted)]">
                        {p.salesRank ? `#${p.salesRank.toLocaleString()}` : "—"}
                      </td>
                      <td className="p-3 text-right tabular-nums text-[var(--muted)]">
                        {p.sellerCount ?? "—"}
                      </td>
                      <td className="p-3 text-center">
                        {p.buyBoxIsAmazon === null ? (
                          <span className="text-[var(--muted)]">—</span>
                        ) : p.buyBoxIsAmazon ? (
                          <span className="text-xs text-orange-600 dark:text-orange-400">Amazon</span>
                        ) : (
                          <span className="flex items-center justify-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={11} />
                            3P Seller
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ASIN Deep Dive Results */}
      {asinResult && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                ASIN: {query}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--muted)] line-clamp-1">
                {asinResult.title}
              </p>
            </div>
            <a
              href={`https://www.amazon.com/dp/${query}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary whitespace-nowrap"
            >
              View on Amazon ↗
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Buy Box Price"
              value={asinResult.price ? `$${asinResult.price.toFixed(2)}` : "—"}
              icon={ShoppingCart}
            />
            <StatCard
              label="Rating"
              value={asinResult.rating ? `${asinResult.rating} ★` : "—"}
              icon={Star}
            />
            <StatCard
              label="Reviews"
              value={asinResult.ratingsTotal ? asinResult.ratingsTotal.toLocaleString() : "—"}
              icon={Users}
            />
            <StatCard
              label="BSR"
              value={asinResult.salesRank ? `#${asinResult.salesRank.toLocaleString()}` : "—"}
              icon={TrendingUp}
              sub={asinResult.categoryName ?? undefined}
            />
            <StatCard
              label="Sellers"
              value={asinResult.sellerCount?.toString() ?? "—"}
              icon={Users}
            />
            <StatCard
              label="Buy Box Winner"
              value={
                asinResult.buyBoxIsAmazon === null
                  ? "—"
                  : asinResult.buyBoxIsAmazon
                    ? "Amazon"
                    : "3P Seller"
              }
              icon={Trophy}
              sub={
                asinResult.buyBoxIsAmazon === false
                  ? "✓ 3P sellers can compete"
                  : asinResult.buyBoxIsAmazon === true
                    ? "Amazon holds buy box"
                    : undefined
              }
            />
          </div>

          {asinResult.categoryName && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
              <span className="font-medium text-[var(--muted)]">Category: </span>
              <span className="text-[var(--foreground)]">{asinResult.categoryName}</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!query && !fetchError && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20">
            <Search size={28} className="text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              Your personal SmartScout
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Search any brand or ASIN to get live Amazon intelligence — seller competition, buy box analysis, BSR, and a proprietary opportunity score.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] px-3 py-1">🏆 Opportunity Scoring</span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1">📦 Seller Count</span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1">🛒 Buy Box Analysis</span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1">📊 BSR Tracking</span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1">💰 Price Intelligence</span>
          </div>
        </div>
      )}
    </main>
  );
}
