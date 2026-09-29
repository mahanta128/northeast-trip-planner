/**
 * The normalization layer of the Import Inspiration pipeline:
 *
 *   Extraction  →  Candidate Locations  →  [ this file ]  →  User Review
 *                                           Normalization +
 *                                           Northeast validation +
 *                                           dedup
 *
 * Every inspiration source (screenshot, notes, Instagram reference, manual
 * entry, and any future source adapter) funnels its raw AI output through
 * `normalizeLocations()` here before it ever reaches the UI. This keeps the
 * review screen and the Planner source-agnostic — they only ever see the one
 * shared `InspirationLocation` shape.
 *
 * Pure and side-effect-free (no `process.env`, no network, no OpenAI import)
 * so it is safe to import from both server routes and "use client" components.
 */

import {
  normalizeNortheastState,
  type InspirationLocation,
  type InspirationLocationStatus,
  type InspirationSourceType,
  type RawExtractedCandidate,
} from "./types";

/* ─── Northeast validation ───────────────────────────────────── */

/**
 * Classifies a raw, AI-reported state string into one of three outcomes —
 * never a fourth "forced Northeast" option:
 *
 * - confidently one of the 8 Northeast states  → "confirmed"
 * - empty/unrecognised (model wasn't sure)      → "needs_confirmation"
 * - a real, recognised state outside the 8      → "outside_coverage"
 */
export function validateNortheastLocation(rawState: string): {
  state: string;
  status: InspirationLocationStatus;
} {
  const trimmed = (rawState || "").trim();
  if (!trimmed) return { state: "", status: "needs_confirmation" };

  const normalized = normalizeNortheastState(trimmed);
  if (normalized) return { state: normalized, status: "confirmed" };

  // A real place name was given but it isn't one of Rhinotrek's 8 states —
  // e.g. "Manali" / "Goa". Keep the state as reported; never overwrite it
  // and never relabel it as merely "uncertain".
  return { state: trimmed, status: "outside_coverage" };
}

/* ─── Place-name aliases (for conservative dedup only) ───────── */

/**
 * Deliberately tiny and curated — only well-known cases where the same
 * Northeast place is commonly called two different things. This is NOT a
 * fuzzy-matching table; every entry here is a confident, unambiguous alias.
 * When in doubt, a place is left alone and both candidates survive review.
 */
export const NORTHEAST_PLACE_ALIASES: Record<string, string> = {
  "sohra": "Cherrapunji",
  "cherrapunjee": "Cherrapunji",
  "cherrapunji": "Cherrapunji",
};

/** Resolves a place name to its canonical display form via the alias table above, or returns it unchanged. */
export function resolveCanonicalName(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return trimmed;
  const canonical = NORTHEAST_PLACE_ALIASES[trimmed.toLowerCase()];
  return canonical ?? trimmed;
}

function dedupeKey(name: string): string {
  return resolveCanonicalName(name).toLowerCase();
}

/* ─── id generation ───────────────────────────────────────────── */

export function generateLocationId(): string {
  return `insp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ─── Raw candidate → shared model ───────────────────────────── */

/** Converts one raw AI extraction result into the shared InspirationLocation shape. */
export function toInspirationLocation(
  raw: RawExtractedCandidate,
  meta: { sourceType: InspirationSourceType; sourceUrl?: string }
): InspirationLocation {
  const name = resolveCanonicalName((raw.locationName || "").trim());
  const { state, status } = validateNortheastLocation(raw.state);

  return {
    id: generateLocationId(),
    name,
    city: (raw.city || name).trim(),
    state,
    country: "India",
    type: raw.category?.trim() || "Other",
    description: (raw.description || "").trim(),
    sourceType: meta.sourceType,
    sourceUrl: meta.sourceUrl ?? "",
    confidence: typeof raw.confidence === "number" ? Math.max(0, Math.min(1, raw.confidence)) : 0.5,
    status,
    latitude: null,
    longitude: null,
    userId: null,
    createdAt: new Date().toISOString(),
  };
}

/** Converts a batch of raw extraction results — drops entries with no name. */
export function normalizeLocations(
  raws: RawExtractedCandidate[],
  meta: { sourceType: InspirationSourceType; sourceUrl?: string }
): InspirationLocation[] {
  return raws
    .filter((r) => r.locationName && r.locationName.trim())
    .map((r) => toInspirationLocation(r, meta));
}

/* ─── Deduplication ───────────────────────────────────────────── */

/**
 * Conservative, source-agnostic dedup: two locations collapse into one only
 * when they share an exact name (case-insensitive) or a confidently-known
 * alias (see NORTHEAST_PLACE_ALIASES above) — e.g. a screenshot mentioning
 * "Cherrapunji" and notes mentioning "Sohra" collapse to one place. Nothing
 * is ever merged on fuzzy/partial similarity; when in doubt, both survive
 * and the user decides in review.
 *
 * `existing` lets a caller also drop anything that duplicates a location
 * already queued (e.g. already in the review list) or already saved (e.g.
 * already in "My Inspiration") — the same rule serves both use sites.
 */
export function dedupeLocations(
  candidates: InspirationLocation[],
  existing: InspirationLocation[] = []
): InspirationLocation[] {
  const existingKeys = new Set(existing.map((e) => dedupeKey(e.name)));
  const kept = new Map<string, InspirationLocation>();

  for (const candidate of candidates) {
    const key = dedupeKey(candidate.name);
    if (!key || existingKeys.has(key)) continue;

    const prior = kept.get(key);
    if (!prior) {
      kept.set(key, candidate);
      continue;
    }

    // Prefer whichever carries a source link (e.g. Instagram) so provenance
    // isn't silently dropped; otherwise prefer the higher-confidence one.
    const candidateHasSource = Boolean(candidate.sourceUrl);
    const priorHasSource = Boolean(prior.sourceUrl);
    const preferCandidate =
      (candidateHasSource && !priorHasSource) ||
      (candidateHasSource === priorHasSource && candidate.confidence > prior.confidence);
    if (preferCandidate) kept.set(key, candidate);
  }

  return Array.from(kept.values());
}
