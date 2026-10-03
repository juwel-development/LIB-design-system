import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { type ITableRowProps, Table } from './Table';
import { TableConfigurationError } from './TableConfigurationError';

const renderSpecTable = (
  notes?: 'supplementary' | 'content',
  testId?: string,
) =>
  render(
    <Table.Root
      caption={'Material specification'}
      notes={notes}
      testId={testId}
    >
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell scope={'col'}>Property</Table.HeaderCell>
          <Table.HeaderCell scope={'col'} align={'right'}>
            Value
          </Table.HeaderCell>
          <Table.HeaderCell scope={'col'}>Note</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.HeaderCell scope={'row'}>Weight</Table.HeaderCell>
          <Table.Cell variant={'value'} align={'right'}>
            2.4 kg
          </Table.Cell>
          <Table.Cell variant={'note'}>dry, no cable</Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.HeaderCell scope={'row'}>Total</Table.HeaderCell>
          <Table.Cell variant={'value'} align={'right'}>
            4.8 kg
          </Table.Cell>
          <Table.Cell variant={'note'}>as shipped</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>,
  );

describe('Table', () => {
  it('renders the semantic table structure a server can render with no JavaScript', () => {
    renderSpecTable();
    const table = screen.getByRole('table');
    expect(table.tagName).toBe('TABLE');
    // thead / tbody / tfoot each expose the rowgroup role assistive technology announces.
    expect(screen.getAllByRole('rowgroup')).toHaveLength(3);
    expect(table.querySelector('thead')).toBeInTheDocument();
    expect(table.querySelector('tbody')).toBeInTheDocument();
    expect(table.querySelector('tfoot')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('cell').length).toBeGreaterThan(0);
  });

  it('names the table by its required caption, rendered as the first child', () => {
    renderSpecTable();
    const table = screen.getByRole('table', { name: 'Material specification' });
    const caption = table.querySelector('caption');
    expect(caption).toHaveTextContent('Material specification');
    // <caption> is only valid, and only announced, as the table's first child.
    expect(table.firstElementChild).toBe(caption);
  });

  it('emits the scope it is given, so the header announces the axis it labels', () => {
    renderSpecTable();
    // scope=col surfaces as columnheader, scope=row as rowheader - the roles a screen reader reads.
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThanOrEqual(
      3,
    );
    expect(
      screen.getByRole('rowheader', { name: 'Weight' }),
    ).toBeInTheDocument();
  });

  it('defaults a cell to the value treatment, left aligned', () => {
    render(
      <Table.Root caption={'x'}>
        <Table.Body>
          <Table.Row>
            <Table.Cell>0.0</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
    expect(screen.getByRole('cell', { name: '0.0' })).toHaveAttribute(
      'data-variant',
      'value',
    );
  });

  it('sets tabular figures on a value cell and not on a note cell', () => {
    // font-variant-numeric has no jsdom-observable effect, so we assert the utility that sets it -
    // the requirement is that value figures line up column-to-column and notes do not.
    renderSpecTable();
    const value = screen.getByRole('cell', { name: '2.4 kg' });
    const note = screen.getByRole('cell', { name: 'dry, no cable' });
    expect(value).toHaveClass('tabular-nums');
    expect(note).not.toHaveClass('tabular-nums');
  });

  it('sets a value cell in the body family and a note cell in the secondary family (#120)', () => {
    // docs/adr/0004, the amendment: the figures are what was come for and read --font-body, which
    // is why the tnum constraint is stated on the effective body face; the note is apparatus.
    renderSpecTable();
    expect(screen.getByRole('cell', { name: '2.4 kg' }).className).toContain(
      'font-body',
    );
    expect(
      screen.getByRole('cell', { name: 'dry, no cable' }).className,
    ).toContain('font-secondary');
  });

  it('never boxes a cell: no td or th carries a border of its own', () => {
    // "Rules are the layout" - the block reads as a table from the row rules alone, so a cell
    // border would be the striping this component must not draw.
    renderSpecTable();
    for (const cell of [
      ...screen.getAllByRole('cell'),
      ...screen.getAllByRole('columnheader'),
      ...screen.getAllByRole('rowheader'),
    ]) {
      expect(cell.className).not.toMatch(/\bborder/);
    }
  });

  it("draws no fill, no hover and no zebra anywhere - the issue's explicit Must not list", () => {
    const { container } = renderSpecTable();
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/(^|[\s:])bg-/);
      expect(element.className).not.toMatch(/hover:/);
      expect(element.className).not.toMatch(/(odd|even):/);
    }
  });

  it('separates rows with a hairline and leaves the foot of the block open', () => {
    // The dividers are row rules; the last row takes no bottom rule, so the block stays open at the
    // foot - the deliberate difference from a list that closes below every item.
    renderSpecTable();
    for (const row of screen.getAllByRole('row')) {
      expect(row.className).toMatch(/\bborder-t\b/);
      expect(row.className).not.toMatch(/\bborder-b\b/);
    }
  });

  it('wraps the table in a horizontally scrollable, keyboard-reachable region when there is no note column', () => {
    renderSpecTable(undefined, 'spec');
    const region = screen.getByRole('region', {
      name: 'Material specification',
    });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).not.toHaveAttribute('data-notes');
  });

  it('marks a supplementary note column so the stylesheet can drop it below 48rem', () => {
    renderSpecTable('supplementary', 'spec');
    const root = screen.getByTestId('spec');
    expect(root).toHaveAttribute('data-notes', 'supplementary');
    // Supplementary content leaves the accessibility tree with the pixels - not a scroll region.
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('marks a content note column so the stylesheet stacks each row below 48rem', () => {
    renderSpecTable('content', 'spec');
    expect(screen.getByTestId('spec')).toHaveAttribute('data-notes', 'content');
  });

  it('exposes the one sanctioned host hook through testId', () => {
    renderSpecTable(undefined, 'material-table');
    expect(screen.getByTestId('material-table')).toBeInTheDocument();
  });

  it('is one namespace object carrying exactly its seven members', () => {
    expect(Object.keys(Table).sort()).toEqual(
      ['Body', 'Cell', 'Footer', 'Head', 'HeaderCell', 'Root', 'Row'].sort(),
    );
  });

  it('keeps the note cell reachable within its row', () => {
    renderSpecTable();
    const rowHeader = screen.getByRole('rowheader', { name: 'Weight' });
    const row = rowHeader.closest('tr');
    expect(row).not.toBeNull();
    expect(
      within(row as HTMLElement).getByText('dry, no cable'),
    ).toBeInTheDocument();
  });

  it.each(['none', 'ascending', 'descending', 'other'] as const)(
    'exposes a consumer-supplied ariaSort of %s on the header cell, so assistive technology hears the displayed order',
    (ariaSort) => {
      render(
        <Table.Root caption={'Parts'}>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell scope={'col'} ariaSort={ariaSort}>
                Name
              </Table.HeaderCell>
            </Table.Row>
          </Table.Head>
        </Table.Root>,
      );
      expect(
        screen.getByRole('columnheader', { name: 'Name' }),
      ).toHaveAttribute('aria-sort', ariaSort);
    },
  );

  it('leaves aria-sort absent when no ariaSort is given, so a non-sortable header announces nothing about order', () => {
    renderSpecTable();
    for (const header of screen.getAllByRole('columnheader')) {
      expect(header).not.toHaveAttribute('aria-sort');
    }
  });

  it('follows the consumer through updates and removal of ariaSort, and never reorders a row itself', () => {
    const rows = (
      <Table.Body>
        <Table.Row>
          <Table.Cell>Bracket</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Enclosure</Table.Cell>
        </Table.Row>
      </Table.Body>
    );
    const partsOrderedBy = (ariaSort?: 'ascending' | 'descending') => (
      <Table.Root caption={'Parts'}>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell scope={'col'} ariaSort={ariaSort}>
              Name
            </Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        {rows}
      </Table.Root>
    );
    const { rerender } = render(partsOrderedBy('ascending'));
    const header = screen.getByRole('columnheader', { name: 'Name' });
    const order = () =>
      screen.getAllByRole('cell').map((cell) => cell.textContent);
    expect(order()).toEqual(['Bracket', 'Enclosure']);

    rerender(partsOrderedBy('descending'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    // The attribute describes the displayed order; the rows are the consumer's and stay put.
    expect(order()).toEqual(['Bracket', 'Enclosure']);

    rerender(partsOrderedBy(undefined));
    expect(header).not.toHaveAttribute('aria-sort');
  });

  it.each([undefined, 'supplementary', 'content'] as const)(
    'lets residual horizontal overflow scroll in the %s notes mode, with no opt-in and no vertical bound',
    (notes) => {
      renderSpecTable(notes, 'spec');
      const wrapper = screen.getByTestId('spec');
      // Horizontal overflow is the wrapper's job in every mode; a vertical bound never is - that
      // belongs to a ScrollContainer around the table.
      expect(wrapper.className).toMatch(/\boverflow-x-auto\b/);
      expect(wrapper.className).not.toMatch(/overflow-y-|max-h-|\bh-/);
    },
  );

  const overflowBy = (scrollWidth: number, clientWidth: number) => {
    vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(
      scrollWidth,
    );
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(
      clientWidth,
    );
  };
  afterEach(() => vi.restoreAllMocks());

  it('stays a plain grouping element with no tab stop while the table fits, so nothing is added for a user to tab through', () => {
    overflowBy(300, 300);
    renderSpecTable('supplementary', 'spec');
    const wrapper = screen.getByTestId('spec');
    expect(wrapper).not.toHaveAttribute('tabindex');
    expect(wrapper).not.toHaveAttribute('role');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('becomes a keyboard-reachable group named by the caption once the table overflows, so the scroll is operable without a pointer', () => {
    overflowBy(600, 300);
    renderSpecTable('content', 'spec');
    const group = screen.getByRole('group', {
      name: 'Material specification',
    });
    expect(group).toBe(screen.getByTestId('spec'));
    expect(group).toHaveAttribute('tabindex', '0');
    // Still not a landmark: the caption names the table; the wrapper is a generic scroll group.
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('re-evaluates after a layout change without moving focus away from a control in the table', () => {
    overflowBy(300, 300);
    render(
      <Table.Root caption={'Parts'} notes={'supplementary'} testId={'spec'}>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell scope={'col'}>
              <button type={'button'}>Name</button>
            </Table.HeaderCell>
          </Table.Row>
        </Table.Head>
      </Table.Root>,
    );
    const control = screen.getByRole('button', { name: 'Name' });
    control.focus();
    expect(screen.getByTestId('spec')).not.toHaveAttribute('tabindex');

    overflowBy(900, 300);
    fireEvent(window, new Event('resize'));
    expect(screen.getByTestId('spec')).toHaveAttribute('tabindex', '0');
    expect(control).toHaveFocus();

    overflowBy(300, 300);
    fireEvent(window, new Event('resize'));
    expect(screen.getByTestId('spec')).not.toHaveAttribute('tabindex');
    expect(control).toHaveFocus();
  });
  it('keeps the wrapper reachable while it holds focus itself after the overflow goes, and drops the stop once focus has left', () => {
    // Dropping tabindex from the focused wrapper would let the browser fix focus up to the body.
    overflowBy(900, 300);
    renderSpecTable('supplementary', 'spec');
    const wrapper = screen.getByTestId('spec');
    wrapper.focus();
    expect(wrapper).toHaveFocus();

    overflowBy(300, 300);
    fireEvent(window, new Event('resize'));
    expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(wrapper).toHaveFocus();

    act(() => wrapper.blur());
    expect(wrapper).not.toHaveAttribute('tabindex');
    expect(wrapper).not.toHaveAttribute('role');
  });
  // A one-row body table: the row under test is the one named by its row header. The same tree
  // serves the first render and every rerender, so a test states only the props it changes.
  const rowTree = (
    props: Pick<ITableRowProps, 'onClick$' | 'isSelected$'>,
    children: ReactNode = (
      <Table.HeaderCell scope={'row'}>Nova</Table.HeaderCell>
    ),
  ) => (
    <Table.Root caption={'Artists'} notes={'supplementary'}>
      <Table.Body>
        <Table.Row onClick$={props.onClick$} isSelected$={props.isSelected$}>
          {children}
        </Table.Row>
      </Table.Body>
    </Table.Root>
  );

  const renderRow = (
    props: Pick<ITableRowProps, 'onClick$' | 'isSelected$'>,
    children?: ReactNode,
  ) => render(rowTree(props, children));

  const rowOf = (name: string): HTMLElement => {
    const row = screen.getByRole('rowheader', { name }).closest('tr');
    if (row === null) {
      throw new Error(`no row named ${name}`);
    }
    return row;
  };

  it('keeps a static row noninteractive: no tab stop and no selection state announced', () => {
    renderSpecTable();
    for (const row of screen.getAllByRole('row')) {
      expect(row).not.toHaveAttribute('tabindex');
      expect(row).not.toHaveAttribute('aria-selected');
    }
  });

  it('emits exactly once on onClick$ when the row body is activated by pointer', () => {
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    renderRow({ onClick$ });
    fireEvent.click(screen.getByRole('rowheader', { name: 'Nova' }));
    expect(activations).toHaveBeenCalledTimes(1);
  });

  it('adds an activation tab stop only while onClick$ is supplied', () => {
    const onClick$ = new Subject<void>();
    const { rerender } = renderRow({ onClick$ });
    expect(rowOf('Nova')).toHaveAttribute('tabindex', '0');
    rerender(rowTree({}));
    expect(rowOf('Nova')).not.toHaveAttribute('tabindex');
  });

  it('activates on Enter and on Space from the keyboard, each exactly once, so no pointer is needed', () => {
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    renderRow({ onClick$ });
    const row = rowOf('Nova');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(activations).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(row, { key: ' ' });
    expect(activations).toHaveBeenCalledTimes(2);
  });

  it('keeps Space from scrolling the page and ignores a held-down key, so a press is one request', () => {
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    renderRow({ onClick$ });
    const row = rowOf('Nova');
    const space = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    row.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    fireEvent.keyDown(row, { key: 'Enter', repeat: true });
    fireEvent.keyDown(row, { key: 'a' });
    expect(activations).toHaveBeenCalledTimes(1);
  });

  it('lets a nested link, button and their descendants perform their own operation without activating the row', () => {
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    const action = vi.fn();
    renderRow(
      { onClick$ },
      <>
        <Table.HeaderCell scope={'row'}>Nova</Table.HeaderCell>
        <Table.Cell>
          <a href={'/artists/nova'}>Open profile</a>
        </Table.Cell>
        <Table.Cell>
          <button type={'button'} onClick={action}>
            <span>Sign</span>
          </button>
        </Table.Cell>
      </>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Open profile' }));
    fireEvent.click(screen.getByText('Sign'));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Sign' }), {
      key: 'Enter',
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(activations).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('rowheader', { name: 'Nova' }));
    expect(activations).toHaveBeenCalledTimes(1);
  });

  it('announces the selection the consumer supplies, without a tab stop when the row cannot be activated', () => {
    renderRow({ isSelected$: new BehaviorSubject(true) });
    const row = rowOf('Nova');
    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(row).not.toHaveAttribute('tabindex');
  });

  it('reads as unselected until the selection input emits, and follows every later value', () => {
    const isSelected$ = new Subject<boolean>();
    renderRow({ isSelected$ });
    const row = rowOf('Nova');
    expect(row).toHaveAttribute('aria-selected', 'false');
    act(() => isSelected$.next(true));
    expect(row).toHaveAttribute('aria-selected', 'true');
    act(() => isSelected$.next(false));
    expect(row).toHaveAttribute('aria-selected', 'false');
  });

  it('never changes selection by itself: an unanswered activation leaves the rendered selection as it was', () => {
    const onClick$ = new Subject<void>();
    renderRow({ onClick$, isSelected$: new BehaviorSubject(false) });
    const row = rowOf('Nova');
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(row).toHaveAttribute('aria-selected', 'false');
  });

  it('emits no activation for rendering or for a change of selection', () => {
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    const isSelected$ = new BehaviorSubject(false);
    const { rerender } = renderRow({ onClick$, isSelected$ });
    act(() => isSelected$.next(true));
    rerender(rowTree({ onClick$, isSelected$ }));
    expect(rowOf('Nova')).toHaveAttribute('aria-selected', 'true');
    expect(activations).not.toHaveBeenCalled();
  });

  it('can still request activation while selected - the consumer decides what that means', () => {
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    renderRow({ onClick$, isSelected$: new BehaviorSubject(true) });
    fireEvent.click(rowOf('Nova'));
    expect(activations).toHaveBeenCalledTimes(1);
  });

  it('stops activation when onClick$ is removed while keeping the supplied selection', () => {
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    const isSelected$ = new BehaviorSubject(true);
    const { rerender } = renderRow({ onClick$, isSelected$ });
    rerender(rowTree({ isSelected$ }));
    const row = rowOf('Nova');
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(activations).not.toHaveBeenCalled();
    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(row).not.toHaveAttribute('tabindex');
  });

  it('switches to a replaced selection source: unselected until it emits, and deaf to the old one', () => {
    const first$ = new BehaviorSubject(true);
    const second$ = new Subject<boolean>();
    const { rerender } = renderRow({ isSelected$: first$ });
    expect(rowOf('Nova')).toHaveAttribute('aria-selected', 'true');
    rerender(rowTree({ isSelected$: second$ }));
    const row = rowOf('Nova');
    expect(row).toHaveAttribute('aria-selected', 'false');
    expect(first$.observed).toBe(false);
    act(() => first$.next(true));
    expect(row).toHaveAttribute('aria-selected', 'false');
    act(() => second$.next(true));
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('unsubscribes from the selection input when the row unmounts, and asks nothing of the consumer', () => {
    const isSelected$ = new BehaviorSubject(true);
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    const { rerender } = renderRow({ onClick$, isSelected$ });
    expect(isSelected$.observed).toBe(true);
    rerender(
      <Table.Root caption={'Artists'} notes={'supplementary'}>
        <Table.Body />
      </Table.Root>,
    );
    expect(isSelected$.observed).toBe(false);
    expect(isSelected$.getValue()).toBe(true);
    expect(activations).not.toHaveBeenCalled();
  });

  it('leaves a nested custom control, known only by its interactive role, to its own operation', () => {
    const onClick$ = new Subject<void>();
    const activations = vi.fn();
    onClick$.subscribe(activations);
    renderRow(
      { onClick$ },
      <>
        <Table.HeaderCell scope={'row'}>Nova</Table.HeaderCell>
        <Table.Cell>
          {/* biome-ignore lint/a11y/useFocusableInteractive: a role-only, unfocusable widget is the case under test */}
          <span role={'menuitemcheckbox'} aria-checked={'false'}>
            <span>Shortlist</span>
          </span>
        </Table.Cell>
      </>,
    );
    fireEvent.click(screen.getByText('Shortlist'));
    expect(activations).not.toHaveBeenCalled();
  });

  // --- Column allocation and density (#115) ------------------------------------------------------
  // The allocation is one custom property the Root writes and the stylesheet reads as the grid's
  // track list; the spec reads it back as the observable form of the contract, as ColumnLayout's
  // spec reads its threshold. Geometry itself is a browser fact and lives in the stories.
  const allocationOf = (element: HTMLElement): string =>
    element.style.getPropertyValue('--table-columns');

  type Allocation = NonNullable<
    ComponentProps<typeof Table.Root>['columns']
  >[number];

  const renderAllocated = (
    columns: readonly Allocation[] | undefined,
    rows: readonly string[] = ['Enclosure', 'Bracket'],
    notes?: 'supplementary' | 'content',
  ) => (
    <Table.Root
      caption={'Parts'}
      columns={columns}
      notes={notes}
      testId={'spec'}
    >
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell scope={'col'}>Part</Table.HeaderCell>
          <Table.HeaderCell scope={'col'} align={'right'}>
            Height
          </Table.HeaderCell>
          <Table.HeaderCell scope={'col'}>Note</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {rows.map((name) => (
          <Table.Row key={name}>
            <Table.HeaderCell scope={'row'}>{name}</Table.HeaderCell>
            <Table.Cell align={'right'}>44 mm</Table.Cell>
            <Table.Cell variant={'note'}>as shipped</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );

  it('offers density as the two accepted treatments only, and constrains a column to a width role or a weight', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof Table.Root>['density']>
    >().toEqualTypeOf<'comfortable' | 'compact'>();
    expectTypeOf<Allocation['minWidth']>().toEqualTypeOf<
      'name' | 'fact' | 'figure' | 'action' | undefined
    >();
    // @ts-expect-error a raw length is not a width role
    const length: Allocation = { width: '12rem' };
    // @ts-expect-error a consumer custom property is not a library width role
    const custom: Allocation = { weight: 1, minWidth: '--main-column' };
    // @ts-expect-error a column is fixed or proportional, never both
    const both: Allocation = { width: 'figure', weight: 2 };
    // @ts-expect-error a column is fixed or proportional, never neither
    const neither: Allocation = { minWidth: 'name' };
    expect([length, custom, both, neither]).toHaveLength(4);
  });

  it('defaults to the comfortable density and says so on the wrapper, so a stylesheet and a test can read it', () => {
    renderSpecTable(undefined, 'spec');
    expect(screen.getByTestId('spec')).toHaveAttribute(
      'data-density',
      'comfortable',
    );
  });

  it('selects density per table, so a compact table and a comfortable one coexist on one page', () => {
    render(
      <>
        <Table.Root caption={'Dense'} density={'compact'} testId={'dense'}>
          <Table.Body>
            <Table.Row>
              <Table.Cell>1</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
        <Table.Root caption={'Airy'} testId={'airy'}>
          <Table.Body>
            <Table.Row>
              <Table.Cell>2</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </>,
    );
    expect(screen.getByTestId('dense')).toHaveAttribute(
      'data-density',
      'compact',
    );
    expect(screen.getByTestId('airy')).toHaveAttribute(
      'data-density',
      'comfortable',
    );
  });

  it('insets header and body cells from the one published density, so both move together and neither carries a literal', () => {
    // jsdom computes no Tailwind style, so the utility the cells read is the observable fact: one
    // inline and one block inset the Root publishes, no px-4 / py-2 literal left on any cell.
    renderSpecTable(undefined, 'spec');
    for (const cell of [
      ...screen.getAllByRole('cell'),
      ...screen.getAllByRole('columnheader'),
      ...screen.getAllByRole('rowheader'),
    ]) {
      expect(cell.className).toMatch(
        /px-\[var\(--table-cell-padding-inline\)\]/,
      );
      expect(cell.className).toMatch(
        /py-\[var\(--table-cell-padding-block\)\]/,
      );
      expect(cell.className).not.toMatch(/\bp[xy]-\d/);
    }
  });

  it('declares no allocation when columns are omitted, so widths follow content exactly as before', () => {
    render(renderAllocated(undefined));
    const wrapper = screen.getByTestId('spec');
    expect(wrapper).not.toHaveAttribute('data-columns');
    expect(allocationOf(wrapper)).toBe('');
  });

  it('treats an empty column list as no allocation', () => {
    render(renderAllocated([]));
    expect(screen.getByTestId('spec')).not.toHaveAttribute('data-columns');
  });

  it('writes a fixed-only allocation as the named width roles, read from the theme, with nothing to stretch', () => {
    render(
      renderAllocated([
        { width: 'name' },
        { width: 'figure' },
        { width: 'action' },
      ]),
    );
    const wrapper = screen.getByTestId('spec');
    expect(wrapper).toHaveAttribute('data-columns', '3');
    expect(allocationOf(wrapper)).toBe(
      'var(--table-column-name) var(--table-column-figure) var(--table-column-action)',
    );
  });

  it('writes a proportional-only allocation as weighted shares from nothing, so 3:1 follows that ratio', () => {
    render(renderAllocated([{ weight: 3 }, { weight: 1 }, { weight: 1 }]));
    expect(allocationOf(screen.getByTestId('spec'))).toBe(
      'minmax(0, 3fr) minmax(0, 1fr) minmax(0, 1fr)',
    );
  });

  it('floors a proportional column at its named minimum, leaving the browser to redistribute the rest', () => {
    render(
      renderAllocated([
        { weight: 2, minWidth: 'name' },
        { width: 'figure' },
        { weight: 1, minWidth: 'fact' },
      ]),
    );
    expect(allocationOf(screen.getByTestId('spec'))).toBe(
      'minmax(var(--table-column-name), 2fr) var(--table-column-figure) minmax(var(--table-column-fact), 1fr)',
    );
  });

  it('floors a fixed column at its minimum, so a fixed width smaller than its minimum resolves to the minimum', () => {
    render(
      renderAllocated([
        { width: 'figure', minWidth: 'fact' },
        { weight: 1 },
        { weight: 1 },
      ]),
    );
    expect(allocationOf(screen.getByTestId('spec'))).toBe(
      'max(var(--table-column-fact), var(--table-column-figure)) minmax(0, 1fr) minmax(0, 1fr)',
    );
  });

  it('keeps the allocation while rows are filtered, reordered, emptied and repopulated, so columns never jump with the data', () => {
    const columns: Allocation[] = [
      { weight: 2, minWidth: 'name' },
      { width: 'figure' },
      { weight: 1 },
    ];
    const { rerender } = render(renderAllocated(columns));
    const wrapper = screen.getByTestId('spec');
    const allocation = allocationOf(wrapper);
    for (const rows of [
      ['Bracket'],
      ['Bracket', 'Enclosure'],
      [],
      ['Lid', 'Foot', 'Enclosure', 'Bracket'],
    ]) {
      rerender(renderAllocated(columns, rows));
      expect(screen.getByTestId('spec')).toBe(wrapper);
      expect(allocationOf(wrapper)).toBe(allocation);
      expect(wrapper).toHaveAttribute('data-columns', '3');
    }
  });

  it('follows an explicit change of definitions, which is the one consumer-side change that moves columns', () => {
    const { rerender } = render(
      renderAllocated([{ weight: 1 }, { weight: 1 }, { weight: 1 }]),
    );
    rerender(
      renderAllocated([{ width: 'name' }, { weight: 3 }, { weight: 1 }]),
    );
    expect(allocationOf(screen.getByTestId('spec'))).toBe(
      'var(--table-column-name) minmax(0, 3fr) minmax(0, 1fr)',
    );
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuses a weight of %s loudly, since a share of nothing or of everything is a programmer error',
    (weight) => {
      expect(() =>
        render(renderAllocated([{ weight }, { weight: 1 }, { weight: 1 }])),
      ).toThrow(TableConfigurationError);
    },
  );

  it('keeps the semantic table, its caption and header associations when columns are declared', () => {
    render(
      renderAllocated([
        { weight: 2, minWidth: 'name' },
        { width: 'figure' },
        { weight: 1 },
      ]),
    );
    const table = screen.getByRole('table', { name: 'Parts' });
    expect(table.tagName).toBe('TABLE');
    expect(table.firstElementChild?.tagName).toBe('CAPTION');
    expect(screen.getAllByRole('rowgroup')).toHaveLength(2);
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(
      screen.getByRole('rowheader', { name: 'Bracket' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    // Allocating space adds no behaviour: no row gains a tab stop, no header announces an order.
    for (const row of screen.getAllByRole('row')) {
      expect(row).not.toHaveAttribute('tabindex');
    }
    for (const header of screen.getAllByRole('columnheader')) {
      expect(header).not.toHaveAttribute('aria-sort');
    }
  });

  it.each(['supplementary', 'content'] as const)(
    'keeps every %s-notes narrow-viewport rule off once columns are declared, so the note column and the rows stay tabular',
    (notes) => {
      render(
        renderAllocated(
          [{ weight: 1 }, { width: 'figure' }, { weight: 1 }],
          undefined,
          notes,
        ),
      );
      const wrapper = screen.getByTestId('spec');
      // The wrapper still says what the note column is - that keeps its overflow-group contract -
      // while every rule keyed on a narrow viewport is gated on the allocation being absent.
      expect(wrapper).toHaveAttribute('data-notes', notes);
      expect(wrapper).toHaveAttribute('data-columns', '3');
      const narrowRules = wrapper.className
        .split(/\s+/)
        .filter((utility) => utility.includes('max-md:'));
      expect(narrowRules.length).toBeGreaterThan(0);
      for (const utility of narrowRules) {
        expect(utility).toContain(':not([data-columns])');
      }
    },
  );
});
