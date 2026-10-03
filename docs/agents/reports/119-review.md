# Button game action variants and wrapping - review of #119

Date: 2026-10-03. Reviewed and fixed by an Orca worker (Claude) on branch `feature/ticket-119`,
following `.claude/skills/code-review/SKILL.md` against the fixed merge-base of the branch with
`main`, `3739997` (package 3.9.1). The two axes ran as fresh parallel sub-agents over the diff
`git diff 3739997...HEAD` of the two implementation commits, `56e7359` (feat) and `50fea80` (docs).
Nothing was pushed, merged, published or versioned, and the issue was not closed or moved to Done.
Implementation and publication are recorded separately at the end.

## Sources

- [#119](https://github.com/juwel-development/LIB-design-system/issues/119), the issue body and
  its one comment: the maintainer-approved **Agent Brief**, which states it supersedes the body.
  The same brief is on `main` as `docs/agents/reports/119-agent-brief.md` from `227eb68`
  (byte-identical to the comment but for a blank line); this branch was cut from `3739997`, one
  commit earlier, which is why the first pass found no brief locally. The implementation report
  `119-button-implementation.md` records that it was built against the body alone.
- `docs/agents/standards/{coding,architecture,testing,design-system-components}.md`, `CONTEXT.md`,
  ADR 0008 (role-based props), ADR 0011 (status tones), ADR 0002 (focus ring),
  `.out-of-scope/control-boundary-independent-of-fill.md`, `.out-of-scope/focus-boundary-reinforcement.md`,
  the #114 brief (`plain` variant), and the consumer ticket juwel-dev/g-label-manager #195.
- `npm run fallow:agent -- --base 3739997` for reading order and blast radius: two units,
  `Button.tsx` (12 importers via the barrel) and `Palette.ts` (4 importers).

## Standards

Verbatim from the Standards sub-agent, lightly cleaned.

**Hard violations (documented standards)**

1. **Comment budget** - `coding.md` § Comments ("file header of at most 6 lines").
   `Button.tsx:6-21` - the header block is 16 lines; it was 10 at the merge-base, so this extends an
   existing breach by 6 (the `text-nowrap` note). The content is load-bearing, but over budget means
   reduce. Every other new block stays within 4. `Palette.ts:123-126` is TSDoc on an exported field,
   exempt as API documentation.
2. **"Never assert on the class string"** - `testing.md` § Querying. Every new styling test in
   `Button.spec.tsx:262-447` reads `.className`. The merge-base spec already does this in ~20 tests,
   so this **extends an existing deviation, not a new one**. The clearest cases of pinning
   implementation rather than behaviour: `:380-392` (`min-w-0`, `px-3`) and `:420-427`.
3. **"Cite the standard, never restate it"** - `coding.md` § Comments. The 4.11:1 / symmetric-contrast
   argument is written out five times (`Button.tsx:38-40`, `Button.spec.tsx:289-292`,
   `Palette.ts:123-126`, `Palette.spec.ts:246-248`, ADR 0011 `:71-79`). The ADR is the canonical home.

**Not violations (checked):** a story importing a sibling component (20+ existing stories do);
`| null` in the variant type (inherited from `VariantProps`, which the component standard mandates,
and already present at the merge-base - though the new test *pins* `null` into the contract);
`compoundVariants` for `inline × variant` (genuine cross-variant case, precedent in `Stack.tsx`);
German demo wording in stories; the `NOTE:` footer of `56e7359` (compliant); import ordering
(tooling-enforced).

**Baseline smells (judgement calls):** Duplicated Code - the five-item variant list repeated 11×
in the spec (pre-existing pattern, extended); Duplicated Code - the `variants.map` row repeated in
four stories (not worth a helper in a stories file); a redundant assertion in `Palette.spec.ts:249-254`
(`≥3` after `≥4.5` on the same pair); `LongLabelsInActionsRow` the one new story without a doc comment.

Standards: 3 hard findings (two extend pre-existing deviations), 4 judgement calls. Worst: the
header comment over budget.

## Spec

Verbatim from the Spec sub-agent, lightly cleaned. Measured against the Agent Brief first, the body
second. Baseline facts it established: `plain` is not on `main`; `.out-of-scope/` was untouched on
the branch; dark `secondary`/`surface` = 4.36:1; light `error`/`surface` = 4.50:1.

**(a) Missing or partial**

1. **Variant name.** Brief: "`Button.variant` adds `outlined` and `destructive`". Shipped `outline`
   everywhere, and `CONTEXT.md` even listed "Outlined button" under *Avoid*.
2. **Outlined colours.** Brief: "secondary-coloured text and border on an unfilled surface". Shipped
   `border-control-border … text-foreground`. Implementing the brief literally needs a dark
   `secondary` lift (4.36:1 < 4.5:1), a palette value patch rather than a contract change.
3. **Destructive is outlined, not filled.** Brief: "one filled variant using the error role as fill
   with a dedicated contrasting text/ink role … Extend the theme token contract with contrasting ink
   for the error fill." Shipped `border-error bg-transparent text-error` with the fill on hover and no
   token. The report's reason - a required `PaletteTokens` member is a migration - is contradicted by
   the `scrim` precedent (`7869330`, a `feat:` minor with a `NOTE:` footer).
4. **No shrink below the floor.** Brief: "All four can shrink below that minimum when the containing
   space is narrower … Button sizing must not force horizontal overflow where its content can wrap."
   `min-w-[var(--control-min-width)]` is a hard floor: in an 8rem holder the button stays 168px and
   overflows. No story went below 10.5rem, so the brief's own case was unexercised.
5. **Positional constraint tests.** Only `error`/`surface` was added. Missing per brief: outlined text
   vs surface, destructive ink vs its fill (no ink token existed), outlined hover.
6. **Forced colours** not exercised (brief: "Exercise light, dark and forced-colors").
7. **Prior rejection not reconciled.** `.out-of-scope/control-boundary-independent-of-fill.md` still
   said "no variant that trades the fill for an outline".
8. **Icon+text composition** story absent (brief: "text composed with an icon").

**(b) Not asked for**

1. **`inline` prop** (`Button.tsx:44-63`, spec, four stories, README, `CONTEXT.md` **Inline fit**).
   Brief out-of-scope: "Additional content-sizing APIs"; "Do not … introduce another inline or
   content-sizing API here"; "No consumer style, arbitrary DOM-prop, size or tone escape hatch is
   added." The ADR 0008 structural argument does not override an explicit exclusion.
2. `text-balance` - presentational extra; defensible as an implementation detail, minor.

**(c) Implemented but wrong / docs contradict brief**

1. ADR 0011 Amendments and `Palette.ts` recorded that `errorForeground` was *refused* - the opposite
   of the brief's required ink role.
2. README and `CONTEXT.md` described destructive as outlined-then-filled and outline as
   `controlBorder`/`foreground` - both contrary to the brief.
3. Brief: "Outlined and destructive share primary/secondary ordinary sizing." The README admitted
   they were two pixels taller than a filled one (border added without inset compensation).
4. README "Long labels": "growing the button instead of running past its edge" was true only above
   10.5rem.

**Breaking-change assessment (sub-agent):** nothing on the branch is released; `main` has
`primary|secondary|ghost` and no `inline`. Renaming `outline`, removing `inline`, recolouring
outlined and filling destructive are **not** consumer-facing breaks. A required
`PaletteTokens.errorForeground` would be visible to palette-object authors.

Spec: 8 missing/partial, 2 unrequested, 4 wrong-or-contradicting. Worst: the destructive variant
and the token contract built against the superseded body instead of the approved brief.

## Coordinator direction received during the review

Two messages arrived through the Orca run and were applied as part of the fixes:

1. The approved brief is mandatory: rename to `outlined` with `secondary` text and edge; destructive
   **filled** at rest with `error` plus a dedicated ink; **remove** `inline`; all four faced variants
   shrink below the ordinary minimum when constrained; wrap icon+text and long unbroken words with no
   overflow; respect #114's `plain` and do not duplicate it; **add the ink token compatibly, without
   new required exported interface members**; reconcile ADR/docs to the brief; verify in a browser
   including hover and forced colours; do not treat the first report's limitations as waivers.
2. Components must **not** be documented in the README: move the branch's new component
   documentation into the component's Storybook docs and leave the README without it.

## Fixes applied

Every confirmed finding above was fixed. Grouped by commit; each commit passed the pre-commit hook
(lint, typecheck, full suite) and commitlint.

**Theme - `cd7c922` `feat(theme): add the error fill's hover and ink roles and lift the dark secondary (#119)`**

- `PaletteTokens` gains `errorHover?` and `errorForeground?` as **optional** members (coordinator
  constraint), complete in both shipped sets, which are now typed `Required<PaletteTokens>`;
  `renderTokens` takes the complete type. Rendered as `--color-error-hover` / `--color-error-foreground`
  in all three generated stylesheets (`npm run build:tokens`). Light ink is pure white because the
  shipped `error` sits on the floor against white (4.501:1) and slate-50 measures 4.30:1; dark ink is
  slate-950 as `primaryForeground`'s. Hover: pink-700 light, pink-100 dark.
- Dark `secondary` sky-600 → sky-500 and `secondaryHover` sky-500 → sky-400, because the outlined
  variant makes `secondary` text and 4.36:1 fails the 4.5:1 floor the brief requires in both themes.
  Light unchanged. Shipped as a palette value change with a `NOTE:` footer, per the ADR 0011 and #93
  precedent (values are not the contract, names are).
- `Palette.spec.ts`: `secondary` ≥4.5:1 vs `surface` and vs `backing` (outlined text at rest and on
  its hover tint); `error`/`errorHover` ≥3:1 vs `surface`; `errorForeground` ≥4.5:1 vs both fills;
  dark fills step lighter on hover (new test), light darker (extended). The redundant `≥3 after ≥4.5`
  assertion (Standards smell) is gone.
- ADR 0011 Amendments rewritten: `error` gains a fill carrier **and** two companion roles; the
  `surface`-read-backwards argument is recorded as considered and rejected; the `warningForeground`
  rejection is explicitly not re-opened; the dark `secondary` move is recorded.

**Button - `f6492b7` `feat(button): ship the approved #119 contract - outlined, filled destructive, yielding floor`**

- `outline` → **`outlined`**: `border-secondary text-secondary bg-transparent`, `hover:bg-backing`
  keeping the edge, disabled `border-disabled text-muted` with no fill. The inset gives the edge's
  pixel back (`py-[calc(0.5rem_-_1px)]`, `px-[calc(1rem_-_1px)]`, `sm:px-[calc(1.5rem_-_1px)]`), so
  the outlined button is exactly a filled one's height (Spec c3).
- **`destructive` filled**: `bg-error text-error-foreground hover:bg-error-hover`, disabled like
  every filled variant. No edge, no inversion.
- **`inline` removed** entirely: prop, `compoundVariants`, both empty `inline` variants, stories,
  tests, docs. The vertical padding moved from the base into the variants so outlined can own its
  compensated value without a same-property conflict.
- **Floor yields**: `min-w-[min(var(--control-min-width),100%)]` on the four faced variants. A button
  in a holder narrower than 10.5rem shrinks to it and wraps. Measured limit, documented in the
  recipe, the Storybook docs and below: a holder sized to its own content gives the percentage
  nothing to resolve against, so there the floor does not apply.
- **No overflow for a long unbroken word**: `wrap-anywhere` (coordinator direction; the brief's
  "long unbroken labels must remain readable" and "must not force horizontal overflow"). `break-word`
  cannot lower an inline-flex button's min-content width, which is why the first pass measured it as
  a no-op. `text-balance` kept.
- **Forced colours**: the filled variants add `forced-colors:border`. Measured before the fix: under
  `forced-colors: active` Chrome forced the fill to `ButtonFace` and the border width stayed 0 from
  preflight, so a filled button had no visible boundary at all - a pre-existing gap on `main` that the
  brief's forced-colours check surfaces. Outlined already has its edge; ghost stays a text action.
- Header comment reduced to the budget's shape (ADR citations in one line each, the one load-bearing
  wrapping fact kept); the contrast argument now lives in ADR 0011 and is cited, not restated.
