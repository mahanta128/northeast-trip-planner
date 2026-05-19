// ─── Types ─────────────────────────────────────────────────────

export type BudgetTier = "Budget" | "Comfortable" | "Premium";

export interface ComputedBudget {
  min: number;
  max: number;
  formatted: string;
  breakdown: { transport: string; stay: string; food: string; local: string };
}

export interface SeasonData {
  name: string;
  emoji: string;
  months: string;
  weather: string;
  pacing: string;
  roads: string;
  highlights: string[];
  caveats: string[];
}

export interface PermitData {
  required: boolean;
  name: string;
  applyAt: string;
  cost: string;
  validity: string;
  tip: string;
}

export interface FestivalData {
  name: string;
  destination: string;
  month: number;
  duration: string;
  location: string;
  tip: string;
}

// ─── Pricing Engine ────────────────────────────────────────────

interface TierRates {
  transportRange: [number, number];      // per person, round trip
  stayPerNightRange: [number, number];   // per room per night (always 2-sharing for 2+)
  foodPerDayRange: [number, number];     // per person per day
  localPerPersonDayRange: [number, number]; // per person per day — fixed, not split
}

const DEST_MULTIPLIER: Record<string, number> = {
  Meghalaya: 1.0,
  "Arunachal Pradesh": 1.35,
  Sikkim: 1.1,
};

const TIER_RATES: Record<BudgetTier, TierRates> = {
  Budget: {
    transportRange: [19000, 27000],
    stayPerNightRange: [2500, 4800],
    foodPerDayRange: [800, 1200],
    localPerPersonDayRange: [1000, 1400],
  },
  Comfortable: {
    transportRange: [31000, 44000],
    stayPerNightRange: [4500, 8000],
    foodPerDayRange: [1400, 2000],
    localPerPersonDayRange: [1250, 2000],
  },
  Premium: {
    transportRange: [54000, 70000],
    stayPerNightRange: [9000, 15000],
    foodPerDayRange: [2800, 4000],
    localPerPersonDayRange: [2500, 3500],
  },
};

