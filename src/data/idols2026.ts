import type { Idol, ThemeKey } from "../types";

/**
 * Curated 2026 girl-group pass, verified 2026-08-10.
 *
 * Scope:
 * - human members of South Korean/K-pop girl groups, project girl groups,
 *   idol bands, and girl crews that officially debuted in 2026
 * - stage names must normalize to 4-10 uppercase ASCII letters to be playable
 * - virtual/AI-only acts, co-ed groups, boy groups, pre-debut acts, and
 *   non-K-pop overseas groups are intentionally excluded
 *
 * Roster facts are stored separately from the legacy snapshot so this fast-
 * moving rookie layer can be audited and refreshed without hand-editing the
 * 689-entry generated snapshot.
 */

export const IDOLS_2026_SNAPSHOT_DATE = "2026-08-10";

interface Curated2026Row {
  stageName: string;
  group: string;
  debutDate: string;
  sourceUrl: string;
}

const SOURCES = {
  latency: "https://kprofiles.com/latency-members-profile/",
  navillera: "https://kprofiles.com/troy-girls-members-profile/",
  savvvy: "https://kprofiles.com/savvvy-members-profile/",
  runawayKidsClub: "https://kprofiles.com/runawaykidsclub-members-profile/",
  dodree: "https://kprofiles.com/dodree-members-profile/",
  afuture: "https://kprofiles.com/afuture-members-profile/",
  s2it: "https://kprofiles.com/s2it-members-profile/",
  awu: "https://kprofiles.com/awu-members-profile/",
  unchild: "https://kprofiles.com/unchild-members-profile/",
  hopePrincess: "https://kprofiles.com/h-pe-princess-members-profile/",
  poison: "https://kprofiles.com/poison-members-profile/",
  heartOfWoman: "https://kprofiles.com/heart-of-woman-members-profile/",
  keyveatz: "https://kprofiles.com/h1ghr-music-girls-members-profile/",
} as const;

