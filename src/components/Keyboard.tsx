import type { LetterState } from "../types";

interface KeyboardProps {
  letterStates: Record<string, LetterState>;
  onKey: (key: string) => void;
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["⏎", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

// State precedence for display: correct > present > absent > empty/pending
const STATE_PRECEDENCE: Record<LetterState, number> = {
  correct: 4,
  present: 3,
  absent: 2,
  pending: 1,
  empty: 0,
};

function getKeyState(letter: string, letterStates: Record<string, LetterState>): LetterState {
  if (letter === "⏎" || letter === "⌫") return "empty";
  return letterStates[letter] ?? "empty";
}

const KEY_BG: Record<LetterState, string> = {
  empty: "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500",
  pending: "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500",
  correct: "bg-tile-correct text-white",
  present: "bg-tile-present text-gray-900",
  absent: "bg-tile-absent text-white dark:opacity-80",
};

export function Keyboard({ letterStates, onKey }: KeyboardProps) {
  return (
    <section
      className="retro-panel retro-keyboard-panel flex flex-col items-center gap-1.5 w-full overflow-x-hidden"
      aria-labelledby="keyboard-panel-title"
    >
      <div className="retro-panel__header retro-panel__header--keyboard" id="keyboard-panel-title">
        <span>Input deck</span>
        <span>click or type</span>
      </div>
      {ROWS.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="retro-key-row flex justify-center w-[calc(100%-0.5rem)] gap-1 px-0 md:w-full md:gap-[0.1rem] lg:gap-1 lg:px-1"
        >
          {row.map((key) => {
            const state = getKeyState(key, letterStates);
            const isWide = key === "⏎" || key === "⌫";
            const isRevealed = state === "correct" || state === "present" || state === "absent";

            // Determine display key name for aria-label
            const ariaLabel =
              key === "⏎" ? "Enter" : key === "⌫" ? "Backspace" : `Key ${key}`;

            // Map display key to dispatched value
            const dispatchKey = key === "⏎" ? "Enter" : key === "⌫" ? "Backspace" : key;

            return (
              <button
                key={key}
                aria-label={ariaLabel}
                onClick={() => onKey(dispatchKey)}
                className={[
                  "retro-key",
                  `retro-key--${state}`,
                  "relative flex items-center justify-center",
                  "flex-1 basis-0 min-w-0 md:min-w-[3rem] min-h-[3rem]",
                  isWide ? "flex-[1.5] basis-0 md:min-w-[4.5rem] px-3 text-sm" : "",
                  "rounded font-semibold text-sm uppercase",
                  "transition-colors duration-100",
                  "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400",
                  KEY_BG[state],
                  // Reduce opacity slightly for known-absent to help keyboard scan
                  state === "absent" ? "opacity-70" : "",
                  // Mark precedence for state tracking (data attr, not visual)
                  `data-state-prec-${STATE_PRECEDENCE[state]}`,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {key}
                {!isRevealed && (
                  <span className="sr-only"> (untried)</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}
