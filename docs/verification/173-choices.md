# #173 Choices image tiles

Contract: the issue's **Agent Brief**, read with `gh issue view 173 --comments`, rather than the
original whole-screen request. Implemented in the `ticket-173` worktree on the existing
`feature/ticket-173` branch; no branch switch, publication, push or merge.

Implementation commit: `5b0be5e45be3c5ca4f5e9ed48d6ce17c13e6640a`.

## Public decisions

- `Choice.children` accepts `ReactNode`. Existing string labels retain their markup and naming.
  Rich labels must be non-interactive phrasing content valid inside a button. Consumers mark
  decoration with `alt=""` / `aria-hidden`. Caption-less, overlay-less Figure artwork renders
  a bare `img`, so it qualifies and is the documented intended image source. Neither Figure
  nor Tabs changes.
- `Choice.name?: string` supplies the option's accessible name. It replaces the label association
  with `aria-label`; the visible dash is retained, and descriptions remain `aria-describedby`.
  `name` expresses the glossary's **option name**, independently of the visible **label** and
  `Root.label` (group name). It does not affect the supplied identity, `value`.
- `--choice-tile-min-width` names the width floor of an individual choice tile, like the existing
  `--choice-marker-size` names that choice's marker. It is a role, not a size scale or preset list.
  The renderer declares the default `9rem` in all three token deliveries; a consumer theme can
  redeclare a positive definite length. `tiles` uses equal `1fr` tracks with auto-fill, falling
  back to one fitting column below the floor. The container decides the number of columns, per
  ADR 0008. Fixed artwork must fit within the tile content width; Choices never crops it or
  changes Figure's fixed-size contract. Tile padding reserves the themed marker height above the
  label so the marker cannot cover art or wording, including below the minimum tile width.

Component documentation is in `Choices.stories.tsx`'s
`parameters.docs.description.component`. No README changes. Unreleased changelog describes the
additive minor feature. The existing public `Choices` namespace exposes the new interface without
adding barrel exports; `check:build` checks its public export and emitted declaration snapshot at
`scripts/snapshots/choices.d.ts.snap`.

## Acceptance evidence

| Agent Brief criterion | Evidence |
| --- | --- |
| String and rich labels | Existing string-label tests unchanged; new DOM test names rich meaningful text and excludes empty-alt and aria-hidden decoration; typecheck accepts ReactNode through the public component |
| Separate accessible option name | New dash DOM test checks `No beard`, retained dash and accessible description; play checks named dash choices with no img in Beard and Headwear inventories |
| Equal tiles, container/token-driven count | Play computes expected track count from measured group width, gap and theme floor, checks equal measured widths and changes the theme floor from 9rem to 13rem using a consumer control |
| Selection without colour, accessible state, stable geometry | Play checks aria-checked and the marker after keyboard selection; compares all tile widths/heights/relative positions before and after selection |
| Full interactive workload | One gallery at a time: 14 Hairstyles (named image-bearing Bald), 11 Hair colours, 7 Beards, 5 Headwear, 6 Eyes; long English/German and unbroken names; two dash choices; external control updates image sources in place without requesting selection |
| Native keyboard and controlled conduct | Play uses storybook/test user-event Tab, arrows in both directions with wraparound and every declared row, checks Tab re-entry at a selected last tile, focus-visible/solid nontransparent ring/positive width and offset, verifies supplied request identities in order, exercises native Enter/Space, and checks that renders/current-choice activation/ignored requests do not select or emit extra requests |
| 1280 / 1024 / 684 geometry | Every inventory is measured at every requested viewport: equal widths, 64px artwork boxes with decoded 2:1 and 1:2 sources and object-fit contain, image bounds inside tiles, text below art, visible overflow/no clip path and no horizontal group/page overflow |
| Existing arrangements | Original vertical and wrapping tests/stories retained; existing unit tests pass, and inert tests additionally run for tiles |
| Public declarations / release notes | Build checks existing namespace export and declaration snapshot; Unreleased changelog records additive minor feature |

