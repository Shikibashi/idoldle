import type { ThemeKey, WordLength } from "../types";

/**
 * Maps UTC day-of-week (0 = Sunday) to the active theme key.
 *
 * Day-to-length mapping (length-driven theming):
 *   Sunday    → 5-letter names (bonus canonical Wordle length)
 *   Monday    → 4-letter names
 *   Tuesday   → 5-letter names
 *   Wednesday → 6-letter names
 *   Thursday  → 7-letter names
 *   Friday    → 8-letter names
 *   Saturday  → long names (mixed 9-10 letters) — combined because the
 *              9 and 10-letter pools are individually too small for a
 *              dedicated day. The game derives the puzzle's exact length
 *              from the chosen answer at runtime.
 */
export const THEME_BY_DOW: Record<number, ThemeKey> = {
  0: "len-5",
  1: "len-4",
  2: "len-5",
  3: "len-6",
  4: "len-7",
  5: "len-8",
  6: "long-name",
};

/**
 * Returns the ThemeKey for a given UTC date string (YYYY-MM-DD).
 * The date is parsed as midnight UTC to avoid timezone shifts.
 */
export function resolveThemeKey(utcDateKey: string): ThemeKey {
  const d = new Date(`${utcDateKey}T00:00:00Z`);
  return THEME_BY_DOW[d.getUTCDay()];
}

/** Human-readable label for each theme, used in the HUD. */
export const THEME_LABEL: Record<ThemeKey, string> = {
  "len-4": "4-letter names",
  "len-5": "5-letter names",
  "len-6": "6-letter names",
  "len-7": "7-letter names",
  "len-8": "8-letter names",
  "long-name": "Long names (9-10)",
};

/**
 * The word length for fixed-length themes. Absent keys (like "long-name")
 * have variable length — the game derives the length from the chosen
 * answer's stageName at runtime instead of from the theme.
 */
export const THEME_LENGTH: Partial<Record<ThemeKey, WordLength>> = {
  "len-4": 4,
  "len-5": 5,
  "len-6": 6,
  "len-7": 7,
  "len-8": 8,
};

/**
 * Resolves the active word length for today.
 *
 * For fixed-length themes, returns the mapped length from THEME_LENGTH.
 * For mixed-length themes (`long-name`), returns `null` — callers must
 * derive the length from the chosen answer's stageName instead.
 */
export function resolveLength(utcDateKey: string): WordLength | null {
  return THEME_LENGTH[resolveThemeKey(utcDateKey)] ?? null;
}

/**
 * Fallback chain applied at SNAPSHOT BUILD TIME, not runtime.
 *
 * With per-theme word-length pinning, any theme-to-theme fallback would
 * be a cross-length fallback (incompatible). The map is intentionally
 * empty; each pool must stand on its own by having enough natively-tagged
 * idols.
 */
export const THEME_FALLBACK: Partial<Record<ThemeKey, ThemeKey>> = {};
