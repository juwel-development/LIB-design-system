# MultiSelect implementation evidence

Date: 2026-09-28. Implemented by Claude Fable 5.1 as an Orca worker for
[#110](https://github.com/juwel-development/LIB-design-system/issues/110) against the approved
[agent brief](./110-multiselect-agent-brief.md), on branch `ticket-110` cut from local `main` at
`482e195` (package 3.8.0). Nothing was pushed, merged, released or moved on the board; the
`/code-review` step is a separate dispatch.

## Contract

The public barrel exports one roster entry, `MultiSelect`, a namespace of `Root` and `Option`.

`Root` requires `label`, `selected$: Observable<readonly string[]>`,
`onChange$: Subject<readonly string[]>`, `emptyLabel`, `removeLabel` (`{label}` placeholder),
`clearLabel` and `overflowLabel` (`{count}` placeholder); `hint`, `disabled`, `testId` and
`children` are optional. `Option` requires a stable string `value` and text-only `children`, and
accepts `testId`. The wording contract is closed to string templates: no callback props, no
built-in English. The consumer documentation is the [README section](../../../README.md#multiselect)
and the TSDoc on the namespace; the glossary entry in `CONTEXT.md` predates the work and matches
what was built.

The closed control is a disclosure: a `<label>`-associated trigger button carrying
`aria-expanded` and, while open, `aria-controls` to a `role="group"` named by the same label.
Options are `role="checkbox"` buttons with `aria-checked` (the Choices precedent, so the
controlled contract cannot be pre-empted by a native toggle). Chips, the count and clear-all are
buttons outside the trigger; the trigger spans the field underneath them so a pointer press on
empty space opens the dropdown.

Selection state is a `useLayoutEffect` subscription to the current `selected$` instance:
reset to empty on replacement, torn down on unmount, never completed. Proposals are derived from
the supplied option order, deduplicated and filtered to supplied identities; handed-in arrays are
never touched. Overflow is measured live after every render from `getBoundingClientRect` of the
chip track, every chip (an overflowing chip is `invisible absolute` with `aria-hidden` and
`inert`, so it stays measurable) and an invisible copy of the count at the total, through the pure
`fitChips` seam. Placement is measured on open against `window.innerHeight` and written to a CSS
custom property for the surface's max-height; `data-placement` drives above/below.

## Test evidence

Every production slice followed a failing test: `fitChips` was specified first and the whole
component spec was red on the missing module before the component existed. The final 26 component
tests and 6 `fitChips` tests cover, through the public barrel:

- Closed namespace and curated member props (type-level).
- Labelled collapsed trigger, empty wording as description, no chips, clear or options before opening.
- Rendering from the latest emission in option order with deduplication, and silence on every emission.
- Empty before the first emission; restoration from a `ReplaySubject` on remount; replacement
  discards the old source and waits; `observed` is false after replacement and after unmount.
- Named group of checkable options, `aria-expanded` / `aria-controls`, and no emission on open or close.
- One fresh proposal per toggle in option order, dropdown kept open, input never mutated;
  ignored requests leave the selection unchanged and repeated toggles repeat the proposal.
- Selecting none, one, several and all through consumer feedback.
- Chip removal and clear-all emitting without opening and without submitting a surrounding form.
- Keyboard open onto the first selected option or the first option, Escape returning focus, the
  trigger closing an open surface, no options keeping focus on the trigger.
- Tab departure closing while preserving the destination; outside pointer closing without focus theft.
- Focus after removal (next, preceding, trigger), after clear-all (trigger), and after an overflow
  recalculation hides the focused chip (trigger).
- Disabled: retained selection, closed surface, every control disabled, no emissions, input still rendering.
- External restore and clear while open; consumer reconciliation of removed options emitting nothing;
  identity preserved through reorder and translation with chips following the new order.
- Overflow with a controlled measurement boundary (stubbed `getBoundingClientRect`, a hand-driven
  `ResizeObserver`): fit, accurate count, hidden chips out of the accessibility tree, the count opening
  the dropdown, recalculation on width, label and selection changes, count-only at narrow widths.
- Placement above when the viewport below is too short, below by default.
- `Option` outside `Root` throwing; two controls on one page staying independent.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 150 files checked |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 46 files, 826 tests, including 32 MultiSelect tests |
| `npm run build` | Passed; `dist/design-system.js` and `dist/types/Interaction/MultiSelect/` contain MultiSelect |
| `npm run build-storybook` | Passed; thirteen MultiSelect stories |

Builds retain the pre-existing CSS optimizer and Storybook chunk-size warnings; nothing
MultiSelect-generated blocked a check.

## Browser evidence

The Storybook dev build was driven in headless Chrome (channel `chrome`, Playwright 1.63 in a
scratch directory) across every story in both themes, reading real layout:

- The field stays one row at 448px, 384px, 288px and 192px controls; its height holds at 45–46px
  with no, some and overflowing chips; the document never widens past the viewport.
- 12 of 12 selected at 448px: four chips and `+8`. Eight selected at 384px: three chips and `+5`;
  at a 320px viewport two chips and `+4`; back at 900px three chips again. A 192px control shows
  the count alone (`+3`).
- Pointer open lands on the trigger; Enter on the trigger opens and focuses `Family`, the first
  selected option; Space toggles it off with the dropdown staying open and focus staying on the
  row; Escape returns focus to the trigger; the count opens the same dropdown.
- Enter on the first chip's focused removal moves focus to the next chip's removal (`Remove Loss`).
- At the viewport bottom the surface opens above (`data-placement="above"`) and stays inside the
  viewport; below the control otherwise, capped to the remaining height and scrolling internally.
- Long English and German labels truncate on chips and wrap inside rows without widening the surface.
- Focus rings on chip removals are not clipped by the overflow window; checked rows show the tick
  and boundary flip in both themes; disabled mutes chips and the boundary while keeping them visible.

Screenshots were reviewed for the keyboard-open, chip-focus, viewport-bottom, long-label,
narrow and disabled states in light and dark. The `Storybook a11y` addon was not run in this
session; the reviewer dispatch is the place for an axe pass.

## Deviations and notes

- No new token was introduced: chips read the `backing` fill, the marker reuses
  `--choice-marker-size`, the surface reads `--elevation-floating`, `border`, `surface` and
  `--radius-control`.
- Options are read from direct children, arrays and fragments for the chips' order and labels; an
  option rendered through a consumer component still toggles but has no chip. This is documented.
- Overflow measurement runs after every render rather than on a dependency list, so Biome's
  exhaustive-dependency rule holds and a font swap is picked up on the next render; it settles in
  one pass because hidden chips remain measurable.
