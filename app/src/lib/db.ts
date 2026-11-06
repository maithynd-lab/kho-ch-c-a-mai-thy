/** IndexedDB persistence — same DB/schema as the prototype so existing data carries over. */

export interface StoredVariant {
  id: string;
  label: string;
  weight: number;
  italic: boolean;
  fileName: string;
  blob: Blob;
}

export interface FamilyRecord {
  id: string;
  name: string;
  vn: boolean;
  imgBlob: Blob | null;
  added: number;
  variants: StoredVariant[];
}

/** v1 prototype store: one record per font file. */
export interface LegacyRecord { fontBlob?: Blob; fileName: string }

const openDb = () =>
  new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open('khochu', 2);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains('families')) r.result.createObjectStore('families', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T | null> {
  const db = await openDb();
  if (!db.objectStoreNames.contains(store)) return null;
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => res(out ? (out.result as T) : null);
    t.onerror = () => rej(t.error);
  });
}

export const getAllFamilies = async () => (await tx<FamilyRecord[]>('families', 'readonly', s => s.getAll())) || [];
export const putFamily = (r: FamilyRecord) => tx('families', 'readwrite', s => s.put(r));
export const deleteFamily = (id: string) => tx('families', 'readwrite', s => s.delete(id));
export const getLegacy = () => tx<LegacyRecord[]>('fonts', 'readonly', s => s.getAll());
export const clearLegacy = () => tx('fonts', 'readwrite', s => s.clear());

const HIDDEN_KEY = 'khochu_hidden_demo';
export const loadHiddenDemo = (): string[] => {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'); } catch { return []; }
};
export const storeHiddenDemo = (ids: string[]) => {
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
};

const PINS_KEY = 'khochu_pins';
export const loadPins = <T,>(): T[] => {
  try { return JSON.parse(localStorage.getItem(PINS_KEY) || '[]'); } catch { return []; }
};
export const storePins = (pins: unknown[]) => {
  try { localStorage.setItem(PINS_KEY, JSON.stringify(pins)); } catch { /* storage unavailable */ }
};
