// Meghalaya destination data — complements tripData.ts (budget/seasons/permits live there)

export interface Destination {
  name: string;
  region: string;
  tagline: string;
  distanceFromShillong: string;
  bestFor: string[];
  mustSee: string[];
  localTip: string;
  avoidThis: string;
  hiddenGem: string;
}

export interface Circuit {
  id: string;
  name: string;
  minDays: number;
  maxDays: number;
  hubs: string[];
  vibe: string[];
  summary: string;
}

export interface TransportOption {
  from: string;
  to: string;
  mode: string;
  duration: string;
  costRange: string;
  note: string;
}

export interface FoodSpot {
  name: string;
  location: string;
  mustTry: string[];
  priceRange: string;
  tip: string;
}

export interface StayArea {
  area: string;
  whyStayHere: string;
  budgetRange: string;
  comfortableRange: string;
  premiumRange: string;
  bestFor: string[];
}

// ─── Destinations ──────────────────────────────────────────────

export const DESTINATIONS: Destination[] = [
  {
    name: "Shillong",
    region: "East Khasi Hills",
    tagline: "Highland capital — gateway and base for all of Meghalaya",
    distanceFromShillong: "0 km",
    bestFor: ["city", "food", "music", "culture", "shopping"],
    mustSee: ["Ward's Lake", "Police Bazaar", "Don Bosco Museum", "Shillong Peak", "Elephant Falls"],
    localTip: "Eat at Trattoria near Police Bazaar for authentic Khasi jadoh — arrive before 1 pm or it sells out.",
    avoidThis: "Don't hire cabs from the airport queue — negotiate with drivers at the city stand for 40% less.",
    hiddenGem: "Lum Nehru Park on Sundays: locals gather for live music no tourist brochure mentions.",
  },
  {
    name: "Cherrapunji (Sohra)",
    region: "East Khasi Hills",
    tagline: "One of the wettest places on earth — waterfalls and canyon views",
    distanceFromShillong: "54 km",
    bestFor: ["waterfalls", "trekking", "photography", "nature"],
    mustSee: ["Nohkalikai Falls", "Seven Sisters Falls", "Mawsmai Cave", "Dainthlen Falls", "Eco Park viewpoint"],
    localTip: "Nohkalikai is best between 8–10 am before clouds roll in — afternoon mist often blocks the drop.",
    avoidThis: "Don't skip Dainthlen Falls for the tourist-heavy Eco Park — Dainthlen has zero crowds and better viewpoints.",
    hiddenGem: "Laitlyngkot village viewpoint 3 km before Sohra — panoramic canyon view with a single chai stall.",
  },
  {
    name: "Mawlynnong",
    region: "East Khasi Hills",
    tagline: "Asia's cleanest village — bamboo bridges and Bangladesh border view",
    distanceFromShillong: "90 km",
    bestFor: ["culture", "photography", "offbeat", "slow travel"],
    mustSee: ["Living root bridge (single-decker)", "Balancing rock", "Sky walk bamboo tower", "Bangladesh border viewpoint"],
    localTip: "Entry is ₹30 per person — pay at the gate, not to touts who approach near the car park.",
    avoidThis: "Don't visit on Sunday — nearly every homestay and food stall closes; the village feels abandoned.",
    hiddenGem: "Riwai village 1 km before Mawlynnong has a single-decker root bridge with zero queues.",
  },
  {
    name: "Dawki",
    region: "West Jaintia Hills",
    tagline: "Glass-bottomed river — boats appear to float in mid-air",
    distanceFromShillong: "96 km",
    bestFor: ["river", "photography", "camping", "nature"],
    mustSee: ["Umngot River boat ride", "Dawki suspension bridge", "Bangladesh border market"],
    localTip: "Book a flat-bottomed boat for ₹700–900 per boat (fits 4) — avoid the touts near the ramp who charge double.",
    avoidThis: "Don't visit between July and September — the river runs muddy brown during peak monsoon; clarity returns October.",
    hiddenGem: "Shnongpdeng village 4 km upstream — camp on the riverbank for ₹300/tent, crystal water with no day-tripper crowds.",
  },
  {
    name: "Mawphlang Sacred Forest",
    region: "East Khasi Hills",
    tagline: "Ancient Khasi sacred grove — undisturbed for 1,000 years",
    distanceFromShillong: "25 km",
    bestFor: ["nature", "culture", "offbeat", "photography"],
    mustSee: ["Sacred forest guided trail", "Menhir stones", "Orchid diversity"],
    localTip: "Entry only with an official Khasi guide (₹200–300); guides know species by name — use them, don't skip.",
    avoidThis: "Nothing can be taken out of the forest — don't pocket stones, leaves, or twigs; locals take this seriously.",
    hiddenGem: "Ask your guide to show the 400-year-old Diengiei tree at the forest's centre — most tourists walk past it.",
  },
  {
    name: "Double Decker Root Bridge, Nongriat",
    region: "East Khasi Hills",
    tagline: "The most photographed living structure in Northeast India",
    distanceFromShillong: "60 km (+ 3,500 steps down)",
    bestFor: ["trekking", "adventure", "photography", "nature"],
    mustSee: ["Double-decker living root bridge", "Rainbow Falls (1 km further)", "Natural rock pool"],
    localTip: "Start the trek by 7 am from Tyrna village — complete the descent before 9 am to avoid midday heat on the return climb.",
    avoidThis: "Don't wear flip-flops — the 3,500 wet stone steps need proper grip shoes; two people are airlifted out each month.",
    hiddenGem: "Rainbow Falls 45 min past the double decker: a 70 ft waterfall into a swimming hole; 90% of visitors turn back before reaching it.",
  },
  {
    name: "Nohkalikai Falls",
    region: "East Khasi Hills",
    tagline: "India's tallest plunge waterfall — 340 m into a green pool",
    distanceFromShillong: "56 km",
    bestFor: ["waterfalls", "photography", "day trip"],
    mustSee: ["Main viewpoint", "Lower basin trail", "Local market stalls"],
    localTip: "The green pool colour at the base is strongest from November to March — post-monsoon silt clears by late October.",
    avoidThis: "Don't confuse entry with Seven Sisters — Nohkalikai is 2 km off the main road; drivers often skip it if not specified.",
    hiddenGem: "The left-side cliff trail past the viewpoint (no signage) gives a direct overhanging view of the full plunge.",
  },
  {
    name: "Laitlum Canyons",
    region: "East Khasi Hills",
    tagline: "Dramatic canyon grasslands — 30 km from Shillong with almost no tourists",
    distanceFromShillong: "30 km",
    bestFor: ["photography", "nature", "offbeat", "sunrise"],
    mustSee: ["Sunrise viewpoint", "Canyon grassland walk", "Smit village nearby"],
    localTip: "Arrive before 6:30 am for fog-in-canyon shots — by 9 am clouds burn off and the drama disappears.",
    avoidThis: "No food or water available at the site — bring your own or the nearest shop is 4 km back in Smit.",
    hiddenGem: "Walk 20 min right along the canyon rim to a flat rock outcrop with a 270° view that no signboard points to.",
  },
];

