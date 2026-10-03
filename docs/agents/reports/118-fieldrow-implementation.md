# FieldRow implementation evidence

Date: 2026-10-03. Implemented by Claude Fable 5.1 as an Orca worker for
[#118](https://github.com/juwel-development/LIB-design-system/issues/118) against the approved
agent brief in the issue's triage comment, on branch `feature/ticket-118` cut from local `main` at
`3739997` (package 3.9.1). Nothing was pushed, merged, released or moved past **In Progress** on
the board; the `/code-review` step is a separate dispatch. **Implementation only: no version has
been published for this feature, and the consumer ticket
([g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195)) still awaits the
released version from the human publishing step.**

## Contract

The public barrel exports one roster entry, `FieldRow`, a namespace of `Root`, `Field` and
`Actions`, exactly the shape ADR 0008's #118 amendment records.

- `Root`: `children`, optional `gap: 'stack' | 'region'` (default `stack`), `testId`.
- `Field`: `children` (one labelled field), optional positive finite `weight` (default `1`),
  required `minWidth` (type `--${string}`) naming a consumer theme token, `testId`.
- `Actions`: `children` (the consumer's buttons), `testId`.

Weights share each row's width after gaps and the actions' content width are reserved; minimums
come from the named tokens, resolved live by the browser; actions take content width and move as a
group. A non-positive or non-finite weight, or a `minWidth` that is not a custom-property name
(literal lengths, `var()`, expressions), throws `FieldRowConfigurationError`; a member outside
`Root` throws `FieldRowCompositionError`. No presets, no `className`/`style`, no `aria` bag.

Consumer documentation is the README's `FieldRow` section (including the minimum-width token
obligation) and the namespace TSDoc. `CONTEXT.md`'s **FieldRow** entry and the ADR 0008 amendment
predate the work and match what was built; no vocabulary change was needed.

## Mechanism

Horizontal arrangement is CSS flex: `Root` is `flex flex-wrap items-start` with the chosen gap
along the row and `--space-stack` between rows; each `Field` is a flex item with
`flex: <weight> 1 0%` and `min-width: min(var(<token>), 100%)`, so line breaking happens at token
minimums, growth is proportional to weight from a zero basis, and a field alone in a narrower
holder yields to it; `Actions` is `flex-none min-w-0 max-w-full` around a `flex-wrap items-end`
group on the stack gap, so the group moves whole and wraps inside only once it cannot fit alone.

Vertical alignment is measured, because flex cannot align an inner edge: after every render
(`useLayoutEffect`, before paint) and whenever an item's content resizes (one `ResizeObserver` on
the content wrappers, never on the padded items or the root, so the observer never sees its own
write), `Root` groups items by line top, reads each item's control bottom and writes a `padding-top`
on the item so every control in a row meets the deepest one. The pure seam `alignControlEdges`
holds the row grouping and padding arithmetic and is tested directly.

The control is the element the field's own `<label for>` labels - the association every field
guarantees - not the field's box structure. An absolutely positioned control is measured by the
positioned box it fills, because MultiSelect's trigger spans its field inside the border and the
border is the edge a viewer aligns. A child that labels nothing aligns on its box bottom.

## Test evidence

Test-first throughout: `alignControlEdges.spec.ts` (6 tests) preceded the seam, and
`FieldRow.spec.tsx` (35 tests) preceded the component, both red before the implementation
existed. The spec covers structure and order, field ownership of label/hint/error associations,
default and fractional weights, the zero-basis share, weight and token-name rejection (seven
malformed shapes), content-width actions, both gap roles and the fixed wrapped-row gap, alignment
per row with stubbed geometry, the labelled-control rule against a taller box, the positioned-box
rule, the unlabelled fallback, re-alignment on resize and on re-render, running without a
`ResizeObserver`, identity/value/focus retention through a reflow, conditional omission and
insertion, a single field, composition errors, no outer space or literal lengths, and `testId`.

