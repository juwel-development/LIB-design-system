# #152 roster integration — 2026-11-04

Authority: the final approved briefs retrieved with
`gh api repos/juwel-development/LIB-design-system/issues/{151,152}/comments --paginate`:
[#151](https://github.com/juwel-development/LIB-design-system/issues/151#issuecomment-6637288592)
and [#152](https://github.com/juwel-development/LIB-design-system/issues/152#issuecomment-6637289232).
Base revision: `1bd4d1b0b5a9dde2830e8a8894ee44d5a783d229` (merged #151).
Earlier withdrawn plans/results are neither the specification nor validation evidence.
Read CONTEXT.md, docs/agents/standards, ADR 0007/0008 and the implementation workflow.
No AGENTS.md exists in this checkout or its ancestor paths.

## Implementation

`src/Layout/Screen/ScreenRoster.stories.tsx` supplies English, German, Short, Empty and
WrappedRegions fixtures through the public `index` entry point. The composition is:

```
Shell → Sidebar.Root fill → Sidebar.Content → Screen (heading omitted)
  → ColumnLayout.Root fill
    → Column (weight 1, minimum 15rem, maximum 17rem)
      → Pane: Head (H1, Input, count), Body scrollOwner="child" (bounded Table), Foot (pagination)
    → Column (weight 1, minimum 20rem)
      → Pane: Head (selected entry), Body (long text and final action)
```

The three width properties are local fixture theme declarations, not new library sizing tokens.
No consumer geometry styles are applied to Screen or the panels. Search filters rows, row activation
updates consumer-owned selection, pagination changes entries, and the Shell controls change locale
or move the single H1 between Screen and Pane.Head. Short/empty roster fixtures retain a long detail
body to distinguish independent allocation from merely short overall content. Every stream
subscription in the fixture is disposed on unmount.

Screen's public contract and implementation remain those merged in #151. No production change was
needed by the roster acceptance cases. This integration adds examples, documentation and executable
browser assertions rather than inventing another main, width policy, sizing prop or allocation
protocol. The existing Screen stories link to the roster integration and describe its reference-fit
limit. Caller-owned widths/content are consistent with ADR 0007/0008; this is one representative
library composition, not evidence from multiple applications.

## Reproduction

```sh
npm run build
npm run build-storybook
npm run storybook -- --ci --port 6012
# In another terminal, after Storybook is ready; keep sources/build output unchanged during runs:
SCREEN_STORYBOOK_URL=http://localhost:6012 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/roster.mjs
SCREEN_STORYBOOK_URL=http://localhost:6012 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen.mjs
npm run lint
npm run typecheck
npx vitest run src/Layout/Screen/Screen.spec.tsx src/Layout/Pane/Pane.spec.tsx
VITEST_MAX_WORKERS=1 npm test
```

The ephemeral Playwright runner does not change package dependencies. Chromium version for this run:
`156.0.8078.4`. Both scripts emit JSON measurements and assert geometry; they do not use screenshots
or jsdom for geometry, nor call `scrollIntoView` in their checks. The roster runner closes its browser
in `finally`, including assertion/startup failures. Install the matching Chromium through the same
Playwright runner if it is not already available on the machine.

Do not run `build-storybook` concurrently with the dev-server browser runs: Vite observes the generated
HTML and reloads the preview. An initial attempt did that and both browsers stopped with
`Execution context was destroyed, most likely because of a navigation`. Those incomplete attempts
are not acceptance passes. The final runs below followed the completed build with unchanged fixtures.

## Measured fit

CSS pixels, default 16px root font. Heights below are visible/content heights; roster width is 272px
(17rem) at all four reference cases, and both heads start at y=105.5px. Detail receives the remainder:
1270px at 1920 and 630px at 1280, with the normal 24px column gap.

| Locale/window | Table | Detail body | Shell body | Result |
| --- | ---: | ---: | ---: | --- |
| English 1920×1080 | 541 / 3458 | 846 / 1442 | 1021 / 1021 | Independently bounded |
| English 1280×720 | 290 / 3458 | 418 / 2529 | 661 / 661 | Independently bounded |
| German 1920×1080 | 541 / 3497 | 846 / 1442 | 1021 / 1021 | Independently bounded |
| German 1280×720 | 3497 / 3497 | 2529 / 2529 | 661 / 3931 | Whole-content fallback |

The German H1 wraps to two lines at the smaller reference size. Its head is 300.28px tall; only
197.72px remains for a Table whose caption/header, ordinary row and focus room need 201.5px. The
initial assertion that every reference case must stay bounded failed on this real fit limit.
Typography, facts and declared minima were retained; the correct contract is fallback when fixed
content does not fit. This is not a production regression or a claim that German content always
fits 1280×720. Moving the heading to Screen is separately measured by the runner, not used to replace
the required heading-inside fixture. At 1279px the same width policy still applies; there is no
special 1280px switch.

## Acceptance coverage

- Both modes: exactly one main/H1; omitted heading has no header or gap. Heading changes keep the
  same search node/value/text selection/focus and selected Table row. Reading order follows the
  roster head, rows, pagination, detail head and detail body.
- Roster matrix: EN/DE at 1920×1080, 1280×720 and 1279×720; 1280×320 fallback; 800×720 Sidebar stacking and 600×720 column stacking;
  restore to 1920×1080; heading moved at 1280×720; 200% root text and restoration. Each case runs
  against source CSS and all three delivered stylesheet exports.
- Short/empty EN/DE tables at both reference sizes retain natural height, with pagination immediately
  following rather than filling the body. Detail remains long. Filtering to empty and returning,
  next/previous page and row selection exercise the consumer state rather than inert mock controls.
- Usability sweeps for English, German and oversized/wrapped regions cover 1280px width with heights
  1080, 800, 724, 723, 722, 721, 720, 650, 600, 590, 580, 500, 400, 320 and restored 1080. Each
  allocation must fit the complete ordinary row, fixed Table regions and focus extent or release.
- Native Tab traverses all 40 rows to pagination, Shift+Tab returns to the final row, and Tab reaches
  the final detail action. Assertions include row outline and clearance from the sticky header,
  scrollport edge or Shell bar. These checks cover bounded, short-height fallback and enlarged text.
- Native PageDown moves only the Table (header remains visible) or only the detail body. The delegating
  Pane has no extra tab stop. Focused row identity survives resize/stack/fallback/restoration.
  Eighty animation frames confirm an already-scrolled fallback retains its ancestor scroll range.
- The fresh shared `screen.mjs` run covers above-heading and inside-heading arrangements, body-owned
  controls/text, delegated Table, Sidebar 1024/1023 boundaries, narrow 40rem holder on a 1920px
  viewport, unsized content, short/empty bodies, optional foot/body, threshold sweeps, font/content
  changes, heading insertion/removal, stable fallback and native scroll/focus behavior.

Stylesheet coverage: the roster runner removes Vite source style tags and stylesheet links, asserts
that none remain, and inserts each of `dist/styles.css`, `dist/styles.light.css`, and
`dist/styles.dark.css`. Theme width values remain on the fixture, as in a consuming theme.
Reference dimensions, fallback/restoration, keyboard and state checks execute for each export.
Source CSS separately exercises the Tailwind source-scanning path. Package `check:build` verifies
all three self-contained exports and the CSS-free JavaScript entry.

## Results and limits

All required checks passed:

- `npm run lint`: 211 files checked, no errors.
- `npm run typecheck`: passed.
- Focused Screen/Pane tests: 2 files / 17 tests passed.
- Full suite: 64 files / 1,449 tests passed in 244.13 seconds, unchanged timeouts.
- Package build, all `check:build` delivery checks, built Screen export import and `npm pack --dry-run`
  passed (161 packaged files).
- Storybook production build passed. Its existing chunk-size advisory and Node deprecation warning
  did not prevent completion. The test suite emitted the existing jsdom navigation-not-implemented
  message without failing an assertion.
- `scripts/browser/screen.mjs`: PASS, 42 fresh JSON records.
- `scripts/browser/roster.mjs`: PASS, 112 JSON records including runtime metadata and three
  15-height threshold sweeps. No production fix was needed and no regression-first production
  change is claimed; the new work consists of integration fixtures, acceptance assertions and docs.

The German row threshold is directly bracketed: 202px visible body at height 724 fits its 201.5px
minimum; height 723 releases the entire Table to 3497px. At 1280×720, short English retains a
163px Table beside a 418/2529px bounded detail; empty English/German tables retain 78px/117px
respectively beside that same independently bounded detail. Short German's 202px Table still needs
fallback at this reference height, for the same complete-row constraint as its long case.

Raw current-run output: `/tmp/152-roster-final.log`, `/tmp/152-screen-final.log`,
`/tmp/152-{build,build-storybook,lint,typecheck,focused,tests,pack}.log`.
The complete scripts and summarized dimensions are retained in the repository so evidence is
reproducible without these temporary logs. The normal commit hook repeats lint, typecheck and the
full suite with `VITEST_MAX_WORKERS=1`; no hook is bypassed.

Only representative library Chromium fixtures were tested. Actual consumer #305 theme/content fit,
other browsers, assistive-technology testing and multi-application evidence remain separate checks.
The German smaller reference case intentionally and correctly falls back; it is not a fit guarantee.
No consumer edits, dependency/version changes, push, merge, publication or issue closure occurred.
The implementation skill's tracker write is omitted under the dispatch's explicit no-GitHub-posting
instruction. Review is intentionally left to the separately dispatched fresh reviewer; no helper
workers or review agents were launched and no Fallow result is claimed here.
