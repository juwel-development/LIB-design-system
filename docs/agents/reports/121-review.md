# Review: #121 Tabs readable labels and panel separation (feature/ticket-121, 3739997…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 3739997...HEAD` (commits `10386b5` and `751feee`; `3739997` is the merge-base with `main`,
unchanged although `main` has since moved to `e92bf3e` without touching Tabs). Spec sources: issue
#121 - body plus the approved Agent Brief in its comment of 2026-10-03T04:39Z, which supersedes the
body and also sits on `main` as `docs/agents/reports/121-agent-brief.md` (`c04327a`) - the consumer
specification juwel-dev/g-label-manager #195, and docs/adr/0008. Standards sources:
`docs/agents/standards/` (coding, architecture, testing, design-system-components) plus the Fowler
smell baseline; `npm run fallow:agent -- --base 3739997` gave the reading order. Findings were
verified by hand and the confirmed ones fixed in `9a75c0b`. Date: 2026-10-03; reviewer: an Orca
worker (Claude), separate from the implementer.

Two facts framed the review. The brief was posted fourteen minutes after the implementation commits,
so the implementer worked from the issue body alone and said so in its report. And the worktree held
uncommitted edits (a move of the per-tab variant into the List's selectors, a viewport global on the
NarrowDesktop story); they were saved to the session scratchpad and read, the viewport global was
adopted, the rest was superseded by the fix below.

## Spec axis

(a) Missing or partial:

1. **Rich labels not implemented.** Brief: "Widen `ITabsTabProps.children` from `string` to
   `ReactNode` … Support visible text with optional icons, badges/counts and inline formatting."
   `Tabs.tsx` still read `/** The visible text label. Text only - no icons, no per-tab markup. */
   children: string;` - untouched by the diff. The first acceptance criterion (rich label renders and
   selects as one tab, meaningful name, clicking a descendant requests the same value) had no code,
   test or story, and the "old string-only … guarantees" were not updated. **Confirmed, fixed.**
2. **The default mode did not wrap label text.** Brief: "Allow label text to wrap within a tab as
   available space narrows; retain horizontal scrolling when the row still cannot fit." The default
   kept `shrink-0 text-nowrap` and the TSDoc promised "one line - no wrap, no shrink". The requested
   behaviour existed in neither variant. **Confirmed, fixed.**
3. **Only one spacing role covered.** Brief: "`gap="stack"` or `gap="region"` … Storybook examples for
   … both spacing roles." Every test and story used `region`. **Confirmed, fixed.**
4. **First/middle/last gap criterion partially evidenced.** Brief: "Switching between first, middle and
   last panels leaves the intended gap unchanged." Tests covered two of three positions; the browser
   table measured once. **Confirmed, fixed.**

(b) Scope creep: **`overflow="wrap"` on `Tabs.List` contradicted the brief** - "Keep tab controls in
one horizontal row … Do not wrap the controls into multiple rows"; out of scope: "multiline rows of
tab controls". The variant did exactly that (`flex-wrap`; the implementer measured four rows), added a
public prop the brief did not ask for, and the LongLabels, NarrowDesktop and half the
KeyboardNavigation stories, three tests, the `TabsListContext` and the CONTEXT.md entry documented it
as the recommended path. **Confirmed, removed.**

(c) Implemented but wrong: the narrow-desktop criterion was met only through the out-of-scope mode;
the report's own limitation that an unbroken word "still overflows under `wrap`" left "Handle long
unbroken text without inaccessible clipping" untested. **Confirmed, fixed.**

Satisfied with evidence before the fix: string labels still supported; roles, associations, selection
and navigation preserved including through a Stack; region gap measured at 24px; overflow reachability
by keyboard with a 3px ring; lint, typecheck, test, build, Storybook build; publication deferred.

Net: the two central contract changes were missing while the one behaviour the brief excluded was
built and documented as the solution.

## Standards axis

No hard violations of a documented standard. Judgement calls, by weight:

1. **A second context and the same `overflow` variant on two recipes** - design-system-components.md,
   Compound components: a member "may style descendants it owns through its one recipe's selectors …
   rather than reaching for a second recipe". Precedents `Table.tsx` (`data-notes` on Root, selectors
   in one recipe) and `Sidebar.tsx`. Shotgun Surgery in miniature: a third accommodation would touch
   two recipes, two defaults, a context type and a provider. **Confirmed; moot after the fix** - the
   prop, both variant blocks and `TabsListContext` are gone.
2. **CSS-keyword option names** - docs/adr/0008, structural test: options are "named for the job,
   never the CSS keyword set"; `overflow: scroll | wrap` are CSS values where `Stack` has
   `direction: column | split`. **Moot after the fix.**
3. **`overflow` TSDoc unreachable from the prop** - the `/** … */` sat on the interface, which a
   consumer never hovers; no sibling documents a variant that way. **Moot after the fix**; the new
   `children` TSDoc sits on the prop.
4. **Hand-written `'scroll' | 'wrap'` unions in spec and stories** (Duplicated Code, Primitive
   Obsession) where `Stack.spec.tsx` derives `ComponentProps<typeof Stack>['align']`. **Confirmed,
   fixed**: the harnesses derive `ComponentProps<typeof Stack>['gap']`.
5. **A bare `for … it()` loop generating three tests jsdom cannot tell apart**, plus wrap-mode re-runs
   of existing tests - testing.md asks for variants "that change behaviour (not merely appearance)",
   and the repo parametrises with `it.each` (`Form.spec.tsx`, `Note.spec.tsx`). **Confirmed, fixed**:
   the loop and the duplicates are gone; the Stack composition is parametrised with `it.each` over
   gap × active position, six cases that differ in what the DOM shows.
6. **CONTEXT.md entry scope and punctuation** - the overflow term carried the Stack sentence
   (Divergent Change in a vocabulary entry), and used ` - ` where the section's norm is `—`.
   **Confirmed, fixed**: the separation sentence moved under **Tabs**; em dashes.

Checked and clean: comment budget (every block ≤ 4 lines, no file header over 6); hooks only where
state exists; barrel unchanged; non-relative imports; `Stack` imported by spec and stories only, so
the import test passes; closed props, `I<Namespace><Member>Props`, `import type`, no `null`; every
variant has a story; role-first queries, behaviour-sentence names, no class-string assertions, no
shared mutable fixtures; no library wording; no raw non-token values. Dismissed advisory tool
findings: fallow's Choices/Tabs clone groups (the contract-hook shape every compound member repeats
by design) and `requestNeighbour`'s cyclomatic 6, both pre-existing.

## Fixes (`9a75c0b`)

- `Tabs.tsx`: `ITabsTabProps.children: ReactNode` with TSDoc; the tab recipe drops `shrink-0` and
  `text-nowrap` so a flex item shrinks to its longest word and its text wraps first; the List recipe
  is the published one again (`overflow-x-auto` plus ring room); `overflow`, `TabsListContext` and
  the `VariantProps` import are removed; the namespace TSDoc states the whole-label, one-row
  wrap-then-scroll, shared-height, decorative-`aria-hidden`, no-interactive-descendant and Stack
  separation contracts at both gaps.
- `Tabs.spec.tsx`: four rich-label tests, the Stack composition at both gaps and all three active
  positions (`it.each`), harness types derived from `Stack`; the wrap-mode and loop tests removed.
  37 tests.
- `Tabs.stories.tsx`: component description in `parameters.docs.description.component` (labels,
  width, separation), eight stories as listed in `121-tabs-implementation.md`, the `NarrowDesktop`
  story locked to a 900×700 viewport through the viewport global.
- `CONTEXT.md`: **Tabs** gains the label and separation sentences; **Tab row overflow** describes
  wrap-then-scroll on one row; `_Avoid_` gains "multi-row tabs".
- `121-tabs-implementation.md` rewritten to what ships, with the history kept.

## Compatibility