// ─── Circuits ──────────────────────────────────────────────────

export const CIRCUITS: Circuit[] = [
  {
    id: "shillong-cherrapunji",
    name: "Classic Khasi Hills",
    minDays: 4,
    maxDays: 5,
    hubs: ["Shillong", "Cherrapunji"],
    vibe: ["waterfalls", "culture", "photography"],
    summary: "Shillong base with day trips to Cherrapunji, Mawlynnong, and Dawki. Covers 80% of Meghalaya highlights in minimal days.",
  },
  {
    id: "root-bridge-deep",
    name: "Living Roots & Hidden Trails",
    minDays: 5,
    maxDays: 7,
    hubs: ["Shillong", "Tyrna", "Nongriat"],
    vibe: ["trekking", "adventure", "offbeat", "nature"],
    summary: "Shillong base, overnight at Nongriat village, double-decker bridge trek plus Rainbow Falls, Laitlum canyons, and Mawphlang sacred forest.",
  },
  {
    id: "slow-meghalaya",
    name: "Slow Northeast",
    minDays: 7,
    maxDays: 10,
    hubs: ["Shillong", "Cherrapunji", "Dawki", "Mawlynnong"],
    vibe: ["slow travel", "culture", "photography", "offbeat"],
    summary: "Full plateau circuit with riverside camping at Shnongpdeng, village stays at Mawlynnong, and time at Mawphlang forest. Unhurried pace.",
  },
  {
    id: "garo-hills",
    name: "Garo Hills & Nokrek",
    minDays: 5,
    maxDays: 7,
    hubs: ["Tura", "Balpakram", "Nokrek"],
    vibe: ["wildlife", "tribal culture", "offbeat", "nature"],
    summary: "West Meghalaya circuit: Nokrek biosphere, Balpakram National Park, and Garo tribal villages. Requires Tura as entry base; no overlap with Khasi Hills circuit.",
  },
];

