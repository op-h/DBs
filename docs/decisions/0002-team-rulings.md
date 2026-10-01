# 0002 — Rulings on MUSE / GRANITE conflicts

Status: accepted · Owner: ATLAS · Date: 2026-10-01

## 1. Course item: visible "Open" button, plain-text title

GRANITE removed the Open button in favour of a linked title (fewer tab stops). MUSE's card has a
primary Open action. Students are mostly on phones and many are not power users; a large,
labelled Open target is clearer than a serif title that happens to be a link.

Ruling: the title is plain text (`h4`). Actions are Open (primary link) → Download → Share.
Open/Download carry visually-hidden course names so the links list reads "Open Linux
Essentials", not "Open, Open, Open", and label-in-name (2.5.3) holds because the visible word
starts the name. Three tab stops per course is acceptable.

## 2. Search shortcut: Ctrl/⌘ + K, not "/"

A single-character shortcut fails WCAG 2.1.4 unless it can be turned off or remapped.
Modifier shortcuts are exempt. Ruling: Ctrl+K (⌘K on Apple), hint text set by JS per platform.

## 3. JS-only controls render on first paint

The head script adds `html.js` before paint. CSS hides JS-only UI (controls, theme toggle,
Share buttons) under `html:not(.js)`, instead of the `hidden` attribute + reveal-later, so
nothing shifts in after load (CLS). The head script also adds `html.has-recent` when
localStorage holds recent items so the "Recently opened" row can reserve its space.

## 4. Rejected: call numbers on cards

MUSE offered generated call numbers (e.g. 2·1·03). They carry no information a student needs
and the semester heading already gives the location. Dropped.

## 5. Theme control: one cycling button (System → Light → Dark)

Smaller than a 3-segment control at 320px; visible text "Theme: Dark" names its state.
The change is announced via `#toast`.
