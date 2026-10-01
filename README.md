# CyberSec Library

Course PDFs for the Cyber Security department, organised by stage and semester.

**Live site:** https://op-h.github.io/DBs/

- Search every course by name. Filter by stage and semester. Press **Ctrl K** (⌘K on Mac) to jump to search.
- Each course shows its cover, page count and file size, with large files flagged so you can wait for Wi-Fi.
- Open in the browser, download, or copy a direct link to share with classmates.
- Works on phones, tablets and desktops, in light and dark mode, and without JavaScript.

## Folder layout

```
المرحلة الاولى/          Stage 1
  الكورس الاول/           Semester 1
    Course Name.pdf
  الكورس الثاني/          Semester 2
المرحلة الثانية/          Stage 2
المرحلة الثالثة/          Stage 3
المرحلة الرابعة/          Stage 4
```

The file name (without `.pdf`) is the course name shown on the site.

## Adding or removing a PDF

1. Put the PDF in the right `المرحلة …/الكورس …/` folder (or delete it).
2. Rebuild the page:

   ```sh
   node tools/build.mjs
   ```

3. Commit everything that changed (`index.html`, `covers/`, `data/library.json`) and push.
   Also rebuild after editing `styles.css` or `script.js`: their URLs carry a content hash.

`tools/build.mjs` needs Node 18+. It uses `pdfinfo` (poppler-utils) for page counts and
ImageMagick (`magick`, with Ghostscript) for cover images. Without them the build still runs,
reusing cached page counts; new PDFs just won't get a cover.

GitHub rejects files over 100 MB. Compress larger PDFs before adding them.

## How it is built

No framework and no dependencies. `index.html` is generated from `tools/template.html`, so the
whole library is real HTML that works without JavaScript; `script.js` adds search, filters,
shareable URLs and recently opened. Design decisions are in [`docs/`](docs/).
