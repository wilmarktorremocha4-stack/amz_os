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

export default function SalesTaxCalculatorPage() {
  const [purchasePrice, setPurchasePrice] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [hasResaleCertificate, setHasResaleCertificate] = useState(false);

  const result = useMemo(() => {
    const priceNum = parseFloat(purchasePrice) || 0;
    const rateNum = parseFloat(taxRate) || 0;

    const taxOwed = hasResaleCertificate ? 0 : priceNum * (rateNum / 100);
    const totalCost = priceNum + taxOwed;
    const savedByExemption = priceNum * (rateNum / 100);

    let tier: StatusTier = "good";
    const tips: string[] = [];
    if (!hasResaleCertificate && rateNum > 0) {
      tier = "warn";
      tips.push(
        `A resale certificate would exempt this purchase from sales tax, saving $${savedByExemption.toFixed(2)} on this order — wholesale suppliers generally accept one on file.`,
      );
    } else if (hasResaleCertificate) {
      tips.push(
        "Resale certificate applied — no sales tax owed on this wholesale purchase.",
      );
    }

    return { taxOwed, totalCost, savedByExemption, tier, tips };
  }, [purchasePrice, taxRate, hasResaleCertificate]);

  return (
    <CalculatorLayout
      title="Sales Tax Calculator"
      description="Estimate sales tax owed on a wholesale purchase, and the impact of a resale certificate."
      inputs={
        <>
          <Field
            label="Purchase price ($)"
            value={purchasePrice}
            onChange={setPurchasePrice}
          />
          <Field
            label="Sales tax rate (%)"
            value={taxRate}
            onChange={setTaxRate}
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={hasResaleCertificate}
              onChange={(e) => setHasResaleCertificate(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] "
            />
            I have a resale certificate on file with this supplier
          </label>
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
            <ResultRow
              label="Tax owed"
              value={`$${result.taxOwed.toFixed(2)}`}
            />
            <ResultRow
              label="Total cost"
              value={`$${result.totalCost.toFixed(2)}`}
              highlight
            />
          </div>
          {result.tips.length > 0 && (
            <StatusBanner
              tier={result.tier}
              headline={
                hasResaleCertificate
                  ? "Tax-exempt purchase"
                  : `$${result.taxOwed.toFixed(2)} sales tax owed`
              }
              tips={result.tips}
            />
          )}
        </>
      }
      history={
        <CalculatorHistory
          type="SALES_TAX"
          inputs={{
            purchasePrice,
            taxRate,
            hasResaleCertificate: String(hasResaleCertificate),
          }}
          result={result}
          onLoad={(loaded) => {
            setPurchasePrice(loaded.purchasePrice ?? "");
            setTaxRate(loaded.taxRate ?? "");
            setHasResaleCertificate(loaded.hasResaleCertificate === "true");
          }}
        />
      }
    />
  );
}
