# QA: browser matrix, test record, release checklist (SENTRY)

> **Update 2026-10-01 (ADR 0004):** theme toggle, share, recently opened, Ctrl/⌘K and the semester filter were removed, and the test suites were updated to match. The defects below (D1–D6) stay fixed. D3 no longer applies because recently opened is gone.

Last run: 2026-10-01, branch `redesign`, against `index.html` built by `node tools/build.mjs`
(37 files, 5,089 pages, 250.5 MB). Served locally with `python3 -m http.server`. Production PDF
paths were also checked live on `https://op-h.github.io/DBs/`.

Test scripts are kept outside the repo (scratchpad). They are written so ATLAS can move them into
`tools/` or CI later:

| Script | What it covers |
|---|---|
| `e2e.mjs` (ATLAS) | Widths 320–2560 in light and dark, no-JS, link 200s, search/filter/URL/share/theme/recent, axe, target sizes, focus ring and occlusion, skip link, CLS, reduced motion, 200% zoom + text-spacing |
| `qa.mjs` (SENTRY, `BROWSER=chromium\|firefox`) | Full keyboard flows, accessible names and descriptions, heading outline, live-region debounce, edge-case paths and download filenames, hostile query strings and hashes, Arabic search, hostile localStorage, forced colours, print, CSP candidate, simulated Safari < 16.2, scroll stability, reload and back consistency |
| `unit.test.mjs` (SENTRY, `node --test`) | Pinned input/output pairs for `slugify`, `escapeHtml`, `toHref`, `formatSize` (build) and `normalise`, `tokenise` (client). Functions are lifted from the shipped source so drift breaks the test. Also checks manifest ids and hrefs |

## Browser matrix

Support target: Safari 15.4+, Chrome/Edge last 2, Firefox last 2, Samsung Internet (current).

| Engine | How it was tested | Result |
|---|---|---|
| Chromium 150 (Chrome, Edge, Samsung Internet engine) | Playwright, `e2e.mjs` 82/82, `qa.mjs` | Pass apart from the search defect below |
| Firefox 155 (Playwright build) | Playwright, `e2e.mjs` 82/82 (adapted: no `isMobile`), `qa.mjs` | Same result as Chromium |
| WebKit / Safari | **Not run.** The Playwright WebKit build downloads, but this Kali host lacks the libraries it needs (ICU 74, `libxml2.so.2`, `libjpeg.so.8`). Covered by static review plus Chromium simulations | See the Safari risks below. Needs a real-device pass |
| Samsung Internet | Static review (Chromium engine) | `float: inline-start` has a `float: left` fallback. `color-mix` needs Chromium 111+, which current SI has |

### Static compatibility review (features vs Safari 15.4 floor)

| Feature | Where | Safari | Failure mode |
|---|---|---|---|
| `@layer` | styles.css:7 | 15.4 | OK at the floor |
| `:focus-visible`, `aspect-ratio`, `clip-path: inset()`, logical props, `translate:` | various | ≤15.4 | OK |
| `:has()` | styles.css:779, 849 | 15.4 (FF 121) | OK. Failure would only leave the Ctrl K hint visible, and padding is reserved for it |
| `not` in media queries | styles.css:210 | 16.4 | Fails safe: the block is dropped and the 44px targets stay |
| `@container` | styles.css:1280, 1305 | 16.0 | Safari 15.4–15.6 keeps the compact card layout. Degrades, does not break |
| `text-wrap: balance/pretty` | styles.css:268, 1233 | 17.5 | Cosmetic |
| **`color-mix(in oklab)`** | styles.css:105, 190, 205 (token), 1215 (`mark`) | **16.2** | **Defect D2 below** |
| Scroll anchoring (`overflow-anchor`) | none, but behaviour relied on | not shipped in WebKit as far as we know | **Defect D3 below** |
| JS: `??`, `?.`, optional catch, `replaceChildren`, `CSS.escape` | script.js | ≤14 | OK. No ES2022+ APIs (`.at`, `structuredClone`, `hasOwn`…) |
| `navigator.userAgentData` | script.js:446 | absent | Guarded, falls back to `navigator.platform` |
| `navigator.share` | script.js:559 | yes | Called synchronously within the click (user activation kept) |

## Results by area

**Keyboard (both engines, pass).** Ctrl+K and ⌘K focus search from anywhere, and Ctrl+Shift+K is
not hijacked. After typing, Tab goes stage group → semester group → Clear → first visible Open,
and never lands on hidden content. Escape with text clears the field, re-filters and drops `?q`.
Escape on an empty field blurs to `<body>`, but the sequential-focus start point is kept and the
next Tab goes to the stage group (acceptable). Arrow keys wrap inside radio groups and each group
is one Tab stop. Clear (Enter or Space), the empty-state reset and recent "Clear" all leave focus
on `#q`, never on `<body>`. The theme toggle keeps focus and announces. Enter on Open or Download
records a recent item and focus stays on the link.

