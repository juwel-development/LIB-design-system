# Review: #117 Box (feature/ticket-117, 3739997…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 3739997...HEAD` (the merge-base with `main`; one commit under review, `5992222`), with
issue [#117](https://github.com/juwel-development/LIB-design-system/issues/117) and its approved
Agent Brief (the triage comment, which supersedes the issue body's provisional "Panel" name and
reuse option; no local `117-agent-brief.md` exists) as spec sources, and `docs/agents/standards/`
(coding, architecture, testing, design-system-components), ADRs 0003, 0008 and 0012, `CONTEXT.md`
and the Fowler smell baseline as standards sources. `npm run fallow:agent -- --base 3739997` gave
the reading order (Theme → index → Box) and flagged one new `biome-ignore`. Every finding was
verified by hand against the files and precedents before it was applied or dismissed; the
confirmed ones were fixed test-first in `1b86e1b`. Date: 2026-10-03; reviewer: an Orca worker
(Claude Fable 5.1), separate from the implementer. The consumer context is
[g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195).

## Standards axis

Hard findings (documented standards):

1. **`BOX_INSET` comment over budget and restating ADR 0008** (coding.md § Comments: any block
   at most 4 lines; "cite the standard, never restate it") — the block in
   `src/Theme/renderTokens.ts` ran five lines and re-explained the token-role test ("one role in
   the position, so the recipe fixes it") that ADR 0008 already states. → **Fixed**: four lines,
   citing ADR 0008 by name and keeping only the evidence the code cannot recover (why one role,
   why `em`, the value constraint).
2. **Recipe comment in `Box.tsx` carrying a second copy of the `@Guarantees`** (coding.md
   § Comments: "a second copy drifts"; the block also ran six lines against the four-line budget
   for a non-header block) — the radius/elevation sentence duplicated the first Guarantees
   bullet. → **Fixed**: four lines keeping the load-bearing part (`min-w-0`, `overflow-wrap:
   anywhere`, nothing hidden) and the one fact the TSDoc does not state (square corners are the
   absence of a utility, not a reset).
3. **`getByTestId` where a role query expresses it** (testing.md § Querying: "reach for
   `getByTestId` only when neither [role nor text] can express it") — the no-focus-stop rerender
   and the consumer-controls test both named the box and still reached it by test id. →
   **Fixed**: both query `getByRole('group', { name })`; the unnamed and empty tests keep `testId`,
   which is the one case a role cannot express.

Dismissed after verification:

- **Class-string assertions in `Box.spec.tsx`** (`toContain('var(--space-box-inset)')` and the
  `/\bdark:/` loop) breach the letter of testing.md's "never assert on the class string" but are
  the repo's established exception: `Cluster.spec.tsx` and `Stack.spec.tsx` pin
  `gap-[var(--space-*)]` the same way, `Collection.spec.tsx` carries the identical `dark:` test,
  and jsdom resolves no stylesheet, so the token binding is the only thing a unit test can pin.
  The rendered inset is measured in the browser evidence below. Left as is.
- **Two-branch render** (Duplicated Code, judgement call) — `Brandmark.tsx` uses the same
  two-branch idiom for the same reason: `useAriaPropsSupportedByRole` fires on a conditional
  `aria-label` beside a conditional `role`, and the `no-jsx-spread` plugin forbids a computed
  attribute bag. The repo overrides the smell. Left as is.
- **`[…].join(' ')` cva base** — the house idiom in thirteen other recipes. Clean.
- **`biome-ignore lint/a11y/useSemanticElements`** — justification accurate (a fieldset's UA
  `min-inline-size: min-content` would stop the box shrinking in a narrow holder) and consistent
  with `MultiSelect.tsx:677`. Clean.
- **`COLLECTION_SPACING` beside `BOX_INSET`** — non-parallel names for parallel constants; both
  honest. Cosmetic, left.

Verified clean: closed props with `IBoxProps` in the module and one barrel line; no library
wording; no hooks; `undefined` never `null`; non-relative imports; spec and stories colocated;
`Display/` is the right category (CONTEXT.md's Arrangement entry has "no fill" and lists *box*
under *Avoid*); `--space-box-inset` sits in `:root` outside every `@theme` block in all three
stylesheets, rendered by `scripts/build-tokens.ts` from one `renderTokens` source and pinned by
`renderTokens.spec.ts`; README section mirrors Collection's shape and no token table exists to
extend; stories follow `Collection.stories.tsx`'s decorator and `*Dark` pattern under
`withThemeByClassName`.

## Spec axis

Verified correct, criterion by criterion: `Box` exported with exactly `children?`, `name?`,
`testId?` (the generated `dist/types` at HEAD differs from the merge-base by one `export { Box }`
line and one new `Display/Box` directory, nothing else); `role="group"` plus `aria-label` when
named, neither when unnamed, no heading rendered from the name, no `tabindex` either way; the
spec covers children, naming, named-group semantics, unnamed rendering without a landmark, empty
rendering, no focus stop, consumer `Input` and `Button` focusing, changing and emitting; surface,
foreground and border read `--color-*` roles re-pointed under `.dark`; one inner-padding role
declared in `tokens.css`, `tokens.light.css` and `tokens.dark.css` (the set of custom properties
grew by exactly that one name in each file) and documented in the README and TSDoc; no
`rounded-*` or `shadow-*` utility; Tailwind preflight's global `box-sizing: border-box` puts
border and padding inside the allocated width; `min-w-0`, no height, no overflow; the seven
mandated stories exist, the narrow one an 18rem holder inside the wide viewport; the eight
`*Dark` stories and `InsetRePointedByTheme` each answer an acceptance criterion rather than
widen scope; `PaletteTokens` untouched; no Section or Stack file touched; no heading, sizing,
radius, shadow, scrolling, collapse or CSS escape hatch.

Findings:

1. **An empty `name` exposed a group with nothing to announce** — the brief says "Without a
   name, render an ordinary enclosure without an added landmark"; `name=''` rendered
   `role="group" aria-label=""`, which is a nameless group. `Brandmark` already treats an empty
   `name` as no name. → **Fixed** test-first (`treats an empty name as no name…` went red on
   the missing branch, then green): `name === undefined || name === ''` renders the plain
   enclosure; the TSDoc and README say "non-empty".
2. **"Consumer controls retain their ordinary keyboard behaviour" was proven by focus and
   click, not by a key** — the test focused the controls programmatically and fired `change` and
   `click`. → **Fixed**: a new test fires `Tab`, `Enter` and `Space` keydowns on the `Input` and
   `Button` inside a named box and asserts none is default-prevented and focus stays where the
   browser put it, which is what "the box intercepts no key" means in jsdom. The Guarantees
   bullet now says "adds no focus stop or listens for a key".
3. **`overflow-wrap: anywhere` inherits into descendants** — accurate in the implementation
   report's Limitations and not a spec breach (the brief assigns overflow to the content that
   owns it), but the README's content-overflow boundary did not say so. → **Fixed**: one clause
   in the README's wrapping paragraph names the inheritance.

Open by design, not defects: publication and recording the released version in consumer #195
are deferred to the human release (below); test-first authoring order cannot be established from
one squashed commit, so it is taken from the implementation report.

**Summary** — Standards: 3 fixed, 5 dismissed with precedent; worst was the restated ADR in the
token comment. Spec: 3 fixed, 0 missing; worst was the empty-name group. No finding on either
axis touched a public contract.

## Fixes

`1b86e1b` `fix(box): treat an empty name as no name and prove key pass-through (#117)`:

- `src/Display/Box/Box.tsx` — empty `name` renders the plain enclosure; Guarantees and prop TSDoc
  say non-empty and "listens for no key"; recipe comment trimmed to four load-bearing lines.
- `src/Display/Box/Box.spec.tsx` — empty-name test; key pass-through test; named boxes queried
  by role (12 tests, was 10).
- `src/Theme/renderTokens.ts` — `BOX_INSET` comment trimmed to four lines citing ADR 0008; the
  rendered stylesheets are unchanged (`npm run build:tokens` leaves the tree clean).
- `README.md` — naming paragraph covers the empty string and keys; wrapping paragraph names the
  `overflow-wrap` inheritance.

## Compatibility

Verified, not inferred from the commit message. Declarations were generated at the merge-base
and at HEAD (`tsc -p tsconfig.build.json --emitDeclarationOnly`) and diffed: the only differences
are `export { Box } from 'Display/Box/Box'` in `index.d.ts` and the new `Display/Box/Box.d.ts`.
The custom-property names in each of the three shipped stylesheets grew by exactly
`--space-box-inset`; no name moved or changed value. `PaletteTokens` has no new member, so a
consumer constructing a palette or spreading `light`/`dark` compiles unchanged. The branch has
no deletion in `src/` apart from the review's comment trims. Release type: `feat` plus `fix`,
so a minor; no breaking marker, no removed token, no changed required prop.

## Checks

Run after the fixes, at `1b86e1b`:

| Check | Result |
|---|---|
| `npm run lint` | clean, 156 files |
| `npm run typecheck` | clean |
| `npm test` | 48 files, 868 tests passed (866 before the review, +2) |
| `npm run build:tokens` | no change to the three stylesheets |
| `npm run build` | `dist/design-system.js`, `dist/index.css`, `dist/types/` built |
| `npm run build-storybook` | built to `storybook-static` (not committed) |

## Browser evidence

Measured in headless Chrome driven by Playwright from the scratchpad (own server, port 6217,
isolated context, per the coordinator's parallel-verification note) against the static Storybook
build at `1b86e1b`, viewport 1400×900 plus a 360×800 pass, through `getBoundingClientRect`,
`getComputedStyle` and `Range.getClientRects` on the rendered box and its paragraphs - never
through class assertions. The narrow holder is the story's 18rem decorator inside the wide
viewport, so viewport width cannot satisfy the check. Every row below was identical in light and
dark apart from the palette values.

| Story | Viewport | Holder | Box | Height | Padding | Border | Radius / shadow | Role |
|---|---|---|---|---|---|---|---|---|
| Empty | 1400 | 1368 | 1368 | 34.0 | 16 ×4 | 1px solid | 0 / none | none |
| Short | 1400 | 1368 | 1368 | 61.2 | 16 ×4 | 1px solid | 0 / none | none |
| Long | 1400 | 1368 | 1368 | 115.6 | 16 ×4 | 1px solid | 0 / none | none |
| Long | 360 | 328 | 328 | 333.1 | 16 ×4 | 1px solid | 0 / none | none |
| Narrow | 1400 | 288 | 288 | 205.1 | 16 ×4 | 1px solid | 0 / none | group "Selected artist" |
| Named | 1400 | 1368 | 1368 | 112.4 | 16 ×4 | 1px solid | 0 / none | group "Selected artist" |
| Unnamed | 1400 | 1368 | 1368 | 61.2 | 16 ×4 | 1px solid | 0 / none | none |
| Stack + heading + facts | 1400 | 1368 | 1368 | 393.3 | 16 ×4 | 1px solid | 0 / none | group "Selected artist" |
| Stack + heading + facts | 360 | 328 | 328 | 463.8 | 16 ×4 | 1px solid | 0 / none | group "Selected artist" |
| Inset re-pointed to `3em` | 1400 | 1368 | 1368 | 125.2 | **48 ×4** | 1px solid | 0 / none | none |

Light paints `#ffffff` surface, `#0f172a` text, `#e2e8f0` border; dark paints `#0f172a`,
`#f8fafc`, `#334155` under the `.dark` class. In every row `box-sizing` is `border-box`, the
box's left and right edges lie within its holder's, `min-width` is `0px`, `max-width` is `none`,
`overflow` is `visible`, `overflow-wrap` is `anywhere`, `scrollWidth ≤ clientWidth` and
`scrollHeight ≤ clientHeight`, and no `tabindex` is present. The unbroken name in the narrow
story wraps onto three line boxes whose right edges (280, 246 and 75 px in page coordinates) all
sit inside the content edge at 287 px (the box's right edge at 304 minus border and padding); the
long prose wraps
onto three lines at 1400 and eleven at 360, every line box inside the padding edge. Height is
content-driven: 34 → 61 → 116 → 393 px as content grows, 333 and 464 px when the same content is
squeezed to 360. Under the override wrapper the computed `--space-box-inset` reads `3em` and the
padding moves to 48 px on all four sides while every other value stays put.

Screenshots and the measurement script live in the session scratchpad only.

## Publication

Implementation and review are complete on `feature/ticket-117`; nothing was pushed, merged or
released, and the issue was moved to **In Review** on the board (it was already there). The
released version is not known here and has not been recorded in consumer #195; that is the
human publisher's step, and no version is invented in this report.
