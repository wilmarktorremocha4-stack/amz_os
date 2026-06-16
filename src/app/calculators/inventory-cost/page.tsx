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

export default function InventoryCostCalculatorPage() {
  const [unitCost, setUnitCost] = useState("");
  const [units, setUnits] = useState("");
  const [shippingTotal, setShippingTotal] = useState("");
  const [miscFees, setMiscFees] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  const result = useMemo(() => {
    const unitCostNum = parseFloat(unitCost) || 0;
    const unitsNum = parseFloat(units) || 0;
    const shippingNum = parseFloat(shippingTotal) || 0;
    const miscNum = parseFloat(miscFees) || 0;
    const sellNum = parseFloat(sellPrice) || 0;

    const productCost = unitCostNum * unitsNum;
    const totalCost = productCost + shippingNum + miscNum;
    const landedCostPerUnit = unitsNum > 0 ? totalCost / unitsNum : 0;
    const landedMargin =
      sellNum > 0 ? ((sellNum - landedCostPerUnit) / sellNum) * 100 : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    const freightSharePct =
      totalCost > 0 ? ((shippingNum + miscNum) / totalCost) * 100 : 0;

    if (unitsNum === 0 && unitCostNum === 0) {
      tips.push("Enter unit cost and units purchased to calculate landed cost.");
    } else if (unitsNum === 0 && (shippingNum > 0 || miscNum > 0)) {
      tier = "warn";
      tips.push(
        "No units entered yet — shipping and misc fees can't be spread per-unit without a unit count.",
      );
    } else if (sellNum > 0 && landedCostPerUnit > sellNum) {
      tier = "bad";
      const shortfall = landedCostPerUnit - sellNum;
      tips.push(
        `Landed cost per unit is $${shortfall.toFixed(2)} above your sell price — this order loses money before Amazon fees even apply.`,
      );
    } else if (sellNum > 0 && landedCostPerUnit === sellNum) {
      tier = "bad";
      tips.push(
        "Landed cost exactly equals sell price — break-even before any Amazon fees means a guaranteed loss in practice.",
      );
    } else if (freightSharePct > 35) {
      tier = "bad";
      tips.push(
        `Shipping/misc fees are ${freightSharePct.toFixed(0)}% of total landed cost — this is unusually high. Check for express freight, small order surcharges, or excessive customs/misc charges.`,
      );
    } else if (freightSharePct > 20) {
      tier = "warn";
      tips.push(
        `Shipping/misc fees are ${freightSharePct.toFixed(0)}% of total cost — see if a different freight method or larger order size brings this down.`,
      );
    } else if (sellNum > 0 && landedMargin < 15) {
      tier = "warn";
      tips.push(
        `Margin vs. sell price is only ${landedMargin.toFixed(1)}% after landed cost — there's little room left once Amazon fees are factored in.`,
      );
    } else {
      tips.push(
        "Freight and misc costs are a reasonable share of total landed cost.",
      );
    }

    if (sellNum === 0 && landedCostPerUnit > 0) {
      tips.push(
        "Add a sell price to see how landed cost compares to your margin.",
      );
    }

    return {
      productCost,
      totalCost,
      landedCostPerUnit,
      landedMargin,
      tier,
      tips,
    };
  }, [unitCost, units, shippingTotal, miscFees, sellPrice]);

  return (
    <CalculatorLayout
      title="Inventory Cost Calculator"
      description="Roll shipping and misc fees into a true landed cost per unit."
      inputs={
        <>
          <Field
            label="Unit cost ($)"
            value={unitCost}
            onChange={setUnitCost}
          />
          <Field label="Units purchased" value={units} onChange={setUnits} />
          <Field
            label="Total shipping to you ($)"
            value={shippingTotal}
            onChange={setShippingTotal}
          />
          <Field
            label="Misc fees ($)"
            value={miscFees}
            onChange={setMiscFees}
            suffix="customs, prep, etc."
          />
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
              label="Total product cost"
              value={`$${result.productCost.toFixed(2)}`}
            />
            <ResultRow
              label="Total landed cost"
              value={`$${result.totalCost.toFixed(2)}`}
            />
            <ResultRow
              label="Landed cost per unit"
              value={`$${result.landedCostPerUnit.toFixed(2)}`}
              highlight
            />
            <ResultRow
              label="Margin vs. sell price"
              value={`${result.landedMargin.toFixed(1)}%`}
            />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={`$${result.landedCostPerUnit.toFixed(2)} true cost per unit`}
            tips={result.tips}
          />
        </>
      }
      history={
        <CalculatorHistory
          type="INVENTORY_COST"
          inputs={{ unitCost, units, shippingTotal, miscFees, sellPrice }}
          result={result}
          onLoad={(loaded) => {
            setUnitCost(loaded.unitCost ?? "");
            setUnits(loaded.units ?? "");
            setShippingTotal(loaded.shippingTotal ?? "");
            setMiscFees(loaded.miscFees ?? "");
            setSellPrice(loaded.sellPrice ?? "");
          }}
        />
      }
    />
  );
}