- `Button.spec.tsx`: module-scope `variants`/`faced` lists (Standards smell); closed prop surface
  without `inline`; outlined colours, hover and height compensation; destructive fill/ink/hover;
  unfilled disabled on outlined, filled disabled on the other four; the yielding floor; forced-colours
  boundary on the filled three and absent on outlined/ghost; icon+label composition named by the
  words; every variant defaults to `type="button"`; wrapping with `wrap-anywhere` and nothing
  clipping. 91 tests (was 89), all behaviour-first where jsdom can observe it; the recipe-class
  assertions stay in the file's established token-contract style and the standards deviation is
  recorded here rather than widened.
- Stories: `Outlined`, `Destructive`, `DestructiveSymbolOnly` (icon + `ariaLabel`), `WithIcon` (text
  composed with an icon on three variants), `ActionVariants`, `LongLabels` (14rem), **`NarrowHolder`**
  (8rem, narrower than the floor), **`NarrowGrid`** (two columns in 16rem), **`LongUnbrokenWord`**
  (9rem), `LongLabelsInActionsRow` (single-line 22rem row), `KeyboardFocus` (play tabs to the first),
  `DisabledVariants`. `Inline` and `InlineBesideField` removed. One `everyVariant` helper replaces the
  four duplicated rows. Meta layout `padded` rather than `centered`, with the reason in a comment.
