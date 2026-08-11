import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Level fixes role: an h5 shares the body size with h4, h6 and p, told apart by weight alone
// (docs/adr/0005). The `font-semibold` is load-bearing - Tailwind's preflight resets h1-h6 to
// font-weight: inherit, so without it an h5 renders identically to a paragraph. Colour is a semantic
// token re-pointed by `.dark`, so no variant carries a `dark:` class.
const h5 = cva('font-primary text-body leading-body font-semibold', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

export interface IH5Props extends VariantProps<typeof h5> {
  children: ReactNode;
  testId?: string;
}

/**
 * A weight-separated heading, an `h5` at the body size, rendered semibold — one step lighter than
 * `h4`.
 *
 * @Guarantees — enforced on every render
 * - Renders an `h5`; its outline level and the body role are one choice, not two (docs/adr/0005).
 * - Reads `--font-primary`, sized by `--text-body`, semibold so it stands apart from a paragraph.
 * - `color` selects the `foreground` or `muted` role; nothing else paints text.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Heading levels descend without skipping — an `h5` sits under an `h4`, not under an `h3`.
 */
export const H5: FunctionComponent<IH5Props> = ({
  children,
  color,
  testId,
}) => (
  <h5 className={h5({ color })} data-testid={testId}>
    {children}
  </h5>
);
