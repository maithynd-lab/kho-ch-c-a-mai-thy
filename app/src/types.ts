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
}

export interface Family {
  id: string;
  name: string;
  vn: boolean;
  demo: boolean;
  img: string | null;
  link?: string;
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
export type View = 'lib' | 'mix';
