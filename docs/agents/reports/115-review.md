# Table column allocation and density: review (#115)

Date: 2026-10-03. Reviewed by an Orca worker (Claude Fable 5.1) on branch `feature/ticket-115`
against the fixed merge-base with `main`, `3ef4d2d` (package 3.9.1), following
`.claude/skills/code-review/SKILL.md`: a Standards axis and a Spec axis ran as two fresh parallel
sub-agents over `git diff 3ef4d2d...HEAD`, the reviewer verified compatibility and the browser
evidence itself, and confirmed findings were fixed and committed here. The spec is issue #115 with
its approved [agent brief](./115-agent-brief.md) (identical to the issue's one comment, fetched
with all comments), which supersedes the original body; the issue carries `ready-for-agent`. The
implementer's [report](./115-implementation.md) was treated as claims to verify, not as evidence.
The two axes are reported separately on purpose and are not reranked against each other.

Commits under review: `2bddabb` (feat), `a87e322` (merge of `main` at `3ef4d2d`), `7c2e384` (docs).
Commits made by this review: `2c48521` (fix), `b304489` (merge of the current local `main` at
`cb13ccf`, on the coordinator's instruction, so the composition checks run against the #119
Button and #121 Tabs changes), `6fad827` (docs), and the one carrying this report.

## Standards axis

Sources: `docs/agents/standards/{coding,architecture,testing,design-system-components}.md`,
`CONTEXT.md`, ADRs 0002, 0003, 0004, 0008 (Amendments, #115), 0013, the sibling precedents
`ColumnLayout` and `FieldRow`, plus the Fowler smell baseline the skill carries.
`npm run fallow:agent -- --base 3ef4d2d` supplied the reading order; its styling findings were the
expected arbitrary `var()` utilities (`grid-cols-[var(--table-columns)]`, the inset properties).

Hard violations (documented standard):

- **Comment budget** (`coding.md` § Comments: any non-header block ≤ 4 lines). The
  `useHorizontalOverflow` block in `Table.tsx` was 6 lines (the #114 review had trimmed it to 4;
  this diff added two), the `TABLE_COLUMN` comment in `renderTokens.ts` 6 and `TABLE_CELL_INSET` 5.
  **Fixed** in `2c48521`. The JavaScript comments are not emitted, so `tokens*.css` is unchanged
  (`npm run build:tokens` produces no diff).
- **Default defined twice** (`design-system-components.md` § One recipe: defaults live in
  `defaultVariants`). `data-density={density ?? 'comfortable'}` repeated the literal in two places
  beside the recipe's default. **Fixed**: one `DEFAULT_DENSITY` constant feeds all three.
- **"Never assert on the class string"** (`testing.md` § Querying) — the new spec adds two
  instances: the cells' inset utilities and the `:not([data-columns])` gate on every `max-md:`
  utility. **Not fixed, recorded as the same deviation the #114 review recorded**: jsdom computes
  no Tailwind style, 27 spec files do this, and the browser-side proof of the gate now lives where
  `testing.md` allows it, in the `NotesKeptUnderAllocation` play (below). The selector-text test is
  brittle against a Tailwind rewrite and is the first thing to drop once the play is trusted.

Judgement calls (baseline smells):

- **Mysterious Name**: `roleOf` took a role and returned a `var()` width; `allocationOf` returned a
  grid track list where CONTEXT.md's "allocation" is the consumer's declaration. **Fixed**:
  `widthOf`, `trackListOf` (and the spec's reader of the same name). `rect`, `a`, `b` in the
  stories are `box`, `leftValue`, `rightValue`.
- **Data Clump**: `useHorizontalOverflow(wrapper, table, caption)` takes three refs of one type.
  **Declined**: a `readonly RefObject[]` parameter would be a new array on every render and so a
  dependency the layout effect cannot hold still; three named refs keep the deps static.
- **Duplicated Code (cross-component)**: `TableConfigurationError` is `ColumnLayout`'s error class
  with the name swapped, and the positive-finite-weight guard now exists in `ColumnLayout`,
  `FieldRow` and `Table`. Extraction is blocked by `architecture.md` (no cross-component imports),
  as the #114 review recorded for the overflow hook. **Recorded**, not changed.
- **Duplicated Code (stories)**: `ResizableCandidates` and `InsufficientWidth` hand-write rows that
  `Candidates` could render. **Left**: they are deliberately smaller fixtures with fewer columns.
- **`null` in the public type**: `ITableRootProps extends VariantProps<typeof table>` admits
  `density: null`, against `coding.md` § Absence. About twenty props interfaces share this CVA
  precedent; a repo-wide pattern, not a #115 defect. **Recorded.**
- `expect([...]).toHaveLength(4)` consuming the `@ts-expect-error` variables copies
  `ColumnLayout.spec.tsx` exactly. Accepted as house precedent.

Checked and compliant: token regeneration is a no-op and all three stylesheets are pinned by
`Palette.spec.ts`; Tailwind 4.3.3 emits `overflow-wrap: anywhere`, `grid-template-columns: subgrid`
and `grid-template-columns: var(--table-columns)` in `dist/index.css`; `TableColumnAllocation` is a
shape a consumer constructs, the `PaletteTokens`/`FormState` exception, and the barrel adds one
line; `TableColumnWidthRole` and `TableRootStyle` stay file-local like `ColumnLayoutRootStyle`;
`density` is derived from the recipe and pinned to `'comfortable' | 'compact'`; the render-time
throw matches `ColumnLayout` exactly and is tested for `0`, `-1`, `NaN`, `Infinity`; no `p[xy]-\d`
literal remains on a cell; `Theme/` imports nothing from `src`; `Table.tsx` imports only its own
error class; ADR 0008's amendment matches the code (four job-named roles, no size ladder, density
as two theme pairs, no typography or control dimension moved); CONTEXT.md's two entries match the
TSDoc; behaviour-sentence test names, one `describe` in `Table.spec.tsx`, two new per-contract
describes in `renderTokens.spec.ts` beside its seventeen.

## Spec axis

Source: the agent brief on #115 (the issue's one comment), the issue body, ADR 0008 § Amendments,
CONTEXT.md, and g-label-manager #195 for the role vocabulary.

Missing or partial:

- **Header/body alignment was never asserted.** Brief: "Public examples demonstrate … consistent
  header/body alignment." Every play measured `columnheader` elements only; the implementation
  report's body-edge figures were an ad-hoc measurement. **Fixed** in `2c48521`: `isEveryRowOn`
  checks that every row's cell boundaries equal the header's, in `FixedColumns` and in
  `ComparisonStability` at the start, after the long labels and after the final clear.
- **`NotesKeptUnderAllocation` had no play.** Brief: "Use real browser geometry/interaction checks
  for sizing and overflow; DOM tests alone do not prove layout." **Fixed**: the story selects the
  large-mobile viewport (`parameters.viewport.options`, `globals.viewport`) and its play checks
  whichever case the viewport is in: below 48rem the content-driven table hides its note cells and
  the two allocated tables keep every note cell displayed, every row's cells on one top, and the
  right cell count; above 48rem all three show every column.
- **Selection and focus under an allocation were undemonstrated.** Brief: "Composed actions and
  #113 row interactions remain independent"; the coordinator asked for marker/focus coexistence
  explicitly. **Fixed** in `6fad827`: `SelectionUnderAllocation`, a compact allocated roster with
  #113 selection and nested controls, whose play proves the marker on the selected row's first
  cell at the compact inset, the inset on every first cell, ring and marker on one row, activation
  moving the marker, and header/body alignment throughout. `ArtistRoster` passes `columns` and
  `density` through.
- **Publication** — "Publish through the normal release process and record the actual released
  version in consumer #195" — pending, not a gap; see the last section.

Not asked for:

- `data-density` on the wrapper. Harmless observable surface mirroring `data-notes`; only tests read
  it. **Kept**, now fed from the one default.
- `wrap-anywhere` on every cell under an allocation. Not creep: the brief requires "long unbroken
  content … neither overlaps neighboring columns nor becomes unreachable", and `InsufficientWidth`
  proves it. It breaks a German compound mid-word in a narrow `fact` column (visible in the
  Density screenshot); the alternative is overlap.
- `TableColumnAllocation` barrel export: the consequence of "Public typings constrain column
  definitions". `pl-4` → the density inset for the #113 marker room: a necessary consequence,
  identical at comfortable (`--spacing` is not re-pointed anywhere in `src`).

Implemented but questionable:

- **Table semantics under `display: grid`.** Brief: "Caption, header associations, semantic table
  structure … remain valid." The recipe sets `grid` on `table`, the row groups and every `tr`, and
  grid items are blockified, so every table element's display changes under an allocation (as the
  pre-existing `notes="content"` stacking already changed them to `block` below 48rem). Chrome's
  **native** tree, read through CDP `Accessibility.getFullAXTree`, keeps `table`, `rowgroup`, `row`,
  `columnheader`, `rowheader` and `cell` under the grid. WebKit's native tree could not be read:
  Playwright 1.63's `ariaSnapshot` derives roles from the DOM (it showed the roles in both engines,
  which proves nothing about either), `page.accessibility` is gone, and macOS System Events has no
  assistive access from this terminal. The coordinator asked for a fix rather than an accepted gap,
  so **fixed** in `2c48521`: every member states its role explicitly (`table`, `rowgroup`, `row`,
  `columnheader`/`rowheader` by `scope`, `cell`), the recognised mitigation, so no engine's handling
  of a display change decides the semantics. The native elements are unchanged, so markup with
  JavaScript off is as before. Biome's `noRedundantRoles` is switched off for `Table.tsx` alone, by
  an `overrides` entry in `biome.json`, and the comment at `TableHead` says why. A new DOM test pins
  the roles. Chrome's native tree with the roles now also exposes the `tbody` row group it used to
  mark ignored.
