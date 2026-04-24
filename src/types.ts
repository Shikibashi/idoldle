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

export interface Stats {
  currentStreak: number;
  longestStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: [number, number, number, number, number, number]; // index 0 = solved in 1 guess
  lastPlayedDate: string | null;
  lastPlayedResult: "won" | "lost" | null;
  storageSchemaVersion: number; // bump if shape changes
}

// Bumped to 4 on 2026-04-24 after the dataset expansion (260 → 359 idols)
// + SNAPSHOT_DATE epoch bump. Any stored gameState written before this
// carries a stale `answer` from the old 260-idol pool, so useLocalStorage
// must discard it and let useGame recompute against the current snapshot.
export const STORAGE_SCHEMA_VERSION = 4;
export const MAX_GUESSES = 6;
