export interface Variant {
  id: string;
  label: string;
  weight: number;
  italic: boolean;
  /** CSS font-family value (quoted). */
  fam: string;
  fw: number | 'normal';
  fs: 'normal' | 'italic';
  fileUrl: string | null;
  fileName: string;
  ext: string;
  /** Font file contains Vietnamese letters (auto-detected). */
  vn?: boolean;
}

export interface Family {
  id: string;
  name: string;
  vn: boolean;
  demo: boolean;
  img: string | null;
  link?: string;
  /** Link the user pasted to where the font came from. */
  source?: string;
  /** When the font was moved to Recently deleted (ms). -1 = permanently removed demo font. */
  deletedAt?: number;
  variants: Variant[];
}

/** A family + variant index selection (null = default variant). */
export interface FontPick {
  id: string;
  vi: number | null;
}

export interface Pin {
  h: string;
  hvi: number;
  b: string;
  bvi: number;
}

export type Filter = 'all' | 'vn' | 'no';
export type View = 'lib' | 'mix' | 'trash';
