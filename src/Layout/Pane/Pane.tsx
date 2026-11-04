import { hasUsableScrollAllocation } from 'Layout/ScreenAllocation/hasUsableScrollAllocation';
import { useScreenAllocation } from 'Layout/ScreenAllocation/useScreenAllocation';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  type FunctionComponent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const pane = cva(
  'box-border flex h-full min-h-0 min-w-0 flex-col gap-[var(--space-stack)] border border-solid border-border bg-surface text-foreground p-[var(--space-box-inset)] [overflow-wrap:anywhere]',
);
const paneSection = cva('min-w-0 shrink-0');
const paneBody = cva('min-h-0 min-w-0 flex-[0_1_auto]', {
  variants: {
    scrollOwner: {
      body: '[&>div]:flow-root [&>div]:w-fit [&>div]:min-w-full [&>div]:p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))] overflow-auto overscroll-contain outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
      child: '',
    },
  },
  defaultVariants: { scrollOwner: 'body' },
});

const useOverflow = (
  container: { current: HTMLDivElement | null },
  content: { current: HTMLDivElement | null },
  ownsScroll: boolean,
): boolean => {
  const [isScrollable, setIsScrollable] = useState(true);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element || !ownsScroll) return;
    const measure = () =>
      setIsScrollable(
        element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth ||
          element === element.ownerDocument.activeElement,
      );
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    if (content.current) observer?.observe(content.current);
    const mutations = new MutationObserver(measure);
    mutations.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    window.addEventListener('resize', measure);
    element.addEventListener('blur', measure);
    return () => {
      observer?.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', measure);
      element.removeEventListener('blur', measure);
    };
  }, [container, content, ownsScroll]);
  return isScrollable;
};

export interface IPaneRootProps {
  children?: ReactNode;
  /** A non-empty name makes the enclosure an accessible group, as with Box. */
  name?: string;
  testId?: string;
}
export interface IPaneSectionProps {
  children?: ReactNode;
  testId?: string;
}
export interface IPaneBodyProps extends VariantProps<typeof paneBody> {
  children?: ReactNode;
  /** Names the body while overflowing. Unused when the child owns scrolling. */
  ariaLabel: string;
  testId?: string;
}

const Root: FunctionComponent<IPaneRootProps> = ({
  children,
  name,
  testId,
}) => (
  // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the name and group role are assigned together
  <div
    className={pane()}
    role={name ? 'group' : undefined}
    aria-label={name || undefined}
    data-testid={testId}
  >
    {children}
  </div>
);
const Head: FunctionComponent<IPaneSectionProps> = ({ children, testId }) => (
  <div className={paneSection()} data-testid={testId}>
    {children}
  </div>
);
const Foot: FunctionComponent<IPaneSectionProps> = ({ children, testId }) => (
  <div className={paneSection()} data-testid={testId}>
    {children}
  </div>
);
const acceptsAllocation = (element: HTMLElement): boolean => {
  const content = element.firstElementChild;
  return (
    !(content instanceof HTMLElement) ||
    hasUsableScrollAllocation(element, content)
  );
};

const Body: FunctionComponent<IPaneBodyProps> = ({
  children,
  ariaLabel,
  scrollOwner,
  testId,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const ownsScroll = scrollOwner !== 'child';
  useScreenAllocation(container, ownsScroll, acceptsAllocation);
  const isScrollable =
    useOverflow(container, content, ownsScroll) && ownsScroll;
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the name and group role are assigned together
    <div
      ref={container}
      className={paneBody({ scrollOwner: scrollOwner ?? 'body' })}
      role={isScrollable ? 'group' : undefined}
      aria-label={isScrollable ? ariaLabel : undefined}
      tabIndex={isScrollable ? 0 : undefined}
      data-testid={testId}
    >
      {ownsScroll ? <div ref={content}>{children}</div> : children}
    </div>
  );
};

/**
 * A parent-bounded enclosure with optional content-height Head and Foot around a shrinking Body.
 *
 * @Guarantees
 * - Root fills the allocated height, including its border and box inset. Without a definite
 *   parent height it grows with content; a stacked parent or enclosing body owns scrolling.
 * - Head and Foot never shrink. Body scrolls both axes as needed and short content does not
 *   stretch: Foot follows it, with any unused height left in Root rather than inside Body.
 * - Root paints surface, foreground, border and box inset, square and without elevation.
 *   The stack space role separates slots; a non-empty name exposes a group, never a landmark.
 * - Default Body is the sole scroll region: a named group and keyboard stop only while
 *   overflowing, retained while focused. It reserves the shared focus ring's room and leaves
 *   native focus reveal, scrolling and child keyboard interactions intact.
 * - Body scrollOwner="child" passes its allocated height directly to its child, without an
 *   inner wrapper, overflow, group or keyboard stop. The child owns scroll semantics and naming.
 *   Use this for a bounded Table: its wrapper must own both axes so its header stays in view.
 *
 * @CallerMustEnsure
 * - Compose at most one Head, Body and Foot, in that order, directly inside Root; all are optional.
 *   Do not nest panes. The consumer owns all wording, facts, actions and internal arrangement.
 * - Supply a finite parent height to bound a pane, and enough room for Head, Foot, inset and gaps.
 *   At smaller sizes use an unsized stacked arrangement in a scrolling page or Shell body.
 * - In child mode supply one child that accepts its parent's allocated height and handles its
 *   own overflow and focus ring. Intermediate wrappers must preserve that allocation.
 * - Filled ColumnLayout columns and active Stepper panels can pass the bound to Root. Keep
 *   those holders and Pane directly composed so no intermediate wrapper loses the allocation.
 */
export const Pane = { Root, Head, Body, Foot } as const;
