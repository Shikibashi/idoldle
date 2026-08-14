import { describe, it, expect } from "vitest";
import { getDailyAnswer, utcDateKey } from "./daily";
import { resolveThemeKey, THEME_LENGTH } from "./themes";
import type {
  Snapshot,
  ThemeKey,
  Idol,
  FrozenPool,
  WordLength,
} from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeIdol(stageName: string, themeKey: ThemeKey): Idol {
  return {
    stageName,
    group: "TestGroup",
    era: "4th gen",
    debutYear: 2020,
    themeTags: [themeKey],
  };
}

function makeSnapshot(
  overrides?: Partial<{ snapshotDate: string; poolSize: number }>,
): Snapshot {
  const snapshotDate = overrides?.snapshotDate ?? "2024-01-01";
  const poolSize = overrides?.poolSize ?? 10;

  const allThemes: ThemeKey[] = [
    "len-4",
    "len-5",
    "len-6",
    "len-7",
    "len-8",
    "long-name",
  ];

  // Build per-theme pools. Fixed-length themes use THEME_LENGTH;
  // "long-name" is mixed — fixture uses length 9 for its entries and
  // reports pool.length = null (matches the build-frozen-pools contract).
  const frozenPools = {} as Record<ThemeKey, FrozenPool>;
  const allIdols: Idol[] = [];
  for (const themeKey of allThemes) {
    const fixedLen = THEME_LENGTH[themeKey];
    const entryLen: WordLength = (fixedLen ?? 9) as WordLength;
    const idols = Array.from({ length: poolSize }, (_, i) => {
      const suffix = String(i).padStart(entryLen - 2, "0");
      return makeIdol(`ID${suffix}`, themeKey);
    });
    frozenPools[themeKey] = { length: fixedLen ?? null, idols };
    allIdols.push(...idols);
  }

  return { snapshotDate, idols: allIdols, frozenPools };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("getDailyAnswer", () => {
  it("is deterministic: same inputs produce the same output over 1000 iterations", () => {
    const snapshot = makeSnapshot();
    const dateKey = "2024-06-15";
    const first = getDailyAnswer(dateKey, snapshot);
    for (let i = 0; i < 1000; i++) {
      const result = getDailyAnswer(dateKey, snapshot);
      expect(result.stageName).toBe(first.stageName);
    }
  });

  it("different snapshotDate may yield different answers over 30 dates", () => {
    const snapA = makeSnapshot({ snapshotDate: "2024-01-01" });
    const snapB = makeSnapshot({ snapshotDate: "2024-06-01" });
    let diffCount = 0;
    for (let day = 0; day < 30; day++) {
      const date = new Date(Date.UTC(2024, 0, 1 + day));
      const dateKey = utcDateKey(date);
      const a = getDailyAnswer(dateKey, snapA);
      const b = getDailyAnswer(dateKey, snapB);
      if (a.stageName !== b.stageName) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it("throws when the frozen pool is empty", () => {
    const snapshot = makeSnapshot();
    snapshot.frozenPools["len-4"] = { length: 4, idols: [] };
    const mondayKey = "2024-06-17"; // a Monday → len-4
    expect(() => getDailyAnswer(mondayKey, snapshot)).toThrow(
      /Empty frozen pool/,
    );
  });

  it("throws when a fixed-length pool contains an inconsistent idol", () => {
    const snapshot = makeSnapshot();
    snapshot.frozenPools["len-4"] = {
      length: 4,
      idols: [makeIdol("TOO-LONG", "len-4")],
    };
    expect(() => getDailyAnswer("2024-06-17", snapshot)).toThrow(
      /Snapshot inconsistency/,
    );
  });

  it("themeKey resolution works for each day of the week", () => {
    const snapshot = makeSnapshot();
    const expectedThemes: ThemeKey[] = [
      "len-5", // Sunday    2024-06-16 (bonus canonical)
      "len-4", // Monday    2024-06-17
      "len-5", // Tuesday   2024-06-18
      "len-6", // Wednesday 2024-06-19
      "len-7", // Thursday  2024-06-20
      "len-8", // Friday    2024-06-21
      "long-name", // Saturday  2024-06-22
    ];
    const dates = [
      "2024-06-16",
      "2024-06-17",
      "2024-06-18",
      "2024-06-19",
      "2024-06-20",
      "2024-06-21",
      "2024-06-22",
    ];
    for (let i = 0; i < 7; i++) {
      expect(resolveThemeKey(dates[i])).toBe(expectedThemes[i]);
      expect(() => getDailyAnswer(dates[i], snapshot)).not.toThrow();
    }
  });

  it("returns an idol that exists in the pool", () => {
    const snapshot = makeSnapshot({ poolSize: 5 });
    const dateKey = "2024-03-15"; // a Friday → len-8
    const result = getDailyAnswer(dateKey, snapshot);
    const pool = snapshot.frozenPools["len-8"].idols;
    expect(pool.some((idol) => idol.stageName === result.stageName)).toBe(true);
  });

  it("returns an idol whose stageName length is valid for the pool", () => {
    const snapshot = makeSnapshot();
    const days = [
      "2024-06-16",
      "2024-06-17",
      "2024-06-18",
      "2024-06-19",
      "2024-06-20",
      "2024-06-21",
      "2024-06-22",
    ];
    for (const date of days) {
      const result = getDailyAnswer(date, snapshot);
      const themeKey = resolveThemeKey(date);
      const pool = snapshot.frozenPools[themeKey];
      if (pool.length === null) {
        // Mixed pool (long-name): idol length must be 9 or 10
        expect([9, 10]).toContain(result.stageName.length);
      } else {
        expect(result.stageName.length).toBe(pool.length);
      }
    }
  });

  it("index stays within pool bounds across many dates", () => {
    const snapshot = makeSnapshot({ poolSize: 7 });
    const allNames = new Set<string>();
    for (const key of Object.keys(snapshot.frozenPools) as ThemeKey[]) {
      for (const idol of snapshot.frozenPools[key].idols) {
        allNames.add(idol.stageName);
      }
    }
    for (let day = 0; day < 365; day++) {
      const date = new Date(Date.UTC(2024, 0, 1 + day));
      const key = utcDateKey(date);
      const result = getDailyAnswer(key, snapshot);
      expect(allNames.has(result.stageName)).toBe(true);
    }
  });

  it("custom themeResolver is used when provided", () => {
    const snapshot = makeSnapshot();
    const dateKey = "2024-06-15";
    let resolverCalled = false;
    getDailyAnswer(dateKey, snapshot, (d) => {
      resolverCalled = true;
      return resolveThemeKey(d);
    });
    expect(resolverCalled).toBe(true);
  });
});

describe("utcDateKey", () => {
  it("formats a UTC date as YYYY-MM-DD", () => {
    expect(utcDateKey(new Date("2024-06-15T00:00:00Z"))).toBe("2024-06-15");
  });

  it("handles year boundaries", () => {
    expect(utcDateKey(new Date("2023-12-31T23:59:59Z"))).toBe("2023-12-31");
    expect(utcDateKey(new Date("2024-01-01T00:00:00Z"))).toBe("2024-01-01");
  });
});
