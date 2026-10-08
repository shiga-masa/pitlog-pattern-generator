import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 as zlibCrc32 } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  crc32,
  dosDateTime,
  createZip,
  createZipParts,
  zipSizeOf,
  ZipLimitError,
  ZIP_MAX_ENTRIES,
} from '../../site/app/zip.js';

const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

/**
 * Independent reader for the archive: walks the end record and the central directory, then checks
 * each local header against it. Uses only DataView and node:zlib's crc32.
 */
function readZip(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const endAt = buf.length - 22;
  assert.equal(v.getUint32(endAt, true), 0x06054b50, 'end-of-central-directory signature');
  const count = v.getUint16(endAt + 10, true);
  assert.equal(v.getUint16(endAt + 8, true), count);
  const cdSize = v.getUint32(endAt + 12, true);
  const cdStart = v.getUint32(endAt + 16, true);
  assert.equal(cdStart + cdSize, endAt, 'central directory ends at the end record');
  const out = [];
  let p = cdStart;
  for (let i = 0; i < count; i++) {
    assert.equal(v.getUint32(p, true), 0x02014b50, 'central header signature');
    const madeBy = v.getUint16(p + 4, true);
    const flags = v.getUint16(p + 8, true);
    const method = v.getUint16(p + 10, true);
    const time = v.getUint16(p + 12, true);
    const date = v.getUint16(p + 14, true);
    const crc = v.getUint32(p + 16, true);
    const csize = v.getUint32(p + 20, true);
    const usize = v.getUint32(p + 24, true);
    const nlen = v.getUint16(p + 28, true);
    const xlen = v.getUint16(p + 30, true);
    const clen = v.getUint16(p + 32, true);
    const off = v.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;

    assert.equal(v.getUint32(off, true), 0x04034b50, `local header signature of ${name}`);
    assert.equal(v.getUint16(off + 6, true), flags);
    assert.equal(v.getUint16(off + 8, true), method);
    assert.equal(v.getUint32(off + 14, true), crc);
    assert.equal(v.getUint32(off + 18, true), csize);
    assert.equal(v.getUint32(off + 22, true), usize);
    const lnlen = v.getUint16(off + 26, true);
    const lxlen = v.getUint16(off + 28, true);
    assert.equal(dec.decode(buf.subarray(off + 30, off + 30 + lnlen)), name);
    const data = buf.subarray(off + 30 + lnlen + lxlen, off + 30 + lnlen + lxlen + csize);
    out.push({ name, madeBy, flags, method, time, date, crc, csize, usize, data });
  }
  assert.equal(p, endAt);
  return out;
}

const DATE = new Date(2026, 9, 9, 13, 45, 31); // local time

const ENTRIES = [
  { name: 'svg/111101002_礫岩.svg', data: '<svg xmlns="http://www.w3.org/2000/svg"/>' },
  { name: 'png/t4-3--Sh_貝殻混じり.png', data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 255]) },
  { name: 'empty.bin', data: new Uint8Array(0) },
  { name: 'buf.bin', data: new Uint8Array([1, 2, 3]).buffer },
];

test('crc32 matches the published check values', () => {
  assert.equal(crc32(enc.encode('123456789')), 0xcbf43926);
  assert.equal(crc32(new Uint8Array(0)), 0);
  assert.equal(crc32(enc.encode('The quick brown fox jumps over the lazy dog')), 0x414fa339);
  assert.equal(crc32(enc.encode('a')), 0xe8b7be43);
});

test('crc32 agrees with node:zlib on random data', () => {
  const data = new Uint8Array(100000);
  let s = 12345;
  for (let i = 0; i < data.length; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    data[i] = s >>> 24;
  }
  assert.equal(crc32(data), zlibCrc32(data));
});

test('crc32 rejects non-byte input', () => {
  assert.throws(() => crc32('abc'), /Uint8Array/);
});

test('dosDateTime packs local time with 2-second resolution', () => {
  const { date, time } = dosDateTime(DATE);
  assert.equal(date >> 9, 2026 - 1980);
  assert.equal((date >> 5) & 0xf, 10);
  assert.equal(date & 0x1f, 9);
  assert.equal(time >> 11, 13);
  assert.equal((time >> 5) & 0x3f, 45);
  assert.equal((time & 0x1f) * 2, 30);
});

test('dosDateTime refuses dates outside 1980..2107', () => {
  assert.throws(() => dosDateTime(new Date(1979, 11, 31)), /1980\.\.2107/);
  assert.throws(() => dosDateTime(new Date(2108, 0, 1)), /1980\.\.2107/);
  assert.throws(() => dosDateTime(new Date(Number.NaN)), /valid Date/);
});