The new behavior was driven at the agreed seams: the first rich-label fixture failed typecheck
against string children; the named-dash DOM test failed before the name prop; the tile play failed
with “expected flex to be grid” and typecheck rejected `tiles` before the arrangement existed.

## Verification

Required command chain: `npm run build && npm run lint && npm run typecheck && npm run test`.
All passed: build includes JS, three CSS deliveries, declarations and snapshot; lint reports no
issues; typecheck exits zero; the full suite has **66 passing files / 1,584 passing tests**.
Storybook's production build also passes. Unit-suite logs: `/tmp/choices-173-final-test.log`;
Storybook build: `/tmp/choices-173-build-storybook.log`.

Browser reproduction:

```sh
npm run build
npm run build-storybook
python3 -m http.server 6174 --directory storybook-static
# In another terminal:
CHOICES_STORYBOOK_URL=http://localhost:6174 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/choices-tiles.mjs
```

The harness only creates a viewport, installs a theme/stylesheet, invokes the Storybook play and
captures its output/screenshots. **All assertions live in the story's `storybook/test` play**;
there are no Playwright driver tests. The play asserts the actual surface colour, so a mislabeled
theme case fails. Orca's embedded browser was tried first, but its background surface reported
`document.hasFocus() === false` and did not paint `:focus-visible`; it cannot exercise this focus
criterion. The fallback uses focused headless Chromium, preserving the focus-visible assertion.
No project dependency is added.

Browser matrix: source CSS light/dark, compiled combined CSS light/dark, compiled light-only CSS,
and compiled dark-only CSS, each at 1920×1080, 1280×720, 1024×720 and 684×720. After review this is
**48 plays**: 24 exercising all five complete inventories and 24 exercising a 100px container with
a 32px themed marker, image/text/dash labels, and no marker/content overlap. Chromium version and measured values are retained
in [the raw results](173-choices/results.json); the terminal log is `/tmp/choices-173-browser.log`.
Runtime: Chromium **156.0.8078.4**; no cross-engine claim is made.

With the fixture's 16px root font and 8px gap:

| Viewport width | Group width | 9rem floor: tracks / tile width | 13rem floor: tracks |
| --- | --- | --- | --- |
| 1920 | 1888 | 12 / 150px | 8 |
| 1280 | 1248 | 8 / 149px | 5 |
| 1024 | 992 | 6 / approximately 158.66px | 4 |
| 684 | 652 | 4 / 157px | 3 |

Track counts describe available grid tracks; inventories shorter than that occupy fewer tracks.
Screenshots show all four edge marks on contain-fitted wide/tall artboards and wrapped names:
[1280 light](173-choices/light-1280.png), [1280 dark](173-choices/dark-1280.png),
[1024 light](173-choices/light-1024.png), [684 light](173-choices/light-684.png),
[684 dark](173-choices/dark-684.png), [1920 light](173-choices/light-1920.png).

## Remaining ownership

No Agent Brief criterion is intentionally deferred. The review below covers both axes and keeps
the ticket In Review. Consumer whole-screen
no-scroll layout, category columns, reduced preview, eligible Person choices and Face composition
are explicitly out of scope. Landing and publication of a compatible release remain with the
coordinator/maintainer; this branch is not an installed release.

## Review of issue #173

Reviewed `git diff b185ca857e0aa64b585635ac4930a0997d8e1d03...HEAD`, pinned from
`git merge-base HEAD main`, with implementation commits `5b0be5e` and `50b0a2d`.
The Agent Brief in the issue comment is the spec. The dispatched worker reviewed both axes
itself, as instructed, without helper workers.

### Standards

No confirmed documented-standard violations or actionable baseline smells. Sources:
`docs/agents/standards/coding.md`, `architecture.md`, `testing.md`, and
`design-system-components.md`, plus the review skill's smell baseline.

Rejected fallow candidates:

- Unused tests, manual browser harness and props interfaces: these are Vitest/manual entry points
  and module-level public props required by the standards, not dead production code.
