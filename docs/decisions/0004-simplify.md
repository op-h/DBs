# 0004 — Simplify: no local build step, a quieter page

Status: accepted · Owner: ATLAS · Date: 2026-10-01 · Supersedes parts of 0002

## Context

The owner asked for a site that is "more simple", "clear, no noise", still professionally
designed, and that runs on GitHub Pages without extra work.

## Decisions

### No build step for the owner

`.github/workflows/update-library.yml` runs `node tools/build.mjs` on every push to `main`
(including a PDF uploaded on github.com), commits `index.html`, `covers/` and
`data/library.json` if they changed, then requests a Pages build. The explicit request is
required: pushes made with `GITHUB_TOKEN` do not trigger Pages builds. Pages keeps serving
`main` from the root, so no repository setting changes.

The build now needs only **poppler-utils** (`pdfinfo`, `pdftoppm`); ImageMagick is gone.
Covers are JPEG (q60, 240×320, ~9 KB each). Page counts and covers are reused when a file's size
is unchanged (cached in `data/library.json`), so a fresh CI checkout, where every mtime is
"now", produces no diff and no noisy commits.

### Quieter page

Removed: header bar (it repeated the h1), the stats block, the semester filter (semesters
remain as headings; "sem 2" still works in search), theme toggle (the page follows the
device setting), Recently opened, Share buttons, the Ctrl/⌘K shortcut and hint, the toast,
the stage rail, uppercase letter-spaced labels, the red rule on every card, and the
results count when nothing is filtered.

Course card (replaces 0002 §1): the whole card opens the PDF. The title link is stretched over
the card with `::after`, so the card is one large target with the focus ring drawn around it.
Download is the only other control: a quiet text link layered above the stretched link.
A wall of 37 red "Open" buttons was the loudest thing on the page.

Covers use `object-fit: contain`, so landscape lecture slides show whole.

## Consequences

- Fewer features to break: script.js went from 674 to about 350 lines, and styles.css from about 1,580
  to about 1,060.
- The no-JS page is unchanged in substance: every course and link is plain HTML.
- Files over 25 MB can't be uploaded through the github.com web page (GitHub's limit); use
  `git push` or GitHub Desktop for those. The Action handles the rest.
