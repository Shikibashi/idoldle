import { useState, useEffect, useCallback } from "react";
import type { GameState, Snapshot } from "./types";
import { useGame } from "./hooks/useGame";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useGameShortcuts } from "./hooks/useGameShortcuts";
import { useGameView } from "./hooks/useGameView";
import { useOnlineAnnouncement } from "./hooks/useOnlineAnnouncement";
import { detectClockSkew } from "./lib/clock";
import { mergeCuratedIdols } from "./lib/mergeCuratedIdols";
import { ENGLISH_STRINGS as strings } from "./lib/strings";
import { GameHeader } from "./components/GameHeader";
import { ClockSkewBanner } from "./components/ClockSkewBanner";
import { GameInfoGrid } from "./components/GameInfoGrid";
import { GameOverlays } from "./components/GameOverlays";
import { GamePlayArea } from "./components/GamePlayArea";
import "./webpage.css";

type ColorMode = "system" | "dark" | "light";
type ResolvedColorMode = Exclude<ColorMode, "system">;
type Density = "automatic" | "compact" | "comfortable";
type ResolvedDensity = Exclude<Density, "automatic">;
type Contrast = "normal" | "increased";
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

interface GameAppProps {
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
}

function getLastGame(state: GameState) {
  if (state.status !== "won" && state.status !== "lost") return null;
  return {
    won: state.status === "won",
    guessCount: state.guesses.length,
    answer: state.answer,
  };
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
}: GameAppProps) {
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

  useOnlineAnnouncement(online, announce);

  const { mainRef, view, statsOpen, infoMode, openView, closeView } =
    useGameView();

  useGameShortcuts({
    view,
    closeView,
    submitInput,
    backspace,
    addChar,
    resetTodayIfStale,
  });

  const lastGame = getLastGame(state);

  return (
    <>
      <GameHeader
        state={state}
        stats={stats}
        dateKey={dateKey}
        themeLabel={themeLabel}
        view={view}
        openView={openView}
        colorMode={colorMode}
        resolvedColorMode={resolvedColorMode}
        density={density}
        resolvedDensity={resolvedDensity}
        contrast={contrast}
        onColorModeChange={onColorModeChange}
        onDensityChange={onDensityChange}
        onContrastChange={onContrastChange}
        onResetDisplayPreferences={onResetDisplayPreferences}
      />

      <GamePlayArea
        state={state}
        shaking={shaking}
        letterStates={letterStates}
        mainRef={mainRef}
        onSubmitInput={submitInput}
        onBackspace={backspace}
        onAddChar={addChar}
        onOpenStats={(origin) => openView("statistics", origin)}
      >
        <GameInfoGrid snapshot={snapshot} stats={stats} openView={openView} />
      </GamePlayArea>

      <GameOverlays
        snapshot={snapshot}
        toast={toast}
        announcement={announcement}
        assertiveAnnouncement={assertiveAnnouncement}
        infoMode={infoMode}
        statsOpen={statsOpen}
        stats={stats}
        lastGame={lastGame}
        shareCard={shareCard}
        closeView={closeView}
        announce={announce}
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