Verified against the published package, not the commit messages: `npm view` and the GitHub releases
both put the latest at 3.9.1 (tag `v3.9.1`, 2026-09-28); no tag contains `10386b5`, so `overflow`
never reached a consumer and its removal changes no released API.

| Surface | Published 3.9.1 | After `9a75c0b` |
| --- | --- | --- |
| `ITabsRootProps`, `ITabsListProps`, `ITabsPanelProps` | as published | identical |
| `ITabsTabProps.children` | `string` | `ReactNode` - every existing call compiles |
| Tokens | `--tab-*`, focus ring, spaces | none added, removed or changed |
| Required props | `active`, `onSelect$`, `label`, `value`, `children` | unchanged |
| Row with room | one line | one line, identical |
| Row too narrow | scrolls, labels on one line | labels wrap inside their tabs, then scrolls |

The last row is the one behavioural change for existing code. It is what the brief asks for and is
not breaking, so the fix commit carries it as a `NOTE:` footer. Parsed with the commit analyser's
keywords (`BREAKING CHANGE`, `BREAKING-CHANGE`) the commit has zero notes - no major; parsed with the
notes generator's `NOTE` it has exactly one, and its last line carries no issue reference. The branch
holds two `feat(tabs)` commits, so the release, when a human publishes it, is a minor.

## Checks

After the fixes: `npm run lint` (153 files), `npm run typecheck`, `npm run test` (47 files, 866
tests, 37 in Tabs), `npm run build` (`children: ReactNode` on every member in the emitted `Tabs.d.ts`,
no `overflow`) and `npm run build-storybook` all pass; the pre-commit hook re-ran lint, typecheck and
the suite on `9a75c0b`. System load was above 40 throughout; the suite still finished in ~3s.

## Browser evidence

Headless Chrome 154 (Playwright, `channel: 'chrome'`) against the static Storybook build served from
the session scratchpad; 16px root. Facts measured with `getBoundingClientRect`, `scrollWidth` /
`clientWidth`, `Range.getClientRects` for line boxes, `:focus-visible` and computed `outline`.
Screenshots and the script stayed in the scratchpad; nothing was committed.

| Story, viewport | Fact |
| --- | --- |
| LongLabels, 44rem column, 1280×800 | list `scrollWidth` 714 = `clientWidth` 714, no row scroll, no page scroll; one row of controls; line boxes per tab 3 / 3 / 2 / 1; tabs 189, 189, 220, 105px wide; no tab clips its text (`scrollWidth ≤ clientWidth`); all four marker bottoms at one y; `white-space: normal`, `flex-shrink: 1`. Light and dark screenshots. |
| Overflow, 24rem column | the unbroken `Marktforschungsberichtszusammenfassung` tab is 360px wide with `scrollWidth` 360 - whole, not clipped; list 832 > 394 scrolls; page does not scroll. Tab enters at the active tab: `:focus-visible`, `outline 3px solid`, tab inside the list and ring inside the clip (left 16 ≥ list 11 + 5). ArrowLeft wraps to `Ehemalige` and reveals it (295…400 within 11…405), ring inside the clip, selection follows. Scrolling the row to its end and clicking the third tab by pointer selects it. |
| RichLabels, 1280 | tab names `Staff 12`, `Candidates 3`, `Alumni`; `getByRole('tab', {name})` finds each exactly once; the aria snapshot lists text and emphasis, not the svg. Clicking the icon selects `Candidates 3`; clicking the count selects `Staff 12`. |
| RichLabels, 300×600 | list 278 = 278, one row, no scroll, no page scroll; the labels wrap (`Candidates` / `3` on separate lines) and the icon stays inside its tab - rich content does not defeat wrapping. |
| SeparationStack | `--space-stack` = 8px; marker-to-panel gap 8 / 8 / 8 with the first, middle and last tab active; one visible panel, the two hidden ones have zero client rects. |
| SeparationRegion | `--space-region` = 24px; gap 24 / 24 / 24 across first, middle, last; hidden panels zero rects. The list's border box ends 5px below the markers and its margin is −5px (ring room), so the Stack gap lands between marker and panel exactly. |
| NarrowDesktop, 900×700 | both rows: list 878 = 878, no row or page scroll, one row of controls; English labels 2 / 2 / 2 / 1 lines, German 3 / 2 / 2 / 1; marker-to-panel gap 24 on both; markers aligned. Screenshot. |
| NarrowDesktop, 1280×700 | English 1 / 1 / 1 / 1 lines (the row has room and keeps one line), German 2 / 2 / 2 / 1; no scroll; gap 24. |
| KeyboardNavigation, 32rem, region | Tab → active tab (3px ring, inside clip); ArrowRight ×3 moves focus and selection along the row, each revealed inside the list; ArrowRight from the last wraps to the first; ArrowLeft from the first wraps to the last; Tab → the panel (`role=tabpanel`, 3px ring); Tab → the action inside it. |
| Docs page | the component description's labels, width and separation paragraphs render; all eight stories are present with their descriptions. |

