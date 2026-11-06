import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  type CSSProperties,
  type FocusEvent,
  type FunctionComponent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { Observable, Subject } from 'rxjs';
import { TableConfigurationError } from './TableConfigurationError';

// Rules are the layout. One recipe styles the whole table from its wrapper, so the block reads as a
// table from two rule weights and nothing else: no cell borders, no default fill, no zebra, no hover. Colours
// are semantic tokens re-pointed by `.dark`, so no selector carries a `dark:` class. The responsive
// behaviour is keyed on the wrapper's `data-notes`, so a server renders the right markup with no
// hydration and the mode is one attribute a stylesheet and a test can both read.
const DEFAULT_DENSITY = 'comfortable';
const DEFAULT_SELECTION_TREATMENT = 'marker';

const table = cva(
  [
    // Residual horizontal overflow scrolls in every mode (#114); the scroll sits on the wrapper so
    // the table keeps its table formatting context and the figures stay column-aligned. No vertical
    // bound unless bounded is requested; then this same wrapper owns both axes.
    'overflow-x-auto',
    // Content-sized actions need room at both scroll edges, including static rows. The outer
    // inset also protects rings above/below compact cells without changing the row height.
    '[&[data-icon-actions]]:p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    '[&[data-icon-actions]]:m-[calc(-1*(var(--focus-ring-width)+var(--focus-ring-offset)))]',
    '[&[data-icon-actions]]:scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    // Overflowing grid tracks extend beyond the table border box; wrapper padding alone does not
    // survive at that trailing scroll edge. Keep ring room inside the outer cells as well.
    '[&[data-icon-actions]>table>*>tr>*:first-child]:pl-[max(var(--table-cell-padding-inline),calc(var(--focus-ring-width)+var(--focus-ring-offset)))]',
    '[&[data-icon-actions]>table>*>tr>*:last-child]:pr-[max(var(--table-cell-padding-inline),calc(var(--focus-ring-width)+var(--focus-ring-offset)))]',
    // The wrapper takes the one focus ring when it is keyboard-reachable - docs/adr/0002.
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
    // The table: full width, collapsed borders so adjacent row rules meet as one line, text flush left.
    '[&>table]:w-full [&>table]:border-collapse [&>table]:text-left',
    // The required caption, rendered first, as the table's label in the tracked grotesk device.
    '[&_caption]:text-left [&_caption]:font-secondary [&_caption]:text-label [&_caption]:tracking-label [&_caption]:text-muted',
    // Every row carries a hairline top (Row); the first row - the first row group after the caption -
    // is promoted to the heavier `rule` colour, and that heavier line is what reads as a table not a list.
    '[&>table>*:nth-child(2)>tr:first-child]:border-rule',
    // notes="supplementary": the note column leaves the page for everyone, sighted or not, below 48rem.
    // Every narrow-viewport rule is off once an allocation is declared (#115): a declared comparison
    // keeps all of its columns and tabular rows, and the residual overflow scrolls instead.
    '[&[data-notes=supplementary]:not([data-columns]):not([data-bounded])_[data-variant=note]]:max-md:hidden',
    // notes="content": the note is the content, so each row stacks into a single column below 48rem.
    '[&[data-notes=content]:not([data-columns]):not([data-bounded])>table]:max-md:block',
    '[&[data-notes=content]:not([data-columns]):not([data-bounded])_thead]:max-md:block [&[data-notes=content]:not([data-columns]):not([data-bounded])_tbody]:max-md:block [&[data-notes=content]:not([data-columns]):not([data-bounded])_tfoot]:max-md:block',
    '[&[data-notes=content]:not([data-columns]):not([data-bounded])_tr]:max-md:block [&[data-notes=content]:not([data-columns]):not([data-bounded])_td]:max-md:block [&[data-notes=content]:not([data-columns]):not([data-bounded])_th]:max-md:block',
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
    // A table carrying a selection input anywhere gives every row's first cell the ordinary cell inset
    // instead of the flush edge - head and foot included - so the selected row's marker bar (Row) has
    // room inside the cell and no column shifts as the selection moves (#113). The inset is the
    // density's, so a compact table keeps the same room it gives every other cell.
    '[&:has([aria-selected])_tr>*:first-child]:pl-[var(--table-cell-padding-inline)]',
    // A table with an interactive row makes ring room the way Tabs does: padding holds the wrapper's
    // edge (and the scroll clip, when it is the region) off a focused row's outline, the negative
    // margin hands the room back to the page, so the ring sits outside the row and never covers the
    // marker at its leading edge. Written from the two ring tokens so it cannot drift from the ring.
    '[&:has(tr[tabindex])]:p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    '[&:not([data-bounded]):has(tr[tabindex])]:m-[calc(-1*(var(--focus-ring-width)+var(--focus-ring-offset)))]',
    '[&:has(tr[tabindex])]:scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
  ].join(' '),
  {
    variants: {
      bounded: {
        true: 'max-h-full min-h-0 min-w-0 overflow-y-auto overscroll-contain p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))] [&>table>thead]:sticky [&>table>thead]:top-0 [&>table>thead]:z-10 [&>table>thead]:bg-surface [&>table>thead>tr>*]:bg-surface',
        false: '',
      },
      selectionTreatment: {
        marker: '',
        highlight:
          '[&>table>*>tr[aria-selected=true]]:bg-selected-surface [&>table>*>tr[aria-selected=true]]:[--color-error:var(--color-selected-error)]',
      },
      // A hidden caption is positioned against the table's own box, so it scrolls and clips with the
      // table instead of extending the document below an enclosing scroll owner (#159).
      captionVisibility: {
        visible: '[&>table>caption]:pb-3',
        hidden: 'relative [&>table>caption]:sr-only',
      },
      // Density publishes the two cell insets the cells read, so head and body move together and the
      // theme's comfortable or compact pair is the only source (docs/adr/0008, Amendments, #115).
      density: {
        comfortable:
          '[--table-cell-padding-inline:var(--table-cell-inset-inline)] [--table-cell-padding-block:var(--table-cell-inset-block)]',
        compact:
          '[--table-cell-padding-inline:var(--table-cell-inset-inline-compact)] [--table-cell-padding-block:var(--table-cell-inset-block-compact)]',
      },
    },
    defaultVariants: {
      density: DEFAULT_DENSITY,
      captionVisibility: 'visible',
      selectionTreatment: DEFAULT_SELECTION_TREATMENT,
    },
  },
);