**Screen-reader semantics (pass).** Names: "Open Data Structure & Algorithms", "Download Data
Structure & Algorithms, 2.0 MB", "Share link to Data Structure & Algorithms". Open has the
description "PDF, opens in a new tab" (Chromium AX tree). Heading outline: one h1 and no skipped
levels. Landmarks: banner, main, search, contentinfo. The results live region updated once per
typed word ("2 of 37 courses") rather than once per keystroke.

**Edge-case files (pass).** "Data Structure & Algorithms" (`%26`) and "General Physics " (trailing
space) are served byte-exact as `%PDF-`. The download filename is `General Physics .pdf` in both
engines: valid, but it keeps the stray space. **All 37 hrefs return 200 on production with
Content-Length equal to the size on disk**, including the Arabic folder segments.

**Hostile input (pass).** `?q=<script>…`, `?q=<img onerror>`, `?stage=9&term=7`, CSS-selector
injection in `stage`, a lone `%`, duplicate `q`, malformed hash `#%E0%A4%A`, a non-library hash, a
5,000-char query, and `?q=…#course` (the hash wins). None of them injects anything, throws, or
opens a dialog. A 2,000-char query filters in under 50 ms. U+202E in the query reverses text inside the
empty-state heading. The heading is `unicode-bidi: isolate` so nothing outside it is affected
(cosmetic only).

**Storage (pass).** A throwing `localStorage`, corrupt JSON, a non-array value, 500 ids that include
unknown ones, and a garbage theme value all load with no errors. `has-recent` ends up consistent
with the visible section.

**Forced colours (pass, both engines, light and dark).** The selected segment uses
Highlight/HighlightText. Every control type shows a 2px outline. Buttons keep a system-colour
border.

**Print (pass).** Ink on white even with a dark theme saved. Controls, actions and covers are
hidden. All 37 titles with page counts and sizes fit on 3 A4 pages.

**Reload / back (pass).** URL, inputs and visible list agree after a reload and after a history
round-trip, in both engines.

**Build reproducibility (pass).** `node tools/build.mjs` run twice in an isolated copy produces
`index.html`, `data/library.json` and every `covers/*.webp` byte-identical to the working tree. The same
holds under `LC_ALL=C` with an exotic TZ, with an Arabic locale after forcing cover regeneration,
and with no `pdfinfo` or `magick` on PATH (cached page counts).

**html-validate@8: 11 findings, all accepted.** `doctype-style` (lowercase is valid).
`no-redundant-role`/`prefer-native-element` ×9 (`role="list"` is deliberate, because Safari/VoiceOver
drop list semantics under `list-style: none`). `wcag/h32` (the search form filters live and never
submits, and it is hidden without JS).

**Security.** No secrets, tokens or keys in tracked or untracked text files. No HTML sinks
(`innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`) in script.js. The highlighter builds
text nodes. Every `target="_blank"` has `rel="noopener"`. The only off-origin URLs are the GitHub
repo link and the canonical, so no third-party scripts, styles or fonts and no SRI needed. There are
no `style=""` attributes. The live Pages response has HSTS but no CSP, `X-Content-Type-Options` or
frame protection, and Pages cannot set headers.

## Defects found (routed in the handoff)

| ID | Sev | Owner | Summary |
|---|---|---|---|
| D1 | Medium | CIRCUIT + build | Search tokens match independently against `"<name> stage N semester M"`, so the numbers leak across fields. `stage 1` → 25 results (stages 1, 2 and 3), `stage 2 semester 1` → 13 (includes stage 1 / sem 2). Same in both engines |
| D2 | Medium (WCAG 1.4.3 on a declared target) | PRISM | Safari 15.4–16.1: `--c-accent-hover` holds `color-mix()`, which becomes invalid at computed-value time → `.btn--primary:hover` background turns transparent and the "Open" label is invisible in both themes (styles.css:105, 190, 205, 956). `mark` falls back to UA yellow with `color: inherit`, giving light text on yellow in dark mode (styles.css:1215). Reproduced by simulation |
| D3 | Low–Medium | CIRCUIT | The first Open inserts the "Recently opened" row above the user's scroll position. Chromium and Firefox compensate with scroll anchoring (0px). Without anchoring (Safari/iOS) the list jumps 244px at 390px wide and 169px at 1280px |
| D4 | Low | build (ATLAS) | `slugify` returns `""` for Arabic-only names → id `sN-N-`. Two such files would collide on id and cover file, and nothing detects it |
| D5 | Low | build (ATLAS) | Arabic search ("المرحلة", "الكورس الاول") always returns 0, though those words are printed on the page. `data-search` has no Arabic stage/semester names |
| D6 | Trivial | build (ATLAS) | `formatSize(1048575)` → "1024 KB". The `download` filename keeps trailing spaces from disk. The comment at tools/build.mjs:128-129 describes a removed design (linked title, no Open button) |

