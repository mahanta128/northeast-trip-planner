"use client";

import { useCallback, useEffect, useState } from "react";
import type { InspirationLocation } from "@/lib/inspiration/types";
import { dedupeLocations } from "@/lib/inspiration/normalize";

/**
 * Rhinotrek has no user accounts or backend database yet — everything else
 * in this app is a stateless AI call. Persisting the inspiration collection
 * to localStorage keeps it working across reloads without inventing an auth
 * system this feature doesn't need. When real accounts land, this is the
 * seam to swap for a server-backed store — InspirationLocation.userId
 * already exists for that.
 *
 * Bumped to v2 for the unified InspirationLocation model (previously split
 * across two shapes) — old v1 entries are simply left behind rather than
 * migrated, since this is pre-launch scratch data, not durable history.
 */
const STORAGE_KEY = "rhinotrek.inspiration.v2";

function readStore(): InspirationLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(items: InspirationLocation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode, quota exceeded) — in-memory state
    // for this session still works, it just won't survive a reload.
  }
}

export function useInspirationStore() {
  const [items, setItems] = useState<InspirationLocation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage after mount only — avoids SSR/client mismatch.
  useEffect(() => {
    setItems(readStore());
    setHydrated(true);
  }, []);

  // Conservative dedup lives here so every caller gets the same guarantee —
  // saving a place already in the collection (same name/alias) is a no-op
  // rather than a second row in "My Inspiration".
  const addItems = useCallback((newItems: InspirationLocation[]) => {
    setItems((prev) => {
      const deduped = dedupeLocations(newItems, prev);
      if (deduped.length === 0) return prev;
      const next = [...prev, ...deduped];
      writeStore(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      writeStore(next);
      return next;
    });
  }, []);

  return { items, hydrated, addItems, removeItem };
}
