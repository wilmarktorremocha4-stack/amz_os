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

export default function MarginCalculatorPage() {
  const [cost, setCost] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  const result = useMemo(() => {
    const costNum = parseFloat(cost) || 0;
    const sellNum = parseFloat(sellPrice) || 0;

    const profit = sellNum - costNum;
    const margin = sellNum > 0 ? (profit / sellNum) * 100 : 0;
    const markup = costNum > 0 ? (profit / costNum) * 100 : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    if (costNum === 0 && sellNum === 0) {
      tips.push("Enter a unit cost and sell price to see margin and markup.");
    } else if (sellNum === 0 && costNum > 0) {
      tier = "bad";
      tips.push("No sell price entered yet — add one to evaluate this product.");
    } else if (profit < 0) {
      tier = "bad";
      tips.push(
        `Selling $${Math.abs(profit).toFixed(2)} below cost. Raise the price or source the product cheaper before listing it.`,
      );
    } else if (profit === 0) {
      tier = "bad";
      tips.push(
        "Sell price exactly equals cost — every sale is break-even before fees, shipping, or returns, which guarantees a loss in practice.",
      );
    } else if (margin < 10) {
      tier = "bad";
      tips.push(
        `Margin of ${margin.toFixed(1)}% is razor-thin even before Amazon fees — this almost certainly loses money once referral/FBA fees and shipping are added.`,
      );
    } else if (margin < 20) {
      tier = "warn";
      tips.push(
        `Margin of ${margin.toFixed(1)}% is tight once Amazon fees and shipping are layered on — run this through the ROI calculator with real fees before committing.`,
      );
    } else if (margin > 70) {
      tips.push(
        `${margin.toFixed(1)}% margin is unusually high — double check the cost figure includes everything (freight, customs, packaging), since numbers this strong are rare in wholesale.`,
      );
    } else {
      tips.push(
        "Solid gross margin before fees — confirm it still holds up after Amazon referral/FBA fees.",
      );
    }
    if (markup > 0 && markup < 15 && profit > 0) {
      tips.push(
        `Markup of only ${markup.toFixed(1)}% over cost gives almost no cushion for a price match or discount promotion.`,
      );
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
          <Field
            label="Sell price ($)"
            value={sellPrice}
            onChange={setSellPrice}
          />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
            <ResultRow
              label="Gross profit"
              value={`$${result.profit.toFixed(2)}`}
            />
            <ResultRow
              label="Margin"
              value={`${result.margin.toFixed(1)}%`}
              highlight
            />
            <ResultRow label="Markup" value={`${result.markup.toFixed(1)}%`} />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={`${result.margin.toFixed(0)}% gross margin`}
            tips={result.tips}
          />
        </>
      }
      history={
        <CalculatorHistory
          type="MARGIN"
          inputs={{ cost, sellPrice }}
          result={result}
          onLoad={(loaded) => {
            setCost(loaded.cost ?? "");
            setSellPrice(loaded.sellPrice ?? "");
          }}
        />
      }
    />
  );
}
