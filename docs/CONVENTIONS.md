# 実装規約(CONVENTIONS)

段階 0 で固めた規約。段階 1 の実装者(最大 19 名)はこの文書と自分の担当ファイルの冒頭コメントだけを読めば着手できるようにしてある。設計の背景は分析側の設計書 `schema_design.md`(以下「設計書」、§ 番号はその節)にある。設計書とこの文書が食い違う場合は **この文書が優先** する(食い違いの一覧は §15)。

規約を変えたいときは自分で変えず、理由を添えて統合担当に報告する。

---

## 1. ディレクトリと担当

```
src/
  index.js               公開 API                          統合担当(段階 2)
  core/
    types.js             JSDoc 型(実行時コードなし)          段階 0(凍結)
    schema.js            記述子エンジン + spec/options 記述子  段階 0(凍結)
    validate.js          validateSpec / validateOptions        段階 0(凍結)
    colors.js            2 色規則                               段階 0(凍結)
    defaults.js          共通変数の既定値・上限                 段階 0(凍結)
    errors.js            例外クラス・件数                       段階 0(凍結)
    rng.js               シード付き乱数                          段階 0(凍結)
    units.js             単位変換                               段階 0(凍結)
    geom.js              角度・回転・bbox 判定                  段階 0(凍結)
    primitives.js        プリミティブ・円近似・パス解析          段階 0(凍結)
    density.js           密度(方式 B)                          段階 0(凍結)
    resolve.js           spec + options の解決                  段階 0(凍結)
    registry.js          ID → 定義、別名解決                    段階 0(凍結)
    lattice.js, clip.js  格子点・クリップ(スタブ)              core-A
  archetypes/
    index.js             型レジストリ                           段階 0(凍結)
    <type>.js            1 型 1 ファイル(スタブ)               arch-1〜5(§11)
  motifs/
    index.js             モチーフレジストリ                     段階 0(凍結)
    basic.js, lineGlyph.js                                       motif-1
    curves.js, glyphs.js                                         motif-2
  render/
    svg.js               SVG 出力ユーティリティ + renderSVG     段階 0(拡張は render-1)
    svgPattern.js        <pattern>(スタブ)                    render-1
    canvas.js, png.js    Canvas / PNG(スタブ)                 render-2
  presets/
    index.js             全プリセットの読み込み                  統合担当(段階 2)
    t3_1.js … t5.js      プリセット(空配列)                   preset-1〜5
site/                    GitHub Pages の画面(index.html + main.js)  app-1〜3
test/                    node --test(依存なし)
docs/CONVENTIONS.md      この文書                               段階 0
```

- 「凍結」のファイルは段階 1 では編集しない。不足があれば報告する。
- 担当ファイル以外を編集しない。テストは `test/<src と同じ相対パス>/<ファイル名>.test.js` を自分で作る(§14)。
- git 操作は誰もしない(親が行う)。
- 原本由来のファイル(抽出 SVG/PNG/PDF、prim 座標列、固定座標表、グリフの頂点列)はリポジトリに入れない。分析側 `024_borehole_pettern/data/` からのコピーも禁止。

## 2. 座標系・単位・角度

| 項目 | 規約 |
|---|---|
| 内部単位 | **pt**(1 pt = 1/72 in = 0.3528 mm)。全パラメータ・全プリミティブ座標は pt |
| 原点 | 描画領域(region)の **左上** |
| 軸 | x 右向き、**y 下向き**(SVG と同じ) |
| 角度 | 度。**数学座標の向き**: 0° = 右、正 = 画面上で反時計回り。45° は右上がり |
| 角度 → ベクトル | `geom.dir(deg)` = (cos θ, **−sin θ**)。自前で cos/sin を書かない |
| 点の回転 | `geom.rotatePoint(x, y, deg, cx, cy)`(画面上で反時計回り) |
| SVG の rotate | 数学座標の θ は SVG では `rotate(−θ)`。変換は `render/svg.js` だけが行う |
| 間隔 | `spacing` / `lineSpacing` / `bandSpacing` は **線に垂直な距離**。報告が水平切片 h で与える場合は `spacing = h·|sin θ|`(`geom.spacingFromHorizontalIntercept`)で換算してから既定値に書く |
| 寸法 | モチーフのパラメータは **全幅(径・幅・高さ)** で持つ(`d`, `w`, `h`, `base`, `height`)。半径で持たない。プリミティブ(§7.4)は SVG と同じく半径 `r`, `rx`, `ry` |
| 等方 | 生成は等方(設計書 §0.3)。非等方倍率は使わない |

