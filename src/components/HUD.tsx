import { useCallback, useEffect, useRef, useState } from "react";
import { formatDateKey } from "../lib/format";
import { ENGLISH_STRINGS as strings } from "../lib/strings";

export interface HUDProps {
  colorMode: "system" | "dark" | "light";
  resolvedColorMode: "dark" | "light";
  density: "automatic" | "compact" | "comfortable";
  resolvedDensity: "compact" | "comfortable";
  contrast: "normal" | "increased";
  dateKey: string;
  themeLabel: string;
  currentStreak: number;
  longestStreak: number;
  currentAttempt: number;
  maxGuesses: number;
  onOpenStats: (origin?: HTMLElement) => void;
  onOpenAbout: (origin?: HTMLElement) => void;
  onOpenHow: (origin?: HTMLElement) => void;
  onColorModeChange: (nextColorMode: "system" | "dark" | "light") => void;
  onDensityChange: (
    nextDensity: "automatic" | "compact" | "comfortable",
  ) => void;
  onContrastChange: (nextContrast: "normal" | "increased") => void;
  onResetDisplayPreferences: () => void;
  activeView: "about" | "how-to-play" | "statistics" | null;
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
      <span className="site-status__value" title={title}>
        {value}
      </span>
    </span>
  );
}

export function HUD({
  colorMode,
  resolvedColorMode,
  density,
  resolvedDensity,
  contrast,
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
  onContrastChange,
  onResetDisplayPreferences,
  activeView,
}: HUDProps) {
  const [displayOpen, setDisplayOpen] = useState(false);
  const displayControlRef = useRef<HTMLDivElement>(null);
  const displayButtonRef = useRef<HTMLButtonElement>(null);
  const displayPopupRef = useRef<HTMLDivElement>(null);

  const closeDisplay = useCallback(() => {
    setDisplayOpen(false);
    displayButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const popup = displayPopupRef.current as
      | (HTMLDivElement & {
          showPopover?: () => void;
          hidePopover?: () => void;
        })
      | null;
    if (!popup || !displayOpen) return;

    // Keep the ordinary in-flow fallback on narrow screens. Native popovers
    // enter the top layer and can be positioned outside a short mobile
    // viewport; the fallback remains fully operable there.
    const useNativePopover = window.matchMedia("(min-width: 640px)").matches;
    if (!useNativePopover) return;

    // Native Popover supplies top-layer dismissal and Escape behavior where
    // available. The React state, focus trap, and ordinary div remain the
    // reliable fallback for older browsers.
    popup.setAttribute("popover", "auto");
    const anchor = displayControlRef.current?.getBoundingClientRect();
    if (anchor) {
      popup.style.position = "fixed";
      popup.style.top = `${anchor.bottom + 1}px`;
      popup.style.right = `${Math.max(0, window.innerWidth - anchor.right)}px`;
    }
    popup.showPopover?.();
    return () => popup.hidePopover?.();
  }, [displayOpen]);

  useEffect(() => {
    if (!displayOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        !displayControlRef.current?.contains(event.target as Node) &&
        !displayPopupRef.current?.contains(event.target as Node)
      ) {
        closeDisplay();
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDisplay();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeDisplay, displayOpen]);

  const chooseColorMode = (nextColorMode: HUDProps["colorMode"]) => {
    onColorModeChange(nextColorMode);
    closeDisplay();
  };

  const chooseDensity = (nextDensity: HUDProps["density"]) => {
    onDensityChange(nextDensity);
    closeDisplay();
  };

  const chooseContrast = (nextContrast: HUDProps["contrast"]) => {
    onContrastChange(nextContrast);
    closeDisplay();
  };

  return (
    <header className="site-masthead w-full">
      <div className="site-masthead__top">
        <a
          className="site-home-link"
          href="/"
          aria-label={strings.navigation.home}
        >
          <h1 className="site-logo">IDOLDLE</h1>
          <p className="site-tagline">daily idol database</p>
        </a>
        <div className="site-identity">
          <a
            className="retro-link"
            href="https://edriffles.us"
            target="_blank"
            rel="noopener noreferrer"
          >
            edriffles.us
          </a>
          <span>a daily idol-name puzzle</span>
        </div>
      </div>

      <nav className="site-nav" aria-label="Idoldle navigation">
        <a
          href="#about"
          aria-current={activeView === "about" ? "page" : undefined}
          onClick={(event) => onOpenAbout(event.currentTarget)}
        >
          <span aria-hidden="true">[ </span>
          {strings.navigation.about}
          <span aria-hidden="true"> ]</span>
        </a>
        <a
          href="#how-to-play"
          aria-current={activeView === "how-to-play" ? "page" : undefined}
          onClick={(event) => onOpenHow(event.currentTarget)}
        >
          <span aria-hidden="true">[ </span>
          {strings.navigation.howToPlay}
          <span aria-hidden="true"> ]</span>
        </a>
        <a
          href="#statistics"
          aria-current={activeView === "statistics" ? "page" : undefined}
          onClick={(event) => onOpenStats(event.currentTarget)}
        >
          <span aria-hidden="true">[ </span>
          {strings.navigation.statistics}
          <span aria-hidden="true"> ]</span>
        </a>
        <a
          href="https://github.com/Shikibashi/idoldle"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span aria-hidden="true">[ </span>
          {strings.navigation.github}
          <span aria-hidden="true"> ]</span>
        </a>
        <div className="site-display-control" ref={displayControlRef}>
          <button
            ref={displayButtonRef}
            type="button"
            aria-controls="display-options"
            aria-expanded={displayOpen}
            aria-haspopup="true"
            onClick={() => setDisplayOpen((open) => !open)}
          >
            <span aria-hidden="true">[ </span>
            {strings.navigation.display}
            <span aria-hidden="true"> ]</span>
          </button>
          {displayOpen && (
            <div
              ref={displayPopupRef}
              className="site-display-popup"
              id="display-options"
              aria-label={strings.navigation.displayOptions}
              data-display-popup="true"
            >
              <div className="site-display-popup__title">
                {strings.display.title}
              </div>
              <fieldset className="site-display-options">
                <legend>{strings.display.appearance}</legend>
                <label data-selected={colorMode === "system"}>
                  <input
                    type="radio"
                    name="idoldle-display-mode"
                    value="system"
                    checked={colorMode === "system"}
                    onClick={() => chooseColorMode("system")}
                    onChange={() => chooseColorMode("system")}
                  />
                  <span>{strings.display.system}</span>
                </label>
                <label data-selected={colorMode === "light"}>
                  <input
                    type="radio"
                    name="idoldle-display-mode"
                    value="light"
                    checked={colorMode === "light"}
                    onClick={() => chooseColorMode("light")}
                    onChange={() => chooseColorMode("light")}
                  />
                  <span>{strings.display.light}</span>
                </label>
                <label data-selected={colorMode === "dark"}>
                  <input
                    type="radio"
                    name="idoldle-display-mode"
                    value="dark"
                    checked={colorMode === "dark"}
                    onClick={() => chooseColorMode("dark")}
                    onChange={() => chooseColorMode("dark")}
                  />
                  <span>{strings.display.dark}</span>
                </label>
                {colorMode === "system" && (
                  <p className="site-display-options__resolved">
                    {strings.display.using(resolvedColorMode)}
                  </p>
                )}
              </fieldset>
              <fieldset className="site-display-options">
                <legend>{strings.display.density}</legend>
                <label data-selected={density === "automatic"}>
                  <input
                    type="radio"
                    name="idoldle-density"
                    value="automatic"
                    checked={density === "automatic"}
                    onClick={() => chooseDensity("automatic")}
                    onChange={() => chooseDensity("automatic")}
                  />
                  <span>{strings.display.automatic}</span>
                </label>
                <label data-selected={density === "compact"}>
                  <input
                    type="radio"
                    name="idoldle-density"
                    value="compact"
                    checked={density === "compact"}
                    onClick={() => chooseDensity("compact")}
                    onChange={() => chooseDensity("compact")}
                  />
                  <span>{strings.display.compact}</span>
                </label>
                <label data-selected={density === "comfortable"}>
                  <input
                    type="radio"
                    name="idoldle-density"
                    value="comfortable"
                    checked={density === "comfortable"}
                    onClick={() => chooseDensity("comfortable")}
                    onChange={() => chooseDensity("comfortable")}
                  />
                  <span>{strings.display.comfortable}</span>
                </label>
                {density === "automatic" && (
                  <p className="site-display-options__resolved">
                    {strings.display.using(resolvedDensity)}
                  </p>
                )}
              </fieldset>
              <details className="site-display-advanced">
                <summary>{strings.display.contrast}</summary>
                <fieldset className="site-display-options">
                  <legend>{strings.display.contrast}</legend>
                  <label data-selected={contrast === "normal"}>
                    <input
                      type="radio"
                      name="idoldle-contrast"
                      value="normal"
                      checked={contrast === "normal"}
                      onClick={() => chooseContrast("normal")}
                      onChange={() => chooseContrast("normal")}
                    />
                    <span>{strings.display.normal}</span>
                  </label>
                  <label data-selected={contrast === "increased"}>
                    <input
                      type="radio"
                      name="idoldle-contrast"
                      value="increased"
                      checked={contrast === "increased"}
                      onClick={() => chooseContrast("increased")}
                      onChange={() => chooseContrast("increased")}
                    />
                    <span>{strings.display.increased}</span>
                  </label>
                </fieldset>
              </details>
              <button
                className="site-display-reset"
                type="button"
                onClick={() => {
                  onResetDisplayPreferences();
                  closeDisplay();
                }}
              >
                <span aria-hidden="true">[ </span>
                {strings.navigation.resetDisplay}
                <span aria-hidden="true"> ]</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="site-status" aria-label="Today's game status">
        <StatusCell
          className="site-status__cell--today"
          label={`${strings.status.today}:`}
          value={<time dateTime={dateKey}>{formatDateKey(dateKey)}</time>}
        />
        <StatusCell
          className="site-status__cell--theme"
          label={`${strings.status.theme}:`}
          value={themeLabel}
          title={themeLabel}
        />
        <StatusCell
          className="site-status__cell--attempt"
          label={`${strings.status.attempt}:`}
          value={`${Math.min(currentAttempt, maxGuesses)} / ${maxGuesses}`}
        />
        <StatusCell
          className="site-status__cell--streak"
          label={`${strings.status.streak}:`}
          value={<>🔥 {currentStreak}</>}
        />
        <StatusCell
          className="site-status__cell--best"
          label={`${strings.status.best}:`}
          value={<>🏆 {longestStreak}</>}
        />
      </div>
    </header>
  );
}
