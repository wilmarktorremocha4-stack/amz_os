/**
 * Amazon FBA fee calculations based on Amazon's published fee schedules.
 * Source: https://sellercentral.amazon.com/help/hub/reference/external/GPDC3KPYAGDTVDJP
 * Last updated: 2025 fee schedule (effective January 15, 2025)
 */

export type SizeTier =
  | "small_standard"
  | "large_standard"
  | "small_oversize"
  | "medium_oversize"
  | "large_oversize"
  | "special_oversize";

export interface ProductDimensions {
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightLb: number;
  price: number;
  category: string;
}

export interface FbaFeeResult {
  sizeTier: SizeTier;
  sizeTierLabel: string;
  dimensionalWeightLb: number;
  billableWeightLb: number;
  fulfillmentFee: number;
  referralFee: number;
  referralFeeRate: number;
  totalFees: number;
  netProfit: number;
  margin: number;
  roi: number;
}

/** Longest side, median, and shortest sorted */
function sortedDims(l: number, w: number, h: number): [number, number, number] {
  const dims = [l, w, h].sort((a, b) => b - a);
  return [dims[0], dims[1], dims[2]];
}

export function getSizeTier(dims: ProductDimensions): SizeTier {
  const { lengthIn: l, widthIn: w, heightIn: h, weightLb } = dims;
  const [longest, median, shortest] = sortedDims(l, w, h);
  const girth = 2 * (median + shortest);
  const lengthPlusGirth = longest + girth;

  // Small standard: ≤ 15" x 12" x 0.75", ≤ 16 oz
  if (longest <= 15 && median <= 12 && shortest <= 0.75 && weightLb <= 1) {
    return "small_standard";
  }

  // Large standard: ≤ 18" x 14" x 8", ≤ 20 lb
  if (longest <= 18 && median <= 14 && shortest <= 8 && weightLb <= 20) {
    return "large_standard";
  }

  // Small oversize: longest ≤ 60", ≤ 30" width, ≤ 70 lb, length+girth ≤ 130"
  if (longest <= 60 && median <= 30 && weightLb <= 70 && lengthPlusGirth <= 130) {
    return "small_oversize";
  }

  // Medium oversize: longest ≤ 108", ≤ 150 lb, length+girth ≤ 130"
  if (longest <= 108 && weightLb <= 150 && lengthPlusGirth <= 130) {
    return "medium_oversize";
  }

  // Large oversize: longest ≤ 108", ≤ 150 lb
  if (longest <= 108 && weightLb <= 150) {
    return "large_oversize";
  }

  return "special_oversize";
}

export function getSizeTierLabel(tier: SizeTier): string {
  const labels: Record<SizeTier, string> = {
    small_standard: "Small Standard",
    large_standard: "Large Standard",
    small_oversize: "Small Oversize",
    medium_oversize: "Medium Oversize",
    large_oversize: "Large Oversize",
    special_oversize: "Special Oversize",
  };
  return labels[tier];
}

/** Dimensional weight for oversize (Amazon uses 139 divisor) */
function dimWeightLb(l: number, w: number, h: number): number {
  return (l * w * h) / 139;
}

/**
 * FBA fulfillment fees — 2025 US schedule.
 * Source: Amazon Seller Central fee schedule (effective Jan 15, 2025)
 */
export function getFulfillmentFee(dims: ProductDimensions, tier: SizeTier): number {
  const { lengthIn: l, widthIn: w, heightIn: h, weightLb } = dims;
  const oz = weightLb * 16;

  if (tier === "small_standard") {
    if (oz <= 2) return 3.06;
    if (oz <= 4) return 3.15;
    if (oz <= 6) return 3.24;
    if (oz <= 8) return 3.33;
    if (oz <= 10) return 3.43;
    if (oz <= 12) return 3.52;
    if (oz <= 14) return 3.58;
    return 3.77; // ≤ 16 oz
  }

  if (tier === "large_standard") {
    const dimW = dimWeightLb(l, w, h);
    const billable = Math.max(weightLb, dimW);

    if (billable <= 0.25) return 3.86;
    if (billable <= 0.5) return 4.08;
    if (billable <= 0.75) return 4.24;
    if (billable <= 1) return 4.75;
    if (billable <= 1.5) return 5.40;
    if (billable <= 2) return 5.69;
    if (billable <= 2.5) return 6.10;
    if (billable <= 3) return 6.39;
    // 3+ lb to 20 lb: $6.39 + $0.16 per 0.5 lb above 3 lb
    return 6.39 + Math.ceil((billable - 3) / 0.5) * 0.16;
  }

  if (tier === "small_oversize") {
    const dimW = dimWeightLb(l, w, h);
    const billable = Math.max(weightLb, dimW);
    if (billable <= 1) return 9.61;
    if (billable <= 2) return 10.13;
    // $10.13 + $0.42 per lb above 2 lb, up to 70 lb
    return 10.13 + Math.ceil(billable - 2) * 0.42;
  }

  if (tier === "medium_oversize") {
    const dimW = dimWeightLb(l, w, h);
    const billable = Math.max(weightLb, dimW);
    if (billable <= 2) return 16.56;
    return 16.56 + Math.ceil(billable - 2) * 0.42;
  }

  if (tier === "large_oversize") {
    const dimW = dimWeightLb(l, w, h);
    const billable = Math.max(weightLb, dimW);
    if (billable <= 90) return 89.98;
    return 89.98 + (billable - 90) * 0.83;
  }

  // Special oversize
  const dimW = dimWeightLb(l, w, h);
  const billable = Math.max(weightLb, dimW);
  return 157.35 + (billable - 90) * 0.83;
}

