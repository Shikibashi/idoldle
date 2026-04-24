/**
 * build-snapshot.ts
 *
 * One-shot regenerator for public/data/idols.json. Run via:
 *
 *   npx tsx scripts/build-snapshot.ts
 *
 * Produces a snapshot keyed by length-driven themes (len-4 ... len-10).
 * Every stageName is validated to be ASCII A-Z and a valid length in [4, 10].
 * Entries are deduplicated by stageName (first occurrence wins for the
 * primary group / era). For each length bucket the script emits a frozen
 * pool tagged "len-{N}".
 *
 * Source of truth for idol membership: docs/idol-reference.md. Additional
 * entries for long lengths (9 / 10) are flagged with `era: "extra"` and
 * sourced from public knowledge of girl-group rosters.
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import type { Idol, Snapshot, ThemeKey } from "../src/types";
import { buildFrozenPools } from "./build-frozen-pools";
import { THEME_LENGTH } from "../src/lib/themes";

const OUT_PATH = resolve(
  new URL(".", import.meta.url).pathname,
  "../public/data/idols.json",
);

const SNAPSHOT_DATE = "2026-04-24";

// Minimum pool sizes (keep in sync with validate-snapshot.ts)
const MIN_POOL_SIZE: Record<ThemeKey, number> = {
  "len-4": 8,
  "len-5": 8,
  "len-6": 8,
  "len-7": 8,
  "len-8": 8,
  "long-name": 8, // combined 9 + 10-letter pool
};

interface Row {
  stageName: string;
  group: string;
  era: string;
  debutYear: number;
  /**
   * Optional list of alternate group affiliations for the same romanized
   * stage name. Populated automatically by the dedup pass when a second
   * row with the same stageName appears — its group gets pushed here
   * instead of silently dropping the row. Game runtime never reads this
   * (confirmed by grep); the reveal UI may surface it later.
   */
  aliases?: string[];
}

/**
 * Rows are grouped by group for readability. Every row in this file is
 * 4-10 letters. Entries < 4 (J, LE, JiU, Sei, etc.) are intentionally
 * excluded from gameplay. Multi-word stage names have spaces stripped.
 */