## 3. 領域・タイル境界・層の順序・精度

### 3.1 領域(region)
- archetype が受け取る `ctx.region` は `{x: 0, y: 0, width, height}`(pt)。`options.size` があればその大きさ、なければ spec の `frame`。
- `origin`: `'center'`(既定)は格子の中央の行・列を領域の中心に置く(設計書 R3 §5.3-6)。`'topLeft'` は最初の点を (pitchX/2, pitchY/2) に置く。`{x, y}` は最初の点の座標。

### 3.2 境界の扱い(edgeMode)
- 領域は閉区間 [0, width] × [0, height]。判定の許容差は `defaults.EPS` = 1e-6 pt。
- `edgeMode: 'whole'`(grid の既定): 個体(1 モチーフ)の **幾何 bbox(線幅を含めない)** が領域内に収まるものだけ描く。収まらない個体は `skipped` に数える(黙って捨てない)。判定は `geom.bboxInside`。
- `edgeMode: 'clip'`: 領域に少しでも掛かる個体を描き、見た目は SVG の clipPath で切る。
- 線の模様(hatch, wave, brick, frameDiagonal)は領域全体を覆うように引き、クリップで切る。`margin` があれば幾何的に端を止める(`core/clip.js`)。
- `clip: true`(既定)のとき SVG は全層に領域の clipPath を掛ける。層単位で `layer.clip` で上書きできる。

### 3.3 tileMode
- `'frame'`(`renderSVG` の既定): 領域 1 枚を描く。継ぎ目は考えない。原本見本の再現と検証用。
- `'period'`(`renderSVGPattern` の既定): 各 archetype の `period()` が返す最小周期をタイルにする。周期の境界をまたぐ個体は、反対側にも複製して描く(シームレス)。周期が存在しない場合 `period()` は `null` を返し、render-1 が `'fit'` に落として `warnings` に記録する。
- `'fit'`: 指定サイズに整数個の周期が入るようにピッチを ±5 % 以内で丸め、丸め量を `meta.adjust` で返す(render-1 が実装。現状は NotImplementedError)。

### 3.4 描画順
1. 地(`ground: 'paper'` のとき paper で領域を塗る)
2. 層。**計算は配列順**(後の層が前の層の結果 `ctx.results` を参照できる: `avoid`, `relation`)、**描画は z 昇順、同じ z は配列順**。z の既定は 0。
3. 枠(`frame.show: 'ink'`)。線幅の半分だけ内側に寄せた矩形として最後に描く(viewBox の外に線がはみ出さない)。
- 原本の重ね順(設計書 §4: 点 → 斜線、短線 → 白三角形 など)は配列順で表す。白抜き(paper 塗り)の図形が下の層を隠すのは意図した挙動(`blend: 'over'`)。

### 3.5 精度
- 計算は倍精度のまま。途中で丸めない。
- SVG に書くときだけ `render/svg.js` の `fmt()` で **小数 3 桁**(0.001 pt)に丸め、末尾の 0 と `-0` を除く。指数表記は出さない。NaN / Infinity は例外。
- 既定値は報告の値をそのまま書く(報告が 2 桁なら 2 桁)。2 値交互のピッチは平均値(設計書 §0.3)。

## 4. 乱数
- `Math.random()` は src/ のどこでも使わない。乱数は `ctx.rng`(`core/rng.js` の mulberry32)だけ。
- 層の乱数列は `hashSeed(baseSeed, layer.seed ?? layer.id)` で決まる。`baseSeed` = `options.seed ?? spec.seed ?? 0`。base を変えると全層が変わり、層どうしは列を共有しない。
- 同じ spec + options からは常に同じ出力(URL 共有の前提)。1 個体の中で追加の乱数が要るときは `ctx.rng.fork('<用途>')` で子の列を作る(呼び出し順に依存させない)。
- `test/core/rng.test.js` が先頭の値を固定している。アルゴリズムを変えるのは破壊的変更。

