import { useState, useEffect, useCallback } from "react";
import type { Snapshot, Stats } from "./types";
import { useGame } from "./hooks/useGame";
import { detectClockSkew } from "./lib/clock";
import { Board } from "./components/Board";
import { Keyboard } from "./components/Keyboard";
import { HUD } from "./components/HUD";
import { Toast } from "./components/Toast";
import { StatsModal } from "./components/StatsModal";
import { InfoModal } from "./components/InfoModal";
import { AttributionFooter } from "./components/AttributionFooter";
import { ClockSkewBanner } from "./components/ClockSkewBanner";
import "./webpage.css";

function useClockSkew() {
  const [skewMinutes, setSkewMinutes] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    detectClockSkew().then(({ skewMs, ok }) => {
      if (!ok) setSkewMinutes(Math.round(skewMs / 60_000));
    });
  }, []);

  return {
    show: !dismissed && skewMinutes !== null && Math.abs(skewMinutes) > 5,
    skewMinutes: skewMinutes ?? 0,
    dismiss: useCallback(() => setDismissed(true), []),
  };
}

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
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function RecentResults({ stats }: { stats: Stats }) {
  const recent = [...stats.history]
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 5);

  return (
    <section className="site-card" aria-labelledby="recent-results-title">
      <h2 id="recent-results-title" className="site-card__title">Recent results</h2>
      {recent.length === 0 ? (
        <p className="site-card__muted">No completed games yet. Today can be the first.</p>
      ) : (
        <div className="site-results-table" role="list">
          {recent.map((result) => (
            <div className="site-result-row" role="listitem" key={result.dateKey}>
              <span>{result.dateKey.slice(5)}</span>
              <strong>{result.won ? `${result.guessCount}/6` : "X/6"}</strong>
              <span className={result.won ? "site-result-win" : "site-result-loss"}>
                {result.won ? "SOLVED" : "MISSED"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

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
  const [infoMode, setInfoMode] = useState<"about" | "how" | null>(null);

  useEffect(() => {
    if (state.status === "won" || state.status === "lost") {
      const id = setTimeout(() => setStatsOpen(true), 1800);
      return () => clearTimeout(id);
    }
  }, [state.status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!document.hasFocus() || document.visibilityState !== "visible") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Escape") {
        setStatsOpen(false);
        setInfoMode(null);
        return;
      }
      if (statsOpen || infoMode) return;

      if (e.key === "Enter") submitInput();
      else if (e.key === "Backspace") backspace();
      else if (/^[a-zA-Z]$/.test(e.key)) addChar(e.key.toUpperCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addChar, backspace, submitInput, statsOpen, infoMode]);

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
        longestStreak={stats.longestStreak}
        currentAttempt={state.status === "playing" ? state.guesses.length + 1 : state.guesses.length}
        maxGuesses={state.maxGuesses}
        onOpenStats={() => setStatsOpen(true)}
        onOpenAbout={() => setInfoMode("about")}
        onOpenHow={() => setInfoMode("how")}
      />

      <main className="retro-main site-game-main flex flex-col items-center flex-1 gap-4">
        <div className="site-game-column flex flex-col max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto gap-4">
          <Board
            guesses={state.guesses}
            currentInput={state.currentInput}
            shaking={shaking}
            maxGuesses={state.maxGuesses}
            length={state.length}
          />

          <Keyboard letterStates={letterStates} onKey={handleKey} />

          <div className="site-legend" aria-label="Tile color legend">
            <span><i className="site-swatch site-swatch--correct" /> correct</span>
            <span><i className="site-swatch site-swatch--present" /> present</span>
            <span><i className="site-swatch site-swatch--absent" /> absent</span>
          </div>
        </div>

        <div className="site-info-grid">
          <section className="site-card" aria-labelledby="about-card-title">
            <h2 id="about-card-title" className="site-card__title">What is Idoldle?</h2>
            <p>A daily word game about idol stage names. One puzzle per day, six attempts.</p>
            <button className="site-text-button" type="button" onClick={() => setInfoMode("about")}>
              [ more about the game ]
            </button>
          </section>

          <RecentResults stats={stats} />

          <section className="site-card" aria-labelledby="data-card-title">
            <h2 id="data-card-title" className="site-card__title">Data info</h2>
            <p>Idol database snapshot:</p>
            <strong className="site-data-value">{snapshot.snapshotDate}</strong>
            <p className="site-card__muted">{snapshot.idols.length} idols in the local snapshot.</p>
          </section>
        </div>
      </main>

      <AttributionFooter snapshot={snapshot} />
      <Toast message={toast} />

      <InfoModal mode={infoMode} onClose={() => setInfoMode(null)} />

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        lastGame={lastGame}
        shareText={shareCard}
        onShare={() => {}}
      />
    </>
  );
}

export default function App() {
  const fetchState = useSnapshot();
  const { show: showSkew, skewMinutes, dismiss: dismissSkew } = useClockSkew();

  return (
    <div className="retro-page site-page min-h-full">
      <div role="alert" aria-live="polite" className="rotate-hint fixed inset-0 z-50 items-center justify-center bg-black/80 text-white text-center p-8">
        <div className="flex flex-col items-center gap-4">
          <svg aria-hidden="true" className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4v5h5M20 20v-5h-5" />
            <path d="M20 9A9 9 0 0 0 5.64 5.64L4 4m16 16-1.64-1.64A9 9 0 0 1 4 15" />
          </svg>
          <p className="text-lg font-semibold">Rotate to portrait for the best experience</p>
        </div>
      </div>

      <div className="retro-window site-shell flex flex-col mx-auto h-full">
        {showSkew && <ClockSkewBanner skewMinutes={skewMinutes} onDismiss={dismissSkew} />}

        {fetchState.status === "loading" && (
          <div className="retro-loading flex flex-1 items-center justify-center text-sm">
            Loading today&apos;s puzzle&hellip;
          </div>
        )}

        {fetchState.status === "error" && (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="retro-error text-center">
              <p className="text-lg font-bold mb-2">Could not load puzzle data</p>
              <p className="text-sm">{fetchState.message}</p>
              <button onClick={() => window.location.reload()} className="retro-action-button mt-4 px-4 py-2 text-sm">
                Try again
              </button>
            </div>
          </div>
        )}

        {fetchState.status === "ready" && <GameApp snapshot={fetchState.snapshot} />}
      </div>
    </div>
  );
}
