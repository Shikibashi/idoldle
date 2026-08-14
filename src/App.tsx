import { useState, useEffect, useCallback, useRef } from "react";
import type { Snapshot, Stats } from "./types";
import { useGame } from "./hooks/useGame";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { detectClockSkew } from "./lib/clock";
import { mergeCuratedIdols } from "./lib/mergeCuratedIdols";
import { hashForView, viewFromHash, type AppView } from "./lib/navigation";
import { ENGLISH_STRINGS as strings } from "./lib/strings";
import { Board } from "./components/Board";
import { Keyboard } from "./components/Keyboard";
import { HUD } from "./components/HUD";
import { Toast } from "./components/Toast";
import { StatsModal } from "./components/StatsModal";
import { InfoModal } from "./components/InfoModal";
import { AttributionFooter } from "./components/AttributionFooter";
import { ClockSkewBanner } from "./components/ClockSkewBanner";
import { formatCount, formatDateKey } from "./lib/format";
import "./webpage.css";

type ColorMode = "system" | "dark" | "light";
type ResolvedColorMode = Exclude<ColorMode, "system">;
type Density = "automatic" | "compact" | "comfortable";
type ResolvedDensity = Exclude<Density, "automatic">;
type Contrast = "normal" | "increased";
type ModalView = AppView | null;

const isColorMode = (value: unknown): value is ColorMode =>
  value === "system" || value === "dark" || value === "light";

const isDensity = (value: unknown): value is Density =>
  value === "automatic" || value === "compact" || value === "comfortable";

const isContrast = (value: unknown): value is Contrast =>
  value === "normal" || value === "increased";

function resolveColorMode(colorMode: ColorMode): ResolvedColorMode {
  if (colorMode !== "system") return colorMode;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function resolveDensity(density: Density): ResolvedDensity {
  if (density !== "automatic") return density;

  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasNoHover = window.matchMedia("(hover: none)").matches;
  return hasCoarsePointer || hasNoHover ? "comfortable" : "compact";
}

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
  | { status: "error"; message: string; offline: boolean }
  | { status: "ready"; snapshot: Snapshot };

function useSnapshot(): FetchState & { retry: () => void } {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/idols.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Snapshot>;
      })
      .then((snapshot) => {
        if (!cancelled) {
          setState({ status: "ready", snapshot: mergeCuratedIdols(snapshot) });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
            offline: !navigator.onLine,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  return { ...state, retry: () => setRetryToken((token) => token + 1) };
}

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const setOnlineState = () => setOnline(true);
    const setOfflineState = () => setOnline(false);
    window.addEventListener("online", setOnlineState);
    window.addEventListener("offline", setOfflineState);
    return () => {
      window.removeEventListener("online", setOnlineState);
      window.removeEventListener("offline", setOfflineState);
    };
  }, []);

  return online;
}

