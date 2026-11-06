import type { Filter } from '../types';

const FILTERS: [Filter, string][] = [['all', 'Tất cả'], ['vn', 'Việt Hóa'], ['no', 'Chưa Việt Hóa']];

interface Props {
  value: Filter;
  onChange: (f: Filter) => void;
  counts?: Record<Filter, number>;
  size?: 'md' | 'sm';
}

export const matchFilter = (f: Filter, vn: boolean) => f === 'all' || (f === 'vn') === vn;

export function FilterPills({ value, onChange, counts, size = 'md' }: Props) {
  return (
    <div className={'pills pills-' + size} role="group" aria-label="Lọc Việt Hóa">
      {FILTERS.map(([k, label]) => (
        <button key={k} className={'pill' + (value === k ? ' is-active' : '')} aria-pressed={value === k} onClick={() => onChange(k)}>
          {label}{counts && <span className="pill-n">{counts[k]}</span>}
        </button>
      ))}
    </div>
  );
}
