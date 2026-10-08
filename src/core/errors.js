/**
 * Error classes and the processed/skipped/failed counter used across the library.
 * Policy (docs/CONVENTIONS.md §9): never fail silently, never return empty output
 * in place of an error, and always list candidates for unknown names.
 */

export class ZcError extends Error {
  /** @param {string} message @param {object} [details] */
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

/** Raised when a spec / options object violates the schema. `errors` holds every issue found. */
export class SchemaError extends ZcError {
  /** @param {Array<{path:string,message:string,candidates?:string[]}>} errors @param {string} [context] */
  constructor(errors, context = '') {
    const head = context ? `${context}: ` : '';
    const lines = errors.map((e) => `  ${e.path || '/'}: ${e.message}`);
    super(`${head}${errors.length} schema error(s)\n${lines.join('\n')}`, { errors });
    this.errors = errors;
  }
}

/** Raised by every stage-1 stub. `owner` is the stage-1 assignee from docs/CONVENTIONS.md §11. */
export class NotImplementedError extends ZcError {
  /** @param {string} what @param {string} owner */
  constructor(what, owner) {
    super(`NOT IMPLEMENTED: ${what} (owner: ${owner})`, { what, owner });
    this.what = what;
    this.owner = owner;
  }
}

/** Raised when an id / name / symbol cannot be resolved, or resolves to several entries. */
export class ResolveError extends ZcError {
  /** @param {string} message @param {string[]} candidates */
  constructor(message, candidates = []) {
    const list = candidates.length ? `\n  candidates: ${candidates.join(', ')}` : '';
    super(`${message}${list}`, { candidates });
    this.candidates = candidates;
  }
}

/** Raised when output would exceed a hard limit (primitive count, pixel count). */
export class LimitError extends ZcError {}

/** Raised by archetype / motif code when a parameter combination cannot be drawn. */
export class GeometryError extends ZcError {}

/** @returns {{processed:number, skipped:number, failed:number}} */
export function makeCounts() {
  return { processed: 0, skipped: 0, failed: 0 };
}

/** Levenshtein distance (small strings only). */
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[n];
}

/**
 * Order `candidates` by closeness to `word` (case-insensitive edit distance).
 * Every candidate is returned; the closest come first.
 * @param {string} word @param {string[]} candidates @returns {string[]}
 */
export function rankCandidates(word, candidates) {
  const w = String(word).toLowerCase();
  return [...candidates]
    .map((c) => ({ c, d: editDistance(w, String(c).toLowerCase()) }))
    .sort((p, q) => p.d - q.d || String(p.c).localeCompare(String(q.c)))
    .map((p) => p.c);
}
