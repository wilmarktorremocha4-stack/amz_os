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
    if (sellNum > 0 && fullCostPerUnit >= sellNum) {
      tier = "bad";
      tips.push(
        "Prep + shipping pushes total cost above sell price — this won't be profitable through a prep center at this volume.",
      );
    } else if (unitsNum > 0 && logisticsCostPerUnit / (sellNum || 1) > 0.15) {
      tier = "warn";
      tips.push(
        "Prep center + shipping is eating over 15% of the sell price — a larger shipment could spread fixed shipping costs further and lower this.",
      );
    } else {
      tips.push(
        "Prep center costs are a reasonable share of the sell price at this volume.",
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
