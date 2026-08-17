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

/* ─── Core entities ───────────────────────────────────────────── */

export type InspirationSourceType = "instagram" | "manual";

/** A location the user has reviewed and saved to their collection. */
export interface InspirationItem {
  id: string;
  userId: string | null; // no accounts yet — always null; kept for forward-compatibility.
  sourceType: InspirationSourceType;
  sourceUrl: string;
  title: string;
  locationName: string;
  city: string;
  state: string;
  category: InspirationCategory | string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  confidence: number; // 0–1
  selected: boolean;
  createdAt: string; // ISO timestamp
}

/** A location candidate surfaced by AI extraction, before the user reviews/saves it. */
export interface ExtractedLocation {
  locationName: string;
  city: string;
  state: string;
  category: InspirationCategory | string;
  description: string;
  confidence: number; // 0–1
  /** false when `state` falls outside the 8 supported Northeast states. */
  inCoverage: boolean;
}
