# #141 — Pane implementation

Implemented `Pane.Root`, `Pane.Head`, `Pane.Body` and `Pane.Foot`, exported through the public barrel.
Root accepts its parent's allocated height, with Box's surface, foreground, border and inset roles.
Head and Foot retain their content height; Body shrinks to the available space without stretching
short content. An unsized parent produces a content-height pane.

Body defaults to owning native scrolling on both axes. Overflow exposes the consumer's `ariaLabel`
as a group and keyboard stop; a focused stop survives removal of overflow until blur. Content and
container measurements update on resize and content replacement. The shared focus ring has room.
`scrollOwner="child"` explicitly removes Body's scrolling, semantics and inner content wrapper,
passing its bound to a child that owns scrolling. No child identity is inferred. Root's optional
`name` independently exposes its enclosure as a group. The public contract states caller duties,
including slot order, available room for fixed content and stacked fallback.

## Verification

- Public component/DOM tests were driven through red/green slices; 9 Pane tests pass.
- `npm run build`, `npm run lint`, `npm run typecheck`: pass.
- `npm test`: 57 files, 1,313 tests pass.
- `npm run build-storybook`: pass.
- Orca's browser ran all four Storybook play functions at **1280×720** and **1920×1080**:
  long body, short body, child-owned ScrollContainer and stacked panes, eight passing executions.
  Long bodies reveal the final focused control while Head and Foot stay stationary, and the Shell
  body does not overflow. Short bodies have only the focus inset after their content, with unused
  room remaining in Root. Child ownership leaves ScrollContainer as the only scroll group. Stacked
  panes grow naturally and the Shell body scrolls. Document height stayed exactly the viewport
  height in every execution and document scrollTop stayed zero.
- Build warnings remain for existing placeholder `var(…)` CSS candidates and Storybook chunk size;
  the full suite also emits jsdom's existing navigation-not-implemented notice.

## Outstanding acceptance and handoff

- **#142, bounded Table**: its API is absent and remains outside this task. The bounded Table story,
  sticky header and single-wrapper integration cannot be verified yet. Compose the future bounded
  Table directly inside `Pane.Body scrollOwner="child"`; the Table wrapper must accept the bound
  and own both horizontal and vertical scrolling, naming and focus behavior.
- **#145, full-height ColumnLayout**: its API is absent. The two-pane full-height-column integration
  story remains pending; the coordinator confirmed #145 will supply it after core Pane lands.
  Do not treat the existing child-owned ScrollContainer story as verification of either integration.
- **Release publication** remains explicitly outstanding and deferred to the human push/release
  workflow. No version bump, publication, push, merge or issue closure was performed.
- A separate fresh reviewer owns code review; this worker did not perform or substitute that step.
