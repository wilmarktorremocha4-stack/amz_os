"use client";

import { useState, useTransition } from "react";
import { Search, Plus, Trash2, ExternalLink, AlertCircle, Loader2, CheckCircle2, Store, Package } from "lucide-react";
import { startBrandScan, deleteBrandScan, saveBrandFromScan } from "@/lib/actions/brand-finder";

type ScanResult = {
  brandName: string; storeName?: string; storeUrl?: string; asin?: string;
  productTitle?: string; price?: number; category?: string; reviewCount?: number; rating?: number;
};
type Scan = { id: string; query: string; status: string; results: ScanResult[] | null; runAt: string | Date };

export function BrandFinderClient({ scans: initial, hasApify }: { scans: Scan[]; hasApify: boolean }) {
  const scans = initial;
  const [selected, setSelected] = useState<Scan | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      const res = await startBrandScan(fd);
      if ("error" in res) { setError(res.error ?? "Unknown error"); return; }
      (e.target as HTMLFormElement).reset();
      // Reload happens via revalidatePath — placeholder until then
    });
  }

  function handleSave(result: ScanResult, _scanQuery: string) {
    const key = result.brandName + result.asin;
    startTransition(async () => {
      await saveBrandFromScan({
        name: result.brandName,
        category: result.category,
        avgPrice: result.price,
        sellerCount: undefined,
      });
      setSaved((prev) => new Set([...prev, key]));
    });
  }

  // Group results by brand
  function groupByBrand(results: ScanResult[]) {
    const map = new Map<string, ScanResult[]>();
    for (const r of results) {
      const brand = r.brandName || r.storeName || "Unknown";
      if (!map.has(brand)) map.set(brand, []);
      map.get(brand)!.push(r);
    }
    return [...map.entries()].map(([name, items]) => ({
      name, items,
      category: items[0]?.category,
      avgPrice: items.filter((i) => i.price).reduce((s, i) => s + (i.price ?? 0), 0) / (items.filter((i) => i.price).length || 1),
      storeUrl: items[0]?.storeUrl,
      reviewCount: items[0]?.reviewCount,
    }));
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Brand Finder</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Search Amazon for brands to add to your sourcing pipeline.</p>
      </div>

      {!hasApify && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong>APIFY_API_KEY not configured.</strong> Add it to your Netlify environment variables to enable live Amazon brand search.
            Sign up at <a href="https://apify.com" target="_blank" rel="noopener noreferrer" className="underline">apify.com</a> (free tier available).
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="card flex items-center gap-3 p-4">
        <Search size={18} className="shrink-0 text-[var(--muted)]" />
        <input name="query" required placeholder="Search brand, keyword, or product category (e.g. 'kitchen gadgets', 'fitness brand')"
          className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]" />
        <button type="submit" disabled={pending || !hasApify}
          className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {pending ? "Scanning…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Scan history + results */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* History sidebar */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Recent Scans</p>
          {scans.length === 0 && <p className="text-sm text-[var(--muted)]">No scans yet.</p>}
          {scans.map((scan) => (
            <button key={scan.id} onClick={() => setSelected(scan)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${selected?.id === scan.id ? "border-blue-500 bg-blue-50" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]"}`}>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--foreground)]">{scan.query}</div>
                <div className="text-xs text-[var(--muted)]">{new Date(scan.runAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  scan.status === "complete" ? "bg-emerald-100 text-emerald-700" :
                  scan.status === "error" ? "bg-red-100 text-red-600" :
                  "bg-blue-100 text-blue-600"
                }`}>{scan.status}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); startTransition(() => deleteBrandScan(scan.id)); }}
                  className="text-red-400 hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            </button>
          ))}
        </div>

        {/* Results panel */}
        <div>
          {!selected && (
            <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] text-sm text-[var(--muted)]">
              Run a search or select a scan to see results
            </div>
          )}
          {selected?.status === "running" && (
            <div className="flex h-48 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)]">
              <Loader2 size={16} className="animate-spin" /> Scanning Amazon… this may take up to 60 seconds.
            </div>
          )}
          {selected?.status === "error" && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle size={14} /> Scan failed. Check your Apify API key and try again.
            </div>
          )}
          {selected?.status === "complete" && selected.results && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[var(--muted)]">{groupByBrand(selected.results).length} brands found for "{selected.query}"</p>
              {groupByBrand(selected.results).map((brand) => {
                const key = brand.name + brand.items[0]?.asin;
                const isSaved = saved.has(key);
                return (
                  <div key={brand.name} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Store size={15} className="text-[var(--muted)]" />
                          <span className="font-semibold text-[var(--foreground)]">{brand.name}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                          {brand.category && <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5">{brand.category}</span>}
                          {brand.avgPrice > 0 && <span>Avg price: ${brand.avgPrice.toFixed(2)}</span>}
                          <span className="flex items-center gap-1"><Package size={10} />{brand.items.length} products</span>
                          {brand.reviewCount && <span>★ {brand.reviewCount.toLocaleString()} reviews</span>}
                        </div>
                        {brand.storeUrl && (
                          <a href={brand.storeUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1 text-xs text-blue-500 hover:underline">
                            <ExternalLink size={10} /> View Amazon store
                          </a>
                        )}
                      </div>
                      <button type="button" disabled={isSaved || pending} onClick={() => handleSave(brand.items[0], selected?.query ?? "")}
                        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${isSaved ? "bg-emerald-100 text-emerald-700" : "bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"}`}>
                        {isSaved ? <><CheckCircle2 size={12} /> Saved</> : <><Plus size={12} /> Add to CRM</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
