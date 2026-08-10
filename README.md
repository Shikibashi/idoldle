# Idoldle

A daily Wordle-style guessing game where the hidden answer is a 6-letter romanized stage name of a K-pop girl group idol, with day-of-week themed rotation.

- Mon — 4th gen · Tue — 3rd gen · Wed — 2nd gen · Thu — rookies · Fri — legacy · Sat — wildcard · Sun — throwback
- 6 guesses, standard Wordle feedback (correct / present / absent)
- Local-only stats — no accounts, no backend
- Responsive and capability-aware, with keyboard and touch support, desktop-serious ECW Page Mode structure, and accessibility preferences

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173.

## Commands

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Build static bundle |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm scrape:idols` | Regenerate the idol snapshot from the data source |
| `pnpm validate:snapshot` | Validate committed snapshot invariants |
| `pnpm audit:rotation` | Audit day-of-week rotation for repeat risk |
| `pnpm verify:determinism` | Confirm daily-answer determinism |

## Dataset

Idol data is a committed JSON snapshot at `public/data/idols.json`, produced by `scripts/scrape-idols.ts`. The current snapshot is hand-curated for v1 reliability; a scrape against `dbkpop.com` or another source can be enabled when the legal review of the ToS is complete.

The data snapshot is versioned by `snapshotDate`, which is baked into the daily-answer hash so that a new deploy never retroactively changes past answers.

## Accessibility

- `aria-label` on every tile announces state (correct / present / absent / empty)
- `role="alert"` toasts for invalid input
- Shape overlays (dot / ring) in color-blind mode so green vs yellow are distinguishable
- `prefers-reduced-motion` honored: no flip animation
- Physical keyboard works on desktop (A–Z, Enter, Backspace, Escape, Tab)

## Offline

v1 does not bundle a service worker; offline play is a post-launch follow-up. Once loaded, the game continues to work without a network connection, but a fresh cold load requires the bundle.

## Source attribution

If the scrape pipeline is enabled, the app footer will credit the data source and its license. The committed v1 snapshot is a hand-curated list of widely known 6-letter stage names with factual metadata only.
