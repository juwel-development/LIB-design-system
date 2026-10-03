import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  type FunctionComponent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

// Rules are the layout. One recipe styles the whole table from its wrapper, so the block reads as a
// table from two rule weights and nothing else: no cell borders, no fill, no zebra, no hover. Colours
// are semantic tokens re-pointed by `.dark`, so no selector carries a `dark:` class. The responsive
// behaviour is keyed on the wrapper's `data-notes`, so a server renders the right markup with no
// hydration and the mode is one attribute a stylesheet and a test can both read.
const table = cva(
  [
    // Residual horizontal overflow scrolls in every mode (#114); the scroll sits on the wrapper so
    // the table keeps its table formatting context and the figures stay column-aligned. No vertical
    // bound: a long table is bounded by the ScrollContainer a consumer puts around it.
    'overflow-x-auto',
    // The wrapper takes the one focus ring when it is keyboard-reachable - docs/adr/0002.
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
    // The table: full width, collapsed borders so adjacent row rules meet as one line, text flush left.
    '[&>table]:w-full [&>table]:border-collapse [&>table]:text-left',
    // The required caption, rendered first, as the table's label in the tracked grotesk device.
    '[&_caption]:pb-3 [&_caption]:text-left [&_caption]:font-secondary [&_caption]:text-label [&_caption]:tracking-label [&_caption]:text-muted',
    // Every row carries a hairline top (Row); the first row - the first row group after the caption -
    // is promoted to the heavier `rule` colour, and that heavier line is what reads as a table not a list.
    '[&>table>*:nth-child(2)>tr:first-child]:border-rule',
    // notes="supplementary": the note column leaves the page for everyone, sighted or not, below 48rem.
    '[&[data-notes=supplementary]_[data-variant=note]]:max-md:hidden',
    // notes="content": the note is the content, so each row stacks into a single column below 48rem.
    '[&[data-notes=content]>table]:max-md:block',
    '[&[data-notes=content]_thead]:max-md:block [&[data-notes=content]_tbody]:max-md:block [&[data-notes=content]_tfoot]:max-md:block',
    '[&[data-notes=content]_tr]:max-md:block [&[data-notes=content]_td]:max-md:block [&[data-notes=content]_th]:max-md:block',
  ].join(' '),
);

// One hairline above every row, in `border`. Root promotes the first row's colour to `rule`; the last
// row takes no bottom rule, so the block stays open at the foot - the difference from a closed list.
const tableRow = cva('border-t border-solid border-border');

// A value is serif with real tabular figures; a note is the muted grotesk. Both sit at the small role,
// which carries the enforced 15px floor below which figures stop comparing column to column.
const tableCell = cva('px-4 py-2 text-small first:pl-0 last:pr-0', {
  variants: {
    variant: {
      value: 'font-primary text-foreground tabular-nums',
      note: 'font-secondary text-muted',
    },
    align: { left: 'text-left', right: 'text-right', center: 'text-center' },
  },
  defaultVariants: { variant: 'value', align: 'left' },
});

// The label: the tracked muted grotesk, at the label role. Carried by both scopes (column and row).
const tableHeaderCell = cva(
  'px-4 py-2 font-secondary font-medium text-label text-muted tracking-label first:pl-0 last:pr-0',
  {
    variants: {
      align: { left: 'text-left', right: 'text-right', center: 'text-center' },
    },
    defaultVariants: { align: 'left' },
  },
);

interface ITableRootProps {
  /** The table's accessible name. Rendered as the first child; always present. */
  caption: string;
  /** What the note column is. Governs narrow-viewport behaviour; omit when there is none. */
  notes?: 'supplementary' | 'content';
  children?: ReactNode;
  testId?: string;
}

interface ITableSectionProps {
  children?: ReactNode;
}

interface ITableRowProps {
  children?: ReactNode;
  testId?: string;
}

interface ITableCellProps extends VariantProps<typeof tableCell> {
  children?: ReactNode;
}

interface ITableHeaderCellProps extends VariantProps<typeof tableHeaderCell> {
  /** Explicit, never inferred from Head/Body position - inference would need render-time context. */
  scope: 'row' | 'col';
  /** The order the column is *currently* displayed in, as accessibility metadata only. Omit it on a
   *  column that is not sortable; set it on the one ordered column. Changing it neither reorders rows
   *  nor triggers anything - the consumer owns the sort and composes the action in `children`. */
  ariaSort?: 'none' | 'ascending' | 'descending' | 'other';
  children?: ReactNode;
}

