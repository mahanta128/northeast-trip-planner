import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getSeasonInfo(dateStr: string): { season: string; note: string } {
  const month = new Date(dateStr).getMonth() + 1;
  if (month >= 6 && month <= 9)
    return { season: "Monsoon", note: "Heavy rainfall, waterfalls at peak flow, some roads closed, leeches active in forests — pack rain gear and plan indoor fallback days." };
  if (month >= 10 && month <= 11)
    return { season: "Post-monsoon", note: "Clear skies, lush greenery, ideal for trekking and road trips — best overall season." };
  if (month === 12 || month <= 2)
    return { season: "Winter", note: "Cold and foggy especially at altitude, clear sunny days possible — carry warm layers." };
  return { season: "Spring/Pre-monsoon", note: "Pleasant temperatures, clear skies, drier roads before June — ideal weather window for trekking and river visits." };
}

export async function POST(req: NextRequest) {
  const {
    origin, days, budget, budgetRange, budgetStyle, vibes, travelStyle, travelers = 2,
    startDate, endDate,
    seasonName, seasonNote,
    permitRequired, permitName,
    festivals = [],
  } = await req.json();

  if (!origin || !days || !budget) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const vibeList     = Array.isArray(vibes) && vibes.length ? vibes.join(", ") : "General sightseeing";
  const budgetLine   = budgetRange && budgetStyle
    ? `${budget} (${budgetRange} per person — ${budgetStyle})`
    : budget;
  const travelerLine = travelers === 1
    ? "1 traveler (solo)"
    : travelers === 2
    ? "2 travelers (couple)"
    : travelers <= 5
    ? `${travelers} travelers (small group)`
    : `${travelers} travelers (large group)`;

  const { season: legacySeason, note: legacySeasonNote } = startDate ? getSeasonInfo(startDate) : { season: "", note: "" };
  const activeSeason = seasonName || legacySeason;
  const activeSeasonNote = seasonNote || legacySeasonNote;

  const dateContext = startDate
    ? `\nTravel window: ${startDate} to ${endDate || startDate} (${days} days). Season: ${activeSeason}${activeSeasonNote ? ` — ${activeSeasonNote}` : ""}`
    : "";

  const permitLine = permitRequired && permitName
    ? `\nPermit requirement: ${permitName} is mandatory — factor this into itinerary day 1 logistics.`
    : "";

  const festivalLine = Array.isArray(festivals) && festivals.length
    ? `\nFestival overlap: ${(festivals as string[]).join(", ")} occurs during this travel window — consider recommending it if timing aligns.`
    : "";

  const prompt = `You are a Northeast India travel expert helping domestic Indian travellers.

Generate a realistic trip plan for ${travelerLine} from ${origin} to their chosen destination, travelling for ${days} days, budget: ${budgetLine} (per person), travel vibes: ${vibeList}, travel style: ${travelStyle || "Private / Solo"}.${dateContext}${permitLine}${festivalLine}

Return ONLY valid JSON. No markdown. No text outside the JSON.

{
  "tripTitle": "",
  "summary": "",
  "tripFit": {
    "score": "",
    "summary": "",
    "reasons": ["", "", ""]
  },
  "transport": [
    { "mode": "", "leg": "", "duration": "", "cost": "" }
  ],
  "stay": {
    "base": "",
    "priceRange": "",
    "bestFor": ["", ""]
  },
  "budget": {
    "transport": "",
    "stay": "",
    "food": "",
    "localTravel": ""
  },
  "itinerary": [
    {
      "day": 1,
      "location": "",
      "highlights": ["", "", ""],
      "localTip": "",
      "hiddenGem": "",
      "avoidThis": ""
    }
  ],
  "realityCheck": ["", "", "", ""]
}

Strict field rules:

tripTitle: 2–4 evocative words. Draw from the terrain, season, travel character, or a distinctive local quality — not from day counts or destination names alone. Style inspired by premium travel design houses: poetic, thematic, specific. Examples: "Meghalaya Monsoon Journal", "Living Root Chronicle", "Khasi Plateau Immersion", "Arunachal High-Altitude Sojourn", "Silk Route Quiet Expedition". Never use generic patterns like "X-Day Trip", "Tour", "Package", or city name prefixes. No "&" connectors.

summary: exactly 2 sentences. Route + trip character. No adjectives.

tripFit:
- score: format "X/10" — be honest, not 10/10 unless perfect fit.
- summary: 2–3 words. Example: "Great Match", "Slightly Rushed", "Good Fit".
- reasons: 3 strings. Start each with "✓" for positives or "⚠" for caveats. Max 8 words each.

transport: array of journey legs from ${origin} to Meghalaya.
- mode: single emoji (✈ 🚂 🚖 🚌 etc.)
- leg: "City → City" format only.
- duration: travel time or empty string if not applicable.
- cost: INR range. Example: "₹4,000–7,000".

stay:
- base: city or area name only.
- priceRange: INR per night. Example: "₹1,500–3,500/night".
- bestFor: 2–3 vibe tags matching the traveller's vibes: ${vibeList}.

budget: per-person INR ranges for each category. Format "₹X–Y".
- transport: flights + intercity only.
- stay: total accommodation cost for trip.
- food: total food cost for trip.
- localTravel: local cabs, autos, entry fees.

itinerary: exactly ${days} day objects.
- location: primary place for the day. City or landmark name only.
- highlights: exactly 3 strings. Each = one activity. Max 7 words. Start each with an action verb.
- localTip: 1 sentence. Insider knowledge specific to this day's location only. Max 12 words. Must be hyper-specific (timing, exact food spot, price negotiation, etc).
- hiddenGem: 1 sentence. One off-beaten-path spot or experience near this location. Max 12 words. Must be a real specific place or experience, not generic.
- avoidThis: 1 sentence. One specific common mistake tourists make at this exact location. Max 12 words. Must be actionable and specific, not generic advice.

realityCheck: 4–5 strings. Each is one practical bullet.
- Start with "✓" for tips or "⚠" for warnings.
- Cover: entry route, local transport, weather caveat, feasibility, one insider tip.
- Max 10 words per bullet.
- No generic advice. Must be specific to this ${days}-day, ${budgetLine} trip from ${origin}.

Traveler-specific rules for ${travelerLine}:
- Solo (1): budget stays, shared transport, solo-friendly guesthouses, street food.
- Couple (2): comfortable stays, private or shared cabs, café meals.
- Small group (3–5): shared SUVs, twin/triple rooms, split costs on activities.
- Large group (6+): private vehicle hire mandatory, villa or multi-room stays where practical, group discounts on entry fees.

Banned words: breathtaking, vibrant, nestled, gem, immerse, stunning, lush, picturesque, charming, paradise, amazing, wonderful, beautiful.
All trips must route through Guwahati.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json({ plan: parsed });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json({ error: "Failed to generate trip plan." }, { status: 500 });
  }
}
