import type { Family } from '../types';
import { TRASH_DAYS, TRASH_MS } from '../lib/constants';
import { defIdx } from '../lib/font';

interface Props {
  fonts: Family[];
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
  onPurgeAll: () => void;
  onBack: () => void;
}

const DAY = 24 * 60 * 60 * 1000;
const fmtDate = (t: number) => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function Trash({ fonts, onRestore, onPurge, onPurgeAll, onBack }: Props) {
  return (
    <div className="trash">
      <div className="trash-head">
        <div className="trash-titles">
          <div className="compare-title">Đã xóa gần đây</div>
          <div className="mono-meta mono-12">{fonts.length} font · tự xóa vĩnh viễn sau {TRASH_DAYS} ngày</div>
        </div>
        <div className="trash-head-actions">
          {fonts.length > 0 && <button className="ghost-btn danger-text" onClick={onPurgeAll}>Xóa tất cả</button>}
          <button className="ghost-btn" onClick={onBack}>← Về thư viện</button>
        </div>
      </div>

      {!fonts.length && (
        <div className="compare-empty">Chưa có font nào bị xóa. Font bạn xóa sẽ nằm ở đây {TRASH_DAYS} ngày để bạn khôi phục nếu cần.</div>
      )}

      <div className="rule-list">
        {fonts.map(f => {
          const v = f.variants[defIdx(f.variants)];
          const at = f.deletedAt as number;
          const left = Math.max(1, Math.ceil((at + TRASH_MS - Date.now()) / DAY));
          return (
            <div key={f.id} className="trash-row">
              <div className="trash-sample" style={{ fontFamily: v.fam, fontWeight: v.fw, fontStyle: v.fs }}>{f.name}</div>
              <div className="trash-meta">
                <span className="card-name">{f.name}</span>
                <span className="mono-meta">
                  {f.variants.length} kiểu · xóa ngày {fmtDate(at)} · <span className={left <= 3 ? 'danger-text' : ''}>còn {left} ngày</span>
                </span>
              </div>
              <div className="trash-actions">
                <button className="btn-outline-accent btn-sm" onClick={() => onRestore(f.id)}>Khôi phục</button>
                <button className="btn-outline btn-sm danger-text" onClick={() => onPurge(f.id)}>Xóa vĩnh viễn</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
