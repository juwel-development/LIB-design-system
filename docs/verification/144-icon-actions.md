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

## Final local integration (2026-11-04)

This section supersedes the earlier pending-#142 statements. Merge commit `8ae8e64`
incorporates local main `397936d` into `feature/ticket-144`; it does not merge to main.
The bounded Table runtime and reviewed icon-action sizing are combined without a new runtime
fix. Main's Stepper, letter typography, tokens and ColumnLayout changes are retained.
The three conflicts were resolved by retaining both Table test/story sets and main's single
Storybook Tailwind registration. No Pane stories or broader Stepper composition were edited.

Four Table-owned stories now compose a bounded icon-action table directly in
`Pane.Body scrollOwner="child"` and `Dialog.Content scrollOwner="child"`, at comfortable and
compact density. A text reference row and 39 rows with five plain actions at each horizontal edge
exercise row-height parity and horizontal overflow. Their play assertions verify:

- one scrolling Table wrapper, a non-scrolling holder and stationary page/title/footer;
- a sticky header retained during vertical scrolling (the caption scrolls away);
- equal reference/action row heights, and action groups staying on one line;
- keyboard-visible rings after focus moves to final, initial and interior rows at both horizontal
  boundaries, with full outline-plus-offset clearance below the header and inside the scrollport.

The Dialog story waits for the measured overflow group after the modal opens, rather than racing
its ResizeObserver. The unit activation test now covers both natural-height and bounded tables.

### Browser evidence

All 16 combinations passed: Pane/Dialog × comfortable/compact × 1280/320 CSS pixels ×
ordinary/emulated forced colours, at 720px viewport height. Storybook play assertions completed
without JavaScript errors. Rows measured **39.5px comfortable** and **31.5px compact**, equal to the
text reference in every scenario; narrow tables retained horizontal overflow and unwrapped actions.
Rings retained a visible 3px outline and 2px offset, and the forced-colours media query was active.

Durable [measurements](144-integration/measurements.json) record the matrix and geometry.
The inspected [narrow compact Pane screenshot](144-integration/integration-pane-compact-320-active.png)
and [1280px Dialog screenshot](144-integration/integration-dialog-comfortable-1280-active.png)
show system-colour glyphs and visible focus in forced colours. The Pane story was also
opened in Orca's embedded browser; its synthetic keyboard play failed the focus-visible assertion,
so Orca is not counted as a passing browser run. The matrix used temporary Playwright with installed Chromium
because the previous Orca forced-colours emulation did not activate the media query.
The temporary driver is `/tmp/lib144-browser/integration.mjs`; no browser dependency was added.

The original Icon Actions story also passed all six scenarios again (320, 1280, 1600px in ordinary
and forced colours), retaining first/interior/last-column checks, row activation isolation,
filtering-induced shrinkage, and all 30 drawing/tone combinations. Raw regression results are
`/tmp/lib144-browser/review-integrated-evidence.json`.

### Independent integration review

Pinned base: `6d77fc0`; integration commit: `8ae8e64`; incoming reviewed main: `397936d`.
Two independent agents reviewed Standards and Spec separately against the repository standards,
issue #144 and its comments, and the dispatched integration requirements. Previously reviewed
main changes were treated as baseline. No issue tracker writes were made, as the dispatch forbids
posting to GitHub during this run.

**Standards:** 0 documented breaches and 0 actionable smell findings.

**Spec:** 1 confirmed finding, addressed: conflict resolution restored obsolete documentation
claiming Table never bounds its height. The wording again states that natural height is the default
and that the external ScrollContainer example applies to unbounded tables. No runtime defect or
scope creep was found. Follow-up review confirmed the fix and corrected an evidence overstatement:
sticky geometry is asserted; header opacity was visually inspected, not asserted.

### Checks and remaining limits

Package build including CSS delivery checks, lint, typecheck, full tests (63 files, 1438 tests),
and Storybook build pass. Fallow completed with advisory findings and a semantic-attribution warning;
it is not a clean advisory report. The existing jsdom navigation warning and Storybook bundle-size
warning remain. Browser verification found no need to change production runtime code.

Real Windows high-contrast themes, non-Chromium engines and screen readers remain unverified.
The bounded composition uses screen-extent Dialog and static rows; the retained original story
covers selected/interactive rows and action activation. Pane's broader composition and Stepper work
remain with #141. Publication remains a human follow-up: no push, merge to main, issue closure,
Done transition or publication was performed.

Standards: 0 findings; Spec: 1 finding addressed.
