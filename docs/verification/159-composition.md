# #159 content-height and bounded Screen composition — 2026-11-06

Authority: the approved Agent Brief,
[#159 comment 6683392470](https://github.com/juwel-development/LIB-design-system/issues/159#issuecomment-6683392470),
read with the issue body and the five consumer comments through `gh issue view 159 --comments`. The
brief supersedes the consumer questions A1–E3. Base revision: `71f0ec6` (approved scope for #158,
#159, #160). Read CONTEXT.md, the four standards and ADR 0008 with its #159 amendment. #158's
compact spacing is not implemented here; it arrived by merging `main`, and how the two interact
is recorded under *Integration with #158 and #160*.

## What was built

| Surface | Change |
| --- | --- |
| `ColumnLayout.Column` | Optional `head?: ReactNode`: consumer content at content height above the column's content, spanning that column only. In a filled horizontal column the content takes the remaining height. No role, name, tab stop or scrolling; its arrival, change or removal never remounts the content. Omitted/`undefined`/`null`/`false` renders the column exactly as before. |
| `Screen` | Whole-content fallback now also covers content-height regions: a column head, a content-height Stack in a filled column, a Stack or unbounded Table as sole content. When any of them ends below the remainder, the whole content (heading included) grows into the Shell body; it restores when room returns. TSDoc lists the four supported compositions and their obligations. |
| `Pane` | Measures its room again when content above it inside Screen changes (a column head growing or shrinking moved it without resizing it, so a stale release survived). It watches the boxes ahead of it and each holder up to Screen's remainder for size, content and attribute changes. |
| `Table` | `captionVisibility="hidden"` positions the clipped caption against the table's own box, so in fallback it stays inside the Shell body instead of extending the document. |
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
| `npm test` | 65 files, 1524 tests passed (after the review fixes) |
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
TableOnly(+German), TableOnlyOverflowing, TableOnlyWithoutHeading(+Overflowing) for case 3, ContentColumns(+German, with *End*) for case 4.
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
| TableOnlyWithoutHeading | bounded; 312 | bounded; 312 |
| TableOnlyWithoutHeadingOverflowing | released (1070) | released (1070) |
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
- **German behavior**: the release/restore with focus and the selected tab (*Vorrat*) and the
  dynamic head also run on ContractDetail German; the dynamic head on ContentColumns German.
- **No clipping on the way**: *Longer head* is clicked inside the page and every one of the next
  30 frames is sampled; no content-height region is ever shorter than its content, released or
  restoring. In fallback no region is clipped.
- **Heading in the scroll flow**: on ProfileOnlyOverflowing and TableOnlyOverflowing at 1280×720,
  scrolling the Shell body by 200px moves Screen's heading and the content by 200px together.
- **Attribute-only change above a Pane**: a 400px line appended to the column head releases
  ContractDetail and HeadAbovePane; hiding it with the `hidden` attribute alone (no node or text
  change) restores the bound.
- **Hidden caption in fallback**: HeadAbovePane German at 1280×360 releases and the document
  stays still; the rounds Table's hidden caption no longer extends it.
- **Pane → result block** (ContentColumns *End*): two content-height columns, bounded at 1280×720.
- **Enlarged text** (root 200 % at 1920×1080): ContractDetail (its columns stack under the doubled
  rem minimums inside the still-bounded Screen, asserted) and TableOnly release and stay reachable; ContentColumns still fits bounded (facts 775
  in 963). All three return to bounded at 100 %.
- **Width**: bounded at 1024×720; at 800×720 the Sidebar stacks, Screen becomes unsized, every body
  takes its natural height and the Shell body scrolls; bounded again at 1280×720. No sideways
  overflow at any width.
- **No oscillation, no stuck release**: searched by height at 1280 wide, once arriving from a
  bounded 720px window and once from a released 300px one. TableOnly German releases at ≤ 701px
  and is bounded at ≥ 702px from both directions; ContractDetail German (two-line head) at
  ≤ 548 / ≥ 549px from both. So the Shell scrollbar that fallback adds leaves no band where the
  bound would fit but does not return. One pixel either side of each boundary holds for 60 frames.
- **Themes and distributed stylesheets**: dark (source CSS), and `dist/styles.css` (light and
  dark), `dist/styles.light.css`, `dist/styles.dark.css` replacing the source styles, for
  ContractDetail EN/DE, FocusColumn, TableOnly German, ContentColumns and ProfileOnlyOverflowing at
  both reference windows: 60 runs, identical outcomes to the table above.
- No page errors.

## Independent review — 2026-11-06

Two-axis review (`.claude/skills/code-review`) against `git merge-base main HEAD` = `71f0ec6`,
Standards (all four standards, smell baseline) and Spec (issue body, comments, the approved
Agent Brief, ADR 0008's #159 amendment), each by a separate agent, then browser probes of every
suspected defect before fixing it.

| Finding | Axis | Verdict | Resolution |
| --- | --- | --- | --- |
| A line above a Pane hidden by an attribute left the Pane's release stale: the screen stayed released with room back (ContractDetail, HeadAbovePane at 1280×720) | Spec | confirmed in Chromium | Pane watches the boxes ahead of it, attributes included; jsdom spec and runner check added |
| Pane re-measured on every DOM change anywhere in Screen, through a second observer duplicating its own | Spec, Standards | confirmed by reading | replaced by the scoped observer above |
| A Table's hidden caption below the window in fallback extended the document (HeadAbovePane German, 1280×360: document 639 / 360) | found while adding the attribute check | confirmed in Chromium | Table contains its hidden caption; runner check added |
| Released layout narrower by the Shell scrollbar could leave a band that never restores | Spec (suspected) | refuted: release and restore meet from both directions | boundary search now runs both directions on two fixtures |
| Clipping, heading scroll flow, ColumnLayout stacking under enlarged text, German behavior and TableOnly without a heading were prose only | Spec | confirmed | asserted by the runner; TableOnlyWithoutHeading(+Overflowing) stories added |
| `Extent.boxes` holds every observed box, not only the measured ones | Standards (smell) | accepted | renamed `observed` |
| Specs read the private `data-screen-unusable` marker; the runner is a browser driver; repeated observer, layout-mock and runner-preamble setup | Standards (judgement) | not changed | jsdom has no layout, so the marker is the only signal and Pane.spec already did this; the Screen family (#151–#153) records geometry with runners, not play functions; extracting shared setup is a refactor across the existing #151–#157 runners and specs, outside this issue |

No scope creep was found: nothing touches #158 density, #160, persistence or the release. The one
public addition stays `ColumnLayout.Column head`.

## Integration with #158 and #160 — merge of `main` at `128d008`

`main` (#158 compact console spacing, #160 Slider value) was merged into this branch. The only
textual conflict was `Screen.tsx`: the imports and the props declaration. Both are kept. #158's
`spacing` variant, its `comfortable` default, its `data-screen-spacing` marker (compact only) and
its focus-ring floor stay as they were. So do #159's walk (`extentOf`, `useContentOverflow`), the
release marker on the inner box and the four compositions in the TSDoc. Pane's compact classes
and #159's observers merged without conflict. Pane's fit check reads the computed inset and gap,
so it measures whichever treatment is active. Neither check watches the marker. A switch reaches
them as a resize of the remainder, of a Pane's root or of its shrinking Body.

The composition fixtures' Console gained a *Compact spacing* toggle. It is off by default, so
every default measurement above is unchanged. It switches any #159 composition in place.
Runner section 8 asserts the following, in English and German, at 1920×1080 and 1280×720:
- Screen's air and heading gap and every Pane's inset and slot gap shrink; the gutter does not.
- No region is clipped in any of the 30 frames after the switch.
- The same nodes stay, with focus on a bounded body's control and the selected tab (Pool or
  Vorrat) kept.
- Compact never loses a bound the default holds.
- Switching back returns every head, foot, body and region to its default geometry.
- The same checks run in the dark theme and with `styles.css`, `styles.light.css` and
  `styles.dark.css` for ContractDetail German, HeadAbovePane German and ContentColumns.

| Fixture at 1280×720 | default | compact | bounded body gained |
| --- | --- | --- | --- |
| ContractDetail EN / DE | bounded | bounded | 56px (active lane and Roster) |
| HeadAbovePane EN | bounded | bounded | rounds body 68px |
| HeadAbovePane DE | released | **bounded** | – |
| FocusColumn EN / DE | bounded / released | bounded / **bounded** | Roster 56px |
| ProfileOnly EN, ProfileOnlyHeadingGerman | released | **bounded** | – (Screen air only) |
| TableOnly DE | bounded | bounded | – |
| ContentColumns EN / DE | bounded | bounded | history body 52px |

At 1920×1080 every fixture is bounded in both treatments.

- **Fallback and restoration under compact.** At 1280×360, ContractDetail German, HeadAbovePane
  German, ContentColumns German and FocusColumn release. Back at 1280×720 they return to the
  same compact geometry.
- **Longer head under compact.** On ContractDetail German and ContentColumns the head releases
  and restores, holding each state for 25 frames with nothing clipped.
- **Boundary under compact.** The release height drops and still meets the restore height from
  both directions. ContractDetail German goes from 548/549 to 492/493; HeadAbovePane German from
  719/720 to 653/654.
- **Theme with only the slot gap different** (compact Screen and inset tokens set to the
  defaults; the case the integration review suspected). At the default's release height,
  compact fits, and switching back to default releases (ContractDetail German 548,
  HeadAbovePane German 719). The Body's resize carries the change.
- **jsdom.** `Screen.spec.tsx` switches compact → default → compact over a column head, its Pane
  and a content-height column. Nodes, focus, the marker and the release are kept, and the bound
  returns when the content shrinks.
- **#158's own runner** (`console-spacing.mjs`) passes on the merged tree, including its
  baseline part: 132 rectangle comparisons against the `71f0ec6` stylesheets are identical.
  Omission still renders as before with #159's fallback in place.

An independent review of the resolution and the interaction diff found no resolution defect. It
named gaps in the first draft of section 8, all closed above: every Pane, heading gap, gutter,
selection, focus in a body, the built stylesheets, compact no worse than default, and an
asserted bound after a shorter head. Its one interaction suspicion is the slot-only theme row,
refuted in Chromium.

## Library behavior versus application fit

The fixtures prove the compositions, their bounds and their fallback. They do not prove that any
g-label-manager screen fits 1280×720: the consumer measurements in the issue comments (#307, #315,
#317, #318, #320, #321) were not reproduced here. The compact outcomes under *Integration with
#158 and #160* are fixture outcomes as well, not application fit.

## Residual issues and gaps

- Screen's walk trusts the private markers. A future component that stretches to an allocation
  without `data-height-passing`, or bounds and scrolls itself without `data-height-bounded`, is
  measured as content-height: in fallback it would stay grown and could hold the release. The
  architecture standard records the rule.
- A content-height region placed *below* a bounded Pane in the same flow is outside the supported
  compositions: in fallback the Pane above it grows and moves it, so it could hold the release.
- Shell's console body is `position: static`, so any other absolutely positioned descendant
  below the window in fallback (consumer content, not the library's) can still extend the
  document. The hidden Table caption was the library's case and is fixed; Shell is unchanged.
- Not run: WebKit and Firefox, real 200 % browser zoom (root font size was used), screen readers.