- Documentation: the component guidance (variant selection, token constraints table, automatic
  wrapping, shared sizing and its holder rule, consumer-owned destructive wording, forced colours) is
  in **`Button.stories.tsx` → `parameters.docs.description.component`**, rendered on the Storybook
  *Interaction/Button → Docs* page; verified present in the running Storybook. The README `## Button`
  section is removed (README is back to its merge-base content). `CONTEXT.md`: **Destructive action**
  (filled, not a tone prop) and **Outlined action** (secondary text and edge, the one opt-in edge);
  **Inline fit** removed. `.out-of-scope/control-boundary-independent-of-fill.md` gains a header note
  and an Amendments section recording the maintainer's narrowing: an opt-in unfilled variant is
  accepted as `outlined`, the rejection of an edge on filled buttons and of a `bordered` prop stands,
  and the consumer override's `min-width: 0` half is now answered by the yielding floor.

**Docs - `docs(button): record the #119 review, fixes and browser evidence`** - this report, and a
superseded-in-part note at the top of `119-button-implementation.md`.

## Acceptance criteria, brief by brief

| Brief criterion | Evidence |
| --- | --- |
| Outlined visibly bounded, secondary text and border, unfilled; filled variants receive no visible border; focus changes only the ring | Browser: `1px solid rgb(3,105,161)` / `rgb(14,165,233)` edge and matching text, transparent fill; primary/secondary/destructive `0px` border in both themes; on focus each variant shows `outline solid 3px 2px focusRing` with fill and edge unchanged |
| Destructive a standalone filled variant, error + dedicated ink; no tone prop or combinations | `variant` union is five values; `bg-error text-error-foreground`; browser `rgb(214,51,132)`/white and `rgb(244,143,177)`/`rgb(2,6,23)` |
| Token constraints documented and tested in both themes incl. hover; 4.5:1 text, 3:1 boundaries/fills; existing status-tone and Meter constraints kept | `Palette.spec.ts` (925 tests green); browser-measured: light outlined text/edge 5.93, on hover tint 5.42, destructive ink 4.50 rest / 6.04 hover, fill 4.50 / 6.04 vs surface; dark 6.44, 5.28, 9.04 / 12.50, 8.00 / 11.06. Status-tone and depletion tests unchanged and green |
| Long labels wrap everywhere; text alone and with icon; narrow flex/grid; container narrower than the minimum; no forced overflow; unbroken labels readable; no fixed height clips | `NarrowHolder` 128px buttons, 5 lines, holder/page overflow 0; `NarrowGrid` 124px columns, 2-5 lines, overflow 0; `LongUnbrokenWord` 144px, 4 lines, overflow 0, text inside the content box; `LongLabels` 224px, 4 lines; `LongLabelsInActionsRow` both shrink to ~170px and wrap on 3 lines, row overflow 0; `WithIcon` one line, name from the words; heights grow with lines (41.5 → 92.5 → 118 → 143.5px) |
| Outlined and destructive share primary/secondary sizing; all four shrink; padding preserved; ghost/plain untouched | All four 168 × 41.5px at rest, inset 24px (outlined 23 + 1 edge), `min-width: min(168px, 100%)`; ghost 59.3px, `min-width: 0`, unchanged classes; `plain` not on `main`, not duplicated |
| Pointer/keyboard activation unchanged; disabled cannot activate and is distinguishable; disabled outlined stays unfilled; icon-only names; default type button | Spec: emission on click, none while disabled on all five, `type="button"` default on all five, `ariaLabel` names; browser: disabled fills `rgb(148,163,184)` / `rgb(71,85,105)`, outlined disabled transparent with `disabled` edge and `muted` ink, hover on disabled destructive stays `disabledHover`, `cursor: not-allowed` |
| Tests and stories for all variants, translated labels, constrained widths, disabled, keyboard focus; browser verification incl. light, dark, forced colours | 91 Button tests, 14 Button stories, Playwright evidence in both themes and under `forced-colors: active` (below) |
| Public documentation updated; prior boundary rejection reconciled, filled-border prohibition retained | Storybook docs description, `CONTEXT.md`, ADR 0011, `.out-of-scope/control-boundary-independent-of-fill.md` Amendments |
| Lint, typecheck, tests, library build, Storybook build | All green, table below |
| Publish and record the version in #195 | **Not done - deferred to the human publisher.** See *Publication* |

## Checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 153 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 47 files, 925 tests (91 Button, +5 Palette net) |
| `npm run build` | Passed; `dist/types/Interaction/Button/Button.d.ts` carries the five-value `variant` and no `inline`; `dist/types/Theme/Palette.d.ts` carries `errorHover?` and `errorForeground?` |
| `npm run build-storybook` | Passed |
| pre-commit hook (lint, typecheck, suite) and commitlint | Green on each commit |

## Browser evidence

Playwright 1.63 installed in the session scratchpad driving the installed Google Chrome
(`channel: 'chrome'`, headless) against `storybook dev` on port 6119, one isolated context per
theme, `emulateMedia({ forcedColors: 'active' })` for the forced-colours pass. Facts read with
`getComputedStyle`, `getBoundingClientRect`, `scrollWidth - clientWidth` on button, holder and
document, and a `Range` over the label for "text inside the content box". Screenshots kept in the
scratchpad only. Colours below are light / dark.

- **Rest.** primary `rgb(124,58,237)` / `rgb(139,92,246)`; secondary `rgb(3,105,161)` /
  `rgb(14,165,233)` (the dark value is the lifted sky-500); outlined transparent with
  `1px solid` edge and text in `secondary`; destructive `rgb(214,51,132)` / `rgb(244,143,177)` fill
  with `rgb(255,255,255)` / `rgb(2,6,23)` ink; ghost transparent, `foreground` text. All five
  41.5px tall; the four faced 168px wide, ghost 59.3px.
