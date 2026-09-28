# Review: #110 MultiSelect (feature/ticket-110, 482e195…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 482e195...HEAD` (commits `23c396c`, `62b67ee`), with issue #110's approved Agent Brief
(the repo copy matches the issue comment verbatim) as the spec source, alongside the four
standards documents and `npm run fallow:agent`. Every finding was verified by hand before it was
applied or dismissed; fixes were driven test-first and the paint was re-inspected in a real Chrome
against the running Storybook, in both themes, after the styling refactor.

## Standards axis

Hard findings (documented standards):

1. **Root's styling lived outside its recipe** (design-system-components.md §4: the recipe is
   the only source of classes; a compound member styles what it owns through its one recipe) —
   Root had one `cva()` for the label and hint but painted the field, trigger, clip, track, chip,
   count, icon buttons and surface through nine module-level literal strings, plus a hand-composed
   `` `${COUNT} invisible absolute` `` class, which is the class merging §4 says has nothing to
   merge. No other component binds `className` to a non-recipe constant. → **Fixed**: one
   `multiSelectRoot` recipe keyed by a `part` variant (`root` by default, `field`, `trigger`,
   `clip`, `track`, `chip`, `count`, `countMeasure`, `iconButton`, `surface`); every element
   binds `multiSelectRoot({ part })`. `Option` keeps its own recipe; its two inner spans keep
   inline literals under the Choices precedent.
2. **Rules-heavy logic inline in the component** (coding.md § React: display logic only;
   anything with rules of its own lives in a function the component calls) — the ordered,
   deduplicated proposal and the three-way focus fallback were inlined in Root. → **Fixed**:
   `proposeSelection(options, next)` (pure), `isSettled(request)` and
   `focusFor(request, root, trigger, surface)` at module scope; the focus effect now only reads,
   clears and applies.

Verified clean: the three `biome-ignore` suppressions each carry a justification and follow the
Choices precedent; props interfaces stay in the module and the barrel gains one line; no
user-visible English; `undefined` never `null`; comment blocks within budget; specs query by role
with no `toHaveClass` or `getByTestId`; the stubbed `getBoundingClientRect` and hand-driven
`ResizeObserver` are genuine jsdom-layout boundaries; every listed state has a story.

Baseline smells (judgement calls), all left as they are: the contract-type/context/`use…Contract`
shape duplicated from Choices and the `describedBy` shape from Select are per-directory copies
the architecture standard endorses; the four wording props travel together, but the closed flat
prop surface wins over a bundle; `{label}`/`{count}` templates are the brief's documented closed
wording contract; `attach` and `relayout` are short and read in context.

## Spec axis

Verified correct by tracing code and tests: one `MultiSelect` barrel entry of `Root` and
`Option`; required label and caller-owned wording with English and German README examples;
`selected$` observed in a layout effect, reset on replacement, torn down on unmount, never
completed; one fresh ordered deduplicated proposal per toggle, removal and clear-all with inputs
unmutated; no emission on render, open, close, option update, source replacement or disabled;
label naming the trigger and the group, `aria-expanded`/`aria-controls`, `role="checkbox"` rows
with `aria-checked` and a tick independent of colour; Escape, trigger, departure and outside
close; focus after removal, clear-all and overflow hiding; `fitChips` plus `ResizeObserver`
overflow with the count reserved, count-only at narrow widths, count opening the dropdown;
placement above or below, capped and scrolling, on the shared floating elevation; all buttons
`type="button"`; the glossary already carries the term (`CONTEXT.md`). No out-of-scope feature
was added.

Findings:

1. **Outside press with an option focused detoured through the trigger** — the brief says an
   outside pointer interaction closes "without stealing focus from its destination". The only
   test opened by pointer with focus outside the control. With an option focused, `pointerdown`
   unmounted the surface, the lost-focus rule then focused the trigger, and only the following
   `mousedown` moved focus on, so a distant press could scroll the page back to the trigger.
   → **Fixed**: the outside-press handler records a departure before closing, so nothing is
   restored to the trigger. Regression test added; verified in Chrome that a press on the page
   body ends with focus on the body, not the trigger.
2. **An unanswered removal request outlived the focus that made it** — with a consumer that
   does not answer, the request stayed pending after the user moved focus elsewhere, and a later
   unrelated disconnection of that chip moved focus to its successor. → **Fixed**: a focus move
   within the control to anything but the requesting control withdraws the request. Regression
   test added.
3. **Proposals drop identities with no supplied option** — the brief forbids silently
   rewriting selection to reconcile invalid input. **Dismissed**: a proposal is defined as
   ordered by supplied option order, which a stale identity has no place in; it is emitted only
   for a user edit, never synthetically, and stale identities already breach the caller contract.
   The README and TSDoc state it.
4. **Placement tests read `data-placement` and the surface's max-height property** —
   borderline against "no assertions on private state". **Dismissed**: jsdom has no layout, so
   the brief's "controlled measurement boundaries" are the only way to prove above/below.
5. **Enter and Space are proven as a `detail: 0` click** rather than key events. **Dismissed**:
   the repo has no user-event package and jsdom does not synthesise a click from a key; the
   click with `detail` 0 is what the browser delivers, and Enter was verified in Chrome.
6. **Minor additions not in the brief** — ArrowDown on an open trigger focusing the first
   option, the empty wording described on the trigger, a `NearViewportBottom` story.
   **Dismissed**: each serves a stated requirement (keyboard reach, the label/empty state,
   viewport placement inspection) and adds no surface.
7. **Not verifiable from the diff**: the released package version on #110 (release is outside
   this review) and an axe pass (the a11y addon was not run in either session).

Robustness (found by the pre-commit hook, not by either axis): the "none, one, several or all"
test timed out at 5s in the full suite under a machine load above 20, at HEAD as well as with the
fixes, while passing alone in under a second. Its loop resolved twelve accessible names one role
query at a time; it now clicks the result of one `getAllByRole('checkbox')` query. Same behaviour
proven, one name resolution instead of twelve.

## Evidence

`npm run lint`, `npm run typecheck`, `npm run test` (46 files, 828 tests; 34 MultiSelect),
`npm run build` and `npm run build-storybook` pass after the fixes. Playwright against the
Storybook dev server in headless Chrome, light and dark: the field stays one 46px row at 448px
and 384px with three chips and `+5` (overflow), one truncated chip and `+2` (long labels), the
document never widens past the viewport; disabled mutes the border while keeping chips; near the
viewport bottom Enter opens above, focuses the first selected option, and the surface carries the
floating shadow within a 564px cap.

**Summary** — Standards: 2 hard findings, both fixed (worst: styling outside the recipe).
Spec: 2 confirmed findings, both fixed (worst: the outside-press focus detour); 5 dismissed.
