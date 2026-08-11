import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Level fixes role: an h4 shares the body size with h5, h6 and p, told apart by weight alone
// (docs/adr/0005). The `font-bold` is load-bearing - Tailwind's preflight resets h1-h6 to
// font-weight: inherit, so without it an h4 renders identically to a paragraph. Colour is a semantic
// token re-pointed by `.dark`, so no variant carries a `dark:` class.
const h4 = cva('font-primary text-body leading-body font-bold', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

interface IH4Props extends VariantProps<typeof h4> {
  children: ReactNode;
  testId?: string;
}

/**
 * The first of the weight-separated headings, an `h4` at the body size, rendered bold.
 *
 * @Guarantees — enforced on every render
 * - Renders an `h4`; its outline level and the body role are one choice, not two (docs/adr/0005).
 * - Reads `--font-primary`, sized by `--text-body`, and is bold so it stands apart from a paragraph.
 * - `color` selects the `foreground` or `muted` role; nothing else paints text.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Heading levels descend without skipping — an `h4` sits under an `h3`, not under an `h2`.
 */
export const H4: FunctionComponent<IH4Props> = ({
  children,
  color,
  testId,
}) => (
  <h4 className={h4({ color })} data-testid={testId}>
    {children}
  </h4>
);
