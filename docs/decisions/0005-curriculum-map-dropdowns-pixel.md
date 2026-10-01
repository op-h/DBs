# 0005 — Curriculum map, drop-down library, pixel design

Status: accepted · Owner: ATLAS · Date: 2026-10-01 · Supersedes the card layout in 0004

## Context

The owner asked for: lectures hidden behind drop-downs instead of all shown at once; a preview
with download when a lecture is opened; no "Clear" button when only a stage is chosen; a map of
all the material at the top (open, collapsible, linking to the PDFs) built from the official
curriculum PDF; a more "pixelated" design with matching animation.

## Decisions

**Curriculum data.** `data/curriculum.json` is hand-transcribed from `curriculum.pdf`
(Program Curriculum 2023–2024, Rev. 3.1). Hand-transcribed because pdftotext mangles the Arabic
(lam-alef ligatures). It holds each module's code, Arabic name, ECTS, type, workload,
language and prerequisites, and the `file` it maps to. All 8 semesters sum to 30 ECTS (240 total);
all 37 PDFs map to a module (two are elective options). The build warns about any PDF or `file`
that doesn't match. Prerequisites are shown exactly as printed, including two that look like typos in
the source (CSTE2206 → CSTE1106, CSTE3205 → CSTE2206); see the summary to the owner.

**Map.** A `<details open>` at the top: 4 stage columns × 2 semesters, with code, name, ECTS and a
type marker (core solid, support dithered, basic hollow, elective dotted). Modules with a PDF
link straight to it (↗). Elective slots list their options. On phones it becomes a horizontally
swiped strip (one stage per view, scroll-snap), so the library isn't pushed 2,500px down. The
strip is the containing block for its visually-hidden labels, or they stretched the page.

**Library.** Each stage is a closed `<details>`; each course is a `<details name="course">` row
(exclusive accordion where supported, JS fallback elsewhere). Opening a row shows the preview:
cover (lazy, so it loads only when opened), Arabic name, curriculum facts, Open PDF and Download.
Searching or choosing a stage opens the stages that hold results; clearing closes only the
stages the script opened, never ones the student opened by hand. "Clear search" appears only
for a search query. The count shows only while searching. Print opens all stages first.

**Pixel design.** Geist Pixel Square (Vercel, SIL OFL; subset to 18.5 KB, self-hosted,
preloaded, `font-src 'self'`) for titles, labels, codes and numbers; system sans for reading.
Notched pixel borders are four offset box-shadows (no images). The mark is a 16×16 pixel page, as
SVG rects, and the favicon is generated from the same map. Motion is all stepped
(`steps()`): the mark assembles in eight waves, the cursor blinks six times and rests, panels
"scan" open in six steps, chevrons turn in two, and buttons press 2px into a hard shadow. All of it
is off under `prefers-reduced-motion`. Decorative arrows use CSS alt text (`content: "↗" / ""`) so
screen readers don't read them. Forced colours restore real borders and outlines.

## Consequences

- No-JS: the map, stages and previews all work natively (`<details>`). Only search needs JS.
- Adding a PDF still only needs the folder and a push, but it shows without curriculum facts
  until it gets a `"file"` entry in `data/curriculum.json` (the Action log warns).
