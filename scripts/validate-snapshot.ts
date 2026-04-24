/**
 * validate-snapshot.ts
 *
 * CI guard enforcing dataset integrity:
 *   - snapshotDate matches YYYY-MM-DD
 *   - idols.length >= 20
 *   - >= 3 distinct era tags across all idols
 *   - Every stageName is uppercase A-Z (any length at idol level)
 *   - Every entry in themeTags is a valid ThemeKey
 *   - frozenPools present; 7 pools (len-4..len-10); each pool has:
 *       - length matching THEME_LENGTH[themeKey]
 *       - minimum entries per pool (>= 8 for lengths 4-8; >= 2 for len-9/len-10
 *         to accommodate the real-world constraint of small high-length pools)
 *       - each entry stageName.length === pool.length
 *
 * Exits 0 on success, non-zero on any failure.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import type { Snapshot, ThemeKey } from "../src/types";
import { THEME_LENGTH } from "../src/lib/themes";

const SNAPSHOT_PATH = resolve(
  new URL(".", import.meta.url).pathname,
  "../public/data/idols.json",
);

const ALL_THEME_KEYS: ThemeKey[] = [
  "len-4",
  "len-5",
  "len-6",
  "len-7",
  "len-8",
  "long-name",
];

const VALID_THEME_KEYS: Set<ThemeKey> = new Set(ALL_THEME_KEYS);

const SNAPSHOT_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STAGE_NAME_RE = /^[A-Z]+$/;

const MIN_IDOLS = 20;
const MIN_ERA_TAGS = 3;

// Per-theme minimum pool size. Fixed-length pools must be >= 8; the
// mixed "long-name" (9 + 10) pool combines two small natural pools and
// is expected to sit around 8–12.
const MIN_POOL_SIZE: Record<ThemeKey, number> = {
  "len-4": 8,
  "len-5": 8,
  "len-6": 8,
  "len-7": 8,
  "len-8": 8,
  "long-name": 8,
};

let failures = 0;

function fail(msg: string): void {
  console.error(`FAIL: ${msg}`);
  failures++;
}

function pass(msg: string): void {
  console.log(`PASS: ${msg}`);
}

// Load snapshot
let snapshot: Snapshot;
try {
  const raw = readFileSync(SNAPSHOT_PATH, "utf-8");
  snapshot = JSON.parse(raw) as Snapshot;
} catch (err) {
  console.error(`FAIL: Could not load snapshot at ${SNAPSHOT_PATH}: ${String(err)}`);
  process.exit(1);
}

// --- snapshotDate format ---
if (!SNAPSHOT_DATE_RE.test(snapshot.snapshotDate)) {
  fail(`snapshotDate "${snapshot.snapshotDate}" does not match YYYY-MM-DD`);
} else {
  pass(`snapshotDate "${snapshot.snapshotDate}" is valid`);
}

// --- minimum idol count ---
const idolCount = snapshot.idols.length;
if (idolCount < MIN_IDOLS) {
  fail(`idols.length = ${idolCount} (minimum ${MIN_IDOLS})`);
} else {
  pass(`idols.length = ${idolCount} (>= ${MIN_IDOLS})`);
}

// --- distinct era tags ---
const eras = new Set(snapshot.idols.map((i) => i.era));
if (eras.size < MIN_ERA_TAGS) {
  fail(`Only ${eras.size} distinct era tags found: ${[...eras].join(", ")} (minimum ${MIN_ERA_TAGS})`);
} else {
  pass(`${eras.size} distinct era tags: ${[...eras].join(", ")}`);
}

// --- stageName format (uppercase A-Z, any length) ---
let badNames = 0;
for (const idol of snapshot.idols) {
  if (!STAGE_NAME_RE.test(idol.stageName)) {
    fail(`Invalid stageName: "${idol.stageName}" (must be uppercase A-Z only)`);
    badNames++;
  }
}
if (badNames === 0) {
  pass(`All ${idolCount} stageNames are uppercase A-Z`);
}

// --- valid ThemeKey tags ---
let badTags = 0;
for (const idol of snapshot.idols) {
  for (const tag of idol.themeTags) {
    if (!VALID_THEME_KEYS.has(tag as ThemeKey)) {
      fail(`Idol "${idol.stageName}" has invalid themeTag: "${tag}"`);
      badTags++;
    }
  }
}
if (badTags === 0) {
  pass(`All themeTags are valid ThemeKey values`);
}

// --- frozenPools shape and length integrity ---
if (!snapshot.frozenPools) {
  fail("frozenPools is missing from snapshot");
} else {
  let poolFailures = 0;
  for (const key of ALL_THEME_KEYS) {
    const pool = snapshot.frozenPools[key];
    const minSize = MIN_POOL_SIZE[key];
    if (!pool) {
      fail(`frozenPools["${key}"] is missing`);
      poolFailures++;
      continue;
    }

    const expectedLength = THEME_LENGTH[key]; // undefined for "long-name"
    const expectedPoolLength: number | null = expectedLength ?? null;
    if (pool.length !== expectedPoolLength) {
      fail(
        `frozenPools["${key}"].length = ${pool.length}, expected ${expectedPoolLength}`,
      );
      poolFailures++;
    }

    if (!Array.isArray(pool.idols)) {
      fail(`frozenPools["${key}"].idols is not an array`);
      poolFailures++;
      continue;
    }

    if (pool.idols.length < minSize) {
      fail(
        `frozenPools["${key}"].idols.length = ${pool.idols.length} (minimum ${minSize})`,
      );
      poolFailures++;
    }

    let badPoolEntries = 0;
    for (const idol of pool.idols) {
      const l = idol.stageName.length;
      const ok =
        expectedLength !== undefined
          ? l === expectedLength
          : l === 9 || l === 10; // long-name accepts mixed 9-10
      if (!ok) {
        fail(
          `frozenPools["${key}"] contains "${idol.stageName}" ` +
            `(length ${l}, expected ${expectedLength ?? "9 or 10"})`,
        );
        badPoolEntries++;
      }
    }
    if (
      badPoolEntries === 0 &&
      pool.idols.length >= minSize &&
      pool.length === expectedPoolLength
    ) {
      const lenLabel = expectedLength === undefined ? "mixed(9,10)" : String(pool.length);
      pass(
        `frozenPools["${key}"]: length=${lenLabel}, idols=${pool.idols.length} (>= ${minSize})`,
      );
    } else if (badPoolEntries > 0) {
      poolFailures++;
    }
  }
  if (poolFailures === 0) {
    pass(`All ${ALL_THEME_KEYS.length} frozen pools meet length + size requirements`);
  }
}

// --- Summary ---
console.log("");
if (failures === 0) {
  console.log(`Snapshot validation PASSED (${idolCount} idols, all checks OK)`);
  process.exit(0);
} else {
  console.error(`Snapshot validation FAILED with ${failures} error(s)`);
  process.exit(1);
}
