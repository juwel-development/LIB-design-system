# Composable table actions, sort icons, plain buttons and ScrollContainer: implementation evidence (#114)

Date: 2026-10-03. Implemented by an Orca worker (Claude) on branch `feature/ticket-114`,
cut from local `main` at `3739997` (package 3.9.1), against the approved
[agent brief](./114-agent-brief.md). Nothing was pushed, merged, published or versioned;
review and release stay with the coordinator and a human. This report records what shipped and
how it was verified, including what was **not** verified. Implementation readiness and
publication are separate: no release version exists for this work yet.

## What shipped (commit `787ea50`)

- `Table.HeaderCell` gains `ariaSort?: 'none' | 'ascending' | 'descending' | 'other'`, mapped to
  `aria-sort`, absent when omitted. Table holds no sort state, emits no sort stream and never
  reorders rows. `Table.Root` scrolls residual horizontal overflow in every `notes` mode
  (`overflow-x-auto` on the wrapper, no opt-in) and sets no vertical bound. With no note column
  the wrapper is unchanged: a named `section` with a permanent tab stop. With a note column it
  stays a plain `div` while the table fits and becomes `role="group"`, `aria-label={caption}`,
  `tabindex="0"` only while the table overflows it, re-measured by `ResizeObserver` on the
  wrapper and the table plus a window `resize` fallback, without moving focus.
- `Button` gains `variant="plain"`: `inline p-0 min-w-0 bg-transparent`, with `font`,
  `letter-spacing`, `color` and `text-align` set to `inherit`, `disabled:text-disabled`, and the
  shared outline focus ring and colour transition from the base. The face (`font-primary
  text-body rounded-[var(--radius-control)] py-2 … inline-flex gap-2`) moved from the base into
  one string `primary`, `secondary` and `ghost` share verbatim; their rendered classes are
  pinned unchanged by tests. `ghost` is untouched.
- `src/Display/Icon/Icon.tsx`: `Icon` with `name: 'sort' | 'sort-ascending' | 'sort-descending'`
  and `testId`. Inline SVG, `aria-hidden`, `focusable="false"`, `width`/`height` `1em`,
  `currentColor` strokes, no colour or size prop. Exported from `src/index.ts`.
- `src/Layout/ScrollContainer/ScrollContainer.tsx`: `ScrollContainer` with required
  `ariaLabel`, `axis?: 'both' | 'horizontal' | 'vertical'` (default `both`), `children`,
  `testId`. `overflow-auto` / `overflow-x-auto overflow-y-hidden` / `overflow-y-auto
  overflow-x-hidden`; `max-h-full max-w-full min-h-0 min-w-0` and no size of its own. A named
  `group` with `tabindex="0"` only while an enabled axis overflows, measured as above. The
  content box is `w-fit min-w-full` when the horizontal axis is enabled (so a resize observer
  sees unwrappable content grow) and `w-full` when only vertical is enabled (so a Table inside
  keeps its own horizontal scroll region); it is inset by
  `calc(var(--focus-ring-width) + var(--focus-ring-offset))` so a focusable child flush with the
  edge keeps a visible ring. Exported from `src/index.ts`.
- Docs: amendments to ADR 0003 and ADR 0004 record `plain` as the one accepted exception to the
  universal corner, face and size; the composition and the parent layout `ScrollContainer` needs
  are documented in Storybook as each component's description (moved there from the README by
  the review, `3d758ab`). `CONTEXT.md` already carried the glossary entries.
- Stories: `Display/Icon` (Sort, SortAscending, SortDescending, BesideText); `Interaction/Button`
  (Plain, PlainInProse, PlainInLabel, PlainDisabled, PlainIconOnly); `Display/Table`
  (SortableHeaders, SortableHeadersDelayedResponse, ResidualOverflowWithNotes,
  InsideVerticalScrollContainer); `Layout/ScrollContainer` (VerticalInSizedParent,
  HorizontalWideContent, BothAxes, NoOverflow, DisabledAxisClips, InteractiveContent,
  FlexColumnParent, GridParent, UnboundedParent).

## Test evidence

Every behaviour was written red first, then made green (Icon and Button plain together, then
Table and ScrollContainer together, then two ScrollContainer fixes the browser run demanded).
Full suite: 49 files, 906 tests green; `npm run lint`, `npm run typecheck`, `npm run build` and
`npm run build-storybook` green; the pre-commit hook ran all three gates on the commit.

- Icon: hidden and unfocusable for every name; three distinct path sets; `1em` and
  `currentColor`; adds no name inside a button; renders no text.
- Button: plain keeps default `type`, click output and disabled gating; carries none of the face
  (no `font-primary`, `text-body`, `rounded-`, fill, padding, width floor, hover, nowrap); states
  inheritance explicitly; disabled through `disabled:text-disabled`; icon-only naming through
  `ariaLabel`; the four variant-wide contracts (elevation, motion token, outline ring, ring colour
  at rest) now run over `plain` too; the three faced variants pin their previous classes.
