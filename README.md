# 柱状図模様ジェネレータ(borehole-pattern-web)

ボーリング柱状図の図模様(岩盤・土質の地紋)を、パラメータから SVG と PNG で生成する JavaScript モジュールと、それをブラウザだけで使う静的サイトです。

- 依存ライブラリなし、ビルド不要の ES モジュール。GitHub Pages にそのまま置けます。
- すべての模様は「型(格子・ハッチ・波線・散布など)+ モチーフ + 数値パラメータ」で定義され、密度・寸法・色などを引数で変えられます。
- 出力形式は SVG と PNG です。

> **開発状況**: 段階 2(統合)まで。全プリセット(表 3-1〜3-9、4-1〜4-3、5-1〜5-3。表 5 は表 4 への別名)が登録され、SVG・SVG `<pattern>`・Canvas・PNG を生成できます。既定値の原本との照合は未了です。実装規約は [docs/CONVENTIONS.md](docs/CONVENTIONS.md) にあります。

## 使い方

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
| `renderCanvas(ctx, idOrSpec, options, rect)` | `Promise<{meta}>` | Canvas に描画 |
| `renderPNG(idOrSpec, options)` | `Promise<Blob>` | PNG |
| `getPreset(query)` | spec | 既定値の閲覧(別名は参照先に解決) |
| `resolveId(query)` | 正規 ID | `zc:` ID、9 桁コード、`sym:<記号>`、日本語名から解決。複数該当はエラー |
| `listPresets({table, archetype, text})` | 一覧 | 選択 UI 用 |
| `definePreset(spec)` / `validateSpec(spec)` | 登録 / `{ok, errors, warnings}` | 利用者定義の模様 |
| `toSpec(query, options)` | 解決済み spec | 設定の共有・再現 |
| `compose([idOrSpec, ...])` | spec | 層の連結(主模様 + 表 3-9 の帯など)。枠・線幅などは先頭の spec に従い、使わなかった値は `provenance.notes` に残る |
| `presetReport()` | 件数 | 読み込んだプリセットのファイル別件数 `{processed, skipped, failed}` |

主な options: `density`(既定 1)、`motifScale`、`strokeScale`、`size`(pt/mm/px)、`dpi`(既定 96 = CSS px。PNG を印刷用に作るときは 300 などを渡す。サイトは 300)、`tileMode`(frame/period/fit)、`ink` / `paper`(`'#rrggbb'`)、`ground`(paper/none)、`seed`、`overrides`(JSON Pointer → 値)。未知のキーや 3 色目の指定はエラーになり、理由と候補が返ります。

## テスト

```sh
npm test        # = node --test "test/**/*.test.js"(Node 22 以上、依存なし)
```

`test/presets/smoke.test.js` は全プリセットを公開 API で SVG・`<pattern>`・PNG に描き、例外・NaN・色(ink/paper の 2 色だけ)・viewBox を検査して、処理・スキップ・失敗の件数を出力します。

## サイト(GitHub Pages)

カタログ上部の「全件ダウンロード」で、カタログの全タイル(検索で絞り込み中でも全件)を既定設定(ink `#000000` / paper `#ffffff`、プリセット枠、PNG は 300 dpi)で `svg/<コード>_<名称>.svg` と `png/<コード>_<名称>.png` にした ZIP を保存できます。ZIP は依存なしの自前実装(`site/app/zip.js`、無圧縮)で、失敗した模様の件数と理由は画面に出ます(仕様は [site/app/ui/CONTRACT.md](site/app/ui/CONTRACT.md) §4.5)。

GitHub Pages ではリポジトリのルートを配信します(ビルド不要)。ルートの `index.html` から `site/` に移ります。`site/` は `../src/index.js` を相対 import するので、`src/` も同じ配信ルートに入っている必要があります。手元では、リポジトリのルートで `python3 -m http.server` を起動して `http://127.0.0.1:8000/site/` を開きます。

## 出典と原本との関係

- 模様の種類・名称・コード・記号は、全国地質調査業協会連合会(全地連)のボーリング柱状図作成要領(R8.6 版)の表 3〜表 5 に基づきます。
- このリポジトリには **要領の絵柄を転載していません**。要領の図から抽出した画像(SVG/PNG/PDF)、図形の座標列、自由形状の頂点列は含みません。
- 既定のパラメータ(ピッチ、径、角度、本数、線幅など)は、要領の印刷物を測定して得た寸法です。散布状の短線や自由形状は、本数・長さ・角度などの統計値から、シード付き乱数とパラメトリックな曲線で再構成しています。
- 本モジュールの出力は要領の図の複製ではなく、同じ規則で生成した模様です。本プロジェクトは全地連の公式なものではなく、要領への準拠を保証しません。

## ライセンス

[CC0 1.0 Universal](LICENSE)(パブリックドメイン提供)。ただし CC0 が及ぶのは本プロジェクトの著作物(コード、パラメータ定義、文書)だけで、第三者の権利には及びません。
