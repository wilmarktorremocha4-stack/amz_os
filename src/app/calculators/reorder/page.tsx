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

export default function ReorderCalculatorPage() {
  const [currentStock, setCurrentStock] = useState("");
  const [avgDailySales, setAvgDailySales] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [safetyStockDays, setSafetyStockDays] = useState("");

  const result = useMemo(() => {
    const stockNum = parseFloat(currentStock) || 0;
    const dailySalesNum = parseFloat(avgDailySales) || 0;
    const leadTimeNum = parseFloat(leadTimeDays) || 0;
    const safetyDaysNum = parseFloat(safetyStockDays) || 0;

    const reorderPoint = dailySalesNum * (leadTimeNum + safetyDaysNum);
    const daysOfStockLeft = dailySalesNum > 0 ? stockNum / dailySalesNum : 0;
    const suggestedReorderQty =
      dailySalesNum * (leadTimeNum + safetyDaysNum) * 1.5;
    const unitsUntilReorderPoint = stockNum - reorderPoint;

    let tier: StatusTier = "good";
    const tips: string[] = [];

    if (dailySalesNum === 0 && stockNum === 0) {
      tips.push("Enter current stock and average daily sales to calculate a reorder point.");
    } else if (dailySalesNum === 0) {
      tier = "warn";
      tips.push(
        "Average daily sales is zero — add a sales velocity estimate to get a meaningful reorder point.",
      );
    } else if (leadTimeNum === 0) {
      tier = "warn";
      tips.push(
        "Supplier lead time is zero — add the real lead time, otherwise the reorder point will be understated and you risk a stockout while waiting on the next order.",
      );
    } else if (stockNum === 0) {
      tier = "bad";
      tips.push(
        "Current stock is zero — you're already out of stock. Place a reorder immediately and consider expedited shipping to minimize the gap.",
      );
    } else if (stockNum < reorderPoint) {
      tier = "bad";
      tips.push(
        `Stock is below the reorder point — place a reorder now. At current sales pace you have about ${daysOfStockLeft.toFixed(0)} days of stock left, which is less than your ${(leadTimeNum + safetyDaysNum).toFixed(0)}-day lead time + safety buffer.`,
      );
    } else if (stockNum === reorderPoint) {
      tier = "bad";
      tips.push(
        "Stock is exactly at the reorder point — place the order today. Waiting any longer eats into your safety stock buffer.",
      );
    } else if (unitsUntilReorderPoint < dailySalesNum * 7) {
      tier = "warn";
      tips.push(
        `Within a week of hitting the reorder point (about ${(unitsUntilReorderPoint / dailySalesNum).toFixed(1)} days out) — start preparing the next purchase order now so it isn't a scramble.`,
      );
    } else if (safetyDaysNum === 0) {
      tier = "warn";
      tips.push(
        "No safety stock buffer set — any supplier delay or demand spike could cause a stockout. Consider adding 7-14 days of buffer.",
      );
    } else if (daysOfStockLeft > (leadTimeNum + safetyDaysNum) * 4) {
      tips.push(
        `Stock is very healthy at about ${daysOfStockLeft.toFixed(0)} days — that's well beyond lead time plus buffer, so capital may be sitting idle in excess inventory rather than being reinvested.`,
      );
    } else {
      tips.push(
        `Stock is healthy — about ${daysOfStockLeft.toFixed(0)} days of inventory remaining, comfortably above your reorder point.`,
      );
    }

    return { reorderPoint, daysOfStockLeft, suggestedReorderQty, tier, tips };
  }, [currentStock, avgDailySales, leadTimeDays, safetyStockDays]);

  return (
    <CalculatorLayout
      title="Reorder Calculator"
      description="Find your reorder point so you never run out of stock between purchase orders."
      inputs={
        <>
          <Field
            label="Current stock (units)"
            value={currentStock}
            onChange={setCurrentStock}
          />
          <Field
            label="Average daily sales (units)"
            value={avgDailySales}
            onChange={setAvgDailySales}
          />
          <Field
            label="Supplier lead time (days)"
            value={leadTimeDays}
            onChange={setLeadTimeDays}
          />
          <Field
            label="Safety stock buffer (days)"
            value={safetyStockDays}
            onChange={setSafetyStockDays}
          />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
            <ResultRow
              label="Reorder point"
              value={`${result.reorderPoint.toFixed(0)} units`}
              highlight
            />
            <ResultRow
              label="Days of stock left"
              value={result.daysOfStockLeft.toFixed(0)}
            />
            <ResultRow
              label="Suggested reorder quantity"
              value={`${result.suggestedReorderQty.toFixed(0)} units`}
            />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={
              result.tier === "bad"
                ? "Reorder now"
                : result.tier === "warn"
                  ? "Reorder coming up soon"
                  : "Stock healthy"
            }
            tips={result.tips}
          />
        </>
      }
      history={
        <CalculatorHistory
          type="REORDER"
          inputs={{
            currentStock,
            avgDailySales,
            leadTimeDays,
            safetyStockDays,
          }}
          result={result}
          onLoad={(loaded) => {
            setCurrentStock(loaded.currentStock ?? "");
            setAvgDailySales(loaded.avgDailySales ?? "");
            setLeadTimeDays(loaded.leadTimeDays ?? "");
            setSafetyStockDays(loaded.safetyStockDays ?? "");
          }}
        />
      }
    />
  );
}