- Table: every `ariaSort` value; absent by default; updates and removal without reordering;
  `overflow-x-auto` and no vertical bound in all three modes; notes wrapper plain while fitting,
  named reachable group while overflowing, re-evaluated on resize with focus kept on a header
  button. The existing no-note-column region test is unchanged.
- ScrollContainer: renders children; no stop and no group while fitting; named group with stop
  on overflow, static content included; the six axis/overflow combinations; axis classes; no
  height, width or viewport unit; re-evaluation on resize keeps focus; no key interception and
  no trap; `w-full` content box for `vertical`; ring-room padding.

## Browser evidence

Static Storybook served on port 6114 and driven with Playwright (installed in the scratchpad,
Chrome via `channel: 'chrome'`, isolated contexts). Screenshots and `facts.json` are in the
session scratchpad under `shots/`. Facts read from computed style and geometry:

- Plain in a header label (light and dark): font-family, font-size (13px), letter-spacing
  (1.82px) and colour equal the parent's; padding 0, border-radius 0, transparent background,
  no hover decoration; after Tab the button holds focus with `outline: solid 3px`, offset 2px,
  and no background or border change. Disabled: `color` is the `disabled` token in both themes,
  `cursor: not-allowed`. Primary is unchanged (17px, 8px radius, `8px 24px`, 168px floor).
- Plain in prose: inherits 17px face and colour; moves to the next line as one unit (Chrome
  computes `display: inline` on a button as `inline-block`); its own label wraps when it alone
  exceeds a line. Recorded in the story's doc.
- Icon beside text in light, dark and forced-colors: each glyph is 13×13 at 13px, 17×17 at 17px,
  60×60 at the title size, stroke equals the surrounding text colour in every mode; the three
  shapes read distinctly at 4× zoom.
- Sortable headers: initial `Part` ascending; pointer on Part flips to descending and rows
  reverse; pointer on Height moves `aria-sort` to Height alone; Tab then Enter on Width sorts by
  Width; the header button's computed face, size, tracking and colour equal the header cell's;
  the focus ring wraps label and icon; the Actions header has no `aria-sort` and no button.
  Delayed response: 300 ms after activation `aria-sort`, rows and icon are unchanged and the
  consumer's live region says it is waiting; 1.9 s later all three have moved together.
- Residual overflow with notes: at 1200px the wrapper fits (1168/1168) with no `tabindex` and
  no role; at 520px it overflows (757/488), is `role="group"` named by the caption with
  `tabindex="0"`, takes focus on Tab, scrolls to 80px on two ArrowRight presses and draws
  `outline: solid 3px`. Resizing 1200→520→1200 in one page toggles the stop on and off.
  `supplementary` at 420px still hides the note cell; `content` at 420px still stacks rows; the
  no-note-column region is still a `section` with `tabindex="0"`.
- ScrollContainer: vertical in a 14rem parent is 224px tall over 744px of content, focused on
  Tab with the 3px ring, scrolled to 276px by two ArrowDown and one PageDown; horizontal scrolls
  to 80px on ArrowRight with vertical hidden; both axes scroll both ways; no-overflow has no
  stop and Tab lands on body; disabled-axis clips (overflow-x hidden, 2367px content in 448px)
  while vertical scrolls; flex-column and grid parents both bound it at 225px over 744px and
  scroll; unbounded parent grows to its content with no stop; paragraphs wrap at 2 lines in
  every case. Interactive content: Tab order is container, Action 1…10, body, container, so
  nothing is trapped. Appending 20 paragraphs to a fitting container turns the stop on without
  a reload.
- Table inside a vertical ScrollContainer at 480px (light, dark, forced-colors): Tab order is
  the outer group, the Table's region, then the header buttons; ArrowDown scrolls the outer to
  80px; ArrowRight scrolls the region to 119px; the outer has no horizontal overflow of its own
  (448/448) while the region overflows (644/438); the outer's ring, the region's ring (its
  vertical edges, thanks to the ring-room inset) and the button's ring are all drawn at 3px in
  every mode. Before the two fixes the region never overflowed (the content box grew to the
  table's minimum width) and its ring was clipped; both are covered by tests now.

## Not verified / limitations

- Screen-reader announcements were not listened to; the DOM carries the right roles, names and
  `aria-sort`, which is what jsdom and the browser can show.
- Safari and Firefox were not driven; only Chrome. Keyboard scrolling of a focused overflow
  element is native in all three, but no run proves it here.
- The no-note-column Table keeps its permanent tab stop, as before; making it conditional like
  the notes modes would change existing default behaviour and was left out on purpose.
- Horizontal overflow stories were verified at fixed viewports; touch scrolling was not driven.

## Compatibility

No public API was removed or changed in meaning. New: `Icon`, `ScrollContainer`,
`Button variant="plain"`, `Table.HeaderCell ariaSort`. Behaviour change, recorded as a `NOTE:`
in the commit: a Table with a note column now scrolls residual horizontal overflow and, only
while overflowing, is a named group with a tab stop; a table that fits renders as before. No
token was removed; no required prop changed; no breaking marker.
