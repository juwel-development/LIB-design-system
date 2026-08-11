import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The body role, shared with h4-h6 which add a weight to stand apart from it (docs/adr/0005). Weight
// inherits. Colour is a semantic token re-pointed by `.dark`, so no variant carries a `dark:` class.
// P owns no reading measure - that belongs to whatever owns the reading column (Prose #21).
const p = cva('font-primary text-body leading-body', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

interface IPProps extends VariantProps<typeof p> {
  children: ReactNode;
  testId?: string;
}

/**
 * A paragraph of body copy, a `p` at the body type role. Unbounded — usable in a form, a card or a
 * table cell — because the reading measure belongs to whatever owns the reading column (Prose #21).
 *
 * @Guarantees — enforced on every render
 * - Renders a `p`, reading `--font-primary`, sized by `--text-body` and led by `--leading-body`.
 * - `color` selects the `foreground` or `muted` role; nothing else paints text.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Where line length matters, place the paragraph inside whatever bounds the reading measure; `P`
 *   does not constrain its own width.
 * - For a paragraph inside a reading column, reach for `Prose.Body`, which is measure-bounded by its
 *   `Prose.Root`; `P` is for a paragraph with no reading column around it.
 */
export const P: FunctionComponent<IPProps> = ({ children, color, testId }) => (
  <p className={p({ color })} data-testid={testId}>
    {children}
  </p>
);
