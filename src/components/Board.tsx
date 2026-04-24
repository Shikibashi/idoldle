import type { Guess, LetterState, WordLength } from "../types";
import { Tile } from "./Tile";

interface BoardProps {
  guesses: Guess[];
  currentInput: string;
  shaking: boolean;
  maxGuesses: number;
  length: WordLength;
}

export function Board({
  guesses,
  currentInput,
  shaking,
  maxGuesses,
  length,
}: BoardProps) {
  const rows: React.ReactElement[] = [];

  for (let rowIdx = 0; rowIdx < maxGuesses; rowIdx++) {
    const isSubmitted = rowIdx < guesses.length;
    const isCurrent = rowIdx === guesses.length;

    let tiles: React.ReactElement[];

    if (isSubmitted) {
      // Submitted row — show feedback
      const guess = guesses[rowIdx];
      tiles = Array.from({ length }, (_, col) => {
        const fb = guess.feedback[col];
        return (
          <Tile
            key={col}
            letter={fb.char}
            state={fb.state}
            revealIndex={col}
          />
        );
      });
    } else if (isCurrent) {
      // Active input row
      tiles = Array.from({ length }, (_, col) => {
        const letter = currentInput[col] ?? "";
        const state: LetterState = letter ? "pending" : "empty";
        return (
          <Tile
            key={col}
            letter={letter}
            state={state}
          />
        );
      });
    } else {
      // Empty future row
      tiles = Array.from({ length }, (_, col) => (
        <Tile key={col} letter="" state="empty" />
      ));
    }

    rows.push(
      <div
        key={rowIdx}
        role="row"
        className={[
          "flex gap-1.5 w-full justify-center",
          isCurrent && shaking ? "animate-shake" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {tiles}
      </div>,
    );
  }

  return (
    <div
      role="grid"
      aria-label="Idoldle game board"
      className="flex flex-col gap-1.5 w-full max-w-md px-2"
    >
      {rows}
    </div>
  );
}
