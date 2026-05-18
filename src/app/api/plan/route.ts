import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { origin, days, budget, vibes } = await req.json();

  if (!origin || !days || !budget) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const vibeList = Array.isArray(vibes) && vibes.length ? vibes.join(", ") : "General sightseeing";

  const prompt = `You are a Meghalaya travel expert helping domestic Indian travellers.

Generate a realistic Meghalaya trip plan for a traveller from ${origin}, travelling for ${days} days, with a ${budget} budget and travel vibes: ${vibeList}.

Return ONLY valid JSON. No markdown. No text outside the JSON.

{
  "tripTitle": "",
  "summary": "",
  "transport": ["", ""],
  "stay": "",
  "estimatedBudget": {
    "range": "",
    "note": ""
  },
  "itinerary": [
    {
      "day": 1,
      "title": "",
      "highlights": ["", "", ""]
    }
  ],
  "realityCheck": {
    "route": "",
    "feasibility": "",
    "weather": "",
    "localExpectations": ""
  }
}

Strict writing rules:
- tripTitle: max 6 words. Specific to the trip.
- summary: exactly 2 sentences. State the route and trip character. No adjectives.
- transport: array of 2–3 steps. Each step = one leg of the journey. Format each as: "Mode — route (duration)". Example: ["Flight — ${origin} to Guwahati (vary by city)", "Cab — Guwahati to Shillong (3–4 hrs)"].
- stay: one sentence. Name area or property type only. Match to ${budget} tier. No adjectives.
- estimatedBudget.range: INR range per person. Example: "₹18,000–₹25,000".
- estimatedBudget.note: one short phrase. Example: "per person, excluding flights".
- itinerary: exactly ${days} day objects.
- highlights: exactly 3 strings per day. Each = one activity or place. Max 7 words. No filler.
- Banned words: breathtaking, vibrant, nestled, gem, immerse, stunning, lush, picturesque, charming, paradise.
- All trips must route through Guwahati.
- Match quality of stays and activities to ${budget} tier.
- Tailor highlights to vibes: ${vibeList}.
- realityCheck: 4 fields, 1 sentence each. No adjectives. Practical facts only.
  - route: How to actually get there. Flag any connection risks or delays.
  - feasibility: Is this trip realistic for ${days} days? Flag if too rushed or too relaxed.
  - weather: Key weather facts for Meghalaya relevant to the trip timing. Include monsoon warning if applicable.
  - localExpectations: One practical expectation about local travel, connectivity, or infrastructure.`;

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
