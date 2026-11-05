# Independent review of #156

Reviewed the complete [issue](https://github.com/juwel-development/LIB-design-system/issues/156)
and [approved Agent Brief](https://github.com/juwel-development/LIB-design-system/issues/156#issuecomment-6662303623)
on 2026-11-05. The fixed merge-base of `main` and initial `HEAD` is
`36ad968bcc08efcd9328e36d033d0dc869478cd8`; the implementation commit reviewed is
`83d49d2` (`feat(choices): add wrapping arrangement and optional descriptions (#156)`).
The review command remains `git diff 36ad968bcc08efcd9328e36d033d0dc869478cd8...HEAD`.

Two Codex subagents independently reviewed Standards and Spec in parallel, without helper
agents. All four `docs/agents/standards/` documents were read. Fallow ran against the pinned
base; its apparent test weakening was parameterization, not removed coverage. Existing
story subscription wiring and browser bootstrap duplication did not justify abstraction.

## Standards

Two low-priority documented-standard findings were confirmed and fixed:

- `Choices.spec.tsx` combined keyboard order, selected silence, controlled updates,
  description association and independent groups in one regression. This violated
  `testing.md`, Location and naming: “Arrange–Act–Assert, one behaviour per test.”
  Split it into five focused cases using a fresh fixture factory. Retained all guarantees
  and added complete declared-order traversal and cross-group emission isolation.
- `ChoicesFilter.stories.tsx` used abbreviated `en`/`de` record fields. The Coding standard's
  Naming section permits only `id`, `url`, `min`, `max` abbreviations. Renamed fields and
  lookups to `english`/`german`.

The Standards reviewer reinspected both fixes and confirmed no remaining findings.
No production component architecture, public surface, CVA, token, stream lifetime or barrel
violations were found; no additional baseline smells warrant changes.

## Spec

The Spec reviewer found no missing/partial requirements, scope additions or incorrect
implementations. The primary reviewer freshly reran the browser acceptance checks, builds,
lint, typecheck and DOM tests rather than relying solely on the implementation report.

| Approved acceptance | Evidence and disposition |
| --- | --- |
| Preserve vertical default and allow absent descriptions | Full-width vertical browser geometry, existing selection/keyboard tests, both-arrangement absence/inert cases pass. |
| EN/DE compact row at actual reference allocation | Original `/tmp/316-staff-allocation-{en,de}.json` independently confirms x=302, width=892 at 1280×720. Public Shell/Sidebar/Screen/Tabs/Pane story reproduces those horizontal bounds with five choices on one line above search/Clear/count. |
| Content widths, narrow wrapping, readable long/unbroken text | Different option widths and unused trailing width; 320px viewport allocates 228px and produces four lines, 198px group height. Names/descriptions stay inside choices; document width remains 320px. Long text passes in both arrangements. |
| One selection, marker, group name, descriptions | DOM roles/names/checked state and per-instance IDs pass; browser verifies selected marker, foreground boundary, transparent background and omitted description associations. |
| Stable identity requests, controlled state, no navigation/submission | Native arrow/Enter/Space/click produce four total requests with unanswered selection unchanged and zero form submissions. Selected activation stays silent. Consumer filter/Clear updates the same table. |
| Declared-order keyboard, wraparound, Tab, focus/reveal | Native arrows cross wrapped lines and both ends; Tab enters selected choice and returns there after controlled updates. 1280→800→320→1280 preserves selection. Every measured focus outline is solid, 3px with 2px offset, fully revealed without scripted scrolling. |
| Inert groups visible but unavailable | Both arrangements retain one checked choice; all radios disabled with tabindex -1, skipped by native Tab. DOM pointer/keyboard input emits nothing. |
| Direct children, arrays/fragments, independent instances | Focused DOM cases verify ordered movement through arrays/fragments and isolation of selection/emissions; name and description IDs remain collision-free. Public story has direct Choice children. |
| Story/theme coverage | Vertical, wrapping, label-only, described, EN/DE, narrow, long, controlled and inert stories present. Browser checks source light/dark, combined built CSS light/dark and dedicated light/dark CSS. |
| Tests, documentation, vocabulary, release boundary | Tests and gates pass; public guarantees/caller obligations and glossary describe the capability. Registry check still reports 4.1.0 as latest; this API remains unreleased. |

Fresh browser run: Chromium 156.0.8078.4; 97 JSON evidence records followed by
`PASS Choices browser acceptance`. All twelve EN/DE reference measurements across six
stylesheet/theme combinations match the implementation report:

| Geometry at 1280×720 | English | German |
| --- | --- | --- |
| Group x / width / height | 302 / 892 / 43.5 | 302 / 892 / 43.5 |
| All five choice tops | 259.390625 | 259.390625 |
| Occupied width including gaps | 661.90625 | 673.328125 |
| Search/Clear/count top | 310.890625 | 310.890625 |

Original Application y=277.8125 differs because its surrounding heading/bar content differs.
This proves fit within the actual reference head width, not the entire consumer Application.
Inspected the German dark reference screenshot and English light narrow focused screenshot:
the marker, boundaries, wrapping and focus ring agree with the measured results.

## Validation and remaining limits

- Focused Choices suite: 32 tests pass after splitting the regression (previously 28).
- Full pre-fix suite: 65 files / 1,496 tests pass; final normal commit hook runs the updated suite.
- Lint, typecheck, package build with stylesheet/entry smoke checks, and Storybook build pass.
- Browser acceptance passes; evidence log `/tmp/lib156-review-browser.log`, screenshots
  `/tmp/lib156-review-browser/`. The committed runner reproduces these temporary artifacts.
- `git diff --check` passes. No hook bypass or dependency/version change.

Full consumer Application adoption, other browser engines and assistive-technology testing
remain outside this evidence. An actually published release containing #156 is still required
before adoption; no future version is promised. No push, merge, closure, publication or external
post was performed. The skill's GitHub In Review transition is deferred to the coordinator under
the dispatch instruction prohibiting GitHub posts.

Standards: 2 findings, both resolved; worst original issue was the combined regression test.
Spec: 0 findings; no worst issue.
