import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  type CSSProperties,
  type FunctionComponent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { TableConfigurationError } from './TableConfigurationError';

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
    // Every narrow-viewport rule is off once an allocation is declared (#115): a declared comparison
    // keeps all of its columns and tabular rows, and the residual overflow scrolls instead.
    '[&[data-notes=supplementary]:not([data-columns])_[data-variant=note]]:max-md:hidden',
    // notes="content": the note is the content, so each row stacks into a single column below 48rem.
    '[&[data-notes=content]:not([data-columns])>table]:max-md:block',
    '[&[data-notes=content]:not([data-columns])_thead]:max-md:block [&[data-notes=content]:not([data-columns])_tbody]:max-md:block [&[data-notes=content]:not([data-columns])_tfoot]:max-md:block',
    '[&[data-notes=content]:not([data-columns])_tr]:max-md:block [&[data-notes=content]:not([data-columns])_td]:max-md:block [&[data-notes=content]:not([data-columns])_th]:max-md:block',
    // A declared allocation (#115) lays the table out as a grid whose tracks are the allocation, each
    // row group and row a column subgrid of it, so every cell sits on boundaries no row's content can
    // move and the browser's track algorithm does the floors and the redistribution. Rows stay boxes,
    // so their rules keep painting; the caption spans the tracks. Child combinators keep a nested table out.
    '[&[data-columns]>table]:grid [&[data-columns]>table]:grid-cols-[var(--table-columns)]',
    '[&[data-columns]>table>caption]:col-span-full',
    '[&[data-columns]>table>*:not(caption)]:col-span-full [&[data-columns]>table>*:not(caption)]:grid [&[data-columns]>table>*:not(caption)]:grid-cols-subgrid',
    '[&[data-columns]>table>*>tr]:col-span-full [&[data-columns]>table>*>tr]:grid [&[data-columns]>table>*>tr]:grid-cols-subgrid',
    // Text wraps inside its allocation, an unbroken run included, so it never contributes a width;
    // a control that cannot wrap keeps its own width, which the allocation has to hold.
    '[&[data-columns]>table>*>tr>td]:wrap-anywhere [&[data-columns]>table>*>tr>th]:wrap-anywhere',
  ].join(' '),
  {
    variants: {
      // Density publishes the two cell insets the cells read, so head and body move together and the
      // theme's comfortable or compact pair is the only source (docs/adr/0008, Amendments, #115).
      density: {
        comfortable:
          '[--table-cell-padding-inline:var(--table-cell-inset-inline)] [--table-cell-padding-block:var(--table-cell-inset-block)]',
        compact:
          '[--table-cell-padding-inline:var(--table-cell-inset-inline-compact)] [--table-cell-padding-block:var(--table-cell-inset-block-compact)]',
      },
    },
    defaultVariants: { density: 'comfortable' },
  },
);

// One hairline above every row, in `border`. Root promotes the first row's colour to `rule`; the last
// row takes no bottom rule, so the block stays open at the foot - the difference from a closed list.
const tableRow = cva('border-t border-solid border-border');

// A value is serif with real tabular figures; a note is the muted grotesk. Both sit at the small role,
// which carries the enforced 15px floor below which figures stop comparing column to column.
const tableCell = cva(
  'px-[var(--table-cell-padding-inline)] py-[var(--table-cell-padding-block)] text-small first:pl-0 last:pr-0',
  {
    variants: {
      variant: {
        value: 'font-primary text-foreground tabular-nums',
        note: 'font-secondary text-muted',
      },
      align: { left: 'text-left', right: 'text-right', center: 'text-center' },
    },
    defaultVariants: { variant: 'value', align: 'left' },
  },
);

// The label: the tracked muted grotesk, at the label role. Carried by both scopes (column and row).
const tableHeaderCell = cva(
  'px-[var(--table-cell-padding-inline)] py-[var(--table-cell-padding-block)] font-secondary font-medium text-label text-muted tracking-label first:pl-0 last:pr-0',
  {
    variants: {
      align: { left: 'text-left', right: 'text-right', center: 'text-center' },
    },
    defaultVariants: { align: 'left' },
  },
);