// One hairline above every row, in `border`; Root promotes the first to `rule` and the last row takes
// no bottom rule, so the block stays open at the foot. Selection is a `foreground` marker bar on the
// first cell's pseudo-element, keyed on aria-selected as in Tabs; no fill, no hover. The ring is the
// shared one (docs/adr/0002), outside the row at the token offset so it never covers the marker.
const tableRow = cva(
  [
    'border-t border-solid border-border',
    '[&[aria-selected=true]>*:first-child]:relative',
    '[&[aria-selected=true]>*:first-child]:before:absolute [&[aria-selected=true]>*:first-child]:before:inset-y-0 [&[aria-selected=true]>*:first-child]:before:left-0',
    '[&[aria-selected=true]>*:first-child]:before:border-l-[length:var(--table-selection-marker-thickness)] [&[aria-selected=true]>*:first-child]:before:border-solid [&[aria-selected=true]>*:first-child]:before:border-foreground',
  ].join(' '),
  {
    variants: {
      interactive: {
        true: 'cursor-pointer outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
        false: '',
      },
    },
    defaultVariants: { interactive: false },
  },
);

// What a row body is not: a control with an operation of its own, or anything inside one. An
// activation that starts there is the control's, never the row's, so a consumer stops no propagation.
const NESTED_CONTROL_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'label',
  '[contenteditable]',
  '[tabindex]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="treeitem"]',
  '[role="combobox"]',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
].join(', ');

const isFromNestedControl = (
  row: HTMLTableRowElement,
  target: EventTarget,
): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }
  const control = target.closest(NESTED_CONTROL_SELECTOR);
  return control !== null && control !== row && row.contains(control);
};

const ACTIVATION_KEYS: ReadonlySet<string> = new Set(['Enter', ' ']);