## 5. 色

**模様に使える色は 2 色まで**。ユーザーが自由に設定できるが、変数は次の 2 つだけ。

| 変数 | 意味 | 既定 |
|---|---|---|
| `ink` | 線、黒塗りの図形 | `#000000`(完全な黒) |
| `paper` | 地、白抜きの図形の塗り | `#ffffff`(完全な白) |

- 形式は `'#rrggbb'`(16 進 6 桁)のみ。`#000`、`#rrggbbaa`、`black`、`rgb()`、`transparent` は拒否する。
- spec の最上位と options の最上位にだけ置ける。図形ごと・層ごとの独自色、グラデーション、透明度(中間色)、3 色目は `validateSpec` / `validateOptions` が拒否し、理由と場所を列挙する(`core/colors.js` の `checkColors`)。拒否するキー: `color`, `colour`, `background`, `opacity`, `fillOpacity`, `strokeOpacity`, `alpha`, `gradient` など。色らしい文字列値(`#…`, `rgb(`, `hsl(`, `url(`, `*-gradient(`, `transparent`)も層・モチーフ内では拒否。
- 模様の中で色を指すのはペイントトークン `'ink' | 'paper' | 'none'` だけ。モチーフの `fill` も、プリミティブの `style.stroke` / `style.fill` もトークンで書く。
- 黒塗りの図形 = `fill: 'ink'`、白抜きの図形 = `fill: 'paper'`(輪郭は ink)。線のみ = `fill: 'none'`。
- `ground: 'paper' | 'none'` は地を塗るかどうかの切替で、色は増やさない。
- `ink == paper` はエラーではなく警告(模様が見えなくなる)。
- 出力 SVG に現れる色は `ink` と `paper` の 2 値だけ(テストで検査している)。Canvas/PNG も同じ(`globalAlpha` は 1 のまま)。
- サイト UI の土色(§12 の `--earth`)は UI 専用で、模様の既定色には使わない。

## 6. ID 体系と命名

| 対象 | 形式 | 例 |
|---|---|---|
| プリセット(コードあり) | `zc:<9 桁コード>` | `zc:111101002` |
| 表 3-9 | `zc:t3-9:<1-5>` | `zc:t3-9:2` |
| 表 4-3 | `zc:t4-3:<記号>`(先頭 `-` は「混じり」) | `zc:t4-3:G`, `zc:t4-3:-Sh` |
| 表 5 | `zc:t5-<1|2>:<行番号>`(表 4 への alias のみ) | `zc:t5-1:12` |
| 層 ID | lowerCamelCase ASCII、spec 内で一意 | `dots`, `ashLines` |
| SVG 内 ID | `<idPrefix>-clip` など。`idPrefix` 既定は `zc-` + ID の英数字以外を `_` に | `zc-zc_111101002-clip` |

- 正規表現は `core/schema.js` の `ID_PATTERN`, `LAYER_ID_PATTERN`。
- `resolveId()` が受けるもの: `zc:` ID、9 桁コード、`sym:<記号>`、日本語名(完全一致)。複数一致はエラーで候補を列挙する(Pt, Lp, WR, SF は一意でない)。先頭を黙って選ばない。
- 別名(alias)は `aliasOf` だけを持ち、値を複製しない。逆引き(この模様の別名一覧)は registry が計算する(spec に `aliases` 配列は書かない)。
- 英語名 `names.en` は出典のある対訳表が決まるまで書かない(創作しない)。

## 7. 入出力契約

### 7.1 archetype ファイル(`src/archetypes/<type>.js`)
必須の export(`archetypes/index.js` が読み込み時に検査する):

