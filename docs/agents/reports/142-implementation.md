# Issue #142 implementation evidence

Date: 2026-11-04. Branch: `feature/ticket-142`.

## Contract and scope

Fetched issue #142 and both comments. Implemented the accepted bounded-table decisions in
`0c9e76d`, recorded in ADR 0008, using the existing column allocation and selection contracts.
`Table.Root bounded` owns both scroll axes, retains tabular columns at every width, pins an opaque
surface-backed header, preserves caption naming, and keeps short or unsized tables at natural
height. Overflow controls the wrapper's named group and tab stop, retaining them while focused.
Focus reveals rows and controls below the measured header; selection alone does not scroll.
`Dialog.Content scrollOwner="child"` delegates scrolling to one bounded child; the default remains
`body`. Public component docs and Table/Dialog Storybook descriptions state caller constraints.
The domain language and ADR already contain the accepted contract and needed no further decisions.

The coordinator assigned the Pane integration story and public composition test to #141 after
reviewed #142 lands. This branch documents that composition but does not duplicate #141's work or
modify Pane. No other sibling feature is implemented here.

## Validation

- Red/green public tests: bounded vertical overflow and tab-stop removal; focus reveal with
  selection preserving scroll; additional caption/notes and focus-retention coverage.
- Table and Dialog targeted suite: 111 passing tests (75 Table, 36 Dialog).
- Full suite: 61 files, 1,392 tests passed. Existing jsdom navigation diagnostic remains unchanged.
- `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run build-storybook` passed.
- Storybook initially served uncompiled Tailwind. The minimal `@tailwindcss/vite` addition in
  `.storybook/main.ts` matches sibling #128 commit `1d73aae` exactly, by coordinator agreement.

Orca's embedded WebKit browser ran the new stories and their play assertions:
Bounded, BoundedShort, BoundedNarrowComparison, BoundedBothAxes, BoundedUnsized,
BoundedDialog, BoundedDynamic, BoundedHiddenCaption, and BoundedContentDialog.

Measured examples (CSS pixels):

| Example | Client height | Scroll height | Result |
| --- | ---: | ---: | --- |
| Long bounded | 288 | 1658 | Table wrapper scrolls; header remains pinned |
| Short bounded | 157 | 157 | Natural height; no wrapper tab stop |
| Narrow comparison | 288 | 1710 | Scroll width equals client width, 305 |
| Both axes | 273 | 1658 | Scroll width 525 exceeds client width 305 |
| Unsized parent | 473 | 473 | Natural growth, no forced vertical bound |
| Dynamic, filtered | 215 | 215 | Wrapped header retained; tab stop removed |

The dynamic example exposed WebKit performing native focus scrolling after the focus handler,
which could hide a target behind a wrapped header. Measured scroll padding fixes that second
movement. Header, caption, table and wrapper resize observation plus content mutation observation
keep overflow and header geometry current. The dynamic play also checks selection without scroll.

At 390px in dark mode, bounded content notes remain table cells, allocated supplementary notes
remain visible, all three header/body column left edges match within 1px after horizontal scroll,
and the pinned header surface resolves to opaque `rgb(15, 23, 42)`. Programmatic focus stays below
the header and within the scrollport, with page scroll at zero and no document-width overflow.
Tab and Shift+Tab also moved between a row and its control without obscuring focus or moving the
page. Orca's synthetic keyboard actions did not activate WebKit's `:focus-visible` modality, so these
checks establish focus geometry, not a visually observed keyboard ring; the shared ring recipe is
retained and its 3px width plus 2px offset are reserved in the scrollport.
Visible captions scroll away while the native table retains its name; hidden captions retain naming.
Unbounded regression checks at 390px confirm content rows still stack, supplementary note cells
still hide, no-note tables keep their section wrapper, and none receives a maximum height.

At 1280×720, Dialog's Table scrollport is 406px high for 1658px of content, while Content has equal
client/scroll heights of 454px and the Dialog has equal heights of 672px. Actions end at y=696.
At 1920×1080 these values are 766/1658, 814/814, 1032/1032, and y=1056 respectively.
In both sizes the Table is the sole overflowing region, focus stays below the header, and page
scroll remains zero. Both screen and content Dialog extents passed the composition play assertions.

## Remaining integration and limits

Fresh code review belongs to the coordinator's separate reviewer. Pane composition evidence belongs
to #141; it must be checked against the final merged Table implementation. Chromium/Firefox and
assistive-technology sessions were not run; jsdom tests are not claimed as layout evidence.
Release publication is intentionally deferred to the human push workflow: no push, merge, issue
closure, Done transition, version edit, or release publication was performed.
