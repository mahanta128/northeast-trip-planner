export const TRIP_TIERS = [
  {
    id: "budget" as const,
    label: "Budget Explorer",
    baseRate: 2500,
    icon: "🏕",
    description: "Homestays · Shared transport · Authentic local dining",
  },
  {
    id: "comfortable" as const,
    label: "Comfortable Trip",
    baseRate: 5500,
    icon: "🏨",
    description: "3-star stays · Mixed transport · Breakfast included",
  },
  {
    id: "premium" as const,
    label: "Premium Escape",
    baseRate: 12000,
    icon: "✦",
    description: "Luxury resorts · Tea bungalows · Private SUV · Dedicated driver",
  },
] as const;

export type TierId = (typeof TRIP_TIERS)[number]["id"];

export function getGroupMultiplier(travelers: number): number {
  const discount = (travelers - 1) * 0.04;
  return 1 - Math.min(discount, 0.2);
}

export function computeTripCost(
  baseRate: number,
  travelers: number,
  days: number
): { total: number; perPerson: number; discountPct: number } {
  const multiplier = getGroupMultiplier(travelers);
  const total = Math.round(baseRate * multiplier * travelers * days);
  const perPerson = Math.round(total / travelers);
  const discountPct = Math.round((1 - multiplier) * 100);
  return { total, perPerson, discountPct };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getTravelerHint(travelers: number): string {
  if (travelers === 1) return "Perfect for solo travel";
  if (travelers === 2) return "Great for couples";
  if (travelers <= 5) return "Better value with shared transport";
  return "Private SUVs become cost effective";
}
