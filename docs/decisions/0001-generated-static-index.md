# 0001 — Generate a static index from the folder tree

Status: accepted · Owner: ATLAS · Date: 2026-10-01

## Context

The site is served by GitHub Pages straight from `main` (legacy build, no Actions). The previous
version hard-coded every file path and byte size in `script.js` and rendered the whole library
with JavaScript, so:

- with JS off the page was empty (violates DoD #1);
- adding a PDF meant hand-editing a JS array, and sizes drifted from reality;
- search matched folders, not files, so a student had to open a folder after searching.

## Decision

1. The PDF folders on disk are the single source of truth.
2. `tools/build.mjs` (Node ≥ 18, zero dependencies) scans them and writes:
   - `index.html` — the full library as real HTML, every course listed with size, page count,
     Open and Download links. It works with JS disabled.
   - `covers/*.webp` — a 240×320 thumbnail of each PDF's first page (via ImageMagick).
   - `data/library.json` — the manifest, which also caches page counts so the build still
     works on a machine without `pdfinfo`/ImageMagick.
3. `script.js` only *enhances*: instant search across file names, stage/semester filters,
   URL state (`?q=&stage=&term=`), recently opened, share/copy link, theme toggle.
4. Generated files are committed, because Pages serves the branch as-is.

Not a framework, not an app shell: ~37 rows do not need one.

## Consequences

- After adding/removing PDFs, run `node tools/build.mjs` and commit. Documented in README.
- Covers add ~0.5 MB total, but they are lazy-loaded and fixed-size (no CLS).
- If the PDF count grows past a few hundred, revisit (paginate or split pages by stage).