// With a note column the wrapper is a plain grouping element until the table overflows it; from
// then on it is a named group with a tab stop, so the scroll is keyboard-operable (WCAG 2.1.1)
// without adding a stop while nothing scrolls. Reachable until measured, so server markup is
// operable before hydration. The table is observed as well as the wrapper because content growing
// inside an overflow box changes the table's size, never the wrapper's.
const useHorizontalOverflow = (
  wrapper: { current: HTMLElement | null },
  table: { current: HTMLElement | null },
): boolean => {
  const [isOverflowing, setIsOverflowing] = useState(true);
  useLayoutEffect(() => {
    const element = wrapper.current;
    if (element === null) return;
    const measure = () =>
      setIsOverflowing(element.scrollWidth > element.clientWidth);
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    if (table.current !== null) observer?.observe(table.current);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [wrapper, table]);
  return isOverflowing;
};

const TableRoot: FunctionComponent<ITableRootProps> = ({
  caption,
  notes,
  children,
  testId,
}) => {
  const wrapper = useRef<HTMLDivElement>(null);
  const tableElement = useRef<HTMLTableElement>(null);
  const isOverflowing = useHorizontalOverflow(wrapper, tableElement);
  const content = (
    <table ref={tableElement}>
      <caption>{caption}</caption>
      {children}
    </table>
  );
  // No note column: the wrapper is a labelled region (a named `section`) so the horizontally
  // scrolled table is keyboard-operable - WCAG 2.1.1 needs the scroll container itself focusable,
  // there being no focusable cell content to carry it. With a note column the wrapper is a plain
  // grouping element that becomes a named, reachable group only while the table overflows it.
  if (notes === undefined) {
    return (
      <section
        className={table()}
        data-testid={testId}
        aria-label={caption}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll container must be keyboard-operable (WCAG 2.1.1)
        tabIndex={0}
      >
        {content}
      </section>
    );
  }
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the name and the `group` role are set together; biome cannot see the pair
    <div
      ref={wrapper}
      className={table()}
      data-notes={notes}
      data-testid={testId}
      role={isOverflowing ? 'group' : undefined}
      aria-label={isOverflowing ? caption : undefined}
      tabIndex={isOverflowing ? 0 : undefined}
    >
      {content}
    </div>
  );
};

const TableHead: FunctionComponent<ITableSectionProps> = ({ children }) => (
  <thead>{children}</thead>
);

const TableBody: FunctionComponent<ITableSectionProps> = ({ children }) => (
  <tbody>{children}</tbody>
);

const TableFooter: FunctionComponent<ITableSectionProps> = ({ children }) => (
  <tfoot>{children}</tfoot>
);

const TableRow: FunctionComponent<ITableRowProps> = ({ children, testId }) => (
  <tr className={tableRow()} data-testid={testId}>
    {children}
  </tr>
);

const TableHeaderCell: FunctionComponent<ITableHeaderCellProps> = ({
  scope,
  align,
  ariaSort,
  children,
}) => (
  <th scope={scope} aria-sort={ariaSort} className={tableHeaderCell({ align })}>
    {children}
  </th>
);

const TableCell: FunctionComponent<ITableCellProps> = ({
  variant,
  align,
  children,
}) => (
  <td
    className={tableCell({ variant, align })}
    data-variant={variant ?? 'value'}
  >
    {children}
  </td>
);

/**
 * A composable data table where the rules are the layout. The consumer composes the table from the
 * seven members; no member takes a data array. A specification / details table is the shape it is
 * built for - a row label, a value in tabular figures, and a note.
 *
 * @Guarantees — enforced on every render
 * - Renders semantic `table`/`thead`/`tbody`/`tfoot`/`tr`/`th`/`td`, and works with JavaScript off.
 * - `Root` renders its required `caption` as the table's first child, so every table is named.
 * - The block reads as a table from two rule weights alone: the heavier `rule` above the first row,
 *   `border` hairlines between rows, and no bottom rule on the last. No cell borders, fill, zebra or hover.
 * - `Cell variant="value"` sets tabular figures; `variant="note"` does not. Both at the 15px small role.
 * - `HeaderCell` emits the `scope` it is given; none is inferred. It emits `ariaSort` the same way:
 *   the attribute states the displayed order and the component never orders, cycles or requests one.
 * - Residual horizontal overflow scrolls in every `notes` mode, with no opt-in. The wrapper is
 *   keyboard-reachable while there is something to scroll - always, as a named region, with no note
 *   column; as a named group only once the table overflows, with one. No vertical bound is ever set:
 *   a long table sits inside a `ScrollContainer` with `axis="vertical"`, which owns that axis.
 *
 * @UXGuidelines
 * - A sortable column is composed, not configured: a `Button variant="plain"` inside the `HeaderCell`
 *   carries the label and an `Icon` (`sort`, `sort-ascending`, `sort-descending`) that matches the
 *   order the consumer currently displays, and `ariaSort` on the same cell says so to assistive
 *   technology. Only the ordered column carries `ariaSort`; an action-only column carries no sort
 *   control. Until the consumer's data arrives, both icon and `ariaSort` keep stating the old order.
 * - `align` is a cell property but reads as a column one: set the same `align` on a `HeaderCell` and
 *   every `Cell` beneath it, and keep them in sync - the component cannot align a column for you.
 * - Choose `notes` by what the note column *is*: `"supplementary"` drops it below 48rem for everyone
 *   (out of the accessibility tree too); `"content"` stacks each row; omit it when there is no note.
 */
export const Table = {
  Root: TableRoot,
  Head: TableHead,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
} as const;
