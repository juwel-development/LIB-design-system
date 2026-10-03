import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Table } from './Table';

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
});
