# Issue #144 verification

Implemented against the issue and both comments, with the accepted decisions in `0c9e76d`.

- `Icon.Plus`, `Up`, `Down`, `Right`, `Remove` share the existing SVG renderer, tone,
  label and test identifier contract. The legacy selector's names remain unchanged.
- `{ width: 'icon-action' }` is a closed, content-sized Table allocation. Its header,
  cell insets and widest rendered action group contribute width; it takes no surplus share.
- Plain Buttons in `Cluster gap="stack"` keep cell typography and row height. Ghost is unchanged.
- Storybook now compiles Tailwind through its Vite configuration. Before this fix its previews
  were unstyled because the inherited JavaScript-library build config deliberately omits Tailwind.

## Automated checks

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run build-storybook` pass.
The full suite passes: 61 files, 1394 tests. The existing jsdom navigation warning remains.
The new Icon tests failed before the compound parts existed; the Table composition failed
TypeScript before the new allocation existed. Browser assertions caught missing Storybook styles
and trailing-edge ring clipping before those were corrected.

## Browser measurements

The `Display/Table / Icon Actions` story includes browser assertions for height parity, grouped
alignment, filtering, scroll-edge clearance and Enter/Space activation independent of the row.
It covers both densities, first/interior/last action columns, all three notes modes, static rows,
and selected interactive rows. Storybook interaction assertions completed without page errors.

Measured in headless Chrome at 320, 1280 and 1600 CSS pixels, in both ordinary and emulated
forced-colours modes; initial layout was also inspected in Orca's embedded browser.

| Measurement | Comfortable | Compact |
| --- | --- | --- |
| Text / one / two / five-action row height | 39.5px each | 31.5px each |
| Five-action track, at every tested viewport width | 137px | 121px |
| Trailing clearance at the narrow scroll end | 16px | 8px |
| Focus outline + offset | 3px + 2px | 3px + 2px |

All five grouped controls shared one vertical coordinate, with 7.5px between neighbours.
At 320px the table wrappers overflowed horizontally and the action groups remained on one line.
At 1280 and 1600px their tracks stayed the same width. Removing the five-action row reduced the
track to the two-action group's width (69.5px comfortable, 53.5px compact), without changing row height.
Keyboard focus retained a solid outline in forced colours and the media query confirmed activation.

The five drawings were inspected under forced colours, each in inherited colour and all five
optional tones: all 30 rendered in the system text colour and remained distinguishable.
Chrome's computed path stroke can retain the author value even when forced-colours paint is black;
the screenshot was inspected rather than treating that computed value as the rendered colour.
Orca's media command did not activate forced colours, so that check used temporary Playwright and
headless Chrome outside the repository; no browser dependency or lockfile change was added.

## Integration and release boundaries

The sibling bounded Table mode (#142) is absent from this branch. The coordinator explicitly
deferred this composition verification until reviewed #142 lands locally, before final #144 closure. Its combined sticky-header/vertical
scroll behaviour still needs verification after integration; no substitute or sibling feature was
implemented. The action allocation uses the existing shared grid tracks and preserves declared
columns across responsive modes. The reviewer/coordinator should retain the outer-cell ring room
when combining Table changes, because wrapper padding alone does not protect an overflowing grid's
trailing scroll edge.

Real Windows high-contrast themes, screen-reader announcements and browser engines beyond Chromium
were not verified. Custom themes must meet the documented focus-gap, cell-inset and line-height
constraints. Publication remains deferred to the human push/release workflow; no push, merge,
issue closure, Done status or release publication was performed.
