import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe, four treatments that behave differently, not one link with a colour prop (see
// docs/adr/0006). The focus ring is in the base - a link is focusable - drawn with outline, colour at
// rest so it never fades in (docs/adr/0002); no radius, a link has no box (docs/adr/0003). Colours are
// semantic tokens re-pointed by `.dark`, so no treatment carries a `dark:` class. Every underline
// reads the library's --underline-* tokens and arrives instantly, decoration off the transition
// allowlist (docs/adr/0001): prose thickens its on hover, quiet and label-link have one appear at the
// rest thickness. graphic paints nothing, so an anchor around a mark keeps its own colour.
const link = cva(
  'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  {
    variants: {
      treatment: {
        prose:
          'text-link underline decoration-[length:var(--underline-thickness)] underline-offset-[var(--underline-offset)] hover:decoration-[length:var(--underline-thickness-hover)]',
        quiet:
          'text-muted no-underline decoration-[length:var(--underline-thickness)] underline-offset-[var(--underline-offset)] transition-colors duration-[var(--motion-duration-color)] hover:text-foreground hover:underline',
        'label-link':
          'text-inherit no-underline decoration-[length:var(--underline-thickness)] underline-offset-[var(--underline-offset)] hover:underline',
        graphic: 'text-inherit no-underline',
      },
    },
    defaultVariants: { treatment: 'prose' },
  },
);

interface ILinkProps extends VariantProps<typeof link> {
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
 * A link in one of four treatments. `prose` for running text (told apart by its underline, never by
 * hue), `quiet` for standing navigation (muted, and foreground with an underline on hover),
 * `label-link` for a link acting as a label (inherits its colour, underlines on hover, sets no type
 * of its own), and `graphic` for an anchor whose child is not text (paints nothing, so a mark keeps
 * its own colour). It renders a plain `<a>`, so it works with no hydration.
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
