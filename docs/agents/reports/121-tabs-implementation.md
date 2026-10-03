# Tabs readable labels and panel separation - implementation evidence (#121)

Date: 2026-10-03. Branch `feature/ticket-121`, cut from local `main` at `3739997` (package 3.9.1).
The contract is the approved Agent Brief on #121 (issue comment of 2026-10-03, also
`docs/agents/reports/121-agent-brief.md` on `main` at `c04327a`), which supersedes the issue body.
Nothing was pushed, merged, published or versioned; review and release stay with the coordinator.
**Implementation is done; publication is not.** The consumer ticket's "record its version" step
waits for a human release.

## History

The first implementation on this branch (`10386b5`, `751feee`) predates the brief by a quarter of an
hour and shipped an `overflow="wrap"` prop on `Tabs.List` that broke the row of controls onto further
lines - the one behaviour the brief lists as out of scope - while leaving labels string-only and the
default row non-wrapping. The review (`121-review.md`) found this on both axes and the fix commit
`9a75c0b` replaced it with the contract below. Nothing from `10386b5` was ever released.

## What ships

- `Tabs.Tab` accepts a `ReactNode` label. A plain string still works unchanged; a label may carry an
  icon, a count or inline emphasis beside its text. The tab's accessible name is computed from its
  content, so decorative parts carry the consumer's own `aria-hidden` (the `Figure` precedent: the
  library does not guess what is decorative) and meaningful parts stay in the name. No interactive
  descendants - the tab is the one control. Clicking any part of the label requests the tab's value.
- The row is one scrolling line of controls. A tab is an ordinary flex item again - no `shrink-0`, no
  `text-nowrap` - so as the row narrows a label's text wraps inside its tab down to the tab's longest
  word; only when the controls still cannot fit does the row scroll horizontally, the row and never
  the page. Ring room, scroll padding and focus-reveals-tab are unchanged, so the focused tab and its
  ring stay visible in an overflowing row. The tabs share one height, so the markers sit on one line.
- No new prop, token or escape hatch. `ITabsListProps` is `{ children, testId }` as published.
- The separation contract is a composition: `<Tabs.Root><Stack gap="stack" | "region">…List…
  …Panels…</Stack></Tabs.Root>`. Tabs stays spacing-free; inactive panels are hidden, so the gap is
  exactly one whichever panel is active. Documented at both gaps in the TSDoc, the Storybook component
  description and two stories.
- Consumer-facing documentation lives in Storybook: `parameters.docs.description.component` on the
  Tabs meta (labels, width, separation) plus a description per story. No README section.
- `CONTEXT.md`: **Tabs** gains the label and separation sentences; **Tab row overflow** now describes
  wrap-then-scroll on one row.
- Stories: Controlled (three short labels), RichLabels (icon + count + emphasis beside a plain
  string), LongLabels (44rem column, German, wraps without scrolling), Overflow (24rem column, an
  unbroken 38-character compound, the row scrolls), SeparationStack, SeparationRegion,
  KeyboardNavigation (32rem, overflowing, region gap), NarrowDesktop (900px viewport global, English
  and German rows, region gap).

## Compatibility

Additive and non-breaking against the published 3.9.1: `children: string` widened to `ReactNode`
(every existing call compiles), no prop removed from a released interface, no token added, removed or
changed, no required prop changed. One behaviour of existing code changes - a long label in a row
that is too narrow now wraps inside its tab before the row scrolls - and the fix commit carries that
as a `NOTE:` footer, not a breaking marker. `overflow` existed only in the unreleased `10386b5`.

## Test evidence

`Tabs.spec.tsx` holds 37 tests (32 `it`/`it.each` entries), all behaviour: roles, names, attributes,
focus and emitted values. The red signal for the rich label was the type - `children: string` refused
the JSX - and for the row geometry jsdom lays nothing out, which is why the browser evidence exists.
Added or reshaped under #121:

- Every long translated label is the tab's whole text and name, with no `title` and no hidden part.
- A rich label (aria-hidden svg, text, `<em>` count) is one tab named `Candidates 3`; its panel is
  associated like a text label's; clicking the count or the icon requests `candidates`; ArrowRight
  moves focus from a text tab onto it.
- With a `Stack` between Root and its members, at both gaps and with the first, middle and last tab
  active: exactly one visible panel, the hidden ones empty, every panel a direct Stack child; the
  tablist name, associations, Tab stop, arrow keys and click emission hold.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 153 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 47 files, 866 tests |
| `npm run build` | Passed; `children: ReactNode` on every member in `dist/types/Interaction/Tabs/Tabs.d.ts`, no `overflow` |
| `npm run build-storybook` | Passed (into the session scratchpad) |

## Browser evidence

Headless Chrome 154 (Playwright `channel: 'chrome'`) against the static Storybook build, 16px root.
The full table is in `121-review.md`; in short: labels wrap inside their tabs with the controls on one
row at 44rem, 900px and 1280px; an unbroken compound makes the row scroll and the page not; focus
reveals a scrolled-off tab with a 3px solid ring inside the clip; rich-label names are `Staff 12`,
`Candidates 3`, `Alumni` and clicking the icon or the count selects; the marker-to-panel gap is 8px at
`stack` and 24px at `region` for the first, middle and last tab alike, with hidden panels taking no
space; the docs page carries the component guidance and all eight stories.

## Limitations

- Wrap-then-scroll is literal: in a column narrower than the sum of the tabs' longest words, every tab
  shrinks to one word per line before the row scrolls (Overflow at 24rem shows a five-line tab). The
  brief chose this order; a floor below which a tab stops shrinking would be a measurement with no
  attested role (docs/adr/0003, 0008) and is not offered.
- At an extreme width a decorative icon can take a line of its own above its text, as any inline
  content wraps; a consumer who wants the icon glued to the first word groups them in one
  `white-space: nowrap` span of its own.
- Wrapped labels are centred inside their tab, as a button's content is; no start-aligned variant.
- Chrome only; Firefox and Safari were not driven. Vertical centring of a one-line label beside a
  wrapped neighbour is the browser's button behaviour, observed in the screenshots, not pinned by a
  rule of the recipe.
