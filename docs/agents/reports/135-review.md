# Ticket #135 review and verification

Implementation commit: `d96ff47`.
Fixed merge-base with main: `3fa293b5ac5b0a944235922394993825aab8ff92`.
Reviewed with `git diff 3fa293b5ac5b0a944235922394993825aab8ff92...HEAD`.
Two parallel Codex reviewers independently reviewed Standards and Spec using the
code-review skill. Sources were the full library issue #135 and comments, linked
consumer juwel-dev/g-label-manager#232 and comments, CONTEXT.md, all four repository
standards documents, and the typography ADR.

## Standards

Zero confirmed breaches and zero actionable smell findings. Closed CVA props,
semantic tokens, generated stylesheets, public contracts, and colocated stories
follow the documented rules. Repeating the small variant definition is appropriate
under the independent component recipe rule.

The new public tests cover the prop union and paragraph semantics, not computed
weight. The testing standard permits appearance to be left to stories; browser
verification below supplies the missing rendered evidence without introducing a
browser-driver test framework. No confirmed finding required a production fix or
additional regression test.

Fallow ran against the fixed base. Token renderer signatures remain unchanged;
the build script consumes their additional token normally. Generated stylesheet
repetition and per-component recipes are deliberate repository conventions.

## Spec

Zero implementation findings. Both body and note roles expose
`emphasis="regular" | "strong"`; strong reads `--font-weight-strong`, default 700.
Regular and omitted preserve inherited weight. Contracts explicitly identify visual
emphasis, no importance semantics or announcement, and the need for state wording
independent of weight. Neither size nor face nor line height changes.

Both components have Strong and ReadAndUnread stories with consumer-supplied words.
No missing component dependency is needed for these examples. The wider consumer
Message list remains outside this ticket.

Publication is the sole outstanding acceptance criterion, deferred to the human
push/release. No version bump, publication, push, merge, issue closure or Done
transition was performed. Tracker writes were omitted under the dispatch instruction
not to post to GitHub during this run.

## Verification

- `npm run build`: passed, including declarations.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 57 files and 1,334 tests passed.
- `npm run build-storybook`: passed.
- Orca browser checked the built P and Note ReadAndUnread stories. Both rendered
  regular weight 400 and strong weight 700 with identical computed families.
  P retained 17px size, 27.2px line height and equal 27.1953125px element heights;
  Note retained 15px size, 22.5px line height and equal 22.5px element heights.
- A scoped `--font-weight-strong: 800` override and inherited weight 500 produced
  regular 500 and strong 800 for both components, confirming theme ownership.

Non-failing build warnings mention existing CSS placeholder expressions, Storybook
chunk sizes and missing MDX stories; jsdom reports unsupported document navigation.
The implementation documents that changed glyph widths can alter wrapping, so
arbitrarily wrapped text is not promised equal total height.

Standards: 0 findings; Spec: 0 implementation findings, 1 deferred release criterion.
