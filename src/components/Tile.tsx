import type { LetterState } from "../types";

interface TileProps {
  letter: string;           // single uppercase letter or ""
  state: LetterState;
  revealIndex?: number;     // for staggered flip animation
}

const STATE_BG: Record<LetterState, string> = {
  empty: "bg-tile-empty border-2 border-gray-500 text-gray-900",
  pending: "bg-tile-pending border-2 border-gray-700 text-gray-900",
  correct: "bg-tile-correct text-white border-2 border-tile-correct",
  present: "bg-tile-present text-white border-2 border-tile-present",
  absent: "bg-tile-absent text-white border-2 border-tile-absent",
};

export function Tile({ letter, state, revealIndex }: TileProps) {
  const isRevealed = state !== "empty" && state !== "pending";

  // Stagger flip animation per tile index; delay applied inline.
  // The CSS media query in index.css disables the animation for reduced-motion.
  const animationStyle: React.CSSProperties =
    isRevealed && revealIndex !== undefined
      ? { animationDelay: `${revealIndex * 120}ms` }
      : {};

  const animationClass = isRevealed ? "animate-flip" : "";

  return (
    <div
      role="gridcell"
      aria-label={`Letter ${letter || "empty"}, ${state}`}
      className={[
        "relative flex items-center justify-center",
        "flex-1 min-w-0 aspect-square max-w-[60px]",
        "text-xl font-bold uppercase select-none",
        STATE_BG[state],
        animationClass,
      ]
        .filter(Boolean)
        .join(" ")}
      style={animationStyle}
    >
      {letter}
    </div>
  );
}
