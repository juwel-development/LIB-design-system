import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Input, Stepper } from 'index';
import { Fragment } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

const example = (active$: Subject<string>, onSelect$: Subject<string>) => (
  <Stepper.Root active$={active$} onSelect$={onSelect$} label="Booking">
    <Stepper.List>
      <Stepper.Step
        value="songs"
        label="Songs"
        status="done"
        valueText="2 Songs"
        statusContent="Complete"
      />
      <Stepper.Step
        value="studio"
        label="Studio"
        status="open"
        valueText="Abbey Road"
      />
      <Stepper.Step
        value="bill"
        label="Bill"
        status="blocked"
        valueText="$1,104"
        statusContent="Choose dates first"
      />
    </Stepper.List>
    <Stepper.Panel value="songs">Song choices</Stepper.Panel>
    <Stepper.Panel value="studio">Studio choices</Stepper.Panel>
    <Stepper.Panel value="bill">Dates are required</Stepper.Panel>
  </Stepper.Root>
);

describe('Stepper', () => {
  it('unmounts inactive forms and restores only consumer-owned values on return', () => {
    const active$ = new BehaviorSubject('form');
    const saved$ = new BehaviorSubject('Original');
    const onSelect$ = new Subject<string>();
    const Field = () => (
      <Input
        label="Session"
        name="session"
        defaultValue={saved$.value}
        onInput$={saved$}
      />
    );
    render(
      <Stepper.Root active$={active$} onSelect$={onSelect$} label="Booking">
        <Stepper.List>
          <Stepper.Step
            value="form"
            label="Form"
            status="open"
            valueText="Details"
          />
          <Stepper.Step
            value="other"
            label="Other"
            status="done"
            valueText="Ready"
          />
        </Stepper.List>
        <Stepper.Panel value="form">
          <Field />
        </Stepper.Panel>
        <Stepper.Panel value="other">Other panel</Stepper.Panel>
      </Stepper.Root>,
    );
    const initial = screen.getByRole('textbox', { name: 'Session' });
    fireEvent.input(initial, { target: { value: 'Saved session' } });
    act(() => active$.next('other'));
    expect(initial).not.toBeInTheDocument();
    act(() => active$.next('form'));
    expect(screen.getByRole('textbox', { name: 'Session' })).not.toBe(initial);
    expect(screen.getByRole('textbox', { name: 'Session' })).toHaveValue(
      'Saved session',
    );
  });

  it('numbers open steps by rendered order, including fragments and reordering', () => {
    const active$ = new BehaviorSubject('b');
    const onSelect$ = new Subject<string>();
    const steps = (reverse: boolean) => (
      <Stepper.Root active$={active$} onSelect$={onSelect$} label="Order">
        <Stepper.List>
          {reverse ? (
            <Stepper.Step
              value="b"
              label="B"
              status="open"
              valueText="B value"
            />
          ) : undefined}
          <Fragment key="remaining">
            <Stepper.Step
              value="a"
              label="A"
              status="done"
              valueText="A value"
            />
            {!reverse && (
              <Stepper.Step
                value="b"
                label="B"
                status="open"
                valueText="B value"
              />
            )}
          </Fragment>
        </Stepper.List>
        <Stepper.Panel value="a">A panel</Stepper.Panel>
        <Stepper.Panel value="b">B panel</Stepper.Panel>
      </Stepper.Root>
    );
    const view = render(steps(false));
    expect(
      within(screen.getByRole('tab', { name: 'B B value' })).getByText('2'),
    ).toBeInTheDocument();
    view.rerender(steps(true));
    expect(
      within(screen.getByRole('tab', { name: 'B B value' })).getByText('1'),
    ).toBeInTheDocument();
  });

  it('moves focus and requests selection in rendered order, wrapping through blocked steps', () => {
    const active$ = new BehaviorSubject('songs');
    const onSelect$ = new Subject<string>();
    const requests: string[] = [];
    onSelect$.subscribe((value) => requests.push(value));
    const scrollIntoView = vi.fn();
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    try {
      render(example(active$, onSelect$));
      const songs = screen.getByRole('tab', { name: 'Songs 2 Songs' });
      const bill = screen.getByRole('tab', { name: 'Bill $1,104' });
      fireEvent.keyDown(songs, { key: 'ArrowLeft' });
      expect(bill).toHaveFocus();
      expect(requests).toEqual(['bill']);
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
      expect(
        screen.getAllByRole('tab').filter((tab) => tab.tabIndex === 0),
      ).toEqual([songs]);
      fireEvent.keyDown(bill, { key: 'ArrowRight' });
      expect(songs).toHaveFocus();
      expect(requests).toEqual(['bill', 'songs']);
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });

  it('replaces and tears down subscriptions without completing consumer streams', () => {
    const first$ = new BehaviorSubject('songs');
    const second$ = new Subject<string>();
    const onSelect$ = new Subject<string>();
    const completed = vi.fn();
    const completion = first$.subscribe({ complete: completed });
    const view = render(example(first$, onSelect$));
    view.rerender(example(second$, onSelect$));
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    act(() => first$.next('bill'));
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    act(() => second$.next('studio'));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Studio choices');
    view.unmount();
    expect(second$.observed).toBe(false);
    completion.unsubscribe();
    expect(first$.observed).toBe(false);
    expect(completed).not.toHaveBeenCalled();
    expect(onSelect$.isStopped).toBe(false);
  });

  it('requests blocked steps without changing selection until the consumer responds', () => {
    const active$ = new BehaviorSubject('songs');
    const onSelect$ = new Subject<string>();
    const requests: string[] = [];
    onSelect$.subscribe((value) => requests.push(value));
    render(example(active$, onSelect$));
    const bill = screen.getByRole('tab', { name: 'Bill $1,104' });
    expect(bill).toHaveAccessibleDescription('Choose dates first');
    fireEvent.click(bill);
    expect(requests).toEqual(['bill']);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Song choices');
    act(() => active$.next('bill'));
    expect(bill).toHaveAttribute('aria-selected', 'true');
    expect(bill).toHaveAccessibleDescription('Choose dates first');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Dates are required',
    );
    expect(bill).toHaveAttribute(
      'aria-controls',
      screen.getByRole('tabpanel').id,
    );
  });
});
