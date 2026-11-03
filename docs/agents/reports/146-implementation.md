# #146 — filling Tabs panels

Added the closed, CVA-derived `Tabs.Root fill` option. Root accepts its parent's allocated
height, List retains content height, and the active Panel receives the remaining height and
passes it to a direct Pane. There is no new scrolling owner, gap, token, selection state or
interaction behavior. Omitted, false and null retain the existing content-height mode. An
unsized parent still yields content height.

The public contract and Storybook document the height chain: List and Panels are direct DOM
children of Root, and the height-accepting content is directly inside Panel. Fragments work;
an ordinary unsized Stack does not preserve the bound. Default-mode Stack separation remains
supported. Consumers arrange spacing inside Pane slots and provide enough room for fixed content.

## Verification

- Red: the public `fill` prop was absent at typecheck; the new bounded story grew to about
  2,123 px in its 720 px host before implementation.
- Public-barrel DOM regression verifies fill-mode automatic arrow activation, focus, stable
  tab/panel IDs, unmounting and fresh state on return, hidden empty panels and tab stops.
- 38 Tabs tests pass; the full suite passes 1,356 tests across 58 files.
- Build, lint, typecheck and Storybook build pass. Existing CSS placeholder optimization,
  chunk-size and jsdom navigation notices remain unrelated to this change.
- `FillingPane` and `UnsizedFillingPane` Storybook play functions passed in Orca's browser at
  1280×720 and 1920×1080, remounted after setting each viewport. The bounded fixture allocates
  1280×720 with 16 px host padding so the existing tab focus ring has outer room.
- Bounded checks prove Root/List geometry survives all four lane switches, Panel and Pane
  reach the allocation's bottom, the long body's final control scrolls into view while Head
  and Foot stand still, and arrow activation retains focus. At 1280×720 the document remains
  exactly 1280×720 and does not scroll. Short content remains short inside the filling Pane.
- Unsized checks prove no Pane body scroll group appears, following content remains below
  the tabs, and choosing a short lane reduces Root height.

## Deferred work

- Release publication is explicitly outstanding and deferred to the human push/release workflow.
  No publication, version bump, push, merge, issue closure or Done transition was performed.
- Pane #141 is present and its requested four-tab integration is implemented and verified.
  The separate bounded Table API from #142 is absent in this worktree, so a direct bounded
  Table integration cannot yet be exercised. No Table implementation or substitute example
  was added; the required Pane example does not depend on #142.

## Independent review

Reviewed implementation commit `ea50c4c` against fixed merge-base
`d07fb033aa605b9c2ded2afaaebbd3a70adf30bd`, using issue #146 and linked consumer
spec #300 and decision #284. Two parallel Codex reviewers ran the code-review skill.

### Standards

Zero actionable documented-standard violations or baseline smells. The closed CVA variant,
public DOM regression, documented height chain and allocation-only story host conform to
the repository standards. Fallow's advisory duplication and unused-type candidates do not
justify changing the existing component contracts or extracting shared story machinery.

### Spec

Zero actionable implementation defects or scope creep. Pane integration satisfies the bounded
example; direct bounded Table integration remains unverified until #142 supplies its API.
Publication remains outstanding and explicitly assigned to the human release workflow.
No corrective code change or additional regression was warranted by either review.

### Fresh validation

Build, lint, typecheck and all 1,356 tests in 58 files passed, as did the Storybook build.
Both story play functions were rerun successfully in Orca at 1280×720. The bounded root
measured 688 px inside the padded 720 px allocation; the document measured 1280×720 with
no overflow. The unsized story completed its long-to-short content-height checks.
No GitHub message or status mutation was made under the dispatch's external-channel restriction.