### Resolution (ATLAS, 2026-10-01)

All six fixed and re-verified (e2e 91/91 Chromium, 82/82 Firefox; qa 75/75 Chromium, 70/70 Firefox; unit 6/6):

- **D1**: build writes `stage1`/`semester2` as single words; client folds "stage 1", "year 1", "sem 2", "term 2" into them and matches tokens as word prefixes (≥3 chars may also match mid-word). "stage 1" → 13, "stage 2 semester 1" → 6, "english 2" → 1. Regression cases added to e2e.mjs.
- **D2**: `color-mix()` removed; `--c-accent-hover` and `--c-mark` are precomputed per theme. See ADR 0003.
- **D3**: Open/Download only stores the id; the row renders on the next page load (space reserved by `html.has-recent`), never mid-visit.
- **D4**: non-Latin names fall back to a hashed slug; the build fails loudly on a duplicate id.
- **D5**: `data-search` includes the Arabic stage/semester names; the client folds أ/إ/آ→ا, ى→ي, ة→ه and strips diacritics/tatweel.
- **D6**: no "1024 KB"; `download` attribute carries the trimmed name; stale comment removed. Punctuation-only tokens ("&") are ignored.

## CSP (adopted — generated by the build, see ADR 0003)

Original recommendation kept below for the record.

Pages cannot send headers, so a `<meta>` CSP is the only option. Verified in Chromium and Firefox:
zero violations, the head script and `script.js` run, search, theme and share work, covers load. A
negative control (same policy without the hash) blocks the head script, so the hash is
load-bearing. Place it immediately after `<meta charset>`, before any script:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'sha256-vBQvrS5mm3iqc/jcovUQpxnLFWrVjKJopdZhKm7l00E='; style-src 'self'; img-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests">
```

- The hash is the head theme script exactly as it appears between `<script>` and `</script>` in
  the current template, whitespace included. **Any edit to that script silently breaks it**: the page
  falls back to the no-JS look while script.js still runs. If adopted, `build.mjs` should compute
  the hash and inject the tag, or the hash check should be added to CI.
- JSON-LD is not executed, so it needs no hash.
- `frame-ancestors`, `report-uri` and `sandbox` are ignored in `<meta>`, so clickjacking protection is
  not possible on Pages. The site has no state-changing actions, so the residual risk is low.

## Release checklist

1. `node tools/build.mjs`, then `git status` must show no diff in `index.html` or `data/` (generated files are current).
2. **Commit the files that are currently untracked**: `covers/`, `data/`, `tools/`, `docs/`,
   `favicon.svg`, `README.md`, `sitemap.xml`, `.nojekyll`. Without them production serves 37 broken
   covers, a 404 favicon and a 404 sitemap. `git ls-files` currently lists none of them.
3. `node --check script.js tools/build.mjs` and `node --test unit.test.mjs`.
4. `e2e.mjs` (Chromium, 91 checks) and `e2e-ff.mjs` (Firefox, 82): all pass.
5. `qa.mjs` in Chromium and Firefox: the only allowed failures are open, accepted defects.
6. `npx html-validate@8 index.html`: only the 11 accepted findings above.
7. Manual pass on a real iPhone (Safari) and a Mac (Safari): hover on Open, Share sheet, Ctrl/⌘K, scroll after first Open.
8. Manual Windows High Contrast check of focus ring and selected segment (emulation already passes).
9. After deploy: HEAD every PDF href on production (200 and matching Content-Length), and check zero console errors on the live URL.
10. The CSP hash is regenerated by every build; just confirm zero `securitypolicyviolation` events (qa.mjs does).

## Known limitations

- No WebKit run on this host. Safari findings come from static review plus Chromium simulation.
- Ctrl+K in desktop Firefox and Chrome is also a browser shortcut. Playwright delivers keys to
  content, so the browser-chrome interaction needs a manual check.
- Performance (LCP/INP/CLS under throttling) is QUARTZ's. See `docs/perf.md`.
- Screen-reader output was checked through accessibility trees, not with NVDA, JAWS or VoiceOver.
