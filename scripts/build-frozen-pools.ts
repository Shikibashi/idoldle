/**
 * build-frozen-pools.ts
 *
 * Produces a frozenPools map keyed by ThemeKey where each entry is
 * { length, idols[] }.
 *
 * For each theme:
 *   1. Collect idols whose themeTags include this themeKey AND whose
 *      stageName length matches THEME_LENGTH[themeKey].
 *   2. Deduplicate by stageName, then sort alphabetically.
 *
 * No theme-to-theme fallback: pools now pin a length, and length-driven
 * theming means each pool must stand on its own via the native themeTags
 * of the idols.
 *
 * This function is called by build-snapshot.ts at snapshot build time.
 */

import type { FrozenPool, Idol, ThemeKey } from "../src/types";
import { THEME_LENGTH } from "../src/lib/themes";

const ALL_THEME_KEYS: ThemeKey[] = [
  "len-4",
  "len-5",
  "len-6",
  "len-7",
  "len-8",
  "long-name",
];

/**
 * Builds the frozenPools map from a flat list of idols.
 * Each pool is sorted ascending by stageName for deterministic indexing.
 *
 * Fixed-length themes (len-4..len-8) only include idols whose stageName
 * matches THEME_LENGTH[key]. The "long-name" theme accepts idols of
 * length 9 or 10 (mixed), and reports its length as null.
 */
export function buildFrozenPools(
  idols: Idol[],
): Record<ThemeKey, FrozenPool> {
  // Index idols by each themeTag for fast lookup
  const byTag = new Map<ThemeKey, Idol[]>();
  for (const key of ALL_THEME_KEYS) {
    byTag.set(key, []);
  }
  for (const idol of idols) {
    for (const tag of idol.themeTags) {
      byTag.get(tag)?.push(idol);
    }
  }

  const pools = {} as Record<ThemeKey, FrozenPool>;

  for (const key of ALL_THEME_KEYS) {
    const pinnedLength = THEME_LENGTH[key]; // undefined for "long-name"
    const raw = byTag.get(key) ?? [];

    // Filter: fixed-length themes match THEME_LENGTH; "long-name" accepts 9 or 10.
    const filtered = raw.filter((i) => {
      if (pinnedLength !== undefined) return i.stageName.length === pinnedLength;
      return i.stageName.length === 9 || i.stageName.length === 10;
    });

    // Deduplicate by stageName, then sort ascending for deterministic indexing
    const seen = new Set<string>();
    const deduped: Idol[] = [];
    for (const idol of filtered) {
      if (!seen.has(idol.stageName)) {
        seen.add(idol.stageName);
        deduped.push(idol);
      }
    }
    deduped.sort((a, b) => a.stageName.localeCompare(b.stageName));

    pools[key] = { length: pinnedLength ?? null, idols: deduped };
  }

  return pools;
}
