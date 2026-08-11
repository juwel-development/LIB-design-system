import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
