# Design system: Cyber Security Course Library

Owner: MUSE. Consumers: PRISM (CSS), GRANITE (a11y review), QUARTZ (font/perf). PRISM implements
from this doc. Token names are the contract, so don't rename them without routing through MUSE.

## 1. Concept: "The Catalogue Drawer"

The site is a **library card catalogue**, not a dashboard. Each PDF is an **index card**: a cover
thumbnail, a call number, a title set in a book serif, and a single **red ruled line** under the
title. That rule is the one memorable idea. Real catalogue cards have it, and here it carries the
only accent colour that appears on every entry. Everything else is paper, ink, hairlines and
tabular figures. The covers supply the colour and imagery, so the chrome stays quiet.

- **Mood:** university-press index, reading-room calm, ledger precision. Not "cyber". No terminal
  green, no circuitry, no glow. The subject is security but the product is a library.
- **References:** printed back-of-book indexes (rules, tabular page numbers, small caps), the
  Library of Congress card catalogue, and the restraint of a good university-press colophon.
- **Rejected:** the current dark/green-accent dashboard, gradients, glass, glows, blobs, emoji,
  centred gradient hero, pill-shaped SaaS buttons, drop-shadow cards.
- **One accent:** oxblood (light) / terracotta (dark). It is used only for the card rule, the
  primary action, links, the focus ring and the "large file" stamp. Everything else is neutral.

## 2. Theming mechanics

- Light is the default. Dark applies under `@media (prefers-color-scheme: dark)` on
  `:root:not([data-theme="light"])`, and also on `:root[data-theme="dark"]`. `data-theme="light"`
  forces light. Without JS the system preference still works.
- Set `color-scheme: light` / `dark` on the matching rule so form controls and scrollbars follow.
- Emit two `<meta name="theme-color">` tags with `media` queries using the `--c-page` values below
  (BEACON/PRISM).
- Don't apply filters, inversion or dimming to cover thumbnails in dark mode. They are
  documents and must look like the file the student will get.
- `@media (forced-colors: active)`: use system colours, keep outlines, and give the selected
  segment `background: Highlight; color: HighlightText`.

## 3. Colour tokens

Colours are referenced by role only. No raw hex outside this block.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--c-page` | page background | `#F6F3EC` | `#171513` |
| `--c-card` | index card / input surface | `#FCFAF5` | `#201E1B` |
| `--c-well` | segmented track, hover fill, thumb placeholder | `#EEEAE0` | `#2A2723` |
| `--c-ink` | primary text, heavy rules, selected segment fill | `#1C1A17` | `#ECE6DA` |
| `--c-ink-muted` | metadata, labels, Arabic subtitles, placeholder | `#5C574E` | `#A8A194` |
| `--c-rule` | decorative hairlines (card edge, dividers). **Never** the only boundary of a control | `#DCD6CA` | `#34302B` |
| `--c-border` | control boundaries (inputs, secondary buttons, track) | `#7A746A` | `#7D766B` |
| `--c-accent` | card rule, primary fill, links, stamp | `#9E2B25` | `#E07A62` |
| `--c-on-accent` | text/icon on `--c-accent` | `#FFFFFF` | `#171513` |
| `--c-focus` | focus ring | `var(--c-accent)` | `var(--c-accent)` |
| `--c-selected-bg` | selected segment | `var(--c-ink)` | `var(--c-ink)` |
| `--c-selected-ink` | text on selected segment | `var(--c-page)` | `var(--c-page)` |

Derived states. These stay compliant by construction because each one only moves *away* from its
background:

- `--c-accent-hover`: light `color-mix(in oklab, var(--c-accent) 82%, black)`; dark
  `color-mix(in oklab, var(--c-accent) 85%, white)`. In both themes the contrast against
  `--c-on-accent` and against the page goes up.
- Hover fill for secondary, icon and unselected segments is `--c-well` (or `--c-card` when the
  item sits on the well). Both are already in the table below.

### 3.1 Contrast ratios (WCAG 2.x relative luminance, computed per channel)

**Text (needs ≥ 4.5:1)**

| Foreground / background | Light | Dark |
|---|---|---|
| ink / page | 15.67 | 14.65 |
| ink / card | 16.64 | 13.38 |
| ink / well | 14.45 | 11.96 |
| ink-muted / page | 6.47 | 7.10 |
| ink-muted / card | 6.87 | 6.49 |
| ink-muted / well | 5.97 | 5.80 |
| accent / page (links, stamp) | 6.71 | 6.18 |
| accent / card | 7.12 | 5.65 |
| accent / well | 6.19 | 5.05 |
| on-accent / accent (primary button) | 7.43 | 6.18 |
| selected-ink / selected-bg (segment) | 15.67 | 14.65 |

