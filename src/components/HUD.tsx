interface HUDProps {
  dateKey: string;
  themeLabel: string;
  currentStreak: number;
  longestStreak: number;
  currentAttempt: number;
  maxGuesses: number;
  onOpenStats: () => void;
  onOpenAbout: () => void;
  onOpenHow: () => void;
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
  dateKey,
  themeLabel,
  currentStreak,
  longestStreak,
  currentAttempt,
  maxGuesses,
  onOpenStats,
  onOpenAbout,
  onOpenHow,
}: HUDProps) {
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
