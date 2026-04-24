import { useState, useCallback } from "react";

/**
 * Runtime shape validator. Callers may pass one via the `validator` option
 * below to reject stored values whose shape drifted from T even when the
 * schema version matches (e.g. after manual devtools tampering, a crashed
 * write, or a malicious browser extension).
 *
 * Using a predicate type guard so successful validation narrows the type.
 */
export type Validator<T> = (candidate: unknown) => candidate is T;

export interface UseLocalStorageOptions<T> {
  /** Optional runtime shape check. If it returns false, initial is used. */
  validator?: Validator<T>;
}

/**
 * useLocalStorage — typed, schema-versioned localStorage hook.
 *
 * Stored format: `{ _v: number; data: T }`
 *
 * Reads are gated by TWO checks:
 *   1. `_v === schemaVersion` — discards stored values after a schema bump
 *   2. optional `validator(data)` — rejects shape-corrupted values even
 *      when `_v` matches (defense against tampering and partial writes)
 *
 * SSR-safe: checks `typeof window` before touching localStorage.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  schemaVersion: number,
  options: UseLocalStorageOptions<T> = {},
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValueState] = useState<T>(() =>
    readFromStorage(key, initial, schemaVersion, options.validator),
  );

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: T) => T)(prev)
            : updater;
        writeToStorage(key, next, schemaVersion);
        return next;
      });
    },
    [key, schemaVersion],
  );

  return [value, setValue];
}

interface StoredEnvelope<T> {
  _v: number;
  data: T;
}

function readFromStorage<T>(
  key: string,
  initial: T,
  schemaVersion: number,
  validator?: Validator<T>,
): T {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return initial;
    const parsed = JSON.parse(raw) as StoredEnvelope<unknown>;
    // Reject non-object envelopes (e.g. someone wrote `42` or `"hello"`).
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      !("_v" in parsed) ||
      !("data" in parsed)
    ) {
      return initial;
    }
    if (parsed._v !== schemaVersion) return initial;
    // Optional runtime shape check
    if (validator && !validator(parsed.data)) return initial;
    return parsed.data as T;
  } catch {
    return initial;
  }
}

function writeToStorage<T>(key: string, value: T, schemaVersion: number): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: StoredEnvelope<T> = { _v: schemaVersion, data: value };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Quota exceeded or private browsing — silently swallow.
  }
}