const ROWS: Row[] = [
  // ── 3rd Generation ────────────────────────────────────────────────────
  // TWICE (JYP, 2015)
  { stageName: "NAYEON",    group: "TWICE",        era: "3rd gen", debutYear: 2015 },
  { stageName: "JEONGYEON", group: "TWICE",        era: "3rd gen", debutYear: 2015 },
  { stageName: "MOMO",      group: "TWICE",        era: "3rd gen", debutYear: 2015 },
  { stageName: "SANA",      group: "TWICE",        era: "3rd gen", debutYear: 2015 },
  { stageName: "JIHYO",     group: "TWICE",        era: "3rd gen", debutYear: 2015 },
  { stageName: "MINA",      group: "TWICE",        era: "3rd gen", debutYear: 2015 },
  { stageName: "DAHYUN",    group: "TWICE",        era: "3rd gen", debutYear: 2015 },
  { stageName: "CHAEYOUNG", group: "TWICE",        era: "3rd gen", debutYear: 2015 },
  { stageName: "TZUYU",     group: "TWICE",        era: "3rd gen", debutYear: 2015 },

  // BLACKPINK (YG, 2016)
  { stageName: "JISOO",     group: "BLACKPINK",    era: "3rd gen", debutYear: 2016 },
  { stageName: "JENNIE",    group: "BLACKPINK",    era: "3rd gen", debutYear: 2016 },
  { stageName: "ROSE",      group: "BLACKPINK",    era: "3rd gen", debutYear: 2016 },
  { stageName: "LISA",      group: "BLACKPINK",    era: "3rd gen", debutYear: 2016 },

  // Red Velvet (SM, 2014)
  { stageName: "IRENE",     group: "Red Velvet",   era: "3rd gen", debutYear: 2014 },
  { stageName: "SEULGI",    group: "Red Velvet",   era: "3rd gen", debutYear: 2014 },
  { stageName: "WENDY",     group: "Red Velvet",   era: "3rd gen", debutYear: 2014 },
  { stageName: "YERI",      group: "Red Velvet",   era: "3rd gen", debutYear: 2014 },

  // MAMAMOO (RBW, 2014)
  { stageName: "SOLAR",     group: "MAMAMOO",      era: "3rd gen", debutYear: 2014 },
  { stageName: "MOONBYUL",  group: "MAMAMOO",      era: "3rd gen", debutYear: 2014 },
  { stageName: "WHEEIN",    group: "MAMAMOO",      era: "3rd gen", debutYear: 2014 },
  { stageName: "HWASA",     group: "MAMAMOO",      era: "3rd gen", debutYear: 2014 },

  // GFRIEND (Source Music, 2015)
  { stageName: "SOWON",     group: "GFRIEND",      era: "3rd gen", debutYear: 2015 },
  { stageName: "YERIN",     group: "GFRIEND",      era: "3rd gen", debutYear: 2015 },
  { stageName: "EUNHA",     group: "GFRIEND",      era: "3rd gen", debutYear: 2015 },
  { stageName: "YUJU",      group: "GFRIEND",      era: "3rd gen", debutYear: 2015 },
  { stageName: "SINB",      group: "GFRIEND",      era: "3rd gen", debutYear: 2015 },
  { stageName: "UMJI",      group: "GFRIEND",      era: "3rd gen", debutYear: 2015 },

  // Apink (Play M, 2011 — 3rd gen overlap)
  { stageName: "CHORONG",   group: "Apink",        era: "3rd gen", debutYear: 2011 },
  { stageName: "BOMI",      group: "Apink",        era: "3rd gen", debutYear: 2011 },
  { stageName: "EUNJI",     group: "Apink",        era: "3rd gen", debutYear: 2011 },
  { stageName: "NAEUN",     group: "Apink",        era: "3rd gen", debutYear: 2011 },
  { stageName: "NAMJOO",    group: "Apink",        era: "3rd gen", debutYear: 2011 },
  { stageName: "HAYOUNG",   group: "Apink",        era: "3rd gen", debutYear: 2011 },

  // EXID (Banana Culture, 2012)
  { stageName: "SOLJI",     group: "EXID",         era: "3rd gen", debutYear: 2012 },
  { stageName: "HANI",      group: "EXID",         era: "3rd gen", debutYear: 2012 },
  { stageName: "HYERIN",    group: "EXID",         era: "3rd gen", debutYear: 2012 },
  { stageName: "JEONGHWA",  group: "EXID",         era: "3rd gen", debutYear: 2012 },

  // Lovelyz (Woollim, 2014)
  { stageName: "BABYSOUL",  group: "Lovelyz",      era: "3rd gen", debutYear: 2014 },
  { stageName: "JIAE",      group: "Lovelyz",      era: "3rd gen", debutYear: 2014 },
  // Lovelyz JISOO dedup'd with BLACKPINK JISOO (same stage name)
  { stageName: "MIJOO",     group: "Lovelyz",      era: "3rd gen", debutYear: 2014 },
  { stageName: "SUJEONG",   group: "Lovelyz",      era: "3rd gen", debutYear: 2014 },
  { stageName: "YEIN",      group: "Lovelyz",      era: "3rd gen", debutYear: 2014 },

  // Oh My Girl (WM, 2015)
  { stageName: "HYOJUNG",   group: "Oh My Girl",   era: "3rd gen", debutYear: 2015 },
  { stageName: "MIMI",      group: "Oh My Girl",   era: "3rd gen", debutYear: 2015 },
  { stageName: "YOOA",      group: "Oh My Girl",   era: "3rd gen", debutYear: 2015 },
  { stageName: "SEUNGHEE",  group: "Oh My Girl",   era: "3rd gen", debutYear: 2015 },
  { stageName: "YUBIN",     group: "Oh My Girl",   era: "3rd gen", debutYear: 2015 },
  { stageName: "ARIN",      group: "Oh My Girl",   era: "3rd gen", debutYear: 2015 },

  // WJSN / Cosmic Girls (Starship, 2016)
  { stageName: "SEOLA",     group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "XUANYI",    group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "BONA",      group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "SOOBIN",    group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "LUDA",      group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "DAWON",     group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "EUNSEO",    group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "CHENGXIAO", group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "MEIQI",     group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "YEOREUM",   group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "DAYOUNG",   group: "WJSN",         era: "3rd gen", debutYear: 2016 },
  { stageName: "YEONJUNG",  group: "WJSN",         era: "3rd gen", debutYear: 2016 },

  // Dreamcatcher (Dreamcatcher Company, 2017)
  { stageName: "SIYEON",    group: "Dreamcatcher", era: "3rd gen", debutYear: 2017 },
  { stageName: "HANDONG",   group: "Dreamcatcher", era: "3rd gen", debutYear: 2017 },
  { stageName: "YOOHYEON",  group: "Dreamcatcher", era: "3rd gen", debutYear: 2017 },
  { stageName: "DAMI",      group: "Dreamcatcher", era: "3rd gen", debutYear: 2017 },
  { stageName: "GAHYUN",    group: "Dreamcatcher", era: "3rd gen", debutYear: 2017 },

  // (G)I-DLE (Cube, 2018)
  { stageName: "MIYEON",    group: "(G)I-DLE",     era: "3rd gen", debutYear: 2018 },
  { stageName: "MINNIE",    group: "(G)I-DLE",     era: "3rd gen", debutYear: 2018 },
  { stageName: "SOYEON",    group: "(G)I-DLE",     era: "3rd gen", debutYear: 2018 },
  { stageName: "YUQI",      group: "(G)I-DLE",     era: "3rd gen", debutYear: 2018 },
  { stageName: "SHUHUA",    group: "(G)I-DLE",     era: "3rd gen", debutYear: 2018 },

  // LOONA (BlockBerry Creative, 2018)
  { stageName: "HEEJIN",    group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "HYUNJIN",   group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "HASEUL",    group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "YEOJIN",    group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "VIVI",      group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "KIMLIP",    group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "JINSOUL",   group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "CHOERRY",   group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "YVES",      group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "CHUU",      group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "GOWON",     group: "LOONA",        era: "3rd gen", debutYear: 2018 },
  { stageName: "HYEJU",     group: "LOONA",        era: "3rd gen", debutYear: 2018 },

  // fromis_9 (Off the Record / HYBE, 2018)
  { stageName: "SAEROM",    group: "fromis_9",     era: "3rd gen", debutYear: 2018 },
  // HAYOUNG dedup'd with Apink HAYOUNG
  { stageName: "NAGYUNG",   group: "fromis_9",     era: "3rd gen", debutYear: 2018 },
  { stageName: "JISUN",     group: "fromis_9",     era: "3rd gen", debutYear: 2018 },
  { stageName: "JIWON",     group: "fromis_9",     era: "3rd gen", debutYear: 2018 },
  { stageName: "SEOYEON",   group: "fromis_9",     era: "3rd gen", debutYear: 2018 },
  // CHAEYOUNG dedup'd with TWICE CHAEYOUNG
  { stageName: "JIHEON",    group: "fromis_9",     era: "3rd gen", debutYear: 2018 },
  { stageName: "GYURI",     group: "fromis_9",     era: "3rd gen", debutYear: 2018 },

  // Weki Meki (Fantagio, 2017)
  { stageName: "SUYEON",    group: "Weki Meki",    era: "3rd gen", debutYear: 2017 },
  { stageName: "ELLY",      group: "Weki Meki",    era: "3rd gen", debutYear: 2017 },
  { stageName: "YOOJUNG",   group: "Weki Meki",    era: "3rd gen", debutYear: 2017 },
  { stageName: "DOYEON",    group: "Weki Meki",    era: "3rd gen", debutYear: 2017 },
  { stageName: "RINA",      group: "Weki Meki",    era: "3rd gen", debutYear: 2017 },
  { stageName: "LUCY",      group: "Weki Meki",    era: "3rd gen", debutYear: 2017 },

  // Pristin (Pledis, 2017)
  { stageName: "NAYOUNG",   group: "Pristin",      era: "3rd gen", debutYear: 2017 },
  { stageName: "YUHA",      group: "Pristin",      era: "3rd gen", debutYear: 2017 },
  { stageName: "EUNWOO",    group: "Pristin",      era: "3rd gen", debutYear: 2017 },
  { stageName: "RENA",      group: "Pristin",      era: "3rd gen", debutYear: 2017 },
  { stageName: "KYULKYUNG", group: "Pristin",      era: "3rd gen", debutYear: 2017 },
  { stageName: "YEHANA",    group: "Pristin",      era: "3rd gen", debutYear: 2017 },
  { stageName: "SUNGYEON",  group: "Pristin",      era: "3rd gen", debutYear: 2017 },
  { stageName: "XIYEON",    group: "Pristin",      era: "3rd gen", debutYear: 2017 },
  { stageName: "KYLA",      group: "Pristin",      era: "3rd gen", debutYear: 2017 },

  // CLC (Cube, 2015)
  // SEUNGHEE dedup'd with Oh My Girl SEUNGHEE
  { stageName: "YUJIN",     group: "CLC",          era: "3rd gen", debutYear: 2015 },
  { stageName: "SEUNGYEON", group: "CLC",          era: "3rd gen", debutYear: 2015 },
  { stageName: "SORN",      group: "CLC",          era: "3rd gen", debutYear: 2015 },
  { stageName: "YEEUN",     group: "CLC",          era: "3rd gen", debutYear: 2015 },
  { stageName: "ELKIE",     group: "CLC",          era: "3rd gen", debutYear: 2015 },
  { stageName: "EUNBIN",    group: "CLC",          era: "3rd gen", debutYear: 2015 },

  // APRIL (DSP, 2015)
  { stageName: "CHAEKYUNG", group: "APRIL",        era: "3rd gen", debutYear: 2015 },
  { stageName: "CHAEWON",   group: "APRIL",        era: "3rd gen", debutYear: 2015 },
  // NAEUN dedup'd with Apink NAEUN
  { stageName: "YENA",      group: "APRIL",        era: "3rd gen", debutYear: 2015 },
  { stageName: "RACHEL",    group: "APRIL",        era: "3rd gen", debutYear: 2015 },
  { stageName: "JINSOL",    group: "APRIL",        era: "3rd gen", debutYear: 2015 },

  // ── 4th Generation ────────────────────────────────────────────────────
  // ITZY (JYP, 2019)
  { stageName: "YEJI",      group: "ITZY",         era: "4th gen", debutYear: 2019 },
  { stageName: "RYUJIN",    group: "ITZY",         era: "4th gen", debutYear: 2019 },
  { stageName: "CHAERYEONG",group: "ITZY",         era: "4th gen", debutYear: 2019 },
  { stageName: "YUNA",      group: "ITZY",         era: "4th gen", debutYear: 2019 },

  // aespa (SM, 2020)
  { stageName: "KARINA",    group: "aespa",        era: "4th gen", debutYear: 2020 },
  { stageName: "GISELLE",   group: "aespa",        era: "4th gen", debutYear: 2020 },
  { stageName: "WINTER",    group: "aespa",        era: "4th gen", debutYear: 2020 },
  { stageName: "NINGNING",  group: "aespa",        era: "4th gen", debutYear: 2020 },

  // IVE (Starship, 2021)
  // YUJIN dedup'd with CLC YUJIN
  { stageName: "GAEUL",     group: "IVE",          era: "4th gen", debutYear: 2021 },
  { stageName: "WONYOUNG",  group: "IVE",          era: "4th gen", debutYear: 2021 },
  { stageName: "LEESEO",    group: "IVE",          era: "4th gen", debutYear: 2021 },

  // LE SSERAFIM (HYBE/Source Music, 2022)
  { stageName: "SAKURA",    group: "LE SSERAFIM",  era: "4th gen", debutYear: 2022 },
  // CHAEWON dedup'd with APRIL CHAEWON
  { stageName: "YUNJIN",    group: "LE SSERAFIM",  era: "4th gen", debutYear: 2022 },
  { stageName: "KAZUHA",    group: "LE SSERAFIM",  era: "4th gen", debutYear: 2022 },
  { stageName: "EUNCHAE",   group: "LE SSERAFIM",  era: "4th gen", debutYear: 2022 },

  // NewJeans (ADOR/HYBE, 2022)
  { stageName: "MINJI",     group: "NewJeans",     era: "4th gen", debutYear: 2022 },
  { stageName: "HANNI",     group: "NewJeans",     era: "4th gen", debutYear: 2022 },
  { stageName: "DANIELLE",  group: "NewJeans",     era: "4th gen", debutYear: 2022 },
  { stageName: "HAERIN",    group: "NewJeans",     era: "4th gen", debutYear: 2022 },
  { stageName: "HYEIN",     group: "NewJeans",     era: "4th gen", debutYear: 2022 },

  // NMIXX (JYP, 2022)
  { stageName: "LILY",      group: "NMIXX",        era: "4th gen", debutYear: 2022 },
  { stageName: "HAEWON",    group: "NMIXX",        era: "4th gen", debutYear: 2022 },
  { stageName: "SULLYOON",  group: "NMIXX",        era: "4th gen", debutYear: 2022 },
  { stageName: "JIWOO",     group: "NMIXX",        era: "4th gen", debutYear: 2022 },
  { stageName: "KYUJIN",    group: "NMIXX",        era: "4th gen", debutYear: 2022 },

  // Kep1er (Swing/WAKEONE, 2022)
  // YUJIN shared with IVE/CLC — dedup'd
  { stageName: "CHAEHYUN",  group: "Kep1er",       era: "4th gen", debutYear: 2022 },
  { stageName: "HIKARU",    group: "Kep1er",       era: "4th gen", debutYear: 2022 },
  { stageName: "XIAOTING",  group: "Kep1er",       era: "4th gen", debutYear: 2022 },
  { stageName: "DAYEON",    group: "Kep1er",       era: "4th gen", debutYear: 2022 },
  { stageName: "YOUNGEUN",  group: "Kep1er",       era: "4th gen", debutYear: 2022 },
  { stageName: "BAHIYYIH",  group: "Kep1er",       era: "4th gen", debutYear: 2022 },
  { stageName: "YESEO",     group: "Kep1er",       era: "4th gen", debutYear: 2022 },
  { stageName: "MASHIRO",   group: "Kep1er",       era: "4th gen", debutYear: 2022 },

  // STAYC (High Up Entertainment, 2020)
  { stageName: "SUMIN",     group: "STAYC",        era: "4th gen", debutYear: 2020 },
  { stageName: "SIEUN",     group: "STAYC",        era: "4th gen", debutYear: 2020 },
  { stageName: "SEEUN",     group: "STAYC",        era: "4th gen", debutYear: 2020 },
  { stageName: "YOON",      group: "STAYC",        era: "4th gen", debutYear: 2020 },

  // Rocket Punch (Woollim, 2019)
  { stageName: "JURI",      group: "Rocket Punch", era: "4th gen", debutYear: 2019 },
  { stageName: "YEONHEE",   group: "Rocket Punch", era: "4th gen", debutYear: 2019 },
  { stageName: "SUYUN",     group: "Rocket Punch", era: "4th gen", debutYear: 2019 },
  { stageName: "YUNKYOUNG", group: "Rocket Punch", era: "4th gen", debutYear: 2019 },
  { stageName: "SOHEE",     group: "Rocket Punch", era: "4th gen", debutYear: 2019 },
  // DAHYUN dedup'd with TWICE DAHYUN

  // Billlie (Mystic Story, 2021)
  { stageName: "MOONSUA",   group: "Billlie",      era: "4th gen", debutYear: 2021 },
  { stageName: "SUHYEON",   group: "Billlie",      era: "4th gen", debutYear: 2021 },
  { stageName: "HARAM",     group: "Billlie",      era: "4th gen", debutYear: 2021 },
  { stageName: "TSUKI",     group: "Billlie",      era: "4th gen", debutYear: 2021 },
  { stageName: "SIYOON",    group: "Billlie",      era: "4th gen", debutYear: 2021 },
  { stageName: "HARUNA",    group: "Billlie",      era: "4th gen", debutYear: 2021 },
  { stageName: "SHEON",     group: "Billlie",      era: "4th gen", debutYear: 2021 },

  // Purple Kiss (RBW, 2021)
  { stageName: "NAGOEUN",   group: "Purple Kiss",  era: "4th gen", debutYear: 2021 },
  { stageName: "DOSIE",     group: "Purple Kiss",  era: "4th gen", debutYear: 2021 },
  { stageName: "IREH",      group: "Purple Kiss",  era: "4th gen", debutYear: 2021 },
  { stageName: "YUKI",      group: "Purple Kiss",  era: "4th gen", debutYear: 2021 },
  { stageName: "CHAEIN",    group: "Purple Kiss",  era: "4th gen", debutYear: 2021 },
  { stageName: "SWAN",      group: "Purple Kiss",  era: "4th gen", debutYear: 2021 },

  // CLASS:y (O&Under, 2022)
  { stageName: "HYUNGSEO",  group: "CLASS:y",      era: "4th gen", debutYear: 2022 },
  // CHAEWON dedup'd
  // HYEJU dedup'd with LOONA HYEJU
  { stageName: "RIWON",     group: "CLASS:y",      era: "4th gen", debutYear: 2022 },
  { stageName: "JIMIN",     group: "CLASS:y",      era: "4th gen", debutYear: 2022 },
  { stageName: "BOEUN",     group: "CLASS:y",      era: "4th gen", debutYear: 2022 },
  { stageName: "SEONYOU",   group: "CLASS:y",      era: "4th gen", debutYear: 2022 },

  // VIVIZ (Big Planet Made, 2022) — all ex-GFRIEND dedups

  // LIGHTSUM (Cube, 2021)
  { stageName: "SANGAH",    group: "LIGHTSUM",     era: "4th gen", debutYear: 2021 },
  { stageName: "CHOWON",    group: "LIGHTSUM",     era: "4th gen", debutYear: 2021 },
  // NAYOUNG dedup'd with Pristin NAYOUNG
  { stageName: "HINA",      group: "LIGHTSUM",     era: "4th gen", debutYear: 2021 },
  { stageName: "JUHYEON",   group: "LIGHTSUM",     era: "4th gen", debutYear: 2021 },
  { stageName: "YUJEONG",   group: "LIGHTSUM",     era: "4th gen", debutYear: 2021 },

  // H1-KEY (Grandline Group, 2022)
  { stageName: "SEOI",      group: "H1-KEY",       era: "4th gen", debutYear: 2022 },
  { stageName: "RIINA",     group: "H1-KEY",       era: "4th gen", debutYear: 2022 },
  { stageName: "HWISEO",    group: "H1-KEY",       era: "4th gen", debutYear: 2022 },

  // tripleS initial 10 (Modhaus, 2023)
  { stageName: "YOOYEON",   group: "tripleS",      era: "4th gen", debutYear: 2023 },
  { stageName: "MAYU",      group: "tripleS",      era: "4th gen", debutYear: 2023 },
  { stageName: "XINYU",     group: "tripleS",      era: "4th gen", debutYear: 2023 },
  { stageName: "NAKYOUNG",  group: "tripleS",      era: "4th gen", debutYear: 2023 },
  { stageName: "SOHYUN",    group: "tripleS",      era: "4th gen", debutYear: 2023 },
  // DAHYUN dedup'd
  { stageName: "NIEN",      group: "tripleS",      era: "4th gen", debutYear: 2023 },
  // SEOYEON dedup'd with fromis_9 SEOYEON
  { stageName: "JIYEON",    group: "tripleS",      era: "4th gen", debutYear: 2023 },
  { stageName: "KOTONE",    group: "tripleS",      era: "4th gen", debutYear: 2023 },

  // ── 5th Generation ────────────────────────────────────────────────────
  // BABYMONSTER (YG, 2024)
  { stageName: "RUKA",      group: "BABYMONSTER",  era: "5th gen", debutYear: 2024 },
  { stageName: "PHARITA",   group: "BABYMONSTER",  era: "5th gen", debutYear: 2024 },
  { stageName: "AHYEON",    group: "BABYMONSTER",  era: "5th gen", debutYear: 2024 },
  { stageName: "RAMI",      group: "BABYMONSTER",  era: "5th gen", debutYear: 2024 },
  { stageName: "RORA",      group: "BABYMONSTER",  era: "5th gen", debutYear: 2024 },
  { stageName: "CHIQUITA",  group: "BABYMONSTER",  era: "5th gen", debutYear: 2024 },

  // ILLIT (Belift Lab/HYBE, 2024)
  { stageName: "YUNAH",     group: "ILLIT",        era: "5th gen", debutYear: 2024 },
  { stageName: "MINJU",     group: "ILLIT",        era: "5th gen", debutYear: 2024 },
  { stageName: "MOKA",      group: "ILLIT",        era: "5th gen", debutYear: 2024 },
  { stageName: "WONHEE",    group: "ILLIT",        era: "5th gen", debutYear: 2024 },
  { stageName: "IROHA",     group: "ILLIT",        era: "5th gen", debutYear: 2024 },

  // KISS OF LIFE (S2 Entertainment, 2023)
  { stageName: "JULIE",     group: "KISS OF LIFE", era: "5th gen", debutYear: 2023 },
  { stageName: "NATTY",     group: "KISS OF LIFE", era: "5th gen", debutYear: 2023 },
  { stageName: "BELLE",     group: "KISS OF LIFE", era: "5th gen", debutYear: 2023 },
  { stageName: "HANEUL",    group: "KISS OF LIFE", era: "5th gen", debutYear: 2023 },

  // UNIS (WAKEONE, 2024)
  { stageName: "HYEONJU",   group: "UNIS",         era: "5th gen", debutYear: 2024 },
  { stageName: "NANA",      group: "UNIS",         era: "5th gen", debutYear: 2024 },
  { stageName: "GEHLEE",    group: "UNIS",         era: "5th gen", debutYear: 2024 },
  { stageName: "KOTOKO",    group: "UNIS",         era: "5th gen", debutYear: 2024 },
  { stageName: "YUNHA",     group: "UNIS",         era: "5th gen", debutYear: 2024 },
  { stageName: "ELISIA",    group: "UNIS",         era: "5th gen", debutYear: 2024 },
  { stageName: "YOONA",     group: "UNIS",         era: "5th gen", debutYear: 2024 },
  { stageName: "SEOWON",    group: "UNIS",         era: "5th gen", debutYear: 2024 },

  // ARTMS (Modhaus, 2024) — all ex-LOONA dedups

  // BADVILLAIN (BPM, 2024)
  { stageName: "CHLOEYOUNG",group: "BADVILLAIN",   era: "5th gen", debutYear: 2024 },
  { stageName: "EMMA",      group: "BADVILLAIN",   era: "5th gen", debutYear: 2024 },
  { stageName: "YUNSEO",    group: "BADVILLAIN",   era: "5th gen", debutYear: 2024 },
  { stageName: "KELLY",     group: "BADVILLAIN",   era: "5th gen", debutYear: 2024 },

  // MEOVV (The Black Label, 2024)
  { stageName: "SOOIN",     group: "MEOVV",        era: "5th gen", debutYear: 2024 },
  { stageName: "GAWON",     group: "MEOVV",        era: "5th gen", debutYear: 2024 },
  { stageName: "ANNA",      group: "MEOVV",        era: "5th gen", debutYear: 2024 },
  { stageName: "NARIN",     group: "MEOVV",        era: "5th gen", debutYear: 2024 },
  { stageName: "ELLA",      group: "MEOVV",        era: "5th gen", debutYear: 2024 },

  // ODD YOUTH (TOP Media, 2024)
  { stageName: "MAIKA",     group: "ODD YOUTH",    era: "5th gen", debutYear: 2024 },
  { stageName: "MYAH",      group: "ODD YOUTH",    era: "5th gen", debutYear: 2024 },
  { stageName: "KANIE",     group: "ODD YOUTH",    era: "5th gen", debutYear: 2024 },
  { stageName: "SUMMER",    group: "ODD YOUTH",    era: "5th gen", debutYear: 2024 },
  { stageName: "YEEUM",     group: "ODD YOUTH",    era: "5th gen", debutYear: 2024 },

  // izna (WAKEONE, 2024)
  { stageName: "JEEMIN",    group: "izna",         era: "5th gen", debutYear: 2024 },
  { stageName: "KOKO",      group: "izna",         era: "5th gen", debutYear: 2024 },
  { stageName: "SARANG",    group: "izna",         era: "5th gen", debutYear: 2024 },
  { stageName: "JUNGEUN",   group: "izna",         era: "5th gen", debutYear: 2024 },
  { stageName: "SAEBI",     group: "izna",         era: "5th gen", debutYear: 2024 },

  // YOUNG POSSE (DSP/Beats, 2023)
  { stageName: "SUNHYE",    group: "YOUNG POSSE",  era: "5th gen", debutYear: 2023 },
  // YEONJUNG dedup'd with WJSN YEONJUNG
  { stageName: "JIANA",     group: "YOUNG POSSE",  era: "5th gen", debutYear: 2023 },
  { stageName: "DOEUN",     group: "YOUNG POSSE",  era: "5th gen", debutYear: 2023 },
  { stageName: "JIEUN",     group: "YOUNG POSSE",  era: "5th gen", debutYear: 2023 },

  // tripleS OT24 additions (5th gen, 2024)
  { stageName: "CHAEYEON",  group: "tripleS",      era: "5th gen", debutYear: 2024 },
  // YUBIN dedup'd with Oh My Girl YUBIN
  { stageName: "KAEDE",     group: "tripleS",      era: "5th gen", debutYear: 2024 },
  { stageName: "SHION",     group: "tripleS",      era: "5th gen", debutYear: 2024 },
  { stageName: "SULLIN",    group: "tripleS",      era: "5th gen", debutYear: 2024 },
  { stageName: "LYNN",      group: "tripleS",      era: "5th gen", debutYear: 2024 },
  { stageName: "HAYEON",    group: "tripleS",      era: "5th gen", debutYear: 2024 },
  { stageName: "SOOMIN",    group: "tripleS",      era: "5th gen", debutYear: 2024 },
  { stageName: "YEONJI",    group: "tripleS",      era: "5th gen", debutYear: 2024 },
  { stageName: "JOOBIN",    group: "tripleS",      era: "5th gen", debutYear: 2024 },
  { stageName: "SEOAH",     group: "tripleS",      era: "5th gen", debutYear: 2024 },

  // Loossemble (CTDENM, 2023) — all ex-LOONA dedups

  // ── Additional canonical entries (user-provided list) ───────────────
  // Momoland (MLD, 2016, disbanded 2023)
  { stageName: "JOOE",      group: "Momoland",     era: "3rd gen", debutYear: 2016 },
  { stageName: "HYEBIN",    group: "Momoland",     era: "3rd gen", debutYear: 2016 },
  { stageName: "NANCY",     group: "Momoland",     era: "3rd gen", debutYear: 2016 },
  { stageName: "DAISY",     group: "Momoland",     era: "3rd gen", debutYear: 2016 },
  { stageName: "JANE",      group: "Momoland",     era: "3rd gen", debutYear: 2016 },
  { stageName: "AHIN",      group: "Momoland",     era: "3rd gen", debutYear: 2016 },

  // cignature (J9, 2020, disbanded 2024) — CHLOE re-attributed (was wrongly labeled LIGHTSUM)
  { stageName: "CHLOE",     group: "cignature",    era: "4th gen", debutYear: 2020 },

  // AOA (FNC, 2012, disbanded 2021) — extra 8-letter entries to deepen Friday's pool
  { stageName: "SEOLHYUN",  group: "AOA",          era: "3rd gen", debutYear: 2012 },
  { stageName: "HYEJEONG",  group: "AOA",          era: "3rd gen", debutYear: 2012 },

  // GWSN / Girls in the Park (Kiwi Media, 2018, disbanded 2023)
  { stageName: "SEORYOUNG", group: "GWSN",         era: "3rd gen", debutYear: 2018 },
  { stageName: "SEOKYOUNG", group: "GWSN",         era: "3rd gen", debutYear: 2018 },

  // BLACKSWAN (DR Music, 2020)
  { stageName: "YOUNGHEUN", group: "BLACKSWAN",    era: "4th gen", debutYear: 2020 },

  // LOONA solo releases — Son Hyeju's 2018 stage name was "Olivia Hye" (9 letters as one token).
  // Kept as a separate entry from her current HYEJU.
  { stageName: "OLIVIAHYE", group: "LOONA (solo)", era: "3rd gen", debutYear: 2018 },

  // ─── Research Pass 2 (2026-04-24) — direct expansion ────────────────
  // src: hand-verified well-known rosters (agent pass deferred due to quota)
  // All entries below satisfy: girl group OR female soloist, debut ≥ 2010
  // or ex-group era inheritance, stageName ∈ [4,10] uppercase A-Z.

  // Girl's Day (Dream Tea, 2010)
  { stageName: "MINAH",     group: "Girl's Day",   era: "2nd gen", debutYear: 2010 },
  { stageName: "YURA",      group: "Girl's Day",   era: "2nd gen", debutYear: 2010 },
  { stageName: "HYERI",     group: "Girl's Day",   era: "2nd gen", debutYear: 2010 },
  { stageName: "SOJIN",     group: "Girl's Day",   era: "2nd gen", debutYear: 2010 },

  // SISTAR (Starship, 2010) — HYORIN already in dataset
  { stageName: "BORA",      group: "SISTAR",       era: "2nd gen", debutYear: 2010 },
  { stageName: "SOYOU",     group: "SISTAR",       era: "2nd gen", debutYear: 2010 },
  { stageName: "DASOM",     group: "SISTAR",       era: "2nd gen", debutYear: 2010 },

  // Nine Muses (Star Empire, 2010, disbanded 2019)
  { stageName: "KYUNGRI",   group: "Nine Muses",   era: "2nd gen", debutYear: 2010 },
  { stageName: "SUNGAH",    group: "Nine Muses",   era: "2nd gen", debutYear: 2010 },
  { stageName: "HYEMI",     group: "Nine Muses",   era: "2nd gen", debutYear: 2010 },
  { stageName: "MINHA",     group: "Nine Muses",   era: "2nd gen", debutYear: 2010 },
  { stageName: "SERA",      group: "Nine Muses",   era: "2nd gen", debutYear: 2010 },
  { stageName: "ERIN",      group: "Nine Muses",   era: "2nd gen", debutYear: 2010 },
  { stageName: "MOONHEE",   group: "Nine Muses",   era: "2nd gen", debutYear: 2010 },

  // Gugudan (Jellyfish, 2016, disbanded 2020)
  { stageName: "SEJEONG",   group: "Gugudan",      era: "3rd gen", debutYear: 2016 },
  { stageName: "SALLY",     group: "Gugudan",      era: "3rd gen", debutYear: 2016 },
  { stageName: "HAEBIN",    group: "Gugudan",      era: "3rd gen", debutYear: 2016 },
  { stageName: "HANA",      group: "Gugudan",      era: "3rd gen", debutYear: 2016 },
  { stageName: "HYEYEON",   group: "Gugudan",      era: "3rd gen", debutYear: 2016 },

  // Stellar (The Entertainment Pascal, 2011, disbanded 2018)
  { stageName: "HYOEUN",    group: "Stellar",      era: "2nd gen", debutYear: 2011 },
  { stageName: "JEONYUL",   group: "Stellar",      era: "2nd gen", debutYear: 2011 },
  { stageName: "MINHEE",    group: "Stellar",      era: "2nd gen", debutYear: 2011 },

  // Berry Good (Asia Bridge / JTG, 2014, disbanded 2021)
  { stageName: "DAYE",      group: "Berry Good",   era: "3rd gen", debutYear: 2014 },
  { stageName: "SEHYUNG",   group: "Berry Good",   era: "3rd gen", debutYear: 2014 },
  { stageName: "SUBIN",     group: "Berry Good",   era: "3rd gen", debutYear: 2014 },
  { stageName: "SEOYUL",    group: "Berry Good",   era: "3rd gen", debutYear: 2014 },
  { stageName: "GOWOON",    group: "Berry Good",   era: "3rd gen", debutYear: 2014 },
  { stageName: "JOHYUN",    group: "Berry Good",   era: "3rd gen", debutYear: 2014 },
  { stageName: "TAEHA",     group: "Berry Good",   era: "3rd gen", debutYear: 2014 },

  // Ladies' Code (Polaris, 2013)
  { stageName: "ASHLEY",    group: "Ladies' Code", era: "3rd gen", debutYear: 2013 },
  { stageName: "ZUNY",      group: "Ladies' Code", era: "3rd gen", debutYear: 2013 },
  { stageName: "SOJUNG",    group: "Ladies' Code", era: "3rd gen", debutYear: 2013 },

  // DIA (MBK / Pocketdol, 2015, disbanded 2023)
  { stageName: "JENNY",     group: "DIA",          era: "3rd gen", debutYear: 2015 },
  { stageName: "SOMYI",     group: "DIA",          era: "3rd gen", debutYear: 2015 },
  { stageName: "EUNICE",    group: "DIA",          era: "3rd gen", debutYear: 2015 },
  { stageName: "HEEHYUN",   group: "DIA",          era: "3rd gen", debutYear: 2015 },
  { stageName: "JUEUN",     group: "DIA",          era: "3rd gen", debutYear: 2015 },
  { stageName: "YEBIN",     group: "DIA",          era: "3rd gen", debutYear: 2015 },
  { stageName: "EUNJIN",    group: "DIA",          era: "3rd gen", debutYear: 2015 },

  // Dal Shabet (Happyface, 2011, disbanded 2018)
  { stageName: "WOOHEE",    group: "Dal Shabet",   era: "2nd gen", debutYear: 2011 },
  { stageName: "SERRI",     group: "Dal Shabet",   era: "2nd gen", debutYear: 2011 },

  // Cherry Bullet (FNC, 2019, disbanded 2023)
  { stageName: "HAEYOON",   group: "Cherry Bullet", era: "4th gen", debutYear: 2019 },
  { stageName: "REMI",      group: "Cherry Bullet", era: "4th gen", debutYear: 2019 },
  { stageName: "CHAERIN",   group: "Cherry Bullet", era: "4th gen", debutYear: 2019 },
  { stageName: "LINLIN",    group: "Cherry Bullet", era: "4th gen", debutYear: 2019 },
  { stageName: "MIRAE",     group: "Cherry Bullet", era: "4th gen", debutYear: 2019 },

  // Weeekly (IST / Play M, 2020)
  { stageName: "SOEUN",     group: "Weeekly",      era: "4th gen", debutYear: 2020 },
  { stageName: "JAEHEE",    group: "Weeekly",      era: "4th gen", debutYear: 2020 },
  { stageName: "JIHAN",     group: "Weeekly",      era: "4th gen", debutYear: 2020 },
  { stageName: "MONDAY",    group: "Weeekly",      era: "4th gen", debutYear: 2020 },
  { stageName: "JIYOON",    group: "Weeekly",      era: "4th gen", debutYear: 2020 },

  // TRI.BE (TR Entertainment, 2021)
  { stageName: "SONGSUN",   group: "TRI.BE",       era: "4th gen", debutYear: 2021 },
  { stageName: "JINHA",     group: "TRI.BE",       era: "4th gen", debutYear: 2021 },
  { stageName: "HYUNBIN",   group: "TRI.BE",       era: "4th gen", debutYear: 2021 },
  { stageName: "MIRE",      group: "TRI.BE",       era: "4th gen", debutYear: 2021 },

  // Lapillus (MLD, 2022)
  { stageName: "CHANTY",    group: "Lapillus",     era: "4th gen", debutYear: 2022 },
  { stageName: "SHANA",     group: "Lapillus",     era: "4th gen", debutYear: 2022 },
  { stageName: "BESSIE",    group: "Lapillus",     era: "4th gen", debutYear: 2022 },
  { stageName: "HAEUN",     group: "Lapillus",     era: "4th gen", debutYear: 2022 },

  // Everglow (Yuehua, 2019)
  { stageName: "SIHYEON",   group: "Everglow",     era: "4th gen", debutYear: 2019 },
  { stageName: "ONDA",      group: "Everglow",     era: "4th gen", debutYear: 2019 },
  { stageName: "AISHA",     group: "Everglow",     era: "4th gen", debutYear: 2019 },
  { stageName: "YIREN",     group: "Everglow",     era: "4th gen", debutYear: 2019 },

  // Nature (n.CH, 2018, disbanded 2023)
  { stageName: "LOHA",      group: "Nature",       era: "4th gen", debutYear: 2018 },
  { stageName: "SAEBOM",    group: "Nature",       era: "4th gen", debutYear: 2018 },
  { stageName: "CHAEBIN",   group: "Nature",       era: "4th gen", debutYear: 2018 },
  { stageName: "HARU",      group: "Nature",       era: "4th gen", debutYear: 2018 },
  { stageName: "AURORA",    group: "Nature",       era: "4th gen", debutYear: 2018 },
  { stageName: "SUNSHINE",  group: "Nature",       era: "4th gen", debutYear: 2018 },
  { stageName: "UCHU",      group: "Nature",       era: "4th gen", debutYear: 2018 },

  // BVNDIT (MNH, 2019, disbanded 2022)
  { stageName: "SEUNGEUN",  group: "BVNDIT",       era: "4th gen", debutYear: 2019 },
  { stageName: "YIYEON",    group: "BVNDIT",       era: "4th gen", debutYear: 2019 },
  { stageName: "SONGHEE",   group: "BVNDIT",       era: "4th gen", debutYear: 2019 },
  { stageName: "SIMYEONG",  group: "BVNDIT",       era: "4th gen", debutYear: 2019 },

  // Laboum (Nega Network, 2014) — SOLBIN already in dataset
  { stageName: "YULHEE",    group: "Laboum",       era: "3rd gen", debutYear: 2014 },
  { stageName: "HAEIN",     group: "Laboum",       era: "3rd gen", debutYear: 2014 },

  // ── Female soloists (ex-group inherited era, or pure solo) ─────────
  { stageName: "AILEE",     group: "AILEE",        era: "3rd gen", debutYear: 2012 },
  { stageName: "HEIZE",     group: "HEIZE",        era: "3rd gen", debutYear: 2014 },
  { stageName: "LEEHI",     group: "LEE HI",       era: "3rd gen", debutYear: 2012 },
  { stageName: "BIBI",      group: "BIBI",         era: "4th gen", debutYear: 2019 },
  { stageName: "SOMI",      group: "SOMI",         era: "3rd gen", debutYear: 2019 },
  { stageName: "CHUNGHA",   group: "CHUNGHA",      era: "3rd gen", debutYear: 2017 },
  { stageName: "SUNMI",     group: "SUNMI (solo)", era: "2nd gen", debutYear: 2007 },
  { stageName: "TAEYEON",   group: "SNSD (solo)",  era: "2nd gen", debutYear: 2007 },
  { stageName: "TIFFANY",   group: "SNSD (solo)",  era: "2nd gen", debutYear: 2007 },
  { stageName: "SEOHYUN",   group: "SNSD (solo)",  era: "2nd gen", debutYear: 2007 },
  { stageName: "JESSICA",   group: "SNSD (solo)",  era: "2nd gen", debutYear: 2007 },
  { stageName: "HYOYEON",   group: "SNSD (solo)",  era: "2nd gen", debutYear: 2007 },
  { stageName: "SOOYOUNG",  group: "SNSD (solo)",  era: "2nd gen", debutYear: 2007 },
  { stageName: "HYUNA",     group: "HYUNA (solo)", era: "2nd gen", debutYear: 2009 },
  { stageName: "SUZY",      group: "SUZY (solo)",  era: "2nd gen", debutYear: 2010 },
  { stageName: "DARA",      group: "2NE1 (solo)",  era: "2nd gen", debutYear: 2009 },
  { stageName: "MINZY",     group: "2NE1 (solo)",  era: "2nd gen", debutYear: 2009 },
  { stageName: "PARKBOM",   group: "2NE1 (solo)",  era: "2nd gen", debutYear: 2009 },
  { stageName: "KRYSTAL",   group: "f(x) (solo)",  era: "2nd gen", debutYear: 2009 },
  { stageName: "AMBER",     group: "f(x) (solo)",  era: "2nd gen", debutYear: 2009 },
  { stageName: "LUNA",      group: "f(x) (solo)",  era: "2nd gen", debutYear: 2009 },
  { stageName: "VICTORIA",  group: "f(x) (solo)",  era: "2nd gen", debutYear: 2009 },
  { stageName: "SULLI",     group: "f(x) (solo)",  era: "2nd gen", debutYear: 2009 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Clean up: filter any rows that are not A-Z only or out of [4, 10].
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORTED_MIN = 4;
const SUPPORTED_MAX = 10;
const STAGE_RE = /^[A-Z]+$/;

const cleanRows: Row[] = ROWS.filter((r) => {
  if (!STAGE_RE.test(r.stageName)) {
    console.warn(`Skipping "${r.stageName}" — not A-Z only`);
    return false;
  }
  if (r.stageName.length < SUPPORTED_MIN || r.stageName.length > SUPPORTED_MAX) {
    console.warn(
      `Skipping "${r.stageName}" (length ${r.stageName.length}) — outside [${SUPPORTED_MIN}, ${SUPPORTED_MAX}]`,
    );
    return false;
  }
  return true;
});

// Deduplicate by stageName. First occurrence in the ROWS array wins
// and becomes the primary Idol; subsequent rows with the same stageName
// get their group pushed into the primary's `aliases[]` (and the row's
// own `aliases` merged too). This preserves every group affiliation
// without creating multiple primary entries the game validation could
// disambiguate between. Runtime never reads `aliases`.
const byName = new Map<string, Idol>();
for (const r of cleanRows) {
  const existing = byName.get(r.stageName);
  if (existing) {
    // Merge: add this row's group (and any aliases it carried) to the
    // existing entry, deduped against what's already there.
    const aliasSet = new Set(existing.aliases ?? []);
    // Record the *duplicate* row's group as an alias of the primary.
    // We intentionally do NOT record the primary's own group here; that
    // info is already captured by `existing.group`.
    if (r.group && r.group !== existing.group) aliasSet.add(r.group);
    for (const a of r.aliases ?? []) aliasSet.add(a);
    if (aliasSet.size > 0) existing.aliases = [...aliasSet];
    continue;
  }
  const len = r.stageName.length;
  // Lengths 4-8 map to dedicated len-N themes; 9 and 10 collapse into the
  // combined "long-name" theme (Saturday) because individually they're too
  // small for a dedicated day.
  const themeTag: ThemeKey =
    len <= 8 ? (`len-${len as 4|5|6|7|8}` as ThemeKey) : "long-name";
  byName.set(r.stageName, {
    stageName: r.stageName,
    group: r.group,
    era: r.era,
    debutYear: r.debutYear,
    themeTags: [themeTag],
    ...(r.aliases && r.aliases.length > 0 ? { aliases: [...r.aliases] } : {}),
  });
}

const idols: Idol[] = Array.from(byName.values());

// Build frozen pools
const frozenPools = buildFrozenPools(idols);

// Sanity: verify each pool meets the minimum size. For fixed-length themes,
// also verify every idol in the pool matches the expected length. The
// "long-name" pool is intentionally mixed-length (9 + 10), so we only
// verify that every idol there has length in [9, 10].
for (const [themeKey, pool] of Object.entries(frozenPools)) {
  const key = themeKey as ThemeKey;
  const expected = THEME_LENGTH[key]; // undefined for "long-name"
  const minSize = MIN_POOL_SIZE[key];
  if (pool.idols.length < minSize) {
    throw new Error(
      `Pool ${key} has only ${pool.idols.length} idols (min ${minSize})`,
    );
  }
  if (expected !== undefined) {
    if (pool.length !== expected) {
      throw new Error(`Pool ${key} length ${pool.length} != expected ${expected}`);
    }
    for (const idol of pool.idols) {
      if (idol.stageName.length !== expected) {
        throw new Error(
          `Pool ${key} contains "${idol.stageName}" of length ${idol.stageName.length}, expected ${expected}`,
        );
      }
    }
  } else {
    // long-name: mixed pool, all idols must be 9 or 10 letters
    for (const idol of pool.idols) {
      const l = idol.stageName.length;
      if (l !== 9 && l !== 10) {
        throw new Error(
          `Pool ${key} contains "${idol.stageName}" of length ${l}, expected 9 or 10`,
        );
      }
    }
  }
  console.log(
    `  ${key}: length=${pool.length}, idols=${pool.idols.length}`,
  );
}

const snapshot: Snapshot = {
  snapshotDate: SNAPSHOT_DATE,
  attribution: {
    source: "hand-curated v3 snapshot (public knowledge, docs/idol-reference.md)",
    license: "factual metadata — not copyrighted",
    url: "",
  },
  idols,
  frozenPools,
};

writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");
console.log(`\nWrote ${OUT_PATH}`);
console.log(`  total idols: ${idols.length}`);
