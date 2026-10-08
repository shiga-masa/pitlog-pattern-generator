# site/app 契約書(app-1 が作成・固定)

このファイルは site/app の唯一の契約文書。担当 app-2(catalog.js, paramPanel.js)と app-3(preview.js, exportPanel.js)は着手時にこれを読み、ここに書かれた名前・引数・戻り値だけに依存する。契約を変えるときは app-1 に報告し、このファイルを更新してから各担当が合わせる。

前提: `docs/CONVENTIONS.md` §12(デザイン)、§5(色)、§9(エラー方針)に従う。

---

## 1. 状態(site/app/state.js)

状態は 1 つのプレーンオブジェクト。モジュールは受け取った state を **読むだけ** で、直接書き換えない(変更は下の setter 経由)。`getState()` と subscribe の引数は複製なので、書き換えても状態は変わらない。

```js
State = {
  presetId: string | null,   // resolveId() の正規 ID(例 'zc:111101002')。未選択は null
  options: {                  // 共通変数。キーが無い = 既定値(キーを省く)
    density?: number,                       // 既定 1 (> 0)
    motifScale?: 'follow' | number,         // 既定 'follow'
    strokeScale?: 'follow' | number,        // 既定 1
    seed?: number,                          // 既定 0 (uint32 整数)
    tileMode?: 'frame' | 'period' | 'fit',  // 既定 'frame'
    ink?: '#rrggbb',                        // 既定 '#000000'
    paper?: '#rrggbb',                      // 既定 '#ffffff'
  },
  overrides: { [jsonPointer: string]: unknown },  // 既定 {}。例 {'/layers/0/params/angle': 30}
  output: {
    unit: 'mm' | 'pt' | 'px',               // 既定 'mm'
    width: number | null,                   // 既定 null = プリセット枠
    height: number | null,                  // 既定 null = プリセット枠
    dpi: number,                            // 既定 300(px 単位と PNG で使う)
    format: 'svg' | 'png',                  // 既定 'svg'。URL の fmt と往復するだけで、画面では編集しない(書き出し形式はボタンで決まる §4.4)
  },
}
```

state.js の export:

| 関数 | 役割 |
|---|---|
| `getState()` | 状態の複製を返す |
| `subscribe(fn)` | `fn(stateCopy)` を変更のたびに呼ぶ。解除関数を返す |
| `selectPreset(id)` | `presetId` を設定し `overrides` を空にする。`id` は正規 ID 前提(解決は呼び出し側) |
| `setOption(key, value)` | 共通変数を設定。`value === undefined` でキーを削除(既定に戻す)。未知の key は候補付きで例外 |
| `setOverride(pointer, value)` | JSON Pointer(先頭 `/`)の上書き。`value === undefined` で削除。書式違反は例外 |
| `setOutput(patch)` | `output` の一部を上書き |
| `buildRenderOptions(state, {forExport})` | ライブラリ(`renderSVG` / `renderPNG`)へ渡す options を作る(純粋関数)。下記 §1.1 |
| `encodeShareQuery(state)` | 共有 URL のクエリ文字列(`?` 無し)と `{query, overridesTooLong, overridesJson}` を返す。§1.2 |
| `decodeShareQuery(search)` | `location.search` を受けて `{state, warnings}` を返す。未知キー・範囲外値は警告に列挙して捨てる。`presetId` は **生の文字列** のまま返す(解決は main.js が `resolveId` で行う) |
| `OVERRIDES_MAX_CHARS` | 2048。`o=` の base64url 長の上限 |

### 1.1 buildRenderOptions

- 戻り値はライブラリの `options`(`src/core/validate.js` の OPTIONS 記述子に従う)。
- 常に含める: `options` の定義済みキー(`density`, `motifScale`, `strokeScale`, `seed`, `tileMode`, `ink`, `paper`)。
- `overrides` が空でなければ `overrides` を含める。
- `forExport: true` のとき追加: `dpi: output.dpi`、`size: {width, height, unit}`(`width` または `height` が null のときは `size` を省く = プリセット枠)。
- `forExport` 無し(プレビュー用)では `size` も `dpi` も含めない。

