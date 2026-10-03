import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { BehaviorSubject, type Observable, Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
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

  // A one-row body table: the row under test is the one named by its row header.
  const renderRow = (
    props: {
      onClick$?: Subject<void>;
      isSelected$?: Observable<boolean>;
    },
    children: ReactNode = (
      <Table.HeaderCell scope={'row'}>Nova</Table.HeaderCell>
    ),
  ) =>
    render(
      <Table.Root caption={'Artists'} notes={'supplementary'}>
        <Table.Body>
          <Table.Row onClick$={props.onClick$} isSelected$={props.isSelected$}>
            {children}
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );

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
    rerender(
      <Table.Root caption={'Artists'} notes={'supplementary'}>
        <Table.Body>
          <Table.Row>
            <Table.HeaderCell scope={'row'}>Nova</Table.HeaderCell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
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
    rerender(
      <Table.Root caption={'Artists'} notes={'supplementary'}>
        <Table.Body>
          <Table.Row onClick$={onClick$} isSelected$={isSelected$}>
            <Table.HeaderCell scope={'row'}>Nova</Table.HeaderCell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
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
    rerender(
      <Table.Root caption={'Artists'} notes={'supplementary'}>
        <Table.Body>
          <Table.Row isSelected$={isSelected$}>
            <Table.HeaderCell scope={'row'}>Nova</Table.HeaderCell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
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
    rerender(
      <Table.Root caption={'Artists'} notes={'supplementary'}>
        <Table.Body>
          <Table.Row isSelected$={second$}>
            <Table.HeaderCell scope={'row'}>Nova</Table.HeaderCell>
          </Table.Row>
        </Table.Body>
      </Table.Root>,
    );
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

  it('keeps the selected and interactive treatments free of fills and hover, like the static table', () => {
    const { container } = renderRow({
      onClick$: new Subject<void>(),
      isSelected$: new BehaviorSubject(true),
    });
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/(^|[\s:])bg-/);
      expect(element.className).not.toMatch(/hover:/);
    }
  });
});
