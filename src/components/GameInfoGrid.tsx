import type { Snapshot, Stats } from "../types";
import type { AppView } from "../lib/navigation";
import { ENGLISH_STRINGS as strings } from "../lib/strings";
import { formatCount, formatDateKey } from "../lib/format";

interface GameInfoGridProps {
  snapshot: Snapshot;
  stats: Stats;
  openView: (view: AppView, origin?: HTMLElement) => void;
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

export function GameInfoGrid({ snapshot, stats, openView }: GameInfoGridProps) {
  return (
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
  );
}
