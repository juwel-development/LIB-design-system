# Sidebar long-label wrapping - implementation evidence (#122)

Date: 2026-10-03. Branch `feature/ticket-122`, cut from local `main` at `3739997` (package 3.9.1),
against [issue #122](https://github.com/juwel-development/LIB-design-system/issues/122) for consumer
[juwel-dev/g-label-manager#195](https://github.com/juwel-dev/g-label-manager/issues/195). The
issue's approved **Agent Brief** (its one comment) is the specification: it narrows the work to the
verified label-wrapping gap, desktop regression coverage and stories, and release reporting, and
rules out any change to the responsive arrangement or the active-entry treatment. Nothing was
pushed, merged, published or versioned. **Implementation and publication are reported separately:
no release exists for this work yet, and the consumer ticket records a version only once a human
publishes one.**

## History

The first commit on this branch (`ccd472c`) was made 22 minutes before the brief was posted and
built to the original issue body: it also moved the below-64rem list from a column to a wrapping
row and added a marker bar with a new `--sidebar-marker-thickness` token. The review
(`122-review.md`) found both out of the brief's scope, and the coordinator confirmed the revert;
the branch was squashed into one `fix(sidebar)` commit holding only what the brief asks for.

## What shipped

- **Labels wrap inside their entry.** The entry recipe gains `overflow-wrap: anywhere`. A phrase
  still wraps at its spaces; a word wider than the 12rem track now breaks within itself instead of
  overflowing the nav. Unlike `break-word`, `anywhere` also folds the long word into the entry's
  min-content size, which is what keeps the flex-column `li` from stretching the nav's scroll width.
  Nothing is truncated, no `title` or `aria-label` renames an entry, and no horizontal scrolling
  is introduced in either arrangement.
- **Everything else is unchanged.** The 64rem switch, the 12rem side track, the above-content
  column below it, the sticky and capped nav, the underline plus `aria-current` active treatment,
  the inert treatment, the focus ring, the three props interfaces, every token and every default
  value are exactly main's.
- **Stories.** `TranslatedLabelsBroadDesktop` (pinned at 1440px) and `TranslatedLabelsNarrowDesktop`
  (pinned at 800px) render the consumer's six sections in German, with
  `Vertragsverhandlungsübersicht` - the brief's regression input - as the active entry. Both carry
  a play function that measures, in the browser, that every label's line boxes sit inside its entry,
  that neither the nav nor the page scrolls sideways, that the active entry keeps `aria-current` and
  its underline, and that the first Tab lands on the first entry with a solid outline; the broad one
  also pins the track to 12rem with the content beside it, the narrow one the content below the
  list. The existing `Stacked` story moves to Storybook 10's `globals.viewport` API, which the old
  `parameters.viewport.defaultViewport` no longer drives.
- **Docs.** The stories meta carries a `docs.description.component` explaining the responsive
  arrangement and the wrapping guarantee without consumer CSS; Sidebar's TSDoc guarantees gain the
  same wrapping bullet, which reaches the consumer's editor through `dist/types`.

## Public API and compatibility

Verified against a build of the merge-base, not from the commit message: `dist/index.css` differs
by one added utility rule (`.wrap-anywhere`, joining the existing `[overflow-wrap:anywhere]`
selector); `dist/types` differs only by the added TSDoc bullet; `dist/design-system.js` differs
only by the class string; the set of token names in `tokens.css`, `tokens.light.css` and
`tokens.dark.css` is identical. No prop, member, token or default value was added, removed or
renamed. The one consumer-visible change is a word that previously overflowed now wrapping - the
fix itself - so the commit is a `fix` with no `NOTE:` footer and no breaking-change marker.

## Test evidence

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 47 files, 854 tests |
| `npm run build` | Passed; `.wrap-anywhere` present in `dist/index.css` |
| `npm run build-storybook` | Passed |

`Sidebar.spec.tsx` gains one jsdom test: `Vertragsverhandlungsübersicht` renders in full with no
`title` and no `aria-label`. The wrapping itself is not observable in jsdom; it is proven by the
play functions and the browser pass below.

## Browser evidence

Storybook dev served on a private port and driven headless in Google Chrome through Playwright 1.63
from the scratchpad, with real Tab key presses. Numbers are `getBoundingClientRect`, `scrollWidth`
and `getComputedStyle` facts.

| Case | Measured |
| --- | --- |
| Reproduction, `LongLabels` at 1440px with the word injected and `overflow-wrap` forced to `normal` (main's behaviour) | 243px of text in a 173px button, nav scroll width 248px against 183px client width - the brief's failure, reproduced |
| Same page with the shipped CSS | The word breaks into two lines (169.6px + 73.2px) inside the 173px button; nav scroll width 183px = client width |
| `TranslatedLabelsBroadDesktop` 1440px and 1024px, light and dark | Grid `192px 1fr`, `ul` column; every entry `scrollWidth == clientWidth`; the long word and the long phrase each take two lines; the track stays 192px with the content at x 232; no page overflow; play function passed |
| `TranslatedLabelsNarrowDesktop` 800px and 1023px, light and dark | Single grid track, `ul` column above the content (content top 243px below the list's bottom 219px); every label on one line within its entry; no page overflow; play function passed |
| Keyboard, every case | Real Tab visits the six entries in DOM order, each stop `:focus-visible` with a `solid 3px` outline at 2px offset |
| `Controlled` at 1440, 1024, 1023 and 800px | Side track at 1024px, above-content at 1023px - the switch sits at 64rem exactly; the inert "Contracts" is skipped by Tab; `ul` stays a column at every width |
| `OversizedNavigationInFrame` at 1440px, the word injected into entry 1 and twice into entry 21 | Nav capped at 384px with 1352px of scroll height; both injected entries wrap (2 and 4 lines) with no sideways scroll; 40 Tab presses reach "Section 40", every stop `:focus-visible` and inside the nav's scrollport |
| `Stacked` at 320px, `ActiveAndInert` at 1440px | Unchanged from main: column, underline on the active entry, ring on Tab |

## Limitations

- jsdom cannot assert wrapping, overflow or focus paint; those rest on the play functions (run in
  the Storybook browser) and the Playwright pass above. The repository's testing standard keeps a
  browser-driver level out of the vitest suite, so the Playwright script stays in the scratchpad.
- Verification used headless Chrome only. Tablet and phone widths are outside the brief; the
  `Stacked` story still shows the above-content column on a phone canvas.
- The consumer screens were not composed here; #195 stays with the consumer.
