import { cva, type VariantProps } from 'class-variance-authority';
import { type FunctionComponent, type ReactNode, useState } from 'react';
import { ScreenBodyAllocation } from './ScreenBodyAllocation';

// Compact marks the main for its Panes, which read the marker through CSS (architecture
// standard, Two rules). Its floor keeps a focus ring at the content's edge inside the scrollport.
const screen = cva(
  'box-border grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] px-[var(--gutter)] [&:has(>header)]:grid-rows-[auto_minmax(0,1fr)]',
  {
    variants: {
      spacing: {
        comfortable:
          'py-[var(--space-region)] [&:has(>header)]:gap-[var(--space-region)]',
        compact:
          'py-[max(var(--space-screen-region-compact),calc(var(--focus-ring-width)+var(--focus-ring-offset)))] [&:has(>header)]:gap-[max(var(--space-screen-region-compact),calc(var(--focus-ring-width)+var(--focus-ring-offset)))]',
      },
    },
    defaultVariants: { spacing: 'comfortable' },
  },
);
const screenHeading = cva('min-w-0');
const screenBody = cva(
  'h-full min-h-0 min-w-0 [&>div]:h-full [&:has([data-screen-unusable])>div]:h-auto',
);
export interface IScreenProps extends VariantProps<typeof screen> {
  /** Consumer-owned visible heading; omit when the heading belongs inside a Pane. */
  heading?: ReactNode;
  /** Height-passing content, normally a filling ColumnLayout with direct Panes. */
  children: ReactNode;
  testId?: string;
}
/**
 * One semantic main with an optional heading and the remaining allocated height for its content.
 *
 * @Guarantees
 * - Uses the page gutter horizontally and region spacing vertically and beneath a present heading.
 * - spacing="compact" selects the compact console treatment: its own vertical air and heading gap,
 *   and the inset and slot gaps of every Pane inside it outside a Dialog, read from the
 *   --space-screen-region-compact, --space-pane-inset-compact and --space-pane-slot-compact tokens.
 *   Gutter, type, controls, focus rings and descendant spacing stay; Pane has no selector of its own.
 *   Omitted or "comfortable" renders as before; switching never remounts content.
 * - Omitted, undefined, null and false headings reserve no wrapper, track or gap. Arbitrary
 *   components are not inspected for emptiness. Changing the slot never remounts content.
 * - Adds no scrollport or tab stop. Pane bodies scroll independently while fixed regions plus a
 *   complete text line or ordinary row/control and focus room fit. Otherwise all content grows
 *   into the enclosing scroll owner. Bounds restore without probing or remounting children.
 * - Unsized parents use natural height; ColumnLayout retains its container-fit stacking rule.
 *
 * @CallerMustEnsure
 * - Supply the visible heading here or inside a panel, and exactly one main for the page.
 * - Use Shell's console body, optionally Sidebar.Root fill / Sidebar.Content, to allocate height
 *   and own fallback scrolling. Every intermediate wrapper must pass that allocation through.
 * - Compose filling ColumnLayout with direct Pane children; retain Pane's Head/Body/Foot order.
 *   Body can delegate to one bounded Table. A filling Tabs row above a Pane counts against that
 *   Pane's room; other height-consuming wrappers need their own allocation contract.
 * - Keep the Shell bar short enough to leave a usable enclosing scrollport. This is representative
 *   panel fit, not a guarantee that arbitrary content fits any particular viewport.
 */
export const Screen: FunctionComponent<IScreenProps> = ({
  heading,
  spacing,
  children,
  testId,
}) => {
  const [allocation, setAllocation] = useState<HTMLDivElement | null>(null);
  return (
    <main
      className={screen({ spacing })}
      data-screen-spacing={spacing === 'compact' ? spacing : undefined}
      data-testid={testId}
    >
      {heading !== undefined && heading !== null && heading !== false && (
        <header className={screenHeading()}>{heading}</header>
      )}
      <div ref={setAllocation} className={screenBody()}>
        <div>
          <ScreenBodyAllocation.Provider value={allocation}>
            {children}
          </ScreenBodyAllocation.Provider>
        </div>
      </div>
    </main>
  );
};
