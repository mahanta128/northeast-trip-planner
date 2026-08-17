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
  icon: string;
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
  Assam: 1.0,
  Manipur: 1.1,
  Mizoram: 1.15,
  Nagaland: 1.2,
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
      name: "Winter", icon: "winter", months: "Dec–Feb",
      weather: "10–15°C in Shillong; foggy mornings, clear afternoons",
      pacing: "Comfortable pace; shorter daylight hours",
      roads: "Roads clear; occasional morning fog on Cherrapunji route",
      highlights: ["Crystal-clear Dawki river (lowest tourist crowds)", "Mawlynnong village at its clearest", "Shillong cafés and markets unhurried"],
      caveats: ["Cold at night — carry warm layers", "December weekends busy around Christmas"],
    },
    1: {
      name: "Spring", icon: "spring", months: "Mar–May",
      weather: "18–24°C; warm sunny days with clear visibility across Shillong and the plateau",
      pacing: "Ideal pace; long daylight, good roads",
      roads: "Best road conditions of the year; pre-monsoon showers possible in May",
      highlights: ["Dawki river vivid turquoise — best clarity before monsoon", "Nohkalikai hike comfortable in dry heat", "Mawlynnong and living root bridges without the monsoon crowds"],
      caveats: ["May humidity climbs fast; carry light rain gear", "Book accommodation early during long weekends"],
    },
    2: {
      name: "Monsoon", icon: "monsoon", months: "Jun–Sep",
      weather: "Cherrapunji gets 100mm+ rain per day; expect continuous rainfall across the state",
      pacing: "Slow travel — budget 1–2 extra days for weather delays",
      roads: "Cherrapunji road prone to landslides; check conditions before starting; avoid night driving",
      highlights: ["Waterfalls at full flow — 7 Sisters and Nohkalikai at their most dramatic", "Living root bridges surrounded by lush undergrowth", "Unique photography conditions (mist, green)"],
      caveats: ["Leech socks mandatory in forests", "Dawki river turns muddy — skip river camping", "Full waterproof gear required daily"],
    },
    3: {
      name: "Post-monsoon", icon: "autumn", months: "Oct–Nov",
      weather: "20–25°C; clear skies, minimal rain, rich green still visible",
      pacing: "Best overall season — ideal visibility and road conditions",
      roads: "Roads clear; rare residual landslide debris from September",
      highlights: ["Cherry Blossom Festival (November, Shillong) — Ward's Lake and Police Bazaar in full bloom", "Wangala Festival (November, Garo Hills)", "Dawki river clearing to vivid blue-green after monsoon"],
      caveats: ["November is peak season — book accommodation 2–3 weeks ahead", "Nights at altitude (Shillong, Cherrapunji) can be chilly"],
    },
  },
  "Arunachal Pradesh": {
    0: {
      name: "Winter", icon: "winter", months: "Dec–Feb",
      weather: "–5 to 10°C at Tawang; heavy snow possible above 3,000m",
      pacing: "Slow travel; plan for possible day-long delays at high passes",
      roads: "Sela Pass (4,170m) may close due to snow; check BRO updates daily",
      highlights: ["Snow-covered Tawang monastery — dramatic photography", "Quiet, uncrowded atmosphere"],
      caveats: ["Road closures common above Sela Pass", "Carry sub-zero gear for evenings", "ILP mandatory — apply 3–5 days before travel"],
    },
    1: {
      name: "Spring", icon: "spring", months: "Mar–May",
      weather: "10–20°C; rhododendrons bloom; roads reopen after winter closures",
      pacing: "Good travel pace; long days ideal for road trips",
      roads: "Post-winter repairs underway; some patches rough but passable",
      highlights: ["Rhododendron forests (March–April) along Sela Pass", "Ziro Valley paddy fields fresh green"],
      caveats: ["May rains start — pack accordingly", "ILP required for all Indian nationals"],
    },
    2: {
      name: "Monsoon", icon: "monsoon", months: "Jun–Sep",
      weather: "Heavy rain across state; flooding in lower valley regions",
      pacing: "Challenging travel — not recommended for first-timers",
      roads: "NH-13 and NH-15 frequently blocked by landslides; road trips can take 2× longer",
      highlights: ["Very lush, dramatic landscape for experienced travellers"],
      caveats: ["Roads unpredictable; flight to Itanagar recommended", "Ziro Music Festival (September) draws large crowds", "ILP required"],
    },
    3: {
      name: "Autumn", icon: "autumn", months: "Oct–Nov",
      weather: "12–22°C; clear skies; excellent mountain visibility",
      pacing: "Best season overall — optimal visibility and stable roads",
      roads: "Good conditions post-monsoon; best window for road travel",
      highlights: ["Crystal-clear Nuranang Falls", "Tawang Festival (October) with mask dances", "Mountain panoramas from Sela and Bomdila"],
      caveats: ["Peak season — book 3–4 weeks ahead", "ILP required — apply before booking transport"],
    },
  },
  Sikkim: {
    0: {
      name: "Winter", icon: "winter", months: "Dec–Feb",
      weather: "–5 to 10°C in North Sikkim; 5–15°C in Gangtok",
      pacing: "Moderate pace; shorter days; some routes restricted",
      roads: "North Sikkim roads may close after snowfall; Tsomgo lake partially frozen",
      highlights: ["Snow at Nathu La (4,310m)", "Quiet Gangtok in off-season", "Rumtek Monastery monastery atmosphere"],
      caveats: ["North Sikkim restricted zones need a Restricted Area Permit — book via local operator", "Heavy winter gear essential above 3,000m"],
    },
    1: {
      name: "Spring", icon: "spring", months: "Mar–May",
      weather: "10–20°C; peak rhododendron season March–April",
      pacing: "Best season — ideal for trekking and road trips",
      roads: "Good conditions; NH-10 clear; occasional pre-monsoon showers in May",
      highlights: ["Rhododendron bloom — highest density of species in India", "Pelling with clear Kanchenjunga views", "White-water rafting season opens"],
      caveats: ["Peak tourist season — book 3 weeks ahead for Pelling and Gangtok"],
    },
    2: {
      name: "Monsoon", icon: "monsoon", months: "Jun–Sep",
      weather: "Heavy rain; leech-active trails; frequent landslides on mountain roads",
      pacing: "Slow travel; trekking not advised",
      roads: "NH-10 (Siliguri–Gangtok) prone to landslides; North Sikkim often blocked",
      highlights: ["Lush green valleys", "Waterfalls visible from road"],
      caveats: ["Trekking inadvisable", "Road to North Sikkim frequently blocked", "Carry full rain gear"],
    },
    3: {
      name: "Autumn", icon: "autumn", months: "Oct–Nov",
      weather: "10–20°C; crystal-clear post-monsoon skies",
      pacing: "Second-best season; excellent mountain visibility",
      roads: "Good conditions; Kanchenjunga views sharp from Pelling and Goechala",
      highlights: ["Tsomgo lake vivid blue", "Best Kanchenjunga views from West Sikkim", "Dashain/Dussehra celebrations in Gangtok"],
      caveats: ["Book early — Dashain period sees high demand", "Festive crowds in Gangtok town"],
    },
  },
  Assam: {
    0: {
      name: "Winter", icon: "winter", months: "Dec–Feb",
      weather: "8–20°C in Guwahati; cool mornings, pleasant afternoons; Brahmaputra misty at dawn",
      pacing: "Comfortable pace; ideal for wildlife safaris",
      roads: "Roads clear; excellent conditions throughout the state",
      highlights: ["Kaziranga in peak safari season — best rhino and elephant sightings", "Majuli island calm and accessible", "Tea garden visits at their most peaceful"],
      caveats: ["Foggy mornings may delay early-morning safari starts", "December weekends busy around Christmas in Guwahati"],
    },
    1: {
      name: "Spring", icon: "spring", months: "Mar–May",
      weather: "20–32°C; warm and sunny; Brahmaputra levels rising slowly",
      pacing: "Good pace; long daylight hours ideal for sightseeing",
      roads: "Good road conditions; pre-monsoon humidity from May",
      highlights: ["Bihu festival (April) — traditional Assamese dance and celebrations", "Rhododendrons blooming in Haflong hills", "River cruises on Brahmaputra comfortable in March–April"],
      caveats: ["May heat can be intense in lowlands", "Book Kaziranga lodges well ahead for Bihu week"],
    },
    2: {
      name: "Monsoon", icon: "monsoon", months: "Jun–Sep",
      weather: "Heavy rainfall; Brahmaputra floods vast areas; humidity near 90%",
      pacing: "Slow travel; Kaziranga partially or fully closed due to flooding",
      roads: "NH-27 prone to flooding and landslides in hill sections; expect delays",
      highlights: ["Majuli island dramatic during high floods (experienced travellers only)", "Lush tea gardens at peak green"],
      caveats: ["Kaziranga National Park closed Jun–Oct — plan accordingly", "Flooding can cut off Majuli island for days", "Mosquito protection essential"],
    },
    3: {
      name: "Autumn", icon: "autumn", months: "Oct–Nov",
      weather: "18–28°C; clear skies; Brahmaputra returning to normal levels",
      pacing: "Best season — Kaziranga reopens, great wildlife conditions",
      roads: "Roads clear post-monsoon; occasional residual flooding on river plains",
      highlights: ["Kaziranga reopens (October) — first safaris of the season are exceptional", "Majuli accessible again by ferry; island life resumes", "Raas Mahotsav (November, Majuli) — Vaishnavite dance-drama festival"],
      caveats: ["October–November is peak season — book Kaziranga lodges 4–6 weeks ahead", "Festive crowds during Raas Mahotsav on Majuli"],
    },
  },
  Manipur: {
    0: {
      name: "Winter", icon: "winter", months: "Dec–Feb",
      weather: "5–18°C in Imphal; cold nights, pleasant afternoons; Loktak Lake misty",
      pacing: "Comfortable pace; good visibility for nature and cultural sites",
      roads: "Roads clear; hill routes may have morning frost",
      highlights: ["Loktak Lake calm and reflective — best photography of the year", "Sangai Deer Festival (November–December) if timed right", "Ima Keithel market vibrant in winter"],
      caveats: ["Cold nights in hill districts — carry warm layers", "Some hill routes icy before dawn"],
    },
    1: {
      name: "Spring", icon: "spring", months: "Mar–May",
      weather: "18–28°C; warm and dry; Shirui Lily blooms in May at Shirui Kashong Peak",
      pacing: "Best travel window; pleasant temperatures across the state",
      roads: "Good conditions; minor roadworks on NH-2 in March",
      highlights: ["Shirui Lily Festival (May, Ukhrul) — the endemic lily blooms only here", "Sangai (brow-antlered deer) active in Keibul Lamjao NP", "Yaoshang (Holi-equivalent, Feb–Mar) — Manipur's biggest festival"],
      caveats: ["Book accommodation early for Shirui Lily Festival", "May heat in Imphal valley can be warm"],
    },
    2: {
      name: "Monsoon", icon: "monsoon", months: "Jun–Sep",
      weather: "Heavy rain; Loktak Lake swells; humidity high across the state",
      pacing: "Challenging travel; not recommended for first-timers",
      roads: "Imphal–Moreh highway prone to landslides; hill roads often blocked",
      highlights: ["Lush green Manipur valley — dramatic for photography"],
      caveats: ["Landslides common on all hill routes", "Carry full rain gear", "Some tourist sites inaccessible"],
    },
    3: {
      name: "Autumn", icon: "autumn", months: "Oct–Nov",
      weather: "15–25°C; clear post-monsoon skies; Loktak Lake at its best",
      pacing: "Second-best season; excellent for cultural experiences",
      roads: "Good conditions; roads cleared after monsoon",
      highlights: ["Loktak Lake vivid blue-green — best boat rides", "Sangai Festival (November) — Manipur's largest tourism festival", "Traditional Meitei dance and craft shows"],
      caveats: ["Sangai Festival week (mid-November) sees large crowds — book ahead", "Nights get cold; carry a light jacket"],
    },
  },
  Mizoram: {
    0: {
      name: "Winter", icon: "winter", months: "Dec–Feb",
      weather: "8–20°C in Aizawl; cold at Phawngpui (Blue Mountain); clear skies most days",
      pacing: "Comfortable pace; excellent visibility for mountain views",
      roads: "Roads clear; Phawngpui Peak trail best accessed in these months",
      highlights: ["Phawngpui (Blue Mountain) summit hike — clearest views of the year", "Aizawl city relaxed; quiet and clean", "Chapchar Kut festival (March, transitional) preparations begin"],
      caveats: ["Cold at higher altitudes — carry warm gear for Phawngpui", "December fog in valleys can reduce visibility"],
    },
    1: {
      name: "Spring", icon: "spring", months: "Mar–May",
      weather: "18–28°C; warm days; Chapchar Kut spring festival transforms the state",
      pacing: "Best travel window; long days and festive atmosphere",
      roads: "Good conditions; pre-monsoon showers begin in May",
      highlights: ["Chapchar Kut (March) — biggest Mizo festival with traditional Cheraw bamboo dance", "Vantawng Falls accessible at comfortable water levels", "Champhai valley lush and scenic"],
      caveats: ["Chapchar Kut sees very high crowds — book accommodation 3 weeks early", "May humidity rises; carry light rain gear"],
    },
    2: {
      name: "Monsoon", icon: "monsoon", months: "Jun–Sep",
      weather: "Very heavy rainfall; Mizoram receives among the highest rainfall in India",
      pacing: "Difficult travel; Vantawng Falls at full dramatic glory but roads challenging",
      roads: "Landslides frequent on all hill roads; NH-54 vulnerable; check daily updates",
      highlights: ["Vantawng Falls at maximum flow — most dramatic waterfall view of the year"],
      caveats: ["Not recommended for first-time visitors", "Carry full rain gear and sturdy footwear", "Some roads may be closed for days after heavy rain"],
    },
    3: {
      name: "Autumn", icon: "autumn", months: "Oct–Nov",
      weather: "15–25°C; clear skies; crisp air across the hills",
      pacing: "Good season — roads clear and landscape richly green",
      roads: "Good conditions post-monsoon; occasional residual debris on narrow hill roads",
      highlights: ["Phawngpui hike excellent — autumn clarity and green slopes", "Aizawl food scene and local markets at their liveliest", "Palak Lake visits comfortable in cool weather"],
      caveats: ["Fewer tourists in November — most places quiet; some seasonal businesses may close", "Book ahead for Phawngpui trek permits"],
    },
  },
  Nagaland: {
    0: {
      name: "Winter", icon: "winter", months: "Dec–Feb",
      weather: "5–15°C in Kohima; colder in higher ranges; Hornbill Festival peaks in December",
      pacing: "Lively in December; quieter in Jan–Feb",
      roads: "Roads clear; Dzukou Valley base reachable; summit trail may be frosty",
      highlights: ["Hornbill Festival (1–10 December, Kisama) — all Naga tribes under one roof; unmissable", "Kohima War Cemetery — poignant and uncrowded in January", "Dzukou Valley hike in clear winter air"],
      caveats: ["Hornbill Festival requires accommodation booked 2 months ahead — fills up fast", "Carry warm layers; Kohima nights below 10°C in December–January"],
    },
    1: {
      name: "Spring", icon: "spring", months: "Mar–May",
      weather: "15–25°C; rhododendrons bloom; Dzukou Valley turns vivid green",
      pacing: "Excellent travel conditions; best window for trekking",
      roads: "Good conditions; pre-monsoon showers begin in late May",
      highlights: ["Dzukou Valley full of wildflowers — rhododendron and Dzukou lily bloom", "Kohima market and Naga food trail active", "Sekrenyi festival (Feb–Mar) — Angami Naga purification festival"],
      caveats: ["May heat in lower Nagaland can be intense", "Book Dzukou Valley camping permits in advance"],
    },
    2: {
      name: "Monsoon", icon: "monsoon", months: "Jun–Sep",
      weather: "Heavy rainfall; Nagaland hills receive 1,500–2,500mm annual rain",
      pacing: "Challenging; trekking not advised; Dzukou Valley inaccessible due to leeches and slippery trails",
      roads: "Landslides on NH-29 and NH-702; some routes blocked for days",
      highlights: ["Lush, intensely green Naga hills — good for photography from roads"],
      caveats: ["Dzukou Valley trekking closed effectively due to conditions", "Leech socks mandatory for any forest walk", "Avoid overnight treks"],
    },
    3: {
      name: "Autumn", icon: "autumn", months: "Oct–Nov",
      weather: "12–22°C; clear skies; pre-festival energy building across the state",
      pacing: "Best overall season; Hornbill preparations begin; trekking excellent",
      roads: "Good conditions; roads clear post-monsoon",
      highlights: ["Dzukou Valley trek — best conditions of the year; valley lush and trail dry", "Pre-Hornbill cultural events in Kohima begin in late November", "Naga village homestays at their most welcoming"],
      caveats: ["Early December Hornbill bookings happen in October–November — act early", "Crowds build towards December in Kohima"],
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
    required: false,
    name: "",
    applyAt: "",
    cost: "",
    validity: "",
    tip: "No permit required for most Sikkim destinations. North Sikkim restricted zones (Lachung, Lachen, Gurudongmar) require a Restricted Area Permit — apply via a registered local tour operator 2–3 weeks ahead.",
  },
  Assam: {
    required: false,
    name: "",
    applyAt: "",
    cost: "",
    validity: "",
    tip: "No permit required for Indian nationals visiting Assam. Foreign nationals need a Protected Area Permit for some border regions; check with your tour operator.",
  },
  Manipur: {
    required: true,
    name: "Inner Line Permit (ILP)",
    applyAt: "Online at manipurilp.nic.in · At Manipur government offices in Delhi, Kolkata, Guwahati · At Imphal airport on arrival",
    cost: "₹100–₹200 (Indian nationals)",
    validity: "Up to 30 days; extendable",
    tip: "Apply at least 3 days before travel. Carry printed copies — checked at all border entry points and major checkposts.",
  },
  Mizoram: {
    required: true,
    name: "Inner Line Permit (ILP)",
    applyAt: "Online at mizoramilp.nic.in · At Mizoram House offices in Delhi, Kolkata, Guwahati, Silchar · At Lengpui airport on arrival",
    cost: "₹120–₹300 (Indian nationals)",
    validity: "Up to 15 days; extendable",
    tip: "Aizawl airport ILP desk processes on arrival, but applying online 2–3 days before is faster. Carry 2 printed copies.",
  },
  Nagaland: {
    required: true,
    name: "Inner Line Permit (ILP)",
    applyAt: "Online at nagalandilp.in · At Nagaland House offices in Delhi, Kolkata, Guwahati · At Dimapur airport or railway station",
    cost: "₹100–₹200 (Indian nationals)",
    validity: "Up to 30 days; extendable",
    tip: "Apply at least 3 days before. During Hornbill Festival (December 1–10), apply 2 weeks ahead as demand is very high. Show permit at all district entry checkposts.",
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
