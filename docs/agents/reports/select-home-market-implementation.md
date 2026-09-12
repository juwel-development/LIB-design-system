# Select implementation evidence

Date: 2026-09-12. Implemented by Codex for the native-field dependency of
`juwel-dev/g-label-manager` #125 under spec #124.

Source commit: `2b139fb68287f678a8a3d067a19933c564b92b97`
(`feat(select): add an accessible native single-select field`).
Base: `2e905b6`, the 3.7.0 release. Branch: `feature/select-for-home-market`.
Only the isolated feature worktree was edited; nothing was published, pushed, merged,
or versioned by hand. Independent review and release remain coordinator-owned.

## Contract

The public barrel exports `Select`. Its required props are `label`, `name`,
`placeholder`, and `options: readonly { readonly value: string; readonly label: string }[]`.
Optional props are `required`, `disabled`, `defaultValue`, `onChange$: Subject<string>`,
`optionalLabel`, `hint`, `invalid`, `errorMessage`, and `testId`.

This is an uncontrolled native single select, following Input's field/token/CVA conventions.
Unique, stable, nonempty option values belong to the caller, as does every visible string.
The enabled empty first option allows an initially empty required Home Market and clearing
an optional comparison market. The coordinator confirmed this contract and #125 received it
before implementation was complete.

Mount uses a matching `defaultValue`, otherwise empty. Surviving option keys retain the
selection across reorder and translation; removing the selected option falls back to empty.
Render, option updates and native form reset do not emit. Consumers reconcile their own
domain state when they replace options or reset the form. Native reset restores the initial
default while that option remains present; no separate `reset$` is justified for this task.

## Test evidence

The DOM and RxJS seams explicitly requested in the dispatch were tested through the public
barrel. Each production slice followed a failing test: initial rendering failed on the absent
module, then required validity, output emission, default initialization, disabled handling,
message associations, optional wording and `testId` each failed before implementation. Moving
the tests to the barrel failed before the public export was added.

The final 12 Select tests cover:

- Native single-select semantics, accessible label, stable values, initial empty option.
- Required validity, returning to invalid after clearing, and native FormData submission.
- Exactly one string per change, including empty; no mount/focus/rerender emissions;
  consumer-owned Subject lifetime after unmount.
- Disabled focus exclusion, submission exclusion, validity exemption and silent changes.
- Hint/error associations, removal of stale errors, distinct IDs and no invented wording.
- Localized optional marker and its suppression when required.
- Uncontrolled defaults, silent native form reset and later default changes.
- Preserving selections when options reorder or translate, empty fallback on removal,
  and options arriving after an unmatched default without silently choosing one.
- Consumer `testId` mapping.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 144 files checked |
| `npm run typecheck` | Passed |
| `npm test` | Passed; 44 files, 787 tests, including 12 Select tests |
| `npm run build` | Passed; ESM bundle and declaration output contain Select |
| `npm run build-storybook` | Passed; eight Select stories |
| Source commit hooks | Lint, typecheck, all 787 tests and commitlint passed |
| `git diff --check` | Passed |

Builds retain four existing CSS optimizer warnings from example utility strings in
`docs/agents/reports/108-choices-review.md` and `src/display-measure-site.spec.ts`.
Storybook also reports its existing missing MDX glob, Node deprecation and large-chunk
warnings. No Select-generated diagnostic blocked any check.

## Browser evidence

The required story was inspected through Orca's browser and exposed a named combobox,
selected empty option and native `valueMissing`. Its scoped axe scan had no violations.
Orca's unfocused embedded page did not receive usable keyboard input, so keyboard checks
ran in a separate temporary Playwright process with Chromium `151.0.7922.34`.

Verified keyboard sequence: Tab focuses the initially empty required field with a solid
focus outline; native typeahead `g` selects Germany (`de`) and satisfies validity; after
the native typeahead buffer expires, `c` returns to Choose a market (`''`) and restores
required-invalid validity. Disabled fields are skipped by Tab and retain their selection.
Native popup arrow-key operation was inconclusive in the macOS headless environment;
no synthetic jsdom key event is presented as proof of platform popup navigation.

Scoped axe scans covered Required, Invalid, Disabled, Localized and EmptyOptions in both
light and dark themes: **10 scans, zero violations**. The harness explicitly applied and
verified the dark class, then allowed the token-driven color transition to finish before
checking contrast. No repository browser-driver infrastructure or dependency was added.

Temporary reproduction script: `/tmp/select-home-market-browser/verify.mjs`.
Raw results: `/tmp/select-home-market-browser/evidence.json`.
The source stories and this report are the durable evidence; temporary files are not shipped.

## Consumer verification package

Final local development pack, sent to #125:

`/tmp/select-home-market-final/juwel-development-design-system-3.7.0.tgz`

SHA-1: `0b60ae0e0b5a6e16477e2809ec735478f3abf05e`.

The archive includes the new bundle, declarations and source. Its unchanged 3.7.0 metadata
does **not** make it the published 3.7.0 package. It is for local verification only;
the final consumer must depend on the published release after independent review.
