import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe, no variants: both-axes centring is the component's whole job (#96), so there is nothing
// to choose - a distribution axis waits for evidence under ADR 0008's test. items-center centres the
// inline axis, the slot's auto margins (below) the block axis; alone among the composables it carries
// its own inset - the deliberate exception to "Section owns the gutter" (CONTEXT.md: Cover).
const cover = cva(
  [
    'flex flex-col items-center',
    'min-h-[var(--cover-height)]',
    'px-[var(--gutter)] py-[var(--space-region)]',
  ].join(' '),
);

// Not a second recipe - the slot has nothing to vary, and the standard allows one cva()
// (design-system-components.md §4), the frame's own above. Block-axis auto margins split the leftover
// space equally, so a foot after the slot still lands on the bottom edge - justify-center on the
// frame would centre slot and foot as one group and lift the foot off that edge.
const slot = 'my-auto';

export interface ICoverProps {
  /** The screen's one opaque slot, centred on both axes. Rendered unmodified: a menu composes a title,
   *  a tagline and a stack of actions here; a sign-in composes a form. `Cover` imposes no anatomy. */
  children: ReactNode;
  /** The line on the screen's bottom edge - a version line, a legal line - centred on the inline axis.
   *  Omitted - or given nothing: `null`, a flag's `false` - nothing renders: no empty container
   *  holds its place. */
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
 *   even an empty container - when not given or given nothing to render (`null`, a flag's `false`).
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
}) => {
  // Absence, not falsiness, after Form's note guard: `foot={showLegal && <p/>}` hands over `false`,
  // and an empty <div> would still be a flex item sitting on the bottom edge.
  const hasFoot =
    foot !== undefined && foot !== null && typeof foot !== 'boolean';

  return (
    <div className={cover()} data-testid={testId}>
      <div className={slot}>{children}</div>
      {hasFoot && <div>{foot}</div>}
    </div>
  );
};
