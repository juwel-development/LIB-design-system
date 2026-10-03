# DefinitionList compact density implementation evidence (#123)

Date: 2026-10-03. Implemented by an Orca worker (Claude) on branch `feature/ticket-123`,
cut from local `main` at `3739997` (package 3.9.1); the feature landed as `606aca3`. The issue carries no comments and no
agent brief; the contract below was derived from the issue body, the consumer evidence in
[g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195) (its
component-gap and layout-parity reports and the original reference prototype), and the
standards and ADRs in this repository. Nothing was pushed, merged, published or versioned;
review and release stay with the coordinator. This report records what shipped and how it was
verified, including what was **not** verified.

## What shipped

- `DefinitionList.Root` gains `density?: 'comfortable' | 'compact'`, derived from the Root
  recipe. The resolved density is stated on the `dl` as `data-density` and shared with the
  members through a module-private context. No other member gains a prop; the namespace still
  carries exactly `Root`, `Item`, `Term`, `Description`.
- `comfortable` (the default) renders as before: subtitle terms, body muted descriptions capped
  at `--measure`, hairlines, single column below a 64rem viewport and a fixed 16rem term track
  above it. The only markup change is the `data-density` attribute; the item's `py-6` now reads
  `--space-definition-item`, which ships at the same `1.5rem`.
- `compact` is the fact-list treatment: terms at the label role in the secondary family,
  muted (Table's header-cell device); descriptions at the small role, foreground, tabular
  figures, still capped at `--measure`; both wrap an unbroken token (`overflow-wrap:
  break-word`); item air from `--space-definition-item-compact` (`0.5rem`, Table's `py-2`);
  the `dl` becomes an inline-size container and each item switches from one column to
  proportional `1fr 2fr` baseline-aligned columns at a 24rem container, with `--space-stack`
  between a stacked term and value and `--space-region` between the columns.
- Tokens: `--space-definition-item: 1.5rem` and `--space-definition-item-compact: 0.5rem`
  declared in `renderTokens.ts` and regenerated into `tokens.css`, `tokens.light.css` and
  `tokens.dark.css`. Additive; no token removed or renamed, `PaletteTokens` untouched.
- Docs: `README.md` gains a `## DefinitionList` section; `CONTEXT.md` gains the
  **DefinitionList density** entry beside Table density; ADR 0008's Amendments record the
  #123 decision as a second narrow density exception argued on its own evidence.
- Stories: `LongValue`, `ComfortableInNarrowContainer`, `Compact`, `CompactLongValue`,
  `CompactNarrowContainers` (14/22/30rem holders on one canvas) and `CompactInContentDialog`
  (a content-extent Dialog opened by a button), plus a `density` control on the meta.

## Decisions and why

- **A density, not a size prop.** The consumer's defect was the term's subtitle role reading
  as a heading beside a one-word value, so a compact that only trimmed padding would not have
  met #123. Density here therefore re-seats type roles, which Table's does not; both roles it
  moves to (label, small) already exist and are the ones Table pairs for a labelled value.
  Recorded in ADR 0008 and the glossary so the two densities are not read as one scale.
- **Container query only in compact.** Making the comfortable default container-aware would
  change existing consumers' rendering and would expose every existing list to the
  inline-size-container collapse inside shrink-to-fit frames (flex rows such as
  `Stack direction="split"`). Compact accepts that constraint and documents it as a
  CallerMustEnsure; both consumer sites (a bordered panel, `Dialog.Content`) are block
  contexts.
- **Thresholds and proportions are literals in the recipe**, as `Rail`, `Stack` and the
  comfortable track already are: 24rem container (Tailwind's `@sm`), 1:2 tracks from the
  reference prototype's `minmax(130px,1fr) minmax(0,2fr)`.
- **Tokens in rem**, matching Table's cell padding rather than Collection's em, because the
  members set their own type roles so there is no inherited size for the item's air to follow.

## Test evidence

`DefinitionList.spec.tsx`: 24 tests (12 new), written red before the implementation, each
failing on the unmodified component. New coverage: the Root prop type is closed to the two
treatments (`expectTypeOf` over `ComponentProps`); default density stated on the `dl`;
`dl`/`div`/`dt`/`dd` structure and term-before-description order at compact; compact term and
description roles; compact columns keyed on `@container`/`@sm` with no `lg:` left; comfortable
keyed on `lg:` with no container context; per-density padding roles; stack/region gaps;
hairlines kept; unbroken values wrap; the no-card/no-fill and no-`dark:` scans run at both
densities. `renderTokens.spec.ts` gains one test pinning both tokens in all three stylesheets
and out of every `@theme` block. Class-string assertions follow the file's existing
convention for stylesheet-keyed behaviour jsdom cannot lay out; geometry is proven below.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 153 files checked |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 47 files, 867 tests, run by hand on the committed tree (the worktree's pre-commit hook file is not executable, so git skipped it) |
| `npm run build` | Passed; `data-density`, both tokens and `@container (width>=24rem)` present in `dist` |
| `npm run build-storybook` | Passed |

## Browser evidence

The static Storybook build was served locally and driven with Playwright 1.58 in Chrome
154 on macOS. Measured with `getBoundingClientRect` and `getComputedStyle`:

- `CompactNarrowContainers` at a 1400px viewport: in the 14rem and 22rem holders every item
  is one column (`grid-template-columns` equals the holder width, the value's top at or
  below the term's bottom); in the 30rem holder every item is `152px 304px` with term and
  value bottoms equal (baseline rows). In all three the `dl` equals its holder's width,
  `container-type` is `inline-size`, and neither holder nor page overflows horizontally.
- `CompactLongValue` (24rem holder): `120px 240px` columns; the sentence-long value wraps to
  three lines; the unbroken `WERKSTATT-…-0042` token wraps inside its 240px track with no
  overflow.
- `Compact` at full width: `448px 896px` columns, the value capped at `--measure`
  (623.6px, 66ch at 15px); at a 360px viewport one column, no overflow. Term 13px, weight
  500, tracked; value 15px with `tabular-nums`; item padding 8px, column gap 24px, 1px rules.
- `Default` (comfortable): `256px 1064px` columns, 48px gap, 24px padding, 36px term and
  17px value at 1400px; one column at 800px. Unchanged from `main`.
- `ComfortableInNarrowContainer` (22rem holder, 1400px): the fixed 256px track opens and the
  value column is 48px wide with overflow, which is the preserved pre-#123 behaviour the
  story documents and the compact treatment exists for.
- `CompactInContentDialog`: the Dialog is 512px wide, its content region 512px, the `dl`
  464px, every item `146.7px 293.3px` with equal term and value bottoms; focus is inside the
  Dialog on open and returns to the opening button after Escape; no horizontal overflow.
- Under `.dark` the compact term, value and rule colours re-point (muted, foreground and
  border roles) with no `dark:` class in the markup.

## Not verified

- No consumer composition was built: the one-third A&R summary panel depends on the
  proportional split and bounded panel of other tickets (#116, #124). The compact list was
  verified in holders of the widths that split produces, not inside it.
- Theme re-pointing of the two new tokens was not exercised in the browser beyond the shipped
  defaults; the stylesheet test pins their declaration.
- Screen-reader output was not checked; the markup is the unchanged `dl`/`dt`/`dd` structure.

## Compatibility

Additive. No public API, default rendering, token, required prop or theme type changes;
`PaletteTokens` is untouched. The commit is a `feat`, so the next release is a minor.

## Publication

Not published. The release version is whatever semantic-release derives when `main` is
published; record that actual version in g-label-manager #195 after the fact, never this
report's guess.
