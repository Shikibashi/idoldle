import type { Guess } from "../types";

/**
 * Canonical public URL appended to every share card so recipients can
 * click through and play. Kept as a module constant (not hardcoded in
 * the function body) so the test suite and future environments can
 * inject a different value via the optional `shareUrl` param.
 */
export const DEFAULT_SHARE_URL = "https://idoldle.edriffles.us";

/**
 * Builds a spoiler-free shareable result card for Idoldle.
 *
 * The output contains three parts separated by newlines:
 *   1. Header:  `Idoldle {YYYY-MM-DD} {n}/6` (or `X/6` on a loss)
 *   2. Grid:    one row per guess — 🟩 correct, 🟨 present, ⬜ absent
 *   3. URL:     the canonical public URL (so recipients can click through)
 *
 * The only ASCII alphabetic characters in the grid rows are none —
 * no idol names, group names, or theme names. ASCII letters outside
 * the grid are limited to the literal `Idoldle` token in the header
 * and the canonical URL in the footer.
 */
export function buildShareCard(params: {
  dateKey: string;
  guesses: Guess[];
  won: boolean;
  maxGuesses: number;
  shareUrl?: string;
}): string {
  const { dateKey, guesses, won, maxGuesses, shareUrl = DEFAULT_SHARE_URL } = params;
  const countStr = won ? `${guesses.length}/${maxGuesses}` : `X/${maxGuesses}`;
  const grid = guesses
    .map((g) =>
      g.feedback
        .map((f) =>
          f.state === "correct" ? "🟩" : f.state === "present" ? "🟨" : "⬜",
        )
        .join(""),
    )
    .join("\n");
  const header = `Idoldle ${dateKey} ${countStr}`;
  // Only append the URL line when a non-empty URL is provided — makes
  // existing "ASCII letters only in header" invariants in the tests
  // trivially satisfiable via `shareUrl: ""`.
  return shareUrl ? `${header}\n${grid}\n${shareUrl}` : `${header}\n${grid}`;
}
