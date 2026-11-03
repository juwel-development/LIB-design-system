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

## Independent review (2026-11-04)

Pinned merge-base with local `main`: `0c9e76d85b68d7fcdda8a72d8d01105ee9417bbe`.
Reviewed commits `94db04f` and `daa269c` with independent Standards and Spec agents,
against issue #144 body and both comments and the linked consumer spec
[juwel-dev/g-label-manager#300](https://github.com/juwel-dev/g-label-manager/issues/300).
Accepted ADR/CONTEXT decisions at the pinned base override the original criteria.

### Standards

- Confirmed interaction-verification breach: the Space assertion repeated Enter's already-visible
  result, so it could pass without a second emission (testing standard, interaction effects).
  Fixed by displaying and checking independent icon and row request counts after each key.
- Judgement: possible Data Clumps in parallel drawing/key/label arrays. Fixed by keeping each
  drawing and its accessible action label in one record, with the label also providing its key.

### Spec

- Confirmed verification gap: focus geometry read the outline before focus-visible applied,
  omitting the visible outline width. Fixed by entering keyboard modality, focusing each action,
  asserting its visible outline and measuring its full extent against neighbouring actions and
  the applicable first/last scroll edge. Interior groups now also receive neighbour checks.
- Confirmed verification gap: Space could pass without activation. The count checks now prove
  Enter and Space each emit once while the interactive row emits zero requests.
- No confirmed component defect or scope creep. The unchanged-height guarantee remains plain-only.

### Review validation and remaining work

Rebuilt Storybook and reran the strengthened story in Chromium at 320, 1280 and 1600px,
with ordinary and forced colours: all six scenarios passed without page errors. The driver also
checked height parity, unwrapped groups, constant track widths, narrow horizontal overflow and
visible 3px outlines with 2px offsets; all 30 icon/tone combinations rendered in forced colours.
The temporary driver and raw evidence are `/tmp/lib144-browser/review.mjs` and
`/tmp/lib144-browser/review-evidence.json` (not durable repository artifacts).
Lint, TypeScript, all 1394 tests, package build/check-build and Storybook build passed.
Fallow completed with advisory findings; its generic token-drift warnings describe intentional
semantic focus-token calculations, not confirmed violations.

Sibling #142 bounded Table remains absent: combined sticky-header/vertical-scroll behavior,
focus reveal and ring clearance need checking after integration, including bounded Tables inside
Pane.Body and Dialog.Content child-scroll compositions. This review does not claim those pass.
Real high-contrast themes, non-Chromium engines and screen readers remain unverified.
Publication remains a human follow-up; no push, merge, release, issue closure or Done transition.

Standards: 2 findings addressed (1 documented breach, 1 judgement); Spec: 2 verification findings
addressed, with sibling composition and publication still outstanding.
