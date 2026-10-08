/**
 * Presets for R2 §62–§66 (table 3-9, fault and crush-zone auxiliary patterns).
 * Owner: preset-3 (stage 1). Rules: docs/CONVENTIONS.md §6 (ids), §10 (presets).
 *
 * One object per preset. Every value comes from the cited report section (provenance.section);
 * values not in the report are never written. Unmeasured values: null + provenance.measured = false.
 * These are edgeBand patterns: a 6.92 pt band on each side, drawn over a main pattern (the centre 42.4 pt is empty).
 * Table 3-9 rows have no code and no symbol; their ids are zc:t3-9:<1-5> (CONVENTIONS §6).
 */

/** @type {import('../core/types.js').PatternSpec[]} */
export const PRESETS = [
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t3-9:1',
    table: '3-9',
    names: { ja: 'シュードタキライト化' },
    provenance: {
      doc: 'R2',
      section: '§62',
      measured: true,
      notes: 'band 6.92 with the right band as a translation of the left (not a mirror). Motif: one wave period = 6.92 (waveUnit unit width 2 x 3.46), amplitude 1.1 each way (height 2.2). pitchY 4.29 = centre of the measured 4.23-4.35 (no row list in the report; unequal). The report describes 4 arcs per period; waveUnit is the nearest available motif.',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'bands',
      archetype: 'edgeBand',
      params: { bandWidth: 6.92, sides: 'both', pitchY: 4.29 },
      motif: { kind: 'waveUnit', halfWidth: 3.46, height: 2.2 },
    }],
  },
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t3-9:2',
    table: '3-9',
    names: { ja: 'マイロナイト化' },
    provenance: {
      doc: 'R2',
      section: '§63',
      measured: true,
      notes: 'two arcs 5.6 wide and 1.45 high, second shifted by (1.45, 0.24) to form an eye. pitchY 4.21 = mean of 5 row gaps (3.87, 4.59, 4.11, 4.60, 3.86; unequal, range 3.86-4.60).',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'lenses',
      archetype: 'edgeBand',
      params: { bandWidth: 6.92, sides: 'both', pitchY: 4.21 },
      motif: { kind: 'lens', arcWidth: 5.6, arcHeight: 1.45, arcs: 2, shift: { x: 1.45, y: 0.24 } },
    }],
  },
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t3-9:3',
    table: '3-9',
    names: { ja: 'カタクラサイト化' },
    provenance: {
      doc: 'R2',
      section: '§64',
      measured: true,
      notes: 'hook: horizontal 3.10 from the outer edge, horizontal 3.10 from the inner edge 2.90 lower, joined by an S whose horizontal span is jog 1.18 (x 2.87-4.05). pitchY 4.26 = mean of 5 row gaps (4.10, 4.36, 4.34, 4.36, 4.12; unequal).',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'hooks',
      archetype: 'edgeBand',
      params: { bandWidth: 6.92, sides: 'both', pitchY: 4.26 },
      motif: { kind: 'hook', outerLen: 3.10, innerLen: 3.10, drop: 2.90, jog: 1.18 },
    }],
  },
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t3-9:4',
    table: '3-9',
    names: { ja: '角礫状' },
    provenance: {
      doc: 'R2',
      section: '§65',
      measured: true,
      notes: 'X spanning the band: width 6.92, height 7.13 (7.00-7.26). pitchY 7.13 = 28.52 / 4, so 4 rows fill the frame height exactly.',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'xs',
      archetype: 'edgeBand',
      params: { bandWidth: 6.92, sides: 'both', pitchY: 7.13 },
      motif: { kind: 'X', width: 6.92, height: 7.13 },
    }],
  },
  {
    schema: 'zc-pattern/1.0.0',
    id: 'zc:t3-9:5',
    table: '3-9',
    names: { ja: '砂・礫混じり粘土状' },
    provenance: {
      doc: 'R2',
      section: '§66',
      measured: true,
      notes: 'horizontal bar across the band, length 6.92. pitchY 3.57 = mean of 6 row gaps (3.50, 3.76, 3.50, 3.50, 3.76, 3.38; unequal). 7 bars, so 8 cells with the frame edges.',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'bars',
      archetype: 'edgeBand',
      params: { bandWidth: 6.92, sides: 'both', pitchY: 3.57 },
      motif: { kind: 'hline', length: 6.92 },
    }],
  },
];