| export | 内容 |
|---|---|
| `ARCHETYPE` | 型名。ファイル名と同じ |
| `MOTIF` | `'required'` / `'forbidden'` / `'motifOrCycle'`(grid のみ。`layer.motif` と `params.cycle` のどちらか一方) |
| `DENSITY` | `{params: boolean, motif: boolean}`。密度で params / motif を縮めるか(§8.2) |
| `PARAMS` | パラメータの記述子(§8.1)。この型の変数の **唯一の定義**。変数を足すときはここに足す |
| `render(layer, ctx)` | 1 層を描く。戻り値は LayerResult |
| `period(layer, ctx)` | `tileMode: 'period'` の最小周期 `{w, h}`、なければ `null` |

`render` が受け取る `layer` は **既定値適用済み・密度適用済み**。長さは最終の pt。archetype の中で密度を掛け直さない。

### 7.2 LayerContext と LayerResult
```js
ctx = {
  region: {x: 0, y: 0, width, height},   // pt
  tileMode: 'frame' | 'period' | 'fit',
  strokeWidth,                          // 最終線幅 pt(重なり判定用。描画には使わない)
  origin, jitter, clip,
  rng,                                  // この層専用の乱数列
  results: { [layerId]: LayerResult },  // 配列で前にある層の結果
  buildMotif(motif, rng?) -> Primitive[],   // ローカル座標(§7.3)
  motifExtent(motif) -> {w, h},
}
LayerResult = {
  primitives: Primitive[],   // 領域座標(pt)
  placed: number,            // 描いた個体数
  skipped: number,           // edgeMode 'whole' や avoid で描かなかった個体数
  warnings: string[],        // 重なり(density.overlapWarning)など
  anchors?: [{x, y, row?, col?}],  // 個体の基準点(avoid / relation 用)
}
```
- 何も描けない組合せは空配列を返さず `GeometryError` を投げる(理由を書く)。`empty` 型だけは `primitives: []` を返してよい。
- 返したプリミティブは renderer が `validatePrimitive` で検査する。不正なら層 ID 付きで例外。
- モチーフの配置は `transformPrimitive(p, {scale, mirrorY, rotate, x, y})`(順序: 拡大 → 上下反転 → 回転 → 平行移動)を使う。

### 7.3 モチーフファイル(`src/motifs/*.js`)
- export: `KINDS`(kind → フィールド記述子。`kind` キー自体は書かない)、`BUILDERS`(kind → `build(motif, ctx)`)、`EXTENTS`(kind → `extent(motif)`)。
- `build` はローカル座標で返す: **幾何 bbox の中心が (0, 0)**、モチーフ自身の `rotation` 以外は回転しない。寸法は受け取った値(密度適用済み)をそのまま使う。
- `extent` は幾何 bbox の `{w, h}`(線幅を含めない)。
- `ctx = {strokeWidth, rng}`。乱数を使うのは `blob` など明記したものだけ。
- 空配列は返さない(`motifs/index.js` が拒否する)。
- 自由形状(Pt グリフ、鉱物脈、貝殻、角礫、レンズ・かぎ形)は設計書 §1.4 b2 の寸法だけから作る。原本の頂点列は使わない。

### 7.4 プリミティブ(`core/primitives.js`)
`line`, `polyline`, `polygon`, `circle`(r = 半径), `ellipse`(rx, ry = 半径、rotation = 度・数学座標), `path`(M/L/C/Q/Z の絶対座標コマンド列)。`style = {stroke, fill, dash, dashOffset}`、stroke/fill はペイントトークン。線幅・線端・結合は図形ごとに持たず、spec の `stroke` が全体に掛かる。円は真円で描く(多角形近似は `circlePolygonPoints` を明示したときだけ)。

### 7.5 renderer
- `renderSVG(id|spec, options)` → `Promise<{svg, meta}>`。`meta.counts = {layers: {processed, skipped, failed}, instances: {placed, skipped}, primitives}`、`meta.warnings`。
- `renderBatch(inputs, options)` → `{results, counts: {processed, skipped, failed}}`。個別の失敗で止まらず、失敗を数えて理由を残す。
- SVG の構造: `<svg width/height(単位付き) viewBox(pt)>` → `<title>` → `<defs><clipPath>` → 地 `<rect>` → `<g fill="none" stroke=ink stroke-width ...>` の中に層ごとの `<g data-layer="id">` → 枠 `<rect>`。
- SVG 出力ユーティリティ(`fmt`, `attrs`, `escapeXml`, `pointsAttr`, `pathData`, `primitiveToSVG`, `svgDocument`)は `render/svg.js` にだけ置き、他のファイルで書き直さない。

