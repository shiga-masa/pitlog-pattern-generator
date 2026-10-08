/**
 * Presets for table 3-6 (main metamorphic facies). Owner: preset t3_6. Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * All 34 rows of table 3-6 have no pattern: the pattern, letter-symbol and remarks columns are blank
 * (analysis/pattern_params_t3_4-9.md "表3-6", confirmed on the original PDF p28-p29; cell SVGs hold 0 paths
 * inside the frame, index.csv has_pattern=False, n_primitives=0). Every row is therefore registered as
 * layers = [{id: 'none', archetype: 'empty'}]. Names (names.ja) are the 岩相 column text of index.csv as printed.
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:310000000', table: '3-6', code: '310000000',
    names: { ja: '広域変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r00 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:311000000', table: '3-6', code: '311000000',
    names: { ja: '造山変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r01 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:312000000', table: '3-6', code: '312000000',
    names: { ja: '埋没変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r02 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:313000000', table: '3-6', code: '313000000',
    names: { ja: '海洋底変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r03 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:320000000', table: '3-6', code: '320000000',
    names: { ja: '局所変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r04 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:321000000', table: '3-6', code: '321000000',
    names: { ja: '熱変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r05 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:321100000', table: '3-6', code: '321100000',
    names: { ja: '接触変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r06 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:321200000', table: '3-6', code: '321200000',
    names: { ja: '熱水変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r07 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:321300000', table: '3-6', code: '321300000',
    names: { ja: '高温スラブ変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r08 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:322000000', table: '3-6', code: '322000000',
    names: { ja: '変位変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r09 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:323000000', table: '3-6', code: '323000000',
    names: { ja: '衝撃変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r10 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300010000', table: '3-6', code: '300010000',
    names: { ja: '高 P/T 型変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r11 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300020000', table: '3-6', code: '300020000',
    names: { ja: '低 P/T 型変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r12 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300030000', table: '3-6', code: '300030000',
    names: { ja: '中 P/T 型変成岩' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r13 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300001000', table: '3-6', code: '300001000',
    names: { ja: 'らんせん石片岩相(青色片岩相)' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r14 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300001100', table: '3-6', code: '300001100',
    names: { ja: 'ローソン石・青色片亜岩相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r15 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300001200', table: '3-6', code: '300001200',
    names: { ja: '緑れん石・青色片岩亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r16 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300002000', table: '3-6', code: '300002000',
    names: { ja: 'エクロジャイト相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r17 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300002100', table: '3-6', code: '300002100',
    names: { ja: 'ローソン石・エクロジャイト亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r18 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300002200', table: '3-6', code: '300002200',
    names: { ja: '緑れん石・エクロジャイト亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p28 を描画して確認、セル t3_6_p028_h1_r19 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300002300', table: '3-6', code: '300002300',
    names: { ja: '藍晶石・エクロジャイト亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r00 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300002400', table: '3-6', code: '300002400',
    names: { ja: '角閃石・エクロジャイト亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r01 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300003000', table: '3-6', code: '300003000',
    names: { ja: '緑色片岩相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r02 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300004000', table: '3-6', code: '300004000',
    names: { ja: '角閃岩相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r03 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300004100', table: '3-6', code: '300004100',
    names: { ja: 'アルバイト・緑れん石・角閃岩亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r04 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300005000', table: '3-6', code: '300005000',
    names: { ja: 'グラニュライト相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r05 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300005100', table: '3-6', code: '300005100',
    names: { ja: 'ホルンブレンド・グラニュライト亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r06 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300005200', table: '3-6', code: '300005200',
    names: { ja: '輝石・グラニュライト亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r07 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300006000', table: '3-6', code: '300006000',
    names: { ja: '準緑色片岩相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r08 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300006100', table: '3-6', code: '300006100',
    names: { ja: 'パンペリー石・アクチノせん石亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r09 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300006200', table: '3-6', code: '300006200',
    names: { ja: 'ぶどう石・アクチノせん石亜相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r10 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300007000', table: '3-6', code: '300007000',
    names: { ja: '沸石相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r11 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300008000', table: '3-6', code: '300008000',
    names: { ja: '輝石ホルンフェルス相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r12 の枠内パス 0)' },
  },
  {
    schema: 'zc-pattern/1.0.0', id: 'zc:300009000', table: '3-6', code: '300009000',
    names: { ja: 'サニディナイト相' },
    layers: [{ id: 'none', archetype: 'empty' }],
    provenance: { doc: 'R2', section: '表3-6', measured: true, notes: '模様・文字記号・備考とも空欄(原 PDF p29 を描画して確認、セル t3_6_p029_h0_r13 の枠内パス 0)' },
  },
];
