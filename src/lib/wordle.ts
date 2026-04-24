import type { LetterFeedback } from "../types";

const MIN_LENGTH = 4;
const MAX_LENGTH = 10;

/**
 * Scores a guess against an answer using the standard Wordle two-pass
 * duplicate-letter algorithm.
 *
 * Both `answer` and `guess` must be uppercase A-Z and have identical
 * length in the inclusive range [4, 10]. Length is validated per call
 * so that the same routine handles every supported length.
 *
 * **Pass 1 — greens:**
 *   Walk indices i = 0..n-1. If guess[i] === answer[i], mark feedback[i]
 *   as "correct" and decrement answerCounts[answer[i]].
 *
 * **Pass 2 — yellows / grays:**
 *   Walk indices i = 0..n-1 again. If feedback[i] is already set, skip.
 *   Otherwise, if answerCounts[guess[i]] > 0, mark "present" and
 *   decrement that count. Else mark "absent".
 *
 * @param answer - uppercase A-Z hidden word
 * @param guess  - uppercase A-Z guess, same length as answer
 * @returns      Array of LetterFeedback objects, one per letter
 */
export function scoreGuess(answer: string, guess: string): LetterFeedback[] {
  if (
    answer.length !== guess.length ||
    answer.length < MIN_LENGTH ||
    answer.length > MAX_LENGTH
  ) {
    throw new Error(
      `Both answer and guess must be identical length in [${MIN_LENGTH}, ${MAX_LENGTH}]`,
    );
  }
  const lettersRe = new RegExp(`^[A-Z]{${answer.length}}$`);
  if (!lettersRe.test(answer) || !lettersRe.test(guess)) {
    throw new Error("Both answer and guess must be uppercase A-Z only");
  }

  const n = answer.length;

  // Build a frequency map of unmatched answer letters.
  const answerCounts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const ch = answer[i];
    answerCounts[ch] = (answerCounts[ch] ?? 0) + 1;
  }

  // Initialise feedback array with placeholder state.
  const feedback: LetterFeedback[] = Array.from({ length: n }, (_, i) => ({
    char: guess[i],
    state: "absent" as const,
  }));

  // Pass 1: identify correct (green) positions and reduce available counts.
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) {
      feedback[i] = { char: guess[i], state: "correct" };
      answerCounts[answer[i]]--;
    }
  }

  // Pass 2: identify present (yellow) positions from remaining counts.
  for (let i = 0; i < n; i++) {
    if (feedback[i].state === "correct") continue;
    const ch = guess[i];
    if ((answerCounts[ch] ?? 0) > 0) {
      feedback[i] = { char: ch, state: "present" };
      answerCounts[ch]--;
    }
    // else: state remains "absent" from initialisation
  }

  return feedback;
}