- Token drift on the tile grid: the arbitrary grid expression reads the named theme token; the
  component standard explicitly permits token-backed CVA styling. Marker classes predate this diff.
- Duplicate generated theme entries and component-local navigation/context code: theme deliveries
  are deliberately generated together; navigation/context code is unchanged, and the architecture
  forbids importing sibling component internals to unify it.
- Changed renderer contract: additive token output, unchanged function signatures, and regenerated
  files remain pinned by the token tests; no breaking caller change.
- Large story play / possible Divergent Change: the fixture demonstrates one gallery contract;
  named geometry functions already separate the reusable measurement behavior. No unrelated work
  or speculative API warrants splitting it further in this ticket.

### Spec

**Confirmed and fixed (medium): selection marker can obscure label content.** The brief requires
"Show every supplied choice, its image and full translated name" and a marker as the non-colour
selection cue. The new tile recipe positioned the marker absolutely over label content without
reserving space. A valid 100px tile containing 64px artwork (which fits its content width), long
text or a dash, with the supported 32px marker theme, reproduces the overlap.

The regression was added first as `NarrowTiles.play`; before the fix it failed with
`expected 57 to be less than or equal to 25` (marker bottom versus label top), recorded in
`/tmp/choices-173-review-red.log`. Tile top padding now includes `--choice-marker-size` plus the
existing spacing, keeping the full label below the marker. Shared play measurements require the
marker to stay above every label in both stories; the narrow story also checks the themed marker
size and the below-minimum single-column fallback. Selection code and existing arrangement recipes
are untouched. [Narrow regression screenshot](173-choices/narrow-light-1280.png).

Rejected spec candidates:

- Missing whole-screen no-scroll/Face/category-column example: explicitly consumer-owned in the
  Agent Brief's Out of scope section.
- No new barrel name: the existing public Choices namespace exposes the additions; its emitted
  declarations and unchanged namespace export are checked by `check:build`.
- Square image element boxes: Figure's documented fixed box uses `object-fit: contain`, preserving
  the decoded 2:1 and 1:2 artboards. This is not cropping or an aspect-ratio regression.

Summary: Standards 0 confirmed findings (none outstanding); Spec 1 medium finding, fixed and
covered by a failing-then-passing geometry play.

Review validation: `npm run build && npm run lint && npm run typecheck && npm run test` passes
(66 files, 1,584 tests), and the production Storybook build passes. All 48 tile plays pass against
that build across the six theme/CSS deliveries and four viewport widths. The unchanged
`scripts/browser/choices.mjs` acceptance harness also passes for vertical/wrapping arrangements,
long labels/descriptions, native keyboard movement, inert groups, ignored requests and form safety.
Logs: `/tmp/choices-173-review-test.log`, `/tmp/choices-173-review-build-storybook.log`,
`/tmp/choices-173-review-browser.log`, `/tmp/choices-173-review-existing.log`.


## Changed files

- `src/Interaction/Choices/Choices.tsx`: rich-label/name props and tile recipe; selection logic unchanged.
- `src/Interaction/Choices/Choices.spec.tsx`: rich/dash naming and inert coverage in all arrangements.
- `src/Interaction/Choices/Choices.stories.tsx`: component docs and arrangement control vocabulary.
- `src/Interaction/Choices/ChoicesTiles.stories.tsx`: full-workload interactive fixture and all browser assertions.
- `src/Theme/renderTokens.ts`, `src/Theme/renderTokens.spec.ts`: tile width role and delivery contract.
- `src/tokens.css`, `src/tokens.light.css`, `src/tokens.dark.css`: regenerated token declarations.
- `scripts/check-build.ts`, `scripts/snapshots/choices.d.ts.snap`: published namespace/declaration check.
- `scripts/browser/choices-tiles.mjs`: browser setup, play invocation and evidence capture only.
- `CHANGELOG.md`: Unreleased minor feature note.
- `docs/verification/173-choices.md`, `docs/verification/173-choices/`: this report, measured JSON and six screenshots.
