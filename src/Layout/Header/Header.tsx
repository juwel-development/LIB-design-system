import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on the <header>. It sets the label type role - the "small grotesk, letter-spaced, muted"
// the issue described, whose "never grows past 1rem" was a role wearing a number, so no size literal
// appears here (#14). The shell's air is one value in every direction: --space-region above, below and
// (on the nav) between, --gutter across, so the bar aligns with every inset Section. The current-page
// treatment keys on the attribute, not on a component: [&_[aria-current=page]] compiles to specificity
// 0,2,0 and beats Link's quiet text-muted (0,1,0) with no !important and no import, so the current item
// sits at foreground - the colour every other item reaches only on hover. `edge` draws the bottom
// hairline in `rule`, the one weight a page's boundaries share with a Section join, and defaults to
// `rule` - the conventional header - so a ruleless shell opts out. Colours are semantic tokens re-pointed
// by `.dark`, so no `dark:` class.
const header = cva(
  [
    'flex items-baseline justify-between',
    'font-secondary text-label tracking-label text-muted',
    'py-[var(--space-region)] px-[var(--gutter)]',
    '[&_[aria-current=page]]:text-foreground',
  ].join(' '),
  {
    variants: {
      edge: {
        none: '',
        rule: 'border-b border-solid border-rule',
      },
    },
    defaultVariants: { edge: 'rule' },
  },
);

export interface IHeaderProps extends VariantProps<typeof header> {
  /** The standing link: a place name, a mark, or a home link. The consumer supplies the whole anchor -
   *  Header renders no link of its own. A place name uses `<Link treatment="quiet" href="/">…</Link>`; a
   *  mark wraps `Brandmark` in the anchor, the composition its own story shows. */
  standing?: ReactNode;
  /** Names the nav for assistive technology. Omit unless the page has more than one nav. */
  navName?: string;
  /** The nav links. */
  children?: ReactNode;
  testId?: string;
}

/**
 * The shell's top edge: a standing link and a nav, at the label type role. It renders the banner
 * landmark and a single `<nav>`, arranging nothing beyond the two slots, so it works with no hydration.
 *
 * @Guarantees — enforced on every render
 * - The header is set at the label role and carries no size of its own: `font-secondary text-label
 *   tracking-label text-muted`, so it never grows past that role whatever the page font size.
 * - A nav item marked `aria-current="page"` renders at `foreground` whatever supplied it - the treatment
 *   keys on the attribute, not on `Link`, so it holds against a bare anchor or any component.
 * - The shell's air is one value above, below and between: `--space-region` vertically and between nav
 *   items, `--gutter` across, so the bar aligns with every inset `Section`.
 * - It is never sticky and needs no JavaScript: there is no `sticky` variant and nothing to hydrate.
 * - Omitting `navName` emits no `aria-label` at all, not an empty one.
 *
 * @UXGuidelines
 * - Name the nav with `navName` once the page has more than one navigation landmark - a footer nav will
 *   be the second, and two unnamed navs are indistinguishable to a screen-reader user.
 * - Nav links use `Link`'s `quiet` treatment. The current-page treatment is applied here from
 *   `aria-current`, so set `current` on the `Link` and style nothing yourself.
 * - The nav does not collapse into a menu: a disclosure needs JavaScript, so on a narrow viewport the
 *   items wrap. A mobile menu is out of scope, not a follow-up.
 */
export const Header: FunctionComponent<IHeaderProps> = ({
  edge,
  standing,
  navName,
  children,
  testId,
}) => (
  <header className={header({ edge })} data-testid={testId}>
    <div>{standing}</div>
    <nav
      aria-label={navName}
      className={'flex flex-wrap items-baseline gap-[var(--space-region)]'}
    >
      {children}
    </nav>
  </header>
);
