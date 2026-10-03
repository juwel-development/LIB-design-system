import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  type FunctionComponent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

// The container paints nothing: no fill, no border, no size of its own. `max-h-full`/`max-w-full`
// let a sized parent bound it and resolve to nothing under an unsized one, so no viewport bound is
// invented. A disabled axis is `hidden`, so overflow there is clipped rather than scrolled. The one
// focus ring is drawn with outline, colour at rest - docs/adr/0002.
const scrollContainer = cva(
  'max-h-full max-w-full min-h-0 min-w-0 outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  {
    variants: {
      axis: {
        both: 'overflow-auto',
        horizontal: 'overflow-x-auto overflow-y-hidden',
        vertical: 'overflow-y-auto overflow-x-hidden',
      },
    },
    defaultVariants: { axis: 'both' },
  },
);

// With a horizontal axis enabled the content box is `fit-content` floored at the container's width:
// as wide as the container while the content fits, as wide as the content's minimum when it does
// not. So text wraps normally, and content that cannot wrap grows the box - which is what a
// ResizeObserver on it can see, since growth inside an overflow box never changes the container's
// own size. With only the vertical axis enabled the box takes the container's width instead, so a
// child that scrolls horizontally on its own - a Table - keeps its own scroll surface rather than
// being widened into the clipped axis. The padding is the focus ring's room: an overflow box clips
// at its padding edge, so a focusable child flush with the container would lose its ring there.
const scrollContent = cva(
  'p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
  {
    variants: {
      axis: {
        both: 'w-fit min-w-full',
        horizontal: 'w-fit min-w-full',
        vertical: 'w-full',
      },
    },
    defaultVariants: { axis: 'both' },
  },
);

type Axis = NonNullable<VariantProps<typeof scrollContainer>['axis']>;

const isOverflowing = (element: HTMLElement, axis: Axis): boolean => {
  const horizontally = element.scrollWidth > element.clientWidth;
  const vertically = element.scrollHeight > element.clientHeight;
  return (
    (axis !== 'vertical' && horizontally) ||
    (axis !== 'horizontal' && vertically)
  );
};

// Reachable until measured, so server markup is keyboard-operable before hydration; after it, a tab
// stop only while an enabled axis actually overflows (WCAG 2.1.1 wants the scroll container itself
// focusable when nothing inside is). Measuring sets state on this element only, so focus elsewhere
// stays where it is.
const useOverflow = (
  container: { current: HTMLElement | null },
  content: { current: HTMLElement | null },
  axis: Axis,
): boolean => {
  const [isScrollable, setIsScrollable] = useState(true);
  useLayoutEffect(() => {
    const element = container.current;
    if (element === null) return;
    const measure = () => setIsScrollable(isOverflowing(element, axis));
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    if (content.current !== null) observer?.observe(content.current);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [container, content, axis]);
  return isScrollable;
};

export interface IScrollContainerProps
  extends VariantProps<typeof scrollContainer> {
  /** The group's accessible name while it can be scrolled. Required: a tab stop with no name is a
   *  mystery to a screen reader. The consuming app words it, usually after the heading above. */
  ariaLabel: string;
  children?: ReactNode;
  testId?: string;
}

/**
 * Makes overflowing content reachable along the chosen axes, within the space its parent allocates.
 * It owns the scrolling; the consumer owns the content and the allocation of space.
 *
 * @Guarantees — enforced on every render
 * - Scrolls only an enabled axis and only once content overflows it; overflow on a disabled axis is
 *   clipped. Content wraps as it would anywhere else.
 * - Keyboard-reachable - a named `group` with a tab stop - exactly while an enabled axis overflows,
 *   static content included; no stop and no group while everything fits. Scrollability is re-read on
 *   resize and on content change without moving focus.
 * - Native scrolling: scrollbars, wheel, touch and the browser's own arrow/page keys on the focused
 *   container. No key of a control inside it is intercepted and focus is never trapped.
 * - Invents no bound: no height, width or viewport unit of its own. The only space it adds is the
 *   focus ring's room around its content, so a focusable child flush with its edge - a Table's
 *   scroll region, a button - keeps a visible ring instead of having it clipped at the edge.
 *
 * @CallerMustEnsure
 * - The parent allocates finite space on every axis the container should scroll - a sized box, or a
 *   flex/grid item allowed to shrink (`flex: 1 1 0; min-height: 0` in a column). Under an unbounded
 *   parent it simply grows with its content, as any block would.
 * - Content fits a disabled axis. Clipping is not a way to hide essential content or controls.
 * - `ariaLabel` is wording the viewer would recognise, typically the heading above the content.
 */
export const ScrollContainer: FunctionComponent<IScrollContainerProps> = ({
  axis,
  ariaLabel,
  children,
  testId,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const isScrollable = useOverflow(container, content, axis ?? 'both');
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the name and the `group` role are set together; biome cannot see the pair
    <div
      ref={container}
      className={scrollContainer({ axis })}
      data-testid={testId}
      role={isScrollable ? 'group' : undefined}
      aria-label={isScrollable ? ariaLabel : undefined}
      tabIndex={isScrollable ? 0 : undefined}
    >
      <div ref={content} className={scrollContent({ axis })}>
        {children}
      </div>
    </div>
  );
};
