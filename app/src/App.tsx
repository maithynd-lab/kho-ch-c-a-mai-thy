import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { Family, Filter, FontPick, Pin, Variant, View } from './types';
import { buildDemoFamilies, DEFAULT_B_TEXT, DEFAULT_H_TEXT, SAMPLES, SHOW_DEMO, TRASH_DAYS, TRASH_MS } from './lib/constants';
import { defIdx, detectVN, fileHasVN, FONT_RE, inspect, key, sortV, uid } from './lib/font';
import { clearLegacy, deleteFamily, getAllFamilies, getLegacy, loadHiddenDemo, loadPins, putFamily, storeHiddenDemo, storePins, type FamilyRecord } from './lib/db';
import { Sidebar } from './components/Sidebar';
import { Library } from './components/Library';
import { MixView } from './components/MixView';
import { GlyphPanel } from './components/GlyphPanel';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Trash } from './components/Trash';

type VariantSeed = Pick<Variant, 'id' | 'label' | 'weight' | 'italic' | 'fileName'>;

export interface DownloadProps {
  href: string;
  download?: string;
  target?: string;
  title: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}

export default function App() {
  const [fonts, setFonts] = useState<Family[]>(buildDemoFamilies);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [sample, setSample] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'trash' | 'purge' | 'purgeAll'; id?: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [glyph, setGlyph] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, number>>({});
  const [toast, setToast] = useState('');
  const [view, setView] = useState<View>('lib');
  const [mixH, setMixH] = useState<FontPick>({ id: 'demo:Playfair Display', vi: 2 });
  const [mixB, setMixB] = useState<FontPick>({ id: 'demo:Poppins', vi: null });
  const [pins, setPins] = useState<Pin[]>(() => loadPins<Pin>());
  const [hText, setHText] = useState(DEFAULT_H_TEXT);
  const [bText, setBText] = useState(DEFAULT_B_TEXT);
  const [hq, setHQ] = useState('');
  const [bq, setBQ] = useState('');
  const [hFilter, setHFilter] = useState<Filter>('all');
  const [bFilter, setBFilter] = useState<Filter>('all');

  const fontsRef = useRef(fonts);
  fontsRef.current = fonts;
  const vblobs = useRef<Record<string, Blob>>({});
  const imgs = useRef<Record<string, Blob>>({});
  const added = useRef<Record<string, number>>({});
  const fontInput = useRef<HTMLInputElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const pendingImg = useRef<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const booted = useRef(false);

  const flash = (t: string) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2800);
  };

  const save = (f: Family) => {
    const rec: FamilyRecord = {
      id: f.id,
      name: f.name,
      vn: f.vn,
      imgBlob: imgs.current[f.id] || null,
      added: added.current[f.id] || Date.now(),
      source: f.source || '',
      deletedAt: f.deletedAt || 0,
      variants: f.demo
        ? []
        : f.variants.map(v => ({ id: v.id, label: v.label, weight: v.weight, italic: v.italic, fileName: v.fileName, blob: vblobs.current[v.id] })),
    };
    putFamily(rec).catch(e => console.warn(e));
  };

  const loadVariant = async (v: VariantSeed, blob: Blob): Promise<Variant> => {
    const css = 'uv_' + v.id;
    const buf = await blob.arrayBuffer();
    const ff = new FontFace(css, buf.slice(0));
    await ff.load();
    document.fonts.add(ff);
    vblobs.current[v.id] = blob;
    const m = v.fileName.match(/\.([^.]+)$/);
    // Việt Hóa is read from the file's character map; WOFF2 falls back to a render check.
    const vn = (await fileHasVN(buf)) ?? detectVN(`'${css}'`);
    return { ...v, fam: `'${css}'`, fw: 'normal', fs: 'normal', fileUrl: URL.createObjectURL(blob), ext: m ? m[1].toUpperCase() : 'FONT', vn };
  };

  const hydrate = async (r: FamilyRecord) => {
    if (r.id.startsWith('demo:')) {
      if (r.imgBlob) imgs.current[r.id] = r.imgBlob;
      const img = r.imgBlob ? URL.createObjectURL(r.imgBlob) : null;
      setFonts(fs => fs.map(f => (f.id === r.id ? { ...f, img, source: r.source || '', deletedAt: r.deletedAt || 0 } : f)));
      return;
    }
    const vs: Variant[] = [];
    for (const v of r.variants) {
      try {
        vs.push(await loadVariant({ id: v.id, label: v.label, weight: v.weight, italic: v.italic, fileName: v.fileName }, v.blob));
      } catch { /* skip unreadable variant */ }
    }
    if (!vs.length) return;
    if (r.imgBlob) imgs.current[r.id] = r.imgBlob;
    added.current[r.id] = r.added;
    const f: Family = { id: r.id, name: r.name, vn: vs.some(v => v.vn), demo: false, img: r.imgBlob ? URL.createObjectURL(r.imgBlob) : null, source: r.source || '', deletedAt: r.deletedAt || 0, variants: sortV(vs) };
    setFonts(fs => [...fs.filter(x => !x.demo && x.id !== f.id), f, ...fs.filter(x => x.demo)]);
  };

  const update = (id: string, patch: Partial<Family>) => {
    const cur = fontsRef.current.find(x => x.id === id);
    setFonts(fs => fs.map(f => (f.id === id ? { ...f, ...patch } : f)));
    if (cur) save({ ...cur, ...patch });
  };

  const setImg = (id: string, file: Blob) => {
    imgs.current[id] = file;
    update(id, { img: URL.createObjectURL(file) });
    flash('Đã gắn ảnh preview');
  };

  const addFiles = async (list: FileList | File[], targetId?: string, quiet?: boolean) => {
    const arr = [...list];
    const fontFiles = arr.filter(f => FONT_RE.test(f.name));
    const imgFiles = arr.filter(f => f.type && f.type.startsWith('image/'));
    if (targetId && imgFiles.length && !fontFiles.length) { setImg(targetId, imgFiles[0]); return; }
    if (!fontFiles.length) { if (imgFiles.length) flash('Thả ảnh lên đúng thẻ font để gắn ảnh'); return; }

    const fams = fontsRef.current.filter(f => !f.demo).map(f => ({ ...f, variants: [...f.variants] }));
    const touched = new Set<string>(), created = new Set<string>();
    let nFiles = 0;
    for (const file of fontFiles) {
      try {
        const buf = await file.arrayBuffer();
        const info = await inspect(file, buf);
        let fam = fams.find(f => key(f.name) === key(info.family));
        if (fam && fam.variants.some(v => v.fileName === file.name)) continue;
        if (!fam) {
          fam = { id: uid('f'), name: info.family, vn: false, demo: false, img: null, variants: [] };
          fams.unshift(fam);
          created.add(fam.id);
          added.current[fam.id] = Date.now();
        }
        const v = await loadVariant({ id: uid('v'), label: info.label, weight: info.weight, italic: info.italic, fileName: file.name }, file);
        fam.variants.push(v);
        sortV(fam.variants);
        touched.add(fam.id);
        nFiles++;
      } catch {
        flash('Không đọc được ' + file.name);
      }
    }

    // Match preview images to families by name.
    const used = new Set<File>();
    for (const fam of fams) {
      if (!touched.has(fam.id) || fam.img) continue;
      const keys = [key(fam.name), ...fam.variants.map(v => key(v.fileName))];
      const m = imgFiles.find(i => {
        if (used.has(i)) return false;
        const k = key(i.name);
        return keys.some(b => k === b || k.includes(b) || b.includes(k));
      });
      if (m) { used.add(m); imgs.current[fam.id] = m; fam.img = URL.createObjectURL(m); }
    }
    const rest = imgFiles.filter(i => !used.has(i));
    if (touched.size === 1 && rest.length) {
      const fam = fams.find(f => touched.has(f.id));
      if (fam && !fam.img) { imgs.current[fam.id] = rest[0]; fam.img = URL.createObjectURL(rest[0]); }
    }
    for (const fam of fams) if (touched.has(fam.id)) fam.vn = fam.variants.some(v => v.vn);

    // Keep any uploaded family that landed in state after our snapshot (e.g. during boot).
    const ids = new Set(fams.map(f => f.id));
    setFonts(fs => [...fams, ...fs.filter(f => !f.demo && !ids.has(f.id)), ...fs.filter(f => f.demo)]);
    fams.filter(f => touched.has(f.id)).forEach(save);
    if (!quiet && nFiles) flash(`Đã thêm ${nFiles} file vào ${touched.size} font`);
  };

  /** Move a font to "Đã xóa gần đây". */
  const trash = (id: string) => {
    const f = fontsRef.current.find(x => x.id === id);
    if (!f) return;
    setGlyph(null);
    update(id, { deletedAt: Date.now() });
    flash(`Đã chuyển ${f.name} vào Đã xóa gần đây`);
  };

  const restore = (id: string) => {
    const f = fontsRef.current.find(x => x.id === id);
    if (!f) return;
    update(id, { deletedAt: 0 });
    flash('Đã khôi phục ' + f.name);
  };

  /** Remove for good. Demo fonts live in code, so they are marked as permanently hidden instead. */
  const purge = (id: string) => {
    const f = fontsRef.current.find(x => x.id === id);
    if (!f) return;
    if (f.demo) update(id, { deletedAt: -1 });
    else {
      setFonts(fs => fs.filter(x => x.id !== id));
      deleteFamily(id).catch(() => {});
      f.variants.forEach(v => { if (v.fileUrl) URL.revokeObjectURL(v.fileUrl); delete vblobs.current[v.id]; });
      delete imgs.current[id];
    }
  };

  const purgeExpired = () => {
    const now = Date.now();
    fontsRef.current.filter(f => (f.deletedAt || 0) > 0 && now - (f.deletedAt as number) >= TRASH_MS).forEach(f => purge(f.id));
  };

  const downloadAll = (f: Family) => {
    f.variants.forEach((v, i) =>
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = v.fileUrl || '';
        a.download = v.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 250),
    );
  };

  const savePins = (next: Pin[]) => { setPins(next); storePins(next); };

  // Restore saved families on first mount (guarded against StrictMode double-run).
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      try {
        const recs = await getAllFamilies();
        recs.sort((a, b) => (b.added || 0) - (a.added || 0));
        for (const r of recs) await hydrate(r);
        await new Promise(r => setTimeout(r, 0)); // let state settle before patching
        // Demo fonts hidden by the previous version move into Recently deleted.
        const hidden = loadHiddenDemo();
        if (hidden.length) { hidden.forEach(id => update(id, { deletedAt: Date.now() })); storeHiddenDemo([]); }
        purgeExpired();
        const old = await getLegacy();
        if (old && old.length) {
          await addFiles(old.filter(r => r.fontBlob).map(r => new File([r.fontBlob as Blob], r.fileName)), undefined, true);
          clearLegacy();
        }
      } catch (e) {
        console.warn('IDB', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!glyph || confirm) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setGlyph(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [glyph, confirm]);

  // Long-open tabs: clear expired fonts every hour.
  useEffect(() => {
    const t = window.setInterval(purgeExpired, 60 * 60 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- derived ----------
  const all = fonts.filter(f => !f.deletedAt && (SHOW_DEMO || !f.demo));
  const trashed = fonts
    .filter(f => (f.deletedAt || 0) > 0 && (SHOW_DEMO || !f.demo))
    .sort((a, b) => (b.deletedAt as number) - (a.deletedAt as number));
  // Without typed text or a chosen sample, each font previews its own name.
  const txtFor = (f: Family) => text || (sample != null ? SAMPLES[sample] : f.name);
  const qq = q.trim().toLowerCase();
  const vnN = all.filter(f => f.vn).length;
  const counts = { all: all.length, vn: vnN, files: all.filter(f => !f.demo).reduce((n, f) => n + f.variants.length, 0) };
  const list = all.filter(f => (filter === 'all' || (filter === 'vn') === f.vn) && (!qq || f.name.toLowerCase().includes(qq)));
  const selOf = (f: Family) => { const i = sel[f.id]; return i != null && f.variants[i] ? i : defIdx(f.variants); };
  const pickSel = (id: string, i: number) => setSel(s => ({ ...s, [id]: i }));

  const dlProps = (f: Family): DownloadProps => {
    const stop = (e: React.MouseEvent) => e.stopPropagation();
    if (f.demo) return { href: f.link || '#', target: '_blank', onClick: stop, title: 'Mở trên Google Fonts', label: 'Mở Google Fonts ↗' };
    if (f.variants.length === 1) {
      const v = f.variants[0];
      return { href: v.fileUrl || '#', download: v.fileName, onClick: stop, title: 'Tải ' + v.fileName, label: 'Tải font ↓' };
    }
    return {
      href: '#',
      onClick: e => { e.preventDefault(); e.stopPropagation(); downloadAll(f); },
      title: `Tải ${f.variants.length} file`,
      label: `Tải tất cả ${f.variants.length} file ↓`,
    };
  };

  const gf = glyph ? fonts.find(f => f.id === glyph) : undefined;
  const cFont = confirm?.id ? fonts.find(f => f.id === confirm.id) : undefined;

  const onRootDragOver = (e: DragEvent) => { e.preventDefault(); if (!drag) setDrag(true); };
  const onRootDragLeave = (e: DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false); };
  const onRootDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); };
  const openFontPicker = () => fontInput.current?.click();

  return (
    <>
      <div className="app" onDragOver={onRootDragOver} onDragLeave={onRootDragLeave} onDrop={onRootDrop}>
        {view !== 'mix' && (
          <Sidebar
            counts={counts}
            text={text} onText={setText}
            sample={sample} onSample={i => { setSample(s => (s === i && !text ? null : i)); setText(''); }}
            onPickFonts={openFontPicker}
            trashCount={trashed.length}
            trashActive={view === 'trash'}
            onOpenTrash={() => setView('trash')}
          />
        )}
        <main className="main">
          <div className="view-tabs">
            {([['lib', 'Thư viện'], ['mix', 'Mix chữ']] as const).map(([k, l]) => (
              <button key={k} className={'view-tab' + (view === k ? ' is-active' : '')} onClick={() => setView(k)}>{l}</button>
            ))}
          </div>
          {view === 'lib' && (
            <Library
              fonts={list}
              txtFor={txtFor}
              selOf={selOf}
              onSel={pickSel}
              onOpen={id => setGlyph(id)}
              onDropOn={(id, files) => { setDrag(false); addFiles(files, id); }}
              dlProps={dlProps}
              onRemove={id => setConfirm({ kind: 'trash', id })}
              q={q} onQ={setQ}
              filter={filter} onFilter={setFilter}
              counts={{ all: all.length, vn: vnN, no: all.length - vnN }}
            />
          )}
          {view === 'trash' && (
            <Trash
              fonts={trashed}
              onRestore={restore}
              onPurge={id => setConfirm({ kind: 'purge', id })}
              onPurgeAll={() => setConfirm({ kind: 'purgeAll' })}
              onBack={() => setView('lib')}
            />
          )}
          {view === 'mix' && all.length === 0 && (
            <div className="empty">Kho đang trống. Thêm font ở tab Thư viện để mix.</div>
          )}
          {view === 'mix' && all.length > 0 && (
            <MixView
              pool={all}
              mixH={mixH} setMixH={setMixH}
              mixB={mixB} setMixB={setMixB}
              pins={pins} savePins={savePins}
              onMissingPreset={n => { flash('Tải file ' + n + ' lên để dùng'); openFontPicker(); }}
              hText={hText} onHText={setHText}
              bText={bText} onBText={setBText}
              hq={hq} onHQ={setHQ}
              bq={bq} onBQ={setBQ}
              hFilter={hFilter} onHFilter={setHFilter}
              bFilter={bFilter} onBFilter={setBFilter}
            />
          )}
        </main>
        {drag && <div className="drop-overlay">Thả font &amp; ảnh vào đây</div>}
        {gf && (
          <GlyphPanel
            font={gf}
            si={selOf(gf)}
            txt={txtFor(gf)}
            onSource={v => update(gf.id, { source: v })}
            dl={dlProps(gf)}
            onClose={() => setGlyph(null)}
            onSel={i => pickSel(gf.id, i)}
            onMix={() => { setMixH({ id: gf.id, vi: selOf(gf) }); setView('mix'); setGlyph(null); }}
            onPickImg={() => { pendingImg.current = gf.id; imgInput.current?.click(); }}
            onRemove={() => setConfirm({ kind: 'trash', id: gf.id })}
          />
        )}
      </div>
      <input
        type="file" ref={fontInput} multiple accept=".ttf,.otf,.woff,.woff2,image/*" hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
      />
      <input
        type="file" ref={imgInput} accept="image/*" hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file && pendingImg.current) setImg(pendingImg.current, file);
          e.target.value = '';
        }}
      />
      {confirm && confirm.kind === 'trash' && cFont && (
        <ConfirmDialog
          title={`Bạn có chắc chắn muốn xóa ${cFont.name}?`}
          body={`Font sẽ được chuyển vào "Đã xóa gần đây". Bạn có thể khôi phục trong ${TRASH_DAYS} ngày, sau đó font tự xóa vĩnh viễn.`}
          confirmLabel="Xóa"
          onCancel={() => setConfirm(null)}
          onConfirm={() => { trash(cFont.id); setConfirm(null); }}
        />
      )}
      {confirm && confirm.kind === 'purge' && cFont && (
        <ConfirmDialog
          title={`Xóa vĩnh viễn ${cFont.name}?`}
          body={cFont.demo
            ? 'Font mẫu này sẽ bị gỡ hẳn khỏi kho và không khôi phục lại được.'
            : `${cFont.variants.length} file font${cFont.img ? ' và ảnh preview' : ''} sẽ bị xóa khỏi trình duyệt và không lấy lại được.`}
          confirmLabel="Xóa vĩnh viễn"
          onCancel={() => setConfirm(null)}
          onConfirm={() => { purge(cFont.id); setConfirm(null); flash('Đã xóa vĩnh viễn ' + cFont.name); }}
        />
      )}
      {confirm && confirm.kind === 'purgeAll' && (
        <ConfirmDialog
          title={`Xóa vĩnh viễn ${trashed.length} font?`}
          body="Tất cả font trong Đã xóa gần đây sẽ bị xóa hẳn và không lấy lại được."
          confirmLabel="Xóa tất cả"
          onCancel={() => setConfirm(null)}
          onConfirm={() => { trashed.forEach(f => purge(f.id)); setConfirm(null); flash('Đã dọn sạch'); }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
