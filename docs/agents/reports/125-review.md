# Review: #125 Header status and action slots (feature/ticket-125, 3739997…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 3739997...HEAD` - the fixed merge-base with `main` - over the branch as it stood at
`cd5081a`, with issue #125, its approved Agent Brief (the issue's one comment, also at
`docs/agents/reports/125-agent-brief.md` on `main` since `3af108c`) and the consumer ticket
juwel-dev/g-label-manager#195 as spec sources, and `docs/agents/standards/` (coding, architecture,
testing, design-system-components), `CONTEXT.md`, ADRs 0007 and 0008 and the Fowler smell baseline
as standards sources. The brief was posted at 05:16Z on 2026-10-03; the branch's commit was authored
at 04:26Z, so the first pass was built against the raw issue body, which its own report says. The
brief supersedes the body wherever they differ, and the coordinator confirmed that during the review.
Findings were verified by hand, the confirmed ones fixed in `77cef9b` on top of a clean merge of
`main` (`2adf4a3`, bringing the wrapping Button of #119 and the typography of #120), and both axes
re-checked against the final diff. Date: 2026-10-03; reviewer: an Orca worker (Claude), separate
from the implementer. Nothing was pushed, merged, published or versioned.

## Standards axis

`npm run lint` and `npm run typecheck` passed on the branch under review; nothing below is
tooling-enforced.

**Hard findings, confirmed:**

1. **Header's TSDoc documented the wrong declaration** (coding.md › Comments: TSDoc on the public
   surface reaches the consumer's editor). The `isPresent` helper and its comment had been inserted
   between the `/** … */` block and `export const Header`, so the compiler attached the whole
   `@Guarantees` block to the helper and `Header` carried no documentation. Verified with the
   compiler API by the sub-agent. *Fixed:* the helper sits above the block.
2. **Comment budget** (coding.md › Comments: file header ≤ 6 lines, any other block ≤ 4). The recipe
   comment ran 17 lines (11 at merge-base), the slot-constants comment 8, a new spec comment 5.
   *Fixed:* every `//` block in `Header.tsx` is within budget; the material that was load-bearing
   moved into the TSDoc, which is API documentation and not a comment in the standard's sense.
3. **Behaviour change for existing callers without a `NOTE:` footer** (architecture.md › The `NOTE:`
   footer). A `Header` with no `children` used to render an empty `<nav>` and no longer did; the
   first pass's report called it "the one observable change" and the commit carried no note.
   *Fixed by withdrawal, not by a note:* the navigation bar now renders exactly what it rendered at
   merge-base for every caller, so there is no changed behaviour to announce (see Compatibility).
4. **Class-string assertions** (testing.md › Querying: never assert on the class string). Thirteen
   new assertions pinned `ms-auto`, `gap-x-…`, `flex-wrap` and `justify-between`, with a comment
   conceding that "geometry is Storybook's surface" while no story carried a `play` function.
   Inherited practice - the merge-base file had 27 such assertions and 26 other specs do the same -
   but the new ones existed only to stand in for layout jsdom cannot do. *Fixed:* the new
   class-string tests are gone; the geometry they stood for is asserted by `play` functions on the
   stories (the house pattern from `Stack.stories.tsx`), measured in Chrome below. The pre-existing
   class assertions on the navigation bar are left as they were, outside this ticket's scope.

**Judgement calls:**

- *Speculative shape* - a `breaks: { true, false }` variant plus `Omit<…, 'breaks'>` existed to
  smuggle a derived class through the one recipe. *Replaced* by a `mode` variant, still derived and
  still off the prop surface, but now naming the thing the brief names.
- *Duplicated Code* - `isPresent(status)` / `isPresent(action)` evaluated two and three times per
  render. *Resolved* by the two-branch render.
- *`isPresent` incomplete* - `true`, `''` and `0` passed the guard though React paints nothing for
  the first two. *Fixed:* `isPainted` names exactly what React paints nothing for (`undefined`,
  `null`, a boolean, the empty string).
- *Stories' `argTypes`* documented only `edge`. *Fixed:* every slot has a description and the
  guidance lives in `parameters.docs.description.component`, where the architecture standard now
  says component documentation belongs.

The import graph (no sibling-component import), the closed prop surface, the one-`cva()` rule, the
barrel (Header only, no props interface) and the CONTEXT.md entries conform. The one exported
`type` - `IHeaderProps` as a union of two exported `I…Props` interfaces - is the coding standard's
stated exception for a public data shape the API must name: a union cannot be an `interface`, and
the brief requires the union.

## Spec axis

**Missing or partial, confirmed:**

1. **No separate modes and no TypeScript enforcement.** Brief: *"The modes are separate: status/action
   mode does not also accept the standing link or navigation … enforce them through the public
   TypeScript contract"*; acceptance: *"The public contract exposes separate modes and rejects mixed
   standing/navigation and status/action props."* `IHeaderProps` was one flat interface with five
   optional slots; the sub-agent type-checked `<Header standing status action>{nav}</Header>` against
   the repo's `tsconfig.json` and it compiled. *Fixed:* `IHeaderProps` is
   `IHeaderNavigationProps | IHeaderStatusActionProps`, each declaring the other's slots as `never`.
   With the directives removed, `tsc` reports `Type '{ standing: Element; status: Element; }' is not
   assignable to type 'IntrinsicAttributes & IHeaderProps'` for every mixed shape; the spec pins four
   of them under `@ts-expect-error`, so `npm run typecheck` fails the day one compiles again.
2. **Status did not occupy the left edge; the standing floor was always reserved.** Brief: *"status
   occupies the left edge"*, *"omitted slots reserve no space"*, *"action-only content stays right
   without an empty reserved status slot"*. The standing `div` - `shrink-0`, floored at
   `--standing-min-width` - rendered unconditionally, so a status-only bar began with an empty 7.5rem
   box; the stories hid it by putting the date in `standing`. *Fixed:* the status/action bar renders
   no standing slot; measured below, the readout's left edge equals the content start edge.
3. **No Storybook `play` functions.** Brief: *"Check rendered geometry and focus in Storybook at
   widths above and below wrapping; jsdom/class assertions alone do not prove layout."* The only
   geometry evidence was a one-off scratchpad Playwright run recorded in prose. *Fixed:* six stories
   carry `play` functions asserting content-edge alignment, line sharing, drop-below, overflow,
   wrapping of an unbroken token, focus after Tab and focus survival across a width change.
4. **No `parameters.docs.description.component`.** *Fixed*, as above.
5. **"Existing Header callers render the existing standing/navigation arrangement unchanged"** held
   for the standing-plus-links caller (same nav edge, measured) but not for a caller with no
   `children`, which lost its `<nav>`. *Fixed:* byte-for-byte evidence under Compatibility.

**Scope creep, confirmed:** the brief lists *"Combined standing/navigation/status/action layouts"*
as out of scope. The diff added a `WithNav` story, a spec test for all four slots, a documented
guarantee for the nav-beside-action case and the nav-margin branching that existed only for it.
*Removed*: the story, the test, the guarantee and the branch. The compiler now rejects the shape.

**Implemented but questionable, confirmed:** `isPresent` treated `''` and `true` as present (see
Standards). The `shrink-0` on the action slot would have made a long Button label overflow the page
rather than wrap, against *"Long labels … wrap without … page-wide horizontal scrolling"*; with
`main` merged, `Button` wraps its own label (#119) and the slot no longer refuses to let it.

**Correct and kept:** status before action in DOM, reading and keyboard order; plain `div` slots
with no role, name or live region; no library `<nav>`, `status` role or live region in the
status/action bar; consumer-supplied heading, live region and disabled control passing through
unchanged (now also tested); one auto margin for the end edge; `--space-region` along a line and
`--space-stack` between lines; `--gutter` inset; no sticky, no `dark:`, no hydration.

## Fixes

All in `77cef9b fix(header): apply the #125 review's spec and standards findings`, written
test-first: the rewritten spec ran red against the first pass (four runtime failures and the mixed
shapes compiling), then green against the new component.

- `src/Layout/Header/Header.tsx` - union props type with the two mode interfaces; the mode read off
  the slots (`status !== undefined || action !== undefined`, so a withheld `action={ready && …}`
  keeps the bar in status/action mode without an empty box) and kept off the prop surface; a
  two-branch render; `isPainted`; `wrap-anywhere` and `min-w-0` on the readout; no `shrink-0` on the
  action; TSDoc attached to `Header` and restructured by mode; comments within budget.
- `src/Layout/Header/Header.spec.tsx` - 24 tests: the 11 navigation-bar tests unchanged, a
  compatibility test for a caller with no links, nine status/action-bar tests (no nav anywhere, no
  standing slot, roles and live regions, pass-through semantics, order, omitted and withheld slots)
  and the type-level test; the sticky and `dark:` sweeps cover both modes.
- `src/Layout/Header/Header.stories.tsx` - the navigation stories as they were, `Default` gaining a
  regression `play`; `StatusOnly`, `ActionOnly`, `StatusAndAction`, `LongLabels` (German wording,
  an unbroken 96-character token, a long disabled label) and `NarrowDesktop` (48rem frame) in
  status/action mode with `play` functions; `WithNav` removed; the component description.
- `CONTEXT.md` - the Status slot and Action slot entries name the bar they belong to and the
  compiler-kept separation; the Shell entry from `main` stands.

## Compatibility

Additive and non-breaking. Checked, not inferred:

- A scratch spec rendered the merge-base component (`git show 3739997:src/Layout/Header/Header.tsx`)
  and the new one for six navigation-bar callers - standing with links; standing only; no props;
  `navName` with `edge="none"` and `testId`; `children={false}`; `children={null}` - and compared
  `container.innerHTML` with class tokens sorted. All six identical: the same elements, attributes
  and class sets, an empty `<nav>` for the link-less callers included. The only textual difference
  before sorting is that cva now emits `justify-between` after the base classes instead of inside
  them, which CSS does not see. The scratch files were deleted and are not part of the branch.
- No prop removed, renamed or made required; `edge` still defaults to `rule`; `IHeaderProps` is
  still the exported props name and still resolves every existing call, now as the navigation
  member of the union. `ComponentProps<typeof Header>` remains the consumer's derivation.
- No token, palette or theme-interface change; the barrel still exports `Header` only.
- The emitted `dist/types/Layout/Header/Header.d.ts` carries the union; `mode` appears only on the
  internal recipe declaration and is omitted from both props interfaces.
- Commit markers: `feat(header)` then `fix(header)`, a minor release when published. No breaking
  marker and no `NOTE:` footer, there being no changed behaviour for an existing caller.

## Acceptance and check evidence

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 177 files |
| `npm run typecheck` | Passed; the four `@ts-expect-error` shapes each fail without the directive |
| `npm run test` | Passed; 54 files, 1202 tests (24 Header) |
| `npm run build` | Passed; `dist/types/Layout/Header/Header.d.ts` as described above |
| `npm run build-storybook` | Passed; 12 Header stories indexed, 13 entries with the docs page |
| Pre-commit hook on `77cef9b` | lint, typecheck and the suite green |

Browser verification in headless Google Chrome via Playwright (scratchpad install) against the
static Storybook build, loading each story's `iframe.html` with the viewport set, waiting for the
`storyFinished` channel event and reading its status - so every number below was measured after
the story's own `play` function had run and passed - then reading `getBoundingClientRect`,
computed styles, `scrollWidth` and `document.activeElement`. "Content edge" is the header's box
minus `--gutter`. Screenshots per story and width were kept in the scratchpad.

| Story @ width | Play | Measured |
| --- | --- | --- |
| Default @1280 | success | Two children; nav right edge 1216 = content edge; `flex-wrap: nowrap`; one line |
| Default @390 | success | Nav wraps its links beside the standing slot; no page or header overflow |
| NamedNav, StandingRoutes @1280 | success | As Default; `aria-label="Primary"` on the named nav |
| StatusOnly @1280 | success | No `<nav>`; one child; readout left edge 64 = content start; no role, no `aria-live` |
| ActionOnly @1280 | success | No `<nav>`; one child; action right edge 1216 = content edge; Tab focuses Continue, 3px solid outline |
| StatusAndAction @1280, @1024 | success | Readout at 64 / 51.2 = content start; action right at 1216 / 972.8 = content edge; both on one line (vertical ranges overlap); Tab focuses Continue |
| StatusAndAction @1280 dark | success | Same geometry under `theme:dark` |
| LongLabels @1280, @1024, @800 | success | Readout takes the full content width; action dropped below it (top 82.2 > readout bottom 75.7 at 1280), right edge 1216 / 972.8 / 760; disabled; no overflow |
| NarrowDesktop @1280 and @800 (48rem frame) | success | Action below the readout, right edge 704 / 728 = frame content edge; the unbroken token occupies more than one line; readout `scrollWidth` ≤ `clientWidth`; Continue focused before the frame was widened and narrowed and still the same focused node after |

At every width `document.documentElement.scrollWidth` equalled its `clientWidth` and the header's
`scrollWidth` equalled its `clientWidth`. `align-items: baseline` held on every line; the slot gap
measured 19.5px (`--space-region`) along a line and 6.5px (`--space-stack`) between lines.

Brief acceptance criteria against the final branch:

- Existing callers render the existing arrangement unchanged - byte-for-byte above.
- Separate modes, mixed props rejected, slots, defaults, landmark placement and consumer
  responsibilities documented - the union type, the type-level test, the TSDoc and the stories'
  component description.
- No library-created nav, status role or live region in status/action mode; supplied semantics
  survive - tested in jsdom (`role="status"`, a heading, a disabled control) and measured in Chrome.
- Status at the left edge and action at the right content edge when both fit; action below and
  still right-aligned below the threshold; status-only left; action-only right with no reserved
  slot - measured above.
- Long and unbroken labels wrap without clipping, overlap, ellipsis or horizontal scroll; gaps and
  insets from semantic tokens - measured above.
- Keyboard operation, visible focus, reading order and state across resizing - the `NarrowDesktop`
  play function and the ActionOnly / StatusAndAction measurements.
- Tests test-first, stories for the five cases, geometry and focus checked in Storybook above and
  below wrapping, navigation mode in the regression set - done.
- Lint, typecheck, tests, library build, Storybook build run; browser verification recorded - above.

## Limitations

- The `play` functions assert at whatever width Storybook opens the story; the "above and below
  wrapping" pair is `StatusAndAction` (one line at desktop widths) against `NarrowDesktop` (the
  48rem frame), which is deterministic regardless of the viewer's window.
- The Storybook docs page renders the union's props table however react-docgen reads a union;
  the slot descriptions are supplied through `argTypes` so they do not depend on it.
- The consumer's `ClockBar` is not changed here; its migration is `<Header status={…} action={…} />`
  with the date moved from `standing` into `status`, once a release exists.
- A caller outside TypeScript that mixes the shapes at runtime gets the status/action bar and its
  navigation props are not rendered; the contract is the type, and the repository's rule is that
  the prop type makes the bad call impossible rather than the component policing it.

## Publication - pending

Implementation is complete on `feature/ticket-125` at `77cef9b` (on top of `main` at `cb13ccf`
merged in `2adf4a3`). No release has been published, no version exists to record, and nothing has
been recorded in juwel-dev/g-label-manager#195. The release and the consumer note are the
maintainer's publishing step; the ticket moves to In Review with this report.
