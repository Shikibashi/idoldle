import type { Badge, DailyResult, Stats } from "../types";

/**
 * Pure, static badge definitions with a predicate over the current Stats.
 * Exported so tests can iterate. Order here is the order badges appear
 * in the rendered badge row.
 */
export interface BadgeRule {
  id: string;
  icon: string;
  label: string;
  description: string;
  earned: (stats: Stats) => boolean;
}

/**
 * Detect whether the final 7 entries of history form a "perfect week":
 * all wins AND spanning 7 consecutive UTC dates. Requires at least 7 entries.
 */
function hasPerfectWeek(history: DailyResult[]): boolean {
  if (history.length < 7) return false;
  const last7 = history.slice(-7);
  if (!last7.every((h) => h.won)) return false;

  // Parse dateKeys (YYYY-MM-DD UTC) to epoch day numbers and verify
  // they form a strictly consecutive run. Using UTC midnight avoids
  // DST / local-offset off-by-one.
  const days = last7.map((h) => {
    const t = Date.parse(`${h.dateKey}T00:00:00Z`);
    if (Number.isNaN(t)) return null;
    return Math.floor(t / 86_400_000);
  });
  if (days.some((d) => d === null)) return false;
  for (let i = 1; i < days.length; i++) {
    if ((days[i] as number) - (days[i - 1] as number) !== 1) return false;
  }
  return true;
}

export const BADGE_RULES: BadgeRule[] = [
  {
    id: "first-try",
    icon: "🎯",
    label: "First Try",
    description: "Solved in 1 guess",
    earned: (s) => s.guessDistribution[0] >= 1,
  },
  {
    id: "clutch",
    icon: "😅",
    label: "Clutch",
    description: "Solved on the 6th guess",
    earned: (s) => s.guessDistribution[5] >= 1,
  },
  {
    id: "lightning",
    icon: "⚡",
    label: "Lightning",
    description: "Solved in under 60 s",
    earned: (s) => s.fastestSolveMs !== null && s.fastestSolveMs < 60_000,
  },
  {
    id: "streaking",
    icon: "🔥",
    label: "Streaking",
    description: "3+ day streak",
    earned: (s) => s.currentStreak >= 3,
  },
  {
    id: "on-fire",
    icon: "🔥🔥",
    label: "On Fire",
    description: "7+ day streak",
    earned: (s) => s.currentStreak >= 7,
  },
  {
    id: "legend",
    icon: "👑",
    label: "Legend",
    description: "30+ day streak",
    earned: (s) => s.currentStreak >= 30,
  },
  {
    id: "perfect-week",
    icon: "💯",
    label: "Perfect Week",
    description: "Won 7 consecutive days",
    earned: (s) => hasPerfectWeek(s.history),
  },
  {
    id: "veteran",
    icon: "🏆",
    label: "Veteran",
    description: "50+ games played",
    earned: (s) => s.gamesPlayed >= 50,
  },
];

/**
 * Compute the list of earned badges from current Stats. Pure, no I/O.
 * Order matches BADGE_RULES (stable for UI rendering).
 */
export function computeBadges(stats: Stats): Badge[] {
  return BADGE_RULES.filter((r) => r.earned(stats)).map((r) => ({
    id: r.id,
    icon: r.icon,
    label: r.label,
    description: r.description,
  }));
}
