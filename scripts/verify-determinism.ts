/**
 * verify-determinism.ts
 *
 * Imports getDailyAnswer from src/lib/daily.ts and asserts that the same
 * (dateKey, snapshot) inputs always produce the same output over many
 * iterations.
 *
 * Test strategy:
 *   - Pick 50 (dateKey, snapshot) combos spanning all 7 themes.
 *   - For each combo, call getDailyAnswer 20 times.
 *   - Assert all 20 results are identical (stageName comparison).
 *
 * Exits 0 if all 50 × 20 = 1000 checks pass, non-zero otherwise.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import type { Snapshot } from "../src/types";
import { getDailyAnswer } from "../src/lib/daily";

const SNAPSHOT_PATH = resolve(
  new URL(".", import.meta.url).pathname,
  "../public/data/idols.json",
);

const COMBOS = 50;
const ITERATIONS_PER_COMBO = 20;

// Load snapshot
const snapshot: Snapshot = JSON.parse(
  readFileSync(SNAPSHOT_PATH, "utf-8"),
) as Snapshot;

// Generate 50 deterministic date keys spread across a 2-year window
// (7 weeks × ~7 days = covers all day-of-week themes multiple times)
// Base date: 2024-01-01 (Monday). Step by prime 11 days to cover all themes.
const BASE_DATE = new Date("2024-01-01T00:00:00Z");
const STEP_DAYS = 11; // prime, so we cycle through all 7 dow values

const dateKeys: string[] = [];
for (let i = 0; i < COMBOS; i++) {
  const d = new Date(BASE_DATE.getTime() + i * STEP_DAYS * 24 * 60 * 60 * 1000);
  dateKeys.push(d.toISOString().slice(0, 10));
}

let passed = 0;
let failed = 0;

for (const dateKey of dateKeys) {
  // Run ITERATIONS_PER_COMBO times and collect results
  const results: string[] = [];
  for (let iter = 0; iter < ITERATIONS_PER_COMBO; iter++) {
    const idol = getDailyAnswer(dateKey, snapshot);
    results.push(idol.stageName);
  }

  // All results must be identical
  const first = results[0]!;
  const allMatch = results.every((r) => r === first);

  if (allMatch) {
    passed++;
  } else {
    console.error(
      `FAIL: Non-deterministic result for dateKey="${dateKey}" — ` +
        `got: [${[...new Set(results)].join(", ")}]`,
    );
    failed++;
  }
}

console.log(
  `Determinism check: ${passed}/${COMBOS} combos passed ` +
    `(${passed * ITERATIONS_PER_COMBO} total iterations)`,
);

if (failed === 0) {
  console.log(
    `PASS — all ${COMBOS * ITERATIONS_PER_COMBO} calls returned identical results`,
  );
  process.exit(0);
} else {
  console.error(`FAIL — ${failed} combo(s) produced non-deterministic results`);
  process.exit(1);
}
