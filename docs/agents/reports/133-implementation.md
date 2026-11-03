# #133 implementation

Added `Table.Root captionVisibility="visible" | "hidden"`, derived from its CVA recipe,
with visible as the default. Hidden captions remain the native first child and accessible
name, but use the library's visually hidden treatment without caption padding or layout space.
The required caption and the existing scroll-region/group naming contract are unchanged.
No alternative naming prop, consumer CSS, token override, or release/version change was added.

The public contract and Storybook documentation permit hiding only when visible text directly
above the table already names what it lists. The enclosing arrangement owns the gap.
Three examples cover a heading, a quantities line with compact allocated columns, and responsive
content notes; they use existing H2, P, Stack, and Table components with no missing dependencies.

## Verification

- Red: typecheck failed on the new public captionVisibility contract before implementation.
- Green: the Table suite passes 67 tests, including required/closed prop types, native caption
  preservation across visibility changes, and unchanged scroll naming in all three note modes.
- `npm run build`, `npm run lint`, `npm run typecheck`, and `npm test` passed;
  the full suite passes 1,323 tests in 57 files.
- `npm run build-storybook` passed. All three new story play functions finished successfully
  in the Orca browser; they check accessible naming, native caption order, clipping, zero padding,
  and first-row geometry through the rendered story.
- Browser checks at 390px and 1024px confirm hidden captions are absolutely positioned with zero
  padding; the first row begins within 0.5px of the table top (collapsed border), with Stack's
  8px gap above. The default visible caption retains 12px padding and its layout space.
- At 390px the allocated example scrolls 464px of content within 358px, retaining its named
  group; at 1024px it fits and drops the conditional group as before. The browser accessibility
  tree retains the named table and native caption. The narrow quantities example was also
  inspected visually via screenshot.
- Existing non-failing warnings remain: jsdom document navigation, Storybook's absent MDX glob,
  generated CSS optimization warnings, and bundle-size/deprecation notices.

## Outstanding

The fresh two-axis Codex review is recorded in [133-review.md](133-review.md).
The ticket's publish-a-release acceptance criterion remains outstanding by explicit instruction:
the human push/release must publish this change. Nothing was pushed, merged, published, bumped,
or set Done.
