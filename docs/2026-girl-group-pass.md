# 2026 girl-group research pass

Research cutoff: **2026-08-10**

This pass is deliberately narrower than the legacy Idoldle dataset. It adds **human female members of K-pop / South Korean girl groups, project girl groups, idol bands, and girl crews that officially debuted during 2026**. It does not add new soloists, male groups, co-ed groups, virtual-only acts, non-K-pop overseas groups, or groups that are still pre-debut.

The game only accepts stage names that normalize to **4-10 uppercase ASCII A-Z letters**. Spaces, underscores, and punctuation in an official stage name may be collapsed when the result is unambiguous. Names outside 4-10 letters are documented but cannot enter the puzzle pool.

## Included 2026 acts

| Act | Official debut used | Playable member names added to the curated layer | Roster source |
| --- | --- | --- | --- |
| LATENCY | 2026-01-08 | HEEYEON, ZZONE, HAEUN, SEMI | https://kprofiles.com/latency-members-profile/ |
| dodree | 2026-01-21 | NAYEONGJOO | https://kprofiles.com/dodree-members-profile/ |
| NAVILLERA | 2026-02-03 | MELODY, ENNY, SAYA, RILA, DAHLIA | https://kprofiles.com/troy-girls-members-profile/ |
| SAVVVY | 2026-02-04 | SOOHYUN, YUJIN, NAHYUN, GAYEON, JISOL, JUHYEON, AYOUNG, SUNGKYUNG, HYUNJOO, JISOO, SEON, YERIN, DAHYEON | https://kprofiles.com/savvvy-members-profile/ |
| RunawayKidsClub | 2026-02-26 | VEDA, CHIHOO, FHUU, ESEUL | https://kprofiles.com/runawaykidsclub-members-profile/ |
| AFuture | 2026-03-14 | JISOO, YOUNGEUN, YIRE, SEOYEON, MINJI | https://kprofiles.com/afuture-members-profile/ |
| S2iT | 2026-03-14 | YEONSOO, HARU, HYOBIN, SEUNGBI | https://kprofiles.com/s2it-members-profile/ |
| AWU | 2026-04-09 | LOLA, UCHAE | https://kprofiles.com/awu-members-profile/ |
| UNCHILD | 2026-04-21 | HEEKIE, YEEUN, TINA, EVON, HAEUN | https://kprofiles.com/unchild-members-profile/ |
| H//PE Princess | 2026-05-27 | COCO, YUJU, RINO, NIKO, SUJIN | https://kprofiles.com/h-pe-princess-members-profile/ |
| POISON | 2026-05-27 | WINDY, SUNNY, LUNA | https://kprofiles.com/poison-members-profile/ |
| HEART OF WOMAN / H.O.W | 2026-05-28 | JIHYUN, CHAEI, AYNE, LIRI, LIUYIN | https://kprofiles.com/heart-of-woman-members-profile/ |
| Keyveatz | 2026-06-30 | SONJUONE, NEWY, UMJIONE, KIMYUNA, KANGYESEUL | https://kprofiles.com/h1ghr-music-girls-members-profile/ |

The curated file contains **61 playable roster rows**. Several stage names collide with an existing Idoldle answer or with another 2026 group. Idoldle guesses stage names rather than person IDs, so those collisions remain one answer and the extra group affiliation is stored in `aliases`.

Examples include JISOO (BLACKPINK / SAVVVY / AFuture), HAEUN (LATENCY / UNCHILD, plus any legacy collision), YERIN, HARU, LOLA, SUNNY, LUNA, JIHYUN, and other names already present in the historical snapshot.

## Members found but not playable

These human members are inside the research scope but fail the current 4-10 letter Wordle constraint:

- SAVVVY: HYO (3)
- S2iT: SEA (3)
- AWU: DIA (3)
- UNCHILD: AKO (3)
- H//PE Princess: YSY (3), DOI (3)
- dodree: Lee Songhyun -> LEESONGHYUN (11)

They are intentionally **not** added as puzzle answers.

## Explicit exclusions / watchlist

- **SAVVVY Kiri**: AI member, excluded because this pass is human female idols only.
- **OWIS** and other virtual/AI-only acts: excluded.
- **XD:I**: sources conflict on whether an official debut has actually occurred by the cutoff; hold until a confirmed official debut can be verified.
- **Choco2**, **TUIDE**, **Girls Archives**, and other announced 2026 rookie projects still described as pre-debut at the cutoff: excluded until debut.
- **Hat:q**: described as a female R&B/vocal group rather than a K-pop idol girl group, so it is outside this pass.
- Male and co-ed 2026 debuts are outside scope.
- Thai, Filipino, Hong Kong, Japanese, and other overseas acts are outside this pass unless they are specifically promoted as a South Korean/K-pop girl group.

## Source/date notes

KProfiles' broad 2026 debut index and individual profile pages do not always agree on exact dates. Where they conflict, this pass favors the **individual group profile / current roster page** over the aggregate index. The most notable case is SAVVVY, whose individual profile gives February 4, 2026.

Keyveatz is included at June 30, 2026 because the current profile/discography identifies `OXY_GEN` as the official debut release. Earlier pre-debut activity is not treated as the debut date.

## Runtime integration

The generated `public/data/idols.json` remains the stable historical base. `src/data/idols2026.ts` is a small, fast-moving curated overlay. On load, `mergeCuratedIdols()`:

1. merges the rookie layer by stage name,
2. records colliding group affiliations in `aliases`,
3. assigns every unique rookie answer to its length-driven theme,
4. rebuilds every frozen pool deterministically, and
5. advances the effective snapshot date to `2026-08-10`.

That last step intentionally starts a new deterministic-answer epoch, matching Idoldle's existing snapshot semantics.

## Refresh policy

This file should be revisited whenever another all-female K-pop act officially debuts in 2026 or when a current 2026 roster changes. Additions should be sourced, normalized, tested against the 4-10 letter rule, and checked for stage-name collisions before merge.
