# #100 code review

Reviewed `9358fdbf2d908145f713d7d6abe30f586defe3f8` against the pinned merge-base
`29ca5c68bf638c84ffe6a89ac78ed72b3ff08f95` (`git diff <base>...HEAD`).
The issue body and all comments were fetched, including a paginated REST comments check
(one comment). The [agreed Agent Brief](https://github.com/juwel-development/LIB-design-system/issues/100#issuecomment-5555885319)
supersedes the original unconditional frame-axis requirement.

Read CONTEXT.md and all four repository standards. Standards and Spec were reviewed
independently by parallel sub-agents; the primary reviewer reran the browser and package checks.
No applicable AGENTS.md or CONTRIBUTING.md was found. The branch commit carries no major-release
signal, and the added optional prop preserves the existing API.

## Standards

**0 confirmed violations; no actionable judgement smells.** Stack keeps its closed CVA-derived
API, existing recipe, dependency direction and barrel surface. The public type assertion checks
consumer vocabulary. Both alignment variants have stories, and public documentation describes
the guarantee. The implementation report records the failing type assertion before implementation.

The browser evidence records environment, viewport matrix, tolerance, geometry comparisons and
a reproducible procedure using existing tooling. Browser assertions are explicitly distinguished
from the jsdom suite. No correction was needed.

Fallow raised its public-API review advisory; the only addition is optional, with no default,
so callers that omit alignment retain their behavior. Its private-type warning conflicts with
the documented component-only barrel convention, and its test reachability, existing story
similarity, Tailwind dependency and unchanged test utility advisories do not identify defects
introduced by this diff.

## Spec

**0 findings.** The implementation follows the authoritative brief without scope creep:
optional start/center, inherited omission, logical LTR/RTL resets, explicit descendant alignment,
block-local centring, and unchanged layout recipes. It changes neither Cover nor typography.
The narrower split tracks correctly centre their text on their own axes.

## Fresh validation

Executed on 2026-09-06 against the reviewed implementation:

- `npm run lint`: passed, 114 files.
- `npm run typecheck`: passed.
- `npm test`: passed, 36 files and 541 tests.
- `npm run build`: passed, including declaration generation.
- `npm run fallow:agent -- --base 29ca5c68bf638c84ffe6a89ac78ed72b3ff08f95`: reviewed.
- Restarted Storybook with `npm run storybook -- --ci --port 6100` and reran the
  [implementation report's browser harness](100-stack-alignment.md#reproduction)
  through Orca's embedded Chromium 150.0.7871.224.

All **22** browser cases reached Storybook phase `finished`. Wrapped H1 and Note at
1280, 390 and 280 CSS px matched the implementation report's line-axis measurements exactly.
Maximum centred-line midpoint error was **0.0078125 CSS px**, below the **0.1 CSS px** tolerance.
The 280 px viewport is below the 320 px action bound; both roles wrapped there.

Across omitted, center and start, every recorded box retained identical x/y, width/height,
gap, max-width and flex direction, with unchanged line counts. Split remained column at
1023 and row at 1024 px. Narrow 320 px tracks at 1280 px centred text on axes 314 and 966,
not the outer 640 px axis. Nested omission computed center; LTR start met the left edge,
RTL start met the right edge, and Table retained right alignment. The stories' play assertions
also completed. Fresh raw results are at `/tmp/ticket-100-review-measurements.json`; the
committed implementation report contains the full reproducible harness and measurement tables.

## Remaining risks and handoff

Browser regression assertions execute through Storybook, separately from `npm test`; future
CI needs a browser execution step to exercise them. Verification covers Chromium, not other
browser engines. The production build retains two existing Tailwind warnings from unchanged
`src/display-measure-site.spec.ts` comments containing placeholder `var(…)` candidates.
These are limitations, not confirmed findings against this ticket.

No code corrections were required. This report is the only review addition; the coordinator
owns merging and pushing. The issue remains open and is moved to In Review, never Done.

Summary: Standards 0 findings (no worst issue); Spec 0 findings (no worst issue).
