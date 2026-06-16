"use client";

import { useMemo, useState } from "react";

export default function RoiCalculatorPage() {
  const [cost, setCost] = useState("10");
  const [sellPrice, setSellPrice] = useState("25");
  const [amazonFees, setAmazonFees] = useState("4.5");
  const [shippingCost, setShippingCost] = useState("1.5");
  const [units, setUnits] = useState("100");

  const result = useMemo(() => {
    const costNum = parseFloat(cost) || 0;
    const sellNum = parseFloat(sellPrice) || 0;
    const feesNum = parseFloat(amazonFees) || 0;
    const shipNum = parseFloat(shippingCost) || 0;
    const unitsNum = parseFloat(units) || 0;

    const totalCostPerUnit = costNum + shipNum;
    const profitPerUnit = sellNum - totalCostPerUnit - feesNum;
    const roi = totalCostPerUnit > 0 ? (profitPerUnit / totalCostPerUnit) * 100 : 0;
    const margin = sellNum > 0 ? (profitPerUnit / sellNum) * 100 : 0;
    const totalProfit = profitPerUnit * unitsNum;

    return { profitPerUnit, roi, margin, totalProfit };
  }, [cost, sellPrice, amazonFees, shippingCost, units]);

  return (
    <main className="flex flex-1 flex-col gap-8 p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          ROI Calculator
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Estimate return on investment for a wholesale product.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <Field label="Unit cost ($)" value={cost} onChange={setCost} />
          <Field label="Sell price ($)" value={sellPrice} onChange={setSellPrice} />
          <Field label="Amazon fees per unit ($)" value={amazonFees} onChange={setAmazonFees} />
          <Field label="Shipping/prep cost per unit ($)" value={shippingCost} onChange={setShippingCost} />
          <Field label="Units purchased" value={units} onChange={setUnits} />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <ResultRow label="Profit per unit" value={`$${result.profitPerUnit.toFixed(2)}`} />
          <ResultRow label="ROI" value={`${result.roi.toFixed(1)}%`} />
          <ResultRow label="Margin" value={`${result.margin.toFixed(1)}%`} />
          <ResultRow label="Total profit" value={`$${result.totalProfit.toFixed(2)}`} highlight />
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
    </label>
  );
}

function ResultRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 last:pb-0 dark:border-zinc-800">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span
        className={`text-lg font-semibold ${
          highlight
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
