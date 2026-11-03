# #145 — ColumnLayout full-height columns

Added the closed `ColumnLayout.Root fill?: boolean` option, defaulting to false. A filling
horizontal row accepts its parent's allocated height and passes that height to every column.
Panes and ScrollContainers receive a real bound; unequal content lengths cannot enlarge the row.
Without an allocated height, columns retain content height. Stacked columns also retain content
height, with overflow owned by the holder. Default rendering and allocation remain unchanged.

The existing weighted flex threshold still determines the all-or-one arrangement. Fill adds an
inline-size frame and a registered computed shortfall, queried by CSS to release column heights
when stacked. No JavaScript measurement, resize listener, fixed height, consumer workaround,
new public token, or resize-driven remount is introduced. The registration is generated in all
three token entry points. Public TSDoc, Storybook documentation and CONTEXT record the contract.

## Verification

- The public fill type test first failed typecheck because the prop did not exist, then passed.
- 34 colocated tests pass, including preserved uncontrolled input state, focus, DOM order and
  allocation changes in fill mode; existing allocation and composition tests remain green.
- `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`, and
  `npm run build-storybook` pass: 58 test files, 1,347 tests.
- Seven new Storybook play functions passed in Orca's browser at actual **1280×720** and
  **1920×1080** viewports: FillingPanes, FourFillingColumns, FillingScrollContainers,
  StackedFillingColumns, UnsizedFillingColumns, FillResize, and DefaultContentHeight.
- Checks observe geometry and accessibility: full column heights, proportional widths, no
  holder overflow in horizontal mode, independent scrolling with stationary Pane feet,
  short bodies without scroll groups, content-height stacks with reachable final actions,
  default/unsized content heights, and preserved DOM identity and focus on resize.
- FillResize additionally checks live minimum-token changes and the exact fit threshold versus
  one pixel below it. These are browser assertions, not class-string or jsdom geometry tests.
- Existing non-failing build warnings about placeholder CSS candidates and Storybook chunk size,
  and the existing jsdom navigation notice, remain.

## Outstanding and handoff

- **Release publication is outstanding**, explicitly deferred to the human push/release workflow.
  No publication, version bump, push, merge, issue closure or Done transition was performed.
- **Bounded Table #142 is absent in this checkout.** Its eventual `Table.Root` vertical-bound
  option must be exercised directly in a filling column (or inside `Pane.Body scrollOwner="child"`)
  to verify that its own scroll wrapper accepts this bound and preserves its sticky header.
  The Pane and ScrollContainer stories do not claim that integration. #145's requested two-Pane,
  four-column and stacked examples are implemented and verified; #141's pending ColumnLayout
  integration is now demonstrated and its Storybook note links readers to these examples.
- A separate fresh reviewer owns code review and the In Review transition.
