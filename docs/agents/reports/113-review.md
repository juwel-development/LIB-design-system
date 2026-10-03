# Review: #113 Table selectable rows (feature/ticket-113, 3739997…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 3739997...HEAD` (merge-base with `main`; implementation commits `3e0cc29`, `a74b2b7`).
The spec source is issue [#113](https://github.com/juwel-development/LIB-design-system/issues/113)
with all comments; the approved Agent Brief comment supersedes the original wording (there is no
local `113-agent-brief.md`). Consumer context is
[juwel-dev/g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195).
Standards sources: the four `docs/agents/standards/*` documents, ADR 0013 (input streams), ADR 0002
(focus ring), ADR 0008 (token role as prop), `CONTEXT.md` (Table row selection / activation) and
`npm run fallow:agent -- --base 3739997`. Every finding was verified by hand before it was applied
or dismissed; fixes were driven test-first; the stories were re-inspected in a real Chrome against
the rebuilt Storybook.

**Status:** implementation reviewed and fixed; the accessible-selection gap below was **accepted by
the user** (option C) with the approved API unchanged; **no release has been published**. Nothing
here claims a version.

## Standards axis

Hard findings (documented standards):

1. **Comment over budget — `Table.tsx` row recipe** (coding.md § Comments: any block at most 4
   lines; cite the standard, never restate it). The `tableRow` comment had grown to 7 lines and
   restated the Tabs treatment. → **Fixed**: 4 lines, citing Tabs and docs/adr/0002.
2. **Comment over budget — `renderTokens.ts`**: the `TABLE_SELECTION_MARKER` block was 5 lines
   against the 4-line `TAB_MARKER` precedent. → **Fixed**: 4 lines. The rendered stylesheets are
   unchanged (the comment is TypeScript-side), so `tokens.css` stays pinned.
3. **Class-string assertion — `Table.spec.tsx`** (testing.md § Querying: never assert on the class
   string; the brief: "not private internals or CSS class snapshots"). The new test
   `keeps the selected and interactive treatments free of fills and hover` matched `className`
   against `/bg-/` and `/hover:/`. → **Fixed**: removed; the no-fill guarantee is a story and
   browser fact. The three pre-existing class assertions from the original Table ticket were left
   as outside this ticket's scope and are noted here.
4. **Member props interfaces not exported** (design-system-components.md § Compound components:
   each member's `I<Namespace><Member>Props` is exported from the module so the spec and stories
   can name it; `Tabs`, `Dialog` and `Sidebar` all do). Pre-existing, but this diff is where it
   bit: the spec re-declared the row's shape inline. → **Fixed**: all five interfaces exported
   (additive; the barrel still carries only `Table`), and the spec uses
   `Pick<ITableRowProps, 'onClick$' | 'isSelected$'>`.

Judgement calls (baseline smells):

- **Duplicated Code — spec**: the same `Root > Body > Row` tree was written five times (once in
  the render helper, four times in `rerender`). → **Applied**: one `rowTree(props, children)`
  builder serves both.
- **Speculative Generality — `isFromNestedControl`**: `target: EventTarget | null` for a React
  target that is never `null`, plus a `target === row` early return already covered by
  `control !== row`. → **Applied**: narrowed and simplified.
- **Dead story args**: every #113 story declared `args: { caption, notes }` that its `render`
  ignored, so the autodocs controls did nothing. → **Applied**: the roster takes
  `Pick<ComponentProps<typeof Table.Root>, 'caption' | 'notes'>` and every story renders
  `<ArtistRoster {...args} … />`; the scroll-region case is now simply `notes` unset.
- **Repeated `[&[aria-selected=true]>*:first-child]:` prefix** (7×): Tailwind offers no grouping
  for arbitrary variants. → Left as is.

Verified clean: `useState`/`useLayoutEffect` are the genuine effect ADR 0013 requires, with
teardown on replacement and unmount; `onClick$` is only `.next()`ed; behaviour lives in named
functions; the ring is the shared one from the ADR 0002 tokens and the ring-room rule matches
`Tabs.tsx:21-23`; no `dark:` classes, no raw values; no user-visible English in the component; one
recipe per painting member; the barrel is unchanged; the token is declared identically in all three
stylesheets and the renderer pin passes; spec names are behaviour sentences, queries are role-first,
no shared mutable fixtures; naming and `import type` follow the coding standard.

## Spec axis

Verified correct by reading and by the tests: both props optional and independent through the
existing namespace; pointer activation emits once; Enter and Space emit once each with `repeat`
suppressed and Space's default prevented; keys count only when the row itself is the target;
Enter/Space on a `tr` synthesise no click, so there is no click+keydown doubling; text-node targets
are retargeted to elements by the DOM; nested controls and their descendants are the control's;
`aria-selected` is rendered only when `isSelected$` is supplied and reads `false` until it emits;
a `BehaviorSubject` replaying inside the layout effect paints selected in the same commit;
replacement resets and unsubscribes (`observed` false); unmount unsubscribes; activation never
changes selection; rendering and selection changes never emit; removing `onClick$` keeps
selection and drops the tab stop; nothing out of scope was built (no arrow keys, registry,
`isHighlighted$`, disabled prop or escape hatch); all seven required story subjects exist.

Findings:

1. **Nested-control selector gaps** — the brief: "a nested link, button, or other interactive
   control, including descendants of such controls, performs its own operation without emitting
   row activation". The selector listed `button`, `link`, `checkbox`, `radio`, `switch`,
   `menuitem`, `tab` and `option` roles but not `combobox`, `textbox`, `searchbox`, `slider`,
   `spinbutton`, `menuitemcheckbox`, `menuitemradio` or `treeitem`; a role-only, unfocusable
   widget of one of those activated the row. → **Fixed test-first**: a failing test with a
   `role="menuitemcheckbox"` span, then the selector widened.
2. **"Byte-for-byte the same markup" was false** — see Compatibility. → **Fixed**: the
   implementation report now says what is true.
3. **Inline-created selection sources** — a consumer that builds `isSelected$` in render replaces
   the source every render and reads unselected until it re-emits (the reset the brief mandates).
   → **Applied**: one README sentence; the stories already memoise per identity.
4. **`aria-selected` on a plain table row** — the brief: "`isSelected$` drives both visible
   selection and appropriate accessible selection state without turning a noninteractive row into
   an activation target". Escalated with evidence and alternatives; **accepted as a limitation by
   the user**, see the next section.
5. **Long-label wrapping and visible focus have no DOM test** — accepted under the brief's own
   "inspect the stories … that DOM tests cannot establish visually"; re-measured below.
6. **The release criterion is not met** — expected; recorded under Publication.

## Accessible selection state — accepted limitation

Evidence gathered during this review:

- **Spec**: WAI-ARIA 1.2 (Recommendation) and the 1.3 editor's draft both list `aria-selected`
  under `row`'s Supported States and Properties and list `table` among `row`'s allowed parent
  roles; the only grid-gated properties are `aria-expanded`, `aria-posinset`, `aria-setsize` and
  `aria-level` (plus a planned prohibition of `aria-disabled`). `tr[aria-selected]` in a `table` is
  therefore spec-valid, and axe (wcag2a/aa, wcag21a/aa, wcag22aa, best-practice) reports 0
  violations and 0 incomplete on every #113 story.
- **Browser**: Chromium's real accessibility tree (CDP `Accessibility.getFullAXTree`, Chrome
  stable, headless) exposes **no `selected` state** on `tr[aria-selected="true"]` inside a
  `role=table`, with or without `tabindex`, nor on a `rowheader` carrying it; it exposes
  `selected=true` only when the table is `role="grid"`. MDN's row-role page says the same:
  aria-selected is "not relevant if the row is in a table". CDP cannot report `aria-current`
  exposure at all (its property enum has no `current`), so that path rests on documented support.
