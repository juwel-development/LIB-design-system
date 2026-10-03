# Composable table actions, sort icons, plain buttons and ScrollContainer: review (#114)

Date: 2026-10-03. Reviewed by an Orca worker (Claude) on branch `feature/ticket-114` against the
fixed merge-base with `main`, `3739997` (package 3.9.1), following
`.claude/skills/code-review/SKILL.md`: a Standards axis and a Spec axis ran as two parallel
sub-agents over `git diff 3739997...HEAD`, the reviewer verified compatibility and the browser
evidence itself, and confirmed findings were fixed and committed here. The spec is issue #114 with
its approved [agent brief](./114-agent-brief.md), which supersedes the original issue body; the
implementer's [report](./114-implementation.md) was treated as claims to verify, not as evidence.
The two axes are reported separately on purpose and are not reranked against each other.

Commits under review: `787ea50` (feat), `c93c34b` (docs). Commits made by this review:
`1375345` (fix), `3d758ab` (docs), and the one carrying this report.

## Standards axis

Sources: `docs/agents/standards/{coding,architecture,testing,design-system-components}.md`,
`CONTEXT.md`, ADRs 0002, 0003, 0004, 0008, 0013, plus the Fowler smell baseline the skill
carries. `npm run fallow:agent -- --base 3739997` supplied the reading order and flagged the
duplicated overflow hook, two new `biome-ignore` suppressions and story-level clone groups.

Hard violations (documented standard):

- **Comment budget** (`coding.md` § Comments: header ≤ 6 lines, any other block ≤ 4). The `Button`
  header was 9 lines, the `scrollContent` block in `ScrollContainer` 8, the `useHorizontalOverflow`
  block in `Table` 5. **Fixed** in `1375345`.
- **One `describe` per component** (`testing.md` § Location and naming). `Table.spec.tsx` nested a
  `describe('residual overflow with a note column')`, the only nested describe in the suite.
  **Fixed**: flattened.
- **"Never assert on the class string"** (`testing.md` § Querying). The new Button, Table and
  ScrollContainer tests assert on `className` throughout. **Not fixed, recorded as a deviation**:
  27 existing spec files do the same, the base `Button.spec.tsx` already pins ADR 0001–0004 this
  way, and jsdom computes no Tailwind style to assert on instead. The written rule and repo
  practice disagree; this change follows practice. Resolving that is a standards decision, not a
  ticket fix.

Judgement calls (baseline smells):

