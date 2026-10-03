import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The recipe on the <header>. It sets the label type role - the "small grotesk, letter-spaced, muted"
// the issue described, whose "never grows past 1rem" was a role wearing a number, so no size literal
// appears here (#14). The shell's air is one value in every direction: --space-region above, below and
// between the slots (and, on the nav, between its items), --gutter across, so the bar aligns with every
// inset Section. The bar does not distribute its slots `between`: that floats a lone status slot into
// the middle, so the end edge is reached by one auto margin on the end group - the action, or the nav
// when there is no action - and nothing else moves (#125). `breaks` is not a prop: it is read off the
// slots the caller filled. A bar of standing and nav absorbs narrowing inside the nav, which wraps its
// links, exactly as it did before the status and action slots existed; a bar holding either new slot
// has an unshrinkable control at its end, so it breaks into lines instead of overflowing the page,
// gapped with --space-stack between lines - Cluster's rule for a wrapped row (docs/adr/0008). The
// current-page treatment keys on the attribute, not on a component: [&_[aria-current=page]] compiles
// to specificity 0,2,0 and beats Link's quiet text-muted (0,1,0) with no !important and no import, so
// the current item sits at foreground - the colour every other item reaches only on hover. `edge`
// draws the bottom hairline in `rule`, the one weight a page's boundaries share with a Section join,
// and defaults to `rule` - the conventional header - so a ruleless shell opts out. Colours are semantic
// tokens re-pointed by `.dark`, so no `dark:` class.
const header = cva(
  [
    'flex items-baseline gap-x-[var(--space-region)]',
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
      breaks: {
        true: 'flex-wrap gap-y-[var(--space-stack)]',
        false: '',
      },
    },
    defaultVariants: { edge: 'rule', breaks: false },
  },
);

// Not a second recipe - none of the slots has anything to vary, and the standard allows a component
// one cva() (design-system-components.md §4), which is the bar's own above. Named constants beside the
// nav's inline class string, so each comment has something to sit on.
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

// The nav's own row. Whether it also carries the end-edge margin is decided at render: it does when it
// is the last slot, which lands it exactly where `justify-between` put it, and it does not when an
// action follows, because two auto margins on one line share the free space and would float the nav
// halfway between the status and the action (#125).
const navSlot = 'flex flex-wrap items-baseline gap-[var(--space-region)]';

// One auto margin, on the first slot of the end group. It names no space role and takes no space of
// its own: it only moves the end group to the far edge of whatever room the line has left.
const endEdge = 'ms-auto';

// The status slot holds a readout - text, or a Cluster of text. `min-w-0` lets it shrink below its
// longest word once it has a line of its own, so an unbreakable token overflows the slot and never
// widens the page. It carries no role, no live region and no name: the matter speaks for itself, and
// whether a changing readout interrupts is the consumer's to decide (#125).
const statusSlot = 'min-w-0';

// The action slot never shrinks: a control squeezed below its label is unreadable where a wrapped
// readout is merely tall. Its margin is what puts it on the end edge whatever else the bar holds -
// on the first line beside the matter, or alone on a later line once the bar has broken (#125).
const actionSlot = `${endEdge} shrink-0`;

// `breaks` is derived from the slots (see the recipe), so it is withheld from the prop surface: the one
// variant a caller cannot set, because the component already knows the answer.
export interface IHeaderProps
  extends Omit<VariantProps<typeof header>, 'breaks'> {
  /** The standing link: a place name, a mark, or a home link. The consumer supplies the whole anchor -
   *  Header renders no link of its own. A place name uses `<Link treatment="quiet" href="/">…</Link>`; a
   *  mark uses `<Link treatment="graphic" href="/"><Brandmark …/></Link>`, whose `graphic` treatment
   *  paints nothing over a `currentColor` mark. */
  standing?: ReactNode;
  /** Names the nav for assistive technology. Omit unless the page has more than one nav. */
  navName?: string;
  /** A readout that states where things stand - a date, a balance, a short note - set beside the standing
   *  slot, in reading order before the nav. It is a slot and not a landmark: Header wraps it in a plain
   *  `div` with no role and no live region, so what it holds carries its own semantics. Omitted, nothing
   *  renders. */
  status?: ReactNode;
  /** The bar's action - a `Button`, or a `Cluster` of them - sent to the end edge and last in reading
   *  and keyboard order. Like `status` it is a slot, not a landmark, and in particular it is never inside
   *  the nav: a button is not navigation and must not be announced as part of one. Omitted, nothing
   *  renders. */
  action?: ReactNode;
  /** The nav links. Omitted, no `<nav>` renders at all - a bar of standing, status and action declares no
   *  empty navigation landmark. */
  children?: ReactNode;
  testId?: string;
}

