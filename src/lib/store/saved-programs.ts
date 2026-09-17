"use client";

import { useCallback } from "react";
import { STORAGE_KEYS, useLocalStorageValue } from "./local-storage";

const NO_SAVED_PROGRAMS: string[] = [];

/**
 * Saved-program ids, shared across every component that calls this hook —
 * useLocalStorageValue's underlying store is keyed by storage key, so a save
 * toggled on the Recommendations page is reflected immediately on /saved
 * without any extra wiring.
 */
export function useSavedPrograms() {
  const [savedIds, setSavedIds] = useLocalStorageValue<string[]>(
    STORAGE_KEYS.savedPrograms,
    NO_SAVED_PROGRAMS,
    NO_SAVED_PROGRAMS
  );

  const isSaved = useCallback((programId: string) => savedIds.includes(programId), [savedIds]);

  const toggleSave = useCallback(
    (programId: string) => {
      setSavedIds(savedIds.includes(programId) ? savedIds.filter((id) => id !== programId) : [...savedIds, programId]);
    },
    [savedIds, setSavedIds]
  );

  return { savedIds, isSaved, toggleSave };
}