- **Consequence**: today a Chrome/Edge screen-reader user hears nothing from the attribute; the
  marker bar is the one guaranteed cue, and the library carries no words of its own.

Options put to the coordinator (all keeping `onClick$`/`isSelected$` and the `tr`/`th`/`td`
structure): (A) additionally render `aria-current="true"` on a selected row, a global state every
browser exposes and screen readers announce, with ARIA's "SHOULD NOT substitute for aria-selected
in widgets" and "SHOULD mark one element current" caveats stated; (B) `role="grid"` on a
selectable table, which Chromium exposes but which implies arrow-key cell navigation the brief puts
out of scope and replaces the table semantics the brief preserves; (C) keep `aria-selected` only
and document the gap, which the coordinator has rejected as acceptance.

A fourth option, a required consumer-translated `selectedDescription` exposed as the row's
accessible description while selected, was discussed by the coordinator and the user.

**Decision (user, relayed by the coordinator)**: option C — keep native table semantics and
`aria-selected` only; no `selectedDescription`, `aria-current`, grid role or other new prop; the
approved API remains `onClick$`/`isSelected$`. The gap is accepted: Chrome does not expose the row's
selected state to assistive technology. It is recorded as an accepted limitation in the Storybook
component description, the `Table` TSDoc and this report, not as a satisfied criterion.

## Fixes applied

| Commit | Scope |
|---|---|
| `b179fbb` | `fix(table): apply the #113 review's standards and spec findings` — selector roles, exported interfaces, comment budgets, spec cleanup, story args, README sentences, report correction |
| `2fc6b74` | `docs(table): move the Table guidance from the README into Storybook (#113)` — the component description on the `Display/Table` meta now carries the consumer guidance and the accepted accessibility limitation; README has no Table section; TSDoc gains the limitation |