/** The width roles a column may take, as its fixed width or as a floor. Each names a column job the
 *  consumer specification attests - the subject's name, a short comparison fact, a tabular figure
 *  with its unit, one action control - and is read from the theme as `--table-column-<role>`. */
type TableColumnWidthRole = 'name' | 'fact' | 'figure' | 'action';

/**
 * One column's allocation of a table's width, independent of the rows currently displayed: either
 * fixed at a named width role, or a positive share of the width the fixed columns leave, with an
 * optional named minimum as its floor. Declared once on `Table.Root`, in cell order.
 */
export type TableColumnAllocation =
  | {
      /** The role whose width this column takes exactly, at any available width. */
      readonly width: TableColumnWidthRole;
      readonly weight?: never;
      /** A floor: a `width` smaller than its minimum resolves to the minimum. */
      readonly minWidth?: TableColumnWidthRole;
    }
  | {
      /** This column's share of the width the fixed columns leave, relative to its siblings' weights:
       *  a positive finite number. `3` beside `1` is three quarters and one quarter of it. */
      readonly weight: number;
      readonly width?: never;
      /** The least this column takes. While a minimum holds a column, the other proportional columns
       *  share what is left; with none, the share may shrink to nothing. */
      readonly minWidth?: TableColumnWidthRole;
    };

// React's CSSProperties is closed over known properties; the one custom property the recipe reads
// is declared here so the style object stays typed without an assertion.
type TableRootStyle = CSSProperties & { '--table-columns'?: string };

const roleOf = (role: TableColumnWidthRole): string =>
  `var(--table-column-${role})`;

// One grid track per definition: a fixed role, floored by max() when it has a minimum so it holds at
// any width; a share as minmax(floor, weight fr), which is the browser's own floor-and-redistribute.
const trackOf = (column: TableColumnAllocation, index: number): string => {
  const minimum =
    column.minWidth === undefined ? undefined : roleOf(column.minWidth);
  if (column.width !== undefined) {
    const width = roleOf(column.width);
    return minimum === undefined ? width : `max(${minimum}, ${width})`;
  }
  if (!Number.isFinite(column.weight) || column.weight <= 0) {
    throw new TableConfigurationError(
      `column ${index + 1} needs a positive finite weight (got ${column.weight})`,
    );
  }
  return `minmax(${minimum ?? '0'}, ${column.weight}fr)`;
};

const allocationOf = (
  columns: readonly TableColumnAllocation[] | undefined,
): string | undefined =>
  columns === undefined || columns.length === 0
    ? undefined
    : columns.map(trackOf).join(' ');

