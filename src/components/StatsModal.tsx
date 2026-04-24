import { useEffect, useRef } from "react";
import type { Idol, Stats } from "../types";
import { ShareButton } from "./ShareButton";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  stats: Stats;
  lastGame?: { won: boolean; guessCount: number; answer: Idol } | null;
  onShare?: () => void;
  shareText?: string;
}

export function StatsModal({
  open,
  onClose,
  stats,
  lastGame,
  onShare,
  shareText,
}: StatsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus trap: move focus into dialog when opened
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const winPct =
    stats.gamesPlayed === 0
      ? 0
      : Math.round((stats.gamesWon / stats.gamesPlayed) * 100);

  const maxDist = Math.max(...stats.guessDistribution, 1);

  return (
    // Overlay
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
      onClick={onClose}
      aria-hidden="true"
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-xl w-[min(90vw,400px)] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5 focus:outline-none"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close statistics"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <h2
          id="stats-modal-title"
          className="text-center text-lg font-bold uppercase tracking-widest"
        >
          Statistics
        </h2>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Played", value: stats.gamesPlayed },
            { label: "Win %", value: winPct },
            { label: "Streak", value: stats.currentStreak },
            { label: "Best", value: stats.longestStreak },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-xs text-gray-500 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Guess distribution */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-center mb-2">
            Guess Distribution
          </h3>
          <div className="flex flex-col gap-1">
            {stats.guessDistribution.map((count, idx) => {
              const widthPct = Math.max(
                8,
                Math.round((count / maxDist) * 100),
              );
              const isHighlight =
                lastGame?.won && lastGame.guessCount === idx + 1;
              return (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-right font-semibold text-gray-700">
                    {idx + 1}
                  </span>
                  <div className="flex-1 flex">
                    <div
                      className={[
                        "flex items-center justify-end pr-2 rounded text-white text-xs font-bold transition-all duration-300",
                        isHighlight ? "bg-tile-correct" : "bg-gray-500",
                      ].join(" ")}
                      style={{ width: `${widthPct}%`, minWidth: "2rem" }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last game answer reveal */}
        {lastGame && (
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p className="font-semibold text-gray-800 text-base">
              {lastGame.won ? "You got it!" : "The answer was:"}
            </p>
            <p className="text-xl font-bold mt-1">{lastGame.answer.stageName}</p>
            <p className="text-gray-500">
              {lastGame.answer.group} &middot; {lastGame.answer.era}
            </p>
          </div>
        )}

        {/* Share button */}
        {lastGame && shareText && (
          <div className="flex justify-center">
            <ShareButton text={shareText} onCopied={onShare} />
          </div>
        )}
      </div>
    </div>
  );
}
