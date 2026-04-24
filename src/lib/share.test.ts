import { describe, it, expect } from "vitest";
import { buildShareCard } from "./share";
import { scoreGuess } from "./wordle";
import type { Guess } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SIX_LETTER_WORDS = [
  "FLAKES", "SINGLE", "BBBCCC", "ABCDEF",
  "GHIJKL", "MNOPQR", "STUVWX", "KAREEN",
  "AABBCC", "LLAMAS", "FROZEN", "GALAXY",
  "DANCER", "SINGER", "MASTER", "DRAGON",
  "SUNSET", "MIRROR", "CASTLE", "BREEZE",
];

const FIVE_LETTER_WORDS = [
  "CLEAR", "WORLD", "APPLE", "BANAL",
  "FGHIJ", "MAMMA", "THREE", "KARIN",
  "JENNY", "SOLAR",
];

function makeGuess(answer: string, guessWord: string): Guess {
  return { word: guessWord, feedback: scoreGuess(answer, guessWord) };
}

// Length-agnostic share card regex.
const SHARE_REGEX = /^Idoldle \d{4}-\d{2}-\d{2} [X1-6]\/6\n[🟨🟩⬜\n]+$/u;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("buildShareCard (6-letter)", () => {
  it("matches the required format regex for a won game", () => {
    const answer = "JENNIE";
    const guesses: Guess[] = [makeGuess(answer, "FLAKES"), makeGuess(answer, "JENNIE")];
    const card = buildShareCard({ dateKey: "2024-06-15", guesses, won: true, maxGuesses: 6, shareUrl: "" });
    expect(card).toMatch(SHARE_REGEX);
  });

  it("matches the required format regex for a lost game", () => {
    const answer = "JENNIE";
    const guesses: Guess[] = SIX_LETTER_WORDS.slice(0, 6).map((w) => makeGuess(answer, w));
    const card = buildShareCard({ dateKey: "2024-06-15", guesses, won: false, maxGuesses: 6, shareUrl: "" });
    expect(card).toMatch(SHARE_REGEX);
  });

  it("contains no ASCII letters outside the header line", () => {
    const answer = "KARINA";
    const guesses: Guess[] = [makeGuess(answer, "FLAKES"), makeGuess(answer, "KARINA")];
    const card = buildShareCard({ dateKey: "2024-06-20", guesses, won: true, maxGuesses: 6, shareUrl: "" });
    const gridOnly = card.slice(card.indexOf("\n") + 1);
    expect(gridOnly.match(/[A-Za-z]/)).toBeNull();
  });

  it("formats won count as n/6", () => {
    const answer = "WINTER";
    const guesses: Guess[] = [makeGuess(answer, "WINTER")];
    const card = buildShareCard({ dateKey: "2024-06-18", guesses, won: true, maxGuesses: 6, shareUrl: "" });
    expect(card).toContain("1/6");
  });

  it("formats lost count as X/6", () => {
    const answer = "WINTER";
    const guesses: Guess[] = SIX_LETTER_WORDS.slice(0, 6).map((w) => makeGuess(answer, w));
    const card = buildShareCard({ dateKey: "2024-06-18", guesses, won: false, maxGuesses: 6, shareUrl: "" });
    expect(card).toContain("X/6");
  });

  it("grid rows equal number of guesses", () => {
    const answer = "DRAGON";
    const guesses: Guess[] = [
      makeGuess(answer, "FLAKES"),
      makeGuess(answer, "SINGLE"),
      makeGuess(answer, "DRAGON"),
    ];
    const card = buildShareCard({ dateKey: "2024-06-19", guesses, won: true, maxGuesses: 6, shareUrl: "" });
    const lines = card.split("\n");
    expect(lines.length).toBe(1 + guesses.length);
  });

  it("all-correct row is all 🟩 (6 wide)", () => {
    const answer = "KARINA";
    const guesses: Guess[] = [makeGuess(answer, "KARINA")];
    const card = buildShareCard({ dateKey: "2024-06-17", guesses, won: true, maxGuesses: 6, shareUrl: "" });
    expect(card).toContain("🟩🟩🟩🟩🟩🟩");
  });

  it("all-absent row is all ⬜ (6 wide)", () => {
    const answer = "ABCDEF";
    const guesses: Guess[] = [makeGuess(answer, "GHIJKL")];
    const card = buildShareCard({ dateKey: "2024-06-17", guesses, won: false, maxGuesses: 6, shareUrl: "" });
    expect(card).toContain("⬜⬜⬜⬜⬜⬜");
  });
});

