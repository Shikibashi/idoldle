import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { GameState, GameStatus, Guess, Idol, LetterState, Snapshot, Stats, WordLength } from "../types";
import { MAX_GUESSES, STORAGE_SCHEMA_VERSION } from "../types";
import { useLocalStorage } from "./useLocalStorage";
import { scoreGuess } from "../lib/wordle";
import { getDailyAnswer, utcDateKey } from "../lib/daily";
import { resolveThemeKey, THEME_LABEL } from "../lib/themes";
import { buildShareCard } from "../lib/share";

const INITIAL_STATS: Stats = {
  currentStreak: 0,
  longestStreak: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0],
  lastPlayedDate: null,
  lastPlayedResult: null,
  storageSchemaVersion: STORAGE_SCHEMA_VERSION,
};

// ─── Runtime shape validators for localStorage reads ────────────────────────
// Minimal structural checks that reject obviously-corrupted state while
// staying cheap. Full property-by-property validation would be overkill —
// the schema version check (STORAGE_SCHEMA_VERSION) handles real shape
// changes; these guards only need to catch tampering and partial writes.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isGameState(v: unknown): v is GameState {
  if (!isObject(v)) return false;
  if (typeof v.dateKey !== "string") return false;
  if (typeof v.theme !== "string") return false;
  if (typeof v.length !== "number") return false;
  if (typeof v.currentInput !== "string") return false;
  if (typeof v.status !== "string") return false;
  if (typeof v.maxGuesses !== "number") return false;
  if (!Array.isArray(v.guesses)) return false;
  if (!isObject(v.answer)) return false;
  if (typeof (v.answer as Record<string, unknown>).stageName !== "string") return false;
  return true;
}

function isStats(v: unknown): v is Stats {
  if (!isObject(v)) return false;
  if (typeof v.currentStreak !== "number") return false;
  if (typeof v.longestStreak !== "number") return false;
  if (typeof v.gamesPlayed !== "number") return false;
  if (typeof v.gamesWon !== "number") return false;
  if (!Array.isArray(v.guessDistribution) || v.guessDistribution.length !== 6) return false;
  if (!v.guessDistribution.every((n) => typeof n === "number")) return false;
  return true;
}


function makeInitialGameState(snapshot: Snapshot, dateKey: string): GameState {
  const theme = resolveThemeKey(dateKey);
  const answer = getDailyAnswer(dateKey, snapshot);
  // Derive length from the chosen answer so mixed-length themes
  // (e.g. "long-name" which includes 9 and 10 letter idols) work correctly.
  const length = answer.stageName.length as WordLength;
  return {
    dateKey,
    theme,
    length,
    answer,
    guesses: [],
    currentInput: "",
    status: "playing" as GameStatus,
    maxGuesses: 6,
  };
}

