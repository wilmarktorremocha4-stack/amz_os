"use client";

import { useMemo, useState } from "react";
import {
  CalculatorLayout,
  Field,
  ResultRow,
  StatusBanner,
  StatusTier,
} from "@/components/calculators/CalcUI";
import { CalculatorHistory } from "@/components/calculators/CalculatorHistory";

export default function BundleCalculatorPage() {
  const [componentsCost, setComponentsCost] = useState("");
  const [bundleSellPrice, setBundleSellPrice] = useState("");
  const [amazonFees, setAmazonFees] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [soloSellPriceSum, setSoloSellPriceSum] = useState("");

  const result = useMemo(() => {
    const componentsCostNum = parseFloat(componentsCost) || 0;
    const sellNum = parseFloat(bundleSellPrice) || 0;
    const feesNum = parseFloat(amazonFees) || 0;
    const shipNum = parseFloat(shippingCost) || 0;
    const soloSumNum = parseFloat(soloSellPriceSum) || 0;

    const totalCost = componentsCostNum + shipNum;
    const profit = sellNum - totalCost - feesNum;
    const margin = sellNum > 0 ? (profit / sellNum) * 100 : 0;
    const bundlePremium =
      soloSumNum > 0 ? ((sellNum - soloSumNum) / soloSumNum) * 100 : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];

    if (componentsCostNum === 0 && sellNum === 0) {
      tips.push("Enter component cost and bundle sell price to evaluate this bundle.");
    } else if (profit < 0) {
      tier = "bad";
      tips.push(
        `Bundle loses $${Math.abs(profit).toFixed(2)} at this price — raise the bundle price or cut a low-value component.`,
      );
    } else if (profit === 0) {
      tier = "bad";
      tips.push(
        "Bundle breaks even exactly before any returns or damage — there's no real profit cushion here.",
      );
    } else if (soloSumNum === 0) {
      tier = "warn";
      tips.push(
        "Add the sum of solo sell prices to see whether bundling actually beats selling these components separately.",
      );
    } else if (bundlePremium < 0) {
      tier = "bad";
      tips.push(
        `Bundle sells for ${Math.abs(bundlePremium).toFixed(1)}% less than the components would separately — selling them as singles would make more money and avoid extra packaging work.`,
      );
    } else if (bundlePremium === 0) {
      tier = "warn";
      tips.push(
        "Bundle sells for exactly the same as the components separately — there's no bundling premium to justify the extra packaging/listing effort.",
      );
    } else if (bundlePremium < 5) {
      tier = "warn";
      tips.push(
        `Only a ${bundlePremium.toFixed(1)}% premium over solo pricing — that may not cover the extra labor of assembling and listing a bundle.`,
      );
    } else if (margin < 15) {
      tier = "warn";
      tips.push(
        `Bundle margin of ${margin.toFixed(1)}% is thin even with a pricing premium — confirm it survives Amazon referral fees and any bundle-specific FBA size tier.`,
      );
    } else {
      tips.push(
        `Bundle commands a ${bundlePremium.toFixed(1)}% premium over selling components separately — a strong case for keeping it bundled.`,
      );
    }

    return { totalCost, profit, margin, bundlePremium, tier, tips };
  }, [
    componentsCost,
    bundleSellPrice,
    amazonFees,
    shippingCost,
    soloSellPriceSum,
  ]);

  return (
    <CalculatorLayout
      title="Wholesale Bundle Calculator"
      description="Check whether bundling products together beats selling them separately."
      inputs={
        <>
          <Field
            label="Combined component cost ($)"
            value={componentsCost}
            onChange={setComponentsCost}
          />
          <Field
            label="Bundle sell price ($)"
            value={bundleSellPrice}
            onChange={setBundleSellPrice}
          />
          <Field
            label="Amazon fees for bundle ($)"
            value={amazonFees}
            onChange={setAmazonFees}
          />
          <Field
            label="Shipping/prep cost ($)"
            value={shippingCost}
            onChange={setShippingCost}
          />
          <Field
            label="Sum of solo sell prices ($)"
            value={soloSellPriceSum}
            onChange={setSoloSellPriceSum}
            suffix="for comparison"
          />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
            <ResultRow
              label="Total cost"
              value={`$${result.totalCost.toFixed(2)}`}
            />
            <ResultRow
              label="Profit"
              value={`$${result.profit.toFixed(2)}`}
              highlight
            />
            <ResultRow label="Margin" value={`${result.margin.toFixed(1)}%`} />
            <ResultRow
              label="Bundle premium vs. solo"
              value={`${result.bundlePremium.toFixed(1)}%`}
            />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={`$${result.profit.toFixed(2)} profit on this bundle`}
            tips={result.tips}
          />
        </>
      }
      history={
        <CalculatorHistory
          type="BUNDLE"
          inputs={{
            componentsCost,
            bundleSellPrice,
            amazonFees,
            shippingCost,
            soloSellPriceSum,
          }}
          result={result}
          onLoad={(loaded) => {
            setComponentsCost(loaded.componentsCost ?? "");
            setBundleSellPrice(loaded.bundleSellPrice ?? "");
            setAmazonFees(loaded.amazonFees ?? "");
            setShippingCost(loaded.shippingCost ?? "");
            setSoloSellPriceSum(loaded.soloSellPriceSum ?? "");
          }}
        />
      }
    />
  );
}