Full suite: 49 files, 896 tests green. `npm run lint`, `npm run typecheck`, `npm run build` and
`npm run build-storybook` all pass.

## Browser evidence

Both browser MCPs were unavailable (chrome-devtools profile locked by another session,
Claude-in-Chrome timed out), so verification used Playwright in the scratchpad driving the
installed Chrome headless against `storybook dev` on port 6006, in its own isolated page, reading
`getBoundingClientRect` from every story. Rounded pixels, viewport 1200 unless stated:

- **AllFieldTypes** (Input, NumberInput, Select, MultiSelect, TextArea, actions): every control's
  bottom at 145.5, the TextArea defining the line with padding 0 and the others padded
  52.5/52.5/56/50.8; MultiSelect's field border at 145.5 with its trigger at 144.5 inside it. The
  actions (344 wide) wrapped to a second row as one group, both button bottoms at 195. Re-measured
  identical after resizing the viewport 700 → 420 → 1200.
- **WrappedLabels** (holder 44rem): labels 25.5 / 76.5 (three lines) / 25.5 tall, all three
  controls at 161; the wrapped field padded 0, the others 51 and 54.5. No page or frame overflow.
- **HintsAndErrors**: hint, error and optional marker below different controls; all controls and
  both buttons at 93 while the field boxes reach 123.5. Messages added no padding.
- **Weighted** 3 : 1 : 1 with actions: field widths 480 / 160 / 160 from the 800 left after the
  actions' 344 and three 8px gaps - exact.
- **Narrow** holder 40rem → 24rem → 20rem → 16rem → 13rem: at 40rem three fields on one row
  (Select frozen at its 10rem minimum, the rest sharing 2 : 1) and the actions below; at 24rem the
  search field alone, then the two others at 171 each aligned at 195, then the actions wrapping
  internally (button bottoms 244.5 / 294); from 20rem down one field per row, each aligned on its
  own line, no overflow at any width. At 10rem the frame overflows by the primary `Button`'s own
  `--control-min-width` (10.5rem), which is Button's contract, not the arrangement's.
- **AloneBelowMinimum** (20rem minimum in a 14rem holder): field width 190 = the holder's
  content width, no overflow.
- **Default** at 1200 / 700 / 480 / 360: one row with the actions padded 35.5 at 1200; actions
  moved below as a group at 700 and 480; one item per row and buttons wrapped inside the group at
  360; no page overflow.
- **ConditionalField**: a typed value survives the region field being taken in (field widths
  992 → 656 + 328, actions unchanged); Tab order input → select → button → out.
- **Focus**: with the search input focused, `outline-style: solid` and no ancestor between the
  control and the body clips (`overflow: visible` throughout). Typing in two fields and resizing
  the viewport 700 → 420 → 1200 kept both values and focus on the second field.
- Console: no errors from the arrangement across every resize (one unrelated 404 for a Storybook
  asset); no `ResizeObserver loop` notifications.

## Limitations and compatibility

- `Button` carries `text-nowrap`, so an action's text never wraps; the brief's "buttons with
  wrapping text" is honoured by the arrangement (any taller action group aligns its bottom) but
  cannot be demonstrated with the library's own `Button`. A holder narrower than one button's
  `--control-min-width` overflows by Button's contract.
- Alignment of a field whose height changes from a render that re-renders neither `Root` nor the
  `Field` and leaves the content's size unchanged (a label growing exactly as a message shrinks)
  is not re-measured until the next render or resize; every observed case re-measures.
- An undeclared `minWidth` token leaves `min-width` invalid at computed-value time, so the field
  falls back to its content's minimum; documented as a caller obligation, not detected.
- No existing public API, token, default or required prop changed. `Cluster`, `Stack`, the five
  field components and `Button` are untouched; the only shared-file edits are the barrel export
  and the README section. The release is a `feat` minor on publication.
