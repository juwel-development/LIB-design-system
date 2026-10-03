# #113 Table selectable rows — implementation and validation evidence

Implements the approved Agent Brief on
[#113](https://github.com/juwel-development/LIB-design-system/issues/113) for consumer
[juwel-dev/g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195).
Implementation only: **no release has been published** as part of this work. Release status is
recorded separately once the normal release process has run; nothing here claims a version.

## What shipped

Commit `3e0cc29` on `feature/ticket-113` — `feat(table): selectable rows with independent
activation on Table.Row (#113)`.

- `Table.Row` gains `onClick$?: Subject<void>` and `isSelected$?: Observable<boolean>`, independent
  of each other, through the existing `Table` namespace. No other member changes its props.
- `onClick$` present: the `tr` keeps its row semantics, gains `tabIndex=0`, the shared focus ring
  (docs/adr/0002, outside the row at the token offset) and a pointer cursor. A click on the row
  body, or Enter or Space while the row is focused, emits exactly once; Space's default scroll is
  prevented; a held key does not repeat. Keys count only when the row itself is the target, and a
  click whose target sits inside a nested control (`a[href]`, `button`, `input`, `select`,
  `textarea`, `summary`, `label`, `[contenteditable]`, `[tabindex]` or an interactive ARIA role)
  is the control's, never the row's. Consumers stop no propagation.
- `isSelected$` present: `aria-selected` is rendered (`false` until the source emits) and a selected
  row paints a marker bar along its leading edge in `foreground`, on the first cell's `::before`,
  keyed on `aria-selected`. Reset-then-subscribe in a layout effect; a replaced source reads
  unselected until it emits; unmounting unsubscribes (docs/adr/0013). No fill, no hover.
- `Table.Root` reserves the first-cell inset (`pl-4`, the ordinary cell padding) on every row of a
  table that holds any `aria-selected` row, and ring room (padding plus negative margin from the
  two ring tokens, the Tabs precedent) on a table that holds any `tr[tabindex]`. Both are `:has()`
  rules, so a table with neither keeps its static markup and geometry exactly.
- New token `--table-selection-marker-thickness: 2px` in all three token stylesheets, regenerated.
- README `## Table` section and `Table` TSDoc explain the activation and selection semantics.

## Decisions within the brief

- The row stays a `tr` with `role=row`; no row-wide button. The ring is drawn outside the row with
  room made by Root rather than inside the row, because an inside ring covered the 2px marker when a
  selected row was also focused (seen in the first browser pass and corrected).
- `aria-selected` is emitted only when `isSelected$` is supplied, so static rows announce nothing.
- No per-row identity, registry or policy. Stories tie each row's streams to the consumer's id.

## Checks

| Check | Result |
|---|---|
| `npm run lint` | clean (153 files) |
| `npm run typecheck` | clean |
| `npm run test` | 47 files, 868 tests passing (29 in `Table.spec.tsx`, 13 new, written first) |
| `npm run build` | components and types built |
| `npm run build-storybook` | built |
| pre-commit hook | passed on commit `3e0cc29` |

## Browser evidence

Built Storybook served from this worktree's `storybook-static` on a ticket-specific port (6213,
confirmed free before binding, bind output captured) and driven with a scratch Playwright Chrome
context (headless, isolated, viewport 1100×800). Server identity was proven before collecting
figures: an identity file written into the build was served back, the served `iframe.html` matched
the local file's MD5, and the served story index listed the six new `display-table--*` stories.
An earlier pass on a shared port produced identical figures. Figures are from the live DOM.

- **Pointer activation**: clicking a cell of the Kestrel row emitted once; `aria-selected` moved to
  that row and the consumer readout updated.
- **Keyboard**: Tab reached the first interactive row (`:focus-visible` true); Enter selected it;
  Tab, Tab, Space selected the third row; `scrollY` stayed 0. Focused row computed outline:
  `solid 3px`, offset `2px`, colour the focus-ring token. Pointer focus showed no ring.
- **Marker**: selected first cell `::before` is `position: absolute`, `border-left 2px solid
  rgb(15,23,42)` (light `foreground`), spanning the full 39.5px row; in dark theme the marker is
  `rgb(248,250,252)` = dark `foreground`. Marker visible inside the ring when selected and focused.
- **Inset alignment**: every first cell of a selectable table, head row included, has
  `padding-left: 16px`; the static story keeps `0px`, no `tabindex`, no `aria-selected`.
- **Nested controls**: clicking Sign logged the row action and selection did not move; clicking the
  name link changed `location.hash` without activation; Enter on a focused nested button did not
  activate the row; clicking the row body afterwards did.
- **Changing availability**: after removing `onClick$`, rows had no `tabindex`, kept
  `aria-selected`, and a click emitted nothing; restoring it re-enabled activation.
- **Long labels**: the long row grew to 84.5px (four wrapped lines in every cell) and the marker
  spanned it (`top 0 / bottom 0`). With no note column the Root is the scroll region; the focused
  row's ring (5px outward) fit inside the region's 5px ring room on every side: not clipped.
- **Stable identities**: reversing order moved the marker with its artist; hiding the selected
  artist kept the consumer's selection; showing it again re-rendered it selected.
- **Forced colours**: ring `solid 3px` and marker `2px solid` both survive.
- **axe-core** (wcag2a/aa, wcag21a/aa, wcag22aa, best-practice) on the interactive, selected
  noninteractive, nested-controls and static stories: 0 violations, 0 incomplete.

## Compatibility

Additive minor change: both props optional, no token removed or renamed, no required prop changed,
no breaking marker. Static tables render the same attributes, geometry and paint as before; only the
`class` strings of the wrapper and of each `tr` gain utilities that are gated on `:has([aria-selected])`,
`:has(tr[tabindex])` or `[aria-selected=true]` and so match nothing there (corrected in the #113
review: an earlier wording claimed byte-identical markup). `Observable`/`Subject` are the existing
`rxjs` peer.

## Limitations

- An interactive row announces no verb of its own; the consumer words the caption, a row header or
  a nested link so the row's purpose is plain (recorded under `@CallerMustEnsure`).
- `:has()` carries the inset and ring-room rules; browsers without it (Firefox < 121) render the
  marker over the flush first cell and may clip the ring in the scroll region. Behaviour and
  `aria-selected` are unaffected.
- `notes="content"` below 48rem stacks cells, so the marker spans the stacked first cell only.
- Not verified with a screen reader; `aria-selected` on `row` is per WAI-ARIA 1.2 and passed axe.
