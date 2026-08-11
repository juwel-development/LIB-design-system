import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The whole recipe is one class: `inline-flex`. An SVG inside a plain inline span sits on the text
// baseline and reserves descender space beneath it - a silent few-pixel misalignment nobody sees
// until a mark is measured against a nav's right edge. `inline-flex` removes it. The component paints
// nothing else: it sets no colour and no dimension, so there is no `dark:` class and no token here.
//
// `cut` selects only the `data-cut` attribute - each option carries no class of its own, the way
// `Input`'s `variant` selects only the control's `type`. Its real job is being required: a caller
// cannot place a mark without stating which cut it is, so "has the reduction row been done?" is asked
// at every call site. There is deliberately no default variant.
const brandmark = cva('inline-flex', {
  variants: {
    cut: { full: '', compact: '' },
  },
});

export interface IBrandmarkProps extends VariantProps<typeof brandmark> {
  /**
   * What the mark says. Required so the decision is forced at the call site. Empty string is a
   * legitimate value - a mark beside the product name already set as text - and is not rejected.
   */
  name: string;
  /** The consumer's inline SVG. */
  children?: ReactNode;
  testId?: string;
}

/**
 * Names a consumer-supplied inline mark and makes its cut explicit. It hosts no asset: the SVG is the
 * consumer's, passed as `children` and rendered unmodified. A brand mark is text that has stopped
 * being text - drawn as outlines, it carries no accessible name of its own - so naming it is the job,
 * and the one thing a consumer most reliably gets wrong.
 *
 * `role="img"` makes the element a leaf in the accessibility tree, so nothing inside the SVG - a stray
 * `<title>`, `<text>` or `<desc>` - contributes, and the mark is announced exactly once.
 *
 * @Guarantees — enforced on every render
 * - A named mark (`name` non-empty) renders `role="img"` and `aria-label={name}`, announced exactly
 *   once and never through its SVG's own contents.
 * - A decorative mark (`name=""`) renders `aria-hidden="true"` with no `role` and no `aria-label`, so
 *   it leaves the accessibility tree entirely - an unnamed `role="img"` would be worse than absent.
 * - The cut in use is always stated and always readable from the DOM, via required `cut` -> `data-cut`.
 * - `children` renders unmodified; the component adds nothing to and strips nothing from the SVG, and
 *   sets no colour, dimension, margin or link of its own.
 *
 * @UXGuidelines
 * - One mark is not one asset - do the reduction row before you accept a mark. Measured on the lockup
 *   that prompted this: a 15-character full lockup is illegible at 32px, while its accent dot survives
 *   to 17px. A single SVG used at every size is the default and it is usually wrong. Expect at least
 *   two cuts out of any mark, which is why `cut` is required. There is no width-based swapping and no
 *   threshold token: a threshold is one wordmark's measurement, and keeping both cuts in the DOM to
 *   swap in CSS doubles the payload of the element inlined to keep LCP off the network. The component
 *   renders whichever single cut it is given; which slot it is in is known by whoever places it.
 * - The sanctioned accent, and how narrow it is. A fill-only colour that fails 3:1 as text may sit
 *   inside a letterform only where it carries no information and the glyph reads without it - a lifted
 *   `i`-dot qualifies because the `i` keeps its stem. The library sets no fill inside a consumer's
 *   mark and cannot check this; it is guidance to whoever draws the mark, not a token constraint.
 * - Inline the SVG rather than requesting it where the mark is the largest object on the first screen
 *   and therefore the LCP element - inlining means LCP depends on no font and no network round-trip.
 */
export const Brandmark: FunctionComponent<IBrandmarkProps> = ({
  name,
  cut,
  children,
  testId,
}) => {
  // The two paths differ in markup, not just in an attribute, so they are two branches: an empty
  // `name` must leave the accessibility tree, and a `span` carrying `aria-label` with no `role` is
  // both wrong and rejected by the a11y lint. `role="img"` is what makes `aria-label` valid here.
  if (name === '') {
    return (
      <span
        aria-hidden={'true'}
        data-cut={cut}
        className={brandmark({ cut })}
        data-testid={testId}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      role={'img'}
      aria-label={name}
      data-cut={cut}
      className={brandmark({ cut })}
      data-testid={testId}
    >
      {children}
    </span>
  );
};
