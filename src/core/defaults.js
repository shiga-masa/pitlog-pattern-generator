/**
 * Common-variable defaults (design §2.1) and hard limits (design §5.6).
 * Values come from the measured reports R1–R3; see the `source` notes.
 * Pattern colours: ink #000000, paper #ffffff (colors.js). The site's earth colour is UI-only.
 */

import { DEFAULT_INK, DEFAULT_PAPER } from './colors.js';

/** Frame sizes (pt) per table family. */
export const FRAMES = Object.freeze({
  rock: Object.freeze({ width: 56.03, height: 28.41 }), // R1 §0.2, R2 common
  soil: Object.freeze({ width: 56.44, height: 28.62 }), // R3 §0.3 (tables 4-1, 4-2)
  soilAux: Object.freeze({ width: 56.52, height: 28.30 }), // R3 §0.3 (table 4-3 cell)
});

/** Stroke widths (pt). */
export const STROKE_WIDTH = Object.freeze({
  rock: 0.239, // R1 §0.2
  soil: 0.2, // R3 §0.4
});

/** Frame line widths (pt). */
export const FRAME_LINE_WIDTH = Object.freeze({
  standard: 0.2, // R3 §0.3, R2 §54
  edgeBand: 0.238, // R2 §62
});

/**
 * Per-table defaults merged UNDER the spec's own values (spec wins).
 * Table 3-9: frame drawn, cap butt (R2 §62). Tables 4-1/4-2: frame drawn, sw 0.2 (R3 §0.3).
 * Table 4-3: no frame, sw 0.239 (design §1.5.9). Tables 5-1/5-2/5-3 hold aliases only (of 4-1/4-2/4-3).
 */
const TABLE_DEFAULTS = {
  rock: { frame: { ...FRAMES.rock, show: 'none', lineWidth: FRAME_LINE_WIDTH.standard }, stroke: { width: STROKE_WIDTH.rock, cap: 'round', join: 'miter' } },
  rockBand: { frame: { ...FRAMES.rock, show: 'ink', lineWidth: FRAME_LINE_WIDTH.edgeBand }, stroke: { width: STROKE_WIDTH.rock, cap: 'butt', join: 'miter' } },
  soil: { frame: { ...FRAMES.soil, show: 'ink', lineWidth: FRAME_LINE_WIDTH.standard }, stroke: { width: STROKE_WIDTH.soil, cap: 'round', join: 'miter' } },
  soilAux: { frame: { ...FRAMES.soilAux, show: 'none', lineWidth: FRAME_LINE_WIDTH.standard }, stroke: { width: STROKE_WIDTH.rock, cap: 'round', join: 'miter' } },
};

const FAMILY_OF_TABLE = {
  '3-1': 'rock', '3-2': 'rock', '3-3': 'rock', '3-4': 'rock', '3-5': 'rock', '3-6': 'rock', '3-7': 'rock', '3-8': 'rock',
  '3-9': 'rockBand', '4-1': 'soil', '4-2': 'soil', '4-3': 'soilAux', '5-1': 'soil', '5-2': 'soil', '5-3': 'soilAux',
};

/**
 * @param {string} table e.g. '3-1'
 * @returns {{frame:{width:number,height:number,show:string,lineWidth:number}, stroke:{width:number,cap:string,join:string}}}
 */
export function defaultsForTable(table) {
  const fam = FAMILY_OF_TABLE[table];
  if (!fam) throw new Error(`defaultsForTable: unknown table ${JSON.stringify(table)}; known: ${Object.keys(FAMILY_OF_TABLE).join(', ')}`);
  return structuredClone(TABLE_DEFAULTS[fam]);
}

/** Render-option defaults (design §5.2, §5.6). */
export const RENDER_DEFAULTS = Object.freeze({
  density: 1,
  motifScale: 'follow',
  strokeScale: 1,
  tileMode: 'frame',
  dpi: 96,
  unit: 'pt',
  ink: DEFAULT_INK,
  paper: DEFAULT_PAPER,
});

/** Hard limits (design §5.6). Exceeding them raises LimitError; nothing is truncated. */
export const LIMITS = Object.freeze({
  maxPrimitives: 200000,
  maxSidePx: 8192,
  maxPixels: 5e7,
});

/** Decimal places written to SVG coordinates (CONVENTIONS §3). */
export const SVG_DECIMALS = 3;
/** Geometric tolerance (pt) for "inside the frame" tests (CONVENTIONS §3). */
export const EPS = 1e-6;
