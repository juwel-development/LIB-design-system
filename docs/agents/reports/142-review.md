# Issue #142 review

Reviewed 2026-11-04 in the existing ticket-142 worktree. Fixed comparison:
`git diff 0c9e76d85b68d7fcdda8a72d8d01105ee9417bbe...HEAD`.
The pinned merge-base with local main is the accepted decision commit itself.
Original reviewed commit: `5a1b21c feat(table): add bounded scrolling and pinned headers (#142)`.
Independent Standards and Spec subagents reviewed the same diff without making edits.

Sources: fetched [issue #142 and both comments](https://github.com/juwel-development/LIB-design-system/issues/142),
including the narrowed Agent Brief, and [linked consumer spec #300 and comments](https://github.com/juwel-dev/g-label-manager/issues/300).
Read ADR 0008 and CONTEXT at `0c9e76d`; accepted decisions override original requests.
Canonical standards: all four files under `docs/agents/standards/`.

## Standards

1. **Low, fixed:** DynamicBoundedExample's Subject fields omitted `$`, violating
   `coding.md`, Naming: observable-valued props and fields end in `$`.
   Renamed to `select$`, `resize$`, `filter$`, and `selected$` throughout the story.
2. **Low, fixed:** `short` and `expanded` violated the same section's assertion-style
   boolean naming requirement. Renamed to `isShort` and `isExpanded`, including setters.
3. **Optional judgment, retained:** possible Duplicated Code in Table's overflow measurement
   and focus reveal: both calculate the header height plus twice the focus-ring allowance.
   No behavioral inconsistency was found; a shared helper is optional, and the two localized
   geometry calculations do not warrant refactoring the reviewed runtime in this pass.

No other confirmed non-tooling standards violations. These are story-only naming corrections;
no new behavior or regression test is needed. The existing dynamic story exercises all renamed fields.

## Spec

No confirmed implementation defect or scope creep against the accepted decisions.
The implementation preserves one semantic table and one wrapper for both axes, opaque pinned
headers, caption naming, all bounded-mode columns, existing weighted allocations, and selection
without scrolling. Focus reveal accounts for measured header height. Dialog's opt-in child
ownership preserves default body ownership.

Three acceptance/evidence gaps remain:

- **Pane #141 composition:** the brief asks to “Demonstrate Pane.Body scrollOwner=\"child\"
  passing the height bound to Table without adding scrolling.” The implementation report records
  the coordinator assigning that story and public composition test to #141 after reviewed #142 lands.
  This branch documents the composition but does not prove it. Verify the final merged pair,
  including intermediate height allocation and fixed surrounding regions. Other sibling compositions
  such as Sidebar/Shell were not integrated or reverified by this review.
- **Browser coverage:** the brief asks that “row/control focus rings remain visible at scroll
  boundaries.” Prior WebKit evidence verifies geometry, not a visually observed keyboard ring;
  synthetic keys did not enable focus-visible. Chromium, Firefox and assistive technology remain
  unverified. Do not interpret jsdom or the independent source review as browser layout proof.
- **Publication:** “Publish through the normal release workflow” remains a human follow-up,
  explicitly excluded from this worker's authorization.

## Evidence and disposition

- Fresh `npm run lint`, `npm run typecheck`, and `npm test`: pass; 61 files / 1,392 tests.
  Existing jsdom navigation diagnostic is unchanged.
- Fresh `npm run build`: pass, including declaration generation and all published artifact checks.
- Fresh `npm run build-storybook`: pass; existing missing-MDX and chunk-size warnings only.
- `npm run fallow:agent -- --base 0c9e76d85b68d7fcdda8a72d8d01105ee9417bbe`: completed;
  advisory high-risk closure (27 affected files), duplication and complexity findings informed review.
  Type-aware attribution fell back to syntactic comparison; no automatic code deletions applied.
- After the naming corrections, reran the dynamic Storybook example in Orca WebKit: play reached
  the expanded-header, filtered state; its table wrapper measured 215px client/scroll height,
  no tabindex, 144px measured scroll padding, and page scroll remained zero.
  This is a focused smoke check; detailed original geometry evidence remains in `142-implementation.md`.
- The fix commit runs the repository pre-commit lint, typecheck and full test checks again.

No push, merge, release, issue closure or Done transition. The skill's tracker transition was
not performed because this dispatch explicitly forbids posting to GitHub or other channels;
coordinator communication uses Orca orchestration only.

Standards: two low naming findings fixed, one optional duplication observation retained;
Spec: zero confirmed code findings, three acceptance/evidence gaps, primarily sibling Pane integration.
