import type { CSSProperties } from 'react';
import type { Family, FontPick, Pin, Variant } from '../types';
import { PRESETS } from '../lib/constants';
import { defIdx, key } from '../lib/font';

interface Props {
  pool: Family[];
  mixH: FontPick;
  setMixH: (p: FontPick) => void;
  mixB: FontPick;
  setMixB: (p: FontPick) => void;
  pins: Pin[];
  savePins: (p: Pin[]) => void;
  onMissingPreset: (name: string) => void;
  hText: string;
  onHText: (v: string) => void;
  bText: string;
  onBText: (v: string) => void;
  hq: string;
  onHQ: (v: string) => void;
  bq: string;
  onBQ: (v: string) => void;
}

const vOf = (f: Family, vi: number | null) => f.variants[vi != null && f.variants[vi] ? vi : defIdx(f.variants)];
const fontCss = (v: Variant): CSSProperties => ({ fontFamily: v.fam, fontWeight: v.fw, fontStyle: v.fs });
const pinKey = (p: Pin) => [p.h, p.hvi, p.b, p.bvi].join('|');

interface PickRow { f: Family; v: Variant; active: boolean; tag: string }

function PickList({ rows, txt, kind, onPick }: { rows: PickRow[]; txt: (f: Family) => string; kind: 'h' | 'b'; onPick: (f: Family) => void }) {
  return (
    <div className="pick-scroll">
      {rows.map(({ f, v, active, tag }) => (
        <div key={f.id} className={'pick' + (active ? ' is-active' : '')} onClick={() => { if (!active) onPick(f); }}>
          <div className={kind === 'h' ? 'pick-h' : 'pick-b'} style={fontCss(v)}>{txt(f)}</div>
          <div className="pick-meta"><span className="pick-name">{f.name}</span><span>{tag}</span></div>
        </div>
      ))}
    </div>
  );
}

function VariantRow({ title, f, cur, onPick }: { title: string; f: Family; cur: Variant; onPick: (i: number) => void }) {
  return (
    <div className="vrow">
      <span className="vrow-label">{title}</span>
      {f.variants.map((v, i) => (
        <button key={v.id} className={'pchip' + (v === cur ? ' is-active' : '')} onClick={() => onPick(i)}>{v.label}</button>
      ))}
    </div>
  );
}