/**
 * Amazon referral fees by category (2025).
 * Source: https://sellercentral.amazon.com/help/hub/reference/external/GTG4BAWSY39Z98Z3
 * Returns [rate, minimum]
 */
export const AMAZON_CATEGORIES: Record<string, { rate: number; minimum: number; label: string }> = {
  automotive: { rate: 0.12, minimum: 0.30, label: "Automotive" },
  baby_products: { rate: 0.08, minimum: 0.30, label: "Baby Products" },
  beauty: { rate: 0.08, minimum: 0.30, label: "Beauty & Personal Care" },
  books: { rate: 0.15, minimum: 0.00, label: "Books" },
  camera: { rate: 0.08, minimum: 0.30, label: "Camera & Photo" },
  clothing: { rate: 0.17, minimum: 0.30, label: "Clothing & Accessories" },
  computers: { rate: 0.08, minimum: 0.30, label: "Computers" },
  consumer_electronics: { rate: 0.08, minimum: 0.30, label: "Consumer Electronics" },
  electronics_accessories: { rate: 0.15, minimum: 0.30, label: "Electronics Accessories" },
  furniture: { rate: 0.15, minimum: 0.30, label: "Furniture" },
  grocery: { rate: 0.08, minimum: 0.30, label: "Grocery & Gourmet Food" },
  handmade: { rate: 0.15, minimum: 0.30, label: "Handmade" },
  health: { rate: 0.08, minimum: 0.30, label: "Health & Household" },
  home: { rate: 0.15, minimum: 0.30, label: "Home & Kitchen" },
  industrial: { rate: 0.12, minimum: 0.30, label: "Industrial & Scientific" },
  jewelry: { rate: 0.20, minimum: 0.30, label: "Jewelry" },
  kitchen: { rate: 0.15, minimum: 0.30, label: "Kitchen & Dining" },
  luggage: { rate: 0.15, minimum: 0.30, label: "Luggage & Travel Gear" },
  major_appliances: { rate: 0.08, minimum: 0.30, label: "Major Appliances" },
  music: { rate: 0.15, minimum: 0.00, label: "Music" },
  musical_instruments: { rate: 0.15, minimum: 0.30, label: "Musical Instruments" },
  office: { rate: 0.15, minimum: 0.30, label: "Office Products" },
  outdoor: { rate: 0.15, minimum: 0.30, label: "Outdoor" },
  pet: { rate: 0.15, minimum: 0.30, label: "Pet Supplies" },
  shoes: { rate: 0.15, minimum: 0.30, label: "Shoes, Handbags & Sunglasses" },
  software: { rate: 0.15, minimum: 0.00, label: "Software & Computer Games" },
  sports: { rate: 0.15, minimum: 0.30, label: "Sports & Outdoors" },
  tools: { rate: 0.15, minimum: 0.30, label: "Tools & Home Improvement" },
  toys: { rate: 0.15, minimum: 0.30, label: "Toys & Games" },
  video_games: { rate: 0.15, minimum: 0.00, label: "Video Games" },
  watches: { rate: 0.16, minimum: 0.30, label: "Watches" },
};

export function getReferralFee(price: number, categoryKey: string): { fee: number; rate: number } {
  const cat = AMAZON_CATEGORIES[categoryKey] ?? { rate: 0.15, minimum: 0.30, label: "Other" };
  const fee = Math.max(price * cat.rate, cat.minimum);
  return { fee, rate: cat.rate };
}

export function calculateFbaFees(dims: ProductDimensions, costOfGoods = 0): FbaFeeResult {
  const tier = getSizeTier(dims);
  const fulfillmentFee = getFulfillmentFee(dims, tier);
  const { fee: referralFee, rate: referralFeeRate } = getReferralFee(dims.price, dims.category);
  const totalFees = fulfillmentFee + referralFee;
  const netProfit = dims.price - totalFees - costOfGoods;
  const margin = dims.price > 0 ? (netProfit / dims.price) * 100 : 0;
  const roi = costOfGoods > 0 ? (netProfit / costOfGoods) * 100 : 0;

  const [l, w, h] = [dims.lengthIn, dims.widthIn, dims.heightIn];
  const dimensionalWeightLb = dimWeightLb(l, w, h);
  const billableWeightLb =
    tier === "small_standard" ? dims.weightLb : Math.max(dims.weightLb, dimensionalWeightLb);

  return {
    sizeTier: tier,
    sizeTierLabel: getSizeTierLabel(tier),
    dimensionalWeightLb,
    billableWeightLb,
    fulfillmentFee,
    referralFee,
    referralFeeRate,
    totalFees,
    netProfit,
    margin,
    roi,
  };
}
