import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// A screen, not a fold (CONTEXT.md): --cover-height is the whole viewport where --fold-height
// deliberately stops short of it, so this recipe is not Hero's with a taller floor. It owns its own
// inset - the one exception to Section owning the gutter - because a Section band around a
// viewport-height frame would overflow the viewport (#96). The slot wrapper below carries literal
// utilities, as Input's label does: the frame's recipe is the component's one cva.
const cover = cva(
  'flex min-h-[var(--cover-height)] flex-col items-center gap-[var(--space-region)] px-[var(--gutter)] py-[var(--space-region)]',
);

export interface ICoverProps {
  /** The centered matter. Rendered unmodified: `Cover` imposes no anatomy on its slot. */
  children: ReactNode;
  /** Rendered on the bottom edge - a version line, a legal line. Left out, nothing renders. */
  foot?: ReactNode;
  testId?: string;
}

/**
 * A screen: the frame that takes at least the whole viewport and centers one column in it, on both
 * axes, with an optional foot on the bottom edge. Where `Hero` holds the fold - a floor that
 * deliberately stops short of the viewport because something follows it - a cover fills the
 * viewport exactly because nothing does: a menu, a sign-in, a splash. It renders no heading and no
 * landmark of its own.
 *
 * @Guarantees — enforced on every render
 * - It is at least `--cover-height` tall and never taller by construction: a `min-height` floor, so
 *   content longer than the viewport grows the frame rather than overflowing it.
 * - `children` sit centered in the leftover space on both axes, rendered unmodified.
 * - `foot` renders on the bottom edge, centered on the inline axis; left out, no element renders in
 *   its place. The slot and the foot are separated by the region space role.
 * - It owns its own inset — `--gutter` inline, `--space-region` block — the deliberate exception to
 *   `Section` owning the gutter: a `Section` band around a viewport-height frame would overflow the
 *   viewport it is sized to fill.
 * - No literal length appears in the recipe: every value it emits is a role the token layer names.
 * - It is never sticky or fixed and needs no JavaScript, so it renders identically server-side.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - It stands alone as the screen; it does not sit inside a `Section`, and nothing is meant to
 *   follow it on the page. A first screen with content below it is a fold — reach for `Hero`.
 * - The column's width belongs to the children: a stack of actions bounds itself with
 *   `<Stack measure="action">`, a heading caps itself at its own measure.
 */
export const Cover: FunctionComponent<ICoverProps> = ({
  children,
  foot,
  testId,
}) => (
  <div className={cover()} data-testid={testId}>
    <div className={'flex w-full grow flex-col items-center justify-center'}>
      {children}
    </div>
    {foot}
  </div>
);
