# #159 content-height and bounded Screen composition — 2026-11-06

Authority: the approved Agent Brief,
[#159 comment 6683392470](https://github.com/juwel-development/LIB-design-system/issues/159#issuecomment-6683392470),
read with the issue body and the five consumer comments through `gh issue view 159 --comments`. The
brief supersedes the consumer questions A1–E3. Base revision: `71f0ec6` (approved scope for #158,
#159, #160). Read CONTEXT.md, the four standards and ADR 0008 with its #159 amendment. #158's
compact spacing is not part of this work.

## What was built

| Surface | Change |
| --- | --- |
| `ColumnLayout.Column` | Optional `head?: ReactNode`: consumer content at content height above the column's content, spanning that column only. In a filled horizontal column the content takes the remaining height. No role, name, tab stop or scrolling; its arrival, change or removal never remounts the content. Omitted/`undefined`/`null`/`false` renders the column exactly as before. |
| `Screen` | Whole-content fallback now also covers content-height regions: a column head, a content-height Stack in a filled column, a Stack or unbounded Table as sole content. When any of them ends below the remainder, the whole content (heading included) grows into the Shell body; it restores when room returns. TSDoc lists the four supported compositions and their obligations. |
| `Pane` | Measures its room again when content above it inside Screen changes (a column head growing or shrinking moved it without resizing it, so a stale release survived). |
| Private markers | `data-height-passing` (ColumnLayout fill frame/row/columns, `Alternatives fill`, `Tabs.Root fill` and panels, Stepper root and panels) and `data-height-bounded` (Pane root, bounded Table wrapper, ScrollContainer). Recorded in `docs/agents/standards/architecture.md`; not public API. |

No new component, barrel line, token, error class or consumer CSS. One public prop (`head`).

### How the fit is decided

Screen walks its content: it looks through height-passing boxes (they stretch to the allocation in
bounded mode and shrink to content in fallback), skips self-bounded boxes (each Pane answers for
its own fixed regions plus usable body minimum, as before; a bounded Table or ScrollContainer
scrolls its overflow) and takes the lowest edge of every other in-flow box. Those boxes keep their
content height in both modes and are measured against Screen's persistent remainder, so the same
numbers decide release and restoration: no probing, no temporary clipping, no remount. Out-of-flow
boxes (`display: none`, absolute, fixed — an open modal Dialog) are ignored. Long content inside a
bounded body is never counted.

## Checks run (all at `HEAD` of this branch, Chromium 156 headless)

| Command | Result |
| --- | --- |
| `npm run lint` | clean (224 files) |
| `npm run typecheck` | clean |
| `npm test` | 65 files, 1523 tests passed |
| `npm run build` | passed, including `check:build` for the three stylesheet exports and the JS bundle |
| `npm run build-storybook` | passed |
| `scripts/browser/screen-composition.mjs` (new) | PASS |
| `scripts/browser/screen.mjs`, `roster.mjs`, `work-areas.mjs`, `sidebar.mjs`, `dialog.mjs`, `choices.mjs` | all PASS (regression) |

New jsdom specs: `Screen.spec.tsx` (+10: sole Stack at and one pixel past the remainder; unbounded
Table; release → restore → release with the same focused input and selection; content-height
column beside a Pane, fitting and not; long bounded body / ScrollContainer / bounded Table do not
release; Stack of Box + unsized Pane; column head fitting and not; pass-through via Tabs fill and
Stepper; out-of-flow content ignored), `ColumnLayout.spec.tsx` (+5: head order and no added
semantics; content node, focus and value kept as the head appears, changes and goes; absent head
forms render the column unchanged), `Pane.spec.tsx` (+1: re-measure when content above changes).

## Browser evidence

Reproduction:

```sh
npm run build
npm exec storybook dev -- -p 6159 --ci
SCREEN_STORYBOOK_URL=http://localhost:6159 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen-composition.mjs
```

Stories: *Layout/Screen Composition* — ContractDetail(+German) and HeadAbovePane(+German) for case 1,
FocusColumn(+German) for case 2, ProfileOnly, ProfileOnlyHeadingGerman, ProfileOnlyOverflowing,
TableOnly(+German), TableOnlyOverflowing for case 3, ContentColumns(+German, with *End*) for case 4.
The runner keeps scrollbars visible (Playwright hides them by default), so width feedback from the
Shell body's scrollbar is part of every check. 100 % zoom, root 16px.

### Reference windows — measured outcome per fixture (light theme, source CSS)

`bounded` = Shell body and document still, every head/foot/content-height region in view, only
bounded bodies scroll. `released` = whole content in the Shell body, bodies at natural height,
lowest content within the Shell body's scroll range. Region: top / height / width in px.

| Fixture | 1920×1080 | 1280×720 |
| --- | --- | --- |
| ContractDetail (EN, DE) | bounded; head 27 / 1270 wide = detail column; four lanes side by side, bodies 565–715 of 1058 | bounded; head 59 (two lines) / 630; four tabs, active lane body 292 (EN) / 220 (DE) of 1058, act in view |
| HeadAbovePane EN | bounded; card 196, rounds body 501 of 995 | bounded; card 193, rounds body 156 of 995 |
| HeadAbovePane DE | bounded | **released** — the rounds Pane's H2 wraps to 143px, leaving less than a header plus one row (Pane's own minimum) |
| FocusColumn EN | bounded; Stack 485 in a 963 column | bounded; Stack 581 in 603 |
| FocusColumn DE | bounded | **released** — the Stack is 652 in a 603 column |
| ProfileOnly EN / heading DE | bounded; 605 / 469 | **released** — 632 in 602 / 504 below a 144px heading |
| ProfileOnlyOverflowing | released (961) | released (997) |
| TableOnly EN / DE | bounded; 312 | bounded; 312 / 440 under a wrapped heading |
| TableOnlyOverflowing | released (1070) | released (1070) |
| ContentColumns EN, DE | bounded; facts 270, history body 846 of 1627 | bounded; facts 289, history body 489 of 1627 |

The released rows are the documented fallback on representative fixture content, not a defect and
not a statement about any application's content. In fallback Screen's main keeps its allocated box
and the content extends past it, so a profile that overflows by under one pixel (ProfileOnly EN
at 1280) gives the Shell body nothing to scroll: the content is not clipped, it ends at the
viewport edge without Screen's bottom inset. That matches the existing Pane fallback.

### Behavior checks (all asserted by the runner)

- **Head spans its column only**: strip width equals the detail column (1270 / 630); the Roster
  column keeps the full height (top and bottom equal to the detail column's) beside it.
- **Independent scrolling**: scrolling one lane by 300px moves no other lane, the Roster's Table
  or the Shell body.
- **Delegated Table**: focusing row 40 scrolls the Table wrapper (1346px); the header stays at the
  wrapper top and the row is revealed below it; the Shell body does not move.
- **Exactly one main; reading order** Roster foot → column head → first lane head.
- **No unintended scrollports**: in bounded mode the only scroll containers with overflow inside
  main are the `*-body` scroll owners; no content-height region is or gains one.
- **Insufficient height (1280×360) and restoration**: ContractDetail, FocusColumn, TableOnly and
  ContentColumns release, the end of the content is reachable by scrolling the Shell body, and at
  1280×720 the bound returns with every region at its previous height. The focused head button and
  the selected `Pool` tab (same panel node), the focused selected Choice, and a focused market
  button are the same nodes, still focused and selected.
- **Dynamic fixed content** (*Longer head*, 1280×720): the column head grows to 558px
  (ContractDetail), the Stack to 1233px (FocusColumn), the facts column to 913px (ContentColumns);
  each releases, holds the release for 30 sampled frames, restores when the content shrinks and
  holds the bound for 30 frames. This exposed the stale Pane release fixed above.
- **Pane → result block** (ContentColumns *End*): two content-height columns, bounded at 1280×720.
- **Enlarged text** (root 200 % at 1920×1080): ContractDetail (columns stack under the doubled rem
  minimums) and TableOnly release and stay reachable; ContentColumns still fits bounded (facts 775
  in 963). All three return to bounded at 100 %.
- **Width**: bounded at 1024×720; at 800×720 the Sidebar stacks, Screen becomes unsized, every body
  takes its natural height and the Shell body scrolls; bounded again at 1280×720. No sideways
  overflow at any width.
- **No oscillation**: TableOnly German, searched by height at 1280 wide — released at ≤ 701px,
  bounded at ≥ 702px; at 700, 701, 702 and 703px the state holds for 60 consecutive frames with
  the Shell body's scrollbar visible.
- **Themes and distributed stylesheets**: dark (source CSS), and `dist/styles.css` (light and
  dark), `dist/styles.light.css`, `dist/styles.dark.css` replacing the source styles, for
  ContractDetail EN/DE, FocusColumn, TableOnly German, ContentColumns and ProfileOnlyOverflowing at
  both reference windows: 60 runs, identical outcomes to the table above.
- No page errors.

## Library behavior versus application fit

The fixtures prove the compositions, their bounds and their fallback. They do not prove that any
g-label-manager screen fits 1280×720: the consumer measurements in the issue comments (#307, #315,
#317, #318, #320, #321) were not reproduced here, and #158's compact spacing is separate.

## Residual issues and gaps

- Screen's walk trusts the private markers. A future component that stretches to an allocation
  without `data-height-passing`, or bounds and scrolls itself without `data-height-bounded`, is
  measured as content-height: in fallback it would stay grown and could hold the release. The
  architecture standard records the rule.
- A content-height region placed *below* a bounded Pane in the same flow is outside the supported
  compositions: in fallback the Pane above it grows and moves it, so it could hold the release.
- Pane re-measures on DOM changes above it and on window resize; a non-DOM size change above it
  that leaves the Pane's own size unchanged (e.g. a web-font swap in the head only) waits for the
  next mutation or resize.
- Not run: WebKit and Firefox, real 200 % browser zoom (root font size was used), screen readers.
