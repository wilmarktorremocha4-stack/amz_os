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

export default function BreakEvenCalculatorPage() {
  const [investment, setInvestment] = useState("");
  const [profitPerUnit, setProfitPerUnit] = useState("");
  const [monthlyUnitsSold, setMonthlyUnitsSold] = useState("");

  const result = useMemo(() => {
    const investmentNum = parseFloat(investment) || 0;
    const profitNum = parseFloat(profitPerUnit) || 0;
    const monthlyUnitsNum = parseFloat(monthlyUnitsSold) || 0;

    const breakEvenUnits = profitNum > 0 ? investmentNum / profitNum : 0;
    const monthsToBreakEven =
      monthlyUnitsNum > 0 ? breakEvenUnits / monthlyUnitsNum : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    if (investmentNum === 0 && profitNum === 0) {
      tips.push(
        "Enter your total investment and profit per unit to estimate break-even.",
      );
    } else if (profitNum < 0) {
      tier = "bad";
      tips.push(
        `Profit per unit is negative ($${profitNum.toFixed(2)}) — this investment never breaks even and loses more money the more you sell. Fix unit economics before ordering.`,
      );
    } else if (profitNum === 0) {
      tier = "bad";
      tips.push(
        "Profit per unit is exactly zero — you'll recover the cash but never turn a profit. Raise the price or cut costs before committing.",
      );
    } else if (monthlyUnitsNum === 0) {
      tier = "warn";
      tips.push(
        `You'll need to sell ${breakEvenUnits.toFixed(0)} units to break even — add an estimated monthly sales pace to see how long that will take.`,
      );
    } else if (monthsToBreakEven > 6) {
      tier = "bad";
      tips.push(
        `${monthsToBreakEven.toFixed(1)} months to break even ties up capital for a long stretch — consider a smaller initial order, a higher sell price, or finding faster-turning inventory.`,
      );
    } else if (monthsToBreakEven > 3) {
      tier = "warn";
      tips.push(
        `${monthsToBreakEven.toFixed(1)} months to break even ties up cash for a while — consider a smaller initial order or improving profit per unit.`,
      );
    } else if (monthsToBreakEven <= 1) {
      tips.push(
        `Breaks even in under a month — capital recycles fast, which supports scaling this order size up if demand allows.`,
      );
    } else {
      tips.push(
        `Fast payback period of ${monthsToBreakEven.toFixed(1)} months — capital is recovered quickly, freeing it up for the next order.`,
      );
    }

    if (breakEvenUnits > 0 && monthlyUnitsNum > 0 && breakEvenUnits > monthlyUnitsNum * 24) {
      tier = "bad";
      tips.push(
        "At this sales pace, break-even is over 2 years out — this is more a long-term hold than a flippable wholesale order.",
      );
    }

    return { breakEvenUnits, monthsToBreakEven, tier, tips };
  }, [investment, profitPerUnit, monthlyUnitsSold]);

  return (
    <CalculatorLayout
      title="Break-Even Calculator"
      description="Find out how many units (and months) it takes to recover your initial investment."
      inputs={
        <>
          <Field
            label="Total investment ($)"
            value={investment}
            onChange={setInvestment}
          />
          <Field
            label="Profit per unit ($)"
            value={profitPerUnit}
            onChange={setProfitPerUnit}
          />
          <Field
            label="Estimated units sold per month"
            value={monthlyUnitsSold}
            onChange={setMonthlyUnitsSold}
          />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
            <ResultRow
              label="Break-even units"
              value={result.breakEvenUnits.toFixed(0)}
              highlight
            />
            <ResultRow
              label="Months to break even"
              value={result.monthsToBreakEven.toFixed(1)}
            />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={
              result.monthsToBreakEven > 0
                ? `Pays back in ~${result.monthsToBreakEven.toFixed(1)} months`
                : "Never breaks even at these numbers"
            }
            tips={result.tips}
          />
        </>
      }
      history={
        <CalculatorHistory
          type="BREAK_EVEN"
          inputs={{ investment, profitPerUnit, monthlyUnitsSold }}
          result={result}
          onLoad={(loaded) => {
            setInvestment(loaded.investment ?? "");
            setProfitPerUnit(loaded.profitPerUnit ?? "");
            setMonthlyUnitsSold(loaded.monthlyUnitsSold ?? "");
          }}
        />
      }
    />
  );
}
