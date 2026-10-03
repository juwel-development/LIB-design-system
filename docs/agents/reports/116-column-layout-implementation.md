# ColumnLayout implementation evidence

Date: 2026-10-03. Implemented by Claude Fable 5.1 as an Orca worker for
[#116](https://github.com/juwel-development/LIB-design-system/issues/116) against the approved
[agent brief](./116-agent-brief.md), on branch `feature/ticket-116` cut from local `main` at
`3739997` (package 3.9.1). Nothing was pushed, merged, released or moved past **In Progress**
on the board; the `/code-review` step is a separate dispatch. Publication is deferred to the
human release: no version is claimed here and consumer
[#195](https://github.com/juwel-dev/g-label-manager/issues/195) is to be updated with the
version semantic-release actually publishes.

## Contract

The public barrel exports one roster entry, `ColumnLayout`, a namespace of `Root` and `Column`
under `src/Arrangement/`, the Arrangement kind ADR 0008 names. `Stack`, `Cluster` and every
other export are untouched.

`Root` takes `gap?: 'stack' | 'region'` (default `region`), `children` and `testId`. `Column`
takes a required positive finite `weight`, a required `minWidth` typed as `` `--${string}` ``,
`children` and `testId`. No `className`, `style`, raw length, `var()` string or preset reaches
the surface. A non-positive or non-finite weight, or a `minWidth` outside
`/^--[A-Za-z0-9_-]+$/`, throws `ColumnLayoutConfigurationError`; a `Column` that is not a
direct child of a `Root` (loose, nested in another column, or reached through a wrapping
component) throws `ColumnLayoutCompositionError`. Arrays, fragments and conditional omissions
are direct children. Consumer documentation is the [README section](../../../README.md#columnlayout)
and the TSDoc on the namespace; the `CONTEXT.md` entry and the ADR 0008 amendment predate the
work and match what was built.

## Mechanism

The arrangement needs no JavaScript at run time and no measurement, so a server renders the
right markup, a theme change takes effect on the next layout, and no observer can lag or
flap. `Root` reads its `Column` children's props once per render and writes the brief's
threshold as one custom property on its element:

```
--column-layout-threshold: calc((n - 1) * var(--column-layout-gap) + max(var(--m_1) * S / w_1, …))
```

The gap variant publishes `--column-layout-gap` beside the `gap` utility, so the switch and the
paint read one declaration. Each `Column` is a flex item with `flex-grow: <weight>`,
`min-width: 0` and

```
flex-basis: clamp(0px, (var(--column-layout-threshold) - 100%) * 1000000, 100%)
```

in a wrapping, top-aligned flex row. At or above the threshold the basis is 0 and the columns
share one line, growing by weight over the width left after the gaps, which is the proportional
allocation exactly. Below it the shortfall is amplified past 100% and clamps there, so every
column takes its own line and fills it. The factor turns a 1/64 px shortfall, Chrome's layout
grain, into a full switch, so there is no intermediate state. Nested arrangements work because
the inner `Root` redeclares the property for its subtree.

## Test evidence

The spec was red on the missing module before the component existed, and each failing case was
made green in turn. The 32 `ColumnLayout` tests cover, through the public namespace:

- Closed types: Root's gap union, Column's numeric weight and `--`-prefixed token name, with
  `@ts-expect-error` on a raw length and a `var()` string.
- A plain `div` root with no landmark or heading; columns as direct `div` children in written
  order with content unmodified; `testId` on either member; no outer margin; no `dark:` class.
- The region gap by default and the stack gap on request, with the band role never emitted.
- The written threshold for 2:1, 2:1:1 and 0.5:1.5, the weight each column receives, the gap
  reference following the chosen role, no threshold on an empty root, and a single column's
  threshold being its own minimum with no gap.
- Omitted conditional columns counting for nothing; columns in arrays and fragments counting;
  a column inserted later redistributing while the retained column keeps its element, its
  focus and its typed value; weights changing without a remount; an inner arrangement inside a
  column keeping its own threshold.
- Composition errors for a loose column, a column behind a wrapping component and a column
  nested in a column; configuration errors for zero, negative, NaN and infinite weights and for
  five malformed token names.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 48 files, 887 tests, including 32 ColumnLayout tests |
| `npm run build` | Passed; `dist/index.css` carries the generated `flex-basis: clamp(…)` and `flex-grow: var(--column-layout-weight)` rules |
| `npm run build-storybook` | Passed; eleven ColumnLayout stories |

## Browser evidence

The Storybook dev build was driven in headless Chrome (channel `chrome`, Playwright in a scratch
directory) across all eleven stories in both themes at a 1400 px viewport, reading
`getBoundingClientRect` and each story's play-function outcome. Every play function finished
with no assertion error. The measured facts, all at a 16 px root and a 24 px region gap:

- **2:1 in 1024 px:** 666.67 px and 333.33 px, tops both at 16 px, heights 226 px and
  304.75 px. **2:1:1 in 1152 px:** 552, 276 and 276 px with three distinct heights.
  **0.5:1.5 in 1024 px:** 250 and 750 px.
- **Threshold:** with minimums of 28rem and 12rem the documented threshold is
  `24 + max(448 × 1.5, 192 × 3)` = 696 px. The 695 px holder stacked (two 695 px tracks at
  different tops); the 696 px holder held the row at 448 and 224 px; the 697 px holder held it
  at 448.67 and 224.33 px.
- **Two holders on one viewport:** 832 px kept 538.67/269.33 px while 384 px beside it stacked
  two 384 px tracks. **Share below minimum:** at 3:1 in 640 px, where 20rem + 16rem + gap would
  fit, the quarter share (154 px) failed its 256 px minimum and both tracks stacked at 640 px;
  in a 224 px holder both stacked at 224 px, below the 256 px minimum.
- **Theme minimums:** `48ch`/`12em` fit in 768 px (496/248 px); the same markup under a scope
  re-pointing them to `60ch`/`22em` stacked (768/768 px).
- **Long content:** a German-captioned table with an unbroken 60-character identifier beside
  wrapping German prose held 581.33/290.67 px in 896 px, the first track's right edge at or
  before the second's left, and `scrollWidth` equal to `clientWidth` (1400 px).
- **Conditional column:** one 1024 px track before selection; after a real click, two tracks at
  666.67/333.33 px with the table's element identical.
- **Keyboard:** Tab moved search → open → search → open across a row instance and a stacked
  instance; with the wide holder shrunk to 24rem the arrangement stacked and the focused search
  field kept focus and its typed text, and kept both again when widened back.
- **Stack gap:** an 8 px gap between the row's tracks and between the stacked lines.

Screenshots for every story in light and dark were reviewed in the scratch directory and are
not committed. The Storybook a11y addon was not run in this session; the reviewer dispatch is
the place for an axe pass.

## Deviations and notes

- No library token was introduced: the minimum-width tokens are consumer roles by the ADR 0008
  amendment, and the stories declare demonstration values on their holders.
- `0px` and `100%` appear in the column recipe as the switch's two states; they are not
  measurements, and the comment on the recipe says so.
- `Root` wraps each counted `Column` in a context provider at its own position, keeping
  React's keys, which is what lets a conditional column appear without remounting its siblings
  and what makes a column behind a wrapping component detectable rather than silently uncounted.
- The README's structure note now lists `Arrangement` beside the three categories it already
  named; the directory existed before this ticket.
