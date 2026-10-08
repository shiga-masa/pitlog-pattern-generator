/**
 * Presets for R4 (tables 5-1, 5-2: aliases of table 4 only).
 * Owner: preset-5 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section; never invent one.
 * Unmeasured values: null + provenance.measured = false. Aliases carry only head fields + aliasOf.
 * Each row is an alias of the table 4 row at the same position (analysis/t4_vs_t5_comparison.md, 171/171 match).
 * Row number n = 0-based position of the row in the table (the 行 column of that comparison).
 * Generated from index.csv (txt_* columns) by a one-off script; no coordinates or images are copied.
 * Table 5-3 (15 rows) is not included: the schema has no table 5-3 (TABLES, ID_PATTERN). See the stage-1 report.
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:0",
    "table": "5-1",
    "names": {
      "ja": "玉石"
    },
    "aliasOf": "zc:510000010",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 0 (t5_1_p067_h0_r00) = 表4-1 行 0 (t4_1_p053_h0_r00)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:1",
    "table": "5-1",
    "names": {
      "ja": "玉石混じり礫"
    },
    "aliasOf": "zc:521111000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 1 (t5_1_p067_h0_r01) = 表4-1 行 1 (t4_1_p053_h0_r01)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:2",
    "table": "5-1",
    "names": {
      "ja": "礫質土"
    },
    "aliasOf": "zc:531100000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 2 (t5_1_p067_h0_r02) = 表4-1 行 2 (t4_1_p053_h0_r02)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:3",
    "table": "5-1",
    "names": {
      "ja": "礫"
    },
    "aliasOf": "zc:531111000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 3 (t5_1_p067_h0_r03) = 表4-1 行 3 (t4_1_p053_h0_r03)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:4",
    "table": "5-1",
    "names": {
      "ja": "粗礫"
    },
    "aliasOf": "zc:531111100",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 4 (t5_1_p067_h0_r04) = 表4-1 行 4 (t4_1_p053_h0_r04)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:5",
    "table": "5-1",
    "names": {
      "ja": "中礫"
    },
    "aliasOf": "zc:531111200",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 5 (t5_1_p067_h0_r05) = 表4-1 行 5 (t4_1_p053_h0_r05)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:6",
    "table": "5-1",
    "names": {
      "ja": "細礫"
    },
    "aliasOf": "zc:531111300",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 6 (t5_1_p067_h0_r06) = 表4-1 行 6 (t4_1_p053_h0_r06)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:7",
    "table": "5-1",
    "names": {
      "ja": "砂混じり礫"
    },
    "aliasOf": "zc:531112000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 7 (t5_1_p067_h0_r07) = 表4-1 行 7 (t4_1_p053_h0_r07)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:8",
    "table": "5-1",
    "names": {
      "ja": "砂混じり粗礫"
    },
    "aliasOf": "zc:531112100",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 8 (t5_1_p067_h0_r08) = 表4-1 行 8 (t4_1_p053_h0_r08)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:9",
    "table": "5-1",
    "names": {
      "ja": "砂混じり中礫"
    },
    "aliasOf": "zc:531112200",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 9 (t5_1_p067_h0_r09) = 表4-1 行 9 (t4_1_p053_h0_r09)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:10",
    "table": "5-1",
    "names": {
      "ja": "砂混じり細礫"
    },
    "aliasOf": "zc:531112300",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 10 (t5_1_p067_h0_r10) = 表4-1 行 10 (t4_1_p053_h0_r10)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:11",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり礫"
    },
    "aliasOf": "zc:531113003",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 11 (t5_1_p067_h0_r11) = 表4-1 行 11 (t4_1_p053_h0_r11)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:12",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり礫"
    },
    "aliasOf": "zc:531113004",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 12 (t5_1_p067_h0_r12) = 表4-1 行 12 (t4_1_p053_h0_r12)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:13",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり礫"
    },
    "aliasOf": "zc:531113005",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 13 (t5_1_p067_h0_r13) = 表4-1 行 13 (t4_1_p053_h0_r13)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:14",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり礫"
    },
    "aliasOf": "zc:531113006",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 14 (t5_1_p067_h0_r14) = 表4-1 行 14 (t4_1_p053_h0_r14)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:15",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり礫"
    },
    "aliasOf": "zc:531113007",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 15 (t5_1_p067_h0_r15) = 表4-1 行 15 (t4_1_p053_h0_r15)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:16",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり礫"
    },
    "aliasOf": "zc:531113008",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 16 (t5_1_p067_h0_r16) = 表4-1 行 16 (t4_1_p053_h0_r16)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:17",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり粗礫"
    },
    "aliasOf": "zc:531113103",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 17 (t5_1_p068_h0_r00) = 表4-1 行 17 (t4_1_p054_h0_r00)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:18",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり粗礫"
    },
    "aliasOf": "zc:531113104",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 18 (t5_1_p068_h0_r01) = 表4-1 行 18 (t4_1_p054_h0_r01)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:19",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり粗礫"
    },
    "aliasOf": "zc:531113105",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 19 (t5_1_p068_h0_r02) = 表4-1 行 19 (t4_1_p054_h0_r02)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:20",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり粗礫"
    },
    "aliasOf": "zc:531113106",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 20 (t5_1_p068_h0_r03) = 表4-1 行 20 (t4_1_p054_h0_r03)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:21",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり粗礫"
    },
    "aliasOf": "zc:531113107",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 21 (t5_1_p068_h0_r04) = 表4-1 行 21 (t4_1_p054_h0_r04)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:22",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり粗礫"
    },
    "aliasOf": "zc:531113108",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 22 (t5_1_p068_h0_r05) = 表4-1 行 22 (t4_1_p054_h0_r05)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:23",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり中礫"
    },
    "aliasOf": "zc:531113203",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 23 (t5_1_p068_h0_r06) = 表4-1 行 23 (t4_1_p054_h0_r06)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:24",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり中礫"
    },
    "aliasOf": "zc:531113204",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 24 (t5_1_p068_h0_r07) = 表4-1 行 24 (t4_1_p054_h0_r07)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:25",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり中礫"
    },
    "aliasOf": "zc:531113205",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 25 (t5_1_p068_h0_r08) = 表4-1 行 25 (t4_1_p054_h0_r08)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:26",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり中礫"
    },
    "aliasOf": "zc:531113206",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 26 (t5_1_p068_h0_r09) = 表4-1 行 26 (t4_1_p054_h0_r09)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:27",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり中礫"
    },
    "aliasOf": "zc:531113207",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 27 (t5_1_p068_h0_r10) = 表4-1 行 27 (t4_1_p054_h0_r10)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:28",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり中礫"
    },
    "aliasOf": "zc:531113208",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 28 (t5_1_p068_h0_r11) = 表4-1 行 28 (t4_1_p054_h0_r11)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:29",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり細礫"
    },
    "aliasOf": "zc:531113303",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 29 (t5_1_p068_h0_r12) = 表4-1 行 29 (t4_1_p054_h0_r12)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:30",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり細礫"
    },
    "aliasOf": "zc:531113304",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 30 (t5_1_p068_h0_r13) = 表4-1 行 30 (t4_1_p054_h0_r13)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:31",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり細礫"
    },
    "aliasOf": "zc:531113305",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 31 (t5_1_p068_h0_r14) = 表4-1 行 31 (t4_1_p054_h0_r14)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:32",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり細礫"
    },
    "aliasOf": "zc:531113306",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 32 (t5_1_p068_h0_r15) = 表4-1 行 32 (t4_1_p054_h0_r15)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:33",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり細礫"
    },
    "aliasOf": "zc:531113307",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 33 (t5_1_p068_h0_r16) = 表4-1 行 33 (t4_1_p054_h0_r16)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:34",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり細礫"
    },
    "aliasOf": "zc:531113308",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 34 (t5_1_p068_h0_r17) = 表4-1 行 34 (t4_1_p054_h0_r17)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:35",
    "table": "5-1",
    "names": {
      "ja": "砂礫"
    },
    "aliasOf": "zc:531120000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 35 (t5_1_p068_h0_r18) = 表4-1 行 35 (t4_1_p054_h0_r18)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:36",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり砂礫"
    },
    "aliasOf": "zc:531120003",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 36 (t5_1_p068_h0_r19) = 表4-1 行 36 (t4_1_p054_h0_r19)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:37",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり砂礫"
    },
    "aliasOf": "zc:531120004",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 37 (t5_1_p068_h0_r20) = 表4-1 行 37 (t4_1_p054_h0_r20)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:38",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり砂礫"
    },
    "aliasOf": "zc:531120005",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 38 (t5_1_p068_h0_r21) = 表4-1 行 38 (t4_1_p054_h0_r21)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:39",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり砂礫"
    },
    "aliasOf": "zc:531120006",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 39 (t5_1_p068_h0_r22) = 表4-1 行 39 (t4_1_p054_h0_r22)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:40",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり砂礫"
    },
    "aliasOf": "zc:531120007",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 40 (t5_1_p068_h0_r23) = 表4-1 行 40 (t4_1_p054_h0_r23)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:41",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり砂礫"
    },
    "aliasOf": "zc:531120008",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 41 (t5_1_p068_h0_r24) = 表4-1 行 41 (t4_1_p054_h0_r24)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:42",
    "table": "5-1",
    "names": {
      "ja": "砂質礫"
    },
    "aliasOf": "zc:531121000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 42 (t5_1_p068_h0_r25) = 表4-1 行 42 (t4_1_p054_h0_r25)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:43",
    "table": "5-1",
    "names": {
      "ja": "砂質粗礫"
    },
    "aliasOf": "zc:531121100",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 43 (t5_1_p068_h0_r26) = 表4-1 行 43 (t4_1_p054_h0_r26)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:44",
    "table": "5-1",
    "names": {
      "ja": "砂質中礫"
    },
    "aliasOf": "zc:531121200",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 44 (t5_1_p068_h0_r27) = 表4-1 行 44 (t4_1_p054_h0_r27)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:45",
    "table": "5-1",
    "names": {
      "ja": "砂質細礫"
    },
    "aliasOf": "zc:531121300",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 45 (t5_1_p068_h0_r28) = 表4-1 行 45 (t4_1_p054_h0_r28)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:46",
    "table": "5-1",
    "names": {
      "ja": "シルト質礫"
    },
    "aliasOf": "zc:531131030",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 46 (t5_1_p068_h0_r29) = 表4-1 行 46 (t4_1_p054_h0_r29)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:47",
    "table": "5-1",
    "names": {
      "ja": "粘土質礫"
    },
    "aliasOf": "zc:531131040",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 47 (t5_1_p068_h0_r30) = 表4-1 行 47 (t4_1_p054_h0_r30)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:48",
    "table": "5-1",
    "names": {
      "ja": "有機質礫"
    },
    "aliasOf": "zc:531131050",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 48 (t5_1_p068_h0_r31) = 表4-1 行 48 (t4_1_p054_h0_r31)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:49",
    "table": "5-1",
    "names": {
      "ja": "火山灰質礫"
    },
    "aliasOf": "zc:531131060",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 49 (t5_1_p068_h0_r32) = 表4-1 行 49 (t4_1_p054_h0_r32)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:50",
    "table": "5-1",
    "names": {
      "ja": "シルト質粗礫"
    },
    "aliasOf": "zc:531131130",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 50 (t5_1_p068_h0_r33) = 表4-1 行 50 (t4_1_p054_h0_r33)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:51",
    "table": "5-1",
    "names": {
      "ja": "粘土質粗礫"
    },
    "aliasOf": "zc:531131140",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 51 (t5_1_p068_h0_r34) = 表4-1 行 51 (t4_1_p054_h0_r34)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:52",
    "table": "5-1",
    "names": {
      "ja": "有機質粗礫"
    },
    "aliasOf": "zc:531131150",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 52 (t5_1_p068_h0_r35) = 表4-1 行 52 (t4_1_p054_h0_r35)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:53",
    "table": "5-1",
    "names": {
      "ja": "火山灰質粗礫"
    },
    "aliasOf": "zc:531131160",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 53 (t5_1_p068_h0_r36) = 表4-1 行 53 (t4_1_p054_h0_r36)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:54",
    "table": "5-1",
    "names": {
      "ja": "シルト質中礫"
    },
    "aliasOf": "zc:531131230",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 54 (t5_1_p068_h0_r37) = 表4-1 行 54 (t4_1_p054_h0_r37)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:55",
    "table": "5-1",
    "names": {
      "ja": "粘土質中礫"
    },
    "aliasOf": "zc:531131240",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 55 (t5_1_p068_h0_r38) = 表4-1 行 55 (t4_1_p054_h0_r38)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:56",
    "table": "5-1",
    "names": {
      "ja": "有機質中礫"
    },
    "aliasOf": "zc:531131250",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 56 (t5_1_p068_h0_r39) = 表4-1 行 56 (t4_1_p054_h0_r39)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:57",
    "table": "5-1",
    "names": {
      "ja": "火山灰質中礫"
    },
    "aliasOf": "zc:531131260",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 57 (t5_1_p068_h0_r40) = 表4-1 行 57 (t4_1_p054_h0_r40)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:58",
    "table": "5-1",
    "names": {
      "ja": "シルト質細礫"
    },
    "aliasOf": "zc:531131330",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 58 (t5_1_p068_h0_r41) = 表4-1 行 58 (t4_1_p054_h0_r41)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:59",
    "table": "5-1",
    "names": {
      "ja": "粘土質細礫"
    },
    "aliasOf": "zc:531131340",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 59 (t5_1_p068_h0_r42) = 表4-1 行 59 (t4_1_p054_h0_r42)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:60",
    "table": "5-1",
    "names": {
      "ja": "有機質細礫"
    },
    "aliasOf": "zc:531131350",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 60 (t5_1_p068_h0_r43) = 表4-1 行 60 (t4_1_p054_h0_r43)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:61",
    "table": "5-1",
    "names": {
      "ja": "火山灰質細礫"
    },
    "aliasOf": "zc:531131360",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 61 (t5_1_p068_h0_r44) = 表4-1 行 61 (t4_1_p054_h0_r44)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:62",
    "table": "5-1",
    "names": {
      "ja": "砂質土"
    },
    "aliasOf": "zc:531200000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 62 (t5_1_p068_h0_r45) = 表4-1 行 62 (t4_1_p054_h0_r45)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:63",
    "table": "5-1",
    "names": {
      "ja": "砂"
    },
    "aliasOf": "zc:531211000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 63 (t5_1_p069_h0_r00) = 表4-1 行 63 (t4_1_p055_h0_r00)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:64",
    "table": "5-1",
    "names": {
      "ja": "粗砂"
    },
    "aliasOf": "zc:531211100",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 64 (t5_1_p069_h0_r01) = 表4-1 行 64 (t4_1_p055_h0_r01)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:65",
    "table": "5-1",
    "names": {
      "ja": "中砂"
    },
    "aliasOf": "zc:531211200",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 65 (t5_1_p069_h0_r02) = 表4-1 行 65 (t4_1_p055_h0_r02)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:66",
    "table": "5-1",
    "names": {
      "ja": "細砂"
    },
    "aliasOf": "zc:531211300",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 66 (t5_1_p069_h0_r03) = 表4-1 行 66 (t4_1_p055_h0_r03)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:67",
    "table": "5-1",
    "names": {
      "ja": "礫混じり砂"
    },
    "aliasOf": "zc:531212000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 67 (t5_1_p069_h0_r04) = 表4-1 行 67 (t4_1_p055_h0_r04)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:68",
    "table": "5-1",
    "names": {
      "ja": "礫混じり粗砂"
    },
    "aliasOf": "zc:531212100",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 68 (t5_1_p069_h0_r05) = 表4-1 行 68 (t4_1_p055_h0_r05)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:69",
    "table": "5-1",
    "names": {
      "ja": "礫混じり中砂"
    },
    "aliasOf": "zc:531212200",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 69 (t5_1_p069_h0_r06) = 表4-1 行 69 (t4_1_p055_h0_r06)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:70",
    "table": "5-1",
    "names": {
      "ja": "礫混じり細砂"
    },
    "aliasOf": "zc:531212300",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 70 (t5_1_p069_h0_r07) = 表4-1 行 70 (t4_1_p055_h0_r07)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:71",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり砂"
    },
    "aliasOf": "zc:531213003",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 71 (t5_1_p069_h0_r08) = 表4-1 行 71 (t4_1_p055_h0_r08)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:72",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり砂"
    },
    "aliasOf": "zc:531213004",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 72 (t5_1_p069_h0_r09) = 表4-1 行 72 (t4_1_p055_h0_r09)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:73",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり砂"
    },
    "aliasOf": "zc:531213005",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 73 (t5_1_p069_h0_r10) = 表4-1 行 73 (t4_1_p055_h0_r10)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:74",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり砂"
    },
    "aliasOf": "zc:531213006",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 74 (t5_1_p069_h0_r11) = 表4-1 行 74 (t4_1_p055_h0_r11)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:75",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり砂"
    },
    "aliasOf": "zc:531213007",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 75 (t5_1_p069_h0_r12) = 表4-1 行 75 (t4_1_p055_h0_r12)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:76",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり砂"
    },
    "aliasOf": "zc:531213008",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 76 (t5_1_p069_h0_r13) = 表4-1 行 76 (t4_1_p055_h0_r13)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:77",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり粗砂"
    },
    "aliasOf": "zc:531213103",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 77 (t5_1_p069_h0_r14) = 表4-1 行 77 (t4_1_p055_h0_r14)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:78",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり粗砂"
    },
    "aliasOf": "zc:531213104",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 78 (t5_1_p069_h0_r15) = 表4-1 行 78 (t4_1_p055_h0_r15)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:79",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり粗砂"
    },
    "aliasOf": "zc:531213105",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 79 (t5_1_p069_h0_r16) = 表4-1 行 79 (t4_1_p055_h0_r16)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:80",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり粗砂"
    },
    "aliasOf": "zc:531213106",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 80 (t5_1_p069_h0_r17) = 表4-1 行 80 (t4_1_p055_h0_r17)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:81",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり粗砂"
    },
    "aliasOf": "zc:531213107",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 81 (t5_1_p069_h0_r18) = 表4-1 行 81 (t4_1_p055_h0_r18)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:82",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり粗砂"
    },
    "aliasOf": "zc:531213108",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 82 (t5_1_p069_h0_r19) = 表4-1 行 82 (t4_1_p055_h0_r19)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:83",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり中砂"
    },
    "aliasOf": "zc:531213203",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 83 (t5_1_p069_h0_r20) = 表4-1 行 83 (t4_1_p055_h0_r20)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:84",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり中砂"
    },
    "aliasOf": "zc:531213204",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 84 (t5_1_p069_h0_r21) = 表4-1 行 84 (t4_1_p055_h0_r21)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:85",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり中砂"
    },
    "aliasOf": "zc:531213205",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 85 (t5_1_p069_h0_r22) = 表4-1 行 85 (t4_1_p055_h0_r22)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:86",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり中砂"
    },
    "aliasOf": "zc:531213206",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 86 (t5_1_p069_h0_r23) = 表4-1 行 86 (t4_1_p055_h0_r23)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:87",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり中砂"
    },
    "aliasOf": "zc:531213207",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 87 (t5_1_p069_h0_r24) = 表4-1 行 87 (t4_1_p055_h0_r24)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:88",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり中砂"
    },
    "aliasOf": "zc:531213208",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 88 (t5_1_p069_h0_r25) = 表4-1 行 88 (t4_1_p055_h0_r25)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:89",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり細砂"
    },
    "aliasOf": "zc:531213303",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 89 (t5_1_p069_h0_r26) = 表4-1 行 89 (t4_1_p055_h0_r26)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:90",
    "table": "5-1",
    "names": {
      "ja": "粘土混じり細砂"
    },
    "aliasOf": "zc:531213304",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 90 (t5_1_p069_h0_r27) = 表4-1 行 90 (t4_1_p055_h0_r27)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:91",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり細砂"
    },
    "aliasOf": "zc:531213305",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 91 (t5_1_p069_h0_r28) = 表4-1 行 91 (t4_1_p055_h0_r28)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:92",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり細砂"
    },
    "aliasOf": "zc:531213306",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 92 (t5_1_p069_h0_r29) = 表4-1 行 92 (t4_1_p055_h0_r29)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:93",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり細砂"
    },
    "aliasOf": "zc:531213307",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 93 (t5_1_p069_h0_r30) = 表4-1 行 93 (t4_1_p055_h0_r30)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:94",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり細砂"
    },
    "aliasOf": "zc:531213308",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 94 (t5_1_p069_h0_r31) = 表4-1 行 94 (t4_1_p055_h0_r31)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:95",
    "table": "5-1",
    "names": {
      "ja": "礫質砂"
    },
    "aliasOf": "zc:531221000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 95 (t5_1_p069_h0_r32) = 表4-1 行 95 (t4_1_p055_h0_r32)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:96",
    "table": "5-1",
    "names": {
      "ja": "礫質粗砂"
    },
    "aliasOf": "zc:531221100",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 96 (t5_1_p069_h0_r33) = 表4-1 行 96 (t4_1_p055_h0_r33)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:97",
    "table": "5-1",
    "names": {
      "ja": "礫質中砂"
    },
    "aliasOf": "zc:531221200",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 97 (t5_1_p069_h0_r34) = 表4-1 行 97 (t4_1_p055_h0_r34)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:98",
    "table": "5-1",
    "names": {
      "ja": "礫質細砂"
    },
    "aliasOf": "zc:531221300",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 98 (t5_1_p069_h0_r35) = 表4-1 行 98 (t4_1_p055_h0_r35)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:99",
    "table": "5-1",
    "names": {
      "ja": "シルト質砂"
    },
    "aliasOf": "zc:531231030",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 99 (t5_1_p069_h0_r36) = 表4-1 行 99 (t4_1_p055_h0_r36)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:100",
    "table": "5-1",
    "names": {
      "ja": "粘土質砂"
    },
    "aliasOf": "zc:531231040",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 100 (t5_1_p069_h0_r37) = 表4-1 行 100 (t4_1_p055_h0_r37)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:101",
    "table": "5-1",
    "names": {
      "ja": "有機質砂"
    },
    "aliasOf": "zc:531231050",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 101 (t5_1_p069_h0_r38) = 表4-1 行 101 (t4_1_p055_h0_r38)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:102",
    "table": "5-1",
    "names": {
      "ja": "火山灰質砂"
    },
    "aliasOf": "zc:531231060",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 102 (t5_1_p069_h0_r39) = 表4-1 行 102 (t4_1_p055_h0_r39)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:103",
    "table": "5-1",
    "names": {
      "ja": "シルト質粗砂"
    },
    "aliasOf": "zc:531231130",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 103 (t5_1_p069_h0_r40) = 表4-1 行 103 (t4_1_p055_h0_r40)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:104",
    "table": "5-1",
    "names": {
      "ja": "粘土質粗砂"
    },
    "aliasOf": "zc:531231140",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 104 (t5_1_p069_h0_r41) = 表4-1 行 104 (t4_1_p055_h0_r41)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:105",
    "table": "5-1",
    "names": {
      "ja": "有機質粗砂"
    },
    "aliasOf": "zc:531231150",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 105 (t5_1_p069_h0_r42) = 表4-1 行 105 (t4_1_p055_h0_r42)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:106",
    "table": "5-1",
    "names": {
      "ja": "火山灰質粗砂"
    },
    "aliasOf": "zc:531231160",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 106 (t5_1_p069_h0_r43) = 表4-1 行 106 (t4_1_p055_h0_r43)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:107",
    "table": "5-1",
    "names": {
      "ja": "シルト質中砂"
    },
    "aliasOf": "zc:531231230",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 107 (t5_1_p069_h0_r44) = 表4-1 行 107 (t4_1_p055_h0_r44)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:108",
    "table": "5-1",
    "names": {
      "ja": "粘土質中砂"
    },
    "aliasOf": "zc:531231240",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 108 (t5_1_p070_h0_r00) = 表4-1 行 108 (t4_1_p056_h0_r00)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:109",
    "table": "5-1",
    "names": {
      "ja": "有機質中砂"
    },
    "aliasOf": "zc:531231250",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 109 (t5_1_p070_h0_r01) = 表4-1 行 109 (t4_1_p056_h0_r01)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:110",
    "table": "5-1",
    "names": {
      "ja": "火山灰質中砂"
    },
    "aliasOf": "zc:531231260",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 110 (t5_1_p070_h0_r02) = 表4-1 行 110 (t4_1_p056_h0_r02)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:111",
    "table": "5-1",
    "names": {
      "ja": "シルト質細砂"
    },
    "aliasOf": "zc:531231330",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 111 (t5_1_p070_h0_r03) = 表4-1 行 111 (t4_1_p056_h0_r03)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:112",
    "table": "5-1",
    "names": {
      "ja": "粘土質細砂"
    },
    "aliasOf": "zc:531231340",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 112 (t5_1_p070_h0_r04) = 表4-1 行 112 (t4_1_p056_h0_r04)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:113",
    "table": "5-1",
    "names": {
      "ja": "有機質細砂"
    },
    "aliasOf": "zc:531231350",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 113 (t5_1_p070_h0_r05) = 表4-1 行 113 (t4_1_p056_h0_r05)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:114",
    "table": "5-1",
    "names": {
      "ja": "火山灰質細砂"
    },
    "aliasOf": "zc:531231360",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 114 (t5_1_p070_h0_r06) = 表4-1 行 114 (t4_1_p056_h0_r06)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:115",
    "table": "5-1",
    "names": {
      "ja": "粘性土"
    },
    "aliasOf": "zc:532100000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 115 (t5_1_p070_h0_r07) = 表4-1 行 115 (t4_1_p056_h0_r07)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:116",
    "table": "5-1",
    "names": {
      "ja": "シルト"
    },
    "aliasOf": "zc:532110000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 116 (t5_1_p070_h0_r08) = 表4-1 行 116 (t4_1_p056_h0_r08)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:117",
    "table": "5-1",
    "names": {
      "ja": "礫質シルト"
    },
    "aliasOf": "zc:532110010",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 117 (t5_1_p070_h0_r09) = 表4-1 行 117 (t4_1_p056_h0_r09)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:118",
    "table": "5-1",
    "names": {
      "ja": "砂質シルト"
    },
    "aliasOf": "zc:532110020",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 118 (t5_1_p070_h0_r10) = 表4-1 行 118 (t4_1_p056_h0_r10)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:119",
    "table": "5-1",
    "names": {
      "ja": "粘土質シルト"
    },
    "aliasOf": "zc:532110040",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 119 (t5_1_p070_h0_r11) = 表4-1 行 119 (t4_1_p056_h0_r11)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:120",
    "table": "5-1",
    "names": {
      "ja": "有機質シルト"
    },
    "aliasOf": "zc:532110050",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 120 (t5_1_p070_h0_r12) = 表4-1 行 120 (t4_1_p056_h0_r12)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:121",
    "table": "5-1",
    "names": {
      "ja": "火山灰質シルト"
    },
    "aliasOf": "zc:532110060",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 121 (t5_1_p070_h0_r13) = 表4-1 行 121 (t4_1_p056_h0_r13)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:122",
    "table": "5-1",
    "names": {
      "ja": "礫混じりシルト"
    },
    "aliasOf": "zc:532110001",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 122 (t5_1_p070_h0_r14) = 表4-1 行 122 (t4_1_p056_h0_r14)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:123",
    "table": "5-1",
    "names": {
      "ja": "砂混じりシルト"
    },
    "aliasOf": "zc:532110002",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 123 (t5_1_p070_h0_r15) = 表4-1 行 123 (t4_1_p056_h0_r15)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:124",
    "table": "5-1",
    "names": {
      "ja": "粘土混じりシルト"
    },
    "aliasOf": "zc:532110004",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 124 (t5_1_p070_h0_r16) = 表4-1 行 124 (t4_1_p056_h0_r16)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:125",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じりシルト"
    },
    "aliasOf": "zc:532110005",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 125 (t5_1_p070_h0_r17) = 表4-1 行 125 (t4_1_p056_h0_r17)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:126",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じりシルト"
    },
    "aliasOf": "zc:532110006",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 126 (t5_1_p070_h0_r18) = 表4-1 行 126 (t4_1_p056_h0_r18)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:127",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じりシルト"
    },
    "aliasOf": "zc:532110007",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 127 (t5_1_p070_h0_r19) = 表4-1 行 127 (t4_1_p056_h0_r19)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:128",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じりシルト"
    },
    "aliasOf": "zc:532110008",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 128 (t5_1_p070_h0_r20) = 表4-1 行 128 (t4_1_p056_h0_r20)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:129",
    "table": "5-1",
    "names": {
      "ja": "粘土"
    },
    "aliasOf": "zc:532120000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 129 (t5_1_p070_h0_r21) = 表4-1 行 129 (t4_1_p056_h0_r21)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:130",
    "table": "5-1",
    "names": {
      "ja": "礫質粘土"
    },
    "aliasOf": "zc:532120010",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 130 (t5_1_p070_h0_r22) = 表4-1 行 130 (t4_1_p056_h0_r22)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:131",
    "table": "5-1",
    "names": {
      "ja": "砂質粘土"
    },
    "aliasOf": "zc:532120020",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 131 (t5_1_p070_h0_r23) = 表4-1 行 131 (t4_1_p056_h0_r23)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:132",
    "table": "5-1",
    "names": {
      "ja": "シルト質粘土"
    },
    "aliasOf": "zc:532120030",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 132 (t5_1_p070_h0_r24) = 表4-1 行 132 (t4_1_p056_h0_r24)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:133",
    "table": "5-1",
    "names": {
      "ja": "有機質粘土"
    },
    "aliasOf": "zc:532120050",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 133 (t5_1_p070_h0_r25) = 表4-1 行 133 (t4_1_p056_h0_r25)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:134",
    "table": "5-1",
    "names": {
      "ja": "火山灰質粘土"
    },
    "aliasOf": "zc:532120060",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 134 (t5_1_p070_h0_r26) = 表4-1 行 134 (t4_1_p056_h0_r26)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:135",
    "table": "5-1",
    "names": {
      "ja": "礫混じり粘土"
    },
    "aliasOf": "zc:532120001",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 135 (t5_1_p070_h0_r27) = 表4-1 行 135 (t4_1_p056_h0_r27)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:136",
    "table": "5-1",
    "names": {
      "ja": "砂混じり粘土"
    },
    "aliasOf": "zc:532120002",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 136 (t5_1_p070_h0_r28) = 表4-1 行 136 (t4_1_p056_h0_r28)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:137",
    "table": "5-1",
    "names": {
      "ja": "シルト混じり粘土"
    },
    "aliasOf": "zc:532120003",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 137 (t5_1_p070_h0_r29) = 表4-1 行 137 (t4_1_p056_h0_r29)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:138",
    "table": "5-1",
    "names": {
      "ja": "腐植物混じり粘土"
    },
    "aliasOf": "zc:532120005",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 138 (t5_1_p070_h0_r30) = 表4-1 行 138 (t4_1_p056_h0_r30)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:139",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり粘土"
    },
    "aliasOf": "zc:532120006",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 139 (t5_1_p070_h0_r31) = 表4-1 行 139 (t4_1_p056_h0_r31)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:140",
    "table": "5-1",
    "names": {
      "ja": "貝殻混じり粘土"
    },
    "aliasOf": "zc:532120007",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 140 (t5_1_p070_h0_r32) = 表4-1 行 140 (t4_1_p056_h0_r32)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:141",
    "table": "5-1",
    "names": {
      "ja": "サンゴ混じり粘土"
    },
    "aliasOf": "zc:532120008",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 141 (t5_1_p070_h0_r33) = 表4-1 行 141 (t4_1_p056_h0_r33)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:142",
    "table": "5-1",
    "names": {
      "ja": "有機質土"
    },
    "aliasOf": "zc:532200000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 142 (t5_1_p070_h0_r34) = 表4-1 行 142 (t4_1_p056_h0_r34)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:143",
    "table": "5-1",
    "names": {
      "ja": "火山灰混じり有機質土"
    },
    "aliasOf": "zc:532200006",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 143 (t5_1_p070_h0_r35) = 表4-1 行 143 (t4_1_p056_h0_r35)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:144",
    "table": "5-1",
    "names": {
      "ja": "火山灰質粘性土"
    },
    "aliasOf": "zc:532300000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 144 (t5_1_p070_h0_r36) = 表4-1 行 144 (t4_1_p056_h0_r36)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:145",
    "table": "5-1",
    "names": {
      "ja": "有機質火山灰"
    },
    "aliasOf": "zc:532300050",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 145 (t5_1_p070_h0_r37) = 表4-1 行 145 (t4_1_p056_h0_r37)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:146",
    "table": "5-1",
    "names": {
      "ja": "高有機質土"
    },
    "aliasOf": "zc:533100000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 146 (t5_1_p070_h0_r38) = 表4-1 行 146 (t4_1_p056_h0_r38)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:147",
    "table": "5-1",
    "names": {
      "ja": "泥炭"
    },
    "aliasOf": "zc:533101000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 147 (t5_1_p070_h0_r39) = 表4-1 行 147 (t4_1_p056_h0_r39)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:148",
    "table": "5-1",
    "names": {
      "ja": "黒泥"
    },
    "aliasOf": "zc:533102000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 148 (t5_1_p071_h0_r00) = 表4-1 行 148 (t4_1_p057_h0_r00)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:149",
    "table": "5-1",
    "names": {
      "ja": "廃棄物"
    },
    "aliasOf": "zc:534110100",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 149 (t5_1_p071_h0_r01) = 表4-1 行 149 (t4_1_p057_h0_r01)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:150",
    "table": "5-1",
    "names": {
      "ja": "瓦礫"
    },
    "aliasOf": "zc:534110200",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 150 (t5_1_p071_h0_r02) = 表4-1 行 150 (t4_1_p057_h0_r02)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:151",
    "table": "5-1",
    "names": {
      "ja": "改良土"
    },
    "aliasOf": "zc:534120100",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 151 (t5_1_p071_h0_r03) = 表4-1 行 151 (t4_1_p057_h0_r03)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:152",
    "table": "5-1",
    "names": {
      "ja": "風化土"
    },
    "aliasOf": "zc:540110000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 152 (t5_1_p071_h0_r04) = 表4-1 行 152 (t4_1_p057_h0_r04)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:153",
    "table": "5-1",
    "names": {
      "ja": "まさ土"
    },
    "aliasOf": "zc:540111000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 153 (t5_1_p071_h0_r05) = 表4-1 行 153 (t4_1_p057_h0_r05)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:154",
    "table": "5-1",
    "names": {
      "ja": "赤色土"
    },
    "aliasOf": "zc:540112000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 154 (t5_1_p071_h0_r06) = 表4-1 行 154 (t4_1_p057_h0_r06)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:155",
    "table": "5-1",
    "names": {
      "ja": "くさり礫"
    },
    "aliasOf": "zc:540113000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 155 (t5_1_p071_h0_r07) = 表4-1 行 155 (t4_1_p057_h0_r07)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:156",
    "table": "5-1",
    "names": {
      "ja": "火山灰"
    },
    "aliasOf": "zc:540120000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 156 (t5_1_p071_h0_r08) = 表4-1 行 156 (t4_1_p057_h0_r08)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:157",
    "table": "5-1",
    "names": {
      "ja": "関東ローム"
    },
    "aliasOf": "zc:540121000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 157 (t5_1_p071_h0_r09) = 表4-1 行 157 (t4_1_p057_h0_r09)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:158",
    "table": "5-1",
    "names": {
      "ja": "黒ぼく"
    },
    "aliasOf": "zc:540122000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 158 (t5_1_p071_h0_r10) = 表4-1 行 158 (t4_1_p057_h0_r10)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:159",
    "table": "5-1",
    "names": {
      "ja": "あかほや"
    },
    "aliasOf": "zc:540123000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 159 (t5_1_p071_h0_r11) = 表4-1 行 159 (t4_1_p057_h0_r11)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:160",
    "table": "5-1",
    "names": {
      "ja": "軽石"
    },
    "aliasOf": "zc:540130000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 160 (t5_1_p071_h0_r12) = 表4-1 行 160 (t4_1_p057_h0_r12)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:161",
    "table": "5-1",
    "names": {
      "ja": "しらす"
    },
    "aliasOf": "zc:540131000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 161 (t5_1_p071_h0_r13) = 表4-1 行 161 (t4_1_p057_h0_r13)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:162",
    "table": "5-1",
    "names": {
      "ja": "ぼら"
    },
    "aliasOf": "zc:540132000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 162 (t5_1_p071_h0_r14) = 表4-1 行 162 (t4_1_p057_h0_r14)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:163",
    "table": "5-1",
    "names": {
      "ja": "鹿沼土"
    },
    "aliasOf": "zc:540133000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 163 (t5_1_p071_h0_r15) = 表4-1 行 163 (t4_1_p057_h0_r15)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-1:164",
    "table": "5-1",
    "names": {
      "ja": "スコリア"
    },
    "aliasOf": "zc:540140000",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-1 行 164 (t5_1_p071_h0_r16) = 表4-1 行 164 (t4_1_p057_h0_r16)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-2:0",
    "table": "5-2",
    "names": {
      "ja": "盛土"
    },
    "aliasOf": "zc:599200001",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-2 行 0 (t5_2_p071_h1_r00) = 表4-2 行 0 (t4_2_p057_h1_r00)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-2:1",
    "table": "5-2",
    "names": {
      "ja": "埋土"
    },
    "aliasOf": "zc:599200002",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-2 行 1 (t5_2_p071_h1_r01) = 表4-2 行 1 (t4_2_p057_h1_r01)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-2:2",
    "table": "5-2",
    "names": {
      "ja": "表土"
    },
    "aliasOf": "zc:599200003",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-2 行 2 (t5_2_p071_h1_r02) = 表4-2 行 2 (t4_2_p057_h1_r02)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-2:3",
    "table": "5-2",
    "names": {
      "ja": "崩積土"
    },
    "aliasOf": "zc:599200004",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-2 行 3 (t5_2_p071_h1_r03) = 表4-2 行 3 (t4_2_p057_h1_r03)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-2:4",
    "table": "5-2",
    "names": {
      "ja": "沖積層"
    },
    "aliasOf": "zc:999200001",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-2 行 4 (t5_2_p071_h1_r04) = 表4-2 行 4 (t4_2_p057_h1_r04)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  },
  {
    "schema": "zc-pattern/1.0.0",
    "id": "zc:t5-2:5",
    "table": "5-2",
    "names": {
      "ja": "洪積層"
    },
    "aliasOf": "zc:999200002",
    "provenance": {
      "doc": "R4",
      "section": "照合表",
      "measured": true,
      "notes": "表5-2 行 5 (t5_2_p071_h1_r05) = 表4-2 行 5 (t4_2_p057_h1_r05)。名称・コード・文字記号一致、模様 完全一致(R4)"
    }
  }
];