/**
 * The shell's top edge: a standing link, a nav, and - for a bar that reports and acts rather than
 * navigates - a status slot and an action slot, at the label type role. It renders the banner landmark
 * and, when it is given nav links, a single `<nav>`; the status and action slots are plain boxes with no
 * landmark of their own. It arranges nothing beyond the slots, so it works with no hydration.
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
 * - The slots sit in one order in the DOM, which is reading and keyboard order: standing, status, nav,
 *   action. The end group - the action, or the nav when there is no action - is sent to the end edge by
 *   one auto margin, so a status slot stays beside the standing one, a lone action sits at the far edge,
 *   a nav beside an action sits with the matter before it, and a bar of standing and nav renders as it
 *   always has. The slots are gapped with `--space-region`, the role the nav already gaps its items with.
 * - The status and action slots are not landmarks: each is a `div` with no role, no name and no live
 *   region, and neither is ever inside the `<nav>`. Omitting one renders no wrapper for it, and omitting
 *   `children` renders no `<nav>` at all - a status-and-action bar declares no empty navigation landmark.
 * - A bar of standing and nav stays on one line and absorbs narrowing inside the nav, which wraps its
 *   links - unchanged. A bar holding a status or an action slot breaks into lines instead: whole slots
 *   drop to the next line in reading order, gapped with `--space-stack`, the action keeps its edge on
 *   whichever line it lands on, and the bar never widens the page. The standing slot and the action
 *   never shrink, so a place name stays on one line and a control is never squeezed below its label.
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
 * - A readout belongs in `status` and a control in `action`, never in `children`: the nav is a
 *   navigation landmark, and a balance line or a Continue button inside it is announced as navigation.
 *   A bar with no links passes no `children` and gets no nav.
 * - Set the type of what fills a slot: the bar sets the label role, so a bare string in `status` reads
 *   as a label, while a `P` or a `Note` wears its own role and a `Button` its own.
 * - Whether a changing readout should be announced is the consumer's decision: wrap your own live
 *   region inside `status` where a change must interrupt, and leave it out where it must not. Header
 *   takes neither side.
 * - Several readouts or several actions go in a `Cluster` inside the slot: `gap="stack"` keeps them one
 *   group, and the Cluster wraps inside the slot before the bar runs out of room.
 */
// A slot is present when the caller handed it something React would paint. `false` and `null` are what
// a `{condition && <Button/>}` yields when the condition fails, and an empty box or an empty landmark
// for a slot the caller withheld is exactly what this guard is for.
const isPresent = (slot: ReactNode): boolean =>
  slot !== undefined && slot !== null && slot !== false;

export const Header: FunctionComponent<IHeaderProps> = ({
  edge,
  standing,
  navName,
  status,
  action,
  children,
  testId,
}) => (
  <header
    className={header({
      edge,
      breaks: isPresent(status) || isPresent(action),
    })}
    data-testid={testId}
  >
    <div className={standingSlot}>{standing}</div>
    {isPresent(status) && <div className={statusSlot}>{status}</div>}
    {isPresent(children) && (
      <nav
        aria-label={navName}
        className={isPresent(action) ? navSlot : `${navSlot} ${endEdge}`}
      >
        {children}
      </nav>
    )}
    {isPresent(action) && <div className={actionSlot}>{action}</div>}
  </header>
);