export function MixView(p: Props) {
  const { pool } = p;
  const byId = (id: string) => pool.find(f => f.id === id);
  const hf = byId(p.mixH.id) || pool[0];
  const bf = byId(p.mixB.id) || pool[0];
  const hv = vOf(hf, p.mixH.vi);
  const bv = vOf(bf, p.mixB.vi);

  const found = PRESETS.map(n => ({ n, f: pool.find(x => key(x.name).includes(key(n))) }));
  const presetFonts = found.filter(x => x.f).map(x => x.f as Family);
  const missing = found.filter(x => !x.f).map(x => x.n);

  const hqq = p.hq.trim().toLowerCase();
  const hRows: PickRow[] = pool
    .filter(f => !hqq || f.name.toLowerCase().includes(hqq))
    .map(f => ({ f, v: vOf(f, f === hf ? p.mixH.vi : null), active: f === hf, tag: f.variants.length > 1 ? f.variants.length + ' kiểu' : '' }));

  const bqq = p.bq.trim().toLowerCase();
  const bOrder = [...presetFonts, ...pool.filter(f => !presetFonts.includes(f)).sort((a, b) => a.name.localeCompare(b.name))];
  const bRows: PickRow[] = bOrder
    .filter(f => !bqq || f.name.toLowerCase().includes(bqq))
    .map(f => ({ f, v: vOf(f, f === bf ? p.mixB.vi : null), active: f === bf, tag: presetFonts.includes(f) ? 'hay dùng' : '' }));

  const hvi = hf.variants.indexOf(hv), bvi = bf.variants.indexOf(bv);
  const curKey = pinKey({ h: hf.id, hvi, b: bf.id, bvi });
  const isPinned = p.pins.some(x => pinKey(x) === curKey);

  const pinCards = p.pins
    .map(pin => {
      const H = byId(pin.h), B = byId(pin.b);
      if (!H || !B) return null;
      const a = H.variants[pin.hvi] || H.variants[0], b = B.variants[pin.bvi] || B.variants[0];
      return { pin, H, B, a, b, k: pinKey(pin) };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <>
      <div className="mix">
        <div className="mix-pickers">
          <div className="panel">
            <div className="panel-head">
              <div className="eyebrow">HEADING</div>
              <input className="field field-sm" value={p.hq} onChange={e => p.onHQ(e.target.value)} placeholder="Tìm…" />
            </div>
            <PickList rows={hRows} kind="h" txt={f => p.hText || f.name} onPick={f => p.setMixH({ id: f.id, vi: null })} />
          </div>
          <div className="panel">
            <div className="panel-head">
              <div className="eyebrow">TEXT</div>
              <input className="field field-sm" value={p.bq} onChange={e => p.onBQ(e.target.value)} placeholder="Tìm…" />
            </div>
            {missing.length > 0 && (
              <div className="missing">
                {missing.map(n => (
                  <button key={n} className="missing-btn" title="Chưa có trong kho — bấm để tải lên" onClick={() => p.onMissingPreset(n)}>{n} +</button>
                ))}
              </div>
            )}
            <PickList rows={bRows} kind="b" txt={() => p.bText} onPick={f => p.setMixB({ id: f.id, vi: null })} />
          </div>
        </div>

        <div className="preview">
          <div className="preview-body">
            <div className="preview-top">
              <div className="preview-label" style={fontCss(bv)}>{hf.name} {hv.label} + {bf.name} {bv.label}</div>
              {isPinned
                ? <span className="pinned-note">✓ Đã có trong so sánh ↓</span>
                : <button className="pin-btn" onClick={() => p.savePins([...p.pins, { h: hf.id, hvi, b: bf.id, bvi }])}>+ Thêm vào so sánh</button>}
            </div>
            <textarea className="preview-h" rows={2} value={p.hText} onChange={e => p.onHText(e.target.value)} style={fontCss(hv)} />
            <textarea className="preview-b" rows={5} value={p.bText} onChange={e => p.onBText(e.target.value)} style={fontCss(bv)} />
          </div>
          <div className="preview-foot">
            <VariantRow title="HEADING" f={hf} cur={hv} onPick={i => p.setMixH({ id: hf.id, vi: i })} />
            <VariantRow title="TEXT" f={bf} cur={bv} onPick={i => p.setMixB({ id: bf.id, vi: i })} />
          </div>
        </div>
      </div>

      <div className="compare">
        <div className="compare-head">
          <div className="compare-title">So sánh</div>
          <div className="mono-meta mono-12">{pinCards.length} cặp · dùng chung chữ heading và text ở trên</div>
          {pinCards.length > 0 && <button className="ghost-btn compare-clear" onClick={() => p.savePins([])}>Xóa hết</button>}
        </div>
        {!pinCards.length && (
          <div className="compare-empty">
            Chọn một cặp heading + text ở trên rồi bấm <span className="accent strong">+ Thêm vào so sánh</span>. Thêm vài cặp để đặt cạnh nhau ở đây.
          </div>
        )}
        <div className="compare-grid">
          {pinCards.map(({ pin, H, B, a, b, k }, i) => (
            <div key={k} className="pin-card">
              <div className="pin-num">{String(i + 1).padStart(2, '0')}</div>
              <div className="pin-h" style={fontCss(a)}>{p.hText}</div>
              <div className="pin-b" style={fontCss(b)}>{p.bText}</div>
              <div className="pin-names">
                <span>H · {H.name} {a.label}</span>
                <span>T · {B.name} {b.label}</span>
              </div>
              <div className="pin-actions">
                {k === curKey
                  ? <span className="pin-current">Đang xem</span>
                  : <button className="pin-use" onClick={() => {
                      p.setMixH({ id: H.id, vi: pin.hvi });
                      p.setMixB({ id: B.id, vi: pin.bvi });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>Xem ở trên ↑</button>}
                <button className="pin-x" title="Bỏ khỏi so sánh" onClick={() => p.savePins(p.pins.filter(x => pinKey(x) !== k))}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
