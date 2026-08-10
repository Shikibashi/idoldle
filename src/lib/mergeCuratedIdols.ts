import { IDOLS_2026, IDOLS_2026_SNAPSHOT_DATE } from "../data/idols2026";
import type { FrozenPool, Idol, Snapshot, ThemeKey } from "../types";
import { THEME_LENGTH } from "./themes";

const ALL_THEME_KEYS: ThemeKey[] = [
  "len-4",
  "len-5",
  "len-6",
  "len-7",
  "len-8",
  "long-name",
];

function rebuildFrozenPools(idols: Idol[]): Record<ThemeKey, FrozenPool> {
  const pools = {} as Record<ThemeKey, FrozenPool>;

  for (const key of ALL_THEME_KEYS) {
    const pinnedLength = THEME_LENGTH[key];
    const seen = new Set<string>();

    const members = idols
      .filter((idol) => idol.themeTags.includes(key))
      .filter((idol) =>
        pinnedLength !== undefined
          ? idol.stageName.length === pinnedLength
          : idol.stageName.length === 9 || idol.stageName.length === 10,
      )
      .filter((idol) => {
        if (seen.has(idol.stageName)) return false;
        seen.add(idol.stageName);
        return true;
      })
      .sort((a, b) => a.stageName.localeCompare(b.stageName));

    pools[key] = {
      length: pinnedLength ?? null,
      idols: members,
    };
  }

  return pools;
}

function mergeAlias(existing: Idol, alternateGroup: string): Idol {
  if (existing.group === alternateGroup) return existing;

  const aliases = new Set(existing.aliases ?? []);
  aliases.add(alternateGroup);

  return {
    ...existing,
    aliases: [...aliases].sort((a, b) => a.localeCompare(b)),
  };
}

/**
 * Clone an Idol while preserving the interface's optional aliases field.
 * Explicitly returning Idol prevents TypeScript from inferring a stricter
 * array element type where `aliases` is a required `string[] | undefined`
 * property, which then rejects additions that legitimately omit aliases.
 */
function cloneIdol(idol: Idol): Idol {
  return {
    ...idol,
    ...(idol.aliases ? { aliases: [...idol.aliases] } : {}),
    themeTags: [...idol.themeTags],
  };
}

/**
 * Merge the fast-moving curated 2026 rookie layer into the generated base
 * snapshot. The app guesses stage names, so stage-name collisions remain one
 * puzzle answer; alternate groups are recorded in aliases, matching the legacy
 * build-snapshot dedup convention.
 *
 * The frozen pools are rebuilt after the merge so every new unique name enters
 * its correct length rotation immediately. Bumping snapshotDate intentionally
 * starts a new deterministic-answer epoch for this data release.
 */
export function mergeCuratedIdols(
  base: Snapshot,
  additions: Idol[] = IDOLS_2026,
  snapshotDate = IDOLS_2026_SNAPSHOT_DATE,
): Snapshot {
  const idols: Idol[] = base.idols.map(cloneIdol);

  const indexByStageName = new Map<string, number>();
  idols.forEach((idol, index) => indexByStageName.set(idol.stageName, index));

  for (const addition of additions) {
    const existingIndex = indexByStageName.get(addition.stageName);

    if (existingIndex !== undefined) {
      const existing = idols[existingIndex];
      const withAlias = mergeAlias(existing, addition.group);
      idols[existingIndex] = {
        ...withAlias,
        themeTags: [...new Set([...withAlias.themeTags, ...addition.themeTags])],
      };
      continue;
    }

    indexByStageName.set(addition.stageName, idols.length);
    idols.push(cloneIdol(addition));
  }

  return {
    ...base,
    snapshotDate,
    idols,
    frozenPools: rebuildFrozenPools(idols),
  };
}
