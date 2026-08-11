import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe, three treatments that behave differently, not one link with a colour prop (see
// docs/adr/0006). The focus ring is in the base - a link is focusable - drawn with outline, colour
// at rest so it never fades in (docs/adr/0002). No radius: a link has no box, so a corner would
// paint nothing (docs/adr/0003, CONTEXT.md 'Control'). Colours are semantic tokens re-pointed by
// `.dark`, so no treatment carries a `dark:` class. prose is told apart by its underline, never by
// hue, and thickens it on hover instantly - thickness is off the transition allowlist (docs/adr/0001).
const link = cva(
  'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  {
    variants: {
      treatment: {
        prose:
          'text-link underline decoration-[length:var(--underline-thickness)] underline-offset-[var(--underline-offset)] hover:decoration-[length:var(--underline-thickness-hover)]',
        quiet:
          'text-muted no-underline transition-colors duration-[var(--motion-duration-color)] hover:text-foreground',
        'label-link': 'text-inherit no-underline hover:underline',
      },
    },
    defaultVariants: { treatment: 'prose' },
  },
);

export interface ILinkProps extends VariantProps<typeof link> {
  /** Where the link points. Carried on the anchor, so the link navigates with JavaScript disabled. */
  href: string;
  /** The link text. */
  children: ReactNode;
  /** Opens in a new tab and severs the opener together - `target="_blank"` implies the `rel`, so
   *  neither half is settable alone. */
  external?: boolean;
  /** Marks this link as the current page for assistive technology (`aria-current="page"`). Semantics
   *  only: any visual current-page treatment belongs to the Header, not here. */
  current?: boolean;
  testId?: string;
}

/**
 * A text link in one of three treatments. `prose` for running text (told apart by its underline,
 * never by hue), `quiet` for standing navigation (muted, foreground on hover), and `label-link` for
 * a link acting as a label (inherits its colour, sets no type of its own). It renders a plain `<a>`,
 * so it works with no hydration.
 */
export const Link: FunctionComponent<ILinkProps> = ({
  href,
  children,
  treatment,
  external,
  current,
  testId,
}) => {
  return (
    <a
      href={href}
      className={link({ treatment })}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-current={current ? 'page' : undefined}
      data-testid={testId}
    >
      {children}
    </a>
  );
};
