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
    if (stockNum <= reorderPoint) {
      tier = "bad";
      tips.push(
        `Stock is at or below the reorder point — place a reorder now. At current sales pace you have about ${daysOfStockLeft.toFixed(0)} days of stock left.`,
      );
    } else if (unitsUntilReorderPoint < dailySalesNum * 7) {
      tier = "warn";
      tips.push(
        "Within a week of hitting the reorder point — start preparing the next purchase order.",
      );
    } else {
      tips.push(
        `Stock is healthy — about ${daysOfStockLeft.toFixed(0)} days of inventory remaining.`,
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
