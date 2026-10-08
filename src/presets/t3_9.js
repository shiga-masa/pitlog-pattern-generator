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
      notes: 'band 6.92 with the right band as a translation of the left (not a mirror). The report describes 4 arcs per period (one up arc then one down arc per row); measured on prim t3_9_p030_h2_r00 each row is two 4-segment arcs, the first (x 0-3.579) bulging up and the second (x 3.342-6.921) bulging down from the same chord, so the motif is lens {arcWidth 3.579, shift (3.342, 0)} (the waveUnit motif gave IoU 0.78 because its curve shape differs). arcHeight 1.088 = mean of the 12 arc heights (0.958-1.222). The two arcs of a row overlap by 0.24 (x 3.34-3.58); in rows 2 and 6 the second chord is 0.24 above the first (drafting variation, not reproduced; the verifier joins stroke ends within 0.3 pt, so the original counts as 12 rows + 2 inner lines). Each band is only its inner vertical line (x 6.921 / 49.343); the outer and top/bottom edges are the frame, so bandFrame.stroke is inner. The rows are hand-placed (gaps 4.23-4.35): rowY lists the measured chord y per row, same in both bands, 2.9, 7.117 (mean of 7.237 / 6.998), 11.359, 15.697, 20.058, 24.30 (replaces pitchY 4.29 + offset.y -0.73).',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'bands',
      archetype: 'edgeBand',
      params: {
        bandWidth: 6.92, sides: 'both', pitchY: 4.29,
        bandFrame: { stroke: 'inner' },
        rowY: [2.9, 7.117, 11.359, 15.697, 20.058, 24.3],
      },
      motif: { kind: 'lens', arcWidth: 3.579, arcHeight: 1.088, arcs: 2, shift: { x: 3.342, y: 0 } },
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
      notes: 'two arcs 5.6 wide and 1.45 high forming an eye. The report gives the second arc as 0.24 below the apex of the first arc; measured on prim t3_9_p030_h2_r01 the first (up) arc has its chord at y and apex at y-1.44, the second (down) arc starts 1.45 to the right with its chord at y-1.20/-1.22 (6 rows: -1.20, -1.22, -1.20, -1.22, -1.22, -1.20), so the motif shift between the arc chords is (1.45, -1.21). Lens bbox height 1.69 (measured 1.68). Row centres 3.74 ... 24.77 have mean 14.26 = frame centre, so no offset. pitchY 4.21 = mean of 5 row gaps (3.87, 4.59, 4.11, 4.60, 3.86; unequal, range 3.86-4.60). Each band is only its inner vertical line (the frame closes the band), so bandFrame.stroke is inner. The rows are hand-placed: rowY lists the measured lens bbox centres per row, 3.7385, 7.6085, 12.198, 16.3085, 20.909, 24.7675 (replaces pitchY).',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'lenses',
      archetype: 'edgeBand',
      params: {
        bandWidth: 6.92, sides: 'both', pitchY: 4.21,
        bandFrame: { stroke: 'inner' },
        rowY: [3.7385, 7.6085, 12.198, 16.3085, 20.909, 24.7675],
      },
      motif: { kind: 'lens', arcWidth: 5.6, arcHeight: 1.45, arcs: 2, shift: { x: 1.45, y: -1.21 } },
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
      notes: 'hook: horizontal 3.10 from the outer edge, horizontal 3.10 from the inner edge 2.90 lower, joined by an S curve. The S bulges to x 2.87-4.05 (span 1.18), but the hook motif joins the strokes with a monotone curve, so jog is the horizontal gap between the stroke ends, 3.82 - 3.10 = 0.72, which keeps the motif 6.92 wide (= band; with jog 1.18 it was 7.38 and crossed the band). The lateral bulge of the S is not representable (motif limitation). Hook bbox centres (top stroke + 1.45) are y 4.35, 8.45, 12.81, 17.15, 21.51, 25.63 (mean 14.98), 0.72 below the frame centre 14.26: offset.y 0.72. In the right band the strokes and the S do not meet (gaps 0.24), so the original counts 3 pieces per hook there (drafting variation). pitchY 4.26 = mean of 5 row gaps (4.10, 4.36, 4.34, 4.36, 4.12; unequal). Each band is only its inner vertical line (the frame closes the band), so bandFrame.stroke is inner. The rows are hand-placed: rowY lists the measured hook bbox centres (top stroke to bottom stroke, prim t3_9_p030_h2_r02, same in both bands): 4.3495, 8.4475, 12.809, 17.1465, 21.388, 25.63 (replaces pitchY + offset).',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'hooks',
      archetype: 'edgeBand',
      params: {
        bandWidth: 6.92, sides: 'both', pitchY: 4.26,
        bandFrame: { stroke: 'inner' },
        rowY: [4.3495, 8.4475, 12.809, 17.1465, 21.388, 25.63],
      },
      motif: { kind: 'hook', outerLen: 3.10, innerLen: 3.10, drop: 2.90, jog: 0.72 },
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
      notes: 'X spanning the band: width 6.92, height 7.13 (7.00-7.26). pitchY 7.13 = 28.52 / 4, so 4 rows fill the frame height exactly. Each band is only its inner vertical line (the frame closes the band), so bandFrame.stroke is inner.',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'xs',
      archetype: 'edgeBand',
      params: { bandWidth: 6.92, sides: 'both', pitchY: 7.13, bandFrame: { stroke: 'inner' } },
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
      notes: 'horizontal bar across the band, length 6.92. pitchY 3.57 = mean of 6 row gaps (3.50, 3.76, 3.50, 3.50, 3.76, 3.38; unequal). 7 bars, so 8 cells with the frame edges. Each band is only its inner vertical line (the frame closes the band), so bandFrame.stroke is inner. The bars are hand-placed and differ between the bands: rowY lists the measured bar y (prim t3_9_p030_h2_r04), left 3.619, 6.998, 10.88, 14.259, 17.877, 21.52, 24.899; right 3.38, 6.998, 10.64, 14.259, 17.638, 21.52, 24.899 (replaces pitchY).',
    },
    frame: { width: 56.24, height: 28.52 },
    stroke: { width: 0.238 },
    layers: [{
      id: 'bars',
      archetype: 'edgeBand',
      params: {
        bandWidth: 6.92, sides: 'both', pitchY: 3.57,
        bandFrame: { stroke: 'inner' },
        rowY: {
          left: [3.619, 6.998, 10.88, 14.259, 17.877, 21.52, 24.899],
          right: [3.38, 6.998, 10.64, 14.259, 17.638, 21.52, 24.899],
        },
      },
      motif: { kind: 'hline', length: 6.92 },
    }],
  },
];
