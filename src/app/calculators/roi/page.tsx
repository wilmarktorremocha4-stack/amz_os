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

    if (costNum === 0 && sellNum === 0) {
      tips.push("Enter a unit cost and sell price to see ROI.");
    } else if (feesNum > sellNum && sellNum > 0) {
      tier = "bad";
      tips.push(
        `Amazon fees alone ($${feesNum.toFixed(2)}) exceed the sell price ($${sellNum.toFixed(2)}) — check that the fee figure is per-unit, not total, and re-pull referral/FBA fees for this exact listing.`,
      );
    } else if (profitPerUnit <= 0) {
      tier = "bad";
      const shortfall = Math.abs(profitPerUnit);
      tips.push(
        `Losing $${shortfall.toFixed(2)} per unit — raise the sell price by at least that much or negotiate a lower unit cost before sourcing it.`,
      );
      if (shipNum / (totalCostPerUnit || 1) > 0.3) {
        tips.push(
          "Shipping/prep is a large slice of unit cost — a cheaper freight method or larger order could close most of this gap.",
        );
      }
    } else if (roi < 15) {
      tier = "bad";
      tips.push(
        `ROI of ${roi.toFixed(0)}% barely beats doing nothing with the cash — wholesale resellers typically target 30%+ to absorb returns, storage, and slow movers.`,
      );
    } else if (roi < 30) {
      tier = "warn";
      tips.push(
        `ROI of ${roi.toFixed(0)}% is thin for wholesale. Try negotiating a lower cost, buying a larger volume for better pricing, or raising the sell price by a few dollars.`,
      );
    } else if (roi > 100) {
      tips.push(
        `${roi.toFixed(0)}% ROI is exceptional — double-check the cost and fee inputs are accurate, since numbers this strong are uncommon in wholesale.`,
      );
    } else {
      tips.push(
        "Healthy ROI for wholesale sourcing — confirm sell-through velocity before committing to a large order.",
      );
    }

    if (margin < 10 && profitPerUnit > 0) {
      tier = tier === "good" ? "warn" : tier;
      tips.push(
        "Margin under 10% leaves almost no room for a price war, a fee increase, or a return — treat this as a one-time test buy, not a repeat order.",
      );
    } else if (margin < 15 && profitPerUnit > 0) {
      tier = tier === "good" ? "warn" : tier;
      tips.push(
        "Margin under 15% leaves little room for price drops or fee changes.",
      );
    }

    if (unitsNum === 0 && profitPerUnit > 0) {
      tips.push(
        "Add the units you plan to purchase to see total profit for this order.",
      );
    } else if (unitsNum > 0 && totalProfit > 0 && totalCostPerUnit * unitsNum > 0) {
      const totalCapital = totalCostPerUnit * unitsNum;
      if (totalCapital > 5000 && roi < 50) {
        tips.push(
          `This order ties up $${totalCapital.toFixed(0)} in capital — consider a smaller test order first if you haven't sold this product before.`,
        );
      }
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