// A value is the body face with real tabular figures; a note is the muted secondary face. Both sit
// at the small role, which carries the enforced 15px floor below which figures stop comparing.
const tableCell = cva(
  'px-[var(--table-cell-padding-inline)] py-[var(--table-cell-padding-block)] text-small first:pl-0 last:pr-0',
  {
    variants: {
      variant: {
        value: 'font-body text-foreground tabular-nums',
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
      /** Fits the widest rendered action group, without sharing surplus width. */
      readonly width: 'icon-action';
      readonly weight?: never;
      readonly minWidth?: never;
    }
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

const widthOf = (role: TableColumnWidthRole): string =>
  `var(--table-column-${role})`;

// One grid track per definition: a fixed role, floored by max() when it has a minimum so it holds at
// any width; a share as minmax(floor, weight fr), which is the browser's own floor-and-redistribute.
const trackOf = (column: TableColumnAllocation, index: number): string => {
  if (column.width === 'icon-action') return 'max-content';
  const minimum =
    column.minWidth === undefined ? undefined : widthOf(column.minWidth);
  if (column.width !== undefined) {
    const width = widthOf(column.width);
    return minimum === undefined ? width : `max(${minimum}, ${width})`;
  }
  if (!Number.isFinite(column.weight) || column.weight <= 0) {
    throw new TableConfigurationError(
      `column ${index + 1} needs a positive finite weight (got ${column.weight})`,
    );
  }
  return `minmax(${minimum ?? '0'}, ${column.weight}fr)`;
};

const trackListOf = (
  columns: readonly TableColumnAllocation[] | undefined,
): string | undefined =>
  columns === undefined || columns.length === 0
    ? undefined
    : columns.map(trackOf).join(' ');

export interface ITableRootProps extends VariantProps<typeof table> {
  /** Opt into parent-bounded scrolling on both axes with a pinned header; short tables keep natural height. */
  bounded?: boolean;
  /** The table's accessible name. Rendered as the first child; always present. */
  caption: string;
  /** What the note column is. Governs narrow-viewport behaviour; omit when there is none. */
  notes?: 'supplementary' | 'content';
  /** The columns' allocations, in the order the cells of every row are written. Omit it and widths
   *  follow content as before; declare it and every row shares one allocation the rows' content
   *  cannot move (except content-sized `icon-action` tracks), and the narrow-viewport `notes` behaviour is replaced by residual scrolling. */
  columns?: readonly TableColumnAllocation[];
  children?: ReactNode;
  testId?: string;
}

export interface ITableSectionProps {
  children?: ReactNode;
}

export interface ITableRowProps {
  children?: ReactNode;
  testId?: string;
  /** Emits once per activation of the row body - a click, or Enter or Space while the row has
   *  focus. Its presence is what makes the row interactive: a tab stop, a visible focus ring and a
   *  pointer cursor. Nested links and controls keep their own operations and never emit here.
   *  Activation changes nothing about the row; the consumer decides what the request means. */
  onClick$?: Subject<void>;
  /** The consumer's selection for this row. Rendered as `aria-selected` and the marker bar; omitted
   *  or not yet emitted means unselected. Selection is independent of `onClick$`: a selected row
   *  may be noninteractive, and an interactive row may be unselected. */
  isSelected$?: Observable<boolean>;
}

export interface ITableCellProps extends VariantProps<typeof tableCell> {
  children?: ReactNode;
}

export interface ITableHeaderCellProps
  extends VariantProps<typeof tableHeaderCell> {
  /** Explicit, never inferred from Head/Body position - inference would need render-time context. */
  scope: 'row' | 'col';
  /** The order the column is *currently* displayed in, as accessibility metadata only. Omit it on a
   *  column that is not sortable; set it on the one ordered column. Changing it neither reorders rows
   *  nor triggers anything - the consumer owns the sort and composes the action in `children`. */
  ariaSort?: 'none' | 'ascending' | 'descending' | 'other';
  children?: ReactNode;
}

// With a note column the wrapper is a named group with a tab stop only while the table overflows it
// (WCAG 2.1.1): reachable until measured, so server markup is operable before hydration, and while
// it holds focus, since dropping tabindex from the focused element relocates it. The table and the
// caption are observed too: under an allocation the caption, spanning every track, is what grows.
const useOverflow = (
  wrapper: { current: HTMLElement | null },
  table: { current: HTMLElement | null },
  caption: { current: HTMLElement | null },
  bounded: boolean,
): number | undefined => {
  const [scrollTabIndex, setScrollTabIndex] = useState<number | undefined>(0);
  useLayoutEffect(() => {
    const element = wrapper.current;
    if (element === null) return;
    const measure = () => {
      // WebKit may perform native focus scrolling after focus handlers; scroll padding keeps
      // that second movement below even a wrapped header, rather than undoing focus reveal.
      if (bounded) {
        const headerHeight =
          table.current?.querySelector('thead')?.getBoundingClientRect()
            .height ?? 0;
        const ringRoom =
          Number.parseFloat(getComputedStyle(element).paddingTop) || 0;
        element.style.scrollPaddingTop = `${headerHeight + 2 * ringRoom}px`;
      }
      // Only bounded tables participate in Dialog release. Reading an absent inherited custom
      // property is depth-dependent in jsdom 29.1.1, even for ordinary content tables (#157).
      const isReleased =
        bounded &&
        getComputedStyle(element)
          .getPropertyValue('--_scroll-released')
          .trim() === '1';
      const isFocused = element === document.activeElement;
      const overflows =
        element.scrollWidth > element.clientWidth ||
        (bounded && element.scrollHeight > element.clientHeight);
      // Removing tabindex from an active element blurs it in Chromium. A retained -1 keeps
      // that focus through release while removing the extra scrolling stop from Tab order.
      setScrollTabIndex(
        isReleased
          ? isFocused
            ? -1
            : undefined
          : overflows || isFocused
            ? 0
            : undefined,
      );
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    for (const observed of [
      table.current,
      caption.current,
      table.current?.querySelector('thead') ?? null,
    ]) {
      if (observed !== null) observer?.observe(observed);
    }
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
      if (bounded) element.style.removeProperty('scroll-padding-top');
      window.removeEventListener('resize', measure);
      element.removeEventListener('blur', measure);
    };
  }, [wrapper, table, caption, bounded]);
  return scrollTabIndex;
};

const revealFocus = (event: FocusEvent<HTMLDivElement>): void => {
  const wrapper = event.currentTarget;
  if (
    getComputedStyle(wrapper).getPropertyValue('--_scroll-released').trim() ===
    '1'
  )
    return;
  const target = event.target;
  if (target === wrapper) return;
  const bounds = wrapper.getBoundingClientRect();
  const header = wrapper.querySelector(':scope > table > thead');
  const targetBounds = target.getBoundingClientRect();
  const ringRoom = Number.parseFloat(getComputedStyle(wrapper).paddingTop) || 0;
  const top =
    bounds.top +
    wrapper.clientTop +
    (header?.getBoundingClientRect().height ?? 0) +
    2 * ringRoom;
  const bottom =
    bounds.top + wrapper.clientTop + wrapper.clientHeight - ringRoom;
  if (!header?.contains(target)) {
    if (targetBounds.top < top) wrapper.scrollTop += targetBounds.top - top;
    else if (targetBounds.bottom > bottom)
      wrapper.scrollTop += targetBounds.bottom - bottom;
  }
  if (targetBounds.left < bounds.left + ringRoom)
    wrapper.scrollLeft += targetBounds.left - bounds.left - ringRoom;
  else if (
    targetBounds.right >
    bounds.left + wrapper.clientLeft + wrapper.clientWidth - ringRoom
  )
    wrapper.scrollLeft +=
      targetBounds.right -
      bounds.left -
      wrapper.clientLeft -
      wrapper.clientWidth +
      ringRoom;
};

const TableRoot: FunctionComponent<ITableRootProps> = ({
  caption,
  captionVisibility,
  bounded,
  selectionTreatment,
  notes,
  columns,
  density,
  children,
  testId,
}) => {
  const wrapper = useRef<HTMLDivElement>(null);
  const tableElement = useRef<HTMLTableElement>(null);
  const captionElement = useRef<HTMLTableCaptionElement>(null);
  const trackList = trackListOf(columns);
  const scrollTabIndex = useOverflow(
    wrapper,
    tableElement,
    captionElement,
    bounded === true,
  );
  const isOverflowing = scrollTabIndex !== undefined;
  const style: TableRootStyle | undefined =
    trackList === undefined ? undefined : { '--table-columns': trackList };
  const columnCount = trackList === undefined ? undefined : columns?.length;
  const content = (
    <table ref={tableElement} role={'table'}>
      <caption ref={captionElement}>{caption}</caption>
      {children}
    </table>
  );
  // No note column: the wrapper is a labelled region (a named `section`) so the horizontally
  // scrolled table is keyboard-operable - WCAG 2.1.1 needs the scroll container itself focusable,
  // there being no focusable cell content to carry it. With a note column the wrapper is a plain
  // grouping element that becomes a named, reachable group only while the table overflows it.
  if (notes === undefined && !bounded) {
    return (
      <section
        className={table({
          density,
          captionVisibility,
          selectionTreatment,
          bounded,
        })}
        style={style}
        data-columns={columnCount}
        data-icon-actions={
          columns?.some((column) => column.width === 'icon-action') || undefined
        }
        data-density={density ?? DEFAULT_DENSITY}
        data-selection-treatment={
          selectionTreatment ?? DEFAULT_SELECTION_TREATMENT
        }
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
    // biome-ignore lint/a11y/noStaticElementInteractions: focus bubbles from descendants; this reveals their focus without adding an interaction
    <div
      ref={wrapper}
      onFocus={bounded ? revealFocus : undefined}
      className={table({
        density,
        captionVisibility,
        selectionTreatment,
        bounded,
      })}
      style={style}
      data-bounded={bounded || undefined}
      data-height-bounded={bounded || undefined}
      data-notes={notes}
      data-columns={columnCount}
      data-icon-actions={
        columns?.some((column) => column.width === 'icon-action') || undefined
      }
      data-density={density ?? DEFAULT_DENSITY}
      data-selection-treatment={
        selectionTreatment ?? DEFAULT_SELECTION_TREATMENT
      }
      data-testid={testId}
      role={isOverflowing ? 'group' : undefined}
      aria-label={isOverflowing ? caption : undefined}
      tabIndex={scrollTabIndex}
    >
      {content}
    </div>
  );
};

// Every member states its table role explicitly, so the semantics survive the display changes the
// recipe makes - the allocation's grid (#115) and the stacked `content` notes - in any engine. Chrome
// keeps the implicit roles under `display: grid` (measured through CDP); WebKit's native tree could
// not be read, so nothing depends on it. biome.json excepts this file from noRedundantRoles for it.
const TableHead: FunctionComponent<ITableSectionProps> = ({ children }) => (
  <thead role={'rowgroup'}>{children}</thead>
);

const TableBody: FunctionComponent<ITableSectionProps> = ({ children }) => (
  <tbody role={'rowgroup'}>{children}</tbody>
);

const TableFooter: FunctionComponent<ITableSectionProps> = ({ children }) => (
  <tfoot role={'rowgroup'}>{children}</tfoot>
);

const TableRow: FunctionComponent<ITableRowProps> = ({
  children,
  testId,
  onClick$,
  isSelected$,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  // Reset, then follow: a replaced source reads unselected until it emits, and the subscription's
  // teardown is the row's (docs/adr/0013). A layout effect so a replaying source paints in the same
  // frame as the row, never a frame unselected first.
  useLayoutEffect(() => {
    setIsSelected(false);
    const subscription = isSelected$?.subscribe((value) =>
      setIsSelected(value),
    );
    return () => subscription?.unsubscribe();
  }, [isSelected$]);

  const requestByPointer = (event: MouseEvent<HTMLTableRowElement>): void => {
    if (!isFromNestedControl(event.currentTarget, event.target)) {
      onClick$?.next();
    }
  };

  // Keys reach the row only when it is the focused element itself: a key pressed on a nested
  // control bubbles here too, and that press is the control's. Space scrolls the page by default
  // and a held key repeats; one press is one request.
  const requestByKey = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (
      event.target !== event.currentTarget ||
      !ACTIVATION_KEYS.has(event.key)
    ) {
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
    }
    if (!event.repeat) {
      onClick$?.next();
    }
  };

  const interactive = onClick$ !== undefined;
  return (
    <tr
      role={'row'}
      className={tableRow({ interactive })}
      data-testid={testId}
      tabIndex={interactive ? 0 : undefined}
      aria-selected={isSelected$ === undefined ? undefined : isSelected}
      onClick={interactive ? requestByPointer : undefined}
      onKeyDown={interactive ? requestByKey : undefined}
    >
      {children}
    </tr>
  );
};

const TableHeaderCell: FunctionComponent<ITableHeaderCellProps> = ({
  scope,
  align,
  ariaSort,
  children,
}) => (
  <th
    role={scope === 'row' ? 'rowheader' : 'columnheader'}
    scope={scope}
    aria-sort={ariaSort}
    className={tableHeaderCell({ align })}
  >
    {children}
  </th>
);

const TableCell: FunctionComponent<ITableCellProps> = ({
  variant,
  align,
  children,
}) => (
  <td
    role={'cell'}
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
 *   `captionVisibility` defaults to `visible`; `hidden` visually clips the caption out of flow,
 *   including its spacing, while preserving its native accessible name and the scroll wrapper's name.
 *   The clipped caption stays inside the table's box, so it never extends an enclosing scrollport.
 *   Hide it only when visible text directly above the table already names what it lists; the
 *   enclosing arrangement owns the gap above the table. The consumer still supplies the caption.
 * - The block reads as a table from two rule weights alone: the heavier `rule` above the first row,
 *   `border` hairlines between rows, and no bottom rule on the last. No cell borders, default fill, zebra or hover.
 * - `Cell variant="value"` sets tabular figures; `variant="note"` does not. Both at the 15px small role.
 * - `HeaderCell` emits the `scope` it is given; none is inferred. It emits `ariaSort` the same way:
 *   the attribute states the displayed order and the component never orders, cycles or requests one.
 * - Residual horizontal overflow scrolls in every `notes` mode, with no opt-in. The wrapper is
 *   keyboard-reachable while there is something to scroll - always, as a named region, with no note
 *   column; as a named group only once the table overflows, with one. Bounded tables instead expose
 *   a named group and keyboard stop only while either axis overflows, retained while focused.
 * - `bounded` makes this same wrapper own both scroll axes within the parent's allocated height.
 *   Short tables retain natural height; unsized parents allow natural growth. Only the header pins,
 *   on the themed surface; captions scroll normally and keep naming the table. All columns and rows
 *   remain tabular at every width, including both notes modes. Unbounded behavior is unchanged.
 * - Focus reveals rows and controls below the pinned header inside the wrapper. Selection updates
 *   alone never scroll. The wrapper reserves the shared focus ring's room.
 * - `Root columns` declares every column's allocation once, in cell order, and every row shares it:
 *   a fixed column takes its named width role at any available width; proportional columns share
 *   the width the fixed ones leave by their weights, each floored at its named minimum, and while a
 *   minimum holds one column the others share what is left. A fixed width below its minimum is the
 *   minimum. Except for `icon-action`, nothing a row holds moves a boundary: filtering, sorting, paging, long or short content,
 *   an empty body and its repopulation all leave the allocation as it was. Only the definitions, the
 *   theme's `--table-column-*` values and the available width can. All-fixed columns do not stretch.
 * - `{ width: 'icon-action' }` fits the widest rendered cell (including its header and insets),
 *   takes no surplus width, and may shrink after filtering. Compose multiple plain icon buttons
 *   in `Cluster gap="stack"`; max-content track sizing keeps the group on one line.
 * - With `columns` declared, no narrow-viewport rule applies whatever `notes` says: the note column
 *   stays, rows stay tabular, and what does not fit scrolls in the wrapper as above. Text wraps inside
 *   its allocation, an unbroken run included; the table does not itself truncate, hide or resize content.
 *   Without `columns`, widths follow content and both `notes` behaviours are exactly as before.
 * - Exception: a consumer may mark individual `P` or `Note` content with `truncate`. Only that
 *   text stays on one line and ellipsizes at its allocated inline end, in either column layout;
 *   its full DOM text remains accessible and does not force the table wider. Unmarked siblings
 *   retain their wrapping/overflow behavior; fixed column widths and minimums still hold.
 * - `Root density` insets every header and body cell from one theme pair: `comfortable` (the
 *   default, the former spacing exactly) or `compact`, per table. It moves no type size and no
 *   control's own dimensions. A non-positive or non-finite `weight` throws
 *   {@link TableConfigurationError}, loud and early.
 * - A `Row` given `onClick$` is interactive: a tab stop with the shared focus ring, activated by a
 *   click on its body or by Enter or Space while focused, emitting exactly once per activation. A
 *   nested link, button or other control - and anything inside one - performs its own operation and
 *   never activates the row. Without `onClick$` the row body is inert and adds no tab stop; nested
 *   controls stay operable. Activation never changes selection.
 * - A `Row` given `isSelected$` carries `aria-selected` and, when true, the marker bar along its
 *   leading edge in `foreground` - a shape, not a colour, and not the focus ring. Omitted or not yet
 *   emitted reads unselected; a replaced source reads unselected until it emits; unmounting
 *   unsubscribes. The selection input is independent of `onClick$`, so a row may be selected and
 *   noninteractive, interactive and unselected, or both. Rendering and selection changes emit nothing.
 * - `Root selectionTreatment="highlight"` adds `selectedSurface` behind selected rows only;
 *   the default `marker` preserves the former presentation. Neither treatment changes on hover.
 *   The marker remains a border in forced colours, where backgrounds may be suppressed; selection
 *   stays distinct from the focus outline. A nested table chooses its own treatment.
 * - The row stays a `tr` in a `table`: no grid role, no arrow-key navigation. `aria-selected` is a
 *   WAI-ARIA 1.2 state of `row` and valid here, but Chromium exposes a row's selected state only
 *   inside a `grid`, so Chrome and Edge screen readers do not announce it on these rows (accepted
 *   limitation, #113). The marker bar is the one guaranteed selection cue.
 * - A table holding a selection input anywhere insets every row's first cell by the cell padding,
 *   head and foot included, so the marker has room and no column shifts as the selection moves. A
 *   table holding an interactive row makes ring room around itself, so a focused row's ring is never
 *   clipped by the scroll region. A table with neither keeps its static geometry exactly.
 *
 * - In Dialog's insufficient-height fallback the enclosing Dialog releases this wrapper's
 *   bound and pinned header. It contributes no independent scroll region or scroll tab stop;
 *   content and focus stay mounted while sufficient space restores bounded scrolling.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - For bounded mode supply finite usable parent height, with room for the header and readable rows.
 *   Compose directly inside `Pane.Body scrollOwner="child"` or `Dialog.Content scrollOwner="child"`:
 *   those holders add no scrolling. Intermediate wrappers must preserve the height allocation.
 *   Fixed surrounding content must fit; no component promises impossible viewport fitting.
 * - For narrow comparisons use weighted columns without minimums when the content can wrap into
 *   their shares. Fixed widths and declared minimums retain their meaning; controls may overflow.
 * - A theme's `selectedSurface` differs from resting/hover surfaces and keeps foreground, muted
 *   and link/status text at 4.5:1, and the marker, rule and focus ring at 3:1.
 *   Highlighted rows use selectedError for their error ink/fill. Other consumer-composed inks and
 *   controls must meet their own contrast constraints against this surface too.
 * - Every row writes exactly as many cells as there are `columns`, in the same order. A row with
 *   fewer leaves tracks empty; one with more breaks onto a second line of its own row.
 * - A cell whose content cannot wrap - a `Button`, an `Input`, an image - sits in a column whose
 *   fixed width or minimum holds it: the `action` role holds one standard control at comfortable
 *   density. The allocation never widens for content, so an under-allocated control overflows its
 *   cell rather than moving its neighbours. The content-sized icon-action allocation is the exception.
 * - Every icon-only Button needs an action-specific `ariaLabel`; leave its nested Icon decorative.
 *   Prefer labelled buttons wherever there is room. No tooltip is required. Only plain buttons
 *   inherit cell typography without increasing a single-line row's height; ghost keeps its padding.
 * - For icon actions, theme `--space-stack` must be at least the focus width plus offset, so a ring
 *   cannot reach its neighbour. Twice the cell block inset must hold that same ring extent
 *   between adjacent rows. Keep line height at least one em. The wrapper
 *   reserves ring room at scroll boundaries without changing row height.
 * - For truncated text, provide an operable path to the full wording (for example row activation
 *   opening the item). Truncation must not hide essential content or interactive descendants.
 * - A cell's `align` and `variant` are the consumer's as before; an allocation sets neither.
 * - Each row's `onClick$` and `isSelected$` are tied to that row's stable identity, so a reordered or
 *   temporarily removed row keeps its association. Table holds no identity, registry or policy, and
 *   removing a row never asks the consumer to clear or replace its selection.
 * - What an activation means - select, open, toggle - is the consumer's answer, given by rerendering
 *   from its own state. A request left unanswered leaves the rendered selection unchanged.
 * - An interactive row announces no verb of its own; the caption, a row header or a nested link
 *   should make the row's purpose plain.
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