## 8. スキーマ・記述子・密度

### 8.1 記述子
値の検証・既定値・密度の扱いは、すべて記述子(`core/schema.js` 冒頭のコメント)から導く。数値フィールドは必ず `unit`(pt/deg/ratio/count…)と `density`(length/motif/area/none)を持つ。記述子は `schema.js` の補助関数で書く:

| 関数 | 用途 | density |
|---|---|---|
| `len()` | ピッチ・間隔・波長 | length |
| `size()` | モチーフ寸法、破線長、振幅 | motif |
| `fixed()` | 枠に従う長さ(margin, frameDiagonal.gap, bandWidth) | none |
| `angle()`, `ratio()`, `count()` | 角度・比・個数 | none |

- 必須は `required: true`(既定値を持たない)。既定値は報告の値か設計書の既定。未測定は `nullable: true, default: null` とし、描画側で null を受けたら `GeometryError`(黙って補わない)。
- `test/core/schema.test.js` が全記述子を `checkDescriptor` で検査する(単位・密度区分の欠落、既定値の不整合を検出)。
- JSDoc 型(`core/types.js`)は記述子の写しで、食い違ったら記述子が正。

### 8.2 密度(方式 B、ユーザー決定)
- `density`(既定 1): `length` 区分 × 1/density、`motif` 区分 × motifScale(既定 `'follow'` = 1/density)、`area` 区分(scatter の count)× density² を四捨五入、`none` は不変。
- **線幅は pt 固定**(`strokeScale` 既定 1。`'follow'` で方式 C)。
- 層ごとに `densityScale` を掛けられる。`DENSITY.params = false` の型(frameDiagonal, symbol, empty)は縮めない。`DENSITY.motif = false` の型(edgeBand, symbol ほか)はモチーフを縮めない。
- `rowsPerFrame`(方式 D)は第 1 層の縦周期(`pitchY` → `spacing` → `lineSpacing` → `courseHeight` → `bandSpacing` の順で最初にあるもの)から density に換算する。`density` と同時には指定できない。
- 推奨範囲 0.25〜4 を外れると警告、0 以下はエラー。count が 0 に丸まると警告。モチーフ + 線幅 > ピッチは `overlapWarning` で警告し、描画はする。

### 8.3 spec + options の解決順(`core/resolve.js`)
spec 検証 → options 検証 → 表ごとの既定(`defaults.defaultsForTable`、spec の値が優先)→ options の共通変数 → `overrides`(JSON Pointer、先頭 `/` 必須。例 `{"/layers/1/params/angle": 30}`)→ `points` / `paths`(層 ID で指定)→ 記述子の既定値 → 再検証 → 密度 → 描画設定。どの段でも適用できないものは例外。

## 9. エラー方針
- 黙って落とさない・黙って補わない・空の出力でごまかさない。
- 未知のキー・未知の型名・未知のモチーフ・未知の ID は例外にし、候補を近い順に列挙する(`errors.rankCandidates`)。
- 検証は最初のエラーで止めず、全部を集めて `SchemaError.errors` に入れる。
- 例外クラス: `SchemaError`(スキーマ違反)、`ResolveError`(ID 解決・参照)、`NotImplementedError`(スタブ、`owner` 付き)、`GeometryError`(描けない組合せ)、`LimitError`(プリミティブ数 2×10⁵、PNG 1 辺 8192 px / 総画素 5×10⁷)。
- 一括処理(`registry.addAll`, `finalize`, `renderBatch`, `loadDefaultRegistry`)は `{processed, skipped, failed}` を返す。`addAll` は既定で失敗があれば全件処理後に例外。
- 1 枚の描画は部分的な絵を返さない。どれか 1 層が失敗したら例外。
- 警告(`warnings`)は文字列で返し、画面と検証ログに必ず出す。

