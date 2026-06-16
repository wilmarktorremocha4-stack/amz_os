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

export default function MultiPackCalculatorPage() {
  const [singleUnitCost, setSingleUnitCost] = useState("");
  const [packQuantity, setPackQuantity] = useState("");
  const [packSellPrice, setPackSellPrice] = useState("");
  const [amazonFees, setAmazonFees] = useState("");
  const [shippingPerPack, setShippingPerPack] = useState("");

  const result = useMemo(() => {
    const singleCostNum = parseFloat(singleUnitCost) || 0;
    const qtyNum = parseFloat(packQuantity) || 0;
    const sellNum = parseFloat(packSellPrice) || 0;
    const feesNum = parseFloat(amazonFees) || 0;
    const shipNum = parseFloat(shippingPerPack) || 0;

    const packCost = singleCostNum * qtyNum;
    const totalCost = packCost + shipNum;
    const profitPerPack = sellNum - totalCost - feesNum;
    const margin = sellNum > 0 ? (profitPerPack / sellNum) * 100 : 0;
    const singleSellEquivalent = qtyNum > 0 ? sellNum / qtyNum : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    const singleUnitProfitEquivalent =
      qtyNum > 0 ? profitPerPack / qtyNum : 0;
    const singleUnitFullCost = qtyNum > 0 ? totalCost / qtyNum + feesNum / qtyNum : 0;

    if (qtyNum === 0 && singleCostNum === 0) {
      tips.push("Enter a unit cost and units per pack to evaluate this multi-pack.");
    } else if (qtyNum === 0 && sellNum > 0) {
      tier = "warn";
      tips.push("Units per pack is zero — enter how many units go in each pack.");
    } else if (profitPerPack < 0) {
      tier = "bad";
      tips.push(
        `Losing $${Math.abs(profitPerPack).toFixed(2)} per pack. Raise the pack price or reduce the pack quantity to lower per-pack cost.`,
      );
    } else if (profitPerPack === 0) {
      tier = "bad";
      tips.push(
        "Pack breaks even exactly — any return, damaged unit, or fee bump turns this into a loss.",
      );
    } else if (margin < 10) {
      tier = "bad";
      tips.push(
        `Margin of ${margin.toFixed(1)}% on this pack is too thin to absorb a single damaged or returned unit out of the ${qtyNum}-pack.`,
      );
    } else if (margin < 15) {
      tier = "warn";
      tips.push(
        "Bundling into multi-packs only helps if the margin holds up — consider a smaller pack size or higher price per pack.",
      );
    } else {
      tips.push(
        "Multi-pack pricing is outperforming a likely single-unit listing.",
      );
    }

    if (
      singleSellEquivalent > 0 &&
      singleUnitFullCost > 0 &&
      singleUnitProfitEquivalent > 0 &&
      qtyNum >= 2
    ) {
      const perUnitMargin =
        singleSellEquivalent > 0
          ? (singleUnitProfitEquivalent / singleSellEquivalent) * 100
          : 0;
      if (perUnitMargin < margin - 5) {
        tips.push(
          "Per-unit economics inside the pack are weaker than the headline pack margin suggests — verify Amazon fees scale correctly for multi-unit listings.",
        );
      }
    }

    if (qtyNum > 6 && profitPerPack > 0) {
      tips.push(
        `${qtyNum} units per pack increases weight/size tier risk for FBA — confirm the fee figure reflects the correct size tier for this pack.`,
      );
    }

    return {
      packCost,
      totalCost,
      profitPerPack,
      margin,
      singleSellEquivalent,
      tier,
      tips,
    };
  }, [
    singleUnitCost,
    packQuantity,
    packSellPrice,
    amazonFees,
    shippingPerPack,
  ]);

  return (
    <CalculatorLayout
      title="Multi-Pack Calculator"
      description="Check profitability of selling units as a multi-pack instead of singles."
      inputs={
        <>
          <Field
            label="Cost per single unit ($)"
            value={singleUnitCost}
            onChange={setSingleUnitCost}
          />
          <Field
            label="Units per pack"
            value={packQuantity}
            onChange={setPackQuantity}
          />
          <Field
            label="Pack sell price ($)"
            value={packSellPrice}
            onChange={setPackSellPrice}
          />
          <Field
            label="Amazon fees per pack ($)"
            value={amazonFees}
            onChange={setAmazonFees}
          />
          <Field
            label="Shipping/prep per pack ($)"
            value={shippingPerPack}
            onChange={setShippingPerPack}
          />
        </>
      }
      outputs={
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
            <ResultRow
              label="Pack cost"
              value={`$${result.packCost.toFixed(2)}`}
            />
            <ResultRow
              label="Profit per pack"
              value={`$${result.profitPerPack.toFixed(2)}`}
              highlight
            />
            <ResultRow label="Margin" value={`${result.margin.toFixed(1)}%`} />
            <ResultRow
              label="Effective price per unit"
              value={`$${result.singleSellEquivalent.toFixed(2)}`}
            />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={`$${result.profitPerPack.toFixed(2)} profit per pack`}
            tips={result.tips}
          />
        </>
      }
      history={
        <CalculatorHistory
          type="MULTI_PACK"
          inputs={{
            singleUnitCost,
            packQuantity,
            packSellPrice,
            amazonFees,
            shippingPerPack,
          }}
          result={result}
          onLoad={(loaded) => {
            setSingleUnitCost(loaded.singleUnitCost ?? "");
            setPackQuantity(loaded.packQuantity ?? "");
            setPackSellPrice(loaded.packSellPrice ?? "");
            setAmazonFees(loaded.amazonFees ?? "");
            setShippingPerPack(loaded.shippingPerPack ?? "");
          }}
        />
      }
    />
  );
}
