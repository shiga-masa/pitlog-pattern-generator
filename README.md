# 柱状図模様ジェネレータ(borehole-pattern-web)

ボーリング柱状図の図模様(岩盤・土質の地紋)を、パラメータから SVG と PNG で生成する JavaScript モジュールと、それをブラウザだけで使う静的サイトです。

- 依存ライブラリなし、ビルド不要の ES モジュール。GitHub Pages にそのまま置けます。
- すべての模様は「型(格子・ハッチ・波線・散布など)+ モチーフ + 数値パラメータ」で定義され、密度・寸法・色などを引数で変えられます。
- 出力形式は SVG と PNG です。

> **開発状況**: 段階 0(型・規約・骨組み)まで。各型の描画、プリセット、PNG 出力、画面は未実装で、呼ぶと `NotImplementedError` を投げます。実装規約は [docs/CONVENTIONS.md](docs/CONVENTIONS.md) にあります。

## 使い方(予定の API)

```js
import { renderSVG, listPresets, resolveId, getPreset, validateSpec } from './src/index.js';

const { svg, meta } = await renderSVG('zc:111101002', {
  density: 1.5,                       // ピッチと図形を 1/1.5 に(線幅は pt 固定)
  size: { width: 20, height: 10, unit: 'mm' },
  ink: '#000000', paper: '#ffffff',   // 模様に使える色は この 2 色だけ
  seed: 7,
});
console.log(meta.counts, meta.warnings);
```

| 関数 | 戻り値 | 用途 |
|---|---|---|
| `renderSVG(idOrSpec, options)` | `Promise<{svg, meta}>` | SVG 文字列と件数・警告 |
| `renderBatch(inputs, options)` | `Promise<{results, counts}>` | 一括生成。`counts = {processed, skipped, failed}` |
| `renderSVGPattern(idOrSpec, options)` | `Promise<{defs, ref, tile}>` | 継ぎ目なしの SVG `<pattern>` |
| `renderCanvas(ctx, idOrSpec, options, rect)` | `Promise` | Canvas に描画 |
| `renderPNG(idOrSpec, options)` | `Promise<Blob>` | PNG |
| `getPreset(query)` | spec | 既定値の閲覧(別名は参照先に解決) |
| `resolveId(query)` | 正規 ID | `zc:` ID、9 桁コード、`sym:<記号>`、日本語名から解決。複数該当はエラー |
| `listPresets({table, archetype, text})` | 一覧 | 選択 UI 用 |
| `definePreset(spec)` / `validateSpec(spec)` | 登録 / `{ok, errors, warnings}` | 利用者定義の模様 |
| `toSpec(query, options)` | 解決済み spec | 設定の共有・再現 |

主な options: `density`(既定 1)、`motifScale`、`strokeScale`、`size`(pt/mm/px)、`dpi`、`tileMode`(frame/period/fit)、`ink` / `paper`(`'#rrggbb'`)、`ground`(paper/none)、`seed`、`overrides`(JSON Pointer → 値)。未知のキーや 3 色目の指定はエラーになり、理由と候補が返ります。

## テスト

```sh
npm test        # = node --test "test/**/*.test.js"(Node 22 以上、依存なし)
```

## 出典と原本との関係

- 模様の種類・名称・コード・記号は、全国地質調査業協会連合会(全地連)のボーリング柱状図作成要領(R8.6 版)の表 3〜表 5 に基づきます。
- このリポジトリには **要領の絵柄を転載していません**。要領の図から抽出した画像(SVG/PNG/PDF)、図形の座標列、自由形状の頂点列は含みません。
- 既定のパラメータ(ピッチ、径、角度、本数、線幅など)は、要領の印刷物を測定して得た寸法です。散布状の短線や自由形状は、本数・長さ・角度などの統計値から、シード付き乱数とパラメトリックな曲線で再構成しています。
- 本モジュールの出力は要領の図の複製ではなく、同じ規則で生成した模様です。本プロジェクトは全地連の公式なものではなく、要領への準拠を保証しません。

## ライセンス

[CC0 1.0 Universal](LICENSE)(パブリックドメイン提供)。ただし CC0 が及ぶのは本プロジェクトの著作物(コード、パラメータ定義、文書)だけで、第三者の権利には及びません。
