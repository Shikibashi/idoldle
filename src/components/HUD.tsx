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
        <button type="button" onClick={onOpenStats}>[ STATISTICS ]</button>
        <a href="https://github.com/Shikibashi/idoldle" target="_blank" rel="noreferrer">[ GITHUB ]</a>
      </nav>

      <div className="site-status" aria-label="Today&apos;s game status">
        <span><strong>Today:</strong> {dateKey}</span>
        <span><strong>Theme:</strong> {themeLabel}</span>
        <span><strong>Attempt:</strong> {Math.min(currentAttempt, maxGuesses)} / {maxGuesses}</span>
        <span><strong>Streak:</strong> 🔥 {currentStreak}</span>
        <span><strong>Best:</strong> 🏆 {longestStreak}</span>
      </div>
    </header>
  );
}
