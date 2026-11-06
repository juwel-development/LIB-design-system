import { cva } from 'class-variance-authority';
import {
  type FunctionComponent,
  type ReactNode,
  useLayoutEffect,
  useState,
} from 'react';
import { ScreenBodyAllocation } from './ScreenBodyAllocation';

const screen = cva(
  'box-border grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] px-[var(--gutter)] py-[var(--space-region)] [&:has(>header)]:grid-rows-[auto_minmax(0,1fr)] [&:has(>header)]:gap-[var(--space-region)]',
);
const screenHeading = cva('min-w-0');
const screenBody = cva(
  'h-full min-h-0 min-w-0 [&>div]:h-full [&:has([data-screen-unusable])>div]:h-auto',
);
type Extent = { bottom: number; boxes: readonly Element[] };

const isOutOfFlow = (computed: CSSStyleDeclaration): boolean =>
  computed.display === 'none' ||
  computed.position === 'absolute' ||
  computed.position === 'fixed';

// Height-passing boxes (filled columns, Tabs, Stepper) stretch to the allocation in one mode and
// shrink to their content in the other, so they are looked through; self-bounded boxes (Pane, a
// bounded Table or ScrollContainer) answer for their own room. What remains keeps its content
// height in both modes, so its lowest edge decides fallback and restoration alike (#159).
const extentOf = (holder: Element): Extent =>
  Array.from(holder.children).reduce<Extent>(
    (extent, child) => {
      const computed = getComputedStyle(child);
      const boxes = [...extent.boxes, child];
      if (isOutOfFlow(computed) || child.hasAttribute('data-height-bounded')) {
        return { bottom: extent.bottom, boxes };
      }
      if (child.hasAttribute('data-height-passing')) {
        const inner = extentOf(child);
        return {
          bottom: Math.max(extent.bottom, inner.bottom),
          boxes: [...boxes, ...inner.boxes],
        };
      }
      const bottom =
        child.getBoundingClientRect().bottom +
        (Number.parseFloat(computed.marginBottom) || 0);
      return { bottom: Math.max(extent.bottom, bottom), boxes };
    },
    { bottom: Number.NEGATIVE_INFINITY, boxes: [] },
  );

const useContentOverflow = (allocation: HTMLDivElement | null): boolean => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  useLayoutEffect(() => {
    const content = allocation?.firstElementChild;
    if (!allocation || !content) return;
    const measure = () =>
      setIsOverflowing(
        extentOf(content).bottom > allocation.getBoundingClientRect().bottom,
      );
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    // Observing a box reports it once, so the boxes are collected again only when content changes.
    const observe = () => {
      observer?.disconnect();
      observer?.observe(allocation);
      for (const box of extentOf(content).boxes) observer?.observe(box);
      measure();
    };
    observe();
    const mutations = new MutationObserver(observe);
    mutations.observe(content, {
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
  }, [allocation]);
  return isOverflowing;
};

export interface IScreenProps {
  /** Consumer-owned visible heading; omit when the heading belongs inside a Pane. */
  heading?: ReactNode;
  /** A filling ColumnLayout, a Pane or `Tabs.Root fill`, or content-height content such as a
   *  Stack or an unbounded Table. See the supported compositions below. */
  children: ReactNode;
  testId?: string;
}
/**
 * One semantic main with an optional heading and the remaining allocated height for its content.
 *
 * @Guarantees
 * - Uses the page gutter horizontally and region spacing vertically and beneath a present heading.
 * - Omitted, undefined, null and false headings reserve no wrapper, track or gap. Arbitrary
 *   components are not inspected for emptiness. Changing the slot never remounts content.
 * - Adds no scrollport or tab stop, and gives no content-height region one. Bounded bodies
 *   scroll independently while all fixed content fits: Pane heads and feet, a column head,
 *   content-height columns and sole content, plus each bounded body's complete text line or
 *   ordinary row/control with focus room. Long bounded-body content is never fixed content.
 * - Otherwise all content, the heading included, grows into the enclosing scroll owner and stays
 *   reachable there. Bounds restore when room returns, without probing, clipping or remounting
 *   children; mounted controls keep focus and selection in both directions.
 * - Unsized parents use natural height; ColumnLayout retains its container-fit stacking rule.
 *
 * @CallerMustEnsure
 * - Supply the visible heading here or inside a panel, and exactly one main for the page.
 * - Use Shell's console body, optionally Sidebar.Root fill / Sidebar.Content, to allocate height
 *   and own fallback scrolling. Every intermediate wrapper must pass that allocation through.
 * - Compose one of these as content; retain Pane's Head/Body/Foot order and never nest Panes.
 *   1. Filling ColumnLayout whose columns hold a Pane, `Tabs.Root fill` or `Alternatives fill`
 *      directly, optionally under a `Column head`; Body can delegate to one bounded Table.
 *   2. A column holding a content-height Stack - a Box and an unsized summary Pane, say.
 *   3. A content-height Stack or unbounded Table as the sole content, with or without heading.
 *   4. Content-height Stacks in one or more filled columns, beside Panes or each other.
 * - A filling Tabs row or a column head above a Pane counts against that Pane's room. Other
 *   height-passing wrappers, such as a Stack meant to bound a Pane, are outside the contract.
 * - Keep the Shell bar short enough to leave a usable enclosing scrollport. This is representative
 *   panel fit, not a guarantee that arbitrary content fits any particular viewport.
 */
export const Screen: FunctionComponent<IScreenProps> = ({
  heading,
  children,
  testId,
}) => {
  const [allocation, setAllocation] = useState<HTMLDivElement | null>(null);
  const isOverflowing = useContentOverflow(allocation);
  return (
    <main className={screen()} data-testid={testId}>
      {heading !== undefined && heading !== null && heading !== false && (
        <header className={screenHeading()}>{heading}</header>
      )}
      <div ref={setAllocation} className={screenBody()}>
        <div data-screen-unusable={isOverflowing || undefined}>
          <ScreenBodyAllocation.Provider value={allocation}>
            {children}
          </ScreenBodyAllocation.Provider>
        </div>
      </div>
    </main>
  );
};
