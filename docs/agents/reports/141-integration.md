# Issue #141 remaining integration

Implemented on the assigned branch from validated main `397936d`, after fetching #141 and all
three comments. Pane core and #145 columns were already implemented and reviewed; the remaining
work was real bounded Table integration. Read CONTEXT, the agent standards, /implement, and the
applicable focus, composable and allocation ADRs, including accepted decisions from `0c9e76d`.

## Changes

- Public-import Pane/Table composition test proves the overflowing Table is the only named
  keyboard group, retains table/header semantics, accepts focus, and excludes Pane head/foot.
- `Layout/Pane/BoundedTable` shows the actual bounded Table with pinned head and foot.
- `Layout/Pane/SteppedBoundedTable` composes Shell → filled capped ColumnLayout → Stepper panel →
  Pane → bounded Table. Switching steps unmounts and remounts the real composition.
- Replaced the obsolete pending-Table warning with the verified composition contract. No runtime
  behavior change or sibling feature implementation was needed; the added integration test passed
  against the already merged components, rather than claiming a new red/green implementation.

## Evidence

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run build-storybook` passed.
Full tests: 63 files, 1,431 tests pass; targeted Pane suite: 10 tests pass. The existing jsdom
navigation diagnostic is unchanged.

Orca embedded WebKit executed the actual Storybook play functions at **1280×720 and 1920×1080**:
BoundedTable, SteppedBoundedTable, LongBody, ShortBody and Stacked all passed at both sizes.
The new stories check final-row programmatic focus and backward/forward Tab travel, focus below
the pinned header and inside the Table wrapper, unchanged Pane head/foot positions, a visible
foot, no body tab stop, no Shell overflow group, no overflowing ancestors, no document horizontal
overflow, and zero document scroll. The assembled story also switches to the blocked review step
and returns by ArrowLeft, proving the remounted composition still passes.

| Assembled viewport | Table client / scroll height | Main column width | Document scroll |
| --- | --- | --- | --- |
| 1280×720 | 352 / 2448 | 947 | 0 |
| 1920×1080 | 708 / 2448 | 960 (declared cap) | 0 |

The header's pinned position allows the wrapper's focus-ring inset and the table border, rather
than requiring the header to overlap that inset. Every ancestor remains within its allocated
height. The existing two-pane/stacked ColumnLayout examples were previously reviewed under #145;
this work adds the missing Table and Stepper composition on the actual merged APIs.

## Remaining work and limits

No missing sibling API or composition remains for #141, #142 or #143 in this assembled example.
**Visible keyboard-ring verification remains manual:** both Storybook userEvent and Orca's native
keypress commands move keyboard focus in WebKit but leave `:focus-visible` false (outline style
`none`). The tests establish focus position and reachability, not a visually observed ring. No
forced pseudo-class or fake replacement component was used to claim that evidence. Chromium,
Firefox and assistive-technology sessions were not run.

A separate fresh reviewer owns code-review. Publication remains deferred to the human push/release
workflow; this worker did not push, merge, close an issue, set Done, edit a version or publish.
