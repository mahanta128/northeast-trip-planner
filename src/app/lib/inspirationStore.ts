"use client";

import { useCallback, useEffect, useState } from "react";
import type { InspirationItem } from "@/lib/inspiration/types";

/**
 * Rhinotrek has no user accounts or backend database yet — everything else
 * in this app is a stateless AI call. Persisting the inspiration collection
 * to localStorage keeps it working across reloads without inventing an auth
 * system this feature doesn't need. When real accounts land, this is the
 * seam to swap for a server-backed store — InspirationItem.userId already
 * exists for that.
 */
const STORAGE_KEY = "rhinotrek.inspiration.v1";

function readStore(): InspirationItem[] {
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

function writeStore(items: InspirationItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode, quota exceeded) — in-memory state
    // for this session still works, it just won't survive a reload.
  }
}

export function useInspirationStore() {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage after mount only — avoids SSR/client mismatch.
  useEffect(() => {
    setItems(readStore());
    setHydrated(true);
  }, []);

  const addItems = useCallback((newItems: InspirationItem[]) => {
    setItems((prev) => {
      const next = [...prev, ...newItems];
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
