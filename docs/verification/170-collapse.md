# #170 Collapse — 2026-11-07

Authority: the Agent Brief,
[#170 comment 6712563973](https://github.com/juwel-development/LIB-design-system/issues/170#issuecomment-6712563973),
read with the issue body. It is the only comment on the issue. Base revision: `19ee2a8`, which
includes the approved triage docs (CONTEXT.md *Collapse*, `.out-of-scope/field-layout-for-console-fit.md`).
Published 4.4.0 has no Collapse. This change is not a release. Nothing here claims that the
Label Manager screen fits; that check belongs to the consumer.

## What was built

| Surface | Change |
| --- | --- |
| `Interaction/Collapse/Collapse.tsx` | New `Collapse`, exported from `src/index.ts`. Closed props: `summary: string` (required), `children: ReactNode`, `defaultExpanded?: boolean`, `testId?: string`. One CVA recipe on the `details`. |
| `Collapse.spec.tsx` | 12 jsdom behaviour tests. |
| `Collapse.stories.tsx` | Docs page plus five stories with measured plays: *Default*, *InitiallyExpanded*, *IndependentInstances*, *RetainedFieldState*, *LongWording*. |
| `CollapseComposition.stories.tsx` | A Shell > Screen (compact) > Pane composition in English and German, collapsed or starting expanded. The Pane head holds Collapse with four filter fields in a FieldRow. The body is a child-owned bounded Table of 40 rows, and the foot is a count plus an action. |
| `scripts/browser/collapse.mjs` | Browser acceptance runner with five parts: plays, keyboard, accessibility, composition and resizing. |

No token, palette value, private marker, Screen/Pane change or sibling import was added. The
stories import other components from `index`, as every story does.

### Design decisions

- **Native `details`/`summary`.** Closed content keeps its nodes but has no box, no
  accessibility-tree presence and no tab stop in all three engines (measured below). React keeps
  the children mounted, so values and subscriptions survive without any component state.
- **Initial state is read once.** `open` is rendered from a `useState` initialiser, so React never
  rewrites the attribute. An ordinary rerender, or a changed `defaultExpanded`, leaves the user's
  choice alone. A mutation that passes the prop through directly fails the rerender test.
- **Focus handoff on the summary's click.** The click precedes the native toggle for pointer,
  keyboard and assistive activation alike. If focus is inside the content at that moment, it moves
  to the summary. Reopening focuses nothing. A mutation that removes the handler fails the handoff
  test.
- **The indicator is the summary's `::before`, and the summary holds only text.** WebKit 27.2 has a
  defect: after a pointer click on an *element inside* a `summary`, Tab leaves focus on the summary.
  Plain markup reproduces it (`<summary><span>…</span></summary>`: click the span, then Tab stays
  on the summary). A click on summary text that is a direct child does not. The first version used
  spans for the indicator and label and failed the runner's WebKit keyboard part (`keyboard stops
  open: ["Filters"]`). With text only, the same part passes. The chevron is a rotated
  `border-current` square, so it follows `currentColor` and forced colours. It turns between -45°
  and 45° with no transition.
- **Width.** The summary hugs its wording (`w-fit max-w-full`), so the shared focus ring outlines
  the control rather than the row. It wraps with `overflow-wrap: anywhere`, like Switch's label.

## Tests (jsdom)

`Collapse.spec.tsx` started red: 12 of 12 failed because there was no export. It is now green,
12/12, and covers:

- collapsed by default, with no text of its own;
- explicitly expanded on mount;
- pointer toggle;
- the user's choice surviving a rerender and a changed `defaultExpanded`;
- independent instances;
- the same input node, its typed value, and a live RxJS subscription surviving collapse with one
  mount and the stream still observed;
- the focus handoff on a synthetic click with focus in the content, with no restoration on reopen;
- focus outside the content left alone;
- the name taken from the wording alone;
- `testId`;
- `@ts-expect-error` for a missing summary, `className`, `style` and a controlled `expanded`.

jsdom has no layout. It does not hide closed `details` content from role queries, and it does not
toggle on Enter or Space (probed). Hidden-content geometry, keyboard activation and the native tree
are therefore proven in the browser below, not here.

Full gates: `npm run lint`, `npm run typecheck` and `npm run test` (66 files, 1559 tests) are green.
`npm run build` is green, including `check:build`. `dist/styles.css` carries the summary,
`::before` and `[open]` rules.

## Browser evidence

```sh
npx storybook dev -p 6170 --ci
SCREEN_STORYBOOK_URL=http://localhost:6170 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/collapse.mjs
COLLAPSE_ENGINE=firefox COLLAPSE_EXECUTABLE=~/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox …
COLLAPSE_ENGINE=webkit COLLAPSE_EXECUTABLE=~/Library/Caches/ms-playwright/webkit-2336/pw_run.sh …
```

Runtime: Playwright 1.64.1, headless, on macOS: Chromium 156.0.8078.4, Firefox 153.0, WebKit 27.2.
The Firefox and WebKit builds are the older cached revisions, because 1.64.1's own are not
installed. Scrollbars were visible, nothing was mocked, and ordinary Playwright and Vitest
deadlines applied. The host was shared with other worktrees (load 15–69). **All five parts pass in
all three engines.**

### Plays: 20/20 per engine

Each of the five stories ran at 1920×1080, 1280×720, 768×720 and 360×720. They assert:

- **Closed content:** the `details` is exactly as tall as its summary. Chromium still answers a
  rect query on skipped content (85px), so the measured fact is what the disclosure contributes to
  layout. Every input, select and button inside fails `checkVisibility()`. A focused summary draws
  a solid outline.
- **Expanded stories:** toggling hides and reveals the fields, and the two instances toggle
  independently.
- **Retained state:** typed text, a selected option and a Switch's stream state survive. A 100ms
  RxJS interval keeps updating while collapsed, the mount count stays at 1, and focus is not left
  in the hidden content.
- **Long wording:** the long English and German summaries and a 51-character German compound sit
  at full width and in 16rem and 10rem holders. Neither holder nor summary overflows, the summary
  lies inside its holder, the indicator is painted, and the narrow German summary wraps onto
  several lines.

user-event's `tab()` does not count a `summary` as tabbable, and its `click()` focuses `body`. The
plays therefore assert only what that simulation can show. The runner proves real key presses and
real clicks.

### Keyboard and pointer (real input)

| Step | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Shift+Tab from the following button reaches the summary with a solid ring, collapsed | ✓ | ✓ | ✓ |
| Enter opens it: focus stays, the content is 85px, the indicator turns from -45° to 45° | ✓ | ✓ | ✓ |
| Space closes it: the content is 0px and the indicator returns | ✓ | ✓ | ✓ |
| Tab stops while closed | Filters, After the filters | same | Filters |
| Tab stops while open | Filters, Name contains, Genre, Minimum quality, After the filters | same | the same, minus the button |
| Click in a field, then click the summary: focus ends in hidden content? | no (SUMMARY) | no (SUMMARY) | no (SUMMARY) |
| Reopen by click: an old field regains focus? | no | no | no |

Platform tab settings explain the differences in the stops row. macOS Firefox tabs to form controls
only by default, so the runner sets `accessibility.tabfocus: 7` (Full Keyboard Access). Plain
`<details>` markup behaves identically. Playwright's WebKit on macOS does not Tab to buttons at all,
which is why its walk ends at the last field.

### Native accessibility tree (Chromium, CDP `Accessibility.getFullAXTree`)

| State | Summary node | Field nodes exposed |
| --- | --- | --- |
| collapsed | role `DisclosureTriangle`, name "Filters", `expanded: false`, focusable | none |
| expanded | same role and name, `expanded: true` | textbox Name contains, combobox Genre, textbox Minimum quality |

The Firefox and WebKit native trees were not read. Playwright's aria snapshot is DOM-derived and
would prove nothing.

### Screen > Pane composition: collapse, expand, restore

Each case opens the collapsed story, marks the first filter input and the first table row, and
measures. It then clicks the summary, types "Ana" into the name field and measures again. Finally
it clicks the summary again and measures. The "starting open" story must then measure exactly like
the hand-expanded state.

Every state asserts the following:

- There is exactly one overflowing scroll owner among the document, every element in main and the
  Shell body: the Table's wrapper while bounded, the Shell body once released.
- The document has no horizontal scroll, and no label or summary is clipped.
- All 40 rows are mounted.
- While bounded, the foot lies inside the Shell.

The restored state must deep-equal the collapsed one. The marked input and row must be the same
nodes, and the input must still hold "Ana".

The table below shows the English values. German matches them in every engine at every size,
heads included, because both summaries fit one line. The one exception is at 360×720, where the
German table content is about 20px taller (scroll height 2578 vs 2558), from its longer row text.
"Table" is the bounded wrapper's client and scroll height.

| Window | Collapsed | Expanded | Restored |
| --- | --- | --- | --- |
| 1920×1080 | bounded, head 100, table 718/1658 | bounded, head 185, table 633/1658 | = collapsed |
| 1280×720 | bounded, head 97, table 370/1658 | bounded, head 182, table 285/1658 | = collapsed |
| 768×720 | bounded, head 84, table 399/1658 | bounded, head 276 (Firefox 275, WebKit 261), table 207 (208, 222) | = collapsed |
| 360×720 | bounded, head 74, table 423/2558 | **released**: head 407 (Firefox 405, WebKit 377), Shell scrolls | = collapsed (bounded again) |
| 1280×520 | bounded, head 97, table 170/1658 | **released**: head 182, Shell scrolls | = collapsed (bounded again) |
| 1280×420 | released (no room even collapsed) | released | = collapsed |

At 360×720 and 1280×520, expanding the filters leaves too little room for the head, the foot and
one readable table row. Pane's existing fit check, which observes every descendant of the pane,
then sets the fallback marker, and Screen releases the bound. Collapsing restores the bound with
identical geometry. This needed no registration and no change to Screen or Pane.

**Resizing with the filters open** (all engines): at 1280×520 the bound is released (Shell). At
1280×720 it is bounded again (Table, 285/1658). Back at 1280×520 it is released, with geometry
identical to the first measurement. The typed value is kept throughout.

## Limitations and consumer obligations

- **Find-in-page and fragment navigation.** Browsers that support it, Chromium among them, may
  open a collapsed `details` to show a find-in-page match or a fragment target. That is a browser
  action on the user's request, not an API of Collapse, and it was not exercised here.
- **Form validation.** Collapsed controls stay in their form. A consumer must reveal the section
  before focusing or validating an invalid control inside it, as stated in the TSDoc and the docs
  page. Collapse adds no validation or submit behaviour.
- **jsdom is not a browser.** Hidden-content exposure, keyboard activation and geometry come from
  the browser runner only. The WebKit and Firefox native accessibility trees were not inspected.
- **Fit is the consumer's to measure.** The composition is representative, not Label Manager's
  screen, and filter wording and initial presentation belong to the consumer. Publication, the
  version number and notifying the Label Manager orchestrator are the coordinator's, after review
  and merge.
