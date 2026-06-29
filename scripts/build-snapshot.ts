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

const SNAPSHOT_DATE = "2026-05-02";

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

  // ─── Research Pass 3 (2026-05-01) — verified roster expansion ───────
  // Sources: Wikipedia roster tables + kprofiles.com (primary for 4th/5th gen)
  // Verified May 2026. All entries: girl group OR female soloist, A-Z stage
  // names of length ∈ [4, 10]. Dedup pass merges existing-name rows into
  // aliases[] of the primary entry (see lines 617-629).

  // ── Tier 1: User-requested ────────────────────────────────────────
  // Alice (Hunus → IOK Company, debut 2017 as ELRIS, rebranded 2022, disbanded 2024)
  // Picked one canonical name per person where rebrand changed names:
  // BELLA (ELRIS) over DOOA (Alice), HYESEONG (ELRIS) over YEONJE (Alice).
  // SOHEE dedup'd with Rocket Punch SOHEE.
  { stageName: "BELLA",     group: "Alice",         era: "3rd gen", debutYear: 2017 },
  { stageName: "KARIN",     group: "Alice",         era: "3rd gen", debutYear: 2017 },
  { stageName: "HYESEONG",  group: "Alice",         era: "3rd gen", debutYear: 2017 },
  { stageName: "YUKYUNG",   group: "Alice",         era: "3rd gen", debutYear: 2017 },
  { stageName: "CHAEJEONG", group: "Alice",         era: "3rd gen", debutYear: 2020 },

  // ── Tier 2: 2nd-gen legacy + 1st-gen heavyweights ────────────────
  // KARA (DSP Media, 2007, reunited 2022). GYURI/SEUNGYEON dedup'd.
  { stageName: "HARA",      group: "KARA",          era: "2nd gen", debutYear: 2008 },
  { stageName: "NICOLE",    group: "KARA",          era: "2nd gen", debutYear: 2008 },
  { stageName: "JIYOUNG",   group: "KARA",          era: "2nd gen", debutYear: 2008 },
  { stageName: "YOUNGJI",   group: "KARA",          era: "2nd gen", debutYear: 2014 },
  { stageName: "SUNGHEE",   group: "KARA",          era: "2nd gen", debutYear: 2007 },

  // After School (Pledis, 2009). NANA dedup'd with UNIS NANA.
  { stageName: "KAHI",      group: "After School",  era: "2nd gen", debutYear: 2009 },
  { stageName: "JUNGAH",    group: "After School",  era: "2nd gen", debutYear: 2009 },
  { stageName: "JOOYEON",   group: "After School",  era: "2nd gen", debutYear: 2009 },
  { stageName: "BEKAH",     group: "After School",  era: "2nd gen", debutYear: 2009 },
  { stageName: "SOYOUNG",   group: "After School",  era: "2nd gen", debutYear: 2009 },
  { stageName: "RAINA",     group: "After School",  era: "2nd gen", debutYear: 2009 },
  { stageName: "LIZZY",     group: "After School",  era: "2nd gen", debutYear: 2010 },
  { stageName: "EYOUNG",    group: "After School",  era: "2nd gen", debutYear: 2010 },
  { stageName: "KAEUN",     group: "After School",  era: "2nd gen", debutYear: 2012 },

  // T-ARA (MBK / Core Contents, 2009). SOYEON/JIYEON dedup'd.
  { stageName: "BORAM",     group: "T-ARA",         era: "2nd gen", debutYear: 2009 },
  { stageName: "EUNJUNG",   group: "T-ARA",         era: "2nd gen", debutYear: 2009 },
  { stageName: "HYOMIN",    group: "T-ARA",         era: "2nd gen", debutYear: 2009 },
  { stageName: "HWAYOUNG",  group: "T-ARA",         era: "2nd gen", debutYear: 2010 },
  { stageName: "AREUM",     group: "T-ARA",         era: "2nd gen", debutYear: 2012 },

  // Wonder Girls (JYP, 2007). SOHEE/HYUNA/SUNMI/YUBIN/YEEUN dedup'd.
  { stageName: "SUNYE",     group: "Wonder Girls",  era: "2nd gen", debutYear: 2007 },
  { stageName: "HYERIM",    group: "Wonder Girls",  era: "2nd gen", debutYear: 2010 },

  // 4Minute (Cube, 2009). HYUNA/JIYOON/SOHYUN dedup'd.
  { stageName: "JIHYUN",    group: "4Minute",       era: "2nd gen", debutYear: 2009 },
  { stageName: "GAYOON",    group: "4Minute",       era: "2nd gen", debutYear: 2009 },

  // SECRET (TS, 2009). HANA/JIEUN dedup'd.
  { stageName: "HYOSEONG",  group: "SECRET",        era: "2nd gen", debutYear: 2009 },
  { stageName: "SUNHWA",    group: "SECRET",        era: "2nd gen", debutYear: 2009 },

  // Brown Eyed Girls (Nega, 2006). JEA (3 letters) excluded.
  { stageName: "MIRYO",     group: "Brown Eyed Girls", era: "2nd gen", debutYear: 2006 },
  { stageName: "NARSHA",    group: "Brown Eyed Girls", era: "2nd gen", debutYear: 2006 },
  { stageName: "GAIN",      group: "Brown Eyed Girls", era: "2nd gen", debutYear: 2006 },

  // BB Girls / Brave Girls (Brave Ent, 2011, rebranded 2023). EUNJI/YUNA dedup'd.
  { stageName: "MINYOUNG",  group: "BB Girls",      era: "2nd gen", debutYear: 2016 },
  { stageName: "EUNYOUNG",  group: "BB Girls",      era: "2nd gen", debutYear: 2011 },
  { stageName: "SEOA",      group: "BB Girls",      era: "2nd gen", debutYear: 2011 },
  { stageName: "YEJIN",     group: "BB Girls",      era: "2nd gen", debutYear: 2011 },
  { stageName: "HYERAN",    group: "BB Girls",      era: "2nd gen", debutYear: 2011 },
  { stageName: "YOOJIN",    group: "BB Girls",      era: "2nd gen", debutYear: 2011 },
  { stageName: "YOUJOUNG",  group: "BB Girls",      era: "2nd gen", debutYear: 2016 },
  { stageName: "HAYUN",     group: "BB Girls",      era: "2nd gen", debutYear: 2016 },

  // Crayon Pop (Chrome, 2012). WAY (3 letters) excluded.
  { stageName: "GEUMMI",    group: "Crayon Pop",    era: "2nd gen", debutYear: 2012 },
  { stageName: "ELLIN",     group: "Crayon Pop",    era: "2nd gen", debutYear: 2012 },
  { stageName: "CHOA",      group: "Crayon Pop",    era: "2nd gen", debutYear: 2012 },
  { stageName: "SOYUL",     group: "Crayon Pop",    era: "2nd gen", debutYear: 2012 },

  // SPICA (B2M, 2012). JIWON dedup'd. BOA (3 letters) excluded.
  { stageName: "SIHYUN",    group: "SPICA",         era: "2nd gen", debutYear: 2012 },
  { stageName: "NARAE",     group: "SPICA",         era: "2nd gen", debutYear: 2012 },
  { stageName: "BOHYUNG",   group: "SPICA",         era: "2nd gen", debutYear: 2012 },

  // Hello Venus (Pledis/Fantagio, 2012). YEOREUM dedup'd.
  // Note: ALICE here is a member name — distinct from "Alice" (the group) above.
  { stageName: "ALICE",     group: "Hello Venus",   era: "3rd gen", debutYear: 2012 },
  { stageName: "NARA",      group: "Hello Venus",   era: "3rd gen", debutYear: 2012 },
  { stageName: "YOOARA",    group: "Hello Venus",   era: "3rd gen", debutYear: 2012 },
  { stageName: "YOONJO",    group: "Hello Venus",   era: "3rd gen", debutYear: 2012 },
  { stageName: "LIME",      group: "Hello Venus",   era: "3rd gen", debutYear: 2012 },
  { stageName: "YOOYOUNG",  group: "Hello Venus",   era: "3rd gen", debutYear: 2012 },
  { stageName: "SEOYOUNG",  group: "Hello Venus",   era: "3rd gen", debutYear: 2012 },

  // Davichi (Core Contents, 2008, duo)
  { stageName: "HAERI",     group: "Davichi",       era: "2nd gen", debutYear: 2008 },
  { stageName: "MINKYUNG",  group: "Davichi",       era: "2nd gen", debutYear: 2008 },

  // 1st-gen legacy + soloists. IU (2 letters), BoA (3 letters) excluded.
  { stageName: "LEEJIEUN",  group: "IU (solo)",     era: "2nd gen", debutYear: 2008 },
  { stageName: "LEEHYORI",  group: "Lee Hyori (solo)", era: "1st gen", debutYear: 2003 },
  { stageName: "HYORI",     group: "Lee Hyori (solo)", era: "1st gen", debutYear: 2003 },
  { stageName: "BADA",      group: "S.E.S",         era: "1st gen", debutYear: 1997 },
  { stageName: "EUGENE",    group: "S.E.S",         era: "1st gen", debutYear: 1997 },
  { stageName: "SHOO",      group: "S.E.S",         era: "1st gen", debutYear: 1997 },
  { stageName: "LEEJIN",    group: "Fin.K.L",       era: "1st gen", debutYear: 1998 },
  { stageName: "JOOHYUN",   group: "Fin.K.L",       era: "1st gen", debutYear: 1998 },
  { stageName: "SUNGYURI",  group: "Fin.K.L",       era: "1st gen", debutYear: 1998 },

  // ── Tier 3: 3rd-gen gaps ──────────────────────────────────────────
  // Saturday (SD Ent, 2018). YUKI/CHAEWON/HANEUL dedup'd.
  { stageName: "AYEON",     group: "Saturday",      era: "3rd gen", debutYear: 2018 },
  { stageName: "CHOHEE",    group: "Saturday",      era: "3rd gen", debutYear: 2018 },
  { stageName: "SION",      group: "Saturday",      era: "3rd gen", debutYear: 2018 },
  { stageName: "SUNHA",     group: "Saturday",      era: "3rd gen", debutYear: 2018 },
  { stageName: "JUYEON",    group: "Saturday",      era: "3rd gen", debutYear: 2018 },
  { stageName: "MINSEO",    group: "Saturday",      era: "3rd gen", debutYear: 2018 },

  // HashTag (LUK Factory, 2017). SUBIN/SOJIN dedup'd. SUA (3) excluded.
  { stageName: "HYUNJI",    group: "HashTag",       era: "3rd gen", debutYear: 2017 },
  { stageName: "DAJEONG",   group: "HashTag",       era: "3rd gen", debutYear: 2017 },
  { stageName: "SEUNGMIN",  group: "HashTag",       era: "3rd gen", debutYear: 2017 },
  { stageName: "AEJI",      group: "HashTag",       era: "3rd gen", debutYear: 2017 },

  // DreamNote (iMe Korea, 2018). SUMIN dedup'd.
  { stageName: "YOUI",      group: "DreamNote",     era: "3rd gen", debutYear: 2018 },
  { stageName: "BONI",      group: "DreamNote",     era: "3rd gen", debutYear: 2018 },
  { stageName: "LARA",      group: "DreamNote",     era: "3rd gen", debutYear: 2018 },
  { stageName: "MISO",      group: "DreamNote",     era: "3rd gen", debutYear: 2018 },
  { stageName: "EUNJO",     group: "DreamNote",     era: "3rd gen", debutYear: 2018 },
  { stageName: "HABIN",     group: "DreamNote",     era: "3rd gen", debutYear: 2018 },
  { stageName: "HANBYEOL",  group: "DreamNote",     era: "3rd gen", debutYear: 2018 },

  // AOA additions (FNC, 2012)
  { stageName: "CHANMI",    group: "AOA",           era: "3rd gen", debutYear: 2012 },
  { stageName: "YOUKYUNG",  group: "AOA",           era: "3rd gen", debutYear: 2012 },

  // ── Tier 4: 4th gen (debut 2018-2022) ─────────────────────────────
  // Cherry Bullet (FNC, 2019) — addition. YUJU/BORA/JIWON dedup'd.
  { stageName: "KOKORO",    group: "Cherry Bullet", era: "4th gen", debutYear: 2019 },

  // Pixy (ALLART, 2021). DAJEONG/ELLA dedup'd. DIA/SUA (3) excluded.
  { stageName: "RINJI",     group: "Pixy",          era: "4th gen", debutYear: 2021 },
  { stageName: "LOLA",      group: "Pixy",          era: "4th gen", debutYear: 2021 },
  { stageName: "SATBYEOL",  group: "Pixy",          era: "4th gen", debutYear: 2021 },

  // bugAboo (A Team, 2021). EUNCHAE/YOONA dedup'd. ZIN (3) excluded.
  { stageName: "RAINIE",    group: "bugAboo",       era: "4th gen", debutYear: 2021 },
  { stageName: "CYAN",      group: "bugAboo",       era: "4th gen", debutYear: 2021 },
  { stageName: "CHOYEON",   group: "bugAboo",       era: "4th gen", debutYear: 2021 },

  // Hot Issue (S2 Ent, 2021). YEWON/YEBIN dedup'd.
  { stageName: "NAHYUN",    group: "Hot Issue",     era: "4th gen", debutYear: 2021 },
  { stageName: "MAYNA",     group: "Hot Issue",     era: "4th gen", debutYear: 2021 },
  { stageName: "HYEONGSHIN", group: "Hot Issue",    era: "4th gen", debutYear: 2021 },
  { stageName: "DANA",      group: "Hot Issue",     era: "4th gen", debutYear: 2021 },
  { stageName: "DAIN",      group: "Hot Issue",     era: "4th gen", debutYear: 2021 },

  // CSR (A2Z, 2022). SIHYEON/SEOYEON/YUNA dedup'd. SUA (3) excluded.
  { stageName: "GEUMHEE",   group: "CSR",           era: "4th gen", debutYear: 2022 },
  { stageName: "YEHAM",     group: "CSR",           era: "4th gen", debutYear: 2022 },
  { stageName: "DUNA",      group: "CSR",           era: "4th gen", debutYear: 2022 },

  // mimiirose (YES IM → Pocket7, 2022). YEWON/YERIN/ANNA/HYORI dedup'd. JIA (3) excluded.
  { stageName: "YEONJAE",   group: "mimiirose",     era: "4th gen", debutYear: 2022 },
  { stageName: "YUNJU",     group: "mimiirose",     era: "4th gen", debutYear: 2022 },

  // ICHILLIN' (KM Ent, 2021). JIYOON/CHAERIN/CHOWON/SOHEE dedup'd. EJI (3) excluded.
  { stageName: "JACKIE",    group: "ICHILLIN'",     era: "4th gen", debutYear: 2021 },
  { stageName: "JOONIE",    group: "ICHILLIN'",     era: "4th gen", debutYear: 2021 },
  { stageName: "YEJU",      group: "ICHILLIN'",     era: "4th gen", debutYear: 2021 },

  // Hi-L (CCM, 2022). LEEJIN/HAYUN dedup'd.
  { stageName: "SOOJUNG",   group: "Hi-L",          era: "4th gen", debutYear: 2022 },
  { stageName: "DAKYUNG",   group: "Hi-L",          era: "4th gen", debutYear: 2022 },
  { stageName: "JOOA",      group: "Hi-L",          era: "4th gen", debutYear: 2022 },
  { stageName: "YESEUL",    group: "Hi-L",          era: "4th gen", debutYear: 2022 },

  // WOO!AH (NV → SSQ, 2020). NANA/MINSEO/LUCY dedup'd.
  { stageName: "WOOYEON",   group: "WOO!AH",        era: "4th gen", debutYear: 2020 },
  { stageName: "SORA",      group: "WOO!AH",        era: "4th gen", debutYear: 2020 },
  { stageName: "SONGYEE",   group: "WOO!AH",        era: "4th gen", debutYear: 2020 },

  // LUNARSOLAR (JPlanet, 2020, disbanded 2022)
  { stageName: "ESEO",      group: "LUNARSOLAR",    era: "4th gen", debutYear: 2020 },
  { stageName: "JIAN",      group: "LUNARSOLAR",    era: "4th gen", debutYear: 2020 },
  { stageName: "TAERYEONG", group: "LUNARSOLAR",    era: "4th gen", debutYear: 2020 },
  { stageName: "YUURI",     group: "LUNARSOLAR",    era: "4th gen", debutYear: 2020 },

  // Pink Fantasy (MyDoll, 2018, disbanded 2024). RAI/MIU (3) excluded.
  { stageName: "ARANG",     group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "MOMOKA",    group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "MIKU",      group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "HEESUN",    group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "AINI",      group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "SANGA",     group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "YUBEEN",    group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "SEEA",      group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "YECHAN",    group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "HARIN",     group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },
  { stageName: "DAEWANG",   group: "Pink Fantasy",  era: "4th gen", debutYear: 2018 },

  // (BLACKSWAN additions intentionally excluded per user — international lineup.)

  // ── Tier 5: 5th gen / recent global (debut 2023-2025) ─────────────
  // (KATSEYE and GIRLSET/VCHA intentionally excluded per user — non-Korean global groups.)

  // QWER (Tamago Production / 3Y Corp, 2023, band). HINA/SIYEON dedup'd.
  { stageName: "CHODAN",    group: "QWER",          era: "5th gen", debutYear: 2023 },
  { stageName: "MAGENTA",   group: "QWER",          era: "5th gen", debutYear: 2023 },

  // MADEIN (formerly Limelight; 143 Ent, debut 2023-02, rebranded 2024-09).
  // MASHIRO/YESEO dedup'd with Kep1er. MIU (3) excluded.
  { stageName: "SUHYE",     group: "MADEIN",        era: "5th gen", debutYear: 2023 },
  { stageName: "GAEUN",     group: "MADEIN",        era: "5th gen", debutYear: 2023 },
  { stageName: "SERINA",    group: "MADEIN",        era: "5th gen", debutYear: 2024 },
  { stageName: "NAGOMI",    group: "MADEIN",        era: "5th gen", debutYear: 2024 },

  // FIFTY FIFTY (Attrakt, debut 2022, reorganized 2024). YEWON/HANA dedup'd.
  { stageName: "KEENA",     group: "FIFTY FIFTY",   era: "4th gen", debutYear: 2022 },
  { stageName: "SAENA",     group: "FIFTY FIFTY",   era: "4th gen", debutYear: 2022 },
  { stageName: "ARAN",      group: "FIFTY FIFTY",   era: "4th gen", debutYear: 2022 },
  { stageName: "CHANELLE",  group: "FIFTY FIFTY",   era: "5th gen", debutYear: 2024 },
  { stageName: "ATHENA",    group: "FIFTY FIFTY",   era: "5th gen", debutYear: 2024 },

  // Candy Shop (Brave Ent, 2024). SARANG dedup'd with izna SARANG.
  { stageName: "SORAM",     group: "Candy Shop",    era: "5th gen", debutYear: 2024 },
  { stageName: "YUINA",     group: "Candy Shop",    era: "5th gen", debutYear: 2024 },
  { stageName: "JULIA",     group: "Candy Shop",    era: "5th gen", debutYear: 2024 },

  // SAY MY NAME (Inkode Entertainment, 2024). HITOMI is ex-AKB48/IZ*ONE.
  { stageName: "HITOMI",    group: "SAY MY NAME",   era: "5th gen", debutYear: 2024 },
  { stageName: "SHUIE",     group: "SAY MY NAME",   era: "5th gen", debutYear: 2024 },
  { stageName: "KANNY",     group: "SAY MY NAME",   era: "5th gen", debutYear: 2024 },
  { stageName: "SOHA",      group: "SAY MY NAME",   era: "5th gen", debutYear: 2024 },
  { stageName: "DOHEE",     group: "SAY MY NAME",   era: "5th gen", debutYear: 2024 },
  { stageName: "JUNHWI",    group: "SAY MY NAME",   era: "5th gen", debutYear: 2024 },
  { stageName: "SEUNGJOO",  group: "SAY MY NAME",   era: "5th gen", debutYear: 2024 },

  // Geenius (HOMe / Sure Place, 2024). SION dedup'd with Saturday SION.
  { stageName: "YEYOUNG",   group: "Geenius",       era: "5th gen", debutYear: 2024 },
  { stageName: "MIKA",      group: "Geenius",       era: "5th gen", debutYear: 2024 },
  { stageName: "ANDAMIRO",  group: "Geenius",       era: "5th gen", debutYear: 2024 },

  // BUSTERS (JTG Entertainment, 2017, disbanded 2025).
  // JISOO/CHAEYEON/MINJI/JIEUN/YESEO/SOYEON dedup'd.
  { stageName: "TAKARA",    group: "BUSTERS",       era: "3rd gen", debutYear: 2017 },
  { stageName: "MINJUNG",   group: "BUSTERS",       era: "3rd gen", debutYear: 2017 },

  // VVUP (EgoENT, 2024). SUYEON/JIYOON dedup'd. KIM (3) excluded.
  { stageName: "HYUNNY",    group: "VVUP",          era: "5th gen", debutYear: 2024 },
  { stageName: "PAAN",      group: "VVUP",          era: "5th gen", debutYear: 2024 },

  // Triple iz (cross-group project, 2024). ARIA dedup'd. EJI (3) excluded.
  { stageName: "DITA",      group: "Triple iz",     era: "4th gen", debutYear: 2024 },

  // ─── Research Pass 4 (2026-05-01) — kprofiles.com sweep ─────────────
  // Verified via direct kprofiles.com fetches.

  // Hearts2Hearts (SM, debut 2025-02-24). JIWOO/YUHA dedup'd. ANA/IAN (3) excluded.
  { stageName: "CARMEN",    group: "Hearts2Hearts", era: "5th gen", debutYear: 2025 },
  { stageName: "STELLA",    group: "Hearts2Hearts", era: "5th gen", debutYear: 2025 },
  { stageName: "JUUN",      group: "Hearts2Hearts", era: "5th gen", debutYear: 2025 },
  { stageName: "YEON",      group: "Hearts2Hearts", era: "5th gen", debutYear: 2025 },

  // Secret Number (VINE Ent, debut 2020-05-19). DITA/MINJI dedup'd. ZUU/LEA (3) excluded.
  { stageName: "NAVI",      group: "Secret Number", era: "4th gen", debutYear: 2020 },
  { stageName: "DINDA",     group: "Secret Number", era: "4th gen", debutYear: 2020 },
  { stageName: "EBIN",      group: "Secret Number", era: "4th gen", debutYear: 2020 },
  { stageName: "MINC",      group: "Secret Number", era: "4th gen", debutYear: 2020 },
  { stageName: "DENISE",    group: "Secret Number", era: "4th gen", debutYear: 2020 },
  { stageName: "JINNY",     group: "Secret Number", era: "4th gen", debutYear: 2020 },
  { stageName: "SOODAM",    group: "Secret Number", era: "4th gen", debutYear: 2020 },

  // KiiiKiii (Starship, debut 2025-02-24). SUI/KYA (3) excluded.
  { stageName: "JIYU",      group: "KiiiKiii",      era: "5th gen", debutYear: 2025 },
  { stageName: "LEESOL",    group: "KiiiKiii",      era: "5th gen", debutYear: 2025 },
  { stageName: "HAUM",      group: "KiiiKiii",      era: "5th gen", debutYear: 2025 },

  // KIIRAS (LeanBranding, debut 2025-05-29). HARIN/DOYEON dedup'd.
  { stageName: "LINGLING",  group: "KIIRAS",        era: "5th gen", debutYear: 2025 },
  { stageName: "KURUMI",    group: "KIIRAS",        era: "5th gen", debutYear: 2025 },
  { stageName: "KYLIE",     group: "KIIRAS",        era: "5th gen", debutYear: 2025 },
  { stageName: "ROAH",      group: "KIIRAS",        era: "5th gen", debutYear: 2025 },

  // ILY:1 (FCENM, debut 2022-04-04). HANA dedup'd. ARA (3) excluded.
  { stageName: "NAYU",      group: "ILY:1",         era: "4th gen", debutYear: 2022 },
  { stageName: "RONA",      group: "ILY:1",         era: "4th gen", debutYear: 2022 },
  { stageName: "RIRIKA",    group: "ILY:1",         era: "4th gen", debutYear: 2022 },
  { stageName: "ELVA",      group: "ILY:1",         era: "4th gen", debutYear: 2022 },

  // CRAXY (SAI Entertainment, debut 2020-03-03). KARIN/SWAN dedup'd.
  // Note: "WOOAH" here is a CRAXY member's stage name, distinct from the group "WOO!AH".
  { stageName: "WOOAH",     group: "CRAXY",         era: "4th gen", debutYear: 2020 },
  { stageName: "HYEJIN",    group: "CRAXY",         era: "4th gen", debutYear: 2020 },
  { stageName: "CHAEY",     group: "CRAXY",         era: "4th gen", debutYear: 2020 },

  // Rolling Quartz (Rolling Star Ent, debut 2020-12-30, all-girl band)
  { stageName: "AREM",      group: "Rolling Quartz", era: "4th gen", debutYear: 2020 },
  { stageName: "IREE",      group: "Rolling Quartz", era: "4th gen", debutYear: 2020 },
  { stageName: "YEONGEUN",  group: "Rolling Quartz", era: "4th gen", debutYear: 2020 },
  { stageName: "JAYOUNG",   group: "Rolling Quartz", era: "4th gen", debutYear: 2020 },
  { stageName: "HYUNJUNG",  group: "Rolling Quartz", era: "4th gen", debutYear: 2020 },

  // MAVE: (Metaverse Entertainment, debut 2023-01-25, virtual girl group). SIU (3) excluded.
  { stageName: "ZENA",      group: "MAVE:",         era: "4th gen", debutYear: 2023 },
  { stageName: "MARTY",     group: "MAVE:",         era: "4th gen", debutYear: 2023 },
  { stageName: "TYRA",      group: "MAVE:",         era: "4th gen", debutYear: 2023 },

  // ─── Research Pass 5 (2026-05-01) — second kprofiles sweep ──────────
  // Filtered: RAWBURN (pre-debut, excluded), EL7Z UP (project, all-dups),
  // ablume (all-dups), W!TCHX/LOVEONE/ifeye (404 — no profile page).

  // LAYSHA (S Media Ent, debut 2015-05-12). HYERI/JIAN/YUJEONG dedup'd.
  { stageName: "GOEUN",     group: "LAYSHA",        era: "3rd gen", debutYear: 2015 },
  { stageName: "CHAEJIN",   group: "LAYSHA",        era: "3rd gen", debutYear: 2015 },
  { stageName: "HADAM",     group: "LAYSHA",        era: "3rd gen", debutYear: 2015 },
  { stageName: "SEMI",      group: "LAYSHA",        era: "3rd gen", debutYear: 2015 },
  { stageName: "BITNA",     group: "LAYSHA",        era: "3rd gen", debutYear: 2015 },
  { stageName: "GAVIN",     group: "LAYSHA",        era: "3rd gen", debutYear: 2015 },

  // Baby DON'T Cry (P NATION, debut 2025-06-23). MIA (3) excluded.
  { stageName: "YIHYUN",    group: "Baby DON'T Cry", era: "5th gen", debutYear: 2025 },
  { stageName: "KUMI",      group: "Baby DON'T Cry", era: "5th gen", debutYear: 2025 },
  { stageName: "BENI",      group: "Baby DON'T Cry", era: "5th gen", debutYear: 2025 },

  // AtHeart (Titan Content, debut 2025-08-13). ARIN/AURORA/NAHYUN dedup'd.
  { stageName: "MICHI",     group: "AtHeart",       era: "5th gen", debutYear: 2025 },
  { stageName: "KATELYN",   group: "AtHeart",       era: "5th gen", debutYear: 2025 },
  { stageName: "BOME",      group: "AtHeart",       era: "5th gen", debutYear: 2025 },
  { stageName: "SEOHYEON",  group: "AtHeart",       era: "5th gen", debutYear: 2025 },

  // USPEER (MW Ent, debut 2025-06-04). ROA (3) excluded.
  { stageName: "YEWON",     group: "USPEER",        era: "5th gen", debutYear: 2025 },
  { stageName: "SOEE",      group: "USPEER",        era: "5th gen", debutYear: 2025 },
  { stageName: "SIAN",      group: "USPEER",        era: "5th gen", debutYear: 2025 },
  { stageName: "SEOYU",     group: "USPEER",        era: "5th gen", debutYear: 2025 },
  { stageName: "DAON",      group: "USPEER",        era: "5th gen", debutYear: 2025 },
  { stageName: "CHAENA",    group: "USPEER",        era: "5th gen", debutYear: 2025 },

  // JANUARY (debut 2023-08-24, ex-Yellow Bee members)
  { stageName: "RYUHEE",    group: "JANUARY",       era: "4th gen", debutYear: 2023 },
  { stageName: "ANNIE",     group: "JANUARY",       era: "4th gen", debutYear: 2023 },
  { stageName: "SOYE",      group: "JANUARY",       era: "4th gen", debutYear: 2023 },
  { stageName: "HYUNYOUNG", group: "JANUARY",       era: "4th gen", debutYear: 2023 },

  // PRIMROSE (AO Entertainment, debut 2023-01-13). RAINIE/NAHYUN/HAYUN dedup'd.
  { stageName: "RUBY",      group: "PRIMROSE",      era: "4th gen", debutYear: 2023 },
  { stageName: "YEUM",      group: "PRIMROSE",      era: "4th gen", debutYear: 2023 },

  // HANA (Artcompany SOUL, debut 2023-01-08). HAEUN/JIHYUN/JIWOO dedup'd.
  { stageName: "RIHA",      group: "HANA",          era: "4th gen", debutYear: 2023 },

  // 257 (ONSIDE Company, debut 2024-05-17)
  { stageName: "MACHO",     group: "257",           era: "5th gen", debutYear: 2024 },
  { stageName: "KUBIN",     group: "257",           era: "5th gen", debutYear: 2024 },
  { stageName: "ODIMX",     group: "257",           era: "5th gen", debutYear: 2024 },

  // ─── Research Pass 6 (2026-05-01) — third kprofiles sweep ───────────
  // Filtered: WJMK (all dups w/ WJSN+Weki Meki), W!TCHX/LOVEONE/ifeye
  // (404 — slug mismatch).

  // N-DAY (RJ Entertainment, debut 2024-01-23, duo). JOO (3) excluded.
  { stageName: "JUNI",      group: "N-DAY",         era: "5th gen", debutYear: 2024 },

  // Aesther (Charon Universe, debut 2023-07-31, virtual). KARIN/MIKA dedup'd.
  { stageName: "ARISA",     group: "Aesther",       era: "4th gen", debutYear: 2023 },
  { stageName: "ERIS",      group: "Aesther",       era: "4th gen", debutYear: 2023 },
  { stageName: "ELLIE",     group: "Aesther",       era: "4th gen", debutYear: 2023 },

  // HITGS (H Music Ent, debut 2025-04-28). HYERIN dedup'd. VV (2) excluded.
  { stageName: "SEOJIN",    group: "HITGS",         era: "5th gen", debutYear: 2025 },
  { stageName: "SEOHEE",    group: "HITGS",         era: "5th gen", debutYear: 2025 },
  { stageName: "IYOO",      group: "HITGS",         era: "5th gen", debutYear: 2025 },

  // VVS (MZMC Inc., debut 2025-04-22). JIU (3) excluded.
  { stageName: "BRITTNEY",  group: "VVS",           era: "5th gen", debutYear: 2025 },
  { stageName: "ILEE",      group: "VVS",           era: "5th gen", debutYear: 2025 },
  { stageName: "RANA",      group: "VVS",           era: "5th gen", debutYear: 2025 },
  { stageName: "LIWON",     group: "VVS",           era: "5th gen", debutYear: 2025 },
  { stageName: "LENA",      group: "VVS",           era: "5th gen", debutYear: 2025 },

  // UDTT (SW Entertainment, debut 2025-04-29). YEJIN/JESSICA dedup'd.
  { stageName: "RISAKO",    group: "UDTT",          era: "5th gen", debutYear: 2025 },
  { stageName: "CHAEHEE",   group: "UDTT",          era: "5th gen", debutYear: 2025 },
  { stageName: "HANNA",     group: "UDTT",          era: "5th gen", debutYear: 2025 },

  // BLINGONE CN (World K-pop Center / MKS2NT, debut 2025-02-13). CHLOE dedup'd.
  { stageName: "CASSIE",    group: "BLINGONE CN",   era: "5th gen", debutYear: 2025 },
  { stageName: "RANEE",     group: "BLINGONE CN",   era: "5th gen", debutYear: 2025 },
  { stageName: "KATRINA",   group: "BLINGONE CN",   era: "5th gen", debutYear: 2025 },
  { stageName: "ALLIE",     group: "BLINGONE CN",   era: "5th gen", debutYear: 2025 },

  // ─── Research Pass 7 (2026-05-01) — fourth kprofiles sweep ──────────
  // Filtered: QQQ (boy group, skip).

  // ifeye (Hi-Hat Entertainment, debut 2025-04-08, 6 members). MEU (3) excluded.
  { stageName: "HWAYEON",   group: "ifeye",         era: "5th gen", debutYear: 2025 },
  { stageName: "TAERIN",    group: "ifeye",         era: "5th gen", debutYear: 2025 },
  { stageName: "RAHEE",     group: "ifeye",         era: "5th gen", debutYear: 2025 },
  { stageName: "KASIA",     group: "ifeye",         era: "5th gen", debutYear: 2025 },
  { stageName: "SASHA",     group: "ifeye",         era: "5th gen", debutYear: 2025 },

  // SAVVVY (Midway Label, debut 2026-02-04, rotational project). HYO (3) excluded.
  { stageName: "SOOHYUN",   group: "SAVVVY",        era: "5th gen", debutYear: 2026 },
  { stageName: "GAYEON",    group: "SAVVVY",        era: "5th gen", debutYear: 2026 },
  { stageName: "JISOL",     group: "SAVVVY",        era: "5th gen", debutYear: 2026 },
  { stageName: "AYOUNG",    group: "SAVVVY",        era: "5th gen", debutYear: 2026 },
  { stageName: "SUNGKYUNG", group: "SAVVVY",        era: "5th gen", debutYear: 2026 },
  { stageName: "HYUNJOO",   group: "SAVVVY",        era: "5th gen", debutYear: 2026 },
  { stageName: "SEON",      group: "SAVVVY",        era: "5th gen", debutYear: 2026 },
  { stageName: "DAHYEON",   group: "SAVVVY",        era: "5th gen", debutYear: 2026 },
  { stageName: "KIRI",      group: "SAVVVY",        era: "5th gen", debutYear: 2026 },

  // Navillera (Troy Entertainment, debut 2026-02-03, global 4-member)
  { stageName: "MELODY",    group: "Navillera",     era: "5th gen", debutYear: 2026 },
  { stageName: "ENNY",      group: "Navillera",     era: "5th gen", debutYear: 2026 },
  { stageName: "SAYA",      group: "Navillera",     era: "5th gen", debutYear: 2026 },
  { stageName: "RILA",      group: "Navillera",     era: "5th gen", debutYear: 2026 },

  // LATENCY (Oddinary, debut 2026-01-08, project band).
  // HYUNJIN here is ex-LOONA Hyunjin (Kim Hyunjin); SEMI/HAEUN dedup'd.
  { stageName: "JEEWON",    group: "LATENCY",       era: "5th gen", debutYear: 2026 },
  { stageName: "HEEYEON",   group: "LATENCY",       era: "5th gen", debutYear: 2026 },
  { stageName: "HYUNJIN",   group: "LATENCY",       era: "5th gen", debutYear: 2026 },
  { stageName: "SEMI",      group: "LATENCY",       era: "5th gen", debutYear: 2026 },
  { stageName: "HAEUN",     group: "LATENCY",       era: "5th gen", debutYear: 2026 },

  // AFuture (4X4 CREW, debut 2026-03-14). JISOO/YOUNGEUN/SEOYEON/MINJI dedup'd.
  { stageName: "YIRE",      group: "AFuture",       era: "5th gen", debutYear: 2026 },

  // ─── Research Pass 8 (2026-05-01) — fifth kprofiles sweep ───────────
  // Filtered: KEYVITUP / S2iT / NXMERCY (boy groups), MIRROR / LIONESSES
  // (insufficient verified data), Forenia (no profile found).

  // Keyveatz (AOMG × H1GHR Music, debut 2026-04-29). YUNA/YESEUL dedup'd.
  { stageName: "JUONE",     group: "Keyveatz",      era: "5th gen", debutYear: 2026 },
  { stageName: "NEWY",      group: "Keyveatz",      era: "5th gen", debutYear: 2026 },
  { stageName: "JIONE",     group: "Keyveatz",      era: "5th gen", debutYear: 2026 },

  // UNCHILD (HighUp Entertainment, debut 2026-04-21). YEEUN/HAEUN dedup'd. AKO (3) excluded.
  { stageName: "HEEKIE",    group: "UNCHILD",       era: "5th gen", debutYear: 2026 },
  { stageName: "TINA",      group: "UNCHILD",       era: "5th gen", debutYear: 2026 },
  { stageName: "EVON",      group: "UNCHILD",       era: "5th gen", debutYear: 2026 },

  // LUVDIA (OVER.THE.WALL, debut 2023-09-17, virtual). ANI/MEI (3) excluded.
  { stageName: "DONA",      group: "LUVDIA",        era: "4th gen", debutYear: 2023 },
  { stageName: "HAYU",      group: "LUVDIA",        era: "4th gen", debutYear: 2023 },
  { stageName: "ULILI",     group: "LUVDIA",        era: "4th gen", debutYear: 2023 },

  // PUZZLE (Korean-Japanese project, 2023-11-20). CHAERIN dedup'd.
  { stageName: "SULHEE",    group: "PUZZLE",        era: "4th gen", debutYear: 2023 },
  { stageName: "HONOKA",    group: "PUZZLE",        era: "4th gen", debutYear: 2023 },
  { stageName: "MIZUKI",    group: "PUZZLE",        era: "4th gen", debutYear: 2023 },
  { stageName: "YEONSEO",   group: "PUZZLE",        era: "4th gen", debutYear: 2023 },
  { stageName: "WONY",      group: "PUZZLE",        era: "4th gen", debutYear: 2023 },
  { stageName: "ROKO",      group: "PUZZLE",        era: "4th gen", debutYear: 2023 },

  // Bunny.T (W2 Company, debut 2023-06-19). JIYOUNG dedup'd.
  { stageName: "EUNA",      group: "Bunny.T",       era: "4th gen", debutYear: 2023 },
  { stageName: "CHEONGEUM", group: "Bunny.T",       era: "4th gen", debutYear: 2023 },
  { stageName: "NINA",      group: "Bunny.T",       era: "4th gen", debutYear: 2023 },

  // DDgirls (OGAM Ent, AfreecaTV project, debut 2023-09-27). SEOHEE dedup'd.
  // E.A.ZZU/ATY/DOA/ON (≤3 or non A-Z) excluded.
  { stageName: "SINU",      group: "DDgirls",       era: "4th gen", debutYear: 2023 },
  { stageName: "JAEHWA",    group: "DDgirls",       era: "4th gen", debutYear: 2023 },
  { stageName: "JAEKONG",   group: "DDgirls",       era: "4th gen", debutYear: 2023 },
  { stageName: "LONA",      group: "DDgirls",       era: "4th gen", debutYear: 2023 },
  { stageName: "SHUCK",     group: "DDgirls",       era: "4th gen", debutYear: 2023 },
  { stageName: "SSUKTTEOK", group: "DDgirls",       era: "4th gen", debutYear: 2023 },
  { stageName: "CHAECHAE",  group: "DDgirls",       era: "4th gen", debutYear: 2023 },

  // ADYA (debut 2023-05-09, silently disbanded ~2025). SEOWON dedup'd.
  { stageName: "YEONSU",    group: "ADYA",          era: "4th gen", debutYear: 2023 },
  { stageName: "SENA",      group: "ADYA",          era: "4th gen", debutYear: 2023 },
  { stageName: "SEUNGCHAE", group: "ADYA",          era: "4th gen", debutYear: 2023 },
  { stageName: "CHAEEUN",   group: "ADYA",          era: "4th gen", debutYear: 2023 },

  // Feverse (debut 2023-05-09)
  { stageName: "MUNEO",     group: "Feverse",       era: "4th gen", debutYear: 2023 },
  { stageName: "SEORITAE",  group: "Feverse",       era: "4th gen", debutYear: 2023 },
  { stageName: "KEUANG",    group: "Feverse",       era: "4th gen", debutYear: 2023 },
  { stageName: "RIEN",      group: "Feverse",       era: "4th gen", debutYear: 2023 },
  { stageName: "SERENA",    group: "Feverse",       era: "4th gen", debutYear: 2023 },

  // ONEST (DIMA K-POP Showcase, debut 2023, disbanded post-graduation). YEJIN/NAHYUN dedup'd.
  // YU1L (contains digit) and SARA K (ambiguous) excluded.
  { stageName: "SEUNGA",    group: "ONEST",         era: "4th gen", debutYear: 2023 },
  { stageName: "NABI",      group: "ONEST",         era: "4th gen", debutYear: 2023 },
  { stageName: "DAYUN",     group: "ONEST",         era: "4th gen", debutYear: 2023 },
  { stageName: "HWANHEE",   group: "ONEST",         era: "4th gen", debutYear: 2023 },
  { stageName: "TAEHEE",    group: "ONEST",         era: "4th gen", debutYear: 2023 },

  // ─── Research Pass 9 (2026-05-01) — sixth kprofiles sweep ───────────
  // Filtered: HAWW / Libelante (boy groups), Chuurry (solo), LIONESSES /
  // Closer / SOOPIA / For The More (insufficient verified info).

  // JUJU SECRET (Hangout with Yoo project, debut 2023-03-25, duo). MIJOO dedup'd.
  { stageName: "JINJOO",    group: "JUJU SECRET",   era: "4th gen", debutYear: 2023 },

  // LA FLOR (debut 2023-03-13)
  { stageName: "NAYEONG",   group: "LA FLOR",       era: "4th gen", debutYear: 2023 },
  { stageName: "YIRYANG",   group: "LA FLOR",       era: "4th gen", debutYear: 2023 },

  // Kandis (60DGRS, debut 2023-08-27, full lineup 2025-01-14, 4 members)
  { stageName: "HELLO",     group: "Kandis",        era: "4th gen", debutYear: 2023 },
  { stageName: "NINE",      group: "Kandis",        era: "4th gen", debutYear: 2023 },
  { stageName: "VENNY",     group: "Kandis",        era: "4th gen", debutYear: 2023 },
  { stageName: "LOOKY",     group: "Kandis",        era: "4th gen", debutYear: 2023 },

  // Blossom (Rainbow E&M / FUTURE IDOL, debut 2023-07-21, 9 members).
  // SOHYUN/SUHYEON/JIMIN/SERA/JIEUN dedup'd. SUHYEON.A (period) excluded.
  { stageName: "NAGYEONG",  group: "Blossom",       era: "4th gen", debutYear: 2023 },
  { stageName: "MINJEONG",  group: "Blossom",       era: "4th gen", debutYear: 2023 },
  { stageName: "HUIJU",     group: "Blossom",       era: "4th gen", debutYear: 2023 },

  // Lucid (Rainbow E&M / Future Idol Asia, debut 2023-07-07, 10-member project).
  // CHAEIN/SEEUN/SEOLA/MIYEON dedup'd.
  { stageName: "HAEJU",     group: "Lucid",         era: "4th gen", debutYear: 2023 },
  { stageName: "JAEYEONG",  group: "Lucid",         era: "4th gen", debutYear: 2023 },
  { stageName: "EUNYUL",    group: "Lucid",         era: "4th gen", debutYear: 2023 },
  { stageName: "HANGYEOL",  group: "Lucid",         era: "4th gen", debutYear: 2023 },
  { stageName: "RUMI",      group: "Lucid",         era: "4th gen", debutYear: 2023 },
  { stageName: "MINCHAE",   group: "Lucid",         era: "4th gen", debutYear: 2023 },

  // ─── Research Pass 10 (2026-05-01) — seventh kprofiles sweep ────────
  // Filtered: WEUS Girl / SOE (pre-debut), XODIAC / ONE TOP / APACE /
  // HEARTSTEEL / LUN8 / Hi-Fi Un!corn / N.TOP / KEYVITUP / S2iT / NXMERCY
  // / QQQ (boy groups), BABYS / Closer / Peony / N-ID / CMDM / MIRROR /
  // Forenia / e:lfin / Hi-L (insufficient verified info or dup-only).

  // ikling (CodeM Entertainment, debut 2023-04-28, project; 2024 relaunch lineup).
  // YERIN dedup'd.
  { stageName: "HAEON",     group: "ikling",        era: "4th gen", debutYear: 2023 },
  { stageName: "CINDY",     group: "ikling",        era: "4th gen", debutYear: 2023 },
  { stageName: "SEOLHEE",   group: "ikling",        era: "4th gen", debutYear: 2023 },

  // eite (EVA Entertainment Korea, debut 2023-11-03, Season 1 ended 2024-08).
  // RENA/YUJIN/CHAEHYUN dedup'd. ARI/REO/SIA (3) excluded.
  { stageName: "YUISA",     group: "eite",          era: "4th gen", debutYear: 2023 },

  // ─── Research Pass 11 (2026-05-01) — eighth kprofiles sweep ─────────
  // Filtered: Lionesses (boy group, skip).

  // W!TCHX (Inmedia × Artform Entertainment, debut 2024-11-06). MEW (3) excluded.
  { stageName: "LUCIA",     group: "W!TCHX",        era: "5th gen", debutYear: 2024 },
  { stageName: "MAGO",      group: "W!TCHX",        era: "5th gen", debutYear: 2024 },
  { stageName: "MARI",      group: "W!TCHX",        era: "5th gen", debutYear: 2024 },
  { stageName: "NIAA",      group: "W!TCHX",        era: "5th gen", debutYear: 2024 },

  // LOVEONE (CMG Stars, debut 2024-11-22). AYEON/YUNA dedup'd.
  { stageName: "YOUSOM",    group: "LOVEONE",       era: "5th gen", debutYear: 2024 },
  { stageName: "YUME",      group: "LOVEONE",       era: "5th gen", debutYear: 2024 },
  { stageName: "CHAEI",     group: "LOVEONE",       era: "5th gen", debutYear: 2024 },

  // ─── Research Pass 12 (2026-05-01) — ninth kprofiles sweep ──────────
  // Filtered: MIRAE (boy group, skip), Secret School (Japanese, skip),
  // ON1 ROOKIES (pre-debut, members re-debuted in Burvey).

  // 3YE (GH Entertainment, debut 2019-05-21, disbanded 2024-11-14). HAEUN dedup'd.
  { stageName: "YUJI",      group: "3YE",           era: "4th gen", debutYear: 2019 },
  { stageName: "YURIM",     group: "3YE",           era: "4th gen", debutYear: 2019 },

  // Burvey (On1 Entertainment, debut 2025-04-24, ex-ON1 Rookies). JUA (3) excluded.
  { stageName: "YOUYI",     group: "Burvey",        era: "5th gen", debutYear: 2025 },
  { stageName: "JUHA",      group: "Burvey",        era: "5th gen", debutYear: 2025 },
  { stageName: "SEOYUN",    group: "Burvey",        era: "5th gen", debutYear: 2025 },

  // Hi Cutie (Space Music, 2022). CHAERIN/YUJIN dedup'd.
  { stageName: "YUNJEONG",  group: "Hi Cutie",      era: "4th gen", debutYear: 2022 },

  // ─── LOONA sub-units / successor groups (alias-only attribution) ────
  // These rows duplicate existing LOONA stageNames so the dedup pass
  // appends the sub-unit / successor group to each idol's aliases[].
  // Pure metadata — no new pool entries.

  // ARTMS (Modhaus, debut 2024-05-30, ex-LOONA)
  { stageName: "HEEJIN",    group: "ARTMS",         era: "5th gen", debutYear: 2024 },
  { stageName: "HASEUL",    group: "ARTMS",         era: "5th gen", debutYear: 2024 },
  { stageName: "KIMLIP",    group: "ARTMS",         era: "5th gen", debutYear: 2024 },
  { stageName: "JINSOUL",   group: "ARTMS",         era: "5th gen", debutYear: 2024 },
  { stageName: "CHOERRY",   group: "ARTMS",         era: "5th gen", debutYear: 2024 },

  // LOOSSEMBLE (CTDENM, debut 2023-09-15, ex-LOONA)
  { stageName: "HYUNJIN",   group: "LOOSSEMBLE",    era: "5th gen", debutYear: 2023 },
  { stageName: "YEOJIN",    group: "LOOSSEMBLE",    era: "5th gen", debutYear: 2023 },
  { stageName: "VIVI",      group: "LOOSSEMBLE",    era: "5th gen", debutYear: 2023 },
  { stageName: "GOWON",     group: "LOOSSEMBLE",    era: "5th gen", debutYear: 2023 },
  { stageName: "HYEJU",     group: "LOOSSEMBLE",    era: "5th gen", debutYear: 2023 },

  // ODD EYE CIRCLE (Modhaus sub-unit of ARTMS, reformed 2023, ex-LOONA)
  { stageName: "KIMLIP",    group: "ODD EYE CIRCLE", era: "5th gen", debutYear: 2017 },
  { stageName: "JINSOUL",   group: "ODD EYE CIRCLE", era: "5th gen", debutYear: 2017 },
  { stageName: "CHOERRY",   group: "ODD EYE CIRCLE", era: "5th gen", debutYear: 2017 },
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
