"use client";

import { useMemo, useState } from "react";
import { CalculatorLayout, Field, ResultRow, StatusBanner, StatusTier } from "@/components/calculators/CalcUI";

export default function MarginCalculatorPage() {
  const [cost, setCost] = useState("10");
  const [sellPrice, setSellPrice] = useState("20");

  const result = useMemo(() => {
    const costNum = parseFloat(cost) || 0;
    const sellNum = parseFloat(sellPrice) || 0;

    const profit = sellNum - costNum;
    const margin = sellNum > 0 ? (profit / sellNum) * 100 : 0;
    const markup = costNum > 0 ? (profit / costNum) * 100 : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    if (profit <= 0) {
      tier = "bad";
      tips.push("Selling below cost. Raise the price or source the product cheaper.");
    } else if (margin < 20) {
      tier = "warn";
      tips.push("Margin under 20% is tight once Amazon fees and shipping are layered on — run this through the ROI calculator with real fees before committing.");
    } else {
      tips.push("Solid gross margin before fees — confirm it still holds up after Amazon referral/FBA fees.");
    }

    return { profit, margin, markup, tier, tips };
  }, [cost, sellPrice]);

  return (
    <CalculatorLayout
      title="Margin Calculator"
      description="Quick gross margin and markup check before fees and shipping."
      inputs={
        <>
          <Field label="Unit cost ($)" value={cost} onChange={setCost} />
          <Field label="Sell price ($)" value={sellPrice} onChange={setSellPrice} />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <ResultRow label="Gross profit" value={`$${result.profit.toFixed(2)}`} />
            <ResultRow label="Margin" value={`${result.margin.toFixed(1)}%`} highlight />
            <ResultRow label="Markup" value={`${result.markup.toFixed(1)}%`} />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={`${result.margin.toFixed(0)}% gross margin`}
            tips={result.tips}
          />
        </>
      }
    />
  );
}
