export type ThemeKey =
  | "len-4"
  | "len-5"
  | "len-6"
  | "len-7"
  | "len-8"
  | "long-name"; // combined 9+10 letter pool (Saturday)

export type LetterState = "empty" | "pending" | "correct" | "present" | "absent";

export interface LetterFeedback {
  char: string;
  state: LetterState;
}

export interface Idol {
  stageName: string;     // uppercase ASCII A-Z; length in [4, 10]
  group: string;
  era: string;           // e.g. "4th gen"
  debutYear: number;
  themeTags: ThemeKey[]; // which themed pools this idol qualifies for
  aliases?: string[];    // optional alternate spellings / other group affiliations
}

export const SUPPORTED_LENGTHS = [4, 5, 6, 7, 8, 9, 10] as const;
export type WordLength = typeof SUPPORTED_LENGTHS[number];

export interface FrozenPool {
  /**
   * The pinned word length for this pool, or `null` for mixed-length
   * pools (e.g. "long-name" which combines 9 and 10 letter idols).
   * Game runtime derives the actual puzzle length from the chosen
   * answer's stageName.length — this field is mainly for validation.
   */
  length: WordLength | null;
  idols: Idol[];
}

export interface Snapshot {
  snapshotDate: string; // YYYY-MM-DD UTC, used in daily-answer hash
  idols: Idol[];
  frozenPools: Record<ThemeKey, FrozenPool>; // precomputed pools, each pinned to its length
  attribution?: { source: string; license: string; url: string };
}

export interface Guess {
  word: string;
  feedback: LetterFeedback[];
}

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  dateKey: string;            // YYYY-MM-DD UTC
  theme: ThemeKey;
  length: WordLength;         // word length for today's puzzle
  answer: Idol;
  guesses: Guess[];
  currentInput: string;
  status: GameStatus;
  maxGuesses: 6;
}

/**
 * A single day's result, retained in Stats.history for the rolling
 * 30-day heatmap shown in the stats modal. Stored per UTC-date so a
 * returning user sees a contribution-grid style record of recent play.
 */
export interface DailyResult {
  dateKey: string;                   // YYYY-MM-DD UTC
  won: boolean;
  guessCount: number;                // number of guesses used (1-6 on win, 6 on loss)
  solveTimeMs: number | null;        // time from first guess submission to win; null on loss
  answerStageName: string;           // the idol they were solving for (spoiler OK post-game)
}

export interface Stats {
  currentStreak: number;
  longestStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: [number, number, number, number, number, number]; // index 0 = solved in 1 guess
  lastPlayedDate: string | null;
  lastPlayedResult: "won" | "lost" | null;
  storageSchemaVersion: number;      // bump if shape changes
  /** Rolling last-30-day log for the stats-modal heatmap. Append-only (capped). */
  history: DailyResult[];
  /** Fastest recorded solve time in ms (wins only). null until a first win. */
  fastestSolveMs: number | null;
}

/** Badge earned by the player, computed on demand from Stats — never stored. */
export interface Badge {
  id: string;
  label: string;
  icon: string;     // emoji
  description: string;
}

// Schema version history:
//   v1–v2: pre-refactor era-themed / 5-6-letter-only variants (historical)
//   v3:    length-driven themes + long-name pool (earlier April 2026)
//   v4:    dataset expansion 260→359 idols + SNAPSHOT_DATE epoch bump
//   v5:    added Stats.history[] and Stats.fastestSolveMs (achievements + heatmap)
// Bumps invalidate stored stats/gameState via useLocalStorage's version gate.
export const STORAGE_SCHEMA_VERSION = 5;
export const MAX_GUESSES = 6;
export const HISTORY_CAP = 30;
