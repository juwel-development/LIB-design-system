import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on a plain <div>, with no variants: both-axes centring is the component's whole job (#96),
// so there is nothing to choose - a distribution axis waits for evidence under ADR 0008's test. The
// frame holds at least the cover height, so leftover space is guaranteed; items-center centres every
// item on the inline axis, and the slot's own auto margins (below) centre it on the block axis. It
// reads --cover-height for the floor and, unlike every other composable, carries its own inset -
// --gutter inline, --space-region block - the deliberate exception to "Section owns the gutter": a
// frame that equals the viewport cannot sit inside a Section band without overflowing it.
const cover = cva(
  [
    'flex flex-col items-center',
    'min-h-[var(--cover-height)]',
    'px-[var(--gutter)] py-[var(--space-region)]',
  ].join(' '),
);

// Not a second recipe - the slot has nothing to vary, and the standard allows a component one cva()
// (design-system-components.md §4), which is the frame's own above. Auto margins on the block axis
// take the leftover space equally above and below, so the column sits in the middle of it and a foot
// after the slot still lands on the frame's bottom edge - which is also why the frame cannot simply
// justify-center: that would centre slot and foot as one group and lift the foot off the edge.
const slot = 'my-auto';

export interface ICoverProps {
  /** The screen's one opaque slot, centred on both axes. Rendered unmodified: a menu composes a title,
   *  a tagline and a stack of actions here; a sign-in composes a form. `Cover` imposes no anatomy. */
  children: ReactNode;
  /** The line on the screen's bottom edge - a version line, a legal line - centred on the inline axis.
   *  Omitted, nothing renders: no empty container holds its place. */
  foot?: ReactNode;
  testId?: string;
}

/**
 * A whole screen's frame: a plain container at least the cover height tall that centres one column in
 * the leftover space, on both axes, with an optional foot pinned to the bottom edge. It is the fold's
 * counterpart (CONTEXT.md): a menu, a sign-in, a splash is the entire app for a moment, and nothing
 * follows it - so where `Hero` deliberately stops short of the viewport to say the page continues, a
 * cover reaches it, because stopping short would signal a continuation that does not exist. It renders
 * no heading and no landmark: whatever the screen says is composed in the slot.
 *
 * @Guarantees — enforced on every render
 * - It is at least `--cover-height` tall: a `min-height` floor, not a fixed height, so content longer
 *   than the viewport grows the frame rather than overflowing it.
 * - `children` sit in the middle of the leftover space, centred on both axes; the centring is fixed,
 *   with no distribution to choose.
 * - `foot` renders on the frame's bottom edge, centred on the inline axis, and renders nothing - not
 *   even an empty container - when not given.
 * - `children` and `foot` render unmodified; the component adds nothing to and strips nothing from
 *   them, and sets no colour, no heading and no landmark of its own.
 * - It owns its own inset - `--gutter` on the inline axis, `--space-region` on the block axis - the
 *   deliberate exception to "`Section` owns the gutter": the frame equals the viewport, so it cannot
 *   sit inside a `Section` band without overflowing it, and there is no band around it to carry one.
 * - It is never sticky or fixed and needs no JavaScript, so it renders identically server-side.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - The cover stands on its own, never inside a `Section`: the band's vertical air would push the
 *   frame past the viewport it exists to equal. A page that continues past its first screen wants
 *   `Section` and `Hero` instead - the fold, not the screen.
 * - Anything the page must announce - a landmark, a heading - is composed in the slot; the frame
 *   declares nothing over it.
 *
 * @UXGuidelines
 * - A cover is for a page that is the whole app for a moment - a menu, a sign-in, a splash. The
 *   moment content follows on the same page, the screen has become a fold and stopping short of the
 *   viewport is the honest signal: reach for `Hero` inside a `Section` instead.
 * - The foot is a quiet line, not a footer: a version, a legal notice. Content a viewer must reach
 *   belongs in the slot, where it sits in the column the screen is actually about.
 */
export const Cover: FunctionComponent<ICoverProps> = ({
  children,
  foot,
  testId,
}) => (
  <div className={cover()} data-testid={testId}>
    <div className={slot}>{children}</div>
    {foot !== undefined && <div>{foot}</div>}
  </div>
);
