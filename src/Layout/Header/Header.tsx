import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The recipe on the <header>. It sets the label type role - the "small grotesk, letter-spaced, muted"
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
    'font-secondary text-label leading-label tracking-label text-muted',
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

// Not a second recipe - the standing slot has nothing to vary, and the standard allows a component
// one cva() (design-system-components.md §4), which is the bar's own above. A named constant beside
// the nav's inline class string, so the comment has something to sit on.
//
// The height floor is the nav's own line box, written from the two tokens the recipe above sets the
// header from, so the declared floor and the rendered line cannot drift (#81). `shrink-0` because an
// explicit min-width replaces a flex item's automatic minimum - without it the bar squeezes the slot
// below its content and wraps the place name the floor exists to keep on one line.
const standingSlot = [
  'inline-flex shrink-0 items-center',
  'min-h-[calc(var(--text-label)*var(--leading-label))]',
  'min-w-[var(--standing-min-width)]',
].join(' ');

export interface IHeaderProps extends VariantProps<typeof header> {
  /** The standing link: a place name, a mark, or a home link. The consumer supplies the whole anchor -
   *  Header renders no link of its own. A place name uses `<Link treatment="quiet" href="/">…</Link>`; a
   *  mark uses `<Link treatment="graphic" href="/"><Brandmark …/></Link>`, whose `graphic` treatment
   *  paints nothing over a `currentColor` mark. */
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
 *   leading-label tracking-label text-muted`, so it never grows past that role whatever the page font size.
 * - The nav's line box is the library's own rather than the consuming document's: the header leads
 *   itself at the label role, so the height it declares for its slot is the height it renders.
 * - The standing slot is floored, never fixed: its minimum height is that same line box - the label
 *   role's size times its leading - its minimum width is `--standing-min-width`, and its contents are
 *   centred. Standing content inside both floors leaves the bar the same height from route to route,
 *   so a place name on one page and a mark on another do not move the shell; content past either floor
 *   grows the slot, on one line, and is never clamped or wrapped.
 * - A nav item marked `aria-current="page"` renders at `foreground` whatever supplied it - the treatment
 *   keys on the attribute, not on `Link`, so it holds against a bare anchor or any component.
 * - The shell's air is one value above, below and between: `--space-region` vertically and between nav
 *   items, `--gutter` across, so the bar aligns with every inset `Section`.
 * - It is never sticky and needs no JavaScript: there is no `sticky` variant and nothing to hydrate.
 * - Omitting `navName` emits no `aria-label` at all, not an empty one.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - A mark that should *fill* the standing slot is given a **definite width** by whoever placed it -
 *   `width: var(--standing-min-width)` on the element wrapping it, so the mark and the floor move
 *   together when a theme re-points the token. Measured against a `viewBox`-only SVG, the common
 *   shape: it has no intrinsic width to fill from, and `width: 100%` cannot resolve against the slot's
 *   indefinite basis - so a mark told to fill that way renders at its intrinsic width instead (300px in
 *   a slot floored at 120px, against 120px on the place-name route) and the floor stops governing,
 *   which is the jump between routes the floor exists to remove. A definite width holds at any bar
 *   width; `flex: 1 1 0; min-width: 0` only collapses the mark when the bar is already out of room, so
 *   it is not the rule to reach for. The library cannot apply either rule for you: the same width on a
 *   place name would clamp the name and wrap it.
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
    <div className={standingSlot}>{standing}</div>
    <nav
      aria-label={navName}
      className={'flex flex-wrap items-baseline gap-[var(--space-region)]'}
    >
      {children}
    </nav>
  </header>
);
