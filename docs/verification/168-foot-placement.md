# #168 optional bottom placement for a Pane foot — 2026-11-07

Authority: the approved Agent Brief,
[#168 comment 6710426065](https://github.com/juwel-development/LIB-design-system/issues/168#issuecomment-6710426065),
read with the issue body through `gh issue view 168 --comments`. Base revision: `ddd821c`
(published 4.3.0). Read: CONTEXT.md, the four standards, and ADR 0008 with its Amendments. The
approved triage changes to CONTEXT.md (*Pane foot placement*) and ADR 0008 (the #168 amendment) are
part of this change. #167's paused optimization is not part of it.

## What was built

| Surface | Change |
| --- | --- |
| `Pane.Foot` | Optional `placement?: 'after-body' \| 'bottom'`, default `after-body`. `bottom` gives Foot an auto top margin, so spare allocated height sits above Foot and Foot's bottom edge meets Root's inner bottom. Its props are now `IPaneFootProps`; Head keeps `IPaneSectionProps`. |
| TSDoc / Storybook | Pane's guarantees and obligations name the option, its default and fallback precedence. *Layout/Pane* gains six stories with measured plays. The new *Layout/Pane Foot Placement* docs page describes the option and carries the representative Release planning fixture. |
| `scripts/browser/foot-placement.mjs` | Browser acceptance runner in parts: plays, matrix, fallback, lifecycle, baseline. |

No new component, barrel line, token, private marker or JavaScript. Body, Root, the Screen fit
measurement and Dialog are unchanged. The only stylesheet difference from 4.3.0 is the one
`.mt-auto{margin-top:auto}` rule (diffed `dist/styles.css`).

### Why an auto margin

With `bottom`, a flex auto margin takes only free space in Root's column. That has these effects:

- Body keeps its content height and its `flex: 0 1 auto` shrink. A short body gains no overflow,
  so it gets no group or stop, and an overflowing body has no free space to give, so the margin
  is 0.
- Content-height parents (unsized, stacked, Dialog's content extent, Screen fallback) leave no
  free space, so the default placement and the bottom placement lay out identically there.
- Screen's fit check sums the boxes' heights, not margins. Fallback release and restoration
  therefore decide exactly as before.

The placement positions Foot's box. The action itself meets the corner when it is the foot's
last, lowest box. In the motivating `Cluster justify="between"` composition it is: one line holds
the heading/count group and the Button, and the Button's padding descends furthest. Pane's
`@CallerMustEnsure` states this obligation.

## Tests

- **jsdom (`Pane.spec.tsx`, +5).** Omitted placement renders the same markup as `after-body`.
  Switching after-body → bottom → after-body → bottom keeps the Foot node and the Head input, with
  its focus, typed value and selection (2–6). A short body with a bottom foot has no group and no
  tabindex. An overflowing body with a bottom foot has exactly one named stop. `placement` is a
  closed choice: `"flex-end"` and a Head `placement` fail typecheck (`@ts-expect-error`).
  **Red first:** typecheck failed on the missing prop. jsdom has no layout, so the placement's
  geometry is red-tested in the browser (below).
- **Story plays, red then green.** Before the margin was added (variant mapped to `''`),
  *FootAtBottom* failed by 419.55px and *FootAtBottomEmptyBody* by 446.73px at 1280×720
  (`AssertionError … to be less than or equal to 1`). *FootAtBottomLongBody* and
  *FootAtBottomUnsized* passed at both revisions, as expected: there is no spare height there.

## Browser evidence

Reproduction:

```sh
npm run build
npx storybook dev -p 6168 --ci
# base stylesheets for the omission proof (scratch, not committed):
git archive ddd821c | tar -x -C <dir> && ln -s "$PWD/node_modules" <dir>/node_modules
(cd <dir> && npx vite build --config vite.styles.config.ts)
SCREEN_STORYBOOK_URL=http://localhost:6168 FOOT_PLACEMENT_BASELINE=<dir>/dist \
  npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/foot-placement.mjs
```

Runtime: Chromium 156.0.8078.4 (Playwright 1.64.1, headless), macOS, 100% zoom, 16px root,
scrollbars visible (the runner drops Playwright's `--hide-scrollbars`). Normal Playwright deadlines,
no mocked geometry. The host was shared with other worktrees (load 15–35).

"Corner gap" is Root's rectangle minus its computed bottom/right border and padding, minus the
action Button's rectangle. 0 = the Button's own box is at the inner corner.

### Plays — 32/32 pass

Each story was run at 1920×1080 and 1280×720:

- the six new Pane stories (short, empty, long, child-owned ScrollContainer, bounded Table and
  unsized);
- the six existing Pane stories (short, long, child-owned, stacked, bounded Table and stepped
  bounded Table);
- the four Release planning plays.

The new plays cover these points:

- **Corner:** the action's corner gap is ≤1px.
- **Scrolling:** there is no document scroll. A short or empty body has no group, no tabindex and
  no overflow, and the body-to-foot distance exceeds the slot gap.
- **Long and child-owned bodies:** these keep one scroll owner. The body itself (tabindex 0) or
  the ScrollContainer scrolls, and focusing the last entry scrolls it while the action does not
  move.
- **Bounded Table:** the Table's wrapper scrolls, its header stays below the wrapper's top, and
  Body's unused name has no group.
- **Unsized:** the foot follows the body by the slot gap.

### Reference matrix — representative Release planning

The fixture reconstructs the #168 composition: Shell → Sidebar fill → Screen →
ColumnLayout.Alternatives fill. It has three 1:1:1 columns, or filling Tabs (pool/Release, weight
6) beside Sides (weight 5), with every column at a 24rem minimum. The Release pane holds:

- Head: H2, the title Input and the proposal hint;
- Body: a five-rule Checklist with each rule and its status as one fragment, and the fixed-for-good
  Note;
- Foot: `Cluster justify="between"` with an [H3 + count] group, then Complete.

The Sides pane carries both running-time Notes and Meters. The wording is the Label Manager's
English and German catalog text. The holder sets that consumer's theme type and `--space-region`
(see *Findings*).

| Window | Locale | Spacing | Arrangement | State | Corner gap bottom / right | Rules body client / scroll |
| --- | --- | --- | --- | --- | --- | --- |
| 1920×1080 | en, de | compact | three columns | bounded | 0 / 0 | 271 / 271 |
| 1920×1080 | en, de | comfortable | three columns | bounded | 0 / 0 | 271 / 271 |
| 1280×720 | en, de | compact | tabs, Release selected | bounded | 0 / 0 | 271 / 271 |
| 1280×720 | en, de | comfortable | tabs, Release selected | bounded | 0 / 0 | 271 / 271 |

Every cell also asserts the following:

- Exactly one Complete is mounted.
- The document has no vertical or horizontal scroll, and the Shell body is still (1920: 1028/1028;
  1280: 668/668).
- Every heading, label, list item, paragraph, running-time group and button in main lies wholly
  inside the viewport and every clipping ancestor. None is truncated (`text-overflow` or inline
  overflow).
- The rules body is no named group.

The type sizes per element are the same set with and without the placement.

Without the placement (*ReleasePlanningDefaultPlacement*), the #141 default holds. The corner gap is
**461.47px** at 1920×1080 and **71.88px** at 1280×720, and the foot follows the body by exactly the
compact slot gap (4px).

### Narrow widths, short heights, fallback and restoration (compact, en and de)

Each case opens at the reference window of the same arrangement, retains the Complete node,
shrinks the window, tabs through up to 60 stops and grows the window back.

| Window | State | Corner gap | Keyboard stops (en/de), none clipped |
| --- | --- | --- | --- |
| 1024×720 | tabs; Screen whole-content fallback (Shell scrolls 1059/668 en, 1081/668 de) | 0 / 0 (content height) | 30 / 30 |
| 800×720 | tabs; columns stacked into the Shell body (1280/668 en, 1302/668 de) | 0 / 0 | 30 / 30 |
| 800×400 | stacked (Shell 1280/348 en, 1302/348 de) | 0 / 0 | 30 / 30 |
| 1280×480 | tabs, bounded; rules body scrolls (103/271 en, 80/271 de); Complete in view | 0 / 0 | 33 / 33 |
| 1920×560 | three columns, bounded; rules body scrolls (212/271 en, 190/271 de); Complete in view | 0 / 0 | 34 / 34 |
| 1280×320 | tabs; Pane fallback (Shell 596/268 en, 605/268 de) | 0 / 0 | 30 / 30 |
| 1920×360 | three columns; Pane fallback (Shell 638/308) | 0 / 0 | 31 / 31 |

In every case:

- The document's scroll width is no wider than the window, and the Shell body has no horizontal
  scroll.
- Complete is reachable by Tab, and native focus reveal brings each stop inside the viewport and
  every clip. A stop taller than its clip, such as a Tabs panel, counts when it overlaps the clip.
- Growing the window back restores the bound, with the Shell still and the corner gap at 0 / 0.
  Complete is **the same node** as before the shrink.
- Released content follows the enclosing Shell scroll. While bounded, the foot stays in view.

### Lifecycle

- **Placement switch (*Foot at bottom* in the bar, clicked programmatically so focus stays in the
  input):** at both reference windows, three flips give corner gaps of 461.47 → 0 → 461.47
  (1920×1080) and 71.88 → 0 → 71.88 (1280×720). The focused title input stays the same node with
  its value `Night Drive (deluxe)` and selection 2–7. Complete stays the same node.
- **Filling Tabs (#153), German at 1280×720:** with the pool tab selected, 0 Complete buttons are
  mounted. Returning to the Release tab mounts one Complete, and the previously typed draft is
  **not** restored (`""`). The remounted pane is at the corner (0).
- **Alternatives:** after widening to 1920×1080, one arrangement (three columns) is mounted, with
  one Complete. The fixture has a single Complete button wired to one `Subject`. The runner checks
  for hidden duplicates, then presses Complete once: the fixture's `complete$` count rises by
  exactly 1.

### Omission baseline — 34/34 identical

The run removed the dev styles and injected each stylesheet in turn: `dist/styles.css` built from
`ddd821c`, then from this branch. It then compared every `#storybook-root` element's rectangle
(0.01px). The stories compared:

- Pane: short, long, child-owned, stacked, bounded Table, stepped bounded Table;
- the Release planning default placement;
- Screen: short content, compact short content, delegated Table;
- Console Spacing Release planning (German);
- Work Areas short bodies.

They ran at 1920×1080, 1280×720 and 1280×320, except the two bounded-table stories, which ran at
the reference sizes only. Their plays assert reference geometry and fail identically at 1280×320
on `ddd821c`'s own Storybook (251.77 > 248.5, 339.77 > 280.77). That failure is pre-existing, not
a regression.

### Regression runners (candidate Storybook)

| Runner | Result |
| --- | --- |
| `scripts/browser/work-areas.mjs` | PASS |
| `scripts/browser/screen.mjs` | PASS |
| `scripts/browser/roster.mjs` | PASS |
| `scripts/browser/dialog.mjs` | PASS (Dialog's whole-task fallback unchanged) |
| `scripts/browser/console-spacing.mjs` | PASS (matrix, behavior, plays; its baseline part not run) |
| `scripts/browser/screen-composition.mjs` | PASS on candidate and on `ddd821c` (164 records each) |

Two earlier candidate runs of `screen-composition.mjs` did not finish. Each stopped at a different
story on a 30s navigation wait (`main` visible / theme class), at load averages 30–47, with no
assertion failing. A rerun at the same load passed on both revisions. Both dev servers also logged
the same number of `ResizeObserver loop completed with undelivered notifications` lines during
that runner (52 each), so those lines are pre-existing.

## Checks

| Command | Result |
| --- | --- |
| `npm run lint` | clean (229 files) |
| `npm run typecheck` | clean |
| `npm test` | 1543/1544 under load: one unrelated MultiSelect test hit the 5s timeout and passed alone (35/35). Rerun by the pre-commit hook |
| `npm run build` | passed, including `check:build` |

## Findings

- **Default tokens wrap the German foot.** With the library's default type and `--space-region`,
  the German foot needs 489px while the 1920×1080 three-column Release foot is 488px wide. The
  Cluster then wraps, and Complete moves to a second line at the left: right gap 284.19px, bottom
  gap 0. The consumer theme's type and 1rem region space fit, as the reporter observed. Keeping
  the action on the foot's last line is horizontal composition, which the brief leaves with the
  consumer. The fixture therefore uses the consumer's theme values rather than invented wording.
- **No stretched released row.** An earlier draft supposed that a shorter Pane in a stretched,
  released row could keep spare height. Review measured otherwise: ColumnLayout's row is
  `items-start`, so in fallback the Release pane (479.5px) sits beside a 564.7px column at its
  content height. In every fallback case the foot follows the body by exactly the slot gap, and the
  runner now asserts that (see *Review*).

## Not verified here

- **Fixture versus consumer:** the reference matrix is a representative reconstruction. It is not
  the Label Manager screen, its data or its translations pipeline. Its corner gaps say nothing
  about the reported 389.78 / 416.97 / 27.38px gaps until the consumer measures again.
- **Consumer adoption** needs a published release containing this change. None exists; nothing
  was pushed, merged or released.
- **Other browsers:** only the plays and reference cells ran in Firefox and WebKit (see *Review*).
  The fallback, lifecycle and baseline parts ran in Chromium only.

## Review

This review was independent: separate Standards and Spec reviewers, on 2026-11-07, against
merge-base `ddd821c` and the approved brief. The fixes it made:

- **Comfortable cells could pass unasserted.** The reference matrix skipped every assertion for a
  comfortable cell that was released. No cell was released (all four comfortable cells were
  bounded at 0 / 0), but the skip could hide a regression. It is removed.
- **Fallback precedence is asserted.** Every fallback case now asserts that the foot follows the
  body by the slot gap (±1px), so the anchor yields wherever there is no spare height. All 14
  cases measured 4 / 4. This assertion was not shown red, because no supported composition
  produces the failing state.
- **Emissions are counted.** The Release planning holder exposes its `complete$` count as
  `data-completions`. One press after the Alternatives switch emits 1.
- **Fixture provenance.** `planningTheme` reproduces the consumer's own values from
  `packages/theme/theme.css` on Label Manager `feature/ticket-311`: type, `--space-region: 1rem`,
  `--space-band` and the 24rem minima. The story now cites that file. The theme's fonts are macOS
  system fonts, so the 0 / 0 corner result depends on those metrics. With default tokens the German
  foot wraps (see *Findings*). Pane's `@CallerMustEnsure` now says that a wrapped foot keeps the
  bottom but loses the right edge.
- **Docs.** The *Layout/Pane* description names the option. The Pane recipe comment no longer
  repeats the guarantees.

These were reproduced independently, at load 9–15:

- **Chromium.** `npm run build` passed. The full runner on Storybook port 6268, with
  `FOOT_PLACEMENT_BASELINE` built from `ddd821c`, passed twice: before and after the fixes.
  - Baseline: 34/34 identical.
  - The stylesheet diff against `ddd821c` is the single `.mt-auto{margin-top:auto}` rule.
- **Firefox 153 (firefox-1538) and WebKit 27.2 (webkit-2336).** The engines were launched through
  `executablePath` from a scratch script, at both reference windows.
  - The six FootAtBottom plays: no AssertionError.
  - The four Release planning plays: no AssertionError; corner gap 0 / 0.
  - The default-placement story: 461.15px (Firefox) and 461.64px (WebKit) at 1920×1080.
  - WebKit fails the existing `LongBody` play, at both windows: `expected 0 to be greater than 0`.
    That story and its CSS are unchanged by this branch, since only the unused `.mt-auto` rule was
    added. It is recorded as a pre-existing WebKit observation, not investigated here.
- **Dialog (scratch probe, not acceptance evidence).** The probe opened the four BoundedSummary
  stories at 1920×1080, 1280×720, 1280×400 and 800×320. It set the summary Pane's foot to
  `margin-top: auto`, the declaration `placement="bottom"` applies, and compared every rectangle in
  the dialog: 0 changed, including Dialog's whole-task fallback. No library story renders a bottom
  foot inside a Dialog.

Still open after review:

- Actual Label Manager verification and adoption remain consumer-owned and need a published release.
- The fallback, lifecycle and baseline parts are Chromium only.