### 1.2 URL パラメータ(§6.3 の拡張)

| キー | 値 | 対応 |
|---|---|---|
| `id` | 正規 ID または解決可能な文字列 | `presetId` |
| `density` | 正の数 | `options.density` |
| `ms` | `follow` または正の数 | `options.motifScale` |
| `ss` | `follow` または正の数 | `options.strokeScale` |
| `seed` | uint32 整数 | `options.seed` |
| `tile` | `frame` / `period` / `fit` | `options.tileMode` |
| `ink`, `paper` | 6 桁 16 進(`#` 無し) | `options.ink`, `options.paper` |
| `unit` | `mm` / `pt` / `px` | `output.unit` |
| `w`, `h` | 正の数 | `output.width`, `output.height` |
| `dpi` | 正の数 | `output.dpi` |
| `fmt` | `svg` / `png` | `output.format` |
| `o` | overrides の JSON を base64url 化したもの(上限 `OVERRIDES_MAX_CHARS`) | `overrides` |

- 既定値と同じ値は URL に載せない(`encodeShareQuery` が省く)。
- `overridesTooLong` が true のとき `o` は URL に入れない。main.js がその JSON を画面に出して手でコピーさせる。

---

## 2. アプリの組み立て(site/app/main.js)

- `site/index.html` → `<script type="module" src="./app/main.js">`。
- main.js がレイアウト DOM を作り、各モジュールを mount する。上から縦積みで、DOM の骨組み(id):
  - `#warnings` 警告の一覧(decodeShareQuery の警告、resolveId の失敗、上限超過など)。警告が無いときは隠す
  - `#catalog` → `mountCatalog`(ページ最上部のタイルカタログ)
  - `#detail` 選択中の模様の詳細領域。`presetId` が null のときは隠す。中身は次の順:
    1. `#detail-name` 名称(別名タイルから選んだときはその名称と「別名(= 参照先)」)と「一覧へ戻る」
    2. `#preview` → `mountPreview`(大きめのプレビュー)
    3. `<details class="settings">`「詳細設定」(初期は閉)の中に `#param-panel` → `mountParamPanel` と `#overrides-json`(設定 JSON)
    4. `#export-panel` → `mountExportPanel`(単位・幅・高さ・dpi と SVG / PNG のダウンロードボタン)
    5. 共有リンク(`#share-link` と「リンクをコピー」)
- タイルを選ぶと詳細領域へスクロールする。URL に `id` があって復元したときも同じ。
- 状態が変わるたびに main.js が各モジュールの `update(state)` を呼ぶ。
- `history.replaceState` で URL を更新する(失敗しても無視せず、警告を出さずに続行はしない: try/catch で握るのは URL 更新だけ)。
- 「リンクをコピー」ボタンは main.js が持つ。

---

## 3. UI モジュールの共通ルール(app-2, app-3)

- 各モジュールは次の形の関数を export する。`mount…` は **1 回だけ** 呼ばれ、以後は `update` で状態を受け取る。

```js
export function mountXxx(container, props) -> { update(state): void, destroy(): void }
```

- `update(state)` は冪等に作ること。フォーカス中の入力欄を作り直さない(値が同じなら DOM を触らない)。プリセットが変わったときだけ欄を組み直す。
- 変更は必ず `props` の callback で返す。モジュール内で state を持たない。
- ライブラリの import は `site/app/ui/` から `'../../../src/index.js'`(`site/app/main.js` は `'../../src/index.js'`)。
- エラー・警告はモジュール内に表示する(握りつぶさない)。ライブラリの例外は `error.message` を画面に出す。
- 日本語の表示文言。色は `--earth` と `--white` の CSS 変数だけを使う(モジュール内で色を書かない。ink/paper の値は `buildRenderOptions` が渡す)。
- 罫線は実線のみ。角丸・影・半透明・イタリック・グラデーションを使わない。
- 基本の要素スタイル(button, input, textarea, 見出し, 余白, 2 列レイアウト)は `site/assets/style.css` が持つ。モジュール固有のスタイルは担当が次のファイルに書く(index.html に link 済み): `site/assets/ui/catalog.css`(カタログと詳細領域の枠), `site/assets/ui/paramPanel.css`。preview.js と exportPanel.js はスタイルを要素の style 属性で持つ(`--earth` / `--white` のみ)ので CSS ファイルは無い(段階 2 で index.html の存在しない link を削除)。`style.css` は app-1 だけが編集する。
- 携帯幅(360 px)で横スクロールを出さない。左右の余白は body の 16 px。