- **Hover.** outlined fills `backing` `rgb(241,245,249)` / `rgb(30,41,59)` and keeps edge and text;
  destructive `rgb(190,24,93)` / `rgb(248,187,208)` with the ink unchanged; primary/secondary their
  hover roles. Widths unchanged.
- **Focus.** Tabbing through `KeyboardFocus`: each variant in turn is `document.activeElement` with
  `outline-style: solid`, `3px`, `2px` offset, `rgb(71,85,105)` / `rgb(203,213,225)`; fill and edge
  hold still. At rest `outline-style: none`.
- **Disabled.** As in the table above; `cursor: not-allowed` on all five.
- **Geometry.** As in the table above. Standalone `Default` 168 × 41.5px in the padded canvas - the
  same as before #119 - and `DestructiveSymbolOnly` 168 × 33px (icon only).
- **Forced colours** (both themes). Filled variants: `ButtonFace` fill, `ButtonText` ink, and now a
  `1px solid` boundary (height 43.5px in this mode only); outlined `1px solid` edge; ghost no edge;
  disabled text and edges in `GrayText`; focus ring `solid 3px` in the platform highlight.

## Compatibility

Checked against `main`, not inferred from commit types.

- **Public API**: `Button` keeps `children`, `onClick$`, `disabled`, `testId`, `ariaLabel`, `type`,
  `variant`; `primary` remains the default; `primary`, `secondary`, `ghost` keep their names and their
  rendered classes except the two agreed changes below. `outlined` and `destructive` are additions.
  `inline` never shipped. `src/index.ts` is untouched. `PaletteTokens` gains two **optional**
  members; `light`/`dark` narrow to `Required<PaletteTokens>`, which is assignable to the old type.
  No token removed or renamed, no required prop changed, no `BREAKING CHANGE` marker.