- **Zero-width proportional columns.** `minmax(0, Nfr)` collapses to nothing once fixed widths and
  floors alone exceed the available width, and the cell's inset then overflows its track. The TSDoc
  said so; **fixed** by one sentence in the stories' description naming it and why the `name`
  column carries a floor.
- **Row cell counts are not validated.** Brief: "document the required consistent column count",
  which `@CallerMustEnsure` does. Compliant; no runtime check is required.

Verified satisfied: fixed tracks do not stretch (`justify-content: normal` stretches `auto` tracks
only); `minmax(0, 3fr) minmax(0, 1fr)` is 3:1; a bound floor hands the remainder to the other `fr`
tracks; `max(var(), var())` is a valid track breadth; the `overflow-x-auto` wrapper receives the
grid's scrollable overflow and the caption, spanning every track, is what the overflow hook
observes; every `max-md:` rule is gated on `:not([data-columns])` and `data-columns` sits on the
wrapper in both branches; merge-base cells were `px-4 py-2` and the comfortable tokens are
`1rem` / `0.5rem`, with `first:pl-0 last:pr-0` retained; theme re-pointing is proven by
`ThemedColumnWidths`; the four roles map to #195's Staff: Candidates columns (name, role and
proficiency, age and wage, hire), and `ComparisonStability` resembles that table with German
labels, a `Link`, `Button`s and an `Input`; nothing from the out-of-scope list was built.

