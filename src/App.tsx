import { useState, useEffect, useCallback } from "react";
import type { Snapshot } from "./types";
import { useGame } from "./hooks/useGame";
import { detectClockSkew } from "./lib/clock";
import { Board } from "./components/Board";
import { Keyboard } from "./components/Keyboard";
import { HUD } from "./components/HUD";
import { Toast } from "./components/Toast";
import { StatsModal } from "./components/StatsModal";
import { AttributionFooter } from "./components/AttributionFooter";
import { ClockSkewBanner } from "./components/ClockSkewBanner";

// ─── Clock skew banner state ────────────────────────────────────────────────
function useClockSkew() {
  const [skewMinutes, setSkewMinutes] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    detectClockSkew().then(({ skewMs, ok }) => {
      if (!ok) {
        setSkewMinutes(Math.round(skewMs / 60_000));
      }
    });
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  const show =
    !dismissed && skewMinutes !== null && Math.abs(skewMinutes) > 5;

  return { show, skewMinutes: skewMinutes ?? 0, dismiss };
}

// ─── Snapshot fetch ──────────────────────────────────────────────────────────
type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; snapshot: Snapshot };

function useSnapshot(): FetchState {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/data/idols.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Snapshot>;
      })
      .then((snapshot) => {
        if (!cancelled) setState({ status: "ready", snapshot });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Unknown error";
          setState({ status: "error", message: msg });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// ─── Game wiring once snapshot is ready ─────────────────────────────────────
function GameApp({ snapshot }: { snapshot: Snapshot }) {
  const {
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
    dateKey,
  } = useGame(snapshot);

  const [statsOpen, setStatsOpen] = useState(false);

  // Open stats automatically on game end
  useEffect(() => {
    if (state.status === "won" || state.status === "lost") {
      const id = setTimeout(() => setStatsOpen(true), 1800);
      return () => clearTimeout(id);
    }
  }, [state.status]);

  // Physical keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond when the user is actively looking at this tab. Without
      // these guards, a background preview tab can still receive keystrokes
      // (e.g. from OS-level routing to Chrome) and silently fill the grid.
      if (!document.hasFocus()) return;
      if (document.visibilityState !== "visible") return;

      // Don't intercept if a form element is focused.
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Ignore OS/browser modifier shortcuts (Cmd-R, Ctrl-F, Alt-Tab, etc.)
      // so we never consume a chord the user intended for the browser.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Escape") {
        setStatsOpen(false);
        return;
      }
      if (statsOpen) return; // modal is open — don't type letters

      if (e.key === "Enter") {
        submitInput();
      } else if (e.key === "Backspace") {
        backspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addChar(e.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addChar, backspace, submitInput, statsOpen]);

  // UTC midnight detection: focus, visibilitychange, 60s interval
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") resetTodayIfStale();
    };
    const onFocus = () => resetTodayIfStale();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const intervalId = setInterval(resetTodayIfStale, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(intervalId);
    };
  }, [resetTodayIfStale]);

  const handleKey = useCallback(
    (key: string) => {
      if (key === "Enter") submitInput();
      else if (key === "Backspace") backspace();
      else addChar(key);
    },
    [addChar, backspace, submitInput],
  );

  const lastGame =
    state.status === "won" || state.status === "lost"
      ? {
          won: state.status === "won",
          guessCount: state.guesses.length,
          answer: state.answer,
        }
      : null;

  return (
    <>
      <HUD
        dateKey={dateKey}
        themeLabel={themeLabel}
        currentStreak={stats.currentStreak}
        onOpenStats={() => setStatsOpen(true)}
      />

      {/* Main game area */}
      <main className="retro-main flex flex-col items-center justify-center flex-1 overflow-hidden py-3 gap-6">
        <Board
          guesses={state.guesses}
          currentInput={state.currentInput}
          shaking={shaking}
          maxGuesses={state.maxGuesses}
          length={state.length}
        />

        <Keyboard
          letterStates={letterStates}
          onKey={handleKey}
        />
      </main>

      <AttributionFooter snapshot={snapshot} />

      <Toast message={toast} />

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        lastGame={lastGame}
        shareText={shareCard}
        onShare={() => {
          // Toast confirmation handled inside ShareButton
        }}
      />
    </>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const fetchState = useSnapshot();
  const { show: showSkew, skewMinutes, dismiss: dismissSkew } = useClockSkew();

  return (
    <div className="retro-page min-h-full">
      {/* Landscape rotate hint */}
      <div role="alert" aria-live="polite" className="rotate-hint fixed inset-0 z-50 items-center justify-center bg-black/80 text-white text-center p-8">
        <div className="flex flex-col items-center gap-4">
          <svg aria-hidden="true" className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4v5h5M20 20v-5h-5" />
            <path d="M20 9A9 9 0 0 0 5.64 5.64L4 4m16 16-1.64-1.64A9 9 0 0 1 4 15" />
          </svg>
          <p className="text-lg font-semibold">Rotate to portrait for the best experience</p>
        </div>
      </div>

      <div className="retro-window flex flex-col max-w-md md:max-w-lg lg:max-w-xl mx-auto h-full">
        <div className="retro-windowbar" aria-hidden="true">
          <span className="retro-windowbar__brand">IDOLDLE.EXE</span>
          <span className="retro-windowbar__status">// daily idol database</span>
          <span className="retro-windowbar__controls">_ □ ×</span>
        </div>
        {showSkew && (
          <ClockSkewBanner skewMinutes={skewMinutes} onDismiss={dismissSkew} />
        )}

        {fetchState.status === "loading" && (
          <div className="retro-loading flex flex-1 items-center justify-center text-sm">
            Loading today&apos;s puzzle&hellip;
          </div>
        )}

        {fetchState.status === "error" && (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="retro-error text-center">
              <p className="text-lg font-bold mb-2">
                Could not load puzzle data
              </p>
              <p className="text-sm">{fetchState.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="retro-action-button mt-4 px-4 py-2 text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {fetchState.status === "ready" && (
          <GameApp snapshot={fetchState.snapshot} />
        )}
      </div>
    </div>
  );
}
