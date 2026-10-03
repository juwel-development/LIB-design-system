# Table column allocation and density: implementation evidence (#115)

Date: 2026-10-03. Implemented by an Orca worker (Claude Fable 5.1) on branch `feature/ticket-115`,
cut from local `main` at `b34645d` (package 3.9.1) and merged with `main` at `3ef4d2d` (reviewed
#113 selectable rows and #120 typography) before the stories were written, against the approved
[agent brief](./115-agent-brief.md). Nothing was pushed, merged onto `main`, published or
versioned; `/code-review` is a separate dispatch and release stays with a human. **Implementation
and publication are separate: no release version exists for this work, and consumer
[g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195) still awaits the
version semantic-release actually publishes.**

## Contract

`Table.Root` gains two optional props; nothing else on the seven members changes.

- `columns?: readonly TableColumnAllocation[]` - the allocation of every column, once, in the
  order the cells of every row are written. An entry is either fixed, `{ width: role,
  minWidth?: role }`, or proportional, `{ weight: number, minWidth?: role }`; the type refuses an
  entry with both or neither, a raw length, and a consumer custom-property name. `role` is
  `'name' | 'fact' | 'figure' | 'action'`, read from the theme as `--table-column-<role>`.
  Omitted or empty, widths follow content exactly as before. `TableColumnAllocation` is exported
  from the barrel as a value the consumer constructs, beside `FormState` and `PaletteTokens`.
- `density?: 'comfortable' | 'compact'`, default `comfortable`, derived from the Root recipe.
- A non-positive or non-finite `weight` throws `TableConfigurationError` (its own file, like
  ColumnLayout's), loud and early. Row cell counts are not checked.

New theme tokens, all in `:root` of all three stylesheets and none in a `@theme` block:
`--table-column-name: 12rem`, `--table-column-fact: 9rem`, `--table-column-figure: 8rem`,
`--table-column-action: 12.5rem` (one standard control, `--control-min-width`, plus the comfortable
insets); `--table-cell-inset-inline: 1rem`, `--table-cell-inset-block: 0.5rem` (exactly what
`px-4` / `py-2` resolved to) and `--table-cell-inset-inline-compact: 0.5rem`,
`--table-cell-inset-block-compact: 0.25rem`. The role vocabulary is the four column jobs #195's
comparison tables attest - the subject's name, a short comparison fact, a tabular figure with its
unit, one action control - and not a size ladder (ADR 0008, Amendments). Consumer guidance lives
in the Table stories' description and the namespace TSDoc; the README is untouched.

## Mechanism

Pure CSS, no measurement, server-correct. The Root writes the allocation as one custom property,
`--table-columns`, on the wrapper and marks it `data-columns="<n>"`. Each entry becomes one grid
track: a fixed role is `var(--table-column-<role>)`, floored as `max(var(min), var(width))` when it
has a minimum so it holds at any width; a proportional entry is `minmax(var(min) | 0, <weight>fr)`,
which is the browser's own floor-and-redistribute algorithm. Under `data-columns` the `table` is
`display: grid` with those tracks, the caption spans them, and each row group and each `tr` is a
column subgrid spanning them, so header and body cells share one set of boundaries that no row's
content can move. Rows stay boxes, so the row rules keep painting; the semantic elements are
unchanged. Cells take `overflow-wrap: anywhere` under an allocation so text, an unbroken run
included, wraps inside its track and contributes no width; a control keeps its own width. Every
narrow-viewport `notes` rule is gated with `:not([data-columns])`. Child combinators keep a nested
table out of the outer allocation's rules.

Density is a Root variant that publishes `--table-cell-padding-inline` / `-block` from the
comfortable or compact token pair; `Cell` and `HeaderCell` read those two properties instead of
`px-4 py-2`. The #113 selection inset (`pl-4` on a selected table's first cells) now reads the same
inline property, so it is unchanged at comfortable and consistent at compact.

The #114 overflow hook also observes the caption: under an allocation the tracks overflow the
table's own `w-full` box while the caption, spanning every track, is what grows, so a notes-mode
wrapper still turns its reachable group on and off as the allocation, a theme token or the width
changes.

## Test evidence

Written red first: the Table spec failed to load on the missing error class and the four token
contract tests failed before any production change; each was then made green. Added:

- `Table.spec.tsx` (21 new): type-level `density` union and allocation constraints with four
  `@ts-expect-error` shapes; comfortable default and per-table compact on one page; header and
  body cells reading the one published inset pair with no literal left; no allocation when
  omitted or empty; the written track list for fixed-only, proportional-only (`3fr`/`1fr`),
  proportional with a minimum, and fixed floored by a minimum (`max(...)`); allocation identical
  across filtered, reordered, emptied and repopulated rows with the same wrapper element; a change
  of definitions followed; weights `0`, `-1`, `NaN`, `Infinity` refused; semantic table, caption,
  two row groups, header associations, no row `tabindex` and no `aria-sort` under an allocation;
  every `max-md:` rule gated with `:not([data-columns])` in both notes modes.
- `renderTokens.spec.ts` (6 new): four positive rem column roles present in all three variants and
  out of every `@theme` block; comfortable insets exactly `1rem` / `0.5rem`; compact strictly
  smaller on both axes; insets out of every `@theme` block.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 54 files, 1132 tests (after the merge with `main`) |
| `npm run build` | Passed; `dist/index.css` carries the `grid-template-columns: var(--table-columns)` and `subgrid` rules and the inset properties |
| `npm run build-storybook` | Passed |

The pre-commit hook ran lint, typecheck and the suite on both commits.

## Browser evidence

Storybook dev on port 6115, driven headless in Chrome (Playwright 1.63 in the scratchpad, channel
`chrome`), 1400 px viewport, 16 px root, light unless stated. Every play function finished with no
`AssertionError` in the console; screenshots and `facts.json` are in the session scratchpad and not
committed. Measured facts:

- **FixedColumns** (64rem holder): header widths 192 / 128 / 128; body edges equal header edges
  (16–208, 208–336, 336–464); the wrapper fits (1024 / 1024) and the last column ends 560 px before
  the holder's edge - nothing stretched. Accessibility tree: `table "Dimensions"`, `caption`, two
  `rowgroup`s, `row`, `columnheader` ×3, `rowheader` under `display: grid`.
- **ProportionalColumns** (48rem): 576 / 192, the 3:1 ratio exactly.
- **RedistributionAtMinimums** (40rem): `3`/`1` both floored at `name` give 448 / 192 (the quarter
  share's 160 px fell under its 192 floor; the other took the 448 left, not its nominal 480); a
  `figure` column floored at `name` is 192, not 128.
- **ComparisonStability**: six header and six first-row body edges identical
  (16–472, 472–700, 700–928, 928–1056, 1056–1184, 1184–1384) after sorting by Name, sorting by
  Wage, paging, switching to the long German labels, filtering to one match (two rows), to no match
  (header row only) and clearing (header plus four rows). No cell overflows its box; all first-row
  cells share one top; wrapper 1368 / 1368. Dark theme: 456 / 228 / 228 / 128 / 128 / 200.
- **AvailableWidthChanges**: 464 / 232 / 128 / 200 at 64rem; at 40rem both floors bind at
  192 / 144 while the fixed columns keep 128 / 200 and the wrapper overflows (664 in 640); back at
  64rem the shares return and `scrollWidth === clientWidth`.
- **InsufficientWidth** (30rem holder, 32.5rem allocated): 192 / 128 / 200 held; wrapper 520 / 480
  while the document is 1400 / 1400 (no page-wide scroll); each secondary Button is 168 px inside
  its 200 px cell; the 53-character unbroken identifier wraps to a 94 px-tall cell with
  `overflow-wrap: anywhere` and no cell scroll overflow; no cell's right edge passes its
  neighbour's left. Tab lands on the `section` region with a 3 px solid ring; two ArrowRight
  presses scroll it to 40 px.
- **NotesKeptUnderAllocation** at 420 px: the content-driven supplementary table hides its note
  cells (`display: none`); the allocated supplementary table keeps all three note cells visible at
  the 15 px small role; the allocated `content` table keeps `display: grid` rows with all cells on
  one line (shared top); none of the three gains a tab stop - all fit at 388 / 388.
- **Density**: comfortable cells pad 16 / 16 / 8 / 8 px, header 16 / 8; compact 8 / 8 / 4 / 4,
  header 8 / 4; font sizes equal (15 px cells, 13 px headers); the ghost Hire button is 42 px tall
  in both; rows 62 vs 54 px; the six header widths identical in both tables. Tabbing through, every
  plain header button and the Hire buttons draw the 3 px solid ring in both tables (the compact
  table's `Preferred role` header ring is in the screenshot).
- **ThemedColumnWidths**: 192 / 128 / 448 under the defaults; 320 / 96 / 352 under a scope
  re-pointing `--table-column-name` to 20rem and `--table-column-figure` to 6rem.
- **Compatibility, pre-existing stories**: `SupplementaryNotes` still `display: table`,
  `table-layout: auto`, cells padded 16 / 8 px, note cells `table-cell` at 1400 and `none` at
  420; `ContentNotes` cells `display: block` at 420; `InteractiveRows` first cells padded 16 px
  (the #113 inset through the density property); `ResidualOverflowWithNotes` at 520 px is a
  `group` with `tabindex="0"` at 757 / 488.

## Not verified / limitations

- Only Chrome was driven. Firefox and Safari both ship subgrid, but Safari's accessibility tree
  under `display: grid` on table elements is the one known risk and was not listened to; no ARIA
  roles were added. A reviewer with Safari should check `table`/`row`/`cell` semantics on the
  `ComparisonStability` story.
- Screen readers were not listened to in any browser; the DOM and Chrome's tree carry the roles.
- Under an allocation cells align to the top of their row (grid items), where a content-driven
  table keeps the browser's middle alignment. Documented in the stories' description; not
  configurable.
- `overflow-wrap: anywhere` breaks a word only when it is longer than its line, so a long German
  compound in a narrow `fact` column breaks mid-word (visible in the Density screenshot). This is
  the brief's "ordinary text may wrap" and the alternative is overlap.
- The allocation never widens for content: a control wider than its column's width or floor
  overflows its own cell. The brief asks for this and the TSDoc says so; the `action` role's default
  holds one standard control.
- Row cell counts are not checked at render; a row with more cells than columns breaks onto a
  second line of its own row.
- Nothing is published; no version is claimed.

## Compatibility

No public API was removed or changed in meaning; both new props are optional and the seven
members are unchanged. `ITableRootProps` now extends the Root recipe's `VariantProps` (for
`density`), which adds optional members only. Comfortable density emits the exact former spacing
(verified at 16 / 8 px). A table without `columns` keeps its content-driven widths and both `notes`
behaviours byte-for-byte in the recipe except for the `:not([data-columns])` gate. No token was
removed, no required prop changed, no breaking marker. The `TableColumnAllocation` type is a new
barrel export. Merge note for the coordinator: this branch already contains `main` at `3ef4d2d`;
the #113 `pl-4` selection inset was replaced by `pl-[var(--table-cell-padding-inline)]` in the
merge commit so compact tables keep their marker room.
