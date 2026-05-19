import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { origin, days, budget, budgetRange, budgetStyle, vibes } = await req.json();

  if (!origin || !days || !budget) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const vibeList   = Array.isArray(vibes) && vibes.length ? vibes.join(", ") : "General sightseeing";
  const budgetLine = budgetRange && budgetStyle
    ? `${budget} (${budgetRange} per person — ${budgetStyle})`
    : budget;

  const prompt = `You are a Meghalaya travel expert helping domestic Indian travellers.

Generate a realistic Meghalaya trip plan for a traveller from ${origin}, travelling for ${days} days, budget: ${budgetLine}, travel vibes: ${vibeList}.

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
      "highlights": ["", "", ""]
    }
  ],
  "realityCheck": ["", "", "", ""]
}

Strict field rules:

tripTitle: max 6 words. Specific and direct.

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

realityCheck: 4–5 strings. Each is one practical bullet.
- Start with "✓" for tips or "⚠" for warnings.
- Cover: entry route, local transport, weather caveat, feasibility, one insider tip.
- Max 10 words per bullet.
- No generic advice. Must be specific to this ${days}-day, ${budgetLine} trip from ${origin}.

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
