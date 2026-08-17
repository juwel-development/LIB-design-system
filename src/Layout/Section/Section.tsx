import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on the <section>. The join is the load-bearing part: a top rule is drawn only when the
// immediately preceding sibling also carries data-section, so it appears between two sections and never
// above the first - and never beneath a header, whose own rule is a direction-level choice (#14), not a
// default here. The [[data-section]+&] selector says exactly "every section after the first", which
// :not(:first-child) does not - that would rule beneath anything at all. It reads `rule`, not `border`:
// a section join carries the whole load a gap would, and at page scale a 1.23:1 line may not read as a
// separation. The rule spans the full element width in both bleed variants, since a border sits outside
// padding - the join is the page's structure, so it does not inset with the content. `bleed` is the only
// axis: inset holds content off the viewport edge by the gutter, full runs edge to edge for a hero or
// page head; both keep the vertical band. No margin and no max-width anywhere - sections abut, the band
// is air inside the unit, and Prose owns the reading measure. Colours are semantic tokens re-pointed by
// `.dark`, so no `dark:` class.
const section = cva(
  [
    // Anchor, not placement: a consumer hangs its own decoration off the join, and cannot get an anchor
    // by wrapping the section without costing two joins. No offset and no z-index, so the layout is
    // unchanged and no stacking context forms - decoration at z-index:-1 must still escape to an outer one.
    'relative',
    'py-[var(--space-band)]',
    '[[data-section]+&]:border-t [[data-section]+&]:border-solid [[data-section]+&]:border-rule',
  ].join(' '),
  {
    variants: {
      bleed: {
        inset: 'px-[var(--gutter)]',
        full: '',
      },
    },
    defaultVariants: { bleed: 'inset' },
  },
);

export interface ISectionProps extends VariantProps<typeof section> {
  /** Names the section as a region a screen-reader user can jump to. Omit for an ordinary section: an
   *  unnamed section is inert to assistive technology, which is the right default. Two or three named
   *  regions on a page is navigation; six is landmark noise, which is why this is opt-in. */
  name?: string;
  children?: ReactNode;
  testId?: string;
}

/**
 * The page's structural unit: a band carrying its own vertical air and, unless it bleeds, the gutter.
 * It arranges nothing inside itself - what it owns is the join to the section before it, which is why
 * it is a composable of the page rather than a container of its contents.
 *
 * @Guarantees — enforced on every render
 * - Sections abut and never gap: the component sets no margin, and the join is the separation. A rule
 *   appears only between two sections - drawn when the preceding sibling also carries data-section, so
 *   never above the first section nor beneath a header before it.
 * - A `bleed="full"` section drops the gutter and runs edge to edge; the vertical band is kept on both
 *   bleed variants, and the join spans the full width of either.
 * - An unnamed section is not a landmark: it emits no `aria-label` and is inert to assistive technology.
 * - The section is a positioning context, under either bleed, so a consumer may place absolutely-positioned
 *   decoration against its edges - including the join above it, the one edge only a section knows. It sets
 *   no offset and no `z-index`, so it is not a stacking context and decoration at a negative `z-index`
 *   still resolves against an outer one.
 *
 * @CallerMustEnsure
 * - Where `name` is given it matches the section's visible heading. The component labels the region with
 *   that string because it cannot reach the heading's id to reference it with `aria-labelledby` instead.
 * - A descendant meant to position against an ancestor *outside* the section is given its own positioned
 *   wrapper, since the section is now the nearer positioned ancestor and takes the anchor. The
 *   re-anchoring is silent - no error and no warning, only a descendant that lands somewhere else.
 *
 * @UXGuidelines
 * - On a page with no borrowed proof - no logos, no testimonials, no credits - a gap between blocks reads
 *   as missing content, while air inside the type reads as care. So the levers on a page's rhythm are the
 *   measure, the leading and the band, never a space between sections. This is why Section offers no gap
 *   and no margin.
 */
export const Section: FunctionComponent<ISectionProps> = ({
  bleed,
  name,
  children,
  testId,
}) => (
  <section
    data-section={''}
    className={section({ bleed })}
    aria-label={name}
    data-testid={testId}
  >
    {children}
  </section>
);