const ROWS: Curated2026Row[] = [
  // LATENCY — debuted 2026-01-08. Current lineup after Hyunjin's departure.
  { stageName: "HEEYEON", group: "LATENCY", debutDate: "2026-01-08", sourceUrl: SOURCES.latency },
  { stageName: "ZZONE", group: "LATENCY", debutDate: "2026-01-08", sourceUrl: SOURCES.latency },
  { stageName: "HAEUN", group: "LATENCY", debutDate: "2026-01-08", sourceUrl: SOURCES.latency },
  { stageName: "SEMI", group: "LATENCY", debutDate: "2026-01-08", sourceUrl: SOURCES.latency },

  // dodree — debuted 2026-01-21. Lee Song Hyun normalizes to 11 letters,
  // so only Na Yeongjoo is playable under Idoldle's 4-10 letter rule.
  { stageName: "NAYEONGJOO", group: "dodree", debutDate: "2026-01-21", sourceUrl: SOURCES.dodree },

  // NAVILLERA — debuted 2026-02-03; current five-member lineup includes Dahlia.
  { stageName: "MELODY", group: "NAVILLERA", debutDate: "2026-02-03", sourceUrl: SOURCES.navillera },
  { stageName: "ENNY", group: "NAVILLERA", debutDate: "2026-02-03", sourceUrl: SOURCES.navillera },
  { stageName: "SAYA", group: "NAVILLERA", debutDate: "2026-02-03", sourceUrl: SOURCES.navillera },
  { stageName: "RILA", group: "NAVILLERA", debutDate: "2026-02-03", sourceUrl: SOURCES.navillera },
  { stageName: "DAHLIA", group: "NAVILLERA", debutDate: "2026-02-03", sourceUrl: SOURCES.navillera },

  // SAVVVY — debuted 2026-02-04. HYO is 3 letters; AI member Kiri is excluded.
  { stageName: "SOOHYUN", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "YUJIN", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "NAHYUN", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "GAYEON", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "JISOL", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "JUHYEON", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "AYOUNG", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "SUNGKYUNG", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "HYUNJOO", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "JISOO", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "SEON", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "YERIN", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },
  { stageName: "DAHYEON", group: "SAVVVY", debutDate: "2026-02-04", sourceUrl: SOURCES.savvvy },

  // RunawayKidsClub — debuted 2026-02-26.
  { stageName: "VEDA", group: "RunawayKidsClub", debutDate: "2026-02-26", sourceUrl: SOURCES.runawayKidsClub },
  { stageName: "CHIHOO", group: "RunawayKidsClub", debutDate: "2026-02-26", sourceUrl: SOURCES.runawayKidsClub },
  { stageName: "FHUU", group: "RunawayKidsClub", debutDate: "2026-02-26", sourceUrl: SOURCES.runawayKidsClub },
  { stageName: "ESEUL", group: "RunawayKidsClub", debutDate: "2026-02-26", sourceUrl: SOURCES.runawayKidsClub },

  // AFuture — debuted 2026-03-14.
  { stageName: "JISOO", group: "AFuture", debutDate: "2026-03-14", sourceUrl: SOURCES.afuture },
  { stageName: "YOUNGEUN", group: "AFuture", debutDate: "2026-03-14", sourceUrl: SOURCES.afuture },
  { stageName: "YIRE", group: "AFuture", debutDate: "2026-03-14", sourceUrl: SOURCES.afuture },
  { stageName: "SEOYEON", group: "AFuture", debutDate: "2026-03-14", sourceUrl: SOURCES.afuture },
  { stageName: "MINJI", group: "AFuture", debutDate: "2026-03-14", sourceUrl: SOURCES.afuture },

  // S2iT — debuted 2026-03-14. Sea is 3 letters and is not playable.
  { stageName: "YEONSOO", group: "S2iT", debutDate: "2026-03-14", sourceUrl: SOURCES.s2it },
  { stageName: "HARU", group: "S2iT", debutDate: "2026-03-14", sourceUrl: SOURCES.s2it },
  { stageName: "HYOBIN", group: "S2iT", debutDate: "2026-03-14", sourceUrl: SOURCES.s2it },
  { stageName: "SEUNGBI", group: "S2iT", debutDate: "2026-03-14", sourceUrl: SOURCES.s2it },

  // AWU — debuted 2026-04-09. Dia is 3 letters; U_Chae normalizes to UCHAE.
  { stageName: "LOLA", group: "AWU", debutDate: "2026-04-09", sourceUrl: SOURCES.awu },
  { stageName: "UCHAE", group: "AWU", debutDate: "2026-04-09", sourceUrl: SOURCES.awu },

  // UNCHILD — debuted 2026-04-21. Ako is 3 letters and is not playable.
  { stageName: "HEEKIE", group: "UNCHILD", debutDate: "2026-04-21", sourceUrl: SOURCES.unchild },
  { stageName: "YEEUN", group: "UNCHILD", debutDate: "2026-04-21", sourceUrl: SOURCES.unchild },
  { stageName: "TINA", group: "UNCHILD", debutDate: "2026-04-21", sourceUrl: SOURCES.unchild },
  { stageName: "EVON", group: "UNCHILD", debutDate: "2026-04-21", sourceUrl: SOURCES.unchild },
  { stageName: "HAEUN", group: "UNCHILD", debutDate: "2026-04-21", sourceUrl: SOURCES.unchild },

  // H//PE Princess — debuted 2026-05-27. YSY and Doi are 3 letters.
  { stageName: "COCO", group: "H//PE Princess", debutDate: "2026-05-27", sourceUrl: SOURCES.hopePrincess },
  { stageName: "YUJU", group: "H//PE Princess", debutDate: "2026-05-27", sourceUrl: SOURCES.hopePrincess },
  { stageName: "RINO", group: "H//PE Princess", debutDate: "2026-05-27", sourceUrl: SOURCES.hopePrincess },
  { stageName: "NIKO", group: "H//PE Princess", debutDate: "2026-05-27", sourceUrl: SOURCES.hopePrincess },
  { stageName: "SUJIN", group: "H//PE Princess", debutDate: "2026-05-27", sourceUrl: SOURCES.hopePrincess },

  // POISON — debuted 2026-05-27.
  { stageName: "WINDY", group: "POISON", debutDate: "2026-05-27", sourceUrl: SOURCES.poison },
  { stageName: "SUNNY", group: "POISON", debutDate: "2026-05-27", sourceUrl: SOURCES.poison },
  { stageName: "LUNA", group: "POISON", debutDate: "2026-05-27", sourceUrl: SOURCES.poison },

  // HEART OF WOMAN / H.O.W — debuted 2026-05-28. Spaces removed for JI HYUN.
  { stageName: "JIHYUN", group: "HEART OF WOMAN", debutDate: "2026-05-28", sourceUrl: SOURCES.heartOfWoman },
  { stageName: "CHAEI", group: "HEART OF WOMAN", debutDate: "2026-05-28", sourceUrl: SOURCES.heartOfWoman },
  { stageName: "AYNE", group: "HEART OF WOMAN", debutDate: "2026-05-28", sourceUrl: SOURCES.heartOfWoman },
  { stageName: "LIRI", group: "HEART OF WOMAN", debutDate: "2026-05-28", sourceUrl: SOURCES.heartOfWoman },
  { stageName: "LIUYIN", group: "HEART OF WOMAN", debutDate: "2026-05-28", sourceUrl: SOURCES.heartOfWoman },

  // Keyveatz — official debut 2026-06-30 with OXY_GEN.
  // Multi-word official stage names are collapsed to A-Z for Wordle input.
  { stageName: "SONJUONE", group: "Keyveatz", debutDate: "2026-06-30", sourceUrl: SOURCES.keyveatz },
  { stageName: "NEWY", group: "Keyveatz", debutDate: "2026-06-30", sourceUrl: SOURCES.keyveatz },
  { stageName: "UMJIONE", group: "Keyveatz", debutDate: "2026-06-30", sourceUrl: SOURCES.keyveatz },
  { stageName: "KIMYUNA", group: "Keyveatz", debutDate: "2026-06-30", sourceUrl: SOURCES.keyveatz },
  { stageName: "KANGYESEUL", group: "Keyveatz", debutDate: "2026-06-30", sourceUrl: SOURCES.keyveatz },
];

function themeForLength(length: number): ThemeKey {
  if (length >= 4 && length <= 8) return `len-${length}` as ThemeKey;
  if (length === 9 || length === 10) return "long-name";
  throw new Error(`2026 curated stage name has unsupported length ${length}`);
}

/** The playable 2026 rows converted to the same Idol shape as the base snapshot. */
export const IDOLS_2026: Idol[] = ROWS.map((row) => ({
  stageName: row.stageName,
  group: row.group,
  era: "5th gen",
  debutYear: 2026,
  themeTags: [themeForLength(row.stageName.length)],
}));

/** Provenance stays available to tests/audits without shipping it in Idol objects. */
export const IDOLS_2026_PROVENANCE = ROWS.map((row) => ({ ...row }));
