# Review: #122 Sidebar long-label wrapping (feature/ticket-122, 3739997…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 3739997...HEAD` - the fixed merge-base with `main` - over the branch as it stood at
`ccd472c`, with issue #122, its approved Agent Brief (the issue's one comment, also at
`docs/agents/reports/122-agent-brief.md` on `main`) and the consumer ticket
juwel-dev/g-label-manager#195 as spec sources, and `docs/agents/standards/` (coding, architecture,
testing, design-system-components), ADRs 0001, 0002 and 0008 and the Fowler smell baseline as
standards sources. `npm run fallow:agent -- --base 3739997` gave the reading order (Sidebar, then
Theme, then stories). Findings were verified by hand, the confirmed ones fixed, and the branch
squashed into `89a04cc` with the coordinator's approval. Date: 2026-10-03; reviewer: an Orca
worker (Claude), separate from the implementer.

The decisive fact: `ccd472c` was committed 22 minutes before the Agent Brief was posted and was
built to the original issue body. The brief says it "is authoritative and supersedes the original
issue body where they differ", narrows the ticket to the verified label-wrapping gap, and lists a
"responsive threshold redesign or replacement active-entry treatment" as out of scope.

## Standards axis

No hard violation of a documented standard. Judgement calls:

1. **Two assertions duplicated and one tautological in the new spec tests** (testing.md › one
   behaviour per test; Duplicated Code) - the keyboard-order test re-asserted the entry order and
   the disabled set already covered by two older tests, and the long-label test's
   `toHaveTextContent` could not fail after `getByRole(..., { name })` matched. **Confirmed,
   fixed**: the keyboard-order test is gone (its only new assertion, "no `tabindex`", guards a
   model Sidebar never had, and the play functions now walk the real Tab order); the label test
   keeps the guards with teeth - no `title`, no `aria-label` - and says in its name that the
   wrapping is measured in the browser by the stories.
2. **`renderTokens.spec.ts` ordering test pinned source order, not behaviour.** The repo endorses
   that shape elsewhere; moot after the token was reverted (Spec 2 below).
3. **Second-copy comment in `renderTokens.ts`** (coding.md › Comments: "a second copy drifts").
   Moot after the revert.
4. **Physical and logical direction mixed in one recipe** (`border-r`/`pr-` on Root against the
   new `border-s`/`ps-` marker). Moot after the revert.
5. **Repeated Switches on the active state** (marker keyed on `aria-[current=true]`, underline on
   the `state` variant). Moot after the revert.
6. **Glossary dash style** - `CONTEXT.md` uses em dashes; the new sentence used hyphens. Moot
   after the revert.

Verified clean: comment budget (every block ≤ 4 lines, headers ≤ 6); no class-string assertions;
closed prop surface and one recipe per painting member; `wrap-anywhere` exists in Tailwind 4.3.3
and emits `overflow-wrap: anywhere`; `globals.viewport` is Storybook 10.5.8's API and the old
`parameters.viewport.defaultViewport` the `Stacked` story used is not read (Rail still uses it;
out of scope); commit footers within the parser's limits.

Worst issue on this axis: none hard; the test-shape finding (1).

## Spec axis

Missing or partial against the brief:

1. **`Vertragsverhandlungsübersicht` nowhere** - brief: "Include `Vertragsverhandlungsübersicht`
   as a regression input". Every long label in the diff was a spaced phrase, which already
   wrapped before the change; no intra-word break was ever rendered. **Confirmed, fixed**: it is
   the active entry of both translated stories and the input of the jsdom test.
2. **1440px and 800px not covered** - brief: "Check 1440px and 800px desktop widths". Stories
   pinned 1280 and 960. **Confirmed, fixed**: the story viewports are 1440 and 800; the browser
   pass also covers 1024 and 1023.
3. **Height-constrained frame with wrapped labels not covered** - brief: "Oversized navigation
   still permits vertical access ... within a height-constrained scrolling frame". **Confirmed,
   verified in the browser** (table below) rather than by a new story: the existing
   `OversizedNavigationInFrame` story with the word injected is the brief's own method.
4. **No committed browser regression coverage** - brief: "DOM tests or class-name assertions
   alone do not establish these layout guarantees"; the diff committed two jsdom tests and a
   prose table. The repo's testing.md keeps a browser-driver level out of the vitest suite, so
   the resolution is the repo's own precedent (`Stack.stories.tsx`): **fixed** with `play`
   functions on both translated stories that measure line boxes, scroll widths, page overflow,
   `aria-current`, the underline and the Tab-to-ring in the Storybook browser.
5. **Documentation** - brief: "Update consumer-facing component documentation ... without
   requiring consumer CSS". TSDoc was updated; the Storybook docs page was not (the coordinator
   requires component docs in Storybook, never README). **Fixed**: `docs.description.component`
   on the stories meta.

Scope creep, each conflicting with a brief line:

6. **Below-64rem list changed from a column to a wrapping row** - brief: "`Sidebar.Root`
   preserves its existing viewport-based side/above-content arrangement"; the commit's own
   `NOTE:` footer recorded it as a consumer-visible change. **Confirmed, reverted**.