## Acceptance criteria of the brief

| Criterion | Evidence |
| --- | --- |
| String-label consumers supported; rich label renders and selects as one tab, meaningful name, descendant click requests the same value | 24 pre-existing string tests unchanged; rich-label tests; RichLabels browser facts |
| Short and long EN/DE labels readable at broad and narrow desktop widths; text wraps, controls one row; unbroken text reachable without page-wide overflow | LongLabels 44rem, NarrowDesktop 900 and 1280, Overflow (row scrolls, page does not) |
| Every tab reachable by pointer and keyboard in an overflowing row; focus indicator visible; nothing clipped or tooltip-only | Overflow and KeyboardNavigation sequences; whole-label test (no `title`, no hidden part) |
| Roles, associations, selection, navigation, focus and lifecycle preserved for text and rich labels, including Stack | spec: rich-label association and arrow tests, Stack `it.each` and arrow/click tests |
| Stack separation at the selected role; first/middle/last gap unchanged; no extra gaps | 8 / 8 / 8 and 24 / 24 / 24; hidden panels zero rects |
| Tests and stories for short, rich, long translated, narrow widths, keyboard, both roles; browser checks | this report |
| Consumer-facing documentation in Storybook | component description + story descriptions, verified on the docs page |
| Lint, typecheck, tests, build, Storybook build | Checks above |
| Publish and record the version in the consumer ticket | **pending - human release**, see below |

## Remaining limitations and notes

- Wrap-then-scroll is literal: below the sum of the longest words every tab collapses to one word per
  line before the row scrolls (Overflow at 24rem shows a five-line tab). The brief chose this order;
  a shrink floor would be a measurement with no attested role (docs/adr/0003, 0008).
- A decorative icon can wrap onto its own line at an extreme width; the consumer can group icon and
  first word in a `white-space: nowrap` span of its own.
- Storybook's react-docgen plugin uses `FindExportedDefinitionsResolver`, so the namespace TSDoc of a
  compound component (`Tabs`, `Table`, `Dialog`) never reaches its docs page - only `Button`'s and
  `Stack`'s do. The user wants all component docs in Storybook; this review met that for Tabs through
  `parameters.docs.description.component`, which overlaps the TSDoc by necessity. A repo-wide fix is a
  small `viteFinal` docgen plugin with `FindAllDefinitionsResolver`; it is tooling across every
  compound component and was left out of this ticket.
- Chrome only; the implementer's earlier Chrome evidence for the removed mode no longer applies.
- `main` has moved (ScrollContainer, Button, tokens, CONTEXT.md **Family role** entries). None of it
  touches Tabs; CONTEXT.md edits sit in different sections.

## Publication

**Implementation: done** on `feature/ticket-121` (`10386b5`, `751feee`, `9a75c0b`, this report).
**Publication: not done.** Nothing was pushed, merged, tagged or published, no version was chosen,
and #121 stays `In Review`. The release is a human step through semantic-release; the actual version
is recorded in juwel-dev/g-label-manager #195 only once it exists.
