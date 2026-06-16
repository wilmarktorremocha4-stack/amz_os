type BrandScoreInput = {
  estimatedMonthlySales: number | null;
  sellerCount: number | null;
  avgPrice: number | null;
  reviewCount: number | null;
};

type ScoreComponent = { label: string; score: number | null; weight: number };

/**
 * Internal stand-in for SmartScout's opportunity score. There is no live
 * Amazon data feed — every input is manually researched and entered by the
 * user (storefront browsing, Keepa free lookups, etc). The score only
 * reflects what's been entered; missing fields are excluded rather than
 * guessed.
 */
export function computeBrandOpportunityScore(input: BrandScoreInput) {
  const components: ScoreComponent[] = [
    {
      label: "Demand (est. monthly sales)",
      score: clampScale(input.estimatedMonthlySales, 0, 50_000),
      weight: 0.35,
    },
    {
      label: "Low competition (fewer sellers)",
      score: invertClampScale(input.sellerCount, 0, 50),
      weight: 0.35,
    },
    {
      label: "Room to enter (fewer reviews)",
      score: invertClampScale(input.reviewCount, 0, 1000),
      weight: 0.15,
    },
    {
      label: "Price point (margin headroom)",
      score: clampScale(input.avgPrice, 0, 100),
      weight: 0.15,
    },
  ];

  const usable = components.filter((c) => c.score !== null);
  const score =
    usable.length === 0
      ? null
      : Math.round(
          usable.reduce((sum, c) => sum + c.score! * c.weight, 0) /
            usable.reduce((sum, c) => sum + c.weight, 0),
        );

  return {
    score,
    complete: usable.length === components.length,
    components,
  };
}

function clampScale(value: number | null, min: number, max: number) {
  if (value === null) return null;
  return Math.round((Math.min(Math.max(value, min), max) / max) * 100);
}

function invertClampScale(value: number | null, min: number, max: number) {
  const scaled = clampScale(value, min, max);
  return scaled === null ? null : 100 - scaled;
}
