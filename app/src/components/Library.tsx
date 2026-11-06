import { useState } from 'react';
import type { Family } from '../types';
import type { DownloadProps } from '../App';
import { MAX_CHIPS } from '../lib/constants';

interface Props {
  fonts: Family[];
  txt: string;
  selOf: (f: Family) => number;
  onSel: (id: string, i: number) => void;
  onOpen: (id: string) => void;
  onDropOn: (id: string, files: FileList) => void;
  dlProps: (f: Family) => DownloadProps;
  onRemove: (id: string) => void;
}

export function Library({ fonts, txt, selOf, onSel, onOpen, onDropOn, dlProps, onRemove }: Props) {
  // Card whose delete button was pressed once and now asks for confirmation.
  const [armed, setArmed] = useState<string | null>(null);
  return (
    <div className="lib">
      {!fonts.length && <div className="empty">Không có font nào khớp.</div>}
      <div className="lib-grid">
        {fonts.map(f => {
          const si = selOf(f);
          const pv = f.variants[si];
          const fontStyle = { fontFamily: pv.fam, fontWeight: pv.fw, fontStyle: pv.fs };
          const chips = f.variants.slice(0, MAX_CHIPS).map((v, i) => ({ label: v.label, i }));
          if (si >= MAX_CHIPS) chips.push({ label: pv.label, i: si });
          const dl = dlProps(f);
          return (
            <div
              key={f.id}
              className="card"
              onClick={() => onOpen(f.id)}
              onMouseLeave={() => { if (armed === f.id) setArmed(null); }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); onDropOn(f.id, e.dataTransfer.files); }}
            >
              <div className="card-media">
                <button
                  className={'card-del' + (armed === f.id ? ' is-armed' : '')}
                  title={armed === f.id ? 'Bấm lần nữa để xóa' : 'Xóa font'}
                  aria-label={'Xóa ' + f.name}
                  onClick={e => {
                    e.stopPropagation();
                    if (armed === f.id) { setArmed(null); onRemove(f.id); } else setArmed(f.id);
                  }}
                >{armed === f.id ? 'Xóa?' : '✕'}</button>
                {f.img
                  ? <div className="card-img" style={{ backgroundImage: `url(${f.img})` }} />
                  : <div className="card-aa" style={fontStyle}>Aa</div>}
              </div>
              <div className="card-body">
                <div className="card-sample" style={fontStyle}>{txt}</div>
                <div className="chips">
                  {chips.map(c => (
                    <button key={c.i} className={'chip' + (c.i === si ? ' is-active' : '')}
                      onClick={e => { e.stopPropagation(); onSel(f.id, c.i); }}>{c.label}</button>
                  ))}
                  {f.variants.length > MAX_CHIPS && <span className="chip-more">+{f.variants.length - MAX_CHIPS}</span>}
                </div>
                <div className="card-foot">
                  <div className="card-meta">
                    <div className="card-name">{f.name}</div>
                    <div className="mono-meta">{f.variants.length} kiểu · {f.demo ? 'Google Fonts' : 'Đã tải lên'}</div>
                  </div>
                  {f.vn && <span className="vn-badge">VIỆT HÓA</span>}
                  <a className="dl-round" href={dl.href} download={dl.download} target={dl.target}
                    rel={dl.target ? 'noopener noreferrer' : undefined} onClick={dl.onClick} title={dl.title}>↓</a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
