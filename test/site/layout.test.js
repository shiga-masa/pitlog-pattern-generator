import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

/** Body of the first top-level rule whose selector is exactly `sel` in a CSS text. */
function ruleBody(css, sel) {
  const re = new RegExp(`(^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  const m = css.match(re);
  assert.ok(m, `rule ${sel} not found`);
  return m[2];
}

test('catalogue grid is a fixed-height vertical scroll area that leaves the next section visible', () => {
  const body = ruleBody(read('site/assets/ui/catalog.css'), '.cat-grid');
  assert.match(body, /overflow-y:\s*auto/);
  assert.match(body, /overflow-x:\s*hidden/);
  assert.match(body, /max-height:\s*max\(200px,\s*calc\(100dvh - var\(--cat-head\) - var\(--cat-peek\)\)\)/);
  assert.match(body, /max-height:\s*max\(200px,\s*calc\(100vh - var\(--cat-head\) - var\(--cat-peek\)\)\)/);
  assert.match(body, /--cat-peek:\s*72px/);
  // two site colours only for the scrollbar
  assert.match(body, /scrollbar-color:\s*var\(--earth\)\s+var\(--white\)/);
});

test('catalogue CSS uses no grey, radius, shadow or italics', () => {
  const css = read('site/assets/ui/catalog.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /gr[ae]y|#[0-9a-f]{3,6}\b|rgba?\(|opacity|box-shadow:\s*(?!none)|border-radius:\s*(?!0)|italic/i);
});

test('preview draws no border on the stage and no outline on the SVG', () => {
  const src = read('site/app/ui/preview.js');
  assert.doesNotMatch(src, /outline:1px solid/);
  const stage = src.match(/const stage = el\('div', '([^']*)'\)/);
  assert.ok(stage, 'stage element not found');
  assert.doesNotMatch(stage[1], /(^|;)border(-[a-z]+)?:/);
});

test('parameter groups use two columns from 900 px; headings and wide fields span both', () => {
  const css = read('site/assets/ui/paramPanel.css');
  const m = css.match(/@media \(min-width: 900px\) \{([\s\S]*?)\n\}/);
  assert.ok(m, '900 px media block not found');
  assert.match(m[1], /\.pp-group\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(m[1], /\.pp-group > \.pp-section,\s*\.pp-group > \.pp-wide,\s*\.pp-group > \.pp-msg\s*\{\s*grid-column:\s*1 \/ -1;/);
});

test('parameter panel CSS uses no grey, radius, shadow or italics', () => {
  const css = read('site/assets/ui/paramPanel.css').replace(/\/\*[\s\S]*?\*\//g, '');
  // (?!\s*…) so that "border-radius: 0" cannot pass by backtracking the whitespace
  assert.doesNotMatch(css, /gr[ae]y|#[0-9a-f]{3,6}\b|rgba?\(|opacity|box-shadow:(?!\s*none)|border-radius:(?!\s*0)|italic/i);
});

test('the parameter panel shows no "cannot change here" note and no internal key line', () => {
  const src = read('site/app/ui/paramPanel.js');
  assert.doesNotMatch(src, /変えられない項目|pp-unsupported|'pp-key'/);
});
