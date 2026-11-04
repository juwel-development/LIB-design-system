# Independent review of #152 — 2026-11-04

Pinned local-main merge-base: `1bd4d1b0b5a9dde2830e8a8894ee44d5a783d229`.
Reviewed branch commit: `364f697` (`test(screen): validate bounded roster integration (#152)`).
Full comparison: `git diff 1bd4d1b0b5a9dde2830e8a8894ee44d5a783d229...HEAD`.
Authority retrieved afresh with `gh api repos/juwel-development/LIB-design-system/issues/{151,152}/comments --paginate`:
[final #151 brief](https://github.com/juwel-development/LIB-design-system/issues/151#issuecomment-6637288592)
and [final #152 brief](https://github.com/juwel-development/LIB-design-system/issues/152#issuecomment-6637289232).
Earlier withdrawn plans and evidence were excluded. Read CONTEXT, all four standards and ADR 0007/0008.
Standards and Spec were reviewed by separate parallel agents; the primary reviewer confirmed the findings and applied fixes.

## Standards

One documented finding: roster browser acceptance queried search, rows and pagination by test ID
although accessible roles/names identify them (testing.md, Querying). Fixed these action queries to
use textbox, row and button names; geometry and identity bookkeeping retain IDs.
One nonblocking heuristic: duplicated Playwright startup between the two acceptance runners.
Retained a small explicit startup in each standalone diagnostic instead of introducing a general harness.
No production API/architecture violation found. Browser validation is explicitly required by this
brief, superseding the older testing document's browser-driver exclusion.

## Spec

Two P2 evidence findings: final detail-action checks established focus but not visible geometry or
focus-ring clearance; WrappedRegions had threshold measurements but no keyboard traversal.
Fixed the harness to assert final detail-action and pagination focus visibility, verify final-row
visibility after Shift+Tab, and traverse the oversized fixture at 1280×320.
The fixes strengthen acceptance; no production behavior was changed.
The branch preserves the approved public Screen surface, shared fallback, fixture-only width tokens
and proportional container-fit stacking. German fallback at 1280×720 is an honest fit limit, not a
missing fixed-viewport guarantee.

Summary: Standards 1 documented finding fixed and 1 nonblocking smell retained; Spec 2 P2 evidence findings fixed.

## Fallow dispositions

`npm run fallow:agent -- --base 1bd4d1b0b5a9dde2830e8a8894ee44d5a783d229` and
`npx fallow audit --base 1bd4d1b0b5a9dde2830e8a8894ee44d5a783d229 --format json`.
Initial audit verdict **FAIL**, not a green gate: 2 dead-code/dependency findings, 16 clone groups,
and 4 complexity findings. Attribution: 1/1 new/inherited dead-code, 15/1 clones, 3/1 complexity.
Semantic analysis was partial and base/head attribution fell back to syntactic analysis; no claim
of complete type-aware proof is made. All individual findings follow.

- Unused `scripts/browser/roster.mjs`: false positive for a manually invoked acceptance entry point;
  the documented command and fresh execution establish use. Keep the runner.
- `@tailwindcss/vite` production dependency: inherited build-tool classification; imported by Vite
  configuration, not shipped runtime. Keep it a dev dependency.
- `Roster` complexity/size: retained fixture orchestration and explicit public composition; locale,
  paging and selection drive acceptance, not production business logic. Splitting this sample into
  abstract render helpers would obscure the anatomy under review.
- `Example` complexity/size: inherited shared Screen fixture, only documentation changed here.
- `keyboard` complexity/size: retained sequential native keyboard acceptance assertions; complexity
  is diagnostic, with actual browser execution rather than estimated CRAP as behavior evidence.
- `bounded` complexity: retained independent geometry invariants; extracting each assertion adds
  indirection without removing the invariants. CRAP is estimated without browser coverage mapping.

Final working-tree audit remains **FAIL**: 2 dead-code/dependency findings, 17 clone groups (16 new, 1 inherited), and 4 complexity findings (3 new, 1 inherited). The strengthened keyboard function has 128 lines and cyclomatic complexity 11; its native traversal and assertions remain intentionally sequential. No suppressions or threshold changes were added. The following final clone list supersedes the initial count above.

1. Clone `dup:c77b3abb6f87acd9-6` (new): `src/Display/Table/Table.stories.tsx:668`; `src/Interaction/NumberInput/NumberInput.stories.tsx:149`; `src/Layout/Dialog/Dialog.stories.tsx:69`; `src/Layout/Dialog/Dialog.stories.tsx:126`; `src/Layout/Dialog/Dialog.stories.tsx:224`; `src/Layout/Dialog/Dialog.stories.tsx:280`; `src/Layout/Screen/ScreenRoster.stories.tsx:97`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
2. Clone `dup:c77b3abb6f87acd9-15` (new): `src/Display/DefinitionList/DefinitionList.stories.tsx:730`; `src/Interaction/NumberInput/NumberInput.stories.tsx:150`; `src/Layout/Dialog/Dialog.stories.tsx:127`; `src/Layout/Dialog/Dialog.stories.tsx:179`; `src/Layout/Dialog/Dialog.stories.tsx:225`; `src/Layout/Screen/ScreenRoster.stories.tsx:100`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
3. Clone `dup:c77b3abb6f87acd9-3` (new): `src/Display/DefinitionList/DefinitionList.stories.tsx:730`; `src/Display/Table/Table.stories.tsx:1026`; `src/Interaction/NumberInput/NumberInput.stories.tsx:150`; `src/Layout/Screen/ScreenRoster.stories.tsx:100`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
4. Clone `dup:c77b3abb6f87acd9-4` (new): `src/Layout/Dialog/Dialog.stories.tsx:126`; `src/Layout/Dialog/Dialog.stories.tsx:224`; `src/Layout/Screen/ScreenRoster.stories.tsx:99`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
5. Clone `dup:c77b3abb6f87acd9-2` (new): `src/Layout/Dialog/Dialog.stories.tsx:69`; `src/Layout/Dialog/Dialog.stories.tsx:280`; `src/Layout/Screen/ScreenRoster.stories.tsx:98`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
6. Clone `dup:c77b3abb6f87acd9-11` (new): `src/Display/DefinitionList/DefinitionList.stories.tsx:730`; `src/Interaction/NumberInput/NumberInput.stories.tsx:150`; `src/Layout/Screen/ScreenRoster.stories.tsx:100`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
7. Clone `dup:c77b3abb6f87acd9-7` (new): `src/Layout/Dialog/Dialog.stories.tsx:69`; `src/Layout/Dialog/Dialog.stories.tsx:280`; `src/Layout/Screen/ScreenRoster.stories.tsx:97`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
8. Clone `dup:c77b3abb6f87acd9-13` (new): `src/Interaction/NumberInput/NumberInput.stories.tsx:149`; `src/Layout/Screen/ScreenRoster.stories.tsx:99`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
9. Clone `dup:c77b3abb6f87acd9-9` (new): `scripts/browser/roster.mjs:7`; `scripts/browser/screen.mjs:8`. Keep small standalone runner setup/style swapping/geometry assertions; a shared harness would couple separate acceptance scenarios.
10. Clone `dup:c77b3abb6f87acd9-5` (new): `scripts/browser/roster.mjs:283`; `scripts/browser/roster.mjs:319`. Retain explicit final-row and detail-action focus measurements: the former clips against the sticky table header, the latter against the detail body; their shared rect/ring setup is small and their visibility bounds differ.
11. Clone `dup:c77b3abb6f87acd9-12` (new): `src/Layout/Screen/Screen.stories.tsx:232`; `src/Layout/Screen/ScreenRoster.stories.tsx:293`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
12. Clone `dup:7ffce3a9` (new): `scripts/browser/roster.mjs:29`; `scripts/browser/screen.mjs:433`. Keep small standalone runner setup/style swapping/geometry assertions; a shared harness would couple separate acceptance scenarios.
13. Clone `dup:c77b3abb6f87acd9-10` (new): `src/Display/Table/Table.stories.tsx:1025`; `src/Layout/Screen/ScreenRoster.stories.tsx:97`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
14. Clone `dup:c77b3abb6f87acd9-16` (new): `scripts/browser/roster.mjs:167`; `scripts/browser/screen.mjs:76`. Keep small standalone runner setup/style swapping/geometry assertions; a shared harness would couple separate acceptance scenarios.
15. Clone `dup:c77b3abb6f87acd9-8` (new): `scripts/browser/roster.mjs:507`; `scripts/browser/screen.mjs:171`. Keep small standalone runner setup/style swapping/geometry assertions; a shared harness would couple separate acceptance scenarios.
16. Clone `dup:c77b3abb6f87acd9-1` (inherited): `src/Layout/Screen/Screen.stories.tsx:231`; `src/Layout/Screen/Screen.stories.tsx:244`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.
17. Clone `dup:c77b3abb6f87acd9-14` (new): `src/Layout/Screen/Screen.stories.tsx:227`; `src/Layout/Screen/ScreenRoster.stories.tsx:288`. Keep explicit story setup/exports; repeated RxJS state creation and story variants are independent fixture state, not a shared domain abstraction.

## Fresh browser evidence and reproduction

The review rebuilt package and Storybook before starting the dev server; no source/stylesheet build
ran during browser acceptance. Chromium version: `156.0.8078.4` (ephemeral Playwright 1.64.1).

```sh
npm run build
npm run build-storybook
npm run storybook -- --ci --port 6013
SCREEN_STORYBOOK_URL=http://localhost:6013 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen.mjs
SCREEN_STORYBOOK_URL=http://localhost:6013 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/roster.mjs
npm run lint
npm run typecheck
VITEST_MAX_WORKERS=1 npm test
npm run check:build
```

Fixtures: `layout-screen-roster--english`, `--german`, `--short`, `--empty`, `--wrapped-regions`.
Measured reference results were reproduced without changing typography, facts or minima:

| Locale/window | Roster/detail width | Table visible/content | Detail visible/content | Shell visible/content |
| --- | --- | --- | --- | --- |
| EN 1920×1080 | 272/1270 | 541/3458 | 846/1442 | 1021/1021 |
| EN 1280×720 | 272/630 | 290/3458 | 418/2529 | 661/661 |
| DE 1920×1080 | 272/1270 | 541/3497 | 846/1442 | 1021/1021 |
| DE 1280×720 | 272/630 | 3497/3497 | 2529/2529 | 661/3931 |

Both panel heads begin at y=105.5px. German fixed content at the smaller reference leaves less
than the 201.5px complete-row budget, so Shell scrolls the whole content. The 17rem roster cap is
preserved. This is an explicit fit limitation, not evidence that arbitrary German content fits.

The strengthened runner retains source CSS plus isolated `dist/styles.css`, `styles.light.css`,
and `styles.dark.css` execution (Vite source styles removed and absence asserted). For each style,
EN/DE cover reference widths, 1279px without a special switch, 1280×320, 800/600px widths,
restoration, heading insertion/removal, locale changes, 200% root text and state/focus retention.
Native Tab reaches row 40 and pagination; Shift+Tab returns visibly to row 40, then Tab reaches
the visible final detail action. Complete vertical focus extents are asserted. WrappedRegions
adds the same native traversal at 1280×320. PageDown independently scrolls Table/detail and retains
the sticky header; no `scrollIntoView` is used. Short/empty cases and 15-height threshold sweeps
remain source-CSS checks. Shared Screen acceptance separately covers narrow holders, both heading
modes, ordinary text/controls, unsized composition and all three delivered stylesheets.

Raw review logs: `/tmp/152-review-{build,storybuild,lint,typecheck,tests,delivery,screen}.log`,
`/tmp/152-review-roster-fixed.log`, `/tmp/152-review-fallow-final.json`.
The initial browser run is `/tmp/152-review-roster.log`; acceptance of the fixes relies on the
separate strengthened run, not the initial runner. The only interim lint failure was formatting
of new assertions; Biome formatted them before the final lint run.

## Limits and delivery scope

No production change was necessary. Only `scripts/browser/roster.mjs` and this review report change
in the review commit. Actual consumer #305 theme/content fit, other engines, assistive technology
and multi-application validation remain unverified, explicitly separate from this representative
library contract. No consumer edit, push, merge, publication, issue closure or tracker mutation was
performed. The skill's In Review transition is skipped under this dispatch's no-GitHub-posting rule.


## Completed validation

- Strengthened roster runner: **PASS**, 113 JSON records; final oversized keyboard traversal,
  PageDown isolation, retained focused row, stable fallback range and pagination/filter restoration passed.
- Shared Screen runner: **PASS**, 42 JSON records.
- Lint: **PASS**, 211 files. Typecheck: **PASS**.
- Full suite: **PASS**, 64 files / 1,449 tests in 172.15 seconds.
- Package build (including delivery check), separate `check:build`, and Storybook build: **PASS**.
- `node --check scripts/browser/roster.mjs` and `git diff --check`: **PASS**.
- Both independent reviewers rechecked the fixes and confirmed closure of their findings.
- Fallow remains **FAIL with the dispositions above**; no claim of a clean automated audit.

The full suite emitted the existing jsdom navigation-not-implemented diagnostic without a failing
assertion. There are no unresolved review blockers within the requested library scope; the explicit
application/browser/assistive-technology limitations above remain. The commit uses the normal hooks,
which repeat lint, typecheck and the full suite; no hook bypass is authorized or used.