---

## 4. 各モジュールの公開関数

### 4.1 catalog.js(app-2)

```js
mountCatalog(container, {
  state,                              // State(読み取り専用)
  onSelect(canonicalId, rowId),       // タイルを選んだとき。canonicalId は resolveId(rowId) の結果、rowId は選んだタイルの ID
}) -> { update(state), destroy(), rowOf(id) }   // rowOf は listPresets() の行(表示外も含む)
```
- `listPresets()` の全行を 1 つの平らなグリッドに並べる。表のタブ・見出し・区分は作らない。
- 除外: `archetypes` がすべて `'empty'`(または空)の行と、参照先がそうである alias。模様を持つ alias はその名称で 1 枚のタイルとして出す。
- 読み: `src/presets/yomi.js` の `YOMI[id]` は `string | string[]`(ひらがな)。配列は先頭が正の読み(並び順に使う)、全要素が検索の一致対象。別読みは一般に併用されるものだけを入れる。
- 並び順: `YOMI[id]` の先頭の読みをカタカナ→ひらがなに畳んだ文字列のコードポイント順。同じ読みは ID 順。読みの無い ID は捨てずに `console.warn` で列挙し、末尾に ID 順で置く。
- 検索窓: 名称(ja/en)・読み(別読みを含む全要素)・記号・コード・ID。NFKC・小文字化・カタカナ→ひらがなで畳み、空白区切りの全語を含むもの(AND)。件数は「表示 N 件」(N は絞り込み後)とだけ出す。
- 「表示 N 件」の横(`.cat-bar`)に一括 ZIP 出力(`mountBulkExport`, §4.5)を置く。渡すのは絞り込み前の全行(`buildCatalog().rows`)。
- タイル: 模様の小さなプレビュー(`renderSVG(id, {})` = 既定色 #000000 / #ffffff、枠付き、IntersectionObserver で遅延描画)と名称、その下に 1 行でコード(`codeLabelOf(row)` = ID から `zc:` を除いただけの形。`111101002`、`t3-9:2`、`t4-3:-Sh`、`t5-3:13`)。コード行は折り返さず、文字数(`--code-len`)に応じてフォントを縮めてタイル幅に収める。描画失敗はタイル内に理由を出し、console.error にも出す。
- スクロール領域: タイルのグリッド(`.cat-grid`)だけが縦スクロールする固定高さの領域。検索窓と `.cat-bar`(「表示 N 件」と一括 ZIP 出力)は領域の外(上)に置く。高さは `max-height: max(200px, calc(100dvh - var(--cat-head) - var(--cat-peek)))`(`dvh` 非対応環境向けに同じ式の `vh` 版を先に書く)。`--cat-head` はページ上端からグリッド上端までの最大値(実測: PC 232 px、幅 480 px 未満では一括出力ボタンが折り返して 226〜276 px)で、PC 240 px・幅 480 px 未満 280 px。`--cat-peek` は 72 px で、初期表示の画面下端に次の要素(選択前は案内文、選択後は詳細領域)がのぞく。`overflow-x: hidden` で横スクロールは出さない。下端に 1 px の土色の罫線。スクロールバーは `scrollbar-color: var(--earth) var(--white)` の 2 色のみ。4 px の内余白でタイル端のフォーカス枠(`:focus-visible`)が切れないようにし、`scroll-padding` で Tab 移動時に焦点のタイルを領域内に収める。タイルを選んでも、ページは自動でスクロールしない(詳細領域は下に出るだけ。「一覧へ戻る」ボタンだけが `scrollIntoView` を使う)。
- `state.presetId` のタイルを選択状態(`aria-pressed="true"`)で表示。別名タイルから選んだときはそのタイルを選択状態にする。
- 純粋関数(node:test 用、DOM 無し): `foldText`, `isBlankRow`, `partitionRows`, `readingsOf`, `primaryReading`, `sortByYomi`, `filterCatalog`, `searchTextOf`, `buildCatalog`。

### 4.2 paramPanel.js(app-2)

```js
mountParamPanel(container, {
  state,
  onOptionChange(key, value),      // value === undefined は既定に戻す
  onOverrideChange(pointer, value) // value === undefined は上書きを外す
})
```
- 共通変数(`options` の 7 キー)と、選択中プリセットの層・型変数・モチーフ変数を、スキーマ(`getPreset()` と各 archetype の PARAMS 記述子)から組み立てる。
- 色の入力は `ink` と `paper` の 2 つだけ。
- 各欄に既定値へ戻すボタン、根拠(報告の節番号)のツールチップ。
- `presetId` が null のときは「プリセットを選んでください」を出す。

### 4.3 preview.js(app-3)

```js
mountPreview(container, { state })
```
- `renderSVG(state.presetId, buildRenderOptions(state))` を 100 ms デバウンスで描画。`buildRenderOptions` の結果(JSON 文字列)が前回と同じなら再描画しない。
- SVG をそのまま埋め込む(`innerHTML` へ `svg` 文字列を入れてよい。ユーザー入力は含まれない)。
- mm 目盛、タイル境界の表示切替(tileMode に関係なく表示 UI は持つ。境界線を描くのは「タイル繰り返し」表示のみ)、拡大率(初期 300 %。10 mm の目盛も拡大率に従う)。
- 描画領域(stage)に枠線を付けず、1 枚表示の SVG にも outline を付けない。模様の周りに出る線はプリセット自身の図枠(SVG 内の frame 要素、模様の一部)だけ。
- `meta.warnings` と例外メッセージをプレビュー下に表示。`presetId` が null のときは描画せず案内だけ出す。

### 4.4 exportPanel.js(app-3)

```js
mountExportPanel(container, {
  state,
  onOutputChange(patch)            // output の一部を更新。setOutput に渡す
})
```
- 単位(mm/pt/px)、幅・高さ(`output.width` が null のときはプリセット枠を換算して表示)、dpi を編集。
- 「SVG をダウンロード」「PNG をダウンロード」の 2 つのボタン。押したボタンが形式を決める(`output.format` は読まず、書き換えもしない)。PNG の画素数と上限は常に表示する。
- 書き出し: `renderSVG`(svg)または `renderPNG`(png)を `buildRenderOptions(state, {forExport: true})` で呼ぶ。`<a download>` で保存。
- ファイル名: `<id>_<density>_<w>x<h><unit>_<dpi>dpi.<ext>`(`ext` は押したボタンの形式)。`id` の `:` は `_` に置換(例 `zc_111101002_1_20x10mm_300dpi.svg`)。`density` は `options.density` の既定 1。
- 書き出し中・失敗は同じパネル内に表示。

---

### 4.5 bulkExport.js(カタログの一括 ZIP 出力)

```js
mountBulkExport(container, { rows })   // rows = カタログの全行(絞り込み前)。catalog.js が mount する
  -> { destroy() }
```
- ボタン「全件ダウンロード」(件数・形式・設定などの付加文言は出さない)。検索で絞り込み中でも **全件** を出す。
- 設定は固定の既定設定 `BULK_SETTINGS = {ink: '#000000', paper: '#ffffff', dpi: 300}`。寸法はプリセット枠(`size` を渡さない)。SVG は `renderSVG(id, {ink, paper})`、PNG は `renderPNG(id, {ink, paper, dpi: 300})`。詳細設定・state は読まない。
- ZIP の中身は画像だけ: `svg/<コード>_<名称>.svg` と `png/<コード>_<名称>.png`(README や エラー一覧のファイルは入れない)。
  - コード = `codeLabelOf(row)` の `:` を `-` に置換(`t3-9:2` → `t3-9-2`、`t4-3:-Sh` → `t4-3--Sh`)。名称 = `names.ja`。両方の `/ \ : * ? " < > |` と制御文字を `_` に置換し、末尾の `.` と空白を削る(`safeNamePart`)。
  - 大文字小文字を無視して同名になった後発の行には `_2`, `_3`… を付け、画面とコンソールに列挙する(現行 215 件では該当なし。テストで固定)。
  - ZIP のファイル名: `borehole-patterns_default_YYYYMMDD-HHMM.zip`(端末のローカル時刻)。
- 1 件ずつ `await` し、各件の後に `setTimeout(0)` でイベントループへ返す。ボタン下に「書き出し中 n / N(名称)」を出す。「キャンセル」で次の件の前に止め、ZIP は作らない。
- 失敗は黙って捨てない: 形式ごとに try/catch し、片方だけ成功した画像は ZIP に入れる。終了時(キャンセル時も)に「処理 / スキップ / 失敗」の件数を出し、失敗した ID・形式・理由を画面の一覧(`.bulk-failures`)と `console.error` に出す。件数の単位は模様(SVG と PNG の両方が成功で処理、どちらかが失敗で失敗、キャンセルで描かなかったものがスキップ)。
- 純粋関数(node:test 用、DOM 無し): `safeNamePart`, `fileStemOf`, `assignFileStems`, `zipFileName`, `collectBulkEntries(rows, {renderSVG, renderPNG, onProgress, signal})`(描画関数を注入)。
- ZIP 本体は `site/app/zip.js`(依存なし、DOM なし): STORE(無圧縮)、CRC-32、UTF-8 ファイル名フラグ(bit 11)、MS-DOS 日時。ZIP64 は持たず、4 GiB(0xFFFFFFFF バイト)または 65535 件を超える場合は `ZipLimitError` で止める(`zipSizeOf` が先に検査)。「作成システム」は Unix(host 3)にする: MS-DOS(host 0)だと Info-ZIP の unzip が UTF-8 フラグを無視して日本語名を化けさせるため。
- スタイルは `site/assets/ui/catalog.css` の `.cat-bar` / `.bulk-*`。

## 5. 未決定(app-1 の判断で仮に決めたもの)
- `output.width/height` の null は「プリセット枠」。枠の値は `toSpec(presetId).frame`(pt、表ごとの既定を適用済み)から換算する。`getPreset()` の `frame` は省略されていることがある(段階 2 で修正)。
- 初期状態は `presetId: null`(既定プリセットは持たない。黙って選ばない)。
## 6. 配信構成(段階 2 で決定)

- GitHub Pages は **リポジトリのルート**(main ブランチの `/`)を配信する。`site/` と `src/` が同じ配信ルートに入るので、`site/app/main.js` の `'../../src/index.js'` と `site/app/ui/*.js` の `'../../../src/index.js'` がそのまま解決する。ビルドもコピーも不要。
- ルートの `index.html` は `./site/` へ移動するだけのページ(土色と白の 2 色)。`.nojekyll` で Jekyll の加工を止め、`src/` の ES モジュールを原文のまま配る。
- 公開 URL: `https://<user>.github.io/<repo>/site/`。ライブラリは `https://<user>.github.io/<repo>/src/index.js` から第三者も import できる(設計書 §6.1)。
- `test/` と `docs/` も配信されるが、原本由来のファイルは含まない(`.gitignore` と CONVENTIONS §1)。
- 確認方法: リポジトリのルートで `python3 -m http.server` を起動し `http://127.0.0.1:8000/site/` を開く。
