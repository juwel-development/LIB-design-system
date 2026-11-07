import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapse } from 'index';
import { type FunctionComponent, useEffect, useState } from 'react';
import { type Observable, Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

// Counts mounts and shows the latest value of a consumer stream, so a remount or a dropped
// subscription across collapse and expand is observable from the DOM.
const LiveCount: FunctionComponent<{
  count$: Observable<number>;
  mounts: { count: number };
}> = ({ count$, mounts }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    mounts.count += 1;
    const subscription = count$.subscribe(setCount);
    return () => subscription.unsubscribe();
  }, [count$, mounts]);
  return <output aria-label="Matches">{count}</output>;
};

const filters = (overrides: { defaultExpanded?: boolean } = {}) => (
  <Collapse summary="Filters" {...overrides}>
    <input aria-label="Name" />
  </Collapse>
);

describe('Collapse', () => {
  it('starts collapsed, showing only the consumer summary and no text of its own', () => {
    const { container } = render(filters());
    expect(screen.getByText('Filters')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name' })).not.toBeVisible();
    expect(container).toHaveTextContent(/^Filters$/);
  });

  it('starts expanded when asked to, with the same summary', () => {
    render(filters({ defaultExpanded: true }));
    expect(screen.getByText('Filters')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
  });

  it('opens and closes its content from the summary', async () => {
    const user = userEvent.setup();
    render(filters());
    await user.click(screen.getByText('Filters'));
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await user.click(screen.getByText('Filters'));
    expect(screen.getByRole('textbox', { name: 'Name' })).not.toBeVisible();
  });

  it("keeps the user's choice through ordinary rerenders and later initial-state changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(filters());
    await user.click(screen.getByText('Filters'));
    rerender(filters());
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    rerender(filters({ defaultExpanded: false }));
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await user.click(screen.getByText('Filters'));
    rerender(filters({ defaultExpanded: true }));
    expect(screen.getByRole('textbox', { name: 'Name' })).not.toBeVisible();
  });

  it('operates each instance independently, with no exclusive-open rule', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Collapse summary="Filters">
          <input aria-label="Name" />
        </Collapse>
        <Collapse summary="Columns" defaultExpanded>
          <input aria-label="Width" />
        </Collapse>
      </>,
    );
    await user.click(screen.getByText('Filters'));
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Width' })).toBeVisible();
    await user.click(screen.getByText('Columns'));
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Width' })).not.toBeVisible();
  });

  it('retains the same content nodes, typed values and live subscriptions while collapsed', async () => {
    const user = userEvent.setup();
    const count$ = new Subject<number>();
    const mounts = { count: 0 };
    render(
      <Collapse summary="Filters" defaultExpanded>
        <input aria-label="Name" />
        <LiveCount count$={count$} mounts={mounts} />
      </Collapse>,
    );
    const field = screen.getByRole('textbox', { name: 'Name' });
    await user.type(field, 'Ana');
    await user.click(screen.getByText('Filters'));
    act(() => count$.next(3));
    await user.click(screen.getByText('Filters'));
    expect(screen.getByRole('textbox', { name: 'Name' })).toBe(field);
    expect(field).toHaveValue('Ana');
    expect(screen.getByRole('status', { name: 'Matches' })).toHaveTextContent(
      '3',
    );
    expect(mounts.count).toBe(1);
    expect(count$.observed).toBe(true);
  });

  it('moves focus from a closing descendant to the summary, so it is never left hidden', () => {
    render(filters({ defaultExpanded: true }));
    const field = screen.getByRole('textbox', { name: 'Name' });
    field.focus();
    // A synthetic click activates the summary without moving focus, as an assistive action can.
    fireEvent.click(screen.getByText('Filters'));
    expect(field).not.toBeVisible();
    expect(screen.getByText('Filters').closest('summary')).toHaveFocus();
  });

  it('does not restore an old focused descendant when reopened', async () => {
    const user = userEvent.setup();
    render(filters({ defaultExpanded: true }));
    await user.click(screen.getByRole('textbox', { name: 'Name' }));
    await user.click(screen.getByText('Filters'));
    await user.click(screen.getByText('Filters'));
    expect(screen.getByText('Filters').closest('summary')).toHaveFocus();
  });

  it('leaves focus where it is when closing with focus outside the content', () => {
    render(
      <>
        <input aria-label="Search" />
        {filters({ defaultExpanded: true })}
      </>,
    );
    const search = screen.getByRole('textbox', { name: 'Search' });
    search.focus();
    fireEvent.click(screen.getByText('Filters'));
    expect(search).toHaveFocus();
  });

  it('is named by the summary wording alone, its indicator adding no text', () => {
    render(filters());
    expect(screen.getByText('Filters').closest('summary')).toHaveTextContent(
      /^Filters$/,
    );
  });

  it('carries a consumer test id on the disclosure', () => {
    render(
      <Collapse summary="Filters" testId="filters">
        <input aria-label="Name" />
      </Collapse>,
    );
    expect(
      within(screen.getByTestId('filters')).getByText('Filters'),
    ).toBeVisible();
  });

  it('requires consumer wording and offers no styling or controlled-state passthrough', () => {
    render(
      <>
        {/* @ts-expect-error the summary is the consumer's wording and required */}
        <Collapse>Without summary</Collapse>
        {/* @ts-expect-error no class passthrough */}
        <Collapse summary="Class" className="wide">
          Class content
        </Collapse>
        {/* @ts-expect-error no style passthrough */}
        <Collapse summary="Style" style={{}}>
          Style content
        </Collapse>
        {/* @ts-expect-error expansion is initial only; there is no controlled state */}
        <Collapse summary="Controlled" expanded>
          Controlled content
        </Collapse>
      </>,
    );
    expect(screen.getByText('Controlled')).toBeVisible();
  });
});
