import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Level fixes role: an h1 is always the display role, with no size prop to invert the ladder
// (docs/adr/0005). Weight inherits - Tailwind's preflight resets h1-h6 to font-weight: inherit, so
// the sized levels carry no weight class. Colour is a semantic token re-pointed by `.dark`, so no
// variant carries a `dark:` class.
const h1 = cva('font-primary text-display leading-display', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

export interface IH1Props extends VariantProps<typeof h1> {
  children: ReactNode;
  testId?: string;
}

/**
 * The page-title heading, an `h1` at the display type role.
 *
 * @Guarantees — enforced on every render
 * - Renders an `h1`; its outline level and the display role are one choice, not two (docs/adr/0005).
 * - Reads `--font-primary`, sized by `--text-display` and led by `--leading-display`.
 * - `color` selects the `foreground` or `muted` role; nothing else paints text.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - This is an ordinary page title. A poster hero (PosterFold #17) or a subpage head (PageHead #18)
 *   renders its own `h1` at its own role; reach for those where they fit.
 * - Heading levels descend without skipping — an `h1` is followed by an `h2`, never an `h3`.
 */
export const H1: FunctionComponent<IH1Props> = ({
  children,
  color,
  testId,
}) => (
  <h1 className={h1({ color })} data-testid={testId}>
    {children}
  </h1>
);
