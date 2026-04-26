import { describe, it, expect } from "vitest";
import { computeBadges, BADGE_RULES } from "./badges";
import type { DailyResult, Stats } from "../types";
import { STORAGE_SCHEMA_VERSION } from "../types";

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDate: null,
    lastPlayedResult: null,
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    history: [],
    fastestSolveMs: null,
    ...overrides,
  };
}

function makeHistoryEntry(dateKey: string, won: boolean, guessCount = 3): DailyResult {
  return {
    dateKey,
    won,
    guessCount,
    solveTimeMs: won ? 30_000 : null,
    answerStageName: "KARINA",
  };
}

/** Build N consecutive daily history entries starting at startDate (YYYY-MM-DD). */
function consecutiveDates(startDate: string, count: number, won: boolean = true): DailyResult[] {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const out: DailyResult[] = [];
  for (let i = 0; i < count; i++) {
    const t = start + i * 86_400_000;
    const d = new Date(t);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    out.push(makeHistoryEntry(`${y}-${m}-${day}`, won));
  }
  return out;
}

describe("BADGE_RULES", () => {
  it("exports a non-empty list with stable ids", () => {
    expect(BADGE_RULES.length).toBeGreaterThan(0);
    const ids = BADGE_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("first-try");
    expect(ids).toContain("clutch");
    expect(ids).toContain("lightning");
    expect(ids).toContain("streaking");
    expect(ids).toContain("on-fire");
    expect(ids).toContain("legend");
    expect(ids).toContain("perfect-week");
    expect(ids).toContain("veteran");
  });
});

describe("computeBadges", () => {
  it("returns an empty list for empty stats", () => {
    expect(computeBadges(makeStats())).toEqual([]);
  });

  it("awards first-try only when dist[0] >= 1", () => {
    const stats = makeStats({ guessDistribution: [1, 0, 0, 0, 0, 0] });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).toEqual(["first-try"]);
  });

  it("awards clutch when dist[5] >= 1", () => {
    const stats = makeStats({ guessDistribution: [0, 0, 0, 0, 0, 1] });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).toEqual(["clutch"]);
  });

  it("awards streaking at 3 but not on-fire", () => {
    const stats = makeStats({ currentStreak: 3 });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).toContain("streaking");
    expect(ids).not.toContain("on-fire");
    expect(ids).not.toContain("legend");
  });

  it("awards both streaking and on-fire at 7", () => {
    const stats = makeStats({ currentStreak: 7 });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).toContain("streaking");
    expect(ids).toContain("on-fire");
    expect(ids).not.toContain("legend");
  });

  it("awards all three streak badges at 30", () => {
    const stats = makeStats({ currentStreak: 30 });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).toContain("streaking");
    expect(ids).toContain("on-fire");
    expect(ids).toContain("legend");
  });

  it("awards lightning when fastestSolveMs = 45000", () => {
    const stats = makeStats({ fastestSolveMs: 45_000 });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).toEqual(["lightning"]);
  });

  it("does NOT award lightning when fastestSolveMs = 60000 (strict <)", () => {
    const stats = makeStats({ fastestSolveMs: 60_000 });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).not.toContain("lightning");
  });

  it("does NOT award lightning when fastestSolveMs is null", () => {
    const stats = makeStats({ fastestSolveMs: null });
    expect(computeBadges(stats).map((b) => b.id)).not.toContain("lightning");
  });

  it("awards perfect-week when history has 7 consecutive wins", () => {
    const history = consecutiveDates("2026-04-17", 7, true);
    const stats = makeStats({ history });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).toContain("perfect-week");
  });

  it("does NOT award perfect-week when any of the last 7 is a loss", () => {
    const history = consecutiveDates("2026-04-17", 7, true);
    history[3] = makeHistoryEntry(history[3].dateKey, false);
    const stats = makeStats({ history });
    expect(computeBadges(stats).map((b) => b.id)).not.toContain("perfect-week");
  });

  it("does NOT award perfect-week when the 7 entries are not consecutive", () => {
    // 7 wins but with a gap in dates
    const history: DailyResult[] = [
      ...consecutiveDates("2026-04-10", 3, true),
      ...consecutiveDates("2026-04-15", 4, true),
    ];
    const stats = makeStats({ history });
    expect(computeBadges(stats).map((b) => b.id)).not.toContain("perfect-week");
  });

  it("does NOT award perfect-week with fewer than 7 history entries", () => {
    const history = consecutiveDates("2026-04-17", 6, true);
    const stats = makeStats({ history });
    expect(computeBadges(stats).map((b) => b.id)).not.toContain("perfect-week");
  });

  it("awards veteran at 50 games but not at 49", () => {
    expect(computeBadges(makeStats({ gamesPlayed: 49 })).map((b) => b.id)).not.toContain("veteran");
    expect(computeBadges(makeStats({ gamesPlayed: 50 })).map((b) => b.id)).toContain("veteran");
  });

  it("stacks multiple badges correctly", () => {
    const stats = makeStats({
      guessDistribution: [1, 0, 0, 0, 0, 1],
      currentStreak: 7,
      gamesPlayed: 50,
      fastestSolveMs: 30_000,
    });
    const ids = computeBadges(stats).map((b) => b.id);
    expect(ids).toContain("first-try");
    expect(ids).toContain("clutch");
    expect(ids).toContain("streaking");
    expect(ids).toContain("on-fire");
    expect(ids).toContain("lightning");
    expect(ids).toContain("veteran");
  });

  it("every returned badge has required fields", () => {
    const stats = makeStats({ currentStreak: 30, gamesPlayed: 100, fastestSolveMs: 10_000 });
    for (const b of computeBadges(stats)) {
      expect(typeof b.id).toBe("string");
      expect(typeof b.icon).toBe("string");
      expect(typeof b.label).toBe("string");
      expect(typeof b.description).toBe("string");
    }
  });
});
