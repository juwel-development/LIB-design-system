import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Level fixes role: an h3 is always the subtitle role, with no size prop (docs/adr/0005). Weight
// inherits - Tailwind's preflight resets h1-h6 to font-weight: inherit, so the sized levels carry no
// weight class. Colour is a semantic token re-pointed by `.dark`, so no variant carries a `dark:`
// class.
const h3 = cva('font-primary text-subtitle leading-subtitle', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

interface IH3Props extends VariantProps<typeof h3> {
  children: ReactNode;
  testId?: string;
}

/**
 * The subsection heading, an `h3` at the subtitle type role. The last of the three sized steps;
 * levels below it share the body size and separate by weight.
 *
 * @Guarantees — enforced on every render
 * - Renders an `h3`; its outline level and the subtitle role are one choice, not two (docs/adr/0005).
 * - Reads `--font-primary`, sized by `--text-subtitle` and led by `--leading-subtitle`.
 * - `color` selects the `foreground` or `muted` role; nothing else paints text.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Heading levels descend without skipping — an `h3` sits under an `h2`, not under an `h1`.
 */
export const H3: FunctionComponent<IH3Props> = ({
  children,
  color,
  testId,
}) => (
  <h3 className={h3({ color })} data-testid={testId}>
    {children}
  </h3>
);
