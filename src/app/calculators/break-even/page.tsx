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
    if (profitNum <= 0) {
      tier = "bad";
      tips.push(
        "Profit per unit is zero or negative — this investment never breaks even at these numbers.",
      );
    } else if (monthsToBreakEven > 3) {
      tier = "warn";
      tips.push(
        "Over 3 months to break even ties up cash for a while — consider a smaller initial order or improving profit per unit.",
      );
    } else {
      tips.push(
        "Fast payback period — capital is recovered quickly, freeing it up for the next order.",
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
