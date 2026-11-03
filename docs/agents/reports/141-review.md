# #141 — core Pane review

Fixed review base: `2805023999f2bc960ecdd287c44c6074a1a7f166` (merge-base with main).
Reviewed implementation commit: `4a9c92d feat(pane): add bounded head body and foot layout (#141)`.
Sources: full #141 issue and triage comment, linked consumer #300 and decision #284,
related requirements #142 and #145, CONTEXT.md and all four docs/agents/standards files.
Two parallel Codex reviewers performed the independent Standards and Spec reviews.

## Standards

One hard finding: Body had two recipes, contrary to the compound-component rule of one
recipe per painting member. Fixed by moving owned content-wrapper styling into Body's
body-owned variant with direct-child selectors; child-owned mode remains unaffected.
No actionable heuristic smells. Shared overflow patterns remain local under the repository's
component-isolation rule. The Standards reviewer confirmed the fix and no remaining findings.

## Spec

Two P2 core findings:

- Horizontal growth of existing content could evade overflow observation and leave a scrolling
  body unnamed and unfocusable. Fixed with intrinsic content width, floored at the body's width,
  matching ScrollContainer's contract and making width growth observable.
- CVA accepts a null scrollOwner, which disabled default styles while the behavior still treated
  Body as scroll owner. Fixed by normalizing that value before class generation.

The Spec reviewer confirmed both fixes. No scope creep found.

## Evidence

The DynamicContent Storybook regression failed before fixes: null ownership could not scroll
(scrollLeft stayed zero), and delayed SVG width growth did not expose the named group after
normalizing null alone. It passes with both fixes, including removal of overflow semantics when
content fits again. Two animation frames before growth allow initial ResizeObserver delivery;
the check then observes a genuine subsequent content-size change.

After fixes, build, lint, typecheck, all 57 test files / 1,313 tests, and build-storybook pass.
Orca browser executions of LongBody, ShortBody, ChildOwnedScroll, Stacked and DynamicContent
pass at 1280×720 and 1920×1080. Document height equals viewport height throughout. One manual
DynamicContent rerun raced the automatically running play; rerunning after it settled passed.
Existing placeholder CSS candidate warnings, Storybook chunk warnings and jsdom navigation
notice remain unrelated. Fallow's advisory public API addition is intentional; its props-export
and component-local duplication suggestions conflict with the documented component rules.

## Outstanding acceptance

- #142: bounded Table story and sticky-header/single-wrapper integration remain outstanding;
  its API is not available and must not be implemented in #141.
- #145: two panes in full-height ColumnLayout remain outstanding; that ticket follows core Pane.
- Publication remains deferred to human push/release. No version bump or release was manufactured.

Review totals: Standards 1 finding fixed, 0 remaining; Spec 2 core findings fixed, 0 remaining.
The two integration dependencies and human publication remain explicit acceptance items.
