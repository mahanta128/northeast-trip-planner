import OpenAI from "openai";
import {
  normalizeNortheastState,
  INSPIRATION_CATEGORIES,
  type ExtractedLocation,
} from "@/lib/inspiration/types";

export class LocationExtractionError extends Error {
  constructor(message = "Could not extract locations from this content.") {
    super(message);
    this.name = "LocationExtractionError";
  }
}

let client: OpenAI | null = null;

/**
 * Constructed lazily (not at module load) because the OpenAI SDK throws
 * synchronously in its constructor when no API key is configured. Doing
 * this at import time would crash the whole route module before we get a
 * chance to turn it into a friendly, non-leaking error response.
 */
function getClient(): OpenAI {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) {
    console.error("Location extraction: OPENAI_API_KEY is not configured.");
    throw new LocationExtractionError();
  }
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

interface RawLocation {
  locationName: string;
  city: string;
  state: string;
  category: string;
  description: string;
  confidence: number;
}

interface RawExtraction {
  locations: RawLocation[];
}

/**
 * Structured-output schema for the extraction call. Using OpenAI's native
 * `response_format: json_schema` (supported by the installed SDK/models)
 * instead of asking the model to "return JSON" and hoping — the API itself
 * guarantees the response conforms to this shape, so there is no markdown
 * fencing or prose to strip before parsing.
 */
const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    locations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          locationName: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          category: { type: "string", enum: [...INSPIRATION_CATEGORIES] },
          description: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["locationName", "city", "state", "category", "description", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["locations"],
  additionalProperties: false,
} as const;

function normalizeRaw(l: RawLocation): ExtractedLocation {
  const rawState = (l.state || "").trim();
  const normalized = normalizeNortheastState(rawState);
  return {
    locationName: l.locationName.trim(),
    city: (l.city || l.locationName).trim(),
    state: normalized ?? rawState,
    category: l.category?.trim() || "Other",
    description: (l.description || "").trim(),
    confidence: typeof l.confidence === "number" ? Math.max(0, Math.min(1, l.confidence)) : 0.5,
    inCoverage: normalized !== null,
  };
}

async function runExtraction(prompt: string): Promise<ExtractedLocation[]> {
  let raw: string;
  try {
    const response = await getClient().chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: { name: "location_extraction", schema: EXTRACTION_SCHEMA, strict: true },
      },
    });
    raw = response.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error("Location extraction API error:", err);
    throw new LocationExtractionError();
  }

  let parsed: RawExtraction;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    // Should not happen under strict json_schema mode, but never trust a
    // remote response blindly.
    console.error("Location extraction parse error:", err, raw);
    throw new LocationExtractionError();
  }

  if (!Array.isArray(parsed.locations)) return [];

  return parsed.locations
    .filter((l) => l.locationName && l.locationName.trim())
    .map(normalizeRaw);
}

/**
 * Separate from itinerary generation on purpose: this layer only turns raw
 * source text (an Instagram caption today) into candidate travel locations.
 * It never talks to the itinerary generator directly — the review UI sits
 * between the two so a bad extraction can't silently corrupt a trip plan.
 */
export async function extractLocationsFromText(input: {
  caption: string;
  sourceUrl: string;
}): Promise<ExtractedLocation[]> {
  const { caption } = input;
  if (!caption || caption.trim().length < 3) return [];

  const prompt = `You are a travel-location extraction engine for Rhinotrek, a Northeast India trip planner.

Read the following Instagram post caption/text and identify every real, specific travel location it mentions or clearly implies (towns, villages, landmarks, natural sites, monasteries, viewpoints, etc). Ignore hashtags that are not place names, generic phrases, and people/brand names.

Caption:
"""
${caption.slice(0, 4000)}
"""

Rules:
- locationName: the specific place (e.g. "Dawki", "Nohkalikai Falls").
- city: nearest town/city, or the same as locationName if it is itself a town.
- state: the Indian state the location is in. Use full state names (e.g. "Meghalaya", "Arunachal Pradesh"). If you cannot confidently determine the state, leave it empty — never guess.
- category: one of ${INSPIRATION_CATEGORIES.map((c) => `"${c}"`).join(", ")}.
- description: one short factual sentence about the place — this is shown to the user as the reason it was identified. No marketing language, no adjectives like "stunning" or "breathtaking".
- confidence: 0 to 1 — how confident you are this is a real, correctly identified place.
- If no real locations are mentioned, return an empty locations array.
- Do not invent locations that aren't supported by the text.`;

  return runExtraction(prompt);
}

/**
 * Normalizes a single free-text, user-typed place name (the "Can't find your
 * place? Add it manually" path) through the exact same AI extraction used for
 * Instagram captions — same model, same schema, same Northeast-state
 * normalization — so manually-entered and AI-detected locations end up in an
 * identical shape.
 *
 * Unlike Instagram extraction, a manual entry is trusted user input, not an
 * AI inference from ambiguous media: if the model can't enrich it (unknown
 * place, unclear state), we still return a best-effort location built from
 * the raw text rather than dropping it, so the user is never blocked from
 * saving what they typed.
 */
export async function normalizeManualLocation(name: string): Promise<ExtractedLocation> {
  const clean = name.trim().slice(0, 200);
  const fallback: ExtractedLocation = {
    locationName: clean,
    city: clean,
    state: "",
    category: "Other",
    description: "",
    confidence: 0,
    inCoverage: false,
  };
  if (!clean) return fallback;

  const prompt = `You are a travel-location normalization engine for Rhinotrek, a Northeast India trip planner.

A user manually typed this place name: "${clean}"

Identify what real place this refers to, if any.

Rules:
- locationName: the specific, correctly-spelled place name.
- city: nearest town/city, or the same as locationName if it is itself a town.
- state: the Indian state the location is in. Use full state names (e.g. "Meghalaya", "Arunachal Pradesh"). If you cannot confidently determine the state, leave it empty — never guess.
- category: one of ${INSPIRATION_CATEGORIES.map((c) => `"${c}"`).join(", ")}.
- description: one short factual sentence about the place. No marketing language.
- confidence: 0 to 1 — how confident you are this is a real, correctly identified place.
- Return exactly one location in the array, built from what the user typed, even if you are not fully confident — never return an empty array for this input.`;

  try {
    const results = await runExtraction(prompt);
    return results[0] ?? fallback;
  } catch {
    // Never let a manual add hard-fail on an AI hiccup — fall back to the
    // raw text so the user can still save it and try enrichment later.
    return fallback;
  }
}
