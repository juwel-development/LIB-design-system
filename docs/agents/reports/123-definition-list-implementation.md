# DefinitionList density and allocation implementation evidence (#123)

Date: 2026-10-03. Implemented by Orca workers (Claude) on branch `feature/ticket-123`. A first
implementation (`606aca3`, cut from `main` at `3739997`) was built from the issue body alone and
diverged from the maintainer-approved Agent Brief, which was posted to the issue and committed to
`main` as `docs/agents/reports/123-agent-brief.md` (`de7fd2a`) while that work was in progress. The
review worker merged `main` (`c47535a`), reworked the branch to the brief in `f312f0a` and applied
the review's findings in `4726e82`; the review itself is `docs/agents/reports/123-review.md`. Nothing was pushed, merged, published or
versioned; release stays with the coordinator. This report records what shipped and how it was
verified, including what was **not** verified.

## What shipped

- `DefinitionList.Root` gains `density?: 'comfortable' | 'compact'`, derived from the Root recipe.
  Density is the item air alone: `comfortable` (the default) pads each item from
  `--space-definition-item` (`1.5rem`, the value `py-6` resolved to), `compact` from
  `--space-definition-item-compact` (`0.5rem`). Typography, family roles (#120's `font-body` on
  term and description), hairlines, markup and the dimensions of composed controls are identical
  at both densities. The Root applies the padding to its items through its own recipe's
  `[&>div]` selector; no context, no hook, no data attribute.
- `Root` gains `termColumn?` and `descriptionColumn?`, each `{ weight: number; minWidth:
  `--${string}` }` in ColumnLayout's vocabulary. Defaults: term weight `1` with
  `--definition-term-min-width` (`9rem`), description weight `2` with
  `--definition-description-min-width` (`10rem`); either may be given alone. A non-positive or
  non-finite weight, or a `minWidth` that is not a custom-property name, throws
  `DefinitionListConfigurationError` (own file, extends `Error`).
- Both densities measure the list's own width. The Root writes `--definition-threshold`
  (`calc(var(--space-region) + max(var(m_term) * S/w_term, var(m_desc) * S/w_desc))`) and
  `--definition-term-share` (`calc(w_term / S)`) as inline custom properties; the `dl` is an
  inline-size container. Each item's recipe resolves the "Holy Albatross" twice: the term track is
  `max(share of the width after the gap, 100%-or-0)` and the column gap `max(0, region - 100%-or-0)`,
  so below the threshold the term track is the full width and the second track and gap vanish. The
  description's pin to column two, row one is a container style query on `--definition-shortfall`,
  a length the item computes from `100cqi` and `styles.css` registers with `@property` so the query
  compares a resolved value. Every `dt` is pinned to column one so several terms share one
  description; the `dd` spans both tracks unless the query pins it, so without style queries it
  sits below its terms at the full width. Terms and descriptions carry `overflow-wrap: break-word`
  at both densities. The four props interfaces are exported from the module.
- Tokens, additive: `--space-definition-item`, `--space-definition-item-compact`,
  `--definition-term-min-width`, `--definition-description-min-width`, declared in
  `renderTokens.ts` and regenerated into all three stylesheets; `PaletteTokens` untouched.
- Docs: consumer guidance lives in the stories' `parameters.docs.description.component` (the
  README section the first implementation added is removed, matching `2343e28`); ADR 0008's
  `#123` amendment is the maintainer's accepted contract followed by what shipped; `CONTEXT.md`
  keeps the maintainer's **Definition list density** entry and gains **Definition list allocation**.
- Stories, each with a geometry play function in `storybook/test`: `Default`, `SingleItem`,
  `MultipleTerms`, `Empty`, `Compact`, `Densities`, `LongValue`, `CompactLongValue`,
  `Threshold`, `ThemeMinimums`, `ConsumerAllocation`, `Keyboard`, `InSummaryPanel`,
  `CompactInContentDialog`.

## Decisions and why

- **Density changes air only.** The brief and the ADR amendment say so explicitly; the first
  implementation's label/small re-seating of the type roles was its own decision, and #120's
  contract ("DefinitionList terms remain body-family content regardless of their size") is kept.
- **Container adaptation at both densities, replacing the viewport switch.** The brief calls the
  replacement intentional; the coordinator confirmed it. The `NOTE:` footer on `f312f0a` publishes
  the change to the comfortable default: columns from a `g + 27rem` container instead of a 64rem
  viewport, a 1:2 split instead of a fixed 16rem track, the gap on `--space-region` instead of a
  literal 3rem.
- **Stylesheet-only switch, as ColumnLayout.** A ResizeObserver would have broken the "works with
  JavaScript off" guarantee, shifted layout on hydration, and missed theme changes without a
  resize. A grid cannot drop a pinned `dd` into column one on its own, which is why the pin is a
  container style query; where style queries are absent every description sits below its terms at
  the full width.
  Container style queries for custom properties are Baseline Newly available since Firefox 151
  (May 2026); Chrome 111 and Safari 18 preceded it.
