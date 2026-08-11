import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Level fixes role: an h6 shares the body size with h4, h5 and p, told apart by weight alone
// (docs/adr/0005). The `font-medium` is load-bearing - Tailwind's preflight resets h1-h6 to
// font-weight: inherit, so without it an h6 renders identically to a paragraph. It is the lightest
// heading; the weight lever runs out here. Colour is a token re-pointed by `.dark`, so no `dark:`.
const h6 = cva('font-primary text-body leading-body font-medium', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

export interface IH6Props extends VariantProps<typeof h6> {
  children: ReactNode;
  testId?: string;
}

/**
 * The lightest heading, an `h6` at the body size, rendered medium — the deepest level the ladder
 * offers, because the weight lever runs out here.
 *
 * @Guarantees — enforced on every render
 * - Renders an `h6`; its outline level and the body role are one choice, not two (docs/adr/0005).
 * - Reads `--font-primary`, sized by `--text-body`, medium so it stands apart from a paragraph.
 * - `color` selects the `foreground` or `muted` role; nothing else paints text.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Heading levels descend without skipping — an `h6` sits under an `h5`, not under an `h4`.
 */
export const H6: FunctionComponent<IH6Props> = ({
  children,
  color,
  testId,
}) => (
  <h6 className={h6({ color })} data-testid={testId}>
    {children}
  </h6>
);
