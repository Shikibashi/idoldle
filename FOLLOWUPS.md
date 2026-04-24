# Idoldle v1 — Follow-ups from Phase 4 Validation

Ship status: **APPROVED** by Architect + Security + Code-reviewer (all three). No REJECTs, no blocking issues.

Items below are tracked for v1.1 or later — none block the initial ship.

## Addressed in post-validation cleanup

- ✅ **HIGH** Stale `initialState` in `useGame.ts` — replaced `useMemo` + eslint-disable with a plain per-render compute. `resetTodayIfStale` remains the reconciliation path on focus/visibility.
- ✅ **MEDIUM** `setTimeout` leak in `ShareButton.tsx` — now uses a `useRef` + unmount cleanup.
- ✅ **MEDIUM** `setTimeout` leak in `useGame.ts triggerShake` — same ref + unmount cleanup pattern as the toast timer.

## Tracked for v1.1

### Architect followups
- **AC-17 keyboard tap-target width** — letter keys use `min-w-[2.5rem]` (40px); WCAG recommends 48×48. Height is already 48px. Increase to `min-w-[3rem]` or add a Playwright viewport test proving effective tap area including padding meets 48px.
- **AC-21 row-completion live region** — add a `role="status"` to `Board.tsx` that announces "Row N: {feedback summary}" after each guess so screen readers get a per-row recap (tile-level `aria-label` already covers per-tile state).
- **AC-14 scrape script** — when the `dbkpop.com` ToS review is complete, implement the real `scripts/scrape-idols.ts` behind `ENABLE_SCRAPE=1`. Until then, the hand-curated 46-entry snapshot is the ADR-approved fallback.

### Security followups
- **Vite / esbuild dev-server CVEs** (GHSA-67mh-4wv8-2f99, GHSA-4w7w-66w2-5vf9) — upgrade Vite to latest 5.x or 6.x. Both issues are dev-server-only; production static bundle is unaffected.
- **CSP meta tag** — add `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">` to `index.html` as defense in depth.
- **localStorage schema validator** — in `useLocalStorage.ts`, add a lightweight runtime shape check (e.g. `typeof parsed.data.dateKey === 'string'`) before trusting values with a correct `_v`.

### Code-quality followups
- **Toast re-announce** — identical consecutive messages (e.g. two "Need 6 letters" toasts) aren't re-announced by screen readers because the DOM text doesn't change. Cycle to `null` for one frame before setting the new message, or append an invisible counter.
- **Sun-throwback fallback spec divergence** — plan specifies Sun = union of Wed+Fri pools; `THEME_FALLBACK` implements it as a single-key fallback to `wed-2nd` only. Either extend the fallback to support multi-key unions in `build-frozen-pools.ts`, or tag Sunday idols with both source pools in the snapshot.
- **Dead code** — remove `STATE_PRECEDENCE` and the `data-state-prec-*` data attribute from `Keyboard.tsx` (defined but never read by CSS/JS/tests).
- **StrictMode double-invocation** — in `useGame.ts submitInput`, side-effectful calls (`showToast`, `triggerShake`) are invoked inside the `setState` updater, which can fire twice in StrictMode dev. Refactor to validate-then-set rather than side-effects-inside-setter.
- **Test coverage** — add integration tests for `useGame` (submit valid/invalid, win/loss transitions, midnight reset) and `useLocalStorage` (schema migration, quota-exceeded fallback). Current 87 tests cover pure lib code only.
- **Tile aria-label empty state** — `"Letter , empty"` reads awkwardly; change to `letter ? \`Letter ${letter}, ${state}\` : "Empty tile"`.

### Product followups (from ADR)
- Legal review of data-source ToS before enabling the live scrape.
- `/puzzle/[date]` permalink support (would trigger a reconsideration of Next.js).
- Post-launch privacy-respecting analytics (Umami or Plausible).
- Quarterly scrape-snapshot refresh cadence; regenerate when major new groups debut.