function fmtINR(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${Math.round(n / 1000)}k`;
}

export function fmtRange(min: number, max: number): string {
  return `${fmtINR(min)}–${fmtINR(max)}`;
}

export function computeBudget(
  tier: BudgetTier,
  days: number,
  travelers: number,
  destination = "Meghalaya"
): ComputedBudget {
  const rates = TIER_RATES[tier];
  const mult = DEST_MULTIPLIER[destination] ?? 1.0;
  const nights = Math.max(days - 1, 1);
  const travelDays = Math.max(days - 1, 1);

  // Solo pays full room; 2+ always split 2-per-room — the only group saving.
  // Transport, food, and local are all flat per-person: adding travelers doesn't change them.
  const sharing = travelers === 1 ? 1 : 2;

  const tMin = Math.round(rates.transportRange[0] * mult);
  const tMax = Math.round(rates.transportRange[1] * mult);
  const sMin = Math.round((rates.stayPerNightRange[0] / sharing) * nights);
  const sMax = Math.round((rates.stayPerNightRange[1] / sharing) * nights);
  const fMin = Math.round(rates.foodPerDayRange[0] * mult * days);
  const fMax = Math.round(rates.foodPerDayRange[1] * mult * days);
  const lMin = Math.round(rates.localPerPersonDayRange[0] * mult * travelDays);
  const lMax = Math.round(rates.localPerPersonDayRange[1] * mult * travelDays);

  const totalMin = Math.round((tMin + sMin + fMin + lMin) / 500) * 500;
  const totalMax = Math.round((tMax + sMax + fMax + lMax) / 500) * 500;

  return {
    min: totalMin,
    max: totalMax,
    formatted: fmtRange(totalMin, totalMax),
    breakdown: {
      transport: fmtRange(tMin, tMax),
      stay: fmtRange(sMin, sMax),
      food: fmtRange(fMin, fMax),
      local: fmtRange(lMin, lMax),
    },
  };
}

export function computeAllTiers(
  days: number,
  travelers: number,
  destination = "Meghalaya"
): Record<BudgetTier, ComputedBudget> {
  return {
    Budget: computeBudget("Budget", days, travelers, destination),
    Comfortable: computeBudget("Comfortable", days, travelers, destination),
    Premium: computeBudget("Premium", days, travelers, destination),
  };
}

// ─── Seasonal Data ─────────────────────────────────────────────

type SeasonMap = Record<number, SeasonData>; // 0=Winter 1=Spring 2=Monsoon 3=Autumn

const SEASONS: Record<string, SeasonMap> = {
  Meghalaya: {
    0: {
      name: "Winter", emoji: "❄️", months: "Dec–Feb",
      weather: "10–15°C in Shillong; foggy mornings, clear afternoons",
      pacing: "Comfortable pace; shorter daylight hours",
      roads: "Roads clear; occasional morning fog on Cherrapunji route",
      highlights: ["Crystal-clear Dawki river (lowest tourist crowds)", "Mawlynnong village at its clearest", "Shillong cafés and markets unhurried"],
      caveats: ["Cold at night — carry warm layers", "December weekends busy around Christmas"],
    },
    1: {
      name: "Spring", emoji: "🌸", months: "Mar–May",
      weather: "18–24°C; cherry blossoms bloom in Shillong in April",
      pacing: "Ideal pace; long daylight, good roads",
      roads: "Best road conditions of the year; pre-monsoon showers possible in May",
      highlights: ["Cherry Blossom Festival (April, Shillong)", "Dawki river vivid turquoise", "Nohkalikai hike comfortable in dry heat"],
      caveats: ["May humidity climbs fast; carry light rain gear", "Book Shillong stays early for April festival period"],
    },
    2: {
      name: "Monsoon", emoji: "🌧", months: "Jun–Sep",
      weather: "Cherrapunji gets 100mm+ rain per day; expect continuous rainfall across the state",
      pacing: "Slow travel — budget 1–2 extra days for weather delays",
      roads: "Cherrapunji road prone to landslides; check conditions before starting; avoid night driving",
      highlights: ["Waterfalls at full flow — 7 Sisters and Nohkalikai at their most dramatic", "Living root bridges surrounded by lush undergrowth", "Unique photography conditions (mist, green)"],
      caveats: ["Leech socks mandatory in forests", "Dawki river turns muddy — skip river camping", "Full waterproof gear required daily"],
    },
    3: {
      name: "Post-monsoon", emoji: "🍃", months: "Oct–Nov",
      weather: "20–25°C; clear skies, minimal rain, rich green still visible",
      pacing: "Best overall season — ideal visibility and road conditions",
      roads: "Roads clear; rare residual landslide debris from September",
      highlights: ["Best overall visibility across the state", "Wangala Festival (November, Garo Hills)", "Dawki river starts clearing to blue-green"],
      caveats: ["November is peak season — book accommodation 2–3 weeks ahead", "Nights at altitude (Shillong, Cherrapunji) can be chilly"],
    },
  },
  "Arunachal Pradesh": {
    0: {
      name: "Winter", emoji: "🏔", months: "Dec–Feb",
      weather: "–5 to 10°C at Tawang; heavy snow possible above 3,000m",
      pacing: "Slow travel; plan for possible day-long delays at high passes",
      roads: "Sela Pass (4,170m) may close due to snow; check BRO updates daily",
      highlights: ["Snow-covered Tawang monastery — dramatic photography", "Quiet, uncrowded atmosphere"],
      caveats: ["Road closures common above Sela Pass", "Carry sub-zero gear for evenings", "ILP mandatory — apply 3–5 days before travel"],
    },
    1: {
      name: "Spring", emoji: "🌺", months: "Mar–May",
      weather: "10–20°C; rhododendrons bloom; roads reopen after winter closures",
      pacing: "Good travel pace; long days ideal for road trips",
      roads: "Post-winter repairs underway; some patches rough but passable",
      highlights: ["Rhododendron forests (March–April) along Sela Pass", "Ziro Valley paddy fields fresh green"],
      caveats: ["May rains start — pack accordingly", "ILP required for all Indian nationals"],
    },
    2: {
      name: "Monsoon", emoji: "🌧", months: "Jun–Sep",
      weather: "Heavy rain across state; flooding in lower valley regions",
      pacing: "Challenging travel — not recommended for first-timers",
      roads: "NH-13 and NH-15 frequently blocked by landslides; road trips can take 2× longer",
      highlights: ["Very lush, dramatic landscape for experienced travellers"],
      caveats: ["Roads unpredictable; flight to Itanagar recommended", "Ziro Music Festival (September) draws large crowds", "ILP required"],
    },
    3: {
      name: "Autumn", emoji: "🍂", months: "Oct–Nov",
      weather: "12–22°C; clear skies; excellent mountain visibility",
      pacing: "Best season overall — optimal visibility and stable roads",
      roads: "Good conditions post-monsoon; best window for road travel",
      highlights: ["Crystal-clear Nuranang Falls", "Tawang Festival (October) with mask dances", "Mountain panoramas from Sela and Bomdila"],
      caveats: ["Peak season — book 3–4 weeks ahead", "ILP required — apply before booking transport"],
    },
  },
  Sikkim: {
    0: {
      name: "Winter", emoji: "❄️", months: "Dec–Feb",
      weather: "–5 to 10°C in North Sikkim; 5–15°C in Gangtok",
      pacing: "Moderate pace; shorter days; some routes restricted",
      roads: "North Sikkim roads may close after snowfall; Tsomgo lake partially frozen",
      highlights: ["Snow at Nathu La (4,310m)", "Quiet Gangtok in off-season", "Rumtek Monastery monastery atmosphere"],
      caveats: ["North Sikkim requires Protected Area Permit with advance approval", "Heavy winter gear essential above 3,000m"],
    },
    1: {
      name: "Spring", emoji: "🌸", months: "Mar–May",
      weather: "10–20°C; peak rhododendron season March–April",
      pacing: "Best season — ideal for trekking and road trips",
      roads: "Good conditions; NH-10 clear; occasional pre-monsoon showers in May",
      highlights: ["Rhododendron bloom — highest density of species in India", "Pelling with clear Kanchenjunga views", "White-water rafting season opens"],
      caveats: ["Peak tourist season — book 3 weeks ahead for Pelling and Gangtok"],
    },
    2: {
      name: "Monsoon", emoji: "🌧", months: "Jun–Sep",
      weather: "Heavy rain; leech-active trails; frequent landslides on mountain roads",
      pacing: "Slow travel; trekking not advised",
      roads: "NH-10 (Siliguri–Gangtok) prone to landslides; North Sikkim often blocked",
      highlights: ["Lush green valleys", "Waterfalls visible from road"],
      caveats: ["Trekking inadvisable", "Road to North Sikkim frequently blocked", "Carry full rain gear"],
    },
    3: {
      name: "Autumn", emoji: "🍂", months: "Oct–Nov",
      weather: "10–20°C; crystal-clear post-monsoon skies",
      pacing: "Second-best season; excellent mountain visibility",
      roads: "Good conditions; Kanchenjunga views sharp from Pelling and Goechala",
      highlights: ["Tsomgo lake vivid blue", "Best Kanchenjunga views from West Sikkim", "Dashain/Dussehra celebrations in Gangtok"],
      caveats: ["Book early — Dashain period sees high demand", "Festive crowds in Gangtok town"],
    },
  },
};

function monthToSeason(month: number): number {
  if (month === 12 || month <= 2) return 0;
  if (month <= 5) return 1;
  if (month <= 9) return 2;
  return 3;
}

export function getSeasonData(destination: string, month: number): SeasonData | null {
  return SEASONS[destination]?.[monthToSeason(month)] ?? null;
}

// ─── Permit Requirements ───────────────────────────────────────

export const PERMIT_INFO: Record<string, PermitData> = {
  Meghalaya: {
    required: false,
    name: "",
    applyAt: "",
    cost: "",
    validity: "",
    tip: "No permit required for Indian nationals visiting Meghalaya.",
  },
  "Arunachal Pradesh": {
    required: true,
    name: "Inner Line Permit (ILP)",
    applyAt: "Online at arunachalilp.com · At Dimapur, Guwahati, or Kolkata offices · At state border checkpoints",
    cost: "₹100 (residents) – ₹300–500 (others) + ₹50/week extension",
    validity: "Usually 30 days; extendable",
    tip: "Apply 3–5 days before travel. Carry 2 printed copies. Show at every checkpost.",
  },
  Sikkim: {
    required: true,
    name: "Protected Area Permit (PAP)",
    applyAt: "East Sikkim: free on arrival at Rangpo/Melli checkpost · North & West Sikkim: apply via District Collector or tourism office",
    cost: "Free for East Sikkim · ₹200–500 for restricted zones",
    validity: "15–30 days depending on zone",
    tip: "East Sikkim (Gangtok, Tsomgo) is permit-free. For Lachung/Lachen (North), apply 2–3 weeks ahead.",
  },
};

// ─── Festivals ─────────────────────────────────────────────────

export const FESTIVALS: FestivalData[] = [
  { name: "Cherry Blossom Festival",      destination: "Meghalaya",         month: 11, duration: "4 days",  location: "Shillong",            tip: "Ward's Lake and Police Bazaar; book hotels 3 weeks early" },
  { name: "Wangala (100 Drums Festival)", destination: "Meghalaya",         month: 11, duration: "2 days",  location: "Asanang, Garo Hills",  tip: "Harvest festival of the Garo tribe; traditional drumming and dance" },
  { name: "Shad Suk Mynsiem",             destination: "Meghalaya",         month: 4,  duration: "3 days",  location: "Shillong Polo Ground", tip: "Khasi thanksgiving dance — one of the most photographed festivals in NE" },
  { name: "Nongkrem Dance Festival",      destination: "Meghalaya",         month: 11, duration: "5 days",  location: "Smit village, Shillong",tip: "Royal Khasi dance in full traditional attire" },
  { name: "Hornbill Festival",            destination: "Nagaland",          month: 12, duration: "10 days", location: "Kisama, near Kohima",  tip: "All Naga tribes in one village; book stays 2 months early" },
  { name: "Tawang Festival",              destination: "Arunachal Pradesh", month: 10, duration: "3 days",  location: "Tawang",              tip: "Buddhist monastery dances at Tawang Gompa — check exact dates annually" },
  { name: "Ziro Music Festival",          destination: "Arunachal Pradesh", month: 9,  duration: "4 days",  location: "Ziro Valley",          tip: "Indie music in a stunning valley; camping tickets sell out fast" },
  { name: "Losar",                        destination: "Sikkim",            month: 2,  duration: "3 days",  location: "Gangtok & monasteries", tip: "Tibetan New Year; mask dances at Rumtek and Enchey monasteries" },
  { name: "Pang Lhabsol",                 destination: "Sikkim",            month: 8,  duration: "1 day",   location: "Gangtok",             tip: "Guardian deity festival; warrior dance at Tsuklakhang Palace" },
];

export function getFestivals(destination: string, month: number): FestivalData[] {
  return FESTIVALS.filter((f) => f.destination === destination && f.month === month);
}
