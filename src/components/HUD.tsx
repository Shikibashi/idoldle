import { useEffect, useRef, useState } from "react";

interface HUDProps {
  colorMode: "system" | "dark" | "light";
  resolvedColorMode: "dark" | "light";
  density: "automatic" | "compact" | "comfortable";
  resolvedDensity: "compact" | "comfortable";
  dateKey: string;
  themeLabel: string;
  currentStreak: number;
  longestStreak: number;
  currentAttempt: number;
  maxGuesses: number;
  onOpenStats: () => void;
  onOpenAbout: () => void;
  onOpenHow: () => void;
  onColorModeChange: (nextColorMode: "system" | "dark" | "light") => void;
  onDensityChange: (nextDensity: "automatic" | "compact" | "comfortable") => void;
}

interface StatusCellProps {
  className?: string;
  label: string;
  value: React.ReactNode;
  title?: string;
}

function StatusCell({ className = "", label, value, title }: StatusCellProps) {
  return (
    <span className={`site-status__cell ${className}`.trim()}>
      <strong className="site-status__label">{label}</strong>
      <span className="site-status__value" title={title}>{value}</span>
    </span>
  );
}

export function HUD({
  colorMode,
  resolvedColorMode,
  density,
  resolvedDensity,
  dateKey,
  themeLabel,
  currentStreak,
  longestStreak,
  currentAttempt,
  maxGuesses,
  onOpenStats,
  onOpenAbout,
  onOpenHow,
  onColorModeChange,
  onDensityChange,
}: HUDProps) {
  const [displayOpen, setDisplayOpen] = useState(false);
  const displayControlRef = useRef<HTMLDivElement>(null);
  const displayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!displayOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!displayControlRef.current?.contains(event.target as Node)) {
        setDisplayOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDisplayOpen(false);
        displayButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [displayOpen]);

  const chooseColorMode = (nextColorMode: HUDProps["colorMode"]) => {
    onColorModeChange(nextColorMode);
    setDisplayOpen(false);
  };

  const chooseDensity = (nextDensity: HUDProps["density"]) => {
    onDensityChange(nextDensity);
    setDisplayOpen(false);
  };

  return (
    <header className="site-masthead w-full">
      <div className="site-masthead__top">
        <div>
          <h1 className="site-logo">IDOLDLE</h1>
          <p className="site-tagline">daily idol database</p>
        </div>
        <div className="site-identity">
          <a className="retro-link" href="https://edriffles.us" target="_blank" rel="noreferrer">
            edriffles.us
          </a>
          <span>a daily idol-name puzzle</span>
        </div>
      </div>

      <nav className="site-nav" aria-label="Idoldle navigation">
        <button type="button" onClick={onOpenAbout}>[ ABOUT ]</button>
        <button type="button" onClick={onOpenHow}>[ HOW TO PLAY ]</button>
        <button type="button" aria-label="Open statistics" onClick={onOpenStats}>[ STATISTICS ]</button>
        <a href="https://github.com/Shikibashi/idoldle" target="_blank" rel="noreferrer">[ GITHUB ]</a>
        <div className="site-display-control" ref={displayControlRef}>
          <button
            ref={displayButtonRef}
            type="button"
            aria-controls="display-options"
            aria-expanded={displayOpen}
            aria-haspopup="dialog"
            onClick={() => setDisplayOpen((open) => !open)}
          >
            [ DISPLAY ]
          </button>
          {displayOpen && (
            <div
              className="site-display-popup"
              id="display-options"
              role="dialog"
              aria-label="Display options"
            >
              <div className="site-display-popup__title">DISPLAY</div>
              <fieldset className="site-display-options">
                <legend>APPEARANCE</legend>
                <label>
                  <input
                    type="radio"
                    name="idoldle-display-mode"
                    value="system"
                    checked={colorMode === "system"}
                    onChange={() => chooseColorMode("system")}
                  />
                  <span>SYSTEM</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="idoldle-display-mode"
                    value="light"
                    checked={colorMode === "light"}
                    onChange={() => chooseColorMode("light")}
                  />
                  <span>LIGHT</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="idoldle-display-mode"
                    value="dark"
                    checked={colorMode === "dark"}
                    onChange={() => chooseColorMode("dark")}
                  />
                  <span>DARK</span>
                </label>
                {colorMode === "system" && (
                  <p className="site-display-options__resolved">
                    USING {resolvedColorMode.toUpperCase()}
                  </p>
                )}
              </fieldset>
              <fieldset className="site-display-options">
                <legend>DENSITY</legend>
                <label>
                  <input
                    type="radio"
                    name="idoldle-density"
                    value="automatic"
                    checked={density === "automatic"}
                    onChange={() => chooseDensity("automatic")}
                  />
                  <span>AUTOMATIC</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="idoldle-density"
                    value="compact"
                    checked={density === "compact"}
                    onChange={() => chooseDensity("compact")}
                  />
                  <span>COMPACT</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="idoldle-density"
                    value="comfortable"
                    checked={density === "comfortable"}
                    onChange={() => chooseDensity("comfortable")}
                  />
                  <span>COMFORTABLE</span>
                </label>
                {density === "automatic" && (
                  <p className="site-display-options__resolved">
                    USING {resolvedDensity.toUpperCase()}
                  </p>
                )}
              </fieldset>
            </div>
          )}
        </div>
      </nav>

      <div className="site-status" aria-label="Today&apos;s game status">
        <StatusCell className="site-status__cell--today" label="Today:" value={dateKey} />
        <StatusCell className="site-status__cell--theme" label="Theme:" value={themeLabel} title={themeLabel} />
        <StatusCell
          className="site-status__cell--attempt"
          label="Attempt:"
          value={`${Math.min(currentAttempt, maxGuesses)} / ${maxGuesses}`}
        />
        <StatusCell className="site-status__cell--streak" label="Streak:" value={<>🔥 {currentStreak}</>} />
        <StatusCell className="site-status__cell--best" label="Best:" value={<>🏆 {longestStreak}</>} />
      </div>
    </header>
  );
}
