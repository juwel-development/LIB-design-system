# Review: #116 ColumnLayout (feature/ticket-116, 3739997…HEAD)

Two-axis review per `/code-review`, run 2026-10-03 by Claude Fable 5.1 as an Orca worker.
Standards and Spec ran as independent, fresh sub-agents against `git diff 3739997...HEAD`
(the fixed merge-base with `main`; two commits, `c33658e` feat and `04c61f2` docs), with issue
[#116](https://github.com/juwel-development/LIB-design-system/issues/116) including its one
comment (the approved Agent Brief, which supersedes the body's "extend Stack"), the local copy
[116-agent-brief.md](./116-agent-brief.md), consumer
[juwel-dev/g-label-manager#195](https://github.com/juwel-dev/g-label-manager/issues/195),
the ColumnLayout amendment to [ADR 0008](../../adr/0008-when-a-token-role-becomes-a-prop.md)
and `CONTEXT.md` as spec sources, and the four `docs/agents/standards/*` files plus the smell
baseline as standards sources. The implementer's own
[evidence report](./116-column-layout-implementation.md) was treated as a set of claims to
verify, not as evidence. The issue's comments and labels were refreshed again before this
report settled: one comment, labels `component-proposal` + `ready-for-agent`, unchanged.

Confirmed findings were fixed in `d5ed108`; the branch was neither pushed nor merged and no
issue was closed. `fallow review --brief --base 3739997` was run for the reading order; its
advisories are dispositioned under Standards.

## Standards axis

Hard findings (documented standards):

1. **Comment budget** (coding.md § Comments: any non-header block at most 4 lines) — the
   `columnLayoutColumn` recipe's block in `ColumnLayout.tsx` was 7 lines. Every other block in
   the five source files was counted and is within budget. → **Fixed**: cut to 4 lines keeping
   the load-bearing facts (the Holy Albatross credit, the 1/64 px Chrome layout grain the
   amplification factor is chosen for, `0px`/`100%` as states rather than measurements); the
   `min-w-0` sentence was a second copy of the TSDoc guarantee and is gone.

Judgement calls:

2. **Member hook shape** — Tabs, Choices, Dialog and MultiSelect each read their contract into
   a named value before throwing; `ColumnLayoutColumn` inlined `useContext` inside the `if`,
   which reads as a conditional hook call although it is not one. → **Fixed**: the Column reads
   `isCounted` first, and the boolean context is renamed `ColumnLayoutMembership` so the value
   it carries reads as what it grants (also the baseline's Mysterious Name / Primitive Obsession
   note on a bare-boolean context).
3. **`MinWidthToken` is a file-local `type` on a public prop** — compliant: the barrel rule's
   own prescription is `ComponentProps<typeof ColumnLayout.Column>['minWidth']`, and Dialog's
   `NamePart` and Meter's level style keep the same shape local. Only values a consumer
   constructs (`FormState`, `PaletteTokens`) earn a barrel line. → No change.
4. **Class-string assertions in the spec** (testing.md "never assert on the class string") —
   the gap-role, no-margin and no-`dark:` assertions are exactly the Stack/Cluster/Table
   precedent of pinning a utility *set*; the `--column-layout-threshold` style reads follow
   Meter's `--meter-level` precedent and the spec's own justification comment. The one step
   beyond precedent, pinning the `[--column-layout-gap:…]` class form, is kept because it is the
   only observable form of "the switch and the paint read one declaration". → No change.
5. **Duplicated Code in stories** (baseline; fallow: 10 clone groups inside the stories file,
   more shared with the DefinitionList and Table stories) — kept deliberately, as the #107 and
   #108 reviews ruled: each story's source is the consumer-facing documentation autodocs shows.
   → No change.
6. **Test-side cast** — the insertion test set the search field's value through
   `as HTMLInputElement`. → **Fixed**: a `fireEvent.change`, no cast.
7. **Error classes not in the barrel** — matches all seven existing error classes. Consumers
   catch by `name`. → No change.
8. **Tool advisories** — css-token-drift on `var(--…)` arbitrary utilities (the repo-wide
   idiom, dismissed in every prior review) and cyclomatic flags on the stories' geometry
   helpers and the Keyboard play (sequential assertions, not branching logic). → Dismissed.

Checked and clean: closed prop surface on both members with `testId` mapped to `data-testid`;
no raw lengths (template-literal type plus the runtime ident guard); no library text; one
recipe per painting member, the variant-free `cva()` on Column matching `choicesGroup` and
`tableRow`; naming (full words, recipes named for their members, `TOKEN_NAME` as a
screaming constant, `isFragment`/`isColumn` as assertions); immutability (`map`, `flatMap`,
`reduce`, `Children.map` only); error classes in their own files extending `Error` with `name`
set; one barrel line, alphabetical; no sibling-component import; one `describe` with behaviour
sentences; both gap variants and every guarantee carried by a story; `architecture.md` already
lists `Arrangement/`; commits conventional with the `column-layout` scope, `#116` referenced,
body lines under 100 characters, no breaking marker.

## Spec axis

Verified by tracing the CSS mechanism rather than trusting the implementation report:

- `flex-basis` percentages resolve against the Root's content box, and the Root carries no
  padding, so the `100%` in the clamp is the brief's "available content width".
- At W ≥ T every basis is 0 and `flex-grow: <weight>` divides `W − (n − 1)g` by weight: exactly
  "subtract the gaps … divide the remaining width in proportion".
- All or none holds by construction: every Column reads the one `--column-layout-threshold` on
  the Root against the same `100%`, so the bases are identical and no column can wrap alone.
- At W = T the amplified difference is 0, basis 0, row: "at the exact boundary the horizontal
  arrangement fits". The JS-written `S / wᵢ` factor (`1.3333333333333333`) errs at ~1e-14 px.
- `min-w-0` overrides flex's `min-width: auto`, so unbreakable content never widens a track;
  overflow stays the content's contract, as the brief requires.
- The gap role is published beside the `gap` utility as `--column-layout-gap`, so the
  threshold follows `gap` in both arrangements. `em`/`ch` in a token resolve against the Root's
  inherited type and `rem` against the root, so a theme or font change moves the threshold
  with no script.
- An undeclared token makes the threshold guaranteed-invalid and `flex-basis` falls to `auto`:
  the README's "columns size from their content" is accurate (they still grow by weight).
- `Children.toArray` drops `false`/`null`/`undefined`, fragments are recursed, `Children.map`
  keeps keys, and the insertion test proves identity, focus and typed value survive.
- `--${string}` admits `'--main)'` at the type level; the runtime regex rejects it. The brief
  asks only to "constrain the token-name shape in public types", which a template literal does
  as far as TypeScript can.

Findings:

1. **A Column behind a wrapping component throws** — stricter than Tabs and Choices, whose
   providers span the whole subtree and only demand DOM adjacency. The divergence is
   deliberate: this Root must *count* its columns at render to write the threshold, so a
   wrapped column would be silently uncounted and the threshold wrong; detecting it without
   measurement needs the `Children` walk. It is documented in the TSDoc and README and tested.
   → Kept; recorded here so the maintainer accepts it consciously.
2. **Stray non-Column children** pass through as unconstrained flex items and were undocumented
   ("Document valid composition"). Tabs behaves the same, so not a convention breach.
   → **Fixed**: one `@CallerMustEnsure` bullet and a README sentence state that anything beside
   the columns renders as given, takes no weight, gap or threshold share, and breaks the
   proportions; no new throw, because the brief asks to reject weights and token names only.
3. **ShareBelowMinimum prose arithmetic** — the paragraphs said 30.75 rem / 9.25 rem; after the
   1.5 em gap the shares in 40 rem are 28.875 rem / 9.625 rem (the story's docstring already
   said 9.6). → **Fixed**.
4. **"A percentage is not a minimum"** in the README read as a mechanism fact when it is a
   caller rule (a `%` token would resolve inside `max()`). → **Fixed**: rephrased as a length
   the contract does not accept, with the reason.
5. **Nested Root inside a Column** is tested although the brief never mentions nesting. It is a
   consequence of the mechanism (the inner Root redeclares both custom properties; weight is
   per column, so nothing leaks) rather than a feature, and it is not in the out-of-scope list.
   → Kept.
6. **Test-first** is unverifiable from one squashed feature commit; the implementation report
   records the red-then-green order. → No action possible.
7. **Browser geometry is not CI-run** — the play functions assert geometry, but no Storybook
   test runner or browser-mode vitest exists in this repository (testing.md: "There is no
   browser-driver level here"), so the evidence is the manual Chrome pass below. Pre-existing
   repository gap, not introduced by #116. → Recorded as a limitation.

Acceptance criteria from the brief:

| Criterion | Status | Evidence |
| --- | --- | --- |
| Export `ColumnLayout` with `Root`/`Column`; Stack callers unchanged | Done | `src/index.ts` +1 line; no Stack file in the diff |
| 2:1, 2:1:1, top alignment, reading order, >2 columns, unequal heights, fractional weights | Done | `TableAndSummary`, `ThreeColumns`, `FractionalWeights` plays; spec "reading order"; browser pass below |
| Below / at / above the fit threshold; narrow holder on a wide viewport; two instances | Done | `FitThreshold`, `TwoHolders`; sub-pixel probe below |
| Share below minimum stacks although minimums plus gaps fit; stacked fills despite minimum | Done | `ShareBelowMinimum` |
| Zero, one, many; omission and insertion; updated weights; both gap roles | Done | spec; `ConditionalColumn`, `StackGap` |
| Theme tokens move the threshold; font-relative values; no literal-width props | Done | `ThemeMinimums`; type tests; root font probe below |
| Long text, translated labels, table/summary; no page overflow, no overlap | Done | `LongContent` (`scrollWidth` = `clientWidth`) |
| Keyboard order in both modes; focus and state survive resizing; no remount | Done | `Keyboard` play; spec insertion test |
| Tests and stories for the five named cases; test-first; real browser checks | Done, with the CI limitation in finding 7 | 32 spec tests, 11 stories, Chrome pass below |
| Formatting, lint, types, tests, package build, Storybook build; contract documented | Done | Checks below; README § ColumnLayout, TSDoc, `CONTEXT.md`, ADR 0008 amendment |
| Publish and record the released version in #195 | Deferred to human publishing | See *Implementation vs publication* |

## Browser verification (headless Chrome via Playwright, Storybook dev, 1400 px viewport)

All eleven stories were driven in both themes after the fixes: every play function reached
`finished` with no `AssertionError` on the console (22 of 22). Independently measured with
`getBoundingClientRect` at a 16 px root and a 24 px region gap:

- **2:1 in 1024 px:** 666.67 / 333.33 px, both tops at 16 px, heights 226 and 304.75 px.
  **2:1:1 in 1152 px:** 552 / 276 / 276 px, three distinct heights. **0.5:1.5 in 1024 px:**
  250 / 750 px.
- **Threshold** `24 + max(448 × 1.5, 192 × 3)` = 696 px: the 695 px holder stacked (two
  695 px tracks), the 696 px holder held 448 / 224 px, the 697 px holder 448.67 / 224.33 px.
  Probed beyond the stories: T − 0.5, − 0.1, − 0.02 and − 0.005 px all stacked; T + 0.02 px
  held the row. There is no intermediate state.
- **Two holders:** 832 px held 538.67 / 269.33 px while 384 px beside it stacked two 384 px
  tracks. **Share below minimum:** 3:1 in 640 px stacked two 640 px tracks; in 224 px both
  tracks were 224 px, below the 256 px minimum.
- **Theme minimums:** `48ch`/`12em` held 496 / 248 px in 768 px; the scope re-pointing them to
  `60ch`/`22em` stacked (768 / 768 px). With the document root set to 20 px the computed
  threshold moved from 696 px to 870 px, as `1.5em + 28rem × 1.5` at 20 px predicts.
- **Undefined token** (probed, not a story): `--main-column-min-width` unset on a 30 rem holder
  gave `flex-basis: auto` and content-sized tracks of 250.86 / 205.14 px, as the README states.
- **RTL** (probed): under `dir="rtl"` the 697 px holder still held one row at 448.67 / 224.33 px.
- **Long content:** 581.33 / 290.67 px in 896 px, the first track's right edge at or before
  the second's left, `scrollWidth` equal to `clientWidth` at 1400 px.
- **Conditional column:** one 1024 px track, then after the click two tracks at
  666.67 / 333.33 px with the table's element identical.
- **Keyboard:** Tab order search → open → search → open across the row and the stacked
  instance; shrinking the wide holder to 24 rem stacked it with the focused field keeping focus
  and its typed `jars`, and widening back kept both again.
- **Stack gap:** 8 px between the row's tracks and between the stacked lines.

Screenshots of every story in both themes were reviewed in the scratch directory and are not
committed. The a11y addon was not driven from the script; the arrangement emits no role, name
or landmark of its own, so there is nothing of its own for axe to judge.

## Checks (after `d5ed108`)

| Check | Result |
| --- | --- |
| `npm run lint` | Passed (158 files) |
| `npm run typecheck` | Passed |
| `npm run test` | Passed: 48 files, 887 tests, 32 of them ColumnLayout |
| `npm run build` | Passed; `dist/index.css` carries the `flex-basis: clamp(…)` rule, `dist/types/Arrangement/ColumnLayout/` holds the three declaration files |
| `npm run build-storybook` | Passed |
| pre-commit hook on `d5ed108` | lint, typecheck and the full suite green, at a machine load above 70 |

## Backward compatibility

Verified from the diff, not from the commit messages. `git diff 3739997...HEAD --stat` touches
the README, two reports, five new files under `src/Arrangement/ColumnLayout/` and
`src/index.ts`, where exactly one export line is added. No existing component changes; Stack,
Cluster, `src/Theme/Palette.ts`, `src/styles.css` and every `tokens*.css` are untouched, so
no token is removed or re-pointed and no required prop changes. No library token is
introduced: the minimum-width roles are the consumer's by the ADR 0008 amendment. The feature
commit carries no `!` and no `BREAKING CHANGE` footer, so semantic-release will derive a
**minor** version. The change is purely additive.

## Remaining limitations

- The geometry and focus evidence is a manual Chrome pass; nothing in CI runs the play
  functions. A Storybook test runner would be its own ticket.
- A `Column` must be a direct child of its `Root` (arrays, fragments and conditionals
  included); a column rendered through a wrapping component throws. This is tighter than Tabs
  and Choices and is the cost of writing the threshold with no measurement.
- Test-first cannot be verified from the squashed commit.

## Implementation vs publication

**Implementation** is complete on `feature/ticket-116` at `d5ed108` plus this report's commit,
reviewed on both axes with all confirmed findings fixed, and every check green. Nothing was
pushed, merged or released and no issue was closed; the ticket was moved to **In Review** on the
board, the one transition `/code-review` owns, and `Done` stays with whoever lands the work.
**Publication** is deferred to the human release: no version is claimed
here, and consumer #195 is to be updated with the version semantic-release actually publishes
once `main` carries the feature commit.
