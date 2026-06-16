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

export default function RoiCalculatorPage() {
  const [cost, setCost] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [amazonFees, setAmazonFees] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [units, setUnits] = useState("");

  const result = useMemo(() => {
    const costNum = parseFloat(cost) || 0;
    const sellNum = parseFloat(sellPrice) || 0;
    const feesNum = parseFloat(amazonFees) || 0;
    const shipNum = parseFloat(shippingCost) || 0;
    const unitsNum = parseFloat(units) || 0;

    const totalCostPerUnit = costNum + shipNum;
    const profitPerUnit = sellNum - totalCostPerUnit - feesNum;
    const roi =
      totalCostPerUnit > 0 ? (profitPerUnit / totalCostPerUnit) * 100 : 0;
    const margin = sellNum > 0 ? (profitPerUnit / sellNum) * 100 : 0;
    const totalProfit = profitPerUnit * unitsNum;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    if (profitPerUnit <= 0) {
      tier = "bad";
      tips.push(
        "This product loses money per unit — raise the sell price or negotiate a lower unit cost before sourcing it.",
      );
    } else if (roi < 30) {
      tier = "warn";
      tips.push(
        "ROI under 30% is thin for wholesale. Try negotiating a lower cost, buying a larger volume for better pricing, or raising the sell price.",
      );
    } else {
      tips.push(
        "Healthy ROI for wholesale sourcing — confirm sell-through velocity before committing to a large order.",
      );
    }
    if (margin < 15 && profitPerUnit > 0) {
      tier = tier === "good" ? "warn" : tier;
      tips.push(
        "Margin under 15% leaves little room for price drops or fee changes.",
      );
    }

    return { profitPerUnit, roi, margin, totalProfit, tier, tips };
  }, [cost, sellPrice, amazonFees, shippingCost, units]);

  return (
    <CalculatorLayout
      title="ROI Calculator"
      description="Estimate return on investment for a wholesale product."
      inputs={
        <>
          <Field label="Unit cost ($)" value={cost} onChange={setCost} />
          <Field
            label="Sell price ($)"
            value={sellPrice}
            onChange={setSellPrice}
          />
          <Field
            label="Amazon fees per unit ($)"
            value={amazonFees}
            onChange={setAmazonFees}
          />
          <Field
            label="Shipping/prep cost per unit ($)"
            value={shippingCost}
            onChange={setShippingCost}
          />
          <Field label="Units purchased" value={units} onChange={setUnits} />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
            <ResultRow
              label="Profit per unit"
              value={`$${result.profitPerUnit.toFixed(2)}`}
            />
            <ResultRow label="ROI" value={`${result.roi.toFixed(1)}%`} />
            <ResultRow label="Margin" value={`${result.margin.toFixed(1)}%`} />
            <ResultRow
              label="Total profit"
              value={`$${result.totalProfit.toFixed(2)}`}
              highlight
            />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={
              result.profitPerUnit <= 0
                ? "Unprofitable at these numbers"
                : `${result.roi.toFixed(0)}% ROI`
            }
            tips={result.tips}
          />
        </>
      }
      history={
        <CalculatorHistory
          type="ROI"
          inputs={{ cost, sellPrice, amazonFees, shippingCost, units }}
          result={result}
          onLoad={(loaded) => {
            setCost(loaded.cost ?? "");
            setSellPrice(loaded.sellPrice ?? "");
            setAmazonFees(loaded.amazonFees ?? "");
            setShippingCost(loaded.shippingCost ?? "");
            setUnits(loaded.units ?? "");
          }}
        />
      }
    />
  );
}
