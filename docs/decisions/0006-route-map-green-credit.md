# 0006 — Route map at the bottom, green accent, roaming credit

Status: accepted · Owner: ATLAS · Date: 2026-10-01 · Amends 0005

## Requests

The owner asked for:
- the map to look like a map, quieter, and placed at the bottom;
- no separator lines around the search bar or above the footer;
- the curriculum PDF to be removed and replaced by a "Done by OPH" credit linking to
  https://t.me/op_h11 that glitches in and out at different places along the bottom line and
  holds still on hover or click;
- the description hidden on mobile, and the stage bar as wide as the search bar there;
- a green accent everywhere.

## Decisions

- **Route map.** Stations (stages) sit on one dashed pixel line, running across on wide screens and down the
  left on phones. Each station has two semester stops and plain module names, with a filled green
  bullet when the PDF exists and a hollow one when it doesn't. Codes, ECTS and type markers moved out
  of the map; they are still in each course preview. The phone swipe strip is gone, since the map is
  at the bottom now.
- **Curriculum PDF removed** from the repo and the page. `data/curriculum.json` keeps the
  transcribed facts; only its `source.pdf` field was dropped.
- **No lines.** The sticky search bar ends in a 4px dithered pixel band instead of a rule,
  so rows scrolling under it dissolve rather than being cut. The footer has no top rule.
- **Green.** Light `#1F6B45` (≥ 5.38:1 as text on page/card/well; white on it 6.47:1).
  Dark `#5BC48A` (≥ 6.87:1; page-coloured text on it 8.42:1). Hover and mark colours follow.
  The favicon's accent pixel is green too.
- **Credit.** JS moves it every 3.5–6 s with a stepped slice/colour-split glitch (360 ms out
  and in). It holds while hovered or focused, stops for good after a click, pauses while the tab is
  hidden, and never moves under `prefers-reduced-motion` or without JS. WCAG 2.2.2 asks that moving
  content can be paused; hover and focus pause it, and reduced motion turns it off entirely.
