# SEO, metadata and measurement (BEACON)

Live URL: https://op-h.github.io/DBs/ (GitHub Pages project site, served from repo root).

## Information architecture

One page, one purpose: browse and open the Cyber Security course PDFs.

| URL | Meaning | Indexed? |
|---|---|---|
| `/DBs/` | The library | Yes (canonical) |
| `#stage-N` | Jump to a stage section | Fragment, never sent to server |
| `#<course-id>` | Deep link to one course row | Fragment |
| `?q=&stage=&term=` | Client-side search/filter state set by `script.js` | No separate indexing; the canonical tag points every variant at `/DBs/` |
| `*.pdf` | The course files | Linked from the page; crawlable as documents |

Heading structure: one `h1` (library title), stage `h2`, semester `h3`, course `h4` (per ADR 0002).

## Metadata spec (head of `tools/template.html`)

- `title`: "Cyber Security Curriculum Library". `description`: states department, organisation by stage and semester, and `{{FILE_COUNT}}` (build-time, so always true).
- The university is deliberately not named: the site never states it. TODO(content): if the owner wants it in metadata, add it to visible content first, then to title/description/JSON-LD.
- `canonical`: `https://op-h.github.io/DBs/`.
- `theme-color`: two tags, light `#F6F3EC`, dark `#171513` (design.md `--c-page`). `color-scheme: light dark`.
- Open Graph (`website`) and Twitter `summary` card, text only.
- TODO(content): no `og:image` / `twitter:image`. Scrapers do not reliably accept SVG, and a real 1200x630 PNG/JPEG has not been designed. Until one exists the card is text-only, which is why `twitter:card` is `summary` rather than `summary_large_image`.
- Favicon: `favicon.svg` (catalogue card with oxblood rule, readable at 16px). Browsers that ignore SVG icons fall back to no icon; TODO(content): add `apple-touch-icon.png` (180x180) if home-screen use matters.
- JSON-LD: `WebSite` + `CollectionPage` in one `@graph`, `mainEntity` an `ItemList` with `numberOfItems` = `{{FILE_COUNT}}`. Items are not enumerated. No author, publisher, dates or ratings are claimed. Validate with the Schema.org validator after each rebuild.

## Crawlability

- `sitemap.xml` ships at repo root with the single canonical URL (no `lastmod`, to avoid inventing a date; the build could supply one later).
- `robots.txt` is **not shipped**. On a project site, crawlers request `https://op-h.github.io/robots.txt` (the user-site root), not `/DBs/robots.txt`, so a file here is never read. Nothing is blocked anyway.
- Because robots.txt cannot advertise the sitemap, submit `https://op-h.github.io/DBs/sitemap.xml` in Google Search Console and Bing Webmaster Tools. This is a human action (BLOCKED in handoff).
- Status/redirects: Pages serves `/DBs` as a 301 to `/DBs/`. Keep internal links relative.

## Analytics

None. Decision: no analytics or tracking scripts. There is no consent mechanism, the audience is students, and the questions the owner needs answered (which courses exist, do links work) do not need visitor data. The only client storage is the theme and recently-opened list, kept in localStorage and never transmitted. If this changes, use a cookieless, self-hosted or privacy-respecting tool, define events here first (candidates: `open_course`, `download_course`, `search`, `share_copy`), and put no key in client code.
