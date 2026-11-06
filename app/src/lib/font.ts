import type { Variant } from '../types';

const WN: Record<number, string> = {
  100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium',
  600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
};

const STYLE_W: Record<string, number> = {
  thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400,
  normal: 400, book: 400, roman: 400, medium: 500, semibold: 600, demibold: 600, bold: 700,
  extrabold: 800, ultrabold: 800, black: 900, heavy: 900,
};

export const FONT_RE = /\.(ttf|otf|woff2?)$/i;

/** Normalised comparison key for family names / file names. */
export const key = (n: string) => n.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const label = (w: number, it: boolean) => {
  const b = WN[Math.round(w / 100) * 100] || String(w);
  return it ? (b === 'Regular' ? 'Italic' : b + ' Italic') : b;
};

export const sortV = <T extends Pick<Variant, 'italic' | 'weight'>>(vs: T[]) =>
  vs.sort((a, b) => Number(a.italic) - Number(b.italic) || a.weight - b.weight);

export const defIdx = (vs: Pick<Variant, 'italic' | 'weight'>[]) => {
  const i = vs.findIndex(v => !v.italic && v.weight === 400);
  return i < 0 ? 0 : i;
};

export const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const str = (dv: DataView, o: number, n: number) => {
  let s = '';
  for (let i = 0; i < n; i++) s += String.fromCharCode(dv.getUint8(o + i));
  return s;
};

interface Tables { name: DataView | null; os2: DataView | null }

/** Locate the `name` and `OS/2` tables in a TTF/OTF/WOFF buffer. WOFF2 & TTC are skipped. */
async function readTables(buf: ArrayBuffer): Promise<Tables> {
  const dv = new DataView(buf);
  const tag = dv.getUint32(0);
  const out: Tables = { name: null, os2: null };
  if (tag === 0x774f4646) {
    // WOFF 1.0
    const n = dv.getUint16(12);
    for (let i = 0; i < n; i++) {
      const o = 44 + i * 20, t = str(dv, o, 4);
      if (t !== 'name' && t !== 'OS/2') continue;
      const off = dv.getUint32(o + 4), comp = dv.getUint32(o + 8), orig = dv.getUint32(o + 12);
      let bytes = new Uint8Array(buf, off, comp);
      if (comp !== orig) {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
        bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      }
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (t === 'name') out.name = view; else out.os2 = view;
    }
    return out;
  }
  if (tag === 0x774f4632 || tag === 0x74746366) return out; // wOF2 / ttcf
  const n = dv.getUint16(4);
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16, t = str(dv, o, 4);
    if (t === 'name') out.name = new DataView(buf, dv.getUint32(o + 8), dv.getUint32(o + 12));
    if (t === 'OS/2') out.os2 = new DataView(buf, dv.getUint32(o + 8), dv.getUint32(o + 12));
  }
  return out;
}

/** Read name IDs 1, 2, 16, 17 preferring Windows/en-US records. */
function parseName(dv: DataView | null): Record<number, string> {
  const best: Record<number, { s: string; p: number }> = {};
  if (!dv) return {};
  const n = dv.getUint16(2), so = dv.getUint16(4);
  for (let i = 0; i < n; i++) {
    const o = 6 + i * 12;
    const pid = dv.getUint16(o), lang = dv.getUint16(o + 4), id = dv.getUint16(o + 6);
    const len = dv.getUint16(o + 8), off = dv.getUint16(o + 10);
    if (![1, 2, 16, 17].includes(id)) continue;
    let s = '';
    if (pid === 3 || pid === 0) {
      for (let j = 0; j + 1 < len; j += 2) s += String.fromCharCode(dv.getUint16(so + off + j));
    } else if (pid === 1) {
      for (let j = 0; j < len; j++) s += String.fromCharCode(dv.getUint8(so + off + j));
    } else continue;
    const p = pid === 3 && lang === 0x409 ? 3 : pid === 1 ? 1 : 2;
    if (!best[id] || best[id].p < p) best[id] = { s: s.trim(), p };
  }
  const r: Record<number, string> = {};
  for (const k in best) r[k] = best[k].s;
  return r;
}

/** Guess family / weight / italic from a file name such as `Gilroy-BoldItalic.otf`. */
function fromFilename(fn: string) {
  const toks = fn.replace(/\.[^.]+$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').split(/[-_\s]+/).filter(Boolean);
  let w = 400, it = false, cut = toks.length;
  for (let i = toks.length - 1; i > 0; i--) {
    const t = toks[i].toLowerCase();
    const t2 = (toks[i - 1] + toks[i]).toLowerCase();
    if (t === 'italic' || t === 'oblique' || t === 'it') { it = true; cut = i; continue; }
    if (STYLE_W[t2] && i - 1 > 0) { w = STYLE_W[t2]; cut = i - 1; i--; continue; }
    if (STYLE_W[t]) { w = STYLE_W[t]; cut = i; continue; }
    if (/^(extra|ultra|semi|demi)$/.test(t)) { cut = i; continue; }
    break;
  }
  return { family: toks.slice(0, cut).join(' '), weight: w, italic: it };
}

export interface FontInfo { family: string; weight: number; italic: boolean; label: string }

export async function inspect(file: File, buf: ArrayBuffer): Promise<FontInfo> {
  const fb = fromFilename(file.name);
  let family = fb.family, weight = fb.weight, italic = fb.italic, sub: string | null = null;
  try {
    const t = await readTables(buf);
    const nm = parseName(t.name);
    if (nm[16] || nm[1]) family = nm[16] || nm[1];
    sub = nm[17] || nm[2] || null;
    if (t.os2 && t.os2.byteLength >= 64) {
      weight = t.os2.getUint16(4) || weight;
      italic = !!(t.os2.getUint16(62) & 0x201);
    }
  } catch {
    /* fall back to file-name guess */
  }
  if (sub && /italic|oblique/i.test(sub)) italic = true;
  return { family: family || fb.family, weight, italic, label: sub || label(weight, italic) };
}

/** Heuristic: does the CSS font family render Vietnamese glyphs (vs. falling back)? */
export function detectVN(fam: string) {
  const c = document.createElement('canvas').getContext('2d');
  if (!c) return false;
  let miss = 0;
  for (const ch of 'ăâđêôơưắằẳẵặấầẩẫậếềểễệốồổỗộớờởỡợứừửữựỳýỷỹỵ') {
    let m = 0;
    for (const fb of ['monospace', 'serif']) {
      c.font = `40px ${fam}, ${fb}`;
      const a = c.measureText(ch).width;
      c.font = `40px ${fb}`;
      if (Math.abs(a - c.measureText(ch).width) < 0.01) m++;
    }
    if (m === 2) miss++;
  }
  return miss <= 2;
}
