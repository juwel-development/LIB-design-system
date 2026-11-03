import { cva } from 'class-variance-authority';
import type { FunctionComponent } from 'react';

const rule = cva(
  'w-full shrink-0 border-t border-solid border-border forced-colors:border-[CanvasText]',
);

export interface IRuleProps {
  testId?: string;
}

/**
 * A decorative horizontal hairline between two blocks of one arrangement.
 *
 * @Guarantees
 * - One CSS pixel in the theme's border role, spanning its holder's width.
 * - Forced colours use CanvasText so the hairline survives the user's palette.
 * - Always hidden from assistive technology, with no role, content or focus stop.
 * - No margin or padding: the surrounding arrangement owns space on both sides.
 *
 * @CallerMustEnsure
 * - Place it between blocks in a column Stack; Stack's gap supplies the space role.
 * - Rule is never a semantic separator. A thematic break that must be conveyed to
 *   assistive technology requires semantic markup instead of this component.
 *
 * @UXGuidelines
 * - Use Collection for a semantic list with rules between items; Rule creates no list.
 */
export const Rule: FunctionComponent<IRuleProps> = ({ testId }) => (
  <div aria-hidden={'true'} className={rule()} data-testid={testId} />
);