test('createZip writes stored entries that read back with the same names, bytes and CRC', () => {
  const zip = createZip(ENTRIES, { date: DATE });
  const got = readZip(zip);
  assert.deepEqual(got.map((e) => e.name), ENTRIES.map((e) => e.name));
  const { date, time } = dosDateTime(DATE);
  for (let i = 0; i < ENTRIES.length; i++) {
    const src = ENTRIES[i].data;
    const want = typeof src === 'string' ? enc.encode(src) : new Uint8Array(src);
    const e = got[i];
    assert.equal(e.method, 0, 'STORE');
    assert.equal(e.madeBy >> 8, 3, 'made by Unix (keeps unzip from re-coding the UTF-8 names)');
    assert.equal(e.flags & 0x0800, 0x0800, 'UTF-8 name flag');
    assert.equal(e.csize, want.length);
    assert.equal(e.usize, want.length);
    assert.deepEqual(new Uint8Array(e.data), want);
    assert.equal(e.crc, zlibCrc32(want));
    assert.equal(e.date, date);
    assert.equal(e.time, time);
  }
});

test('createZipParts concatenates to createZip and its length equals zipSizeOf', () => {
  const parts = createZipParts(ENTRIES, { date: DATE });
  const joined = Buffer.concat(parts.map((p) => Buffer.from(p.buffer, p.byteOffset, p.length)));
  const zip = createZip(ENTRIES, { date: DATE });
  assert.deepEqual(new Uint8Array(joined), zip);
  const sizes = ENTRIES.map((e) => ({
    name: e.name,
    size: typeof e.data === 'string' ? enc.encode(e.data).length : e.data.byteLength,
  }));
  assert.equal(zipSizeOf(sizes), zip.length);
});

test('an empty archive is just the end record', () => {
  const zip = createZip([], { date: DATE });
  assert.equal(zip.length, 22);
  assert.deepEqual(readZip(zip), []);
});

test('createZip refuses duplicate and unsafe names', () => {
  assert.throws(() => createZip([{ name: 'a.txt', data: '1' }, { name: 'a.txt', data: '2' }]), /duplicate/);
  assert.throws(() => createZip([{ name: '/abs.txt', data: '' }]), /unsafe/);
  assert.throws(() => createZip([{ name: 'a/../b.txt', data: '' }]), /unsafe/);
  assert.throws(() => createZip([{ name: 'a\\b.txt', data: '' }]), /unsafe/);
  assert.throws(() => createZip([{ name: '', data: '' }]), /non-empty name/);
  assert.throws(() => createZip([{ name: 'x', data: 3 }]), /Uint8Array, ArrayBuffer or string/);
});

test('zipSizeOf raises ZipLimitError past 4 GiB instead of writing ZIP64', () => {
  const big = [{ name: 'a.bin', size: 2 ** 31 }, { name: 'b.bin', size: 2 ** 31 }];
  assert.throws(() => zipSizeOf(big), (e) => e instanceof ZipLimitError && /4 GiB/.test(e.message));
  const fits = [{ name: 'a.bin', size: 0xffffffff - (22 + 30 + 46 + 2 * 5) }];
  assert.equal(zipSizeOf(fits), 0xffffffff);
  assert.throws(() => zipSizeOf([{ name: 'a.bin', size: fits[0].size + 1 }]), ZipLimitError);
});

test('zipSizeOf raises ZipLimitError past 65535 entries', () => {
  const items = Array.from({ length: ZIP_MAX_ENTRIES + 1 }, (_, i) => ({ name: `f${i}`, size: 0 }));
  assert.throws(() => zipSizeOf(items), (e) => e instanceof ZipLimitError && /65535/.test(e.message));
  assert.doesNotThrow(() => zipSizeOf(items.slice(0, ZIP_MAX_ENTRIES)));
  assert.throws(() => createZip(items.map((e) => ({ name: e.name, data: '' }))), ZipLimitError);
});

const hasUnzip = spawnSync('unzip', ['-v'], { encoding: 'utf8' }).status === 0;

test('the unzip command tests and extracts the archive byte for byte', { skip: hasUnzip ? false : 'unzip command not found' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'zipjs_tmp_'));
  try {
    const file = join(dir, 'a.zip');
    writeFileSync(file, createZip(ENTRIES, { date: DATE }));
    const t = spawnSync('unzip', ['-t', file], { encoding: 'utf8' });
    assert.equal(t.status, 0, t.stdout + t.stderr);
    assert.match(t.stdout, /No errors detected/);
    const outDir = join(dir, 'x');
    const x = spawnSync('unzip', ['-q', file, '-d', outDir], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } });
    assert.equal(x.status, 0, x.stdout + x.stderr);
    assert.deepEqual(readdirSync(join(outDir, 'svg')), ['111101002_礫岩.svg']);
    assert.deepEqual(readdirSync(join(outDir, 'png')), ['t4-3--Sh_貝殻混じり.png']);
    for (const e of ENTRIES) {
      const want = typeof e.data === 'string' ? enc.encode(e.data) : new Uint8Array(e.data);
      assert.deepEqual(new Uint8Array(readFileSync(join(outDir, e.name))), want, e.name);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
