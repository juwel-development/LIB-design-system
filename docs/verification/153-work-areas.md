# #153 alternative arrangements — 2026-11-05

Authority: the approved Agent Brief,
[#153 comment 6656932438](https://github.com/juwel-development/LIB-design-system/issues/153#issuecomment-6656932438),
read with the issue body and both triage comments through `gh issue view 153 --comments`. The brief
supersedes the body's continuity requirements. Base revision: `17980f5` (domain vocabulary for #153).
Read CONTEXT.md, the four standards, ADR 0007, 0008 (Amendments) and 0013.

## What was built

`ColumnLayout.Alternatives` — one new member of the existing `ColumnLayout` namespace, no new
barrel line, token or error class.

| Prop | Type | Meaning |
| --- | --- | --- |
| `children` | `ColumnLayout.Root` elements | The alternatives, in the consumer's order of preference |
| `fallback` | `ReactNode`, optional | Mounted when none fits; absent, the last declaration stays |
| `fill` | `boolean`, optional | Pass the parent's allocated height to what is mounted |
| `testId` | `string`, optional | |

An alternative is a `ColumnLayout.Root`, so its minimum usable widths are its columns' `minWidth`
tokens and its fit is that Root's documented threshold, `(n − 1) × g + max(mᵢ × S ⁄ wᵢ)`, equality
fitting. The stylesheet evaluates the threshold in one hidden probe per declaration; script reads
only whether a probe is zero wide, selects, and mounts. The contract is in the component's TSDoc
and in the Storybook page *Arrangement/ColumnLayout Alternatives*; the decision record is ADR 0008,
Amendments.

A second, separate change: inside Screen, Pane now measures its room as Screen's remainder less
whatever sits above the pane (`fix(pane)`). It was found by this work and is described under
*Short heights* below.

Stories: `ColumnLayoutAlternatives.stories.tsx` (Preference, FitBoundary, TokenChange, NoneFits,
Lifecycle, TwoAreas, each with a measuring play function) and `ScreenWorkAreas.stories.tsx`
(English, German, ShortBodies, ReadOnly, ReadOnlyGerman, NarrowFallback) — a representative
consumer screen inside Shell, a status/action bar and a six-entry Sidebar. Its area names, tokens
and grouping belong to the fixture, not the library.

## Reproduction

```sh
npm run build
npm run build-storybook
npm run storybook -- --ci --port 6012
# In another terminal, after Storybook is ready and with no build running:
SCREEN_STORYBOOK_URL=http://localhost:6012 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/work-areas.mjs
SCREEN_STORYBOOK_URL=http://localhost:6012 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen.mjs
SCREEN_STORYBOOK_URL=http://localhost:6012 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/roster.mjs
npm run lint && npm run typecheck && npm test
```

## jsdom results — selection logic and lifecycle, not layout

`ColumnLayoutAlternatives.spec.tsx`, 33 tests. jsdom lays nothing out, so the spec answers each
probe's fit itself and fires a stand-in ResizeObserver. It therefore proves what the component does
*given* a fit, and nothing about whether an arrangement fits a width:

- first fitting declaration when several fit; the next when the first does not; the last when none
  does; the fallback when none does and one is supplied; `undefined`, `null` and `false` fallbacks
  count as absent; two instances select independently;
- a fit change selects again without a consumer rerender, and is committed synchronously inside the
  observation; changed declarations select again without a resize; no arrangement in a server render;
  one selection where there is no ResizeObserver; the observer is disconnected on unmount;
- lifecycle: content is untouched (same node, focus, value, one subscription) by a fit update that
  keeps the selection; a column declared under one key in two arrangements keeps its node, focus and
  value across the change in both directions; removed content unmounts and its subscription ends;
  returning content is a new node with default value, no focus, no text selection and fresh local
  state; a consumer-owned draft is shown again without focus;
- no duplicate id and one emission per activation in either arrangement; regrouping into Tabs emits
  no selection request, shows the consumer's `active`, leaves the inactive panel empty, and a later
  round trip neither changes nor remembers the active view;
- each probe carries the same threshold text and gap role as the row it stands for;
- arrays, fragments and conditionals; an empty declaration list; `ColumnLayoutConfigurationError`
  for text, a host element, a loose Column, a wrapped Root, a Root without columns and an invalid
  column in an unselected declaration; no role, name or tab stop of its own.

`Pane.spec.tsx` gained two cases for the row above a pane. Whole suite: 65 files, 1,484 tests passed.

## Browser observations — Chromium 156.0.8078.4

`scripts/browser/work-areas.mjs`: **PASS**, 59 JSON records. CSS pixels, 16px root font, region gap
24px. Fixture theme: `--work-area-min-width: 20rem`, `--sides-min-width: 22rem`, equal weights, so
three areas fit from 1104px and the grouped pair from 728px of the Alternatives' own width.

Reference windows, identical for source CSS and for `dist/styles.css`, `styles.light.css` and
`styles.dark.css` (source styles removed and their absence asserted). Bodies are visible/content
height:

| Locale / window | Mounted | Own width | Columns | Bodies |
| --- | --- | ---: | --- | --- |
| EN 1920×1080 | three areas | 1566 | 506 / 506 / 506 | 616/2954 · 542/967 · 481/1729 |
| DE 1920×1080 | three areas | 1566 | 506 / 506 / 506 | 616/2954 · 542/967 · 481/1729 |
| EN 1280×720, first tab | tab group + sides | 926 | 451 / 451 | 237/2954 · 194/967 |
| EN 1280×720, second tab | tab group + sides | 926 | 451 / 451 | 102/1729 · 194/967 |
| DE 1280×720, first tab | tab group + sides | 926 | 451 / 451 | 217/2954 · 194/967 |
| DE 1280×720, second tab | tab group + sides | 926 | 451 / 451 | 83/2382 · 194/967 |

In every row: one main and one H1; document 1920×1080 or 1280×720 with no scroll range on either
axis; Shell body not scrolling; bar (59.5px) at the top; Sidebar beside the content; every head and
the release foot inside the window; columns on one row in declaration order; no duplicate id. At
1280×720 two genuine tabs, exactly one selected, each naming its panel and named by it, the inactive
panel hidden and empty, the sides panel beside either tab. German tab labels wrap inside their tabs
(row 64px against 44.5px) and the row does not scroll. A wheel over the pool body or the sides body
scrolls that body only.

- **Fit boundary.** Sweeping the window from 1450 to 1466px moves the own width from 1096 to 1112px:
  the tab group is mounted through 1103px and the three areas from exactly 1104px. From 810 to 826px
  the last declaration is stacked through 727.125px and holds its row from exactly 728px. A selected
  arrangement was never stacked. The play functions add a holder exactly at a `2 : 1 : 1` threshold
  (three areas) beside one a quarter pixel short (two areas), and two instances of 40rem and 26rem in
  one window selecting differently.
- **Theme token.** Re-pointing `--work-area-min-width` to 40rem at an unchanged 1920×1080 window
  mounts the tab group; restoring it mounts the three areas.
- **Lifecycle.** With a title typed and focused (text selected), a matrix value typed in the sides
  panel and one recording placed, shrinking to 1280×720 leaves focus on the document, no title
  control in the DOM, the same matrix node with its value, and the count at one. Growing back with
  focus in the matrix field keeps that focus and node; the title shows the consumer's draft with no
  focus and a collapsed selection. ArrowRight on the first tab selects and focuses the second; Tab
  then reaches the panel and the title. A second placement after two regroupings counts two.
- **Short bodies.** At 1920×1080 no body scrolls and each keeps its content height (254, 193,
  137px), the foot directly below its body. At 1280×720 the pool body is bounded at 237 of 254px.
- **Two areas.** ReadOnly and ReadOnlyGerman mount one declaration at both windows: two equal
  columns (771px, 451px) reaching the trailing edge, no tab, no pool, bodies bounded.
- **Below the reference windows**, EN and DE at 1023×720, 900×720, 800×720, 600×720 and 360×640:
  no horizontal scroll range in the document or the Shell body, columns inside the window, the last
  declaration mounted - on one row while the own width is at least 728px, stacked below it - and
  the Shell body scrolling. Native Tab reached all 52 controls of the main, each in view when
  focused. Below 64rem Sidebar stacks its list above the content, as it always has, which is why
  nothing is bounded there.
- **Short heights** at 1280px wide, 720 down to 320px: every measured state was either bounded with
  each body at least one 24px line tall, or released as a whole to the Shell body. EN and DE with
  the first tab released at 570px; DE with the second tab at 674px, its body 39px tall at 676px.
  All controls stayed reachable by Tab at 320px, and 720px restored the bounds.
- **Fallback.** NarrowFallback at 1024×720 (own width 695.6px, below both thresholds) mounts the
  consumer's three-tab fallback, bounded beside the Sidebar (pool body 323/2954) with the Shell
  body still. The same window without a fallback stacks the last declaration and the body scrolls.

### The short-height defect this found

Before the Pane change, DE at 1280px with the second tab active gave a release body of 13px at a
650px window, 3px at 640px and 0px at 630px, releasing only at 620px: the tab row above the pane was
not counted against its room. After it the body is never below a line. `screen.mjs` (**PASS**, 42
records) and `roster.mjs` (**PASS**, 113 records) were rerun on the same build and are unchanged in
outcome, as a pane directly in a column starts at the top of the remainder.

## Checks

- `npm run lint`: 215 files, no errors. `npm run typecheck`: passed.
- `npm test`: 65 files / 1,484 tests passed.
- `npm run build` including `check:build`: passed; `dist/design-system.js` exports
  `ColumnLayout.Alternatives`; `npm pack --dry-run`: 161 files.
- `npm run build-storybook`: completed.

## Limits

- Chromium only. Firefox and WebKit were not run: the matching Playwright builds are not installed
  on this machine. The mechanism uses `clamp()` with a percentage in `width` and ResizeObserver.
- Representative fixtures only. Actual Label Manager content, theme, translations and reference
  validation remain the consumer's; these windows are outcomes of the fixture's tokens.
- An arrangement whose own holder changes width because of what is mounted - a scrollbar that
  appears for one arrangement only - can alternate. The contract states it as a caller constraint;
  no hysteresis was added, since it would blur the exact boundary.
- Before the first measurement nothing is mounted, so a server render carries no arrangement.
- Focus inside removed content falls to the document. That is the approved behavior, not restored.
- No assistive-technology run. Tab semantics are the existing Tabs component's.
- No push, merge, publication, issue closure or tracker write. Review is left to the separately
  dispatched reviewer; no Fallow result is claimed here.
