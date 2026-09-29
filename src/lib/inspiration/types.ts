/**
 * Shared data model for the "Import Inspiration" feature.
 * Safe to import from both server (API routes) and client (components) code —
 * no side effects, no env access.
 */

/* ─── Northeast India coverage ───────────────────────────────── */

export const NORTHEAST_STATES = [
  "Arunachal Pradesh",
  "Assam",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
] as const;

export type NortheastState = (typeof NORTHEAST_STATES)[number];

const STATE_ALIASES: Record<string, NortheastState> = {
  "arunachal": "Arunachal Pradesh",
  "arunachal pradesh": "Arunachal Pradesh",
  "assam": "Assam",
  "manipur": "Manipur",
  "meghalaya": "Meghalaya",
  "mizoram": "Mizoram",
  "nagaland": "Nagaland",
  "sikkim": "Sikkim",
  "tripura": "Tripura",
};

/** Resolves free-text state input to a canonical Northeast state name, or null if unrecognised/out of coverage. */
export function normalizeNortheastState(input: string): NortheastState | null {
  const key = input.trim().toLowerCase();
  if (!key) return null;
  return STATE_ALIASES[key] ?? null;
}

export function isNortheastState(input: string): boolean {
  return normalizeNortheastState(input) !== null;
}

/* ─── Categories ──────────────────────────────────────────────── */

export const INSPIRATION_CATEGORIES = [
  "City / Destination",
  "Nature",
  "Adventure",
  "Food",
  "Culture",
  "Stay",
  "Other",
] as const;

export type InspirationCategory = (typeof INSPIRATION_CATEGORIES)[number];

/* ─── Source provenance ──────────────────────────────────────── */

export type InspirationSourceType = "screenshot" | "notes" | "instagram" | "manual";

/** Human-readable label for how a location was surfaced — shown on review/collection cards. */
export const SOURCE_TYPE_LABELS: Record<InspirationSourceType, string> = {
  screenshot: "from your screenshot",
  notes: "from your notes",
  instagram: "via Instagram",
  manual: "added manually",
};

/* ─── Northeast coverage status ──────────────────────────────── */

export type InspirationLocationStatus = "confirmed" | "needs_confirmation" | "outside_coverage";

/* ─── The one shared location model ──────────────────────────── */

/**
 * The single shape every inspiration source converges on — a screenshot, a
 * pasted caption, an Instagram reference, a manually typed name, or (later)
 * any future source adapter. Extraction produces these as review candidates;
 * the exact same shape, once the user confirms it, is what gets persisted to
 * "My Inspiration" and handed to the Planner. Nothing downstream of
 * extraction needs to know where a location originally came from — only
 * `sourceType`/`sourceUrl` remember that, for provenance display.
 */
export interface InspirationLocation {
  id: string;
  name: string;
  city: string;
  state: string; // "" when unknown/uncertain — never guessed
  country: string; // "India" for V1 — reserved for non-domestic future sources
  type: InspirationCategory | string;
  description: string;
  sourceType: InspirationSourceType;
  sourceUrl: string; // "" when there is no source link (e.g. manual, notes)
  confidence: number; // 0–1
  status: InspirationLocationStatus;
  latitude: number | null;
  longitude: number | null;
  userId: string | null; // no accounts yet — always null; kept for forward-compatibility.
  createdAt: string; // ISO timestamp — when this location was first surfaced.
}

/**
 * The unvalidated shape returned directly by an OpenAI extraction call —
 * before Northeast-state validation, id assignment, or dedup. Deliberately
 * mirrors the extraction JSON schema field-for-field. Never shown to the
 * user and never persisted — see src/lib/inspiration/normalize.ts for the
 * step that turns this into an InspirationLocation.
 */
export interface RawExtractedCandidate {
  locationName: string;
  city: string;
  state: string;
  category: string;
  description: string;
  confidence: number;
}
