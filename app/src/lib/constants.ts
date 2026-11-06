import type { Family, Variant } from '../types';
import { label, sortV } from './font';

/** Show the bundled Google Fonts demo families (prototype prop `showDemo`). */
export const SHOW_DEMO = true;

/** Max variant chips shown on a library card before "+n". */
export const MAX_CHIPS = 6;

/** Deleted fonts stay in "Đã xóa gần đây" this long before being removed for good. */
export const TRASH_DAYS = 30;
export const TRASH_MS = TRASH_DAYS * 24 * 60 * 60 * 1000;

const R = (a: number, b: number, s = 100) => {
  const o: number[] = [];
  for (let w = a; w <= b; w += s) o.push(w);
  return o;
};

type DemoDef = [name: string, vn: boolean, weights?: number[], italics?: number[]];

const DEMO: DemoDef[] = [
  ['Be Vietnam Pro', true, [300, 400, 700, 900], [400, 700]],
  ['Poppins', true, [300, 400, 500, 600, 700], [400]],
  ['Lexend', true, R(100, 900), []],
  ['Montserrat', true, R(100, 900), R(100, 900)],
  ['Playfair Display', true, R(400, 900), R(400, 900)],
  ['Dancing Script', true, R(400, 700), []],
  ['Baloo 2', true, R(400, 800), []],
  ['Bungee', true],
  ['Pacifico', true],
  ['Lobster', true],
  ['Anton', true],
  ['Patrick Hand', true],
  ['Bebas Neue', false],
  ['Abril Fatface', false],
  ['Monoton', false],
  ['Righteous', false],
  ['Shrikhand', false],
];

export const buildDemoFamilies = (): Family[] =>
  DEMO.map(([n, vn, ws, its]) => {
    const fam = `'${n}'`;
    const vs: Variant[] = [
      ...(ws || [400]).map(w => ({ w, it: false })),
      ...(its || []).map(w => ({ w, it: true })),
    ].map(({ w, it }) => ({
      id: n + w + it,
      label: label(w, it),
      weight: w,
      italic: it,
      fam,
      fw: w,
      fs: it ? 'italic' : 'normal',
      fileUrl: null,
      fileName: '',
      ext: '',
    }));
    return {
      id: 'demo:' + n,
      name: n,
      vn,
      demo: true,
      img: null,
      link: 'https://fonts.google.com/specimen/' + n.replace(/ /g, '+'),
      variants: sortV(vs),
    };
  });

export const SAMPLES = [
  'Trăm năm trong cõi người ta',
  'Đường vô xứ Huế quanh quanh',
  'Phở bò tái nạm gầu gân',
  'ĂÂĐÊÔƠƯ ắằẳẵặ ếềểễệ ợựỵ',
];

export const GROUPS: [title: string, chars: string][] = [
  ['Chữ hoa', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  ['Chữ thường', 'abcdefghijklmnopqrstuvwxyz'],
  ['Việt · thường', 'ăâđêôơư àáảãạ ằắẳẵặ ầấẩẫậ èéẻẽẹ ềếểễệ ìíỉĩị òóỏõọ ồốổỗộ ờớởỡợ ùúủũụ ừứửữự ỳýỷỹỵ'],
  ['Việt · hoa', 'ĂÂĐÊÔƠƯ ẮẰẲẴẶ ẤẦẨẪẬ ẾỀỂỄỆ ỐỒỔỖỘ ỚỜỞỠỢ ỨỪỬỮỰ'],
  ['Số & dấu', '0123456789 .,:;!?&@#%()“”‘’-–—/'],
];

/** Body-text fonts the user commonly pairs with. */
export const PRESETS = ['Poppins', 'Garet', 'Open Sauce', 'Be Vietnam Pro', 'Montserrat', 'Lexend'];

export const DEFAULT_H_TEXT = 'Cà phê sữa đá, sáng thứ Bảy';
export const DEFAULT_B_TEXT =
  'Một ly cà phê sữa đá ở góc phố quen, tiếng xe máy lướt qua và mùi bánh mì vừa ra lò. Người Sài Gòn bắt đầu ngày cuối tuần như thế, chậm rãi và đủ đầy.';
