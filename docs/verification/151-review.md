# Independent #151 review and fixes — 2026-11-04

Reviewed full branch with `git diff a21b60e46b9d504071141abe2159f0331afd7c75...HEAD`,
pinned to the merge-base with local main. Initial commit: `06cd3cd`.
Authority retrieved afresh via `gh api repos/juwel-development/LIB-design-system/issues/{151,152}/comments --paginate`:
[#151 final brief](https://github.com/juwel-development/LIB-design-system/issues/151#issuecomment-6637288592),
[#152 final brief](https://github.com/juwel-development/LIB-design-system/issues/152#issuecomment-6637289232).
Earlier withdrawn plans/results were not acceptance evidence. Read CONTEXT.md, docs/agents/standards,
issue-tracker guidance and ADR 0007/0008. No AGENTS.md was present in this checkout or ancestor paths.

## Standards

Independent parallel Standards reviewer found one documented breach and two judgement smells:

- Screen's invalid `gapx` utility omitted the heading/content region gap, contrary to ADR 0008 and
  its public contract. Fixed to the conditional existing region role, removing duplicate padding.
- Possible Mysterious Name: `number` concealed CSS measurement parsing. Renamed `parseLength`.
- Possible Speculative Generality: the browser command dispatcher supported only keyboard presses.
  Replaced with `pressKey`.

The reviewer rechecked the final working diff and found **zero unresolved Standards findings**.
No new sizing tokens, public styling props, general registry or viewport breakpoint were added.

## Spec

Independent parallel Spec reviewer found three findings:

- Missing documented heading separation. Fixed, with actual rectangle-gap assertions for source
  CSS and all three delivered stylesheets, including no row gap in the absent-heading mode.
- Removing an unusable optional Pane.Body left stale fallback state, violating restoration and
  Pane's existing optional-slot contract. Fixed by measuring remaining fixed regions even without
  Body. The new OptionalBody fixture proves a sibling returns to bounded scrolling and Body can return.
- Acceptance assertions omitted input identity/value/selection/focus after font/content changes and
  restoration, and did not directly assert usable text/row thresholds. Added these assertions and
  height sweeps for ordinary text and delegated Table rows including focus inset/fixed table regions.

The reviewer rechecked the fixes and found **zero unresolved confirmed Spec defects**. Text remains
usable across its sweep while the other pane controls release; the text-only limiting-pane case is
not independently isolated. Deeper roster selection/pagination and the 15–17rem theme belong to #152.

Review totals: Standards 1 breach + 2 judgement findings, all resolved (worst: missing region gap);
Spec 3 findings, all resolved (worst: stale fallback preventing restoration).

## Regression-first evidence

Before the spacing fix, the new browser assertion failed with
`Heading separation uses the region role and absence reserves no gap` in `/tmp/151-review-red.log`.
Before the Pane fix, the new optional-body case failed with
`Removing an unusable optional body restores the fitting sibling bound` in
`/tmp/151-review-body-red.log`. Both were real Chromium geometry checks, not jsdom layout.
An initial startup attempt hit connection refused before Storybook was ready; it is not regression evidence.
The original implementation's historical test-first claims were read but not independently recreated;
this review's fixes have fresh failing-then-passing execution evidence.

## Fresh validation

Commands:

```sh
npm run storybook -- --ci --port 6011
npm run build
npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen.mjs
npm run lint
npm run typecheck
VITEST_MAX_WORKERS=1 npm test
npm run build-storybook
node --input-type=module -e 'import { Screen } from "./dist/design-system.js"; if (typeof Screen !== "function") throw new Error("Missing Screen export");'
npm pack --dry-run
```

Fixtures are in `src/Layout/Screen/Screen.stories.tsx`, runner in `scripts/browser/screen.mjs`.
Source coverage: both heading modes, Table delegation, Sidebar, narrow 40rem holder at 1920px,
short/empty bodies, optional foot/body, unsized content, 1920×1080, 1280×720, 1279×720,
1280×320, 800×720 and Sidebar 1024/1023 boundaries. Threshold sweeps cover controls, text and rows.
Keyboard coverage uses native PageDown, Tab and Shift+Tab to prove independent scrolling, visible
focus, final-entry/pagination reachability and delegated Table header pinning; no scrollIntoView.
Input node/value/selection/focus survive resizing, heading removal/insertion and font/content changes.
Twelve settled frames test fallback scroll-range stability. German-length text and 24px root font
exercise wrapping content and Shell bar. Browser checks use Chromium via Playwright 1.64.1.

Delivered CSS coverage removes Vite source style tags, inserts each of `dist/styles.css`,
`dist/styles.light.css` and `dist/styles.dark.css`, and repeats bounded → fallback → restored for
above-heading, inside-heading and delegated Table, with heading-gap checks. Storybook preview
visibility rules remain to hide its error/loading UI.

Fresh measured heights (client / scroll CSS px):

| Fixture/window | List | Detail | Shell |
| --- | ---: | ---: | ---: |
| Above / 1920×1080 | 553 / 1282 | 649 / 1410 | 999 / 999 |
| Above / 1280×720 | 205 / 1282 | 301 / 1410 | 639 / 639 |
| Inside / 1920×1080 | 469 / 1282 | 774 / 1410 | 999 / 999 |
| Inside / 1280×720 | 129 / 1282 | 418 / 1410 | 639 / 639 |
| Above / 1280×320 | 1282 / 1282 | 1410 / 1410 | 239 / 1718 |
| Optional body removed / restored to 1280×720 | absent | 301 / 1410 | 639 / 639 |

The corrected separate-heading gap is 24px. At height 549 the list retains 34.34px against a 34px
control minimum; at 548 it releases to 1282px. Text minimum is 37.2px including inset. Delegated
Table minimum is 117.5px including caption/header, a complete row and focus inset; it releases before
that no longer fits. These measurements supersede the pre-review geometry in `151-screen.md`.

## Fallow dispositions

Pinned command: `npm run fallow:agent -- --base a21b60e46b9d504071141abe2159f0331afd7c75`.
The tool completed and reported high review risk, 28 affected files beyond the diff, and the following
findings. Its base/head semantic attribution differed, so the audit used syntactic attribution;
three type candidates were abstentions. These are limitations, not proof of unused contracts.

- Public API addition: retain Screen, explicitly required by the final approved brief; no other new
  barrel export. Private allocation context remains internal.
- Unused `scripts/browser/screen.mjs`: retain the explicitly invoked browser acceptance runner.
  Unused `Screen.spec.tsx`: retain; Vitest's configured source glob executes it.
- Unused `IPaneRootProps`, `IPaneSectionProps`, `IPaneBodyProps`: retain existing exported props
  interfaces, as coding.md requires; absence of internal imports is not evidence of dead public types.
- Production dev dependency `@tailwindcss/vite`: build-time Vite plugin, not imported by delivered JS.
  Package build/check:build checks the delivery boundary; no dependency change warranted here.
- Clone groups c77b3abb6f87acd9-3 and -5: existing Pane/Table/Shell observer cleanup patterns;
  retain local ownership and teardown rather than introduce cross-component internals.
- Clone -2: new Screen fit observer resembles Shell observer plumbing but measures a different
  allocation invariant; retain local observer lifecycle, no generic observer/layout registry.
- Clone -4: existing Pane/Shell scrollability measurement; outside this change, retain.
- Clone -6: existing Pane/ScrollContainer recipe and overflow shape; independently owned components,
  retain their closed contracts.
- Clone -1: short story declarations vary fixture options; retain readable named Storybook examples.
  The reported clone family groups -2/-4/-5 adds no separate actionable defect.
- Large Example function and Screen describe callback: fixture composition and grouped behavior
  tests, respectively; retain. No production function-size extraction indicated.
- Complexity: Example's fixture branches, usableBodyHeight's semantic item measurement, existing
  Pane Body/overflow hook, and browser bounded assertions have distinct necessary behavior. Retain
  with browser boundary coverage; CRAP estimates use export references, not measured coverage.
- CSS token drift: invalid `gapx-[var(--gutter)]` was a real defect; fixed to conditional region gap.
  `grid-rows-[auto_minmax(0,1fr)]`, `grid-rows-[minmax(0,1fr)]`, and existing `flex-[0_1_auto]` express
  structural allocation, not new design measurements; retain.
- Aggregate CSS health (73/B, duplication/token-erosion/dead-surface scores, 86 custom properties,
  58 CSS-unreferenced/4 undefined candidates and arbitrary utility counts) includes established
  library/theme contracts and JS token consumers; it does not justify deleting tokens or adding
  sizing tokens. No new token or raw design dimension is introduced by this fix.

## Results and limits

Browser runner: PASS (42 JSON records); both new regressions pass after failing before their fixes.
Package build/check:build, standalone built export import, dry-run package (161 files), lint,
typecheck and Storybook production build passed. Raw current-run evidence is retained at
`/tmp/151-review-{browser,build,build-storybook,lint,typecheck,pack,tests}.log`.

Only representative library Chromium fixtures were exercised; this is not consumer acceptance,
cross-browser coverage or a guarantee that arbitrary content fits a reference viewport. #152 owns
its deeper roster integration. The text-only limiting-pane scenario noted above is not isolated.
No consumer edits, push, merge, release/publication, issue closure or GitHub writes were performed.
The review skill's project-status write was skipped under this dispatch's explicit no-GitHub-posting
instruction; the coordinator can manage tracking. No old scheduling gate was applied.

Full suite: **64 files / 1,449 tests passed**, 293.31 seconds, original timeouts unchanged.
The run emitted an existing jsdom `Not implemented: navigation to another Document` message but
exited successfully with no failed assertions. Storybook emitted its existing chunk-size advisory
and Node deprecation warning; neither prevented the production build. The normal pre-commit hook
repeats lint, typecheck and the full suite with the same single-worker limit; no hook is bypassed.
