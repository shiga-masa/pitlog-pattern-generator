/**
 * Preset registry: id -> spec, alias resolution, lookup by code / symbol / name (design §5.3).
 * CONVENTIONS §6, §9.
 *
 * - add() validates and throws on any error or duplicate id.
 * - addAll() never stops half-way silently: it returns {processed, skipped, failed, errors}
 *   and, when strict (default), throws after the whole batch if anything failed.
 * - resolveId() never picks the first of several matches: ambiguity is an error with candidates.
 */

import { ResolveError, ZcError, makeCounts, rankCandidates } from './errors.js';
import { assertValidSpec, DEFAULT_ENV } from './validate.js';

export class PatternRegistry {
  /** @param {{env?:object}} [o] */
  constructor(o = {}) {
    this.env = o.env ?? DEFAULT_ENV;
    /** @type {Map<string, object>} */
    this.specs = new Map();
    /** @type {Map<string, string>} id -> source label */
    this.sources = new Map();
  }

  get size() {
    return this.specs.size;
  }

  /** Validate and register one spec. @returns {string} id */
  add(spec, source = '(direct)') {
    assertValidSpec(spec, this.env);
    if (this.specs.has(spec.id)) {
      throw new ZcError(`duplicate preset id ${spec.id} (from ${source}; already registered from ${this.sources.get(spec.id)})`);
    }
    this.specs.set(spec.id, structuredClone(spec));
    this.sources.set(spec.id, source);
    return spec.id;
  }

  /**
   * Register a batch. @param {object[]} specs @param {string} source label (file name)
   * @param {{strict?:boolean}} [o]
   * @returns {{processed:number, skipped:number, failed:number, errors:Array<{index:number,id:string|undefined,source:string,message:string}>}}
   */
  addAll(specs, source, o = {}) {
    const strict = o.strict ?? true;
    if (!Array.isArray(specs)) throw new TypeError(`addAll(${source}): specs must be an array`);
    const report = { ...makeCounts(), errors: [] };
    specs.forEach((spec, index) => {
      try {
        this.add(spec, source);
        report.processed++;
      } catch (e) {
        report.failed++;
        report.errors.push({ index, id: spec?.id, source, message: e.message });
      }
    });
    if (strict && report.failed > 0) {
      const err = new ZcError(`${source}: ${report.failed} of ${specs.length} preset(s) failed\n${report.errors.map((x) => `  [${x.index}] ${x.id ?? '(no id)'}: ${x.message}`).join('\n')}`, { report });
      err.report = report;
      throw err;
    }
    return report;
  }

  /**
   * Check that every aliasOf target exists and no alias chain loops.
   * @returns {{processed:number, skipped:number, failed:number, errors:object[]}}
   */
  finalize() {
    const report = { ...makeCounts(), errors: [] };
    for (const id of this.specs.keys()) {
      try {
        this.resolveAlias(id);
        report.processed++;
      } catch (e) {
        report.failed++;
        report.errors.push({ id, message: e.message });
      }
    }
    return report;
  }

  /** Follow aliasOf to the drawing spec. @returns {{spec:object, chain:string[]}} */
  resolveAlias(id) {
    const chain = [id];
    let spec = this.specs.get(id);
    if (!spec) throw new ResolveError(`unknown preset id ${id}`, rankCandidates(id, [...this.specs.keys()]).slice(0, 10));
    while (spec.aliasOf) {
      if (chain.includes(spec.aliasOf)) throw new ResolveError(`alias loop: ${[...chain, spec.aliasOf].join(' -> ')}`);
      const next = this.specs.get(spec.aliasOf);
      if (!next) throw new ResolveError(`${chain[chain.length - 1]} is an alias of ${spec.aliasOf}, which is not registered`, rankCandidates(spec.aliasOf, [...this.specs.keys()]).slice(0, 10));
      chain.push(spec.aliasOf);
      spec = next;
    }
    return { spec, chain };
  }

  /** Deep copy of the drawing spec for `id` (aliases resolved). */
  get(id) {
    return structuredClone(this.resolveAlias(id).spec);
  }

  /** Deep copy of the registered entry itself (an alias stays an alias). */
  getRaw(id) {
    const s = this.specs.get(id);
    if (!s) throw new ResolveError(`unknown preset id ${id}`, rankCandidates(id, [...this.specs.keys()]).slice(0, 10));
    return structuredClone(s);
  }

  /** Ids whose aliasOf is `id` (computed; specs never store reverse lists). */
  aliasesOf(id) {
    return [...this.specs.values()].filter((s) => s.aliasOf === id).map((s) => s.id).sort();
  }

  /**
   * Resolve a query to a canonical id. Accepted forms:
   *   'zc:...' id, 9-digit code, 'sym:<symbol>', Japanese name (exact).
   * Several matches -> ResolveError listing them; none -> ResolveError with near candidates.
   */
  resolveId(query) {
    if (typeof query !== 'string' || !query.trim()) throw new ResolveError(`resolveId: empty query ${JSON.stringify(query)}`);
    const q = query.trim();
    const all = [...this.specs.values()];
    const one = (matches, what) => {
      if (matches.length === 1) return matches[0].id;
      if (matches.length > 1) throw new ResolveError(`${what} ${JSON.stringify(q)} is ambiguous (${matches.length} presets)`, matches.map((s) => `${s.id} (${s.names.ja})`));
      return null;
    };
    if (q.startsWith('zc:')) {
      if (this.specs.has(q)) return q;
      throw new ResolveError(`unknown preset id ${q}`, rankCandidates(q, [...this.specs.keys()]).slice(0, 10));
    }
    if (/^\d{9}$/.test(q)) {
      const hit = one(all.filter((s) => s.code === q), 'code');
      if (hit) return hit;
      throw new ResolveError(`unknown code ${q}`, rankCandidates(q, all.map((s) => s.code).filter(Boolean)).slice(0, 10));
    }
    if (q.startsWith('sym:')) {
      const sym = q.slice(4);
      const hit = one(all.filter((s) => s.symbol === sym), 'symbol');
      if (hit) return hit;
      throw new ResolveError(`unknown symbol ${sym}`, rankCandidates(sym, [...new Set(all.map((s) => s.symbol).filter(Boolean))]).slice(0, 10));
    }
    const hit = one(all.filter((s) => s.names.ja === q), 'name');
    if (hit) return hit;
    throw new ResolveError(`no preset matches ${JSON.stringify(q)} (forms: zc:<id>, <9-digit code>, sym:<symbol>, Japanese name)`, rankCandidates(q, all.map((s) => s.names.ja)).slice(0, 10));
  }

  /**
   * @param {{table?:string, archetype?:string, text?:string}} [f]
   * @returns {Array<{id:string, names:object, symbol?:string, code?:string, table:string, aliasOf?:string, archetypes:string[]}>}
   */
  list(f = {}) {
    const rows = [];
    for (const s of this.specs.values()) {
      if (f.table && s.table !== f.table) continue;
      const draw = this.resolveAlias(s.id).spec;
      const archetypes = draw.layers.map((l) => l.archetype);
      if (f.archetype && !archetypes.includes(f.archetype)) continue;
      if (f.text) {
        const hay = [s.id, s.code, s.symbol, s.names.ja, s.names.en].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(f.text.toLowerCase())) continue;
      }
      rows.push({ id: s.id, names: { ...s.names }, symbol: s.symbol, code: s.code, table: s.table, aliasOf: s.aliasOf, archetypes });
    }
    return rows.sort((a, b) => a.id.localeCompare(b.id));
  }
}
