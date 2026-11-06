import type { Filter } from '../types';
import { SAMPLES } from '../lib/constants';

interface Props {
  counts: { all: number; files: number; vn: number };
  q: string;
  onQ: (v: string) => void;
  filter: Filter;
  onFilter: (f: Filter) => void;
  tabCounts: Record<Filter, number>;
  text: string;
  onText: (v: string) => void;
  sample: number;
  onSample: (i: number) => void;
  onPickFonts: () => void;
  hiddenDemo: number;
  onRestoreDemo: () => void;
}

const FILTERS: [Filter, string][] = [['all', 'Tất cả'], ['vn', 'Việt Hóa'], ['no', 'Chưa Việt Hóa']];

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
        <div className="eyebrow">TÌM &amp; LỌC</div>
        <input className="field" value={p.q} onChange={e => p.onQ(e.target.value)} placeholder="Tìm font…" />
        <div className="filter-list">
          {FILTERS.map(([k, label]) => (
            <button key={k} className={'filter-btn' + (p.filter === k ? ' is-active' : '')} onClick={() => p.onFilter(k)}>
              <span>{label}</span>
              <span className="filter-n">{p.tabCounts[k]}</span>
            </button>
          ))}
        </div>
        {p.hiddenDemo > 0 && (
          <button className="restore-btn" onClick={p.onRestoreDemo}>↺ Khôi phục {p.hiddenDemo} font mẫu đã xóa</button>
        )}
      </div>

      <div className="side-section">
        <div className="eyebrow">CHỮ TEST</div>
        <input className="field" value={p.text} onChange={e => p.onText(e.target.value)} placeholder="Gõ gì đó…" />
        <div className="sample-list">
          {SAMPLES.map((t, i) => (
            <button key={i} className={'sample-btn' + (!p.text && i === p.sample ? ' is-active' : '')} onClick={() => p.onSample(i)}>{t}</button>
          ))}
        </div>
      </div>
    </aside>
  );
}