## 10. プリセット作成規則(preset-1〜5)
- 1 プリセット = 1 オブジェクト。`provenance: {doc, section, measured, notes?}` 必須。値はすべて報告の該当節から取り、報告に無い値を作らない。迷ったら値を空にして報告する。
- 2 値交互のピッチは平均、行間不等は平均 + `notes` に「不等」、未測定は `null` + `measured: false`。
- 線幅・枠は表ごとの既定(§8.3)に任せ、例外だけ書く(崩積土の `stroke.width: 0.239`、固結粘土の `frame.show: 'ink'` など)。
- 色は書かない(ink/paper の既定に従う)。黒塗り = `fill: 'ink'`、白抜き = `fill: 'paper'`。
- 模様なし行は `layers: [{id: 'none', archetype: 'empty'}]`。参照先のある模様なし行は `aliasOf`。
- `PRESETS` 配列を export する。読み込み時に全件検証され、ファイルごとの件数が報告される。

## 11. 段階 1 の割り当て
設計書 §9.2 を次のとおり確定する。core-B の担当(rng, units, validate)は段階 0 で実装済みのため、段階 1 では担当なし(計 18 名)。app-1〜3 は設計書の `app/` ではなく `site/` 以下に置く。

| 担当 | ファイル |
|---|---|
| core-A | `src/core/lattice.js`, `src/core/clip.js` |
| arch-1 | `src/archetypes/grid.js` |
| arch-2 | `src/archetypes/brick.js`, `src/archetypes/hatch.js` |
| arch-3 | `src/archetypes/wave.js`, `src/archetypes/frameDiagonal.js` |
| arch-4 | `src/archetypes/scatter.js`, `src/archetypes/symbol.js`, `src/archetypes/empty.js` |
| arch-5 | `src/archetypes/diagonalBand.js`, `src/archetypes/edgeBand.js` |
| motif-1 | `src/motifs/basic.js`, `src/motifs/lineGlyph.js` |
| motif-2 | `src/motifs/curves.js`, `src/motifs/glyphs.js` |
| render-1 | `src/render/svgPattern.js`(+ `render/svg.js` の `fit` / `knockout` 拡張) |
| render-2 | `src/render/canvas.js`, `src/render/png.js` |
| preset-1 | `src/presets/t3_1.js`, `t3_2.js`, `t3_3.js` |
| preset-2 | `src/presets/t3_4.js` |
| preset-3 | `src/presets/t3_5.js`, `t3_7.js`, `t3_8.js`, `t3_9.js` |
| preset-4 | `src/presets/t4_1.js` |
| preset-5 | `src/presets/t4_2.js`, `t4_3.js`, `t5.js` |
| app-1 | `site/index.html`, `site/main.js`, `site/state.js` |
| app-2 | `site/ui/presetPicker.js`, `site/ui/paramPanel.js` |
| app-3 | `site/ui/preview.js`, `site/ui/exportPanel.js` |

- `test/archetypes/stubs.test.js` は未実装の関数が NotImplementedError(担当名付き)を投げることを検査し、実装されたものは自動で skip する。共有ファイルなので段階 1 では誰も編集しない。実装の検査は各自のテストファイルに書く。
- core-A の lattice/clip は arch-1, arch-5 が使う。core-A が終わるまで arch 側はローカル関数で書かず、シグネチャどおりに呼んでテストは core-A の完了後に通す。

## 12. デザイン(サイト UI)
- モノトーンでシンプル。使う色は **2 色だけ**: `--earth: #2b2420`(ごく暗い茶褐色。文字・線・塗りに使う。白との対比 15.3:1)と `--white: #ffffff`。
- CSS 変数はこの 2 つだけ。他の色変数を作らない。灰色・その他の色・半透明による中間色は使わない(`opacity`, `rgba`, `color-mix` も不可)。
- 階層は文字サイズ・太さ・余白・罫線(`--earth` の実線)で表す。
- 角丸と影は使わない(`border-radius: 0`, `box-shadow: none`)。ダークモードは作らない(白地 + 土色のツートンのみ)。
- 模様のプレビューと書き出しの既定色は §5 の ink `#000000` / paper `#ffffff`。土色は UI だけに使う。ユーザーが模様の色を変えるときは ink/paper の 2 つの入力だけを出す。
- 画面幅 360 px で横スクロールが出ないこと。左右の余白 16 px。
- 外部 CDN・フォント・ライブラリを読まない(オフラインで動く)。`site/` から `../src/index.js` を相対 import する。

