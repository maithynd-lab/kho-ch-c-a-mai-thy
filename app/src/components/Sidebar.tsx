import { SAMPLES } from '../lib/constants';

interface Props {
  counts: { all: number; files: number; vn: number };
  text: string;
  onText: (v: string) => void;
  sample: number | null;
  onSample: (i: number) => void;
  onPickFonts: () => void;
  trashCount: number;
  trashActive: boolean;
  onOpenTrash: () => void;
}

export function Sidebar(p: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">Kho chữ<span className="accent">.</span></div>
        <div className="mono-meta">{p.counts.all} font · {p.counts.files} file · {p.counts.vn} Việt Hóa</div>
      </div>

      <div className="dropzone" onClick={p.onPickFonts} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.onPickFonts(); } }}>
        <div className="dropzone-title">+ Thả font vào đây</div>
        <div className="dropzone-hint">.ttf .otf .woff + ảnh cùng tên. File cùng họ tự gộp.</div>
      </div>

      <div className="side-section">
        <div className="eyebrow">CHỮ TEST</div>
        <input id="test-text" className="field" value={p.text} onChange={e => p.onText(e.target.value)} placeholder="Để trống: hiện tên font" />
        <div className="sample-list">
          {SAMPLES.map((t, i) => (
            <button key={i} className={'sample-btn' + (!p.text && i === p.sample ? ' is-active' : '')} onClick={() => p.onSample(i)}>{t}</button>
          ))}
        </div>
      </div>

      <button className={'trash-link' + (p.trashActive ? ' is-active' : '')} onClick={p.onOpenTrash}>
        <span>🗑 Đã xóa gần đây</span>
        <span className="filter-n">{p.trashCount}</span>
      </button>
    </aside>
  );
}
