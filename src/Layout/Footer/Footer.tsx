import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on the <footer>. The type is set here, not borrowed from Header's label role: this slot is
// opaque and legitimately holds a sentence, and --tracking-label across one is damage, not a device (ADR
// 0004). `edge` is a variant, not a conditional: a footer is always last, exactly once, so there is no
// "first footer" for a data-section-style selector to suppress, and its predecessor is unpredictable - a
// conditional would silently drop the hairline. It draws in `rule`, the page's single hairline weight
// Section joins and Header's bottom edge share. Colours are semantic tokens re-pointed by `.dark`.
const footer = cva(
  'font-secondary text-small text-muted py-[var(--space-region)] px-[var(--gutter)]',
  {
    variants: {
      edge: {
        none: '',
        rule: 'border-t border-solid border-rule',
      },
    },
    defaultVariants: { edge: 'rule' },
  },
);

export interface IFooterProps extends VariantProps<typeof footer> {
  children?: ReactNode;
  testId?: string;
}

/**
 * The shell's bottom edge: a `<footer>` that owns the `contentinfo` landmark, the small type, the shell's
 * vertical air and the gutter, and its own top rule - and nothing about what is inside it. It is a frame,
 * not an arrangement: `children` are placed directly in the footer with no wrapper and no `<nav>`.
 *
 * @Guarantees — enforced on every render
 * - The footer is set at the `small` role and carries no size of its own.
 * - Children are placed unmodified, directly inside the `<footer>`, with no wrapping element.
 * - The top edge is the caller's choice - `edge="rule"` (the default) or `edge="none"` - and when drawn is
 *   always the page's single hairline weight, in the `rule` colour Section's join uses.
 * - It is never sticky or fixed and needs no JavaScript.
 *
 * @CallerMustEnsure
 * - The footer is a direct child of the page, not nested inside `main`, `article`, `aside`, `nav` or a
 *   `Section`. Nesting silently demotes it out of the `contentinfo` landmark, and the component cannot
 *   detect this.
 *
 * @UXGuidelines
 * - Supply your own `<nav aria-label="…">` inside the slot if the footer navigates - a footer's contents
 *   are frequently not navigation, so this component declares no nav landmark over them. Where the footer
 *   does navigate, name `Header`'s nav with `navName` too: two unnamed navigation landmarks are
 *   indistinguishable to a screen-reader user.
 */
export const Footer: FunctionComponent<IFooterProps> = ({
  edge,
  children,
  testId,
}) => (
  <footer className={footer({ edge })} data-testid={testId}>
    {children}
  </footer>
);
