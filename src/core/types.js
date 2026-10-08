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
 * @property {{x:number,y:number}} [offset] pt, density-scaled. Shifts the layer's anchor (CONVENTIONS §3.1):
 *   grid lattice, hatch/brick anchor, wave reference point, diagonalBand anchor, symbol anchor,
 *   scatter segments (after placement), edgeBand rows (y only). frameDiagonal rejects a non-zero offset.
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
 * @property {'center'|'topLeft'|{x:number,y:number}} [origin] spec-level anchor shared by every layer
 *   (CONVENTIONS §3.1; the meaning per archetype is listed there)
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
 * @property {'frame'|'period'|'fit'} tileMode 'period' also in fit mode (the region is then one fitted tile)
 * @property {{x:number,y:number}} fit period factors of tileMode 'fit' ({x:1,y:1} otherwise; core/fit.js)
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
 * @property {{x:number,y:number}} [pitch] lattice pitch actually used (pt, after density and fit); grid layers
 *   provide it, and a later grid layer with `relation` reads it (relation.to must be a grid layer)
 */

/**
 * @typedef {object} RenderMeta
 * @property {number} width output width in `unit`
 * @property {number} height
 * @property {'pt'|'mm'|'px'} unit
 * @property {number} dpi px per inch used for 'px' sizes and PNG (default 96 = CSS px; the site passes 300)
 * @property {{width:number,height:number}} region pt
 * @property {number} density
 * @property {number} strokeWidth pt
 * @property {string[]} warnings
 * @property {{mode:'frame'|'period'|'fit', periodic:boolean, tile:{width:number,height:number}, fit:{x:number,y:number}, adjust:(object|null)}} tiling
 * @property {{layers:{processed:number,skipped:number,failed:number}, instances:{placed:number,skipped:number}, primitives:number, knockout:Record<string,number>}} counts
 *   primitives = drawn after periodic copies and knockout; knockout = primitives removed per lower layer
 */

/**
 * @typedef {object} RenderResult
 * @property {string} svg complete <svg> document
 * @property {RenderMeta} meta
 */

export {};
