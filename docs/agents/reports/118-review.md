# Review: #118 FieldRow (feature/ticket-118, 3739997…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 3739997...HEAD` (the merge-base with `main`; commits `c83ceb5` and `0321247`), with
issue [#118](https://github.com/juwel-development/LIB-design-system/issues/118), its approved
Agent Brief (the triage comment, which supersedes the body's open choice between extending
`Cluster` and a separate arrangement), ADR 0008's #118 amendment, `CONTEXT.md`'s **FieldRow**
entry and consumer [g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195)
as spec sources, and `docs/agents/standards/` (coding, architecture, testing,
design-system-components) plus the Fowler smell baseline as standards sources.
`npm run fallow:agent -- --base 3739997` gave the reading order. Findings were verified by hand
against the files and in a real browser, and the confirmed ones fixed on this branch. The issue
had no comments beyond the brief when re-read before settling. Date: 2026-10-03; reviewer: an
Orca worker (Claude Fable 5.1), separate from the implementer.

**Scope held.** Only #118 was worked. #119–#125 were not incorporated as dependencies; where the
brief's "buttons with wrapping text" meets `Button`'s current `text-nowrap`, that is recorded
below as pending verification once #119 integrates, not as an accepted limitation.

## Standards axis

Hard findings (documented standards):

1. **`IControlEdge` shared a file with `alignControlEdges`** (coding.md › Interfaces and types:
   "One export per file, named after it"; "Interfaces and enums that are not props live in their
   own files"). It was the repository's only exported non-props interface not in its own file.
   **Confirmed, fixed**: moved to `IControlEdge.ts`; both importers updated.
2. **A literal `null` of the component's own** (coding.md › Absence: "`undefined`, never `null`")
   in `labelledControl`. **Confirmed, fixed**: an early `undefined` return; the remaining `null`
   comparisons are against what DOM APIs return.
3. **Abbreviation `rect`** (coding.md › Naming: "No abbreviations — full words") as `contentRect`
   in the component and the spec's `rect` factory. **Confirmed, fixed**: `contentBounds` and
   `bounds`.

Judgement calls, applied:

4. **Partial recipe on `Field`** — the static `flex-shrink: 1; flex-basis: 0%` sat in the inline
   style beside the two caller-chosen values. design-system-components.md › Compound components:
   "One recipe per painting member." **Applied**: `fieldRowField = cva('shrink basis-0')`; only
   the weight and the token-named minimum stay on `style`, which ADR 0008's #118 amendment
   authorizes. Browser geometry is identical before and after (`basis-0` and `0%` resolve alike).
5. **Test-only DOM** — `data-field-row-content` was emitted by the component and read only by the
   spec (Speculative Generality). **Applied**: attribute dropped; the spec's geometry stub
   recognises the content box as the item's child.
6. **Duplicated geometry stub** — the positioned-box test re-implemented `stubGeometry` with one
   extra branch (Duplicated Code). **Applied**: `stubGeometry` takes an optional
   `positionedBoxBottom`; the test states its geometry in one object.
7. **Members re-align on every member render as well as on every Root render.** The member
   effect earns its place only for a member re-rendered on its own, from a consumer's state.
   **Applied**: a one-line comment says so; the effect stays.

Judgement calls, left as they are:

8. **Class-string assertions in the spec** (testing.md › Querying: "Never assert on the class
   string") for `flex-none`, the gap utilities, `flex-wrap`, and now `basis-0`/`shrink`.
   `Cluster.spec.tsx` establishes the identical pattern for the same reason - jsdom lays nothing
   out, so a gap or basis has no observable behaviour there - and the browser evidence below is
   where the behaviour is proven. Left, as the precedent is.
9. **Inline `style` on `Field`** for the weight and the `min()` of the named token: ADR 0008's
   #118 amendment authorizes exactly these two caller-chosen values, and `Meter` is precedent for
   one dynamic `style`.
10. **`alignControlEdges` scans `rows` three times** - cosmetic; the arrays are the row count.
11. **fallow's clone report on the stories** - `Default`, `Weighted` and `Narrow` repeat the same
    three fields; each story is read on its own as documentation, as in #107 and #111.

Suppressed by a documented decision or precedent: four exports in `FieldRow.tsx` (per-member
props interfaces in the one module, as `Dialog`); hooks in `Root` (a genuine effect) and the
context + `*CompositionError` shape in the members (as `Tabs`, `Choices`); the custom error
classes (as `DialogCompositionError`); comment budget (every block ≤ 4 lines, the spec's
geometry note ≤ 6 as its header).

## Spec axis

Confirmed by reading and in the browser, then fixed:

1. **A label that grows while a message below the control goes left the row misaligned.** The
   observer watched only each item's content wrapper, so a re-render that changed a control's
   edge without changing the content's height - and re-rendered neither `Root` nor the `Field` -
   was never re-measured (brief: "Recalculate for … labels and messages as necessary"; the
   implementation report had recorded this as a limitation). **Fixed**: `Root` now observes each
   field's own `label[for]` as well as its content. Test first (`observes the label as well as
   the content…`, red before the change). Browser: on `HintsAndErrors`, with the first field's
   content box frozen at its height so the content observer could not fire, growing its label
   from one line to three moved every control and both buttons from 93 to 144 and re-padded the
   other three items 51 / 54.5 / 86.5.
2. **Weights once a field freezes at its minimum.** Flex redistributes the remainder among the
   unfrozen fields by weight, so a 2 : 1 : 1 row with the last field clamped shares the rest
   2 : 1 - the intended reading of "minimum widths govern when items wrap", but undocumented.
   **Fixed** in the README and the `@Guarantees` TSDoc: "a field whose share would fall below
   its minimum keeps the minimum, and the others share the rest by weight."

Confirmed correct: the MultiSelect boundary (`label for` → the `absolute inset-0` trigger, whose
`relative` field box `controlBox` returns - the border is the aligned edge); row grouping by item
top is independent of the padding the pass writes, because `items-start` fixes the top and the
edge is measured from the content's top; a Root holding a `Field` always sees a content resize
on a holder-width change, because every field grows from a zero basis; SSR-safe (React 19
`useLayoutEffect`, `ResizeObserver` guarded); no form, landmark or wording of the library's own;
the implementation and publication reported separately, with no version invented.

Partial by construction, recorded:

3. **"Real browser geometry confirms … buttons with wrapping text"** cannot be demonstrated with
   the library's `Button`, which carries `text-nowrap`. The arrangement handles a taller action
   group by construction (`items-end` inside the group; a wrapped group's bottom is the row's
   edge - `Narrow` at 24rem shows two stacked buttons aligning the row at 294). **Pending**:
   re-run the `Narrow` and `AllFieldTypes` geometry once #119's wrapping `Button` integrates.
   The TSDoc guideline no longer states that a `Button` never wraps.
4. **"Action text must remain readable at narrow widths"** holds down to one `Button`'s own
   `--control-min-width`; below that the holder overflows by `Button`'s contract, not the
   arrangement's.
5. **The unlabelled-child fallback** (a `Field` whose child labels nothing aligns on its box
   bottom) goes beyond "wraps one existing labelled field". Kept: `measure` needs an answer for
   that child either way, the box bottom is the honest one, and `@CallerMustEnsure` already
   states the one-labelled-field rule.

## Fixes

All on `feature/ticket-118`, after the two implementation commits:

- `fix(field-row)`: the label observation (Spec 1), the weight-clamp documentation (Spec 2),
  the neutral wording guideline (Spec 3), and the Standards fixes 1–7. Files:
  `FieldRow.tsx`, `FieldRow.spec.tsx`, `alignControlEdges.ts`, new `IControlEdge.ts`,
  `README.md`, and an amendment note in `118-fieldrow-implementation.md`.
- `docs(field-row)`: this report.

The exact commit hashes are in `git log 3739997..HEAD`.

## Checks

| Check | Result |
|---|---|
| `npm run lint` | green |
| `npm run typecheck` | green |
| `npm run test` | 49 files, 897 tests green (896 before the review; FieldRow 42 of them) |
| `npm run build` | green (components + types) |
| `npm run build-storybook` | green; `storybook-static` removed afterwards |
| `npm run fallow:agent -- --base 3739997` | reading order and the clone note above; no dead code |

System load was ~90 throughout; the suite still ran in under 10 s.

## Browser evidence

Both browser MCPs were unavailable (the DevTools profile is locked by another session), so
verification used Playwright in the scratchpad driving the installed Chrome headless against
`storybook dev` on port 6118, reading `getBoundingClientRect` in each story's own iframe. Run
before and after the fixes with identical geometry; rounded pixels, viewport 1200 unless stated:

- **AllFieldTypes**: Input, NumberInput, Select, MultiSelect and TextArea controls all at
  145.5, paddings 52.5 / 52.5 / 56 / 50.8 / 0 with the TextArea defining the line; MultiSelect's
  trigger at 144.5 inside its border at 145.5. The actions (344 wide) wrapped below as one
  group, both bottoms at 195. Identical after resizing 700 → 420 → 1200.
- **WrappedLabels** (44rem holder): labels 25.5 / 76.5 / 25.5 high, all three controls at 161,
  no frame or page overflow.
- **HintsAndErrors**: hint, error and optional marker on different fields; every control and
  both buttons at 93 while field boxes reach 123.5 - messages added no padding.
- **Weighted** 3 : 1 : 1: 480 / 160 / 160 from the 800 left after the actions' 344 and three
  gaps - exact, before and after the `basis-0` recipe.
- **Narrow** 40 → 24 → 20 → 16 → 13rem: three fields then the actions; one field alone, two at
  171 aligned at 195, the buttons wrapped inside the group (244.5 / 294); then one item per row;
  no overflow at any width.
- **AloneBelowMinimum**: 190 = the 14rem holder's content width, no overflow.
- **Default** at 1200 / 700 / 360: actions padded 35.5 on one row; below as a group; one item
  per row with the buttons stacked; no page overflow.
- **ConditionalField**: a typed value survives the region field being taken in (992 → 656 +
  328) and out again; Tab from the search input reaches the select, then the button.
- **Focus and identity**: two values typed, focus on the second, viewport 700 → 420 → 1200:
  same mounted input element, both values kept, focus kept, `outline-style: solid`, no clipping
  ancestor between control and body (the `WrappedLabels` frame's `overflow: auto` is the
  story's holder, padded 1rem clear of the ring).
- **Label-only growth** (the Spec 1 fix): described above - every item re-aligned.
- Console: no errors from the arrangement; one unrelated Storybook asset 404.

## Compatibility

Additive only, verified against the merge-base: `src/index.ts` gains one export line; `README.md`
gains one section; no change to `Theme/`, `tokens.css`, `styles.css`, `Cluster`, `Stack`, the
five field components, `Button` or any existing spec. No token removed or renamed, no required
prop changed, no default changed. Commit types are `feat`, `fix` and `docs` with no `!` and no
`BREAKING CHANGE` footer; the release this branch implies is a minor.

## Acceptance

Against the brief's criteria: compound API exported and documented ✓; browser geometry for all
five field types, mixed heights, short and wrapped labels, markers, hints, errors ✓ (wrapped
button text pending #119, above); weighted allocation, progressive wrapping, minimum transitions,
alone-below-minimum, actions moving together and wrapping internally ✓; no page-wide overflow,
overlap or clipped focus ✓; values, focus, associations and order preserved through resize and
content change, conditional and single fields ✓; tests and stories ✓, test-first for the one
behaviour change here ✓; lint, typecheck, tests, build, Storybook build ✓; vocabulary and ADR
consistent (no change needed) ✓.

## Publication - pending

**Implementation is complete and reviewed on `feature/ticket-118`; nothing is published.** No
version has been released for this feature and none is named here. The human publishing step
lands the branch, lets semantic-release derive the version, and records that version in
[g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195). The board
transition this review owns is **In Review**; **Done** belongs to whoever lands the work.

## Final integration with #119

The pending wrapped-Button acceptance is now verified on combined main. Headless Chrome exercised
`AllFieldTypes` and `Narrow` at 1440, 800 and 360px with a long translated action label. The action
actually grew to four text lines (118px including preserved padding), without button or FieldRow
horizontal overflow. Controls sharing a row retained equal bottom edges; the entered input value
and its focus survived every resize. This resolves the pending checks in Spec items 3–4 above.
