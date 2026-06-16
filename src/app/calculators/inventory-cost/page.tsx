"use client";

import { useMemo, useState } from "react";
import { CalculatorLayout, Field, ResultRow, StatusBanner, StatusTier } from "@/components/calculators/CalcUI";

export default function InventoryCostCalculatorPage() {
  const [unitCost, setUnitCost] = useState("10");
  const [units, setUnits] = useState("200");
  const [shippingTotal, setShippingTotal] = useState("150");
  const [miscFees, setMiscFees] = useState("50");
  const [sellPrice, setSellPrice] = useState("25");

  const result = useMemo(() => {
    const unitCostNum = parseFloat(unitCost) || 0;
    const unitsNum = parseFloat(units) || 0;
    const shippingNum = parseFloat(shippingTotal) || 0;
    const miscNum = parseFloat(miscFees) || 0;
    const sellNum = parseFloat(sellPrice) || 0;

    const productCost = unitCostNum * unitsNum;
    const totalCost = productCost + shippingNum + miscNum;
    const landedCostPerUnit = unitsNum > 0 ? totalCost / unitsNum : 0;
    const landedMargin = sellNum > 0 ? ((sellNum - landedCostPerUnit) / sellNum) * 100 : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    const freightSharePct = totalCost > 0 ? ((shippingNum + miscNum) / totalCost) * 100 : 0;
    if (sellNum > 0 && landedCostPerUnit >= sellNum) {
      tier = "bad";
      tips.push("Landed cost per unit is at or above your sell price — this order loses money before Amazon fees.");
    } else if (freightSharePct > 20) {
      tier = "warn";
      tips.push("Shipping/misc fees are over 20% of total cost — see if a different freight method or larger order size brings this down.");
    } else {
      tips.push("Freight and misc costs are a reasonable share of total landed cost.");
    }

    return { productCost, totalCost, landedCostPerUnit, landedMargin, tier, tips };
  }, [unitCost, units, shippingTotal, miscFees, sellPrice]);

  return (
    <CalculatorLayout
      title="Inventory Cost Calculator"
      description="Roll shipping and misc fees into a true landed cost per unit."
      inputs={
        <>
          <Field label="Unit cost ($)" value={unitCost} onChange={setUnitCost} />
          <Field label="Units purchased" value={units} onChange={setUnits} />
          <Field label="Total shipping to you ($)" value={shippingTotal} onChange={setShippingTotal} />
          <Field label="Misc fees ($)" value={miscFees} onChange={setMiscFees} suffix="customs, prep, etc." />
          <Field label="Sell price ($)" value={sellPrice} onChange={setSellPrice} />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <ResultRow label="Total product cost" value={`$${result.productCost.toFixed(2)}`} />
            <ResultRow label="Total landed cost" value={`$${result.totalCost.toFixed(2)}`} />
            <ResultRow label="Landed cost per unit" value={`$${result.landedCostPerUnit.toFixed(2)}`} highlight />
            <ResultRow label="Margin vs. sell price" value={`${result.landedMargin.toFixed(1)}%`} />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={`$${result.landedCostPerUnit.toFixed(2)} true cost per unit`}
            tips={result.tips}
          />
        </>
      }
    />
  );
}