7. **Marker bar plus a new public token `--sidebar-marker-thickness`** in all three stylesheets,
   with three tests - brief: "Sidebar already provides the requested ... non-color active
   treatment"; out of scope: "replacement active-entry treatment", "new styling escape hatches".
   The footer advertised the token as re-pointable to 0 while the source said it must be > 0.
   **Confirmed, reverted**, including `transition-colors`.
8. **Glossary rewrite** defining Sidebar by "a marker bar" and a "wrapping row". **Confirmed,
   reverted** to `main`'s entry.

Looks implemented but unproven:

9. **`wrap-anywhere` plausibly right but never rendered against the named input.** **Confirmed,
   now proven**: with `overflow-wrap` forced back to `normal` the brief's numbers reproduce
   exactly (243px in 173px, nav 248px against 183px); with the shipped CSS the word breaks into
   two lines and the nav's scroll width equals its client width.

Worst issue on this axis: the row arrangement (6) - an unrequested default-behaviour change.

Summary: Standards 6 findings (0 hard, 1 fixed, 5 moot after the revert); Spec 9 findings (5
missing or partial, all fixed; 3 scope creep, all reverted; 1 unproven, now proven).

## Fixes

All in `89a04cc` (`fix(sidebar): wrap long translated labels inside the navigation track`), the
squash of the branch. The final diff against the merge-base touches four files: `Sidebar.tsx`
(`wrap-anywhere` on the entry recipe, a four-line recipe comment, one TSDoc guarantee bullet),
`Sidebar.stories.tsx` (1440/800 viewports, the docs description, two translated stories with play
functions, `Stacked` on the globals API), `Sidebar.spec.tsx` (one test) and the implementation
report. `renderTokens.ts`, its spec, the three token stylesheets and `CONTEXT.md` are byte-equal
to `main`.

## Compatibility

Verified against a build of the merge-base in a throwaway worktree, not from the commit message:

| Artefact | Difference from 3739997 |
| --- | --- |
| `dist/index.css` | one added utility rule, `.wrap-anywhere`, joined to the existing `[overflow-wrap:anywhere]` selector |
| `dist/types/**` | the one added TSDoc bullet on `Sidebar` |
| `dist/design-system.js` | the class string only |
| token names in `tokens.css`, `tokens.light.css`, `tokens.dark.css` | identical |
| props interfaces, namespace members, defaults | identical |

No breaking-change marker, no `NOTE:` footer, no body line that parses as a footer; the release
type is `fix` (a patch when published).

## Acceptance and check evidence

| Check | Result |
| --- | --- |
| `npm run lint` | Passed (hook and standalone) |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 47 files, 854 tests |
| `npm run build` | Passed |
| `npm run build-storybook` | Passed |

Browser pass (Storybook dev on a private port, headless Google Chrome via Playwright 1.63 from the
scratchpad, real key presses; measurements are `getBoundingClientRect`, `scrollWidth` and
`getComputedStyle`):

| Brief criterion | Evidence |
| --- | --- |
| Unbroken word readable, no horizontal nav or page overflow | `LongLabels` 1440px with the word injected: `overflow-wrap: normal` reproduces 243px in a 173px button and nav 248/183; shipped CSS gives two lines (169.6px + 73.2px), nav 183/183, no page overflow |
| Both arrangements supported, stable order, no displacement; 1440, 800 and both sides of 64rem | `TranslatedLabels*` at 1440/1024 (grid `192px 1fr`, track 192px, content at x 232) and 800/1023 (one track, content top 243 below the list's 219); `Controlled` at 1440/1024/1023/800 switches at 64rem exactly; `ul` is a column at every width |
| Naming, button semantics, current state and underline, inert skipping, Enter/Space, visible focus, both arrangements | Real Tab visits entries in DOM order skipping inert "Contracts"; every stop `:focus-visible`, `solid 3px` outline, 2px offset; Enter on "Hub" and Space on "A&R" move `aria-current`, the underline and the heading at 1440 and 800; a click on the inert entry changes nothing |
| Oversized nav in a height-constrained frame with wrapped text | `OversizedNavigationInFrame` 1440px, word injected into entry 1 and twice into entry 21: nav 384px tall with 1352px scroll height; the entries wrap to 2 and 4 lines with no sideways scroll; 40 Tabs reach "Section 40", every stop `:focus-visible` and inside the nav's scrollport |
| Browser regression coverage and stories at broad and narrow widths | Play functions on both translated stories passed in light and dark (no `AssertionError` on the console); screenshots in the scratchpad |
| Consumer documentation without consumer CSS | `docs.description.component` on the Sidebar docs page; TSDoc bullet in `dist/types` |

## Publication - pending

Implementation is complete on `feature/ticket-122` at `89a04cc` plus this report's commit;
nothing was pushed, merged, published or versioned, and the ticket was moved to **In Review**
only. Publishing through the normal release process (a patch, from the `fix` commit) and
recording the actual released version in juwel-dev/g-label-manager#195 remain with the human
who lands the work. No version is claimed here.
