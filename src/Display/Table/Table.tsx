import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  type FunctionComponent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useLayoutEffect,
  useState,
} from 'react';
import type { Observable, Subject } from 'rxjs';

// Rules are the layout. One recipe styles the whole table from its wrapper, so the block reads as a
// table from two rule weights and nothing else: no cell borders, no fill, no zebra, no hover. Colours
// are semantic tokens re-pointed by `.dark`, so no selector carries a `dark:` class. The responsive
// behaviour is keyed on the wrapper's `data-notes`, so a server renders the right markup with no
// hydration and the mode is one attribute a stylesheet and a test can both read.
const table = cva(
  [
    // With no note column the wrapper becomes a horizontally scrollable region (see Root); the scroll
    // sits here so the table keeps its table formatting context and the figures stay column-aligned.
    '[&:not([data-notes])]:overflow-x-auto',
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
    // A table carrying a selection input anywhere gives every row's first cell the ordinary cell inset
    // instead of the flush edge - head and foot included - so the selected row's marker bar (Row) has
    // room inside the cell and no column shifts as the selection moves (#113).
    '[&:has([aria-selected])_tr>*:first-child]:pl-4',
    // A table with an interactive row makes ring room the way Tabs does: padding holds the wrapper's
    // edge (and the scroll clip, when it is the region) off a focused row's outline, the negative
    // margin hands the room back to the page, so the ring sits outside the row and never covers the
    // marker at its leading edge. Written from the two ring tokens so it cannot drift from the ring.
    '[&:has(tr[tabindex])]:p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    '[&:has(tr[tabindex])]:m-[calc(-1*(var(--focus-ring-width)+var(--focus-ring-offset)))]',
    '[&:has(tr[tabindex])]:scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
  ].join(' '),
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

export interface ITableRootProps {
  /** The table's accessible name. Rendered as the first child; always present. */
  caption: string;
  /** What the note column is. Governs narrow-viewport behaviour; omit when there is none. */
  notes?: 'supplementary' | 'content';
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
  children?: ReactNode;
}

const TableRoot: FunctionComponent<ITableRootProps> = ({
  caption,
  notes,
  children,
  testId,
}) => {
  const content = (
    <table>
      <caption>{caption}</caption>
      {children}
    </table>
  );
  // No note column: the wrapper is a labelled region (a named `section`) so the horizontally
  // scrolled table is keyboard-operable - WCAG 2.1.1 needs the scroll container itself focusable,
  // there being no focusable cell content to carry it. With a note column there is nothing to
  // scroll to, so the wrapper stays a plain grouping element.
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
    <div className={table()} data-notes={notes} data-testid={testId}>
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
  children,
}) => (
  <th scope={scope} className={tableHeaderCell({ align })}>
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
 * - `HeaderCell` emits the `scope` it is given; none is inferred.
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
 * - The row stays a `tr` in a `table`: no grid role, no arrow-key navigation. `aria-selected` is a
 *   WAI-ARIA 1.2 state of `row` and valid here, but Chromium exposes a row's selected state only
 *   inside a `grid`, so Chrome and Edge screen readers do not announce it on these rows (accepted
 *   limitation, #113). The marker bar is the one guaranteed selection cue.
 * - A table holding a selection input anywhere insets every row's first cell by the cell padding,
 *   head and foot included, so the marker has room and no column shifts as the selection moves. A
 *   table holding an interactive row makes ring room around itself, so a focused row's ring is never
 *   clipped by the scroll region. A table with neither keeps its static geometry exactly.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Each row's `onClick$` and `isSelected$` are tied to that row's stable identity, so a reordered or
 *   temporarily removed row keeps its association. Table holds no identity, registry or policy, and
 *   removing a row never asks the consumer to clear or replace its selection.
 * - What an activation means - select, open, toggle - is the consumer's answer, given by rerendering
 *   from its own state. A request left unanswered leaves the rendered selection unchanged.
 * - An interactive row announces no verb of its own; the caption, a row header or a nested link
 *   should make the row's purpose plain.
 *
 * @UXGuidelines
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