## 13. 命名規則
- ファイル: lowerCamelCase の `.js`(型ファイルは型名と同じ)。プリセットは `t<表>_<枝番>.js`。
- 変数・関数: lowerCamelCase。定数表: UPPER_SNAKE_CASE。クラス: PascalCase。
- パラメータ名は設計書 §2 の名前を使う。例外(§15)はこの文書に従う。
- コードのコメント・エラーメッセージは英語。文書(README, この文書)は日本語。
- 一時ファイルは `_tmp` を付け、作業後に消す。

## 14. テストの書き方
- `node --test` のみ(`npm test` = `node --test "test/**/*.test.js"`)。依存を追加しない。`node:test` と `node:assert/strict` を使う。
- 配置: `test/<src からの相対ディレクトリ>/<ファイル名>.test.js`。共有の入力は `test/fixtures/`(テストを含めない)。
- 1 テスト 1 性質。名前は「何が起きるべきか」を英語で書く。
- 浮動小数の比較は許容差(既定 1e-9 pt)付き。SVG 文字列は `fmt` 後の値で比較してよい。
- 必ず書くもの: 既定値での出力(個数・位置の代表点)、密度 2 での出力(ピッチ・寸法が 1/2、線幅不変)、境界(edgeMode whole で skipped が数えられる)、不正入力で例外(メッセージに理由と候補)、乱数を使う型は同 seed 同出力・別 seed 別出力。
- 生成物を自分の目で確認する。SVG はテスト内で文字列として検査し、ファイルに書き出したら確認後に消す(リポジトリに残さない)。
- 原本の座標列・画像をテストの期待値に使わない。期待値は報告の統計値(本数・寸法・ピッチ)から作る。

## 15. 設計書からの変更点(段階 0 で決めたもの)
| 設計書 | この規約 | 理由 |
|---|---|---|
| `stroke.color`, `fill.white/black`, `background`(§2.1) | `ink`, `paper`, `ground` | 2 色規則(§5)。既定 ink #000000 / paper #ffffff |
| 塗り B/W(黒/白) | ペイントトークン `ink` / `paper` / `none` | 同上 |
| `frame.show: 'black'` | `'ink'` | 同上 |
| `renderSVG` は SVG 文字列を返す(§5.1) | `{svg, meta}` を返す(Promise) | 件数・警告を必ず返すため。既定レジストリを遅延読み込みするため非同期 |
| `overrides` のキー `'layers/1/params/angle'` | JSON Pointer `'/layers/1/params/angle'` | パスの書き方を 1 つにする(エラーのパス表記と同じ) |
| `rowOffset`「ピッチ比 or pt」 | 数値 = ピッチ比、`{pt: 4.77}` = pt | 単位を値から曖昧なく読めるようにする |
| hatch `directions` | `angle` に配列も許す(`[45, 135]`) | 同じ意味の 2 キーを作らない |
| 層の `phase`(§4) | grid の `params.phase` のみ | 二重定義の解消 |
| scatter の `seed` パラメータ | 層の `seed` のみ | 同上 |
| spec の `aliases` 配列(§5.2 例) | 書かない。registry が逆引きを計算 | 複製はずれる(§9.3) |
| 模様なし行 `kind: 'empty'`(§5.3) | `layers: [{archetype: 'empty'}]` | spec の形を 1 種類にする |
| ellipse `rx, ry`、貝殻 白/黒 | `w, h`(全幅)、`paperW/paperH/inkW/inkH/inkOffset` | 寸法は全幅で持つ(§2)、色名を使わない |
| JSON Schema ファイル `schema/pattern-spec.1.schema.json` | 作らない。記述子(JS)が唯一の定義 | 2 か所に定義を持つとずれる |
| `app/`, `tests/`, `NOTICE.md` | `site/`, `test/`, README の節 | 段階 0 の指示 |
| tileMode 既定 `period` | `renderSVG` は `frame`、`renderSVGPattern` は `period` | 1 枚の画像と継ぎ目なしタイルで用途が違う |