- **Behaviour changes to existing variants, each carried by a `NOTE:` footer**: labels wrap instead
  of `text-nowrap` (from `56e7359`); a word wider than its button breaks inside the word; the floor
  yields to a narrower holder and does not apply in a content-sized holder; filled variants draw a
  boundary under forced colours only; dark `secondary`/`secondaryHover` one ramp step lighter.
- **Consumer theme objects**: a `PaletteTokens` literal without the two new roles compiles; the
  generated stylesheet carries defaults. A CSS theme that re-points `--color-error` should re-point
  `--color-error-hover` and `--color-error-foreground` too, as `primary` already requires of its ink.

## Limitations

- **Content-sized holders.** `min-width: min(var(--control-min-width), 100%)` is the one CSS form
  that lets a floor yield to a narrower holder; the percentage is cyclic in a holder sized to its own
  content (an `auto` grid track, a table cell, an inline wrapper, Storybook's centered canvas), where
  it resolves to the content width and the floor does not apply. In the library's own composables
  buttons sit as direct flex items of block-level rows, where the floor holds. Documented in the
  recipe, the Storybook docs and the `NOTE:` footer. The alternative - a hard floor - fails the
  brief's shrink requirement.
- **Browser evidence is Chrome only**; forced colours were emulated, not a Windows High Contrast
  session. `text-wrap: balance` and `overflow-wrap: anywhere` fall back to normal wrapping where
  unsupported.
- **Recipe-class assertions** remain in `Button.spec.tsx`, in the file's pre-existing
  token-contract style; the testing standard's "never assert on the class string" rule stays a
  known deviation of this file rather than being widened or resolved here.
- **Changelog shape.** The branch now carries `56e7359` (first pass) and the two fixing feats
  `cd7c922` and `f6492b7`;
  the first subject names `outline` and `inline fit`, which no longer exist. Squashing the branch at
  merge, or landing it as is and accepting the two entries, is the coordinator's call.
- **#114 coexistence**: `plain` is not on `main`; both branches edit the `variant` map and
  `argTypes.variant.options`, so whichever merges second resolves a small conflict.

## Publication

**Not performed and not to be inferred from this report.** No release was run, no version exists for
this work, and nothing was recorded in juwel-dev/g-label-manager #195. The branch is ready for the
coordinator's merge decision; the human publisher runs the normal release and records the actual
released version in #195.

## Main integration

Combined with #114 plain actions and #120 typography. The shared face uses `font-control`; plain
retains inherited typography, zero padding and no face, with wrapping constrained to its holder.
Both sets of tests and Storybook guidance are preserved; README contains no component documentation.
The dark secondary adjustment is accepted to satisfy the approved outlined-text contrast floor.
The documented yielding minimum in content-sized holders is accepted as part of constrained sizing.
Build, lint, typecheck, all 1,178 tests and Storybook build pass. Chrome checks on combined main
confirm plain typography in three themes, Table sorting/selection/nested actions, and FieldRow
alignment, real multi-line actions, no horizontal overflow, retained input values and focus through
1440/800/360px resizing. The #118 integration gap is resolved. Publication remains pending.

The shared constrained-width stories now include all six variants, including plain. Chrome confirms
all six wrap inside 8rem holders and wrap unbroken words inside 9rem holders with zero horizontal
overflow; plain retains zero padding. The combined Storybook build passes.
