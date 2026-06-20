"use client";

import { useState, useMemo } from "react";
import { Search, Info, AlertCircle } from "lucide-react";
import { calculateFbaFees, AMAZON_CATEGORIES } from "@/lib/amazonFees";
import { CalculatorHistory } from "@/components/calculators/CalculatorHistory";

const CATEGORY_OPTIONS = Object.entries(AMAZON_CATEGORIES).map(([key, val]) => ({
  key,
  label: val.label,
}));

function fmt$(n: number) {
  return `$${n.toFixed(2)}`;
}

function fmtLb(n: number) {
  return `${n.toFixed(3)} lb`;
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

export default function AsinLookupPage() {
  const [asin, setAsin] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "not_configured" | "error">("idle");
  const [lookupMsg, setLookupMsg] = useState("");

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState("home");
  const [lengthIn, setLengthIn] = useState("");
  const [widthIn, setWidthIn] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLb, setWeightLb] = useState("");

  async function handleLookup() {
    const trimmed = asin.trim().toUpperCase();
    if (!trimmed || !/^[A-Z0-9]{10}$/.test(trimmed)) {
      setLookupStatus("error");
      setLookupMsg("ASIN must be exactly 10 alphanumeric characters.");
      return;
    }
    setLookupStatus("loading");
    setLookupMsg("");
    try {
      const res = await fetch(`/api/asin-lookup?asin=${trimmed}`);
      const data = await res.json();
      if (!data.configured) {
        setLookupStatus("not_configured");
        setLookupMsg(data.message);
        return;
      }
      if (data.error) {
        setLookupStatus("error");
        setLookupMsg(data.error);
        return;
      }
      setTitle(data.title ?? "");
      if (data.price) setPrice(String(data.price));
      setLookupStatus("found");
      setLookupMsg(`Found: ${data.title}`);
    } catch {
      setLookupStatus("error");
      setLookupMsg("Network error — please try again.");
    }
  }

  const result = useMemo(() => {
    const p = parseFloat(price);
    const l = parseFloat(lengthIn);
    const w = parseFloat(widthIn);
    const h = parseFloat(heightIn);
    const wt = parseFloat(weightLb);
    const c = parseFloat(cost) || 0;

    if (!p || !l || !w || !h || !wt) return null;

    return calculateFbaFees({ price: p, lengthIn: l, widthIn: w, heightIn: h, weightLb: wt, category }, c);
  }, [price, lengthIn, widthIn, heightIn, weightLb, category, cost]);

  const inputs = { asin, price, cost, category, lengthIn, widthIn, heightIn, weightLb };

  function onLoad(loaded: Record<string, string>) {
    setAsin(loaded.asin ?? "");
    setPrice(loaded.price ?? "");
    setCost(loaded.cost ?? "");
    setCategory(loaded.category ?? "home");
    setLengthIn(loaded.lengthIn ?? "");
    setWidthIn(loaded.widthIn ?? "");
    setHeightIn(loaded.heightIn ?? "");
    setWeightLb(loaded.weightLb ?? "");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">ASIN FBA Calculator</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Calculate real Amazon FBA fees using Amazon&apos;s published 2025 fee schedule. Enter product dimensions, weight, and sale price.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: inputs */}
        <div className="flex flex-col gap-4">
          {/* ASIN lookup */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">ASIN Lookup</h2>
            <div className="flex gap-2">
              <input
                value={asin}
                onChange={(e) => setAsin(e.target.value.toUpperCase())}
                placeholder="e.g. B08N5WRWNW"
                maxLength={10}
                className="input flex-1 font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
              <button
                onClick={handleLookup}
                disabled={lookupStatus === "loading"}
                className="btn-primary shrink-0 disabled:opacity-60"
              >
                <Search size={14} />
                {lookupStatus === "loading" ? "Looking up…" : "Look up"}
              </button>
            </div>

            {lookupStatus === "not_configured" && (
              <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>{lookupMsg} Enter product details manually below.</span>
              </div>
            )}
            {lookupStatus === "found" && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                ✓ {lookupMsg} — verify dimensions and weight below (PA-API does not return physical dimensions).
              </div>
            )}
            {lookupStatus === "error" && (
              <div className="mt-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {lookupMsg}
              </div>
            )}
          </div>

          {/* Product details */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Product Details</h2>
            <div className="flex flex-col gap-3">
              {title && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--muted)]">Product title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">Sale price ($)</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="e.g. 29.99" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">Your cost / COGS ($) <span className="font-normal">(optional — for ROI/margin)</span></label>
                <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="input" placeholder="e.g. 12.00" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">Amazon category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input bg-[var(--surface)]">
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dimensions & weight */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">Dimensions & Weight</h2>
            <p className="mb-4 text-xs text-[var(--muted)]">
              Find these on the product detail page under &quot;Product information&quot; or on your prep center report. Used to determine the FBA size tier.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">Length (in)</label>
                <input type="number" step="0.01" value={lengthIn} onChange={(e) => setLengthIn(e.target.value)} className="input" placeholder="e.g. 10.5" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">Width (in)</label>
                <input type="number" step="0.01" value={widthIn} onChange={(e) => setWidthIn(e.target.value)} className="input" placeholder="e.g. 7.0" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">Height (in)</label>
                <input type="number" step="0.01" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} className="input" placeholder="e.g. 2.5" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--muted)]">Unit weight (lb)</label>
                <input type="number" step="0.001" value={weightLb} onChange={(e) => setWeightLb(e.target.value)} className="input" placeholder="e.g. 1.25" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: results + history */}
        <div className="flex flex-col gap-4">
          {/* Fee breakdown */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">FBA Fee Breakdown</h2>
            {!result ? (
              <p className="text-sm text-[var(--muted)]">Enter sale price, dimensions, and weight to see fees.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium text-[var(--foreground)]">
                  Size tier: <span className="text-[var(--accent)]">{result.sizeTierLabel}</span>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Dimensional weight: {fmtLb(result.dimensionalWeightLb)} &nbsp;·&nbsp; Billable weight: {fmtLb(result.billableWeightLb)}
                </div>
                <div className="flex flex-col divide-y divide-[var(--border)]">
                  {[
                    { label: "FBA Fulfillment Fee", value: fmt$(result.fulfillmentFee) },
                    { label: `Referral Fee (${fmtPct(result.referralFeeRate * 100)})`, value: fmt$(result.referralFee) },
                    { label: "Total Amazon Fees", value: fmt$(result.totalFees), bold: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2">
                      <span className={`text-sm ${row.bold ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]"}`}>{row.label}</span>
                      <span className={`text-sm font-semibold ${row.bold ? "text-red-500" : "text-[var(--foreground)]"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-1 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">Profitability</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Sale price</span>
                      <span className="font-medium text-[var(--foreground)]">{fmt$(parseFloat(price) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">− Amazon fees</span>
                      <span className="font-medium text-red-500">−{fmt$(result.totalFees)}</span>
                    </div>
                    {parseFloat(cost) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted)]">− COGS</span>
                        <span className="font-medium text-red-500">−{fmt$(parseFloat(cost))}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-[var(--border)] pt-2 text-sm font-semibold">
                      <span className="text-[var(--foreground)]">Net profit</span>
                      <span className={result.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}>{fmt$(result.netProfit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Margin</span>
                      <span className={`font-medium ${result.margin >= 15 ? "text-emerald-600" : result.margin >= 0 ? "text-amber-500" : "text-red-500"}`}>{fmtPct(result.margin)}</span>
                    </div>
                    {parseFloat(cost) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted)]">ROI</span>
                        <span className={`font-medium ${result.roi >= 30 ? "text-emerald-600" : result.roi >= 0 ? "text-amber-500" : "text-red-500"}`}>{fmtPct(result.roi)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                  Fees based on Amazon&apos;s published 2025 US FBA fee schedule (effective Jan 15, 2025). Actual fees may vary for apparel, hazmat, or items subject to FBA capacity surcharges. Always verify in Seller Central fee preview.
                </p>
              </div>
            )}
          </div>

          <CalculatorHistory
            type="ROI"
            inputs={inputs}
            result={(result ?? {}) as Record<string, unknown>}
            onLoad={onLoad}
          />
        </div>
      </div>
    </div>
  );
}