// ─── Local Transport ───────────────────────────────────────────

export const LOCAL_TRANSPORT: TransportOption[] = [
  {
    from: "Guwahati Airport",
    to: "Shillong",
    mode: "🚖 Cab / Shared Sumo",
    duration: "2.5–3.5 hrs",
    costRange: "₹1,800–2,400 (private) / ₹250–350 (shared)",
    note: "Shared Sumos depart from Paltan Bazaar, Guwahati. Private cabs via apps are more reliable for timings.",
  },
  {
    from: "Shillong",
    to: "Cherrapunji",
    mode: "🚖 Cab",
    duration: "1.5–2 hrs",
    costRange: "₹1,400–1,800 (return day trip)",
    note: "No shared transport option for the full circuit; cab is the only practical choice.",
  },
  {
    from: "Shillong",
    to: "Dawki",
    mode: "🚖 Cab",
    duration: "2–2.5 hrs",
    costRange: "₹2,200–2,800 (return day trip)",
    note: "Combined Dawki + Mawlynnong day trip runs ₹3,000–3,500 and is the most common route.",
  },
  {
    from: "Shillong",
    to: "Nongriat (Tyrna trailhead)",
    mode: "🚖 Cab",
    duration: "1.5 hrs to Tyrna",
    costRange: "₹1,600–2,000 one-way",
    note: "Driver waits at Tyrna for return; negotiate waiting charge (₹200–300 extra) before departing.",
  },
  {
    from: "Shillong",
    to: "Mawphlang",
    mode: "🚖 Cab / Shared bus",
    duration: "45 min",
    costRange: "₹800–1,000 (cab) / ₹50 (shared bus from Bara Bazaar)",
    note: "Shared buses run 6–10 am only; return buses unreliable — confirm before relying on them.",
  },
  {
    from: "Shillong",
    to: "Laitlum Canyons",
    mode: "🚖 Cab",
    duration: "45 min",
    costRange: "₹900–1,200 return",
    note: "Often combined with Mawphlang sacred forest as a half-day circuit from Shillong.",
  },
];

// ─── Food ─────────────────────────────────────────────────────

export const FOOD_SPOTS: FoodSpot[] = [
  {
    name: "Trattoria",
    location: "Shillong, near Police Bazaar",
    mustTry: ["Jadoh (red rice with pork)", "Doh-khlieh (pork salad)", "Tungrymbai (fermented soybean chutney)"],
    priceRange: "₹150–300 per person",
    tip: "Arrive before 1 pm — Jadoh and Doh-khlieh sell out by early afternoon.",
  },
  {
    name: "Cafe Shillong",
    location: "Shillong, Laitumkhrah",
    mustTry: ["Smoked pork sandwich", "Khasi black sesame chicken", "Local brewed ginger tea"],
    priceRange: "₹250–450 per person",
    tip: "Popular with locals for weekend brunch; book a table on Friday evening for Saturday.",
  },
  {
    name: "Sohra Market Stalls",
    location: "Cherrapunji main market",
    mustTry: ["Bamboo shoot curry", "Pork with black sesame", "Local oranges (Oct–Jan)"],
    priceRange: "₹80–150 per person",
    tip: "Best food is in the stalls at the far end of the market — the first row caters to tourists at double prices.",
  },
  {
    name: "Dawki Riverside Dhabas",
    location: "Dawki, near boat ramp",
    mustTry: ["Fish curry with rice", "Momos", "Chai with condensed milk"],
    priceRange: "₹100–200 per person",
    tip: "Dhaba nearest to the suspension bridge has the freshest river fish — ask if it arrived that morning.",
  },
];

