# Tabs readable labels and panel separation - implementation evidence (#121)

Date: 2026-10-03. Implemented by an Orca worker (Claude) on branch `feature/ticket-121`, cut from
local `main` at `3739997` (package 3.9.1). No approved agent brief existed for #121 and the issue
carried no comments, so the contract below is derived from the issue, the consumer specification
(juwel-dev/g-label-manager #195) and the repository standards. Nothing was pushed, merged, published
or versioned; review and release stay with the coordinator. **Implementation is done; publication
is not.** The consumer ticket's "record its version" step waits for a human release.

## What shipped

- `Tabs.List` gains one structural prop, `overflow`, with two named options and no third:
  `scroll` (the default - today's behaviour, unchanged: one line, horizontal scroll, ring room,
  focus reveals a scrolled-off tab) and `wrap` (the row breaks onto further lines; a label wider than
  the row takes a line of its own and breaks across lines; tabs on one line share a height). Decided
  under ADR 0008's structural test: the alternative is right in a window-wide, translated row and
  wrong in a column, so a prop exists, named for the job. No token was added or changed.
- `Tabs.Tab` reads the row's accommodation through a List-level context and applies it as its own
  recipe variant (`shrink-0 text-nowrap` under scroll, `text-wrap` under wrap). The Root contract,
  ids, roving tabindex, arrow handling and panel association are untouched.
- The separation contract is a composition, not a prop: `<Tabs.Root><Stack gap="region">…List…
  …Panels…</Stack></Tabs.Root>`. The TSDoc now states that Panels may sit with the List inside one
  arrangement under Root, and names the Stack region gap as the separation. A `gap` prop on Tabs was
  rejected because the row-to-panel position is the same position Stack already serves with the same
  two attested roles, and the consumer specification asks for exactly this composition.
- Labels are never clipped, elided or hidden in either accommodation: no `text-overflow`, no
  `title`, no hidden duplicate. Stated as a guarantee and tested.
- `CONTEXT.md` gains **Tab row overflow** under Components.
- Stories: Controlled (short labels), Overflow (scroll at 24rem), LongLabels (wrap at 24rem,
  German labels), Separation (Stack region gap), KeyboardNavigation (scroll and wrap side by side),
  NarrowDesktop (50rem frame, wrap, region gap).

## Compatibility

Additive. `overflow` is optional and defaults to the previous behaviour; every existing prop,
member, token and default render is unchanged. No breaking marker, no `NOTE:` footer needed.

## Test evidence

Nine tests were added to `Tabs.spec.tsx` (32 in the file), written before the prop existed - the
red signal was `typecheck` (`overflow` did not exist on `ITabsListProps`); jsdom ignores unknown
props, so the runtime suite could not go red for a geometry-only variant, which is why the browser
evidence below exists. They assert roles, names, attributes, focus and emitted values only:

- Every long translated label is the tab's whole text and accessible name, with no `title` and no
  `aria-hidden` descendant, under `scroll`, `wrap` and omitted.
- Under `wrap`: tabs stay direct children of the tablist, `aria-selected`, roving `tabindex`,
  `aria-controls`/`aria-labelledby` hold, and ArrowLeft/ArrowRight move focus and request selection
  with wrapping at both ends.
- With a `Stack gap="region"` between Root and its members: tablist name, associations, active
  panel content and Tab stop hold; inactive panels stay hidden and empty as Stack children (so the
  flex gap stays one); arrow keys and click still emit through the Subject.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 153 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 47 files, 861 tests |
| `npm run build` | Passed; `overflow?: "scroll" \| "wrap"` present in `dist/types/Interaction/Tabs/Tabs.d.ts` |
| `npm run build-storybook` | Passed |

## Browser evidence

Chrome (installed Google Chrome via Playwright `channel: 'chrome'`, headless) against the static
Storybook build; the chrome-devtools MCP profile was held by another session. Measured with
`getBoundingClientRect`, `scrollWidth`/`clientWidth`, `:focus-visible` and computed outline.

| Story | Fact |
| --- | --- |
| LongLabels, 24rem, wrap | list `scrollWidth` 384 = `clientWidth` 384, no document horizontal scroll; 4 rows; three labels break to 2 lines, none overflows its tab or the list |
| Overflow, 24rem, scroll | list scrolls (1315 > 394); Tab enters at the active tab with a 3px solid `:focus-visible` outline; ArrowLeft wraps to the last tab and brings it inside the list's visible box |
| Controlled vs Separation | row-to-panel border-box gap -5px (ring room) vs 19px; the visible marker-to-panel distance is 24px = `--space-region` 1.5em at 16px |
| NarrowDesktop, 900×700 and 1280×800, wrap | no horizontal scroll; 3 rows; the two tabs sharing a row share top 51 and bottom 85 (markers aligned); row-to-panel gap 24px |
| NarrowDesktop keyboard | Tab → active tab; ArrowRight ×2 moves focus and selection; ArrowRight from the last wraps to the first; ArrowLeft from the first wraps to the last; Tab → the panel (3px outline); Tab → the action inside it |
| Themes | LongLabels screenshot in light and dark: muted labels, foreground active label and marker in both |

Screenshots and the script stayed in the session scratchpad; none were committed.

## Limitations

- Wrapped labels are centre-aligned within their tab, as a button's text is; a start-aligned
  multi-line tab was not asked for and is not offered.
- An unbroken word wider than the whole row still overflows under `wrap`, as it would in any
  wrapping arrangement; the stories' longest German compound fits a 24rem column.
- The wrapped rows carry no row gap of their own: the marker of one line sits directly above the
  next line's inset. A row gap would be a new spacing position with no attested role.