function RecentResults({ stats }: { stats: Stats }) {
  const recent = [...stats.history]
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 5);

  return (
    <section className="site-card" aria-labelledby="recent-results-title">
      <h2 id="recent-results-title" className="site-card__title">
        {strings.page.recentResults}
      </h2>
      {recent.length === 0 ? (
        <p className="site-card__muted">{strings.page.noCompletedGames}</p>
      ) : (
        <table className="site-results-table">
          <caption className="sr-only">{strings.page.recentResults}</caption>
          <thead>
            <tr className="site-result-row site-result-row--heading">
              <th scope="col">{strings.page.date}</th>
              <th scope="col">{strings.page.score}</th>
              <th scope="col">{strings.page.status}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((result) => (
              <tr className="site-result-row" key={result.dateKey}>
                <td>
                  <time dateTime={result.dateKey}>
                    {formatDateKey(result.dateKey, { year: undefined })}
                  </time>
                </td>
                <td>
                  <strong>
                    {result.won ? `${result.guessCount}/6` : "X/6"}
                  </strong>
                </td>
                <td
                  className={
                    result.won ? "site-result-win" : "site-result-loss"
                  }
                >
                  {result.won ? strings.page.solved : strings.page.missed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function GameApp({
  snapshot,
  colorMode,
  resolvedColorMode,
  density,
  resolvedDensity,
  contrast,
  onColorModeChange,
  onDensityChange,
  onContrastChange,
  onResetDisplayPreferences,
  online,
}: {
  snapshot: Snapshot;
  colorMode: ColorMode;
  resolvedColorMode: ResolvedColorMode;
  density: Density;
  resolvedDensity: ResolvedDensity;
  contrast: Contrast;
  onColorModeChange: (nextColorMode: ColorMode) => void;
  onDensityChange: (nextDensity: Density) => void;
  onContrastChange: (nextContrast: Contrast) => void;
  onResetDisplayPreferences: () => void;
  online: boolean;
}) {
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
    announcement,
    assertiveAnnouncement,
    announce,
    resetTodayIfStale,
    themeLabel,
    dateKey,
  } = useGame(snapshot);

  const previousOnlineRef = useRef(online);

  useEffect(() => {
    if (!online) announce(strings.game.announcements.offline);
    else if (previousOnlineRef.current !== online)
      announce(strings.game.announcements.online);
    previousOnlineRef.current = online;
  }, [announce, online]);

  const [view, setView] = useState<ModalView>(() =>
    viewFromHash(window.location.hash),
  );
  const statsOpen = view === "statistics";
  const infoMode =
    view === "about" || view === "how-to-play"
      ? view === "about"
        ? "about"
        : "how"
      : null;
  const mainRef = useRef<HTMLElement>(null);
  const modalReturnFocusRef = useRef<HTMLElement | null>(null);
  const previousViewRef = useRef<ModalView>(view);

  const rememberModalOrigin = useCallback(() => {
    const active = document.activeElement;
    modalReturnFocusRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }, []);

  const restoreModalFocus = useCallback(() => {
    const origin = modalReturnFocusRef.current;
    modalReturnFocusRef.current = null;
    if (origin?.isConnected) {
      origin.focus();
    } else {
      mainRef.current?.focus();
    }
  }, []);

  const rememberViewOrigin = useCallback(
    (origin?: HTMLElement) => {
      if (origin) {
        modalReturnFocusRef.current = origin;
        return;
      }
      rememberModalOrigin();
    },
    [rememberModalOrigin],
  );

  const closeView = useCallback(() => {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    setView(null);
  }, []);

  const openView = useCallback(
    (nextView: AppView, origin?: HTMLElement) => {
      rememberViewOrigin(origin);
      if (viewFromHash(window.location.hash) !== nextView) {
        window.history.pushState(null, "", hashForView(nextView));
      }
      setView(nextView);
    },
    [rememberViewOrigin],
  );

  useEffect(() => {
    const syncHashView = () => setView(viewFromHash(window.location.hash));
    window.addEventListener("hashchange", syncHashView);
    syncHashView();
    return () => window.removeEventListener("hashchange", syncHashView);
  }, []);

  useEffect(() => {
    if (previousViewRef.current !== null && view === null) restoreModalFocus();
    previousViewRef.current = view;
  }, [restoreModalFocus, view]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!document.hasFocus() || document.visibilityState !== "visible")
        return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Escape") {
        if (view !== null) closeView();
        return;
      }
      if (view !== null) return;

      if (
        e.target instanceof Element &&
        e.target.closest(
          "button, a, input, textarea, select, [contenteditable='true']",
        )
      ) {
        return;
      }

      if (e.key === "Enter") submitInput();
      else if (e.key === "Backspace") backspace();
      else if (/^[a-zA-Z]$/.test(e.key)) addChar(e.key.toUpperCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addChar, backspace, submitInput, view, closeView]);

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
        colorMode={colorMode}
        resolvedColorMode={resolvedColorMode}
        density={density}
        resolvedDensity={resolvedDensity}
        contrast={contrast}
        dateKey={dateKey}
        themeLabel={themeLabel}
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
        currentAttempt={
          state.status === "playing"
            ? state.guesses.length + 1
            : state.guesses.length
        }
        maxGuesses={state.maxGuesses}
        onOpenStats={(origin) => openView("statistics", origin)}
        onOpenAbout={(origin) => openView("about", origin)}
        onOpenHow={(origin) => openView("how-to-play", origin)}
        onColorModeChange={onColorModeChange}
        onDensityChange={onDensityChange}
        onContrastChange={onContrastChange}
        onResetDisplayPreferences={onResetDisplayPreferences}
        activeView={view}
      />

      <main
        ref={mainRef}
        tabIndex={-1}
        className="retro-main site-game-main flex flex-col items-center flex-1 gap-4"
      >
        <div className="site-game-column flex flex-col max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto gap-4">
          <Board
            guesses={state.guesses}
            currentInput={state.currentInput}
            shaking={shaking}
            maxGuesses={state.maxGuesses}
            length={state.length}
          />

          <Keyboard letterStates={letterStates} onKey={handleKey} />

          <div className="site-legend" aria-label={strings.game.legend}>
            <span>
              <i
                className="site-swatch site-swatch--correct"
                aria-hidden="true"
              />{" "}
              <b aria-hidden="true">✓</b> {strings.game.correct}
            </span>
            <span>
              <i
                className="site-swatch site-swatch--present"
                aria-hidden="true"
              />{" "}
              <b aria-hidden="true">≈</b> {strings.game.present}
            </span>
            <span>
              <i
                className="site-swatch site-swatch--absent"
                aria-hidden="true"
              />{" "}
              <b aria-hidden="true">×</b> {strings.game.absent}
            </span>
          </div>

          {(state.status === "won" || state.status === "lost") && (
            <section
              className="site-completion-status"
              aria-labelledby="completion-status-title"
            >
              <h2 id="completion-status-title">
                {state.status === "won" ? "Puzzle solved" : "Puzzle complete"}
              </h2>
              <p>
                {state.status === "won"
                  ? `Solved in ${state.guesses.length} ${state.guesses.length === 1 ? "guess" : "guesses"}.`
                  : `The answer was ${state.answer.stageName}.`}
              </p>
              <button
                type="button"
                className="site-text-button"
                onClick={(event) => openView("statistics", event.currentTarget)}
              >
                <span aria-hidden="true">[ </span>
                {strings.navigation.statistics}
                <span aria-hidden="true"> ]</span>
              </button>
            </section>
          )}
        </div>

        <div className="site-info-grid">
          <section className="site-card" aria-labelledby="about-card-title">
            <h2 id="about-card-title" className="site-card__title">
              {strings.page.aboutTitle}
            </h2>
            <p>{strings.page.aboutSummary}</p>
            <a
              className="site-text-button"
              href="#about"
              onClick={() => openView("about")}
            >
              <span aria-hidden="true">[ </span>
              {strings.page.moreAbout}
              <span aria-hidden="true"> ]</span>
            </a>
          </section>

          <RecentResults stats={stats} />

          <section className="site-card" aria-labelledby="data-card-title">
            <h2 id="data-card-title" className="site-card__title">
              {strings.page.dataInfo}
            </h2>
            <p>{strings.page.snapshot}</p>
            <strong className="site-data-value">
              <time dateTime={snapshot.snapshotDate}>
                {formatDateKey(snapshot.snapshotDate)}
              </time>
            </strong>
            <p className="site-card__muted">
              {strings.page.idolsInSnapshot(formatCount(snapshot.idols.length))}
            </p>
          </section>
        </div>
      </main>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement ?? ""}
      </p>
      <p className="sr-only" role="alert" aria-atomic="true">
        {assertiveAnnouncement ?? ""}
      </p>

      <AttributionFooter snapshot={snapshot} />
      <Toast message={toast} />

      <InfoModal mode={infoMode} onClose={closeView} />

      <StatsModal
        open={statsOpen}
        onClose={closeView}
        stats={stats}
        lastGame={lastGame}
        shareText={shareCard}
        onShare={() => announce(strings.game.announcements.shareCopied)}
      />
    </>
  );
}

export default function App() {
  const fetchState = useSnapshot();
  const online = useOnlineStatus();
  const { show: showSkew, skewMinutes, dismiss: dismissSkew } = useClockSkew();
  const [colorMode, setColorMode] = useLocalStorage<ColorMode>(
    "idoldle-color-mode",
    "system",
    1,
    { validator: isColorMode },
  );
  const [resolvedColorMode, setResolvedColorMode] = useState<ResolvedColorMode>(
    () => resolveColorMode(colorMode),
  );
  const [density, setDensity] = useLocalStorage<Density>(
    "idoldle-density",
    "automatic",
    1,
    { validator: isDensity },
  );
  const [resolvedDensity, setResolvedDensity] = useState<ResolvedDensity>(() =>
    resolveDensity(density),
  );
  const [contrast, setContrast] = useLocalStorage<Contrast>(
    "idoldle-contrast",
    "normal",
    1,
    { validator: isContrast },
  );

  useEffect(() => {
    const syncColorMode = () =>
      setResolvedColorMode(resolveColorMode(colorMode));
    syncColorMode();

    if (colorMode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    mediaQuery.addEventListener("change", syncColorMode);
    return () => mediaQuery.removeEventListener("change", syncColorMode);
  }, [colorMode]);

  useEffect(() => {
    const syncDensity = () => setResolvedDensity(resolveDensity(density));
    syncDensity();

    if (density !== "automatic") return;

    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const hoverQuery = window.matchMedia("(hover: none)");
    pointerQuery.addEventListener("change", syncDensity);
    hoverQuery.addEventListener("change", syncDensity);
    return () => {
      pointerQuery.removeEventListener("change", syncDensity);
      hoverQuery.removeEventListener("change", syncDensity);
    };
  }, [density]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedColorMode;
    document.documentElement.style.colorScheme = resolvedColorMode;

    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (themeColor) {
      themeColor.content =
        resolvedColorMode === "light" ? "#d6d9e8" : "#050719";
    }

    return () => {
      delete document.documentElement.dataset.theme;
      document.documentElement.style.colorScheme = "";
    };
  }, [resolvedColorMode]);

  useEffect(() => {
    document.documentElement.dataset.density = resolvedDensity;

    return () => {
      delete document.documentElement.dataset.density;
    };
  }, [resolvedDensity]);

  useEffect(() => {
    document.documentElement.dataset.contrast = contrast;

    return () => {
      delete document.documentElement.dataset.contrast;
    };
  }, [contrast]);

  const resetDisplayPreferences = useCallback(() => {
    setColorMode("system");
    setDensity("automatic");
    setContrast("normal");
  }, [setColorMode, setDensity, setContrast]);

  return (
    <div
      className={`retro-page site-page site-theme--${resolvedColorMode} min-h-full`}
      data-appearance-mode={colorMode}
      data-color-mode={resolvedColorMode}
      data-density-mode={density}
      data-density={resolvedDensity}
      data-contrast={contrast}
    >
      <div className="site-short-viewport">{strings.game.shortViewport}</div>

      <div className="retro-window site-shell flex flex-col mx-auto h-full">
        {showSkew && (
          <ClockSkewBanner skewMinutes={skewMinutes} onDismiss={dismissSkew} />
        )}
        {!online && (
          <div className="site-network-status" aria-label="Connection status">
            {strings.state.offline}
          </div>
        )}

        {fetchState.status === "loading" && (
          <div className="retro-loading flex flex-1 items-center justify-center text-sm">
            {strings.state.loading}
          </div>
        )}

        {fetchState.status === "error" && (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="retro-error text-center" role="alert">
              <p className="text-lg font-bold mb-2">
                {strings.state.loadFailure}
              </p>
              <p className="text-sm">
                {fetchState.offline
                  ? strings.state.offlineRetry
                  : strings.state.shortFailure(fetchState.message)}
              </p>
              <button
                onClick={fetchState.retry}
                className="retro-action-button mt-4 px-4 py-2 text-sm"
              >
                {strings.state.retrySnapshot}
              </button>
            </div>
          </div>
        )}

        {fetchState.status === "ready" && (
          <GameApp
            snapshot={fetchState.snapshot}
            colorMode={colorMode}
            resolvedColorMode={resolvedColorMode}
            density={density}
            resolvedDensity={resolvedDensity}
            contrast={contrast}
            onColorModeChange={setColorMode}
            onDensityChange={setDensity}
            onContrastChange={setContrast}
            onResetDisplayPreferences={resetDisplayPreferences}
            online={online}
          />
        )}
      </div>
    </div>
  );
}