interface ITableRootProps extends VariantProps<typeof table> {
  /** The table's accessible name. Rendered as the first child; always present. */
  caption: string;
  /** What the note column is. Governs narrow-viewport behaviour; omit when there is none. */
  notes?: 'supplementary' | 'content';
  /** The columns' allocations, in the order the cells of every row are written. Omit it and widths
   *  follow content as before; declare it and every row shares one allocation the rows' content
   *  cannot move, and the narrow-viewport `notes` behaviour is replaced by residual scrolling. */
  columns?: readonly TableColumnAllocation[];
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

// With a note column the wrapper is a named group with a tab stop only while the table overflows it
// (WCAG 2.1.1): reachable until measured so server markup is operable before hydration, and kept
// reachable while it holds focus itself, since dropping tabindex from the focused element relocates
// focus. The table and the caption are observed too: growth inside an overflow box never changes the
// wrapper's size, and under a declared allocation the tracks overflow the table's own box while the
// caption, spanning every track, is what grows (#115).
const useHorizontalOverflow = (
  wrapper: { current: HTMLElement | null },
  table: { current: HTMLElement | null },
  caption: { current: HTMLElement | null },
): boolean => {
  const [isOverflowing, setIsOverflowing] = useState(true);
  useLayoutEffect(() => {
    const element = wrapper.current;
    if (element === null) return;
    const measure = () =>
      setIsOverflowing(
        element.scrollWidth > element.clientWidth ||
          element === document.activeElement,
      );
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    for (const observed of [table.current, caption.current]) {
      if (observed !== null) observer?.observe(observed);
    }
    window.addEventListener('resize', measure);
    element.addEventListener('blur', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      element.removeEventListener('blur', measure);
    };
  }, [wrapper, table, caption]);
  return isOverflowing;
};

const TableRoot: FunctionComponent<ITableRootProps> = ({
  caption,
  notes,
  columns,
  density,
  children,
  testId,
}) => {
  const wrapper = useRef<HTMLDivElement>(null);
  const tableElement = useRef<HTMLTableElement>(null);
  const captionElement = useRef<HTMLTableCaptionElement>(null);
  const allocation = allocationOf(columns);
  const isOverflowing = useHorizontalOverflow(
    wrapper,
    tableElement,
    captionElement,
  );
  const style: TableRootStyle | undefined =
    allocation === undefined ? undefined : { '--table-columns': allocation };
  const columnCount = allocation === undefined ? undefined : columns?.length;
  const content = (
    <table ref={tableElement}>
      <caption ref={captionElement}>{caption}</caption>
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
        className={table({ density })}
        style={style}
        data-columns={columnCount}
        data-density={density ?? 'comfortable'}
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
      className={table({ density })}
      style={style}
      data-notes={notes}
      data-columns={columnCount}
      data-density={density ?? 'comfortable'}
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
 * - `Root columns` declares every column's allocation once, in cell order, and every row shares it:
 *   a fixed column takes its named width role at any available width; proportional columns share
 *   the width the fixed ones leave by their weights, each floored at its named minimum, and while a
 *   minimum holds one column the others share what is left. A fixed width below its minimum is the
 *   minimum. Nothing a row holds moves a boundary: filtering, sorting, paging, long or short content,
 *   an empty body and its repopulation all leave the allocation as it was. Only the definitions, the
 *   theme's `--table-column-*` values and the available width can. All-fixed columns do not stretch.
 * - With `columns` declared, no narrow-viewport rule applies whatever `notes` says: the note column
 *   stays, rows stay tabular, and what does not fit scrolls in the wrapper as above. Text wraps inside
 *   its allocation, an unbroken run included; the table never truncates, hides or resizes content.
 *   Without `columns`, widths follow content and both `notes` behaviours are exactly as before.
 * - `Root density` insets every header and body cell from one theme pair: `comfortable` (the
 *   default, the former spacing exactly) or `compact`, per table. It moves no type size and no
 *   control's own dimensions. A non-positive or non-finite `weight` throws
 *   {@link TableConfigurationError}, loud and early.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Every row writes exactly as many cells as there are `columns`, in the same order. A row with
 *   fewer leaves tracks empty; one with more breaks onto a second line of its own row.
 * - A cell whose content cannot wrap - a `Button`, an `Input`, an image - sits in a column whose
 *   fixed width or minimum holds it: the `action` role holds one standard control at comfortable
 *   density. The allocation never widens for content, so an under-allocated control overflows its
 *   cell rather than moving its neighbours.
 * - A cell's `align` and `variant` are the consumer's as before; an allocation sets neither.
 *
 * @UXGuidelines
 * - Allocate by job, not by measurement: the subject's `name` first, proportional with a minimum so it
 *   wraps rather than vanishes; comparison facts proportional at `fact`; figures fixed at `figure`,
 *   right-aligned; the action column fixed at `action`, last. A theme that re-points a role moves
 *   every table using it, which is the point of naming the role rather than the width.
 * - `compact` is for a dense comparison the viewer scans, not for fitting more in: it changes air,
 *   not type, so a table that overflows at `comfortable` mostly still overflows at `compact`.
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
