/**
 * Minimal ZIP writer (site/app). No dependencies, no DOM: runs in the browser and in node.
 *
 * Format (PKWARE APPNOTE 6.3): every entry is STORED (method 0, no compression) with its CRC-32,
 * the UTF-8 file-name flag (general purpose bit 11) and an MS-DOS date/time. No ZIP64: an archive
 * whose size or any offset would pass 0xFFFFFFFF bytes, or that has more than 65535 entries,
 * is refused with a ZipLimitError (nothing is truncated).
 *
 * API:
 *   crc32(bytes)                         -> uint32
 *   dosDateTime(date)                    -> {date, time} (local time, 2-second resolution)
 *   zipSizeOf([{name, size}])            -> archive bytes; throws ZipLimitError over the limits
 *   createZipParts(entries, {date})      -> Uint8Array[] (concatenate, or pass to new Blob(parts))
 *   createZip(entries, {date})           -> Uint8Array
 * An entry is {name: string, data: Uint8Array | ArrayBuffer | string}; a string is written as UTF-8.
 * Entries are written in the given order.
 */

export const ZIP_MAX_ENTRIES = 0xffff;
export const ZIP_MAX_BYTES = 0xffffffff;

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_END = 0x06054b50;
const VERSION = 20; // 2.0: version needed to extract
// "Version made by": host 3 (Unix), spec 2.0. With host 0 (MS-DOS) Info-ZIP unzip converts the
// names from the OEM code page even when the UTF-8 flag is set, which garbles Japanese names.
const MADE_BY = (3 << 8) | 20;
const UNIX_FILE_ATTRS = (0o100644 << 16) >>> 0; // regular file, rw-r--r--, in the high 16 bits
const FLAG_UTF8 = 0x0800;
const METHOD_STORE = 0;
const LOCAL_HEADER = 30;
const CENTRAL_HEADER = 46;
const END_RECORD = 22;

/** Thrown when the archive would need ZIP64 (size, offset or entry count over the 32/16-bit fields). */
export class ZipLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ZipLimitError';
  }
}

let CRC_TABLE = null;
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  CRC_TABLE = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC_TABLE[n] = c >>> 0;
  }
  return CRC_TABLE;
}

/**
 * CRC-32 (IEEE 802.3, reflected polynomial 0xEDB88320), as used by ZIP.
 * @param {Uint8Array} bytes
 * @returns {number} unsigned 32-bit
 */