- **Default minimums measured, not guessed.** With `--text-subtitle` at its 36px maximum,
  "Material" is 123px and "Contract" 134px wide in Chrome; a 9rem (144px) term minimum keeps such
  labels whole, and the content Dialog's 464px list still fits two columns (threshold 456px). A
  7rem default was tried and broke "Material" mid-word just above the threshold. Longer single-word
  terms ("Provenance", 181px) still break at the largest size; the docs say to re-point the token.
- **Inline-size container.** Required for `cqi`; the component documents the shrink-to-fit holder
  caveat, as ColumnLayout does.

## Test evidence

`DefinitionList.spec.tsx`: 22 `it` blocks, 25 cases after the review (27 before it dropped two
utility-class pins), written red before the rework (14 failed against the merged `main` component). They cover the closed prop surface (type-level), the semantic structure, an
empty list, typography and family roles, identical term/description classes at both densities,
per-density padding roles, the container class, the threshold and share text for the defaults, a
consumer allocation and a one-column override, the four configuration errors, the gap roles,
`testId` and the namespace. Wrapping is proven in the browser only. `renderTokens.spec.ts` pins all four
tokens in all three stylesheets and out of every `@theme` block. Geometry is proven in the browser.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 178 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 54 files, 1192 tests (the pre-commit hook ran all three on `4726e82`) |
| `npm run build` | Passed; `dist/index.css` carries the style query, the `max()` tracks and `@property --definition-shortfall`; `dist/types` carries `termColumn`/`descriptionColumn` |
| `npm run build-storybook` | Passed |

## Browser evidence

The static Storybook build was served locally and driven with Playwright 1.58 in Chrome on macOS,
1400x900 viewport, 16px root. Every DefinitionList story's play function passed (no assertion in
the console, no error template); the geometry was also read back with `getBoundingClientRect` and
`getComputedStyle`:

- `Threshold`: 28rem holders (448px) stack at both densities - tracks `448px 0px`, each `dt` and
  `dd` 448px wide, description below the term; 29rem holders (464px) open two columns -
  `146.7px 293.3px`, description left at 170.7px (term track plus 24px region gap), term and
  description bottoms equal (baseline rows). Words whole.
- `ThemeMinimums`: at 30rem (480px) the default lists are `152px 304px` at both densities; the
  lists under `--definition-term-min-width: 10rem` stack at both (threshold 504px).
- `ConsumerAllocation` 1:3 with 9rem/9rem tokens: 40rem fits at `154px 462px`; 36rem stacks.
- `Densities`: both lists `152px 304px` at 30rem; item padding 24px comfortable, 8px compact;
  term 36px and description 17px at both, same family.
- `Compact`: padding equals the resolved `--space-definition-item-compact` (8px) top and bottom.
- `LongValue` (36rem, comfortable): `184px 368px`; the sentence wraps to several lines, the
  German compound and the unbroken `WERKSTATT-…` token wrap inside their tracks; `dl` scroll
  overflow 0, page overflow 0.
- `CompactLongValue` (20rem): stacked, wrapping, no overflow.
- `MultipleTerms` (40rem): second `dt` under the first in column one, `dd` beside the first.
- `SingleItem`: one item, two columns at the canvas width, a rule above and below.
- `Empty`: an empty `dl`, 0px tall, no error.
- Undeclared minimum token (threshold rewritten to name `--nope`): the list stays stacked, one
  464px track. Pin forced off (simulating a browser without style queries): tracks
  `146.7px 293.3px`, the description 464px wide below its terms.
- `Keyboard`: tab order link → button → link → button across the two lists; shrinking the wide
  holder to 20rem while its button is focused stacks the list, keeps focus and the button's
  height; widening restores the columns with focus intact.
- `InSummaryPanel` (85rem page, 2:1 ColumnLayout, Box, consumer 8rem/8rem tokens): two columns
  inside the one-third panel; at 72rem the layout still holds and the facts stack inside the
  panel alone; no page overflow.
- `CompactInContentDialog`: list 464px inside the 512px content region, `146.7px 293.3px`; focus
  inside the Dialog on open; the play closes through the Close control and focus returns to the
  trigger. A real Escape keypress (Playwright) closes the Dialog and returns focus to the trigger.
- `Default` at a 360px viewport: stacked, no overflow, term 24px (the subtitle clamp's floor).
- Under `.dark` the term, rule and description colours re-point with no `dark:` class.

## Not verified

- Firefox and Safari were not driven; the style-query pin's behaviour there rests on the
  documented support (Firefox 151, Safari 18) and the stacked fallback.
- The consumer composition was approximated (a paragraph stands in for the comparison table); the
  product's real page widths and fonts were not exercised.
- Screen-reader output was not checked; the markup is the unchanged `dl`/`div`/`dt`/`dd`.

## Compatibility

Additive public API: `density`, `termColumn`, `descriptionColumn` on `Root`, all optional; no
member removed or renamed, no required prop, no token removed, `PaletteTokens` untouched. One
default-rendering change, published by the `NOTE:` footer: the comfortable list's column switch,
split and gap. The commit is a `feat`, so the next release is a minor.

## Publication

Not published. The release version is whatever semantic-release derives when `main` is
published; record that actual version in g-label-manager #195 after the fact, never this
report's guess.