**Documentation location.** Consumer guidance for `Table` lives in Storybook: the `Display/Table`
docs page (`parameters.docs.description.component` on the stories meta) plus the `Table` TSDoc
reachable from the editor. The README carries no component section for Table, per the user's
instruction that components are not documented in the README.

## Checks (after the fixes)

| Check | Result |
|---|---|
| `npm run lint` | clean (153 files) |
| `npm run typecheck` | clean |
| `npm run test` | 47 files, 868 tests passing (29 in `Table.spec.tsx`) |
| `npm run build` | components and types built |
| `npm run build-storybook` | built |
| pre-commit hook | passed on the fix commit |

## Browser evidence (after the fixes)

Built Storybook served from this worktree's `storybook-static` on port 6313 (free before binding)
and driven with a scratch Playwright against the installed Chrome (headless, viewport 1100×800),
every locator scoped to `#storybook-root`. Figures are from the live DOM.

- **Pointer and keyboard**: Tab reached `row-nova` (`:focus-visible` true, outline
  `solid 3px rgb(71,85,105)`, offset `2px`); Enter selected it and the readout updated.
- **Marker**: the selected first cell's `::before` is `absolute`, `2px solid rgb(15,23,42)`
  (light `foreground`), `top 0 / bottom 0` across the 39.5px row; with the `.dark` class it is
  `rgb(248,250,252)` = dark `foreground`.
- **Inset**: every first cell of a selectable table, head row included, has `padding-left 16px`;
  the static story keeps `0px`, no `tabindex`, no `aria-selected`.
- **Long labels** (`notes` unset): the Root is a `section` scroll region with `padding 5px` /
  `margin -5px`; the selected row grew to 84.5px with the marker spanning it; the focused row's
  ring (5px outward) fits inside the region on every side.
- **Nested controls**: Sign logged the row action and selection stayed on `row-nova`; the name
  link set `location.hash` without moving selection; a click on the row body then selected
  `row-kestrel`.
- **Threaded args**: every #113 story renders the caption `Artists on the roster` and the note
  column exactly as its `args` say.
- **axe-core** on `interactive-rows`, `selected-without-activation`,
  `independent-nested-controls`, `long-labels` and the static `supplementary-notes`: 0 violations,
  0 incomplete.
- **Accessibility tree**: see the open decision above — no `selected` state is exposed on any
  row of a plain table.

Firefox could not be driven (no matching Playwright build in the cache); no screen reader was run.

## Compatibility

Additive minor change, verified against `git show 3739997:src/Display/Table/Table.tsx`:

- A static table (no `onClick$`, no `isSelected$`) renders the same elements and attributes as
  before — no `tabindex`, `aria-selected` or handlers — and the same geometry and paint (the
  static story measures `0px` first-cell inset and no ring room). The **only** difference is the
  `class` string of the wrapper (four `:has()` utilities) and of each `tr` (seven
  `[aria-selected=true]` utilities), all gated on selectors that cannot match in a static table.
  A consumer snapshotting Table markup will see that diff; nothing behavioural changes.
- No existing prop changed type, requiredness or default; `Table.Row`'s two props are optional.
  `src/index.ts` is unchanged. No token renamed or removed; one added. The five member props
  interfaces are now exported from the module (additive; not in the barrel).
- `Observable`/`Subject` come from the existing `rxjs` peer.
- The branch's commit messages carry no `!` and no `BREAKING CHANGE:` footer; `feat` plus `fix`
  resolves to a minor release when published.

## Publication — pending

Implementation and review are complete on `feature/ticket-113`; **no release has run** and no
version is recorded here or in the consumer ticket. Publishing is the human's step through the
normal release process; the released version is to be recorded in g-label-manager #195 afterwards.
The ticket has not been moved to In Review by this worker (the brief forbids status changes).

## Limitations

- Chrome and Edge do not expose the row's selected state to assistive technology on a plain
  table; accepted by the user as described above.
- `:has()` carries the inset and ring-room rules; browsers without it (Firefox < 121) render the
  marker over the flush first cell and may clip the ring in the scroll region.
- `notes="content"` below 48rem stacks cells, so the marker spans the stacked first cell only.
- The three pre-existing class-string assertions in `Table.spec.tsx` predate this ticket.

## Main integration

Merged with #114 sorting/scrolling and #120 typography. Preserved both sets of Table stories and contract tests; component guidance remains in Storybook. Build, lint, typecheck, all 1,106 tests, and Storybook build pass. A headless Chrome check on the combined main confirms keyboard row selection, nested actions leaving selection unchanged, sortable header metadata, and horizontal scroll composition. The user accepted the documented Chromium screen-reader selection gap; no additional selection-description API was introduced.
