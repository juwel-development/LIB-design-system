import { ScreenBodyAllocation } from 'Layout/Screen/ScreenBodyAllocation';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  type FunctionComponent,
  type ReactNode,
  useContext,
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
      child: 'flex flex-col',
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

const parseLength = (value: string): number => Number.parseFloat(value) || 0;

const blockEdges = (element: Element): number => {
  const style = getComputedStyle(element);
  return (
    parseLength(style.paddingTop) +
    parseLength(style.paddingBottom) +
    parseLength(style.borderTopWidth) +
    parseLength(style.borderBottomWidth)
  );
};

// HTML semantics describe the minimum usable item, including delegated tables. No Table internals
// or consumer selectors participate. A tall row/control must fit intact, with its focus extent.
const usableBodyHeight = (body: HTMLElement): number => {
  let minimum = 0;
  for (const element of [body, ...body.querySelectorAll('*')]) {
    const style = getComputedStyle(element);
    if (style.display === 'none') continue;
    const line = parseLength(style.lineHeight) || parseLength(style.fontSize);
    const ring = parseLength(
      getComputedStyle(body.firstElementChild ?? body).paddingTop,
    );
    const item = element.matches(
      'tr, button, input, select, textarea, [role="button"]',
    )
      ? element.getBoundingClientRect().height
      : line;
    minimum = Math.max(minimum, item + 2 * ring);
  }
  const table = body.querySelector('table');
  const fixedTable = table
    ? Array.from(table.children)
        .filter((element) => element.matches('caption, thead'))
        .reduce(
          (height, element) => height + element.getBoundingClientRect().height,
          0,
        )
    : 0;
  return minimum + fixedTable + blockEdges(body);
};

const useScreenFallback = (root: {
  current: HTMLDivElement | null;
}): boolean => {
  const allocation = useContext(ScreenBodyAllocation);
  const [isUnusable, setIsUnusable] = useState(false);
  useLayoutEffect(() => {
    const element = root.current;
    const frame = allocation;
    if (!element || !frame) return;
    const measure = () => {
      const sections = Array.from(element.children);
      const body = sections.find((section) =>
        section.hasAttribute('data-pane-body'),
      );
      const fixed = sections
        .filter((section) => section !== body)
        .reduce(
          (height, section) => height + section.getBoundingClientRect().height,
          0,
        );
      const gaps =
        Math.max(0, sections.length - 1) *
        parseLength(getComputedStyle(element).rowGap);
      // A height-passing holder may keep a row of its own above the pane (Tabs.Root fill); the
      // pane is offered the remainder less that row, bounded or released alike (#153).
      const allocation = frame.getBoundingClientRect();
      const above = Math.max(
        0,
        element.getBoundingClientRect().top - allocation.top,
      );
      setIsUnusable(
        allocation.height - above <
          fixed +
            gaps +
            blockEdges(element) +
            (body instanceof HTMLElement ? usableBodyHeight(body) : 0),
      );
    };
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    const observe = () => {
      observer?.disconnect();
      observer?.observe(frame);
      observer?.observe(element);
      for (const child of element.querySelectorAll('*'))
        observer?.observe(child);
      measure();
    };
    observe();
    const mutations = new MutationObserver(observe);
    mutations.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [allocation, root]);
  return isUnusable;
};

const Root: FunctionComponent<IPaneRootProps> = ({
  children,
  name,
  testId,
}) => {
  const root = useRef<HTMLDivElement>(null);
  const isUnusable = useScreenFallback(root);
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the name and group role are assigned together
    <div
      ref={root}
      data-screen-unusable={isUnusable || undefined}
      className={pane()}
      role={name ? 'group' : undefined}
      aria-label={name || undefined}
      data-testid={testId}
    >
      {children}
    </div>
  );
};
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
const Body: FunctionComponent<IPaneBodyProps> = ({
  children,
  ariaLabel,
  scrollOwner,
  testId,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const ownsScroll = scrollOwner !== 'child';
  const isScrollable =
    useOverflow(container, content, ownsScroll) && ownsScroll;
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the name and group role are assigned together
    <div
      data-pane-body=""
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
 *   inner wrapper, overflow, group or keyboard stop. Its flex allocation permits a bounded Table
 *   to shrink even in a content-height Dialog. The child owns scroll semantics and naming.
 *   Use this for a bounded Table: its wrapper must own both axes so its header stays in view.
 *
 * @CallerMustEnsure
 * - Compose at most one Head, Body and Foot, in that order, directly inside Root; all are optional.
 *   Do not nest panes. The consumer owns all wording, facts, actions and internal arrangement.
 * - Supply a finite parent height to bound a pane, and enough room for Head, Foot, inset and gaps.
 *   At smaller sizes use an unsized stacked arrangement in a scrolling page or Shell body.
 * - In child mode supply one child that accepts its parent's allocated height and handles its
 *   own overflow and focus ring. Intermediate wrappers must preserve that allocation.
 * - Inside Screen, fixed regions and the usable body minimum participate in whole-content
 *   fallback and restoration, measured against what Screen's remainder leaves below anything
 *   above the pane - a filling Tabs row. Dialog owns the corresponding whole-task fallback for
 *   a Pane with child-owned Body and bounded Table. Other parents own their fallback policy.
 * - Filled ColumnLayout columns and active Stepper panels can pass the bound to Root. Keep
 *   those holders and Pane directly composed so no intermediate wrapper loses the allocation.
 */
export const Pane = { Root, Head, Body, Foot } as const;