// ─── Stay Areas ────────────────────────────────────────────────

export const STAY_AREAS: StayArea[] = [
  {
    area: "Police Bazaar / MG Road, Shillong",
    whyStayHere: "Central location; walkable to restaurants, markets, and cab stands",
    budgetRange: "₹700–1,500/night",
    comfortableRange: "₹2,000–4,500/night",
    premiumRange: "₹5,500–12,000/night",
    bestFor: ["city base", "first-timers", "easy transport access"],
  },
  {
    area: "Laitumkhrah / Oakland, Shillong",
    whyStayHere: "Quieter residential area with the best cafés and independent restaurants",
    budgetRange: "₹900–1,800/night",
    comfortableRange: "₹2,500–5,000/night",
    premiumRange: "₹6,000–14,000/night",
    bestFor: ["food lovers", "longer stays", "calm atmosphere"],
  },
  {
    area: "Cherrapunji (Sohra) Village Edge",
    whyStayHere: "Wake up above the clouds; waterfalls in walking distance; avoids Shillong commute",
    budgetRange: "₹800–1,600/night",
    comfortableRange: "₹2,200–4,000/night",
    premiumRange: "₹4,500–9,000/night",
    bestFor: ["waterfalls", "photography", "nature immersion"],
  },
  {
    area: "Mawlynnong Village Homestay",
    whyStayHere: "Sleep in the village; community-run; full board usually included",
    budgetRange: "₹600–1,000/night (with meals)",
    comfortableRange: "₹1,400–2,500/night (with meals)",
    premiumRange: "N/A — no luxury options in village",
    bestFor: ["culture", "slow travel", "offbeat experience"],
  },
  {
    area: "Shnongpdeng Riverside Camp, Dawki",
    whyStayHere: "Camp on the Umngot riverbank; kayaking and cliff jumping from your tent",
    budgetRange: "₹250–500/tent/night",
    comfortableRange: "₹1,200–2,000/cottage/night",
    premiumRange: "N/A — camp setting only",
    bestFor: ["adventure", "photography", "river experience"],
  },
];

// ─── Knowledge Context ────────────────────────────────────────

export const meghalayaKnowledge = {
  bestSeason: {
    ideal: ["October", "November", "December"],
    avoidFor: {
      dawkiWater: ["June", "July", "August"],
    },
  },

  permits: {
    required: false,
  },

  roadReality: [
    "Fog common after 4 PM",
    "Avoid night mountain drives",
  ],

  foodReality: {
    vegetarianDifficulty: "moderate",
  },

  network: {
    weakAreas: ["Mawlynnong"],
  },

  hiddenGems: [
    "Mawphanlur",
    "Mawphlang Sacred Forest",
    "Krang Suri",
  ],
};

// ─── Helpers ───────────────────────────────────────────────────

export function getDestination(name: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.name.toLowerCase() === name.toLowerCase());
}

export function getCircuitsByDays(days: number): Circuit[] {
  return CIRCUITS.filter((c) => days >= c.minDays && days <= c.maxDays);
}

export function getCircuitsByVibe(vibes: string[]): Circuit[] {
  const lower = vibes.map((v) => v.toLowerCase());
  return CIRCUITS.filter((c) => c.vibe.some((v) => lower.includes(v)));
}