describe("buildShareCard (5-letter)", () => {
  it("matches the format regex for a 5-letter won game", () => {
    const answer = "JENNY";
    const guesses: Guess[] = [makeGuess(answer, "SOLAR"), makeGuess(answer, "JENNY")];
    const card = buildShareCard({ dateKey: "2026-04-23", guesses, won: true, maxGuesses: 6, shareUrl: "" });
    expect(card).toMatch(SHARE_REGEX);
  });

  it("matches the format regex for a 5-letter lost game", () => {
    const answer = "JENNY";
    const guesses: Guess[] = FIVE_LETTER_WORDS.slice(0, 6).map((w) => makeGuess(answer, w));
    const card = buildShareCard({ dateKey: "2026-04-23", guesses, won: false, maxGuesses: 6, shareUrl: "" });
    expect(card).toMatch(SHARE_REGEX);
  });

  it("all-correct row is all 🟩 (5 wide)", () => {
    const answer = "KARIN";
    const guesses: Guess[] = [makeGuess(answer, "KARIN")];
    const card = buildShareCard({ dateKey: "2026-04-23", guesses, won: true, maxGuesses: 6, shareUrl: "" });
    expect(card).toContain("🟩🟩🟩🟩🟩");
    // And should NOT accidentally be 6 wide
    expect(card).not.toContain("🟩🟩🟩🟩🟩🟩");
  });

  it("all-absent row is all ⬜ (5 wide)", () => {
    const answer = "ABCDE";
    const guesses: Guess[] = [makeGuess(answer, "FGHIJ")];
    const card = buildShareCard({ dateKey: "2026-04-23", guesses, won: false, maxGuesses: 6, shareUrl: "" });
    expect(card).toContain("⬜⬜⬜⬜⬜");
    expect(card).not.toContain("⬜⬜⬜⬜⬜⬜");
  });

  it("grid row width equals 5 for 5-letter games", () => {
    const answer = "SOLAR";
    const guesses: Guess[] = [makeGuess(answer, "CLEAR")];
    const card = buildShareCard({ dateKey: "2026-04-23", guesses, won: false, maxGuesses: 6, shareUrl: "" });
    const gridLines = card.split("\n").slice(1);
    for (const line of gridLines) {
      // Each emoji is a single user-perceived character — split by code-point
      // units won't work, but counting with the spread operator does.
      expect([...line].length).toBe(5);
    }
  });
});

describe("buildShareCard (random pairs, length-agnostic)", () => {
  const pairs: Array<[string, string]> = [
    // 6-letter
    ["JENNIE", "EERIES"], ["JENNIE", "FLAKES"], ["KARINA", "ARRIAN"],
    ["KARINA", "KARINA"], ["WINTER", "WANTER"], ["WINTER", "WINTER"],
    ["ABCDEF", "AAAAAA"], ["ABCDEF", "GHIJKL"], ["AABBCC", "ABCABC"],
    ["KAREEN", "EXXXEX"], ["KAREEN", "XXXXEX"], ["BBBCCC", "BXBXXX"],
    ["FLAKES", "KAFLES"], ["SINGLE", "SSSSSS"], ["DRAGON", "DANCER"],
    ["SUNSET", "MIRROR"], ["CASTLE", "BREEZE"], ["GALAXY", "FROZEN"],
    ["MASTER", "SINGER"], ["MNOPQR", "STUVWX"],
    // 5-letter
    ["JENNY", "EERIE"], ["SOLAR", "CLEAR"], ["MINJI", "JIMIN"],
    ["KARIN", "KARIN"], ["APPLE", "AAPLE"], ["HELLO", "WORLD"],
  ];

  for (let idx = 0; idx < pairs.length; idx++) {
    const [answer, guessWord] = pairs[idx];
    it(`no-leak + format check #${idx + 1}: answer=${answer} guess=${guessWord}`, () => {
      const guesses: Guess[] = [makeGuess(answer, guessWord)];
      const card = buildShareCard({
        dateKey: "2024-07-01",
        guesses,
        won: guessWord === answer,
        maxGuesses: 6,
        shareUrl: "",
      });
      expect(card).toMatch(SHARE_REGEX);
      const gridOnly = card.slice(card.indexOf("\n") + 1);
      expect(gridOnly.match(/[A-Za-z]/)).toBeNull();
    });
  }
});

describe("buildShareCard URL footer", () => {
  const baseArgs = (shareUrl?: string) => ({
    dateKey: "2026-04-24",
    guesses: [makeGuess("KARINA", "KARINA")],
    won: true,
    maxGuesses: 6,
    ...(shareUrl !== undefined ? { shareUrl } : {}),
  });

  it("appends the default URL when none is provided", () => {
    const card = buildShareCard(baseArgs());
    expect(card).toMatch(/\nhttps:\/\/idoldle\.edriffles\.us$/);
  });

  it("appends a custom URL when provided", () => {
    const card = buildShareCard(baseArgs("https://example.com/play"));
    expect(card).toMatch(/\nhttps:\/\/example\.com\/play$/);
  });

  it("omits the URL footer when shareUrl is empty string", () => {
    const card = buildShareCard(baseArgs(""));
    expect(card).not.toMatch(/https?:/);
    expect(card.split("\n").length).toBe(2); // header + 1 guess row
  });

  it("default URL card has exactly 3 lines (header + grid + url)", () => {
    const card = buildShareCard(baseArgs());
    const lines = card.split("\n");
    expect(lines.length).toBe(3);
    expect(lines[0]).toMatch(/^Idoldle \d{4}-\d{2}-\d{2} \d\/6$/);
    expect(lines[1]).toBe("🟩🟩🟩🟩🟩🟩");
    expect(lines[2]).toBe("https://idoldle.edriffles.us");
  });
});
