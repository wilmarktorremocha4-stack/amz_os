"use client";

import { useMemo, useState } from "react";
import { CalculatorLayout, Field, ResultRow, StatusBanner, StatusTier } from "@/components/calculators/CalcUI";

export default function BundleCalculatorPage() {
  const [componentsCost, setComponentsCost] = useState("18");
  const [bundleSellPrice, setBundleSellPrice] = useState("40");
  const [amazonFees, setAmazonFees] = useState("7");
  const [shippingCost, setShippingCost] = useState("3");
  const [soloSellPriceSum, setSoloSellPriceSum] = useState("32");

  const result = useMemo(() => {
    const componentsCostNum = parseFloat(componentsCost) || 0;
    const sellNum = parseFloat(bundleSellPrice) || 0;
    const feesNum = parseFloat(amazonFees) || 0;
    const shipNum = parseFloat(shippingCost) || 0;
    const soloSumNum = parseFloat(soloSellPriceSum) || 0;

    const totalCost = componentsCostNum + shipNum;
    const profit = sellNum - totalCost - feesNum;
    const margin = sellNum > 0 ? (profit / sellNum) * 100 : 0;
    const bundlePremium = soloSumNum > 0 ? ((sellNum - soloSumNum) / soloSumNum) * 100 : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    if (profit <= 0) {
      tier = "bad";
      tips.push("Bundle loses money at this price — raise the bundle price or cut a low-value component.");
    } else if (bundlePremium <= 0) {
      tier = "warn";
      tips.push("Bundle sells for the same or less than the components would separately — there's no bundling premium to justify the extra packaging/listing effort.");
    } else {
      tips.push("Bundle commands a premium over selling components separately.");
    }

    return { totalCost, profit, margin, bundlePremium, tier, tips };
  }, [componentsCost, bundleSellPrice, amazonFees, shippingCost, soloSellPriceSum]);

  return (
    <CalculatorLayout
      title="Wholesale Bundle Calculator"
      description="Check whether bundling products together beats selling them separately."
      inputs={
        <>
          <Field label="Combined component cost ($)" value={componentsCost} onChange={setComponentsCost} />
          <Field label="Bundle sell price ($)" value={bundleSellPrice} onChange={setBundleSellPrice} />
          <Field label="Amazon fees for bundle ($)" value={amazonFees} onChange={setAmazonFees} />
          <Field label="Shipping/prep cost ($)" value={shippingCost} onChange={setShippingCost} />
          <Field label="Sum of solo sell prices ($)" value={soloSellPriceSum} onChange={setSoloSellPriceSum} suffix="for comparison" />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <ResultRow label="Total cost" value={`$${result.totalCost.toFixed(2)}`} />
            <ResultRow label="Profit" value={`$${result.profit.toFixed(2)}`} highlight />
            <ResultRow label="Margin" value={`${result.margin.toFixed(1)}%`} />
            <ResultRow label="Bundle premium vs. solo" value={`${result.bundlePremium.toFixed(1)}%`} />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={`$${result.profit.toFixed(2)} profit on this bundle`}
            tips={result.tips}
          />
        </>
      }
    />
  );
}
