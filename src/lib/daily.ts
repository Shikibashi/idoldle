import type { Idol, Snapshot, ThemeKey } from "../types";
import { cyrb53 } from "./hash";
import { resolveThemeKey } from "./themes";

/**
 * Returns the UTC date key (YYYY-MM-DD) for a given Date object.
 * Always uses UTC so that all players on the same calendar day see the
 * same puzzle regardless of local timezone.
 */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Deterministically selects today's answer idol from the snapshot.
 *
 * Hash input: `{utcDateKey}|{themeKey}|{snapshot.snapshotDate}`
 * The `snapshotDate` component means that deploying a new snapshot
 * creates a new determinism epoch — players on the old deploy and the
 * new deploy may see different answers, but within a single deploy
 * every player worldwide sees the same answer.
 *
 * @param utcDateKey      - YYYY-MM-DD UTC date string
 * @param snapshot        - The committed idol snapshot
 * @param themeResolver   - Optional override for theme resolution (useful in tests)
 * @returns               The Idol that is the answer for this date
 * @throws                If the frozen pool for the resolved theme is empty
 */
export function getDailyAnswer(
  utcDateKey: string,
  snapshot: Snapshot,
  themeResolver?: (d: string) => ThemeKey,
): Idol {
  const themeKey = (themeResolver ?? resolveThemeKey)(utcDateKey);
  const frozenPool = snapshot.frozenPools[themeKey];
  if (!frozenPool || frozenPool.idols.length === 0) {
    throw new Error(`Empty frozen pool for theme ${themeKey}`);
  }
  const seed = `${utcDateKey}|${themeKey}|${snapshot.snapshotDate}`;
  const hash = cyrb53(seed);
  const idol = frozenPool.idols[hash % frozenPool.idols.length];
  // Verify length consistency for fixed-length pools. Mixed pools
  // (frozenPool.length === null) intentionally hold multiple lengths.
  if (frozenPool.length !== null && idol.stageName.length !== frozenPool.length) {
    throw new Error(
      `Snapshot inconsistency: idol "${idol.stageName}" has length ` +
        `${idol.stageName.length} but pool "${themeKey}" pins length ` +
        `${frozenPool.length}`,
    );
  }
  return idol;
}