export function crc32(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('crc32: bytes must be a Uint8Array');
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * MS-DOS date and time fields of a Date, in local time. Seconds are stored halved (2 s steps).
 * DOS dates cover 1980-01-01 .. 2107-12-31; a date outside that range is an error.
 * @param {Date} d
 * @returns {{date: number, time: number}}
 */
export function dosDateTime(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) throw new TypeError('dosDateTime: a valid Date is required');
  const y = d.getFullYear();
  if (y < 1980 || y > 2107) throw new RangeError(`dosDateTime: year ${y} is outside the MS-DOS range 1980..2107`);
  const date = ((y - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  return { date, time };
}

const encoder = new TextEncoder();

function toBytes(data, name) {
  if (typeof data === 'string') return encoder.encode(data);
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  throw new TypeError(`zip: data of "${name}" must be a Uint8Array, ArrayBuffer or string`);
}

/**
 * Check that an archive of these entries fits plain (non-ZIP64) ZIP fields, from the sizes alone.
 * Throws ZipLimitError when the entry count passes 65535, a name passes 65535 bytes, or the archive
 * (local headers + data + central directory + end record) passes 0xFFFFFFFF bytes.
 * @param {Array<{name: string, size: number}>} items
 * @returns {number} the archive size in bytes
 */
export function zipSizeOf(items) {
  if (items.length > ZIP_MAX_ENTRIES) {
    throw new ZipLimitError(`zip: ${items.length} entries exceed the ZIP limit of ${ZIP_MAX_ENTRIES} (ZIP64 is not supported)`);
  }
  let total = END_RECORD;
  for (const { name, size } of items) {
    const n = encoder.encode(name).length;
    if (n > 0xffff) throw new ZipLimitError(`zip: entry name "${name.slice(0, 40)}..." is ${n} bytes, over 65535`);
    if (!Number.isSafeInteger(size) || size < 0) throw new TypeError(`zip: size of "${name}" must be a non-negative integer`);
    total += LOCAL_HEADER + n + size + CENTRAL_HEADER + n;
  }
  if (total > ZIP_MAX_BYTES) {
    throw new ZipLimitError(`zip: archive would be ${total} bytes, over the ZIP limit of ${ZIP_MAX_BYTES} bytes (4 GiB; ZIP64 is not supported)`);
  }
  return total;
}

/**
 * Build the archive as a list of byte chunks (headers and file data, not copied).
 * @param {Array<{name: string, data: Uint8Array|ArrayBuffer|string}>} entries
 * @param {{date?: Date}} [opts] modification time of every entry (default: now)
 * @returns {Uint8Array[]}
 */
export function createZipParts(entries, opts = {}) {
  if (!Array.isArray(entries)) throw new TypeError('createZip: entries must be an array');
  const { date, time } = dosDateTime(opts.date ?? new Date());
  const names = new Set();
  const prepared = entries.map((entry) => {
    const name = entry?.name;
    if (typeof name !== 'string' || name === '') throw new TypeError('createZip: every entry needs a non-empty name');
    if (name.startsWith('/') || name.includes('\\') || name.split('/').includes('..')) {
      throw new TypeError(`createZip: unsafe entry name "${name}" (absolute, backslash or "..")`);
    }
    if (names.has(name)) throw new TypeError(`createZip: duplicate entry name "${name}"`);
    names.add(name);
    return { name, nameBytes: encoder.encode(name), data: toBytes(entry.data, name) };
  });
  zipSizeOf(prepared.map((e) => ({ name: e.name, size: e.data.length })));
  const parts = [];
  const central = [];
  let offset = 0;

  for (const { nameBytes, data } of prepared) {
    const crc = crc32(data);
    const localEnd = offset + LOCAL_HEADER + nameBytes.length + data.length;

    const lh = new Uint8Array(LOCAL_HEADER + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, SIG_LOCAL, true);
    lv.setUint16(4, VERSION, true);
    lv.setUint16(6, FLAG_UTF8, true);
    lv.setUint16(8, METHOD_STORE, true);
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); // compressed size = size (stored)
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra field length
    lh.set(nameBytes, LOCAL_HEADER);
    parts.push(lh, data);

    const ch = new Uint8Array(CENTRAL_HEADER + nameBytes.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, SIG_CENTRAL, true);
    cv.setUint16(4, MADE_BY, true);
    cv.setUint16(6, VERSION, true); // version needed
    cv.setUint16(8, FLAG_UTF8, true);
    cv.setUint16(10, METHOD_STORE, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    // 30 extra len, 32 comment len, 34 disk start, 36 internal attrs: all 0
    cv.setUint32(38, UNIX_FILE_ATTRS, true);
    cv.setUint32(42, offset, true);
    ch.set(nameBytes, CENTRAL_HEADER);
    central.push(ch);

    offset = localEnd;
  }

  const centralStart = offset;
  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(END_RECORD);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, SIG_END, true);
  ev.setUint16(4, 0, true); // this disk
  ev.setUint16(6, 0, true); // disk with central directory
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralStart, true);
  ev.setUint16(20, 0, true); // comment length
  return [...parts, ...central, end];
}

/**
 * Build the archive as one byte array.
 * @param {Array<{name: string, data: Uint8Array|ArrayBuffer|string}>} entries
 * @param {{date?: Date}} [opts]
 * @returns {Uint8Array}
 */
export function createZip(entries, opts = {}) {
  const parts = createZipParts(entries, opts);
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
