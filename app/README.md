# Kho chữ

Personal font library: drop font files (+ preview images), test Vietnamese text across all fonts, browse variants & glyphs, and mix heading/text pairings. Implementation of `project/Kho Chu v2.dc.html`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (relative paths, host anywhere)
```

- **Storage** is local to the browser: fonts/images in IndexedDB (`khochu` DB, `families` store), compare pins in `localStorage` (`khochu_pins`). Same keys as the prototype, so data saved there carries over; v1 `fonts` records are migrated on load.
- **Demo fonts** (Google Fonts) are toggled with `SHOW_DEMO` in `src/lib/constants.ts`. Text-font presets (Poppins, Garet, Open Sauce…) are `PRESETS` in the same file.
- **Font parsing** (`src/lib/font.ts`) reads `name`/`OS/2` from TTF/OTF/WOFF to group files into families; WOFF2 falls back to file-name guessing. Việt Hóa detection is a canvas-width heuristic and can be toggled per font in the glyph panel.