- **Duplicated Code**: the measure/observe/resize/teardown hook in `Table.tsx` and
  `ScrollContainer.tsx` is the same shape. Extraction is blocked by `architecture.md` ("no
  component imports another component's internals") and there is no sanctioned shared-module
  location. **Recorded as a design decision**, not changed; the two hooks now also share the
  focus-retention fix below, so the duplication is a known cost.
- **Duplicated Code (stories)**: `Table.stories.tsx` repeated the wide table's column and value
  arrays. **Fixed**: hoisted into `wideColumns` and `wideValues`.
- **Mysterious Name**: spec helpers `at(...)` and `sizes(...)`. **Fixed**: `partsOrderedBy` and
  `measureAs`.
- **`null` in refs** against `coding.md` § Absence: precedent is split (`Input`/`TextArea` use
  `useRef<T>(null)`, `Dialog`/`MultiSelect` use `undefined` with a callback). Left as is; a house
  pattern to pick once, outside this ticket.
- Two new `biome-ignore lint/a11y/useAriaPropsSupportedByRole` suppressions carry the same
  justification as the nine existing ones; the alternative duplicates the element. Accepted.
- `ScrollContainer` sits in `Layout/`, which `architecture.md` defines as "owns a page job"; it owns
  scrolling. No category fits cleanly and Layout is nearest. Accepted.

Checked and compliant: ADR 0003/0004 amendments match the code (radius and face in the shared
`face` string, `plain` carries no `rounded-*`, four explicit `inherit`s); ADR 0002 ring with
`outline`, colour at rest, on both new focusable wrappers; ADR 0008 (no token-role prop added);
ADR 0013 (`onClick$` only `.next()`ed); closed prop surface, `testId`, explicit `children`, no
English defaults; one `cva()` per painting element; barrel adds two component lines and no props
interface; hooks only where measurement needs them; CONTEXT.md vocabulary matches.

## Spec axis

Source: the agent brief on #114 (identical to the issue comment, fetched with all comments).

Missing or partial:

- **Heading-reference naming alternative.** Brief: "require either a nonempty accessible label or a
  reference to an existing heading, using the repository's naming conventions." Only `ariaLabel`
  exists. **Decided, not changed**: the repository's convention is the `ariaLabel` string
  (`Section` documents exactly why it takes a string and not a heading reference), the brief calls
  this an "implementation default", and a heading-id prop would be a new convention. Nonemptiness
  is not guarded at runtime, consistent with `Section` and `Table`'s caption.
- **Nested ScrollContainer story.** Brief: "standalone/nested ScrollContainer". Only a Table inside
  a ScrollContainer existed. **Fixed**: `Layout/ScrollContainer/NestedHorizontalInsideVertical`,
  one container inside another, each owning one axis; browser-verified below.
- **Browser-mode verification** was only claimed by the implementation report. **Re-verified** by
  this review in Chrome, light, dark and forced-colors; evidence below.

Not asked for:

- `ScrollContainer` insets its content by the focus ring's room. Needed so a focusable child flush
  with the edge keeps its ring (the implementer's browser run demanded it). **Documented** in the
  component description, which previously said only that it "takes no size of its own".
- The no-note-column `Table` wrapper now draws the shared focus ring (ADR 0002) where it previously
  showed the browser's default outline. Harmless and compatible; **recorded as a `NOTE:` footer**
  on `1375345` so the changelog says so.

Implemented but wrong:

- **Focus relocation.** Brief: "Re-evaluate scrollability after layout/content changes without
  relocating existing focus." Both hooks removed `tabindex` the moment the overflow went, including
  from a surface that itself held focus - which lets the browser fix focus up to `body`. Tests only
  covered focus on a descendant control. **Fixed test-first** in `1375345`: the stop outlives the
  overflow while the element is `document.activeElement` and is re-measured on its `blur`. Two new
  tests (Table, ScrollContainer) went red, then green.
- **Duplicate spoken name.** The Table-inside-ScrollContainer story and the docs example named the
  container `Parts` and the caption `Parts`, so two consecutive tab stops announced one name.
  **Fixed**: the container is `Parts catalogue`; the docs say why.
- **SSR default is "overflowing"**: before measurement every notes-mode Table and every
  ScrollContainer carries a tab stop. Deliberate (operable before hydration) and removed on the
  first layout effect. **Accepted**; the trade-off favours an operable scroll over a spare stop
  for the un-hydrated moment.
- `inline` on `plain` computes to `inline-block` (browsers blockify buttons), so the button moves to
  the next line as one unit while its own label wraps. The story's doc already says so. Cosmetic;
  **left as is**.

Verified satisfied: `ariaSort` → `aria-sort`, absent when omitted, all four values, never
behavioural; `overflow-x-auto` in every notes mode, no vertical bound, caption/scope/associations
and the no-notes path preserved; plain carries no face, fill, radius, padding, width floor, hover or
nowrap, inherits font/tracking/colour explicitly, disabled through `text-disabled`, default
`type="button"`, `ariaLabel`; primary/secondary/ghost class sets identical to before; Icon has
exactly three names, is `aria-hidden` and unfocusable, `1em`/`currentColor`, exported, no
size/colour/style props; ScrollContainer has three axes defaulting to `both`, no size props, is a
`group` not a `region`, intercepts no keys, re-evaluates on resize and content change, clips a
disabled axis, forwards nothing; the required stories all exist; no row-activation (#113) or
action-variant (#119) surface was touched; nothing out of scope was built.

## Fixes made by this review

`1375345` `fix: keep a scroll surface reachable while it holds focus, and tidy the #114 review findings`

- Focus retention in `Table` (notes modes) and `ScrollContainer`, test-first.
- New story `NestedHorizontalInsideVertical`; distinct names in the nested Table example.
- Comment budget, flattened describe, helper renames, hoisted story arrays.
- `NOTE:` footer for the focus ring on the no-note-column Table wrapper.

`3d758ab` `docs: move the #114 composition guide from the README into Storybook`

- On the coordinator's relayed instruction that components are not documented in the README, the
  section added by `787ea50` was removed and its content placed as
  `parameters.docs.description.component` on the Table, ScrollContainer, Button and Icon stories
  (the format `Select`, `MultiSelect` and `NumberInput` already use). The consumer guidance - the
  header composition example, the ScrollContainer parent-layout requirement, the clipping warning,
  the naming advice for a Table inside a container - is reachable on the four docs pages
  (`Display/Table`, `Layout/ScrollContainer`, `Interaction/Button`, `Display/Icon`). Component
  TSDoc is unchanged.

## Compatibility

Verified against the merge-base, not from the commit messages:

- `src/index.ts` diff is two added lines (`Icon`, `ScrollContainer`); nothing removed or renamed.
- `Button`: `variant` gains `plain`; the rendered class set of `primary`, `secondary` and `ghost`
  is pinned unchanged by tests, and the browser shows primary at 17px, 8px radius, `8px 24px`
  padding and a 168px floor as before. No prop changed.
- `Table.HeaderCell`: `ariaSort` added, optional. `Table.Root` with no note column: same `section`,
  same name, same permanent tab stop; it now draws the library focus ring instead of the browser
  default outline (noted). With a note column: the wrapper scrolls residual horizontal overflow and
  is a named group with a tab stop only while overflowing (the feat commit's `NOTE:`); a table that
  fits renders as before.
- No token added, removed or renamed (`src/tokens*.css`, `src/styles*.css` untouched). No
  required prop changed. No breaking marker in any commit; no `!` type. Minor release at most.
- The README lost a section this branch had added; nothing that existed on `main` changed.

## Checks

After the final commit, at `3d758ab` (and again by the pre-commit hook on each commit):

| Check | Result |
|---|---|
| `npm run lint` | green, 159 files |
| `npm run typecheck` | green |
| `npm run test` | 49 files, 908 tests green (906 at `c93c34b`, plus the two focus-retention tests) |
| `npm run build` | green |
| `npm run build-storybook` | green |

## Browser evidence

Static Storybook served on port 6115, driven with Playwright 1.63 (installed in the session
scratchpad) through Chrome 154 via `channel: 'chrome'`, isolated contexts. Facts read from
computed style, geometry and `document.activeElement`; screenshots and `facts.json` are in the
session scratchpad under `shots/` and are not committed.

- **ScrollContainer focus retention** (`VerticalInSizedParent`): Tab lands on the group with
  `outline: solid 3px, offset 2px`, 754px of content in 224px. Removing paragraphs until the
  content fits (124/124) leaves the element focused with `tabindex="0"` and `role="group"`; Tab
  away removes both and focus goes to body. Before the fix the stop was dropped while focused.
- **Table focus retention** (`ResidualOverflowWithNotes`): at 520px the wrapper overflows (757/488),
  is a group named `Material specification` and takes focus on Tab. Widening the viewport to
  1200px while focused: it fits (1168/1168) yet keeps `tabindex="0"` and focus with the 3px ring.
  Tab away: `tabindex` and `role` gone.
- **Nested ScrollContainer** (`NestedHorizontalInsideVertical`, light, dark, forced-colors): Tab
  order is the outer group `Specification`, the inner group `Column list`, then body. Two
  ArrowDown on the outer scroll it to 80px; it has no horizontal overflow of its own (448/448). Two
  ArrowRight on the inner scroll it to 80px (2377/438). Both rings are `solid 3px` in all three
  modes.
- **Table inside a vertical ScrollContainer** at 480px: Tab order is the group `Parts catalogue`,
  the Table's region `Parts`, then the header button `Part`; each with the 3px ring. The two names
  are now distinct.
- **Plain Button in a label row** (light and dark): font family, size (13px), tracking (1.82px)
  and colour equal the parent's; padding 0, radius 0, transparent background; focused: 3px ring,
  background and border unchanged. Disabled: colour equals the `disabled` token (`#94a3b8`),
  `cursor: not-allowed`, no fill. Primary unchanged (17px, 8px radius, `8px 24px`, 168px floor).
- **Icons** (`BesideText`, light, dark, forced-colors): 13×13 at 13px, 17×17 at 17px, 60×60 at the
  title size; `sort` has four path segments, the other two have two each, so the shapes differ;
  stroke colour equals the surrounding text in every mode; `aria-hidden="true"`,
  `focusable="false"`.
- **Storybook docs pages**: the four docs pages render the moved guidance (checked by text).

## Not verified / limitations

- Screen readers were not listened to; the DOM carries the roles, names and `aria-sort`.
- Only Chrome was driven. The focus-fixup behaviour the fix guards against is specified in HTML
  and jsdom does not implement it, so the unit tests prove the attribute, and the browser run
  proves the focus.
- Touch scrolling and Safari/Firefox keyboard scrolling were not driven.
- The class-string testing deviation and the duplicated hook are recorded, not resolved.

## Acceptance and publication

Implementation: every acceptance criterion in the brief is met on this branch, except the last one,
which is not an implementation criterion. Publication: **pending**. Nothing was pushed, merged,
published or versioned; no release version exists for this work. The brief's final criterion -
"Publish through the normal release process and record the actual released version in the consumer
ticket (juwel-dev/g-label-manager #195)" - belongs to a human and stays open. The ticket was moved
to **In Review** per the skill; `Done` is not this review's to set.
