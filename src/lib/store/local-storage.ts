import { useCallback, useRef, useSyncExternalStore } from "react";

/** Thin, SSR-safe localStorage wrapper. Every call is guarded — this runs during hydration in the browser only. */
export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota) — the app still functions, just without persistence.
  }
}

export const STORAGE_KEYS = {
  profile: "pathlight:profile",
  roadmapProgress: "pathlight:roadmap-progress",
  savedPrograms: "pathlight:saved-programs",
} as const;

/**
 * React-idiomatic localStorage binding via useSyncExternalStore, so reads stay
 * consistent across renders (no manual effect+setState). Caches the parsed
 * value per raw string so getSnapshot returns a stable reference when the
 * underlying storage hasn't actually changed.
 *
 * `loadingValue` (defaults to `fallback`) is what server render AND the very
 * first client hydration pass see, BEFORE the store has actually checked
 * localStorage. Pass a value distinct from `fallback` (e.g. `undefined` vs a
 * real "confirmed empty" fallback like `null`) whenever a consumer needs to
 * tell "haven't checked yet" apart from "checked, genuinely empty" — this
 * matters for anything that reacts to "empty" with a side effect (a redirect,
 * say), since the resync from loadingValue -> real value happens one effect
 * flush after mount, not synchronously during the first render.
 *
 * `loadingValue` is a required (not defaulted) parameter deliberately: a
 * default of `= fallback` would silently win even when a caller explicitly
 * passes `undefined`, since that's exactly the value JS treats as "use the
 * default" for a defaulted parameter.
 */
export function useLocalStorageValue<T>(key: string, fallback: T, loadingValue: T): [T, (next: T) => void] {
  const cache = useRef<{ raw: string | null; value: T } | null>(null);

  const getSnapshot = useCallback((): T => {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (cache.current && cache.current.raw === raw) return cache.current.value;
    const value = raw ? (JSON.parse(raw) as T) : fallback;
    cache.current = { raw, value };
    return value;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallback is expected to be a stable reference per call site
  }, [key]);

  const getServerSnapshot = useCallback((): T => loadingValue, [loadingValue]);

  const subscribe = useCallback(
    (callback: () => void) => {
      window.addEventListener("storage", callback);
      window.addEventListener(`pathlight:local-write:${key}`, callback);
      return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(`pathlight:local-write:${key}`, callback);
      };
    },
    [key]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T) => {
      writeLocal(key, next);
      cache.current = { raw: JSON.stringify(next), value: next };
      window.dispatchEvent(new Event(`pathlight:local-write:${key}`));
    },
    [key]
  );

  return [value, setValue];
}
