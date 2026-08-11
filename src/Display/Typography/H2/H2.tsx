import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Level fixes role: an h2 is always the title role, with no size prop (docs/adr/0005). Weight
// inherits - Tailwind's preflight resets h1-h6 to font-weight: inherit, so the sized levels carry no
// weight class. --tracking-optical is the large-type correction and the title role is where it starts
// (#57), so an h2 and the page head's h1 - the same role - are tracked alike, and h3 down is not.
// Colour is a semantic token re-pointed by `.dark`, so no variant carries a `dark:` class.
const h2 = cva('font-primary text-title leading-title tracking-optical', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

interface IH2Props extends VariantProps<typeof h2> {
  children: ReactNode;
  testId?: string;
}

/**
 * The section heading, an `h2` at the title type role.
 *
 * @Guarantees — enforced on every render
 * - Renders an `h2`; its outline level and the title role are one choice, not two (docs/adr/0005).
 * - Reads `--font-primary`, sized by `--text-title`, led by `--leading-title` and optically corrected
 *   by `--tracking-optical` — the title role is the smallest role that carries it, so `H3` and below
 *   take none.
 * - `color` selects the `foreground` or `muted` role; nothing else paints text.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Heading levels descend without skipping — an `h2` sits under an `h1`, not under an `h3`.
 */
export const H2: FunctionComponent<IH2Props> = ({
  children,
  color,
  testId,
}) => (
  <h2 className={h2({ color })} data-testid={testId}>
    {children}
  </h2>
);
