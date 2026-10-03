import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The recipe on the <header>. It sets the label type role - whose "never grows past 1rem" was a role
// wearing a number, so no size literal appears here (#14) - and one air value in every direction:
// --space-region above and below, --gutter across, so the bar aligns with every inset Section. The
// current-page treatment keys on the attribute, not on a component: [&_[aria-current=page]] compiles
// to specificity 0,2,0 and beats Link's quiet text-muted (0,1,0) with no !important and no import.
// Colours are semantic tokens re-pointed by `.dark`, so no `dark:` class.
const header = cva(
  [
    'flex items-baseline',
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
      // Read off the slots the caller filled, never set by a caller (see IHeaderProps). `navigation` is
      // the arrangement the bar always had. `statusAction` breaks into lines instead of overflowing:
      // --space-region along a line, the role the nav gaps its items with, and --space-stack between
      // lines, Cluster's rule for a wrapped row (docs/adr/0008).
      mode: {
        navigation: 'justify-between',
        statusAction:
          'flex-wrap gap-x-[var(--space-region)] gap-y-[var(--space-stack)]',
      },
    },
    defaultVariants: { edge: 'rule', mode: 'navigation' },
  },
);

// Not a second recipe - no slot has anything to vary, and the standard allows a component one cva()
// (design-system-components.md §4), which is the bar's own above. The standing floor is the nav's own
// line box, written from the two tokens the recipe sets the header from, so floor and rendered line
// cannot drift (#81); `shrink-0` because an explicit min-width replaces a flex item's automatic one.
const standingSlot = [
  'inline-flex shrink-0 items-center',
  'min-h-[calc(var(--text-label)*var(--leading-label))]',
  'min-w-[var(--standing-min-width)]',
].join(' ');

const navSlot = 'flex flex-wrap items-baseline gap-[var(--space-region)]';

// The readout may shrink below its longest word once it has a line of its own, and an unbroken token
// then breaks inside the slot rather than widening the page. No role, no name, no live region.
const statusSlot = 'min-w-0 wrap-anywhere';

// One auto margin puts the action on the end edge whatever the line holds - beside the readout, or
// alone once the bar has broken. It is not `shrink-0`: a Button narrower than its label wraps the
// label itself (#119), where a bar refusing to shrink it would overflow the page instead.
const actionSlot = 'ms-auto';

interface IHeaderShellProps extends Omit<VariantProps<typeof header>, 'mode'> {
  testId?: string;
}

/** The navigation bar: the mode every existing caller is in, and the default. A standing link and a
 *  `<nav>`, and never a status or an action slot - the other shape is `IHeaderStatusActionProps`. */
export interface IHeaderNavigationProps extends IHeaderShellProps {
  /** The standing link: a place name, a mark, or a home link. The consumer supplies the whole anchor -
   *  Header renders no link of its own. A place name uses `<Link treatment="quiet" href="/">…</Link>`; a
   *  mark uses `<Link treatment="graphic" href="/"><Brandmark …/></Link>`, whose `graphic` treatment
   *  paints nothing over a `currentColor` mark. */
  standing?: ReactNode;
  /** Names the nav for assistive technology. Omit unless the page has more than one nav. */
  navName?: string;
  /** The nav links. */
  children?: ReactNode;
  status?: never;
  action?: never;
}

/** The status/action bar: a bar that reports and acts rather than navigates, for a product whose
 *  shell carries a readout and a control and no links. It has no standing link and no `<nav>` - a
 *  button is not navigation - and the two shapes cannot be mixed: the compiler rejects a call that
 *  hands this bar a standing link, a nav name or nav children. */
export interface IHeaderStatusActionProps extends IHeaderShellProps {
  /** The readout - a date, a balance, a short note, or a `Cluster` of them - at the start edge, first
   *  in reading order. A plain `div` with no role, no name and no live region: what it holds carries its
   *  own semantics, and whether a change is announced is the consumer's decision, made by wrapping its
   *  own live region. Long and unbroken wording wraps inside the slot. Omitted, nothing renders. */
  status?: ReactNode;
  /** The control - a `Button`, or a `Cluster` of them - at the end edge, last in reading and keyboard
   *  order, on whichever line it lands when the bar breaks. A plain `div` like `status`. Header never
   *  decides whether the control is available: pass it disabled, or withhold it (`{ready && <Button/>}`
   *  renders no box). Omitted, nothing renders. */
  action?: ReactNode;
  standing?: never;
  navName?: never;
  children?: never;
}

export type IHeaderProps = IHeaderNavigationProps | IHeaderStatusActionProps;

// What React paints nothing for: `undefined`, `null`, a boolean and the empty string. A withheld slot
// gets no box, so a status-only or action-only bar carries no empty one.
const isPainted = (slot: ReactNode): boolean =>
  slot !== undefined &&
  slot !== null &&
  typeof slot !== 'boolean' &&
  slot !== '';