## Fixes made by this review

`2c48521` `fix(table): state table roles explicitly and prove header/body alignment in the #115 stories`

- Explicit table roles on all seven members, test-first (the spec went red on the missing roles).
- `isEveryRowOn` in `FixedColumns` and `ComparisonStability`; the `NotesKeptUnderAllocation` play
  and viewport; one `DEFAULT_DENSITY`; `widthOf` / `trackListOf`; comment budget; story names; the
  zero-width sentence; the scoped `biome.json` override.

`b304489` merge of local `main` at `cb13ccf` (#119, #120, #121 and their reviews), clean, no
conflicts; the token stylesheets regenerate to exactly what is committed.

`6fad827` `docs(table): show selection and focus under a compact allocation (#115)`

- `SelectionUnderAllocation` story and play; `ArtistRoster` forwards `columns` and `density`.

## Compatibility

Verified against the merge-base by reading the diff, not the commit messages:

- All seven members keep every pre-existing prop with its previous optionality. `ITableRootProps`
  gains `columns?` and `density?` only (the latter through `VariantProps`, which also admits `null`,
  the repo-wide CVA precedent).
- Without `columns` the wrapper carries no `data-columns` attribute and no `--table-columns` style,
  so no `[&[data-columns]…]` rule matches; the only change to a pre-existing recipe string is the
  `:not([data-columns])` gate on each `max-md:` rule, and the browser shows the content-driven
  stories unchanged (`display: table`, `table-layout: auto`, cells `16px / 8px`, supplementary
  notes `table-cell` at 1400px and `none` at 420px, content notes `block` at 420px, the #114 group
  with a tab stop at 520px, the #113 first-cell inset `16px`).
- Comfortable density emits the former spacing exactly (`px-4 py-2` was 1rem / 0.5rem at the
  default `--spacing`; the tokens are 1rem / 0.5rem; measured 16 / 8 px).
- `src/index.ts` adds one line (`TableColumnAllocation`). Eight tokens added, none removed or
  renamed. No required prop changed, no `!` type, no breaking marker in any commit. The explicit
  roles are additive attributes equal to the implicit ones. Minor release at most.
- The merge of `main` brought #119's Button changes under the `action` column: the secondary
  `Einstellen` button still measures 168px inside the 200px action cell at insufficient width, and
  the ghost `Hire` button is 42px tall at both densities.

## Checks

Before the merge of `main`, at `2c48521`; after it, at `6fad827` (and by the pre-commit hook on
every commit):

| Check | Before merge | After merge |
|---|---|---|
| `npm run lint` | green, 178 files | green, 178 files |
| `npm run typecheck` | green | green |
| `npm run test` | 54 files, 1133 tests (1132 + the roles test) | 54 files, 1217 tests |
| `npm run build` | green; `dist/index.css` carries the grid, subgrid and `overflow-wrap` rules | green |
| `npm run build-storybook` | green | green |
| `npm run build:tokens` | no diff | no diff |

## Browser evidence

Storybook dev on port 6115, driven with Playwright 1.63 from the session scratchpad: Chrome through
`channel: 'chrome'`, and WebKit 26.6 (Playwright's build; not Safari, but the WebKit engine).
1400px viewport, 16px root, light unless stated. A hook on the Storybook channel records
`storyFinished` and `playFunctionThrewException` per story; facts are read from computed style,
geometry and `document.activeElement`. Screenshots and `facts.json` are in the scratchpad under
`shots-chromium/` and `shots-webkit/` and are not committed. Every play below finished with no
exception in both engines, before and after the merge of `main`.

- **Plays passed in Chrome and WebKit**: `FixedColumns`, `ProportionalColumns`,
  `RedistributionAtMinimums`, `ComparisonStability` (light and dark), `AvailableWidthChanges`,
  `InsufficientWidth`, `NotesKeptUnderAllocation` (at 420px; and in Chrome at 1400px, where the
  content-driven notes are `table-cell`), `Density`, `ThemedColumnWidths`, `SelectionUnderAllocation`.
- **Header/body alignment** (`ComparisonStability`, both engines): header boundaries
  `16–472 472–700 700–928 928–1056 1056–1184 1184–1384`; every body row's cell boundaries equal
  them; all first-row cells share one top; no cell overflows its box; the `table` is `display:
  grid`. Dark: 456 / 228 / 228 / 128 / 128 / 200.
- **Insufficient width** (30rem holder, both engines): 192 / 128 / 200 held; wrapper 520 / 480,
  document 1400 / 1400 (no page-wide scroll); both secondary buttons 168px inside 200px cells; the
  53-character unbroken identifier wraps to a 94px cell with `overflow-wrap: anywhere` and
  `scrollWidth === clientWidth`. Chrome: Tab lands on the `section` named `Candidates` with a
  `solid 3px` ring and two ArrowRight presses scroll it to 40px.
- **Notes at 420px** (both engines): the content-driven supplementary table hides its three note
  cells; the allocated supplementary table keeps them displayed at the 15px small role; the
  allocated content table keeps `display: grid` rows with three cells on one top; none gains a tab
  stop, all fit at 388 / 388.
- **Density** (both engines): comfortable cells pad 16 / 16 / 8 / 8 px, compact 8 / 8 / 4 / 4;
  header 8 vs 4 px on the block axis; font sizes equal (15px cells, 13px headers); the ghost Hire
  button is 42px tall in both; rows 62 vs 54 px. Focus ring on the compact table's `Name` header
  button: `solid 3px` in Chrome by Tab and in WebKit by Option+Tab (WebKit skips buttons on plain
  Tab, as Safari does by default).
- **Selection under a compact allocation** (both engines): the selected row's first cell carries a
  2px marker, the others 0px; every first cell pads 8px; the focused `tr` has `solid 3px` at 2px
  offset; after Enter on the next row the marker moves to it and leaves the first; header widths
  520 / 260 / 128 / 200 / 260 unchanged throughout; rows `display: grid`; `data-density="compact"`.
- **Native accessibility tree, Chrome (CDP)**: under the grid, `table "Candidates"` → `caption`,
  `rowgroup` → `row` → six `columnheader`s, `rowgroup` → `row`s of `rowheader` and `cell`s. The same
  shape as the content-driven table beside it.
- **Compatibility stories** unchanged, as listed under Compatibility.

## Not verified / limitations

- **WebKit's native accessibility tree** could not be read (see the Spec axis). The explicit roles
  make the semantics independent of it; a reviewer with Safari and VoiceOver should still listen to
  `SelectionUnderAllocation` or `ComparisonStability` once.
- Screen readers were not listened to in any engine. Firefox was not driven.
- In headless WebKit the focused scroll wrapper did not scroll on ArrowRight (`scrollLeft` stayed
  0) — on the pre-existing #114 `ResidualOverflowWithNotes` story as well as on `InsufficientWidth`,
  so this is the #114 contract under headless WebKit's keyboard scrolling, not an allocation effect.
  Chrome scrolls it.
- Under an allocation cells align to the top of their row; a content-driven table keeps the
  browser's middle alignment. Documented in the stories' description; not configurable.
- `overflow-wrap: anywhere` breaks a word only when it is longer than its line, so a long German
  compound in a narrow `fact` column breaks mid-word. The brief's "ordinary text may wrap"; the
  alternative is overlap.
- The allocation never widens for content and row cell counts are not checked at render; both are
  stated in `@CallerMustEnsure`.
- The class-string spec tests and the duplicated error class and guard are recorded, not resolved.

## Acceptance and publication

Implementation: every acceptance criterion in the brief is met on this branch, except the last one,
which is not an implementation criterion. Publication: **pending**. Nothing was pushed, published or
versioned, and no release version exists for this work; the brief's final criterion — "Publish
through the normal release process and record the actual released version in consumer #195" —
belongs to a human and stays open. The ticket was moved to **In Review** with
`scripts/set-status.sh 115 "In Review"` (verified: one board entry reading `In Review`); `Done`
is not this review's to set.
