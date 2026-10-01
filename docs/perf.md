# Performance budgets and measurements (QUARTZ)

Gate: DoD #6, LCP < 2.5s, INP < 200ms, CLS < 0.1, mid-tier Android over 4G.
Measured 2026-10-01 on branch `redesign`, local `python3 -m http.server` (no compression, so
transfer sizes below are gzip -9 computed by hand; GitHub Pages serves gzip/br).

## Budgets (pass/fail)

| Resource | Budget (gzip) | Measured raw / gzip | Status |
|---|---|---|---|
| index.html | 12 KB | 79,273 B / 6,859 B | pass |
| styles.css (render-blocking, only one) | 14 KB | 38,254 B / 9,101 B | pass |
| script.js (`defer`) | 12 KB | 23,048 B / 7,359 B | pass |
| Fonts | 0 | 0 (system stack) | pass |
| Third-party requests | 0 | 0 | pass |
| Critical path (html+css+js) | 35 KB | 23.3 KB | pass |
| Cover, per file | 20 KB | max 14,516 B, min 1,614 B, mean ~7.3 KB | pass |
| Covers, all 37 | 300 KB | 271,932 B | pass (tight; ~90% headroom used) |
| Covers fetched on first mobile load | 120 KB | 13 files, 104,067 B | pass |

## Lab results (Lighthouse 12, simulated Moto G Power, slow 4G)

| Run | Perf | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| Mobile, noisy machine | 98 | 1.4 s | 2.1 s | 100 ms | 0 |
| Mobile, quiet machine | 100 | 1.4 s | 1.4 s | 10 ms | 0 |
| Desktop x3, quiet | 100 | 0.3 s | 0.4-0.5 s | 0 ms | 0 |

Treat the noisy 2.1 s as the worst case (0.4 s under the 2.5 s gate). One desktop run taken while
other processes were running showed TBT 580 ms / score 72; three reruns were clean, so it was
host contention, not the page. Re-measure on an idle machine before trusting any single run.

## LCP

The LCP element is text (`p.intro-lede` on mobile, `h1#pageTitle` on desktop), never a cover.
Covers are `loading="lazy" decoding="async"` with `width`/`height`, so they cannot become LCP
or shift layout. Decision: do not make covers eager or `fetchpriority=high`; that would put
image bytes ahead of CSS/text on a slow link and move LCP the wrong way. Revisit only if a
hero image is ever added.

On a 360x740 viewport the first cover sits at y=680, so it is at most partly visible; lazy
loading still pre-fetches ~13 covers. Cost ~104 KB, off the
critical path, accepted.

Render blocking: only `styles.css` (one request, 9.1 KB gzip). The inline head script is ~0.5 KB,
synchronous and tiny (sets `js`, theme, `has-recent`); keep it that way, no layout reads in it.

## CLS

Measured with a layout-shift observer at 360px, DPR 2, after load + 1.2 s:

| localStorage "recent" | CLS |
|---|---|
| none | 0.0000 |
| 1 item | 0.0000 |
| 3 items | 0.0000 |
| 8 items | 0.0000 |

The `html.has-recent` reservation works. Untested: 320 px and 2560 px with seeded recents
(SENTRY matrix).

## INP proxy

Playwright, 360px mobile, CPU throttled 4x, real keystrokes typing "linux" then Ctrl+A/Backspace
(37 -> 1 -> 37 visible items), Event Timing API (8 ms granularity):

- keydown/input per character: 16-88 ms, worst 112 ms (the clear that re-shows all 37 items).
- Pointer click on the search field: 96 ms.
- Worst observed interaction 112 ms vs 200 ms gate: pass, ~44% headroom. Filtering is synchronous
  with no debounce, which is fine at 37 items. Re-test if the library grows past ~150 items.

## Covers

37 WebP, 240x320, q62. Shown at 96-128 CSS px wide, so 240 px is 1.9-2.5x density. No
regeneration: the set is 272 KB, no file exceeds 15 KB, and a lower quality or smaller size
would blur the text-heavy first pages. AVIF would save an estimated 20-30% (~60-80 KB over all
covers, only ~25 KB on first load) but needs a different ImageMagick delegate and a `<picture>`
element; not worth the build complexity today.

## Caching

GitHub Pages sends `Cache-Control: max-age=600` and ETag, and it cannot be changed without a CDN.
Effects: repeat visits after 10 minutes revalidate every file (cheap 304s; covers are 37 extra
conditional requests, so a returning visitor pays latency, not bytes). Filenames are not
fingerprinted, so a deploy can serve new HTML with the old `script.js`/`styles.css` for up to 10
minutes. Keep HTML/CSS/JS changes backward compatible across a deploy, or add `?v=` query strings
in the template when a breaking change ships.

## The PDFs

Course PDFs are up to 54 MB and are not part of page load. The site's only mitigation is the
large-file size stamp beside Open/Download so students on mobile data can choose. Pages gives no
range-friendly CDN tuning, and nothing further is possible on-site. Do not preload or prefetch PDFs.

## How to re-measure

Serve the repo on 127.0.0.1:8790, then run Lighthouse 12 with default mobile throttling and
`--preset=desktop`, on an idle machine, three runs each; report the worst.