/**
 * The shell's top edge, at the label type role, in one of two mutually exclusive modes. The
 * **navigation bar** - the default, and what every existing caller renders - is a standing link and a
 * single `<nav>`. The **status/action bar** is a readout at the start edge and a control at the end
 * edge, both plain boxes with no landmark of their own and no `<nav>` anywhere. The props type is a
 * union of the two shapes, so a call that mixes them does not compile. Either bar arranges nothing
 * beyond its slots and works with no hydration.
 *
 * @Guarantees — enforced on every render
 * - The header is set at the label role and carries no size of its own: `font-secondary text-label
 *   leading-label tracking-label text-muted`, so it never grows past that role whatever the page font size.
 * - The shell's air is one value above, below and between: `--space-region` vertically, between the
 *   nav's items and between the status/action bar's slots along a line, `--gutter` across, so the bar
 *   aligns with every inset `Section`. It is never sticky and needs no JavaScript.
 *
 * The navigation bar, unchanged by #125:
 * - The nav's line box is the library's own rather than the consuming document's: the header leads
 *   itself at the label role, so the height it declares for its slot is the height it renders.
 * - The standing slot is floored, never fixed: its minimum height is that same line box - the label
 *   role's size times its leading - its minimum width is `--standing-min-width`, and its contents are
 *   centred. Standing content inside both floors leaves the bar the same height from route to route,
 *   so a place name on one page and a mark on another do not move the shell; content past either floor
 *   grows the slot, on one line, and is never clamped or wrapped.
 * - A nav item marked `aria-current="page"` renders at `foreground` whatever supplied it - the treatment
 *   keys on the attribute, not on `Link`, so it holds against a bare anchor or any component.
 * - The standing slot and the `<nav>` are the bar's two children whatever the caller passes, the nav
 *   flush with the end content edge and absorbing narrowing by wrapping its links. Omitting `navName`
 *   emits no `aria-label` at all, not an empty one.
 *
 * The status/action bar:
 * - It renders no `<nav>`, no standing slot, no role, no name and no live region of its own. Each
 *   filled slot is one `div` directly inside the banner; an omitted or withheld slot (`false`, `null`)
 *   renders no box and reserves no space, so a status-only bar starts with its readout and an action-only
 *   bar is the control alone at the end edge.
 * - Reading and keyboard order is status, then action, and the DOM order is the same at every width.
 * - With both fitting, the readout sits at the start content edge and the control at the end content
 *   edge on one line. When they cannot share a line, the control drops below the readout and stays
 *   flush with the end edge; a readout then takes the whole line and wraps inside it, unbroken wording
 *   included, so the bar never widens the page and never clips.
 * - Breaking is CSS alone: a width change re-flows the same elements, so descendant state and focus
 *   survive it.
 * - What the consumer passes keeps its semantics: a heading stays a heading, a live region stays one, a
 *   disabled control stays disabled. Header adds, removes and announces nothing.
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
 * - Set the type of what fills a status/action slot: the bar sets the label role, so a bare string in
 *   `status` reads as a label, while a `P` or a `Note` wears its own role and a `Button` its own.
 * - Whether a changing readout interrupts is yours to decide: wrap your own live region inside `status`
 *   where a change must be announced, and leave it out where it must not. Header takes neither side.
 *
 * @UXGuidelines
 * - Name the nav with `navName` once the page has more than one navigation landmark - a footer nav will
 *   be the second, and two unnamed navs are indistinguishable to a screen-reader user.
 * - Nav links use `Link`'s `quiet` treatment. The current-page treatment is applied here from
 *   `aria-current`, so set `current` on the `Link` and style nothing yourself.
 * - The nav does not collapse into a menu: a disclosure needs JavaScript, so on a narrow viewport the
 *   items wrap. A mobile menu is out of scope, not a follow-up.
 * - A bar that reports and acts is a status/action bar, never a navigation bar with a button among its
 *   links: a Balance line or a Continue button inside a `<nav>` is announced as navigation. A product
 *   whose shell needs links as well as a control has two bars, not one.
 * - Several readouts or several actions go in a `Cluster` inside the slot: `gap="stack"` keeps them one
 *   group, and the Cluster wraps inside the slot before the bar runs out of room.
 */
export const Header: FunctionComponent<IHeaderProps> = ({
  edge,
  testId,
  standing,
  navName,
  children,
  status,
  action,
}) => {
  // A slot the caller named decides the mode, even one withheld as `false`: `action={ready && …}` is a
  // status/action bar with its control withheld, not a navigation bar with an empty nav.
  const reportsOrActs = status !== undefined || action !== undefined;
  return (
    <header
      className={header({
        edge,
        mode: reportsOrActs ? 'statusAction' : 'navigation',
      })}
      data-testid={testId}
    >
      {reportsOrActs ? (
        <>
          {isPainted(status) && <div className={statusSlot}>{status}</div>}
          {isPainted(action) && <div className={actionSlot}>{action}</div>}
        </>
      ) : (
        <>
          <div className={standingSlot}>{standing}</div>
          <nav aria-label={navName} className={navSlot}>
            {children}
          </nav>
        </>
      )}
    </header>
  );
};
