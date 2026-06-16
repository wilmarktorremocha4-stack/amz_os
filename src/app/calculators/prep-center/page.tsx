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

export default function PrepCenterCalculatorPage() {
  const [units, setUnits] = useState("");
  const [prepFeePerUnit, setPrepFeePerUnit] = useState("");
  const [shippingToPrepCenter, setShippingToPrepCenter] = useState("");
  const [shippingToAmazon, setShippingToAmazon] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [productCostPerUnit, setProductCostPerUnit] = useState("");

  const result = useMemo(() => {
    const unitsNum = parseFloat(units) || 0;
    const prepFeeNum = parseFloat(prepFeePerUnit) || 0;
    const inboundShipNum = parseFloat(shippingToPrepCenter) || 0;
    const outboundShipNum = parseFloat(shippingToAmazon) || 0;
    const sellNum = parseFloat(sellPrice) || 0;
    const productCostNum = parseFloat(productCostPerUnit) || 0;

    const totalPrepCost = unitsNum * prepFeeNum;
    const totalShipping = inboundShipNum + outboundShipNum;
    const totalLogisticsCost = totalPrepCost + totalShipping;
    const logisticsCostPerUnit =
      unitsNum > 0 ? totalLogisticsCost / unitsNum : 0;
    const fullCostPerUnit = productCostNum + logisticsCostPerUnit;
    const marginAfterLogistics =
      sellNum > 0 ? ((sellNum - fullCostPerUnit) / sellNum) * 100 : 0;

    let tier: StatusTier = "good";
    const tips: string[] = [];
    const logisticsSharePct = sellNum > 0 ? (logisticsCostPerUnit / sellNum) * 100 : 0;

    if (unitsNum === 0 && productCostNum === 0) {
      tips.push("Enter units, product cost, and prep/shipping fees to evaluate logistics cost.");
    } else if (unitsNum === 0) {
      tier = "warn";
      tips.push(
        "No units entered — shipping costs can't be spread per-unit without a unit count, so per-unit figures will read as zero.",
      );
    } else if (sellNum === 0) {
      tier = "warn";
      tips.push("Add a sell price to see margin after prep and shipping costs.");
    } else if (fullCostPerUnit > sellNum) {
      tier = "bad";
      tips.push(
        `Prep + shipping + product cost ($${fullCostPerUnit.toFixed(2)}) exceeds sell price ($${sellNum.toFixed(2)}) — this won't be profitable through a prep center at this volume.`,
      );
    } else if (fullCostPerUnit === sellNum) {
      tier = "bad";
      tips.push(
        "Full cost exactly equals sell price — break-even before Amazon fees means a guaranteed loss once referral/FBA fees apply.",
      );
    } else if (logisticsSharePct > 25) {
      tier = "bad";
      tips.push(
        `Prep + shipping is eating ${logisticsSharePct.toFixed(0)}% of the sell price — this is too high to be sustainable. A much larger shipment or a cheaper prep center quote is needed.`,
      );
    } else if (logisticsSharePct > 15) {
      tier = "warn";
      tips.push(
        `Prep center + shipping is eating ${logisticsSharePct.toFixed(0)}% of the sell price — a larger shipment could spread fixed shipping costs further and lower this.`,
      );
    } else if (unitsNum < 25 && (inboundShipNum > 0 || outboundShipNum > 0)) {
      tips.push(
        "Small shipment size means fixed shipping costs are spread thin — consolidating into larger, less frequent shipments usually lowers cost per unit.",
      );
    } else {
      tips.push(
        "Prep center costs are a reasonable share of the sell price at this volume.",
      );
    }

    if (marginAfterLogistics > 0 && marginAfterLogistics < 10 && fullCostPerUnit < sellNum) {
      tips.push(
        `Margin after logistics is only ${marginAfterLogistics.toFixed(1)}% — Amazon referral and FBA fees haven't even been subtracted yet, so real margin will likely go negative.`,
      );
    }

    return {
      totalPrepCost,
      totalShipping,
      logisticsCostPerUnit,
      fullCostPerUnit,
      marginAfterLogistics,
      tier,
      tips,
    };
  }, [
    units,
    prepFeePerUnit,
    shippingToPrepCenter,
    shippingToAmazon,
    sellPrice,
    productCostPerUnit,
  ]);

  return (
    <CalculatorLayout
      title="Prep Center Calculator"
      description="Roll prep fees and two-leg shipping (to prep center, then to Amazon) into your true cost per unit."
      inputs={
        <>
          <Field label="Units in shipment" value={units} onChange={setUnits} />
          <Field
            label="Product cost per unit ($)"
            value={productCostPerUnit}
            onChange={setProductCostPerUnit}
          />
          <Field
            label="Prep fee per unit ($)"
            value={prepFeePerUnit}
            onChange={setPrepFeePerUnit}
          />
          <Field
            label="Shipping to prep center ($)"
            value={shippingToPrepCenter}
            onChange={setShippingToPrepCenter}
            suffix="total"
          />
          <Field
            label="Shipping to Amazon ($)"
            value={shippingToAmazon}
            onChange={setShippingToAmazon}
            suffix="total"
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
              label="Total prep cost"
              value={`$${result.totalPrepCost.toFixed(2)}`}
            />
            <ResultRow
              label="Total shipping"
              value={`$${result.totalShipping.toFixed(2)}`}
            />
            <ResultRow
              label="Logistics cost per unit"
              value={`$${result.logisticsCostPerUnit.toFixed(2)}`}
            />
            <ResultRow
              label="Full cost per unit"
              value={`$${result.fullCostPerUnit.toFixed(2)}`}
              highlight
            />
            <ResultRow
              label="Margin after logistics"
              value={`${result.marginAfterLogistics.toFixed(1)}%`}
            />
          </div>
          <StatusBanner
            tier={result.tier}
            headline={`$${result.fullCostPerUnit.toFixed(2)} true cost per unit through a prep center`}
            tips={result.tips}
          />
        </>
      }
      history={
        <CalculatorHistory
          type="PREP_CENTER"
          inputs={{
            units,
            prepFeePerUnit,
            shippingToPrepCenter,
            shippingToAmazon,
            sellPrice,
            productCostPerUnit,
          }}
          result={result}
          onLoad={(loaded) => {
            setUnits(loaded.units ?? "");
            setPrepFeePerUnit(loaded.prepFeePerUnit ?? "");
            setShippingToPrepCenter(loaded.shippingToPrepCenter ?? "");
            setShippingToAmazon(loaded.shippingToAmazon ?? "");
            setSellPrice(loaded.sellPrice ?? "");
            setProductCostPerUnit(loaded.productCostPerUnit ?? "");
          }}
        />
      }
    />
  );
}
