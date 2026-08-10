import { describe, expect, it } from "vitest";
import {
  IDOLS_2026,
  IDOLS_2026_PROVENANCE,
  IDOLS_2026_SNAPSHOT_DATE,
} from "../data/idols2026";
import type { Snapshot, ThemeKey } from "../types";
import { mergeCuratedIdols } from "./mergeCuratedIdols";

const EMPTY_POOLS: Snapshot["frozenPools"] = {
  "len-4": { length: 4, idols: [] },
  "len-5": { length: 5, idols: [] },
  "len-6": { length: 6, idols: [] },
  "len-7": { length: 7, idols: [] },
  "len-8": { length: 8, idols: [] },
  "long-name": { length: null, idols: [] },
};

function expectedTheme(length: number): ThemeKey {
  return length <= 8 ? (`len-${length}` as ThemeKey) : "long-name";
}

describe("2026 girl-group curated layer", () => {
  it("contains only playable 2026 human-idol rows", () => {
    expect(IDOLS_2026).toHaveLength(61);
    expect(IDOLS_2026_PROVENANCE).toHaveLength(61);

    for (const idol of IDOLS_2026) {
      expect(idol.debutYear).toBe(2026);
      expect(idol.era).toBe("5th gen");
      expect(idol.stageName).toMatch(/^[A-Z]{4,10}$/);
      expect(idol.themeTags).toEqual([expectedTheme(idol.stageName.length)]);
    }

    for (const row of IDOLS_2026_PROVENANCE) {
      expect(row.debutDate >= "2026-01-01").toBe(true);
      expect(row.debutDate <= IDOLS_2026_SNAPSHOT_DATE).toBe(true);
      expect(row.sourceUrl.startsWith("https://")).toBe(true);
    }
  });

  it("keeps explicitly excluded virtual/pre-debut and unplayable names out", () => {
    const names = new Set(IDOLS_2026.map((idol) => idol.stageName));
    const groups = new Set(IDOLS_2026.map((idol) => idol.group));

    // 3-letter or >10-letter human member names that cannot be Wordle answers.
    for (const name of ["HYO", "SEA", "DIA", "AKO", "YSY", "DOI", "LEESONGHYUN"]) {
      expect(names.has(name)).toBe(false);
    }

    // AI/virtual/pre-debut/non-idol acts from the 2026 research pass.
    for (const group of ["OWIS", "XD:I", "Choco2", "Hat:q"]) {
      expect(groups.has(group)).toBe(false);
    }
  });

  it("deduplicates stage-name collisions and records alternate groups", () => {
    const base: Snapshot = {
      snapshotDate: "2026-05-02",
      idols: [
        {
          stageName: "JISOO",
          group: "BLACKPINK",
          era: "3rd gen",
          debutYear: 2016,
          themeTags: ["len-5"],
        },
      ],
      frozenPools: EMPTY_POOLS,
    };

    const merged = mergeCuratedIdols(base);
    const jisooRows = merged.idols.filter((idol) => idol.stageName === "JISOO");

    expect(jisooRows).toHaveLength(1);
    expect(jisooRows[0].group).toBe("BLACKPINK");
    expect(jisooRows[0].aliases).toEqual(expect.arrayContaining(["AFuture", "SAVVVY"]));
    expect(merged.snapshotDate).toBe(IDOLS_2026_SNAPSHOT_DATE);
  });

  it("rebuilds length pools so new names immediately enter rotation", () => {
    const base: Snapshot = {
      snapshotDate: "2026-05-02",
      idols: [],
      frozenPools: EMPTY_POOLS,
    };

    const merged = mergeCuratedIdols(base);
    const allNames = merged.idols.map((idol) => idol.stageName);

    expect(new Set(allNames).size).toBe(allNames.length);
    expect(merged.frozenPools["len-6"].idols.some((idol) => idol.stageName === "MELODY")).toBe(true);
    expect(merged.frozenPools["len-4"].idols.some((idol) => idol.stageName === "NEWY")).toBe(true);
    expect(merged.frozenPools["long-name"].idols.some((idol) => idol.stageName === "KANGYESEUL")).toBe(true);

    const haeun = merged.idols.find((idol) => idol.stageName === "HAEUN");
    expect(haeun?.group).toBe("LATENCY");
    expect(haeun?.aliases).toContain("UNCHILD");
  });
});
