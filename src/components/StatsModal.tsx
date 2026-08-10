import { useMemo, useRef } from "react";
import type { DailyResult, Idol, Stats } from "../types";
import { computeBadges } from "../lib/badges";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { ShareButton } from "./ShareButton";

/** Format solve time ms as "Xs" or "Ym Zs" (zero-padded seconds). */
function formatSolveTime(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/** Tailwind color class for a heatmap cell based on the day's result. */
function heatmapCellClass(entry: DailyResult | undefined): string {
  if (!entry) return "bg-gray-200";
  if (!entry.won) return "bg-red-400";
  const g = entry.guessCount;
  if (g === 1) return "bg-green-800";
  if (g <= 3) return "bg-green-600";
  if (g <= 5) return "bg-green-400";
  return "bg-green-300"; // 6 guesses
}

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

  useDialogFocus(open, dialogRef);

  // IMPORTANT: All hooks must run on every render — no conditional early
  // returns above this block. Compute memoised values first, then bail out
  // for the closed-modal case.
  const badges = useMemo(() => computeBadges(stats), [stats]);

  // Sort history by dateKey ascending so oldest is left, newest is right.
  const sortedHistory = useMemo(
    () => [...stats.history].sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
    [stats.history],
  );

  if (!open) return null;

  const winPct =
    stats.gamesPlayed === 0
      ? 0
      : Math.round((stats.gamesWon / stats.gamesPlayed) * 100);

  const maxDist = Math.max(...stats.guessDistribution, 1);

  return (
    // Overlay
    <div
      className="retro-modal-backdrop fixed inset-0 z-40 flex items-center justify-center overflow-y-auto p-4"
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="retro-modal relative min-w-0 w-[min(90vw,400px)] max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 flex flex-col gap-5 focus:outline-none"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close statistics"
          className="retro-modal__close absolute top-2 right-2 w-12 h-12 flex items-center justify-center focus:outline-none"
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
          className="retro-modal__title text-center text-lg font-bold uppercase tracking-widest"
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
            <div key={label} className="retro-stat flex flex-col">
              <span className="retro-stat__value text-2xl font-bold">{value}</span>
              <span className="retro-stat__label text-xs leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Guess distribution */}
        <div>
          <h3 className="retro-section-label text-xs font-bold uppercase tracking-widest text-center mb-2">
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
                  <span className="w-3 text-right font-semibold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 flex">
                    <div
                      className={[
                        "retro-distribution-bar flex items-center justify-end pr-2 text-xs font-bold transition-all duration-300",
                        isHighlight ? "retro-distribution-bar--highlight" : "",
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

        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <h3 className="retro-section-label text-xs font-bold uppercase tracking-widest text-center mb-2">
              Badges
            </h3>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {badges.map((b) => (
                <span
                  key={b.id}
                  title={b.description}
                  className="retro-badge px-2 py-1 text-xs font-semibold"
                >
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last 30 days heatmap */}
        <div>
          <h3 className="retro-section-label text-xs font-bold uppercase tracking-widest text-center mb-2">
            Last 30 Days
          </h3>
          <div className="flex flex-wrap gap-1 justify-center">
            {sortedHistory.map((h) => (
              <div
                key={h.dateKey}
                title={`${h.dateKey}: ${h.won ? `solved in ${h.guessCount}` : "lost"} · answer was ${h.answerStageName}`}
                className={`retro-heatmap-cell w-[14px] h-[14px] ${heatmapCellClass(h)}`}
              />
            ))}
          </div>
          <p className="retro-modal__muted text-xs text-center mt-2">
            Fastest solve: {formatSolveTime(stats.fastestSolveMs)}
          </p>
        </div>

        {/* Last game answer reveal */}
        {lastGame && (
          <div className="retro-answer text-center text-sm border-t pt-4">
            <p className="font-semibold text-base">
              {lastGame.won ? "You got it!" : "The answer was:"}
            </p>
            <p className="text-xl font-bold mt-1"><bdi dir="auto">{lastGame.answer.stageName}</bdi></p>
            <p className="retro-modal__muted">
              <bdi dir="auto">{lastGame.answer.group}</bdi> &middot; {lastGame.answer.era}
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
