/**
 * JSDoc type definitions (no runtime code). The runtime source of truth for keys, ranges,
 * defaults and density classes is the descriptor tree (core/schema.js + PARAMS / KINDS in
 * archetype and motif files); these typedefs mirror it for editors. CONVENTIONS §8.
 */

/**
 * @typedef {'ink'|'paper'|'none'} Paint
 * Paint token. The only way to name a colour inside a pattern (CONVENTIONS §5).
 */

/**
 * @typedef {object} Provenance
 * @property {'R1'|'R2'|'R3'|'R4'|'design'} doc
 * @property {string} section e.g. "1.1"
 * @property {boolean} measured
 * @property {string} [notes]
 */

/**
 * @typedef {object} Motif
 * @property {string} kind one of MOTIF_KINDS (src/motifs/index.js)
 * Other fields depend on the kind; sizes are FULL extents in pt (diameter, width, height).
 */

/**
 * @typedef {object} Layer
 * @property {string} id lowerCamelCase, unique in the spec
 * @property {'grid'|'brick'|'hatch'|'frameDiagonal'|'wave'|'scatter'|'diagonalBand'|'edgeBand'|'symbol'|'empty'} archetype
 * @property {Motif} [motif]
 * @property {object} [params] archetype parameters (PARAMS of the archetype file)
 * @property {{x:number,y:number}} [offset] pt, density-scaled
 * @property {number} [seed] uint32 label mixed with the spec seed
 * @property {number} [z] draw order (ascending, ties keep array order)
 * @property {number} [densityScale]
 * @property {{to:string, pitchRatio?:number, phase?:number}} [relation]
 * @property {'over'|'knockout'} [blend]
 * @property {boolean} [clip]
 */

/**
 * @typedef {object} PatternSpec
 * @property {string} schema "zc-pattern/1.x.y"
 * @property {string} id canonical id, e.g. "zc:111101002"
 * @property {string} table e.g. "3-1"
 * @property {string} [code] 9 digits
 * @property {string} [symbol]
 * @property {{ja:string, en?:string}} names
 * @property {Provenance} provenance
 * @property {string} [aliasOf] alias specs carry only head fields + aliasOf
 * @property {{width?:number,height?:number,show?:'none'|'ink',lineWidth?:number}} [frame]
 * @property {{width?:number,cap?:'butt'|'round'|'square',join?:'miter'|'round'|'bevel'}} [stroke]
 * @property {string} [ink] '#rrggbb', default '#000000'
 * @property {string} [paper] '#rrggbb', default '#ffffff'
 * @property {'paper'|'none'} [ground]
 * @property {boolean} [clip]
 * @property {number} [seed]
 * @property {'center'|'topLeft'|{x:number,y:number}} [origin]
 * @property {number} [jitter]
 * @property {Layer[]} [layers] required unless aliasOf
 */

/**
 * @typedef {Layer & {params: object, offset:{x:number,y:number}, z:number, densityScale:number, blend:string}} ResolvedLayer
 * Defaults filled and density applied: every length is final pt. Archetypes never rescale.
 */

/**
 * @typedef {object} LayerContext
 * @property {{x:number,y:number,width:number,height:number}} region drawing region (pt), x = y = 0
 * @property {'frame'|'period'|'fit'} tileMode
 * @property {number} strokeWidth final stroke width (pt)
 * @property {'center'|'topLeft'|{x:number,y:number}} origin
 * @property {number} jitter pt
 * @property {boolean} clip effective clip for this layer
 * @property {import('./rng.js').Rng} rng seeded stream of this layer
 * @property {Record<string, LayerResult>} results results of EARLIER layers (array order), for avoid / relation
 * @property {(motif:Motif, rng?:import('./rng.js').Rng) => object[]} buildMotif local primitives (CONVENTIONS §7.3)
 * @property {(motif:Motif) => {w:number,h:number}} motifExtent
 */

/**
 * @typedef {object} LayerResult
 * @property {object[]} primitives in region coordinates (core/primitives.js)
 * @property {number} placed instances drawn
 * @property {number} skipped instances not drawn (edgeMode 'whole', avoid); never hidden
 * @property {string[]} warnings
 * @property {Array<{x:number,y:number,row?:number,col?:number}>} [anchors] instance anchors (for avoid / relation)
 */

/**
 * @typedef {object} RenderMeta
 * @property {number} width output width in `unit`
 * @property {number} height
 * @property {'pt'|'mm'|'px'} unit
 * @property {{width:number,height:number}} region pt
 * @property {number} density
 * @property {number} strokeWidth pt
 * @property {string[]} warnings
 * @property {{layers:{processed:number,skipped:number,failed:number}, instances:{placed:number,skipped:number}, primitives:number}} counts
 */

/**
 * @typedef {object} RenderResult
 * @property {string} svg complete <svg> document
 * @property {RenderMeta} meta
 */

export {};