export function useGame(snapshot: Snapshot): {
  state: GameState;
  stats: Stats;
  toast: string | null;
  shaking: boolean;
  submitInput: () => void;
  addChar: (c: string) => void;
  backspace: () => void;
  letterStates: Record<string, LetterState>;
  shareCard: string;
  resetTodayIfStale: () => void;
  themeLabel: string;
  dateKey: string;
  length: WordLength;
} {
  const today = utcDateKey(new Date());
  const themeKey = resolveThemeKey(today);
  const themeLabel = THEME_LABEL[themeKey];

  const initialState = makeInitialGameState(snapshot, today);

  const [state, setState] = useLocalStorage<GameState>(
    "idoldle:gameState",
    initialState,
    STORAGE_SCHEMA_VERSION,
    { validator: isGameState },
  );

  const [stats, setStats] = useLocalStorage<Stats>(
    "idoldle:stats",
    INITIAL_STATS,
    STORAGE_SCHEMA_VERSION,
    { validator: isStats },
  );

  const [toast, setToast] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-clear toast after 1.5s
  useEffect(() => {
    if (toast === null) return;
    const id = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(id);
  }, [toast]);

  // Cleanup shake timer on unmount
  useEffect(() => {
    return () => {
      if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const triggerShake = useCallback(() => {
    if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
    setShaking(true);
    shakeTimerRef.current = setTimeout(() => {
      setShaking(false);
      shakeTimerRef.current = null;
    }, 400);
  }, []);

  // Reset game state if stored dateKey doesn't match today (midnight crossing)
  const resetTodayIfStale = useCallback(() => {
    const nowKey = utcDateKey(new Date());
    setState((prev) => {
      if (prev.dateKey === nowKey) return prev;
      return makeInitialGameState(snapshot, nowKey);
    });
  }, [snapshot, setState]);

  // On mount: if stored state is from a different day, reset
  useEffect(() => {
    resetTodayIfStale();
  }, [resetTodayIfStale]);

  const addChar = useCallback(
    (c: string) => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.currentInput.length >= prev.length) return prev;
        return { ...prev, currentInput: prev.currentInput + c.toUpperCase() };
      });
    },
    [setState],
  );

  const backspace = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      if (prev.currentInput.length === 0) return prev;
      return { ...prev, currentInput: prev.currentInput.slice(0, -1) };
    });
  }, [setState]);

  const submitInput = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;

      const word = prev.currentInput.toUpperCase();

      // Validation 1: length
      if (word.length !== prev.length) {
        showToast(`Need ${prev.length} letters`);
        triggerShake();
        return prev;
      }

      // Validation 2: must be in today's themed pool (uppercase stageName match)
      const themeK = resolveThemeKey(prev.dateKey);
      const frozenPool = snapshot.frozenPools[themeK];
      const pool = frozenPool?.idols ?? [];
      const valid = pool.some((idol: Idol) => idol.stageName.toUpperCase() === word);
      if (!valid) {
        showToast("Not a valid idol name");
        triggerShake();
        return prev;
      }

      // Score the guess
      const feedback = scoreGuess(prev.answer.stageName, word);
      const newGuess: Guess = { word, feedback };
      const newGuesses = [...prev.guesses, newGuess];
      const won = feedback.every((f) => f.state === "correct");
      const lost = !won && newGuesses.length >= MAX_GUESSES;

      const newStatus: GameStatus = won ? "won" : lost ? "lost" : "playing";

      // Update stats if game ended
      if (won || lost) {
        setStats((prevStats) => {
          const dist = [...prevStats.guessDistribution] as Stats["guessDistribution"];
          if (won) {
            dist[newGuesses.length - 1] = dist[newGuesses.length - 1] + 1;
          }
          const newStreak = won ? prevStats.currentStreak + 1 : 0;
          return {
            ...prevStats,
            gamesPlayed: prevStats.gamesPlayed + 1,
            gamesWon: won ? prevStats.gamesWon + 1 : prevStats.gamesWon,
            currentStreak: newStreak,
            longestStreak: Math.max(prevStats.longestStreak, newStreak),
            guessDistribution: dist,
            lastPlayedDate: prev.dateKey,
            lastPlayedResult: won ? "won" : "lost",
          };
        });
      }

      return {
        ...prev,
        guesses: newGuesses,
        currentInput: "",
        status: newStatus,
      };
    });
  }, [snapshot, setState, setStats, showToast, triggerShake]);

  // Derive letter states from all past guesses
  // Precedence: correct > present > absent > empty
  const letterStates = useMemo((): Record<string, LetterState> => {
    const precedence: Record<LetterState, number> = {
      correct: 4,
      present: 3,
      absent: 2,
      pending: 1,
      empty: 0,
    };
    const map: Record<string, LetterState> = {};
    for (const guess of state.guesses) {
      for (const fb of guess.feedback) {
        const ch = fb.char.toUpperCase();
        const current = map[ch] ?? "empty";
        if (precedence[fb.state] > precedence[current]) {
          map[ch] = fb.state;
        }
      }
    }
    return map;
  }, [state.guesses]);

  const shareCard = useMemo(
    () =>
      buildShareCard({
        dateKey: state.dateKey,
        guesses: state.guesses,
        won: state.status === "won",
        maxGuesses: MAX_GUESSES,
      }),
    [state.dateKey, state.guesses, state.status],
  );

  return {
    state,
    stats,
    toast,
    shaking,
    submitInput,
    addChar,
    backspace,
    letterStates,
    shareCard,
    resetTodayIfStale,
    themeLabel,
    dateKey: state.dateKey,
    length: state.length,
  };
}
