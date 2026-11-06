import { useEffect, useState } from 'react';
import type { Family } from '../types';
import type { DownloadProps } from '../App';
import { GROUPS } from '../lib/constants';

interface Props {
  font: Family;
  si: number;
  txt: string;
  dl: DownloadProps;
  onClose: () => void;
  onSel: (i: number) => void;
  onMix: () => void;
  onPickImg: () => void;
  onRemove: () => void;
  onSource: (url: string) => void;
}

/** Accept pasted links with or without a scheme; reject anything that isn't http(s). */
const normalizeUrl = (raw: string) => {
  const t = raw.trim();
  if (!t) return '';
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : 'https://' + t);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch { return null; }
};

export function GlyphPanel({ font: f, si, txt, dl, onClose, onSel, onMix, onPickImg, onRemove, onSource }: Props) {
  const [draft, setDraft] = useState(f.source || '');
  const [bad, setBad] = useState(false);
  useEffect(() => { setDraft(f.source || ''); setBad(false); }, [f.id, f.source]);
  const commit = () => {
    const url = normalizeUrl(draft);
    if (url === null) { setBad(true); return; }
    setBad(false);
    setDraft(url);
    if (url !== (f.source || '')) onSource(url);
  };
  const cv = f.variants[si];
  const cvCss = { fontFamily: cv.fam, fontWeight: cv.fw, fontStyle: cv.fs };
  return (
    <div className="glyph-overlay" onClick={onClose}>
      <div className="glyph-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label={f.name}>
        <div className="glyph-head">
          <div className="glyph-titles">
            <div className="glyph-name">{f.name}</div>
            <div className="mono-meta mono-12">
              {f.variants.length} kiểu · {f.demo ? 'Google Fonts' : 'Đã tải lên'} · {f.vn ? 'Có Việt Hóa' : 'Chưa Việt Hóa'}
            </div>
          </div>
          <button className="round-x" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className="glyph-actions">
          <a className="btn-accent" href={dl.href} download={dl.download} target={dl.target}
            rel={dl.target ? 'noopener noreferrer' : undefined} onClick={dl.onClick}>{dl.label}</a>
          <button className="btn-outline-accent" onClick={onMix}>Mix với font text →</button>
          <button className="btn-outline" onClick={onPickImg}>{f.img ? 'Đổi ảnh preview' : 'Thêm ảnh preview'}</button>
          <button className="btn-outline btn-danger" onClick={onRemove}>Xóa font</button>
        </div>

        <div className="glyph-section">
          <label className="eyebrow" htmlFor="font-source">LINK NGUỒN FONT</label>
          <div className="source-row">
            <input
              id="font-source" className={'field source-input' + (bad ? ' is-bad' : '')} type="url" inputMode="url"
              placeholder="Dán link trang bạn tải font này…" value={draft}
              onChange={e => { setDraft(e.target.value); setBad(false); }}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur(); } }}
            />
            {f.source && !bad && draft === f.source && (
              <a className="btn-outline-accent btn-sm source-open" href={f.source} target="_blank" rel="noopener noreferrer">Mở link ↗</a>
            )}
          </div>
          {bad && <div className="source-err">Link chưa đúng. Hãy dán link bắt đầu bằng https://</div>}
        </div>

        <div className="glyph-section">
          <div className="eyebrow">CÁC KIỂU · BẤM ĐỂ XEM GLYPH</div>
          <div className="rule-list">
            {f.variants.map((v, i) => (
              <div key={v.id} className="vrow-item" onClick={() => onSel(i)}>
                <div className="vrow-info">
                  {i === si
                    ? <span className="vrow-name is-active">● {v.label}</span>
                    : <span className="vrow-name">{v.label}</span>}
                  <span className="vrow-meta">{(v.italic ? 'italic · ' : '') + v.weight}</span>
                </div>
                <div className="vrow-sample" style={{ fontFamily: v.fam, fontWeight: v.fw, fontStyle: v.fs }}>{txt}</div>
                {!f.demo && v.fileUrl
                  ? <a className="vrow-dl" href={v.fileUrl} download={v.fileName} onClick={e => e.stopPropagation()}>{v.ext} ↓</a>
                  : <span />}
              </div>
            ))}
          </div>
        </div>

        <div className="glyph-section">
          <div className="eyebrow">BẢNG KÝ TỰ · {cv.label.toUpperCase()}</div>
          <div className="rule-list">
            {GROUPS.map(([title, chars]) => (
              <div key={title} className="glyph-row">
                <div className="vrow-meta">{title}</div>
                <div className="glyph-chars" style={cvCss}>{chars}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
