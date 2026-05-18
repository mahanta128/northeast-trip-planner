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

Generate a realistic Meghalaya trip plan for a traveller from ${origin}, travelling for ${days} days, with a ${budget} budget and these travel vibes: ${vibeList}.

Return ONLY valid JSON. No markdown. No explanation outside the JSON.

{
  "tripTitle": "",
  "summary": "",
  "transport": "",
  "stay": "",
  "estimatedBudget": "",
  "itinerary": [
    {
      "day": 1,
      "title": "",
      "highlights": ["", "", ""]
    }
  ]
}

Writing rules — strictly follow these:
- summary: max 2 short sentences. No prose. State the trip type and tone only.
- transport: one sentence max. Format: "Flight to Guwahati → shared cab to Shillong (3–4 hrs)."
- stay: one sentence max. Name 1–2 property types or areas. No adjectives.
- estimatedBudget: INR range per person only. Example: "₹18,000–₹25,000 per person (ex-flights)."
- itinerary highlights: exactly 3 bullet strings per day. Each bullet = one place or activity. Max 8 words per bullet. No filler words.
- No travel-blog language. No phrases like "immerse yourself", "breathtaking", "vibrant", "nestled", "gem".
- All Meghalaya trips must route through Guwahati.
- Match stay and activity quality to the ${budget} budget tier.
- Tailor highlights to these vibes: ${vibeList}.`;

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