**UI boundaries and focus (needs ≥ 3:1 against adjacent colour)**

| Pair | Light | Dark |
|---|---|---|
| border / page | 4.18 | 4.06 |
| border / card (search field, secondary buttons) | 4.44 | 3.70 |
| border / well (segmented track edge) | 3.86 | 3.31 |
| focus ring / page | 6.71 | 6.18 |
| focus ring / card | 7.12 | 5.65 |
| focus ring / well | 6.19 | 5.05 |
| primary fill / page, card | 6.71, 7.12 | 6.18, 5.65 |
| selected segment fill / well track | 14.45 | 11.96 |

`--c-border` is 4.18:1 in light but below 4.5 on some surfaces, so **never use it for text.**
`--c-rule` is decorative and exempt. Nothing may depend on it to be perceived.

## 4. Typography

No web fonts. Three system stacks:

```
--font-serif:  Charter, "Bitstream Charter", "Sitka Text", Cambria, "Iowan Old Style",
               Georgia, "Noto Serif", serif;
--font-sans:   system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue",
               Arial, "Noto Sans Arabic", Tahoma, sans-serif;
--font-arabic: "Noto Naskh Arabic", "Noto Sans Arabic", "Geeza Pro", "Segoe UI",
               "Arabic Typesetting", Tahoma, sans-serif;
```

- **Serif** is for display only: wordmark, h1, h2, course titles. It carries the "press index"
  voice. Georgia defaults to old-style figures, so **never set numbers in the serif.**
- **Sans** is for UI, body, metadata and every number. All figures (sizes, page counts, results
  count, stats, call numbers) use `font-variant-numeric: tabular-nums lining-nums`.
- **Arabic:** every `[lang="ar"]` uses `--font-arabic`, `font-size: 1.08em` (Naskh renders small
  at equal em), `line-height: 1.7`, and keeps normal letter-spacing and case. Never apply
  `letter-spacing` or `text-transform` to Arabic: they break joining. The `dir="rtl"` span isolates
  bidi, and PRISM uses logical properties throughout.
- **Small-caps labels** (h3, stat labels, stamp, call number): sans, `--step--2`,
  `text-transform: uppercase`, `letter-spacing: 0.08em`, weight 600. Latin only.

### 4.1 Type scale (fluid, rem-anchored so it zooms)

| Token | Value | ~360px | ~1280px | Use |
|---|---|---|---|---|
| `--step--2` | `clamp(0.75rem, 0.73rem + 0.1vw, 0.8125rem)` | 12px | 13px | labels, stamp, kbd |
| `--step--1` | `clamp(0.875rem, 0.85rem + 0.12vw, 0.9375rem)` | 14px | 15px | metadata, buttons, h3 |
| `--step-0`  | `clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)` | 16px | 17px | body, search input |
| `--step-1`  | `clamp(1.125rem, 1.07rem + 0.28vw, 1.3125rem)` | 18px | 21px | course title, lede |
| `--step-2`  | `clamp(1.3125rem, 1.2rem + 0.55vw, 1.6875rem)` | 21px | 27px | stat figures |
| `--step-3`  | `clamp(1.625rem, 1.4rem + 1.1vw, 2.375rem)` | 27px | 36px | h2 (stage) |
| `--step-4`  | `clamp(2rem, 1.6rem + 2vw, 3.25rem)` | 33px | 51px | h1 |

