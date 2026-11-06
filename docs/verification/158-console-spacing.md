# #158 compact console spacing — 2026-11-06

Authority: the approved Agent Brief,
[#158 comment 6683562528](https://github.com/juwel-development/LIB-design-system/issues/158#issuecomment-6683562528),
read with the issue body, the four consumer-evidence comments and the triage notes through the
issues API. The brief supersedes the body's complete-screen-fit request. The user later changed the
completion boundary: #158 closes once the change is implemented, independently reviewed and merged
with passing checks, not on publication. ADR 0008 records that change. Base revision: `71f0ec6`
(approved scope for #158 #159 #160, package 4.2.1). Read: CONTEXT.md, the four standards, and
ADR 0008 with its Amendments.

## What was built

| Surface | Change |
| --- | --- |
| `Screen` | `spacing?: 'comfortable' \| 'compact'`, default `comfortable`. Compact sets Screen's vertical padding and heading gap from `--space-screen-region-compact` |
| `Pane` | No new prop. Inside a compact Screen and outside a `dialog`, its inset and Head/Body/Foot gaps come from `--space-pane-inset-compact` / `--space-pane-slot-compact` |
| Tokens | `--space-screen-region-compact: 0.5em`, `--space-pane-inset-compact: 0.5em`, `--space-pane-slot-compact: 0.25em`, in every token entry point. `--space-region`, `--space-box-inset` and `--space-stack` are unchanged |
| Floors | Screen's padding and heading gap and Pane's inset are `max(token, focus-ring width + offset)` |

Coordination is CSS-only. A compact Screen writes the private `data-screen-spacing="compact"`
attribute on its main, and Pane's recipe reads it from an ancestor
(`docs/agents/standards/architecture.md`). Omitted and `comfortable` render no attribute and the
same utilities as 4.2.1.

At the default tokens and 16px type, each position recovers:

| Position | Default | Compact | Recovered |
| --- | --- | --- | --- |
| Screen block padding (top + bottom) | 24 + 24 | 8 + 8 | 32 |
| Screen heading gap (only with a heading) | 24 | 8 | 16 |
| Pane inset (top + bottom) | 16 + 16 | 8 + 8 | 16 |
| Pane slot gap (each of 1–2) | 8 | 4 | 4 each |

A bounded Pane body therefore gains **72px** with a Screen heading, Head and Foot, **68px** with
one gap fewer, and **56px** without a Screen heading. The browser matrix confirms these figures
exactly (±1px).

## Reproduction

```sh
npm run build
npm run storybook -- --ci --port 6158
# base stylesheets for the omission proof (scratch, not committed):
git archive 71f0ec6 | tar -x -C <dir> && ln -s "$PWD/node_modules" <dir>/node_modules
(cd <dir> && npx vite build --config vite.styles.config.ts)
SCREEN_STORYBOOK_URL=http://localhost:6158 CONSOLE_SPACING_BASELINE=<dir>/dist \
  npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/console-spacing.mjs
```

Runtime: Chromium 156.0.8078.4 (Playwright 1.64.1, headless), macOS, 100% zoom, 16px root.

## Tests

- **jsdom (`Screen.spec.tsx`, `renderTokens.spec.ts`).** An omitted treatment renders the same
  markup as `comfortable`. Switching comfortable → compact → comfortable → compact keeps the same
  Pane, button and input nodes, with focus, typed value and selection. `Pane.Root` rejects a
  `spacing` prop at compile time (`@ts-expect-error`). The three tokens are in every entry point,
  outside `@theme`, beside unchanged generic roles. Red first: typecheck failed on the missing prop
  and the token test failed.
- **Storybook play functions (`Screen.stories.tsx`).** CompactSpacing, CompactDelegatedTable,
  CompactHeadingInsidePanel, CompactWithoutFoot and CompactShortContent measure the default. They
  switch to compact through the bar control without moving focus, then assert:
  - Screen's block padding and heading gap shrink to no less than the ring room, and the gutter is
    unchanged.
  - Each Pane's inset shrinks to no less than the ring room, and its slot gaps shrink.
  - Every descendant's gaps, paddings, font size, line height, outline width and control height
    are identical.
  - A bound overflowing body grows by exactly the room the enclosures gave up.
  - A short body keeps its height.
  - Switching back restores the identical default, and the focused field keeps node, focus, value
    and selection.

  Two more stories cover scope:
  - **SpacingScope:** a default Screen and a standalone Pane keep the default. A theme that
    re-points the three tokens (12/12/6px) changes only those positions.
  - **CompactWithDialog:** a Dialog's Pane inside a compact Screen keeps `--space-box-inset`.

  The plays failed red before the implementation: `expected 24 to be less than 24`.
  Result: **28/28 pass**: 7 stories × light/dark × 1280×720 and 1920×1080.

## Browser matrix — delivered stylesheets

`matrix` runs 7 fixtures × 2 windows through source CSS and through `styles.css` (light and
`.dark`), `styles.light.css` and `styles.dark.css`. Each run measures default, switches to compact,
and switches back. It asserts the reductions, no page scroll, a still Shell while bounded, exact
body gains, unchanged descendants and the restored default. Every delivered stylesheet produced the
**same geometry as source CSS** in both treatments: 70 records, all identical per fixture and window.

Body client height, default → compact (CSS px). "Short" is content minus visible body.

| Fixture (kind) | Window | Locale | Pane | Body | Short |
| --- | --- | --- | --- | --- | --- |
| Screen/CompactSpacing (library) | 1280×720 | en | list / detail | 179→251 / 275→347 | scrolls by design |
| | 1920×1080 | en | list / detail | 527→599 / 623→695 | scrolls by design |
| | 1280×720 | de | — | released in both (German heading and bar) | — |
| | 1920×1080 | de | list / detail | 342→414 / 448→520 | scrolls by design |
| Screen/CompactDelegatedTable | 1280×720 | en | list (Table) | 179→251 | scrolls by design |
| Release planning (representative #311) | 1280×720 | en | pool (tab) | 306→374 | first entry 661 tall: does not fit in either |
| | | | release (tab) | 171→243 | 174→**102** |
| | | | sides | 63→131 | 361→293 (scrolls by design) |
| | 1280×720 | de | all | default **released** (whole content in Shell); compact **bounded**: pool 326, release 161, sides 84 | first entry 753: does not fit; release 206 short |
| | 1920×1080 | en, de | pool / sides / release | 690→758 / 413→424 / 345→345 | entry 617 fits in both; sides 11→**0**; release fits in both |
| Employment Negotiation (representative #320) | 1280×720 | en | offer | 118→190 | 145→**45** |
| | 1280×720 | de | offer | 118→190 | 145→**73** |
| | 1920×1080 | en, de | offer | 208→208 | fits in both |

The representative fixtures rebuild the reported structure from this library's components with
invented wording of similar length. They are **not** calibrated to the application. The
Employment fixture's default is 145px short in English, where the reporter measured a fit. The
pool entry is 661px against the reported 506px. Their figures show what the treatment recovers,
not whether the application fits.

## Behavior

- **Fallback threshold** (CompactSpacing, 1280 wide, 4px steps): the first released height is
  572px by default and **500px** compact. At 320px compact releases with the Shell scrolling and
  every body whole. Nothing oscillates over 12 frames (0 `data-screen-unusable` mutations), and at
  720px the bounds restore with focus, value and selection intact.
- **Focus rings:** Tab through every stop in four fixtures in both treatments. The rings match, and
  **no ring is clipped** by an overflow ancestor in compact. Rings at a scrolled-away scrollport edge
  occur in both treatments, at different entries. Native focus reveal brings the border box into
  view but not the outline, so this is not a clip the change introduced.
- **Grouped lifecycle** (Release planning, 1280): the selected Release tab and the focused title
  draft keep their node and value through the switch. The pool panel mounted after that takes the
  compact inset (8/8) and gap (4).
- **Delegated Table:** compact PageDown scrolls only the Table (offset 13, Shell 0), with its
  header in view.
- **Short bodies:** natural height (34/37px); the foot follows the body by the compact gap.
- **Omission (`baseline`):** the base revision's stylesheets and this branch's render every element
  of 11 existing stories with identical rectangles: 132 comparisons across `styles.css`
  light/dark, `styles.light.css`, `styles.dark.css` and 1280×720, 1920×1080 and 1280×320. The
  stories are Screen ×6, Work Areas en/de, Roster, and Pane long/short.
- **Regression runners** `screen.mjs`, `roster.mjs`, `work-areas.mjs` and `dialog.mjs` all pass.

## Consumer cases

None of the five application screens was reproduced; the application is outside this repository.
The rows below apply the measured recovery (72/68/56px) to each reporter's own figures. They are
**arithmetic estimates**, not fits. The application must measure again with `spacing="compact"`.

| Consumer | Reported deficit (default) | Applied | Estimated residual |
| --- | --- | --- | --- |
| Release planning #311, pool entry | body 376 vs entry ≈506 + ring room | +68 | ≈ 72 short |
| Release planning #311, rules | body 219 vs H3 38 + Checklist 235 (en) / 262 (de) + Note | +72 | ≈ 8 (en) / 35 (de) short plus the unmeasured Note |
| Write a new song #314, arrival | 20 / 43 | +72 | fits by ≈ 52 / 29 |
| Write a new song #314, Artist or commission picked | 140 / 160 | +72 | 68 / 88 short |
| Write a new song #314, employed writer picked | 190 / 235 | +72 | 118 / 163 short |
| Market report #319, Age groups, one / two Markets | 169 / 321 | +68 | 101 / 253 short |
| Market report #319, Genres, one / two Markets | 10 / 161 | +68 | fits by ≈ 58 / 93 short |
| Market report #319, DE Broad | heading wraps; compared case releases | — | not estimable from the report |
| Employment Negotiation #320, en | fits | +72 | fits |
| Employment Negotiation #320, de | 78 (heading on two lines) | +72 | ≈ 6 short |
| Contract Negotiation #321, Offer with value lines | 125 / 152 | +72 | 53 / 80 short |
| Contract Negotiation #321, Offer worst case, values in labels (#160) | 20 / 74 | +72 | fits / ≈ 2 short |
| Contract Negotiation #321, Counter-offer worst case | 96 | +68 | ≈ 28 short |

Each remaining gap is content arrangement or density outside this scope. Each needs a separate
linked issue that preserves that consumer's constraints. They are proposed to the coordinator,
not posted from here.

## Observations outside scope

- When the default German Release planning fixture has fallen back, a focused Tabs panel's ring is
  cut by the Shell body. The geometry and code are those of 4.2.1 (see Omission), so the change
  did not introduce it.
