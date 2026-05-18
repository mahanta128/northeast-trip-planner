import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { origin, destination, days, budget, vibes } = await req.json();

  if (!origin || !destination || !days || !budget) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const vibeList = vibes?.length ? vibes.join(", ") : "General sightseeing";

  const prompt = `You are an expert travel planner specializing in Northeast India.

Plan a ${days}-day trip to ${destination} for a traveler departing from ${origin}.
Budget tier: ${budget}
Travel vibe: ${vibeList}

Return a detailed day-by-day itinerary in the following JSON format only — no markdown, no explanation outside the JSON:

{
  "summary": "A 2-3 sentence trip overview",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "morning": "Morning activity",
      "afternoon": "Afternoon activity",
      "evening": "Evening activity",
      "stay": "Recommended stay/hotel type",
      "tip": "One local travel tip"
    }
  ],
  "budgetNote": "Estimated daily budget range in INR based on the tier",
  "bestTime": "Best time of year to visit",
  "packingTips": ["tip1", "tip2", "tip3"]
}`;

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