Weights: serif 400 for h1/h2 (Charter's regular is sturdy), 600 for the wordmark and course
titles. Sans 400 for body, 600 for buttons/labels. Line heights: `--lh-tight: 1.15` (h1/h2),
`--lh-snug: 1.3` (titles), `--lh-body: 1.55`. Measure: `--measure: 65ch` for prose.
Use `text-wrap: balance` on headings, `overflow-wrap: anywhere` on course titles, and **never
line-clamp** (DoD 4: no clipped text).

## 5. Space, size, shape, depth, motion

```
/* spacing: 4px base */
--space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem; --space-4: 1rem;
--space-5: 1.5rem;   --space-6: 2rem;    --space-7: 3rem;    --space-8: 4rem;
--gutter:   clamp(1rem, 0.5rem + 2.5vw, 3rem);   /* page inline padding */
--page-max: 96rem;                               /* content cap; centred at 2560px */

/* targets */
--target-min:   2.75rem;  /* 44px: primary actions and every target on pointer:coarse */
--target-fine:  2.25rem;  /* 36px: allowed only under (pointer: fine); still > 24px */

/* thumbnails (aspect-ratio: 3 / 4, always with width/height attrs) */
--thumb-s: 6rem;   /* 96px  phone */
--thumb-m: 7rem;   /* 112px tablet */
--thumb-l: 8rem;   /* 128px desktop */
--thumb-xs: 3rem;  /* 48px  recently-opened row only */

/* shape: catalogue cards are nearly square-cornered */
--radius-0: 0;  --radius-1: 2px (controls, stamp, kbd);  --radius-2: 3px (cards, thumbs);

/* borders */
--bw-hair: 1px;    /* rules, control borders, card rule */
--bw-heavy: 2px;   /* rule above each stage h2 */
--rule-double: 3px double var(--c-ink);  /* under header, above footer: the "ledger" frame */

/* depth: none. Separation comes from rules and surface steps, never shadows. */
--shadow: none;
--z-base: 0;  --z-sticky: 10;  --z-skip-link: 40;

/* motion */
--dur-fast: 120ms;   /* colour/border/background on hover, press */
--dur-base: 200ms;   /* copy-link confirmation, details/disclosure */
--ease-out: cubic-bezier(0.2, 0.7, 0.2, 1);
--ease-std: cubic-bezier(0.4, 0, 0.2, 1);
```

**Motion rules:** animate only `color`, `background-color`, `border-color`, `opacity`, and small
`transform` (≤ 4px). Filtering results **does not animate**: the list swaps instantly, because
reflow animation on mid-tier Android hurts INP. No parallax, no scroll-linked effects, no
skeleton shimmer, no `scroll-behavior: smooth` by default.

**Reduced motion** (`prefers-reduced-motion: reduce`): set both durations to `0.01ms`, remove all
transforms, keep state changes instant. Any confirmation must still be legible without
animation. Pin this in headless audits (see SENTRY's memory note).

## 6. Layout

Page breakpoints are in `em`. Components adapt with container queries. Each `.course` is
`container-type: inline-size`.

| | ~360px phone | ~768px tablet | ≥1280px desktop |
|---|---|---|---|
| Library grid | 1 column, cards stacked | `repeat(auto-fill, minmax(min(100%, 20rem), 1fr))` gives 2 columns | Stage rail + grid, 2–3 columns |
| Stage section | h2 full width | h2 full width, stage stats on the inline-end | `grid-template-columns: 14rem 1fr`. h2, Arabic name and stage stats sit in the left rail |
| Card | thumb-s left, text right, actions full width below | thumb-m, actions in text column | thumb-l, actions in text column |
| Control bar | 2 rows: search; filters (wrap to 3 at 320px) | 1 row: search grows, two segments, count | 1 row, search max 28rem |
| Max widths | full minus gutter | full minus gutter | `--page-max`; prose `--measure` |

- At 2560px the content is capped at `--page-max` and centred. The grid reaches about 3 columns
  of cards. It must not stretch to 6.
- 200% zoom at 1280 behaves like the tablet layout. Nothing scrolls horizontally from 320px up.
- Sticky bar: `position: sticky; top: 0; z-index: var(--z-sticky)` on an opaque `--c-page` with a
  `--bw-hair` `--c-rule` bottom border (no blur, no translucency). Add
  `@media (max-height: 32rem) { position: static }` so landscape phones and high zoom aren't
  half-covered. Set `scroll-padding-top` on `html` to the bar's height so focused cards never sit
  under it (WCAG 2.4.11).

## 7. Components

### Header
- One row, `min-block-size: 3.5rem`, padding-inline `--gutter`, bottom `--rule-double`.
- Wordmark: `--font-serif`, `--step-1`, weight 600, `--c-ink`, links home.
  `TODO(content): wordmark text`.
- Theme toggle on the inline-end: a 3-option segmented control (System · Light · Dark) with
  **text labels**, not icons. It has the same spec as the segmented control below but uses
  `--step--2`. It requires JS, so render it `hidden` and let CIRCUIT unhide it. Reserve its inline
  size so the header doesn't shift. At 320px the wordmark wraps and the toggle stays intact.

### Intro
- Left-aligned, never centred. h1 in `--font-serif`, `--step-4`, `--lh-tight`, `--c-ink`, at
  most 20ch. Lede in `--step-1` `--c-ink-muted` at most `--measure`:
  `TODO(content): one-line description`.
- Stats form a "colophon" row, a `<dl>` of 3 items separated by `--c-rule` vertical hairlines
  (inline-start border). Values: sans `--step-2` tabular, `--c-ink`. Labels: small caps,
  `--c-ink-muted`. The values are generated, never hardcoded. The row wraps on phone.
- Padding-block `--space-7` on desktop, `--space-6` on phone.

### Search field
- Height `--target-min`. Background `--c-card`. Border `--bw-hair` `--c-border`. Radius
  `--radius-1`. Text `--step-0` (16px minimum stops iOS zoom-on-focus).
- Leading magnifier: inline SVG, 20px, 1.5 stroke, `currentColor` in `--c-ink-muted`, decorative.
- Trailing `<kbd>/</kbd>` hint: `--step--2`, `--c-ink-muted`, `--bw-hair` `--c-rule` border,
  `--radius-1`. Show only under `(hover: hover) and (pointer: fine)`. Hide while the field has a
  value or focus.
- Clear button when non-empty: icon-button spec, 44×44 on coarse pointers.

### Segmented controls (stage, semester, theme)
- Semantics belong to GRANITE (a radio group in a fieldset is suggested). Visible legend:
  small-caps "Stage" / "Semester" before the track.
- Track: `--c-well` background, `--bw-hair` `--c-border` edge, `--radius-1`, 2px inner padding.
- Segment: `min-block-size: var(--target-min)` on coarse pointers and `--target-fine` on fine.
  `min-inline-size: var(--target-min)`. Text `--step--1`, `--c-ink-muted`.
- Labels: "All · 1 · 2 · 3 · 4" and "All · 1 · 2". GRANITE supplies the full accessible names
  ("Stage 1").
- Hover: `--c-card` background, `--c-ink` text.
- **Selected:** `--c-selected-bg` fill, `--c-selected-ink` text, weight 600. Selection must not be
  shown by colour alone: the fill shape and the weight change carry it too.
- Stage 4 stays selectable. It leads to the honest empty state.
- Results count: sans `--step--1` tabular, `--c-ink-muted`, formatted "12 of 37". It sits at the
  inline-end of the bar.

### Course card (the index card)
```
┌───────────────────────────────────────────┐
│ ┌──────┐  CALL NO. 2·1·03                 │  small caps, muted, tabular
│ │cover │  Course Title In Serif            │  serif, --step-1, 600, ink
│ │ 3:4  │  ─────────────────────────────    │  1px --c-accent: "the red rule"
│ │      │  312 pp · 14.2 MB  [LARGE FILE]   │  sans --step--1 muted, tabular
│ └──────┘  [ Open ] [ Download ] [⧉]        │
└───────────────────────────────────────────┘
```
- Surface `--c-card`, `--bw-hair` `--c-rule` border, `--radius-2`, padding `--space-4`
  (`--space-3` below 360px). Grid: `var(--thumb-*) 1fr`, column gap `--space-4`.
- **Call number** (optional, generated from data as `stage·semester·index`, never hand-written):
  small caps, `--c-ink-muted`. It is the catalogue cue. Drop it if ATLAS rejects generated ids.
- **Title** links to the PDF (same target as Open) only if GRANITE agrees. Otherwise it is plain
  text.
- **Red rule:** `border-block-end: var(--bw-hair) solid var(--c-accent)` under the title, with
  `--space-2` above and below. It is decorative.
- **Metadata:** "312 pp · 14.2 MB". The separator is a middle dot in `--c-ink-muted`. Sizes have
  one decimal place.
- **Thumbnail:** real first-page image with `aspect-ratio: 3/4`, explicit `width`/`height`,
  `object-fit: cover`, `--c-well` background while loading, `--bw-hair` `--c-rule` border,
  `--radius-2`. Use `loading="lazy"` except for the first ~4 above the fold (QUARTZ decides).
  The alt text policy is GRANITE's.
- **Container query `(inline-size < 26rem)`:** actions move to a full-width row under both
  columns. That row is `Open` (flex 1), `Download` (flex 1), `Share` (fixed 44px).
- **Hover** (`hover: hover` only): border becomes `--c-border`. No lift, no shadow.

### "Large file" stamp
- Applies when size > 20 MB (the threshold is a CIRCUIT constant).
- Inline after the size. Text is "Large file" in small caps, `--c-accent` on `--c-card`
  (7.12 / 5.65). Border `--bw-hair` `--c-accent`, `--radius-1`, padding `0 var(--space-1)`.
- It looks like a library rubber stamp. Words, not just colour.

### Buttons
| Variant | Use | Spec |
|---|---|---|
| Primary | Open | `--c-accent` fill, `--c-on-accent` text, no border, `--radius-1`, `min-block-size: --target-min`, padding-inline `--space-4`, sans `--step--1` 600. Hover `--c-accent-hover`. |
| Secondary | Download, Clear filters | transparent, `--bw-hair` `--c-border`, `--c-ink` text, same size. Hover `--c-well` fill. |
| Icon | Share/copy link, search clear | 44×44 (36×36 allowed under `pointer: fine`), secondary styling, 20px SVG at 1.5 stroke in `currentColor`, accessible name supplied by GRANITE. |
| Text link | inline links, footer, "Clear" in recents | `--c-accent`, underline 1px, `text-underline-offset: 0.2em`. Hover thickness 2px. |

- **Copy-link confirmation:** the icon swaps to a check and a visible "Copied" label appears
  inline for 2s with an opacity fade at `--dur-base` (instant under reduced motion). No toast and
  no overlay. GRANITE wires the live region.
- No pills, no gradients. Active state is the hover colour only, with no scale.

### Focus ring (global)
`outline: 2px solid var(--c-focus); outline-offset: 2px;` on `:focus-visible`, for every
interactive element including segments, thumbnails-as-links and the search input.
- The offset gap shows the surrounding surface, so the ring always sits against page, card or
  well (≥ 5.05:1 in every case). That includes primary buttons, where the ring is separated from
  the accent fill by that gap.
- Never `outline: none` without this replacement. The sticky bar plus `scroll-padding-top` keeps
  the ring from being covered.

### Recently opened (JS only, ≤ 4 items)
- Placed after the control bar. Label "Recently opened" in small caps `--c-ink-muted` with a
  text-link "Clear" on the inline-end.
- Grid `repeat(auto-fill, minmax(min(100%, 15rem), 1fr))`. It **wraps rather than scrolling**.
- Each item is one link: `--thumb-xs` cover, title in sans `--step--1` `--c-ink`, and metadata
  in `--step--2` muted. Item min height is `--target-min`, with a `--c-rule` hairline below.
- Layout-shift risk: it appears above the library. See RISKS.

### Section headings
- **h2 (stage):** `--bw-heavy` `--c-ink` rule *above* (`border-block-start`) with `--space-3`
  padding. Text "Stage 2" in serif `--step-3`, then the Arabic name on its own line in
  `--c-ink-muted` with `--font-arabic`. Stage stats ("12 files · 310 MB") in small caps, muted,
  tabular.
- **h3 (semester):** small-caps sans "Semester 1", the Arabic name inline after a middle dot
  (Arabic is not uppercased or letter-spaced), and a `--c-rule` hairline below. Spacing:
  `--space-7` before each h2 and `--space-5` before each h3.

### Empty states
- **Stage 4 (no material):** a single slot the size of one card, with a `--bw-hair` **dashed**
  `--c-border` outline (the "empty drawer slot") on `--c-page`. The text is "No material uploaded
  yet." in `--step-0` `--c-ink-muted`. No illustration and no icon. `TODO(content)` if extra
  wording is wanted.
- **No search results:** left-aligned block, padding-block `--space-7`. First line in serif
  `--step-1` `--c-ink`: No courses match "{query}". The second line is muted and suggests
  checking spelling or the stage filter. Then a secondary "Clear filters" button. The count
  reads "0 of 37".

### Footer
- Top border `--rule-double`, padding-block `--space-7`, `--step--1` `--c-ink-muted`.
- Contains a text link to the GitHub repo, `TODO(content): repo URL`, and one line of
  attribution, `TODO(content)`. Left-aligned. Wraps naturally at 320px.

## 8. Performance notes for QUARTZ
Zero font bytes, zero decorative images, no shadows or blur (cheap paint on low-end GPUs). The
only real image weight is the cover thumbnails. Suggested delivery: AVIF/WebP at 2× of
`--thumb-l` (256×341), roughly 10–20 KB each. QUARTZ owns the final numbers.
