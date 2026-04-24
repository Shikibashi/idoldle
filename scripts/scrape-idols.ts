/**
 * scrape-idols.ts
 *
 * v1 uses a committed hand-curated snapshot. Live scraping is disabled
 * pending ToS review of the configured source (dbkpop.com).
 *
 * To regenerate frozen pools from the existing idol list using the
 * fallback chain defined in src/lib/themes.ts, run:
 *
 *   pnpm run build-pools
 *
 * When live scraping is eventually enabled (opt-in via ENABLE_SCRAPE=1),
 * this script would:
 *   1. Fetch idol profile pages from dbkpop.com (1 req/s rate limit).
 *   2. Cache raw HTML to .cache/ to avoid redundant fetches.
 *   3. Parse: stageName, group, debutYear, era tag.
 *   4. Filter to stage names that are exactly 6 uppercase ASCII letters.
 *   5. Assign themeTags[] per src/lib/themes.ts era boundaries.
 *   6. Call buildFrozenPools() to compute fallback-applied sorted pools.
 *   7. Write public/data/idols.json (pretty-printed) with snapshotDate
 *      set to today's UTC date.
 *   8. On any fetch/parse error, exit non-zero WITHOUT overwriting the
 *      existing snapshot.
 *
 * Usage:
 *   pnpm run scrape:idols              # prints this notice, exits 0
 *   ENABLE_SCRAPE=1 pnpm run scrape:idols  # (future) runs live scrape
 */

const ENABLE_SCRAPE = process.env["ENABLE_SCRAPE"] === "1";

if (!ENABLE_SCRAPE) {
  console.log(
    "v1 uses a committed hand-curated snapshot. " +
      "Live scrape disabled pending ToS review.",
  );
  console.log(
    "To regenerate frozen pools from src/lib/themes.ts fallback chain, run:",
  );
  console.log("  pnpm run build-pools");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Live scrape path (future — not yet active)
// ---------------------------------------------------------------------------

// NOTE: This block is intentionally unreachable in v1. When activating,
// remove the `process.exit(0)` above and implement the steps described in
// the file-level comment.

console.error(
  "Live scrape not yet implemented. " +
    "Set ENABLE_SCRAPE=1 only after implementing the scraper body.",
);
process.exit(1);
