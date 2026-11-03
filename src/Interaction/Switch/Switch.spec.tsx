import { act, fireEvent, render, screen } from '@testing-library/react';
import { Switch } from 'index';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

describe('Switch', () => {
  it('replaces subscriptions, resets a silent replacement to off, and leaves stream lifetime to the consumer', () => {
    const original$ = new BehaviorSubject(true);
    const replacement$ = new Subject<boolean>();
    const onChange$ = new Subject<boolean>();
    const { rerender, unmount } = render(
      <Switch label="Unread only" checked$={original$} onChange$={onChange$} />,
    );
    expect(original$.observed).toBe(true);
    rerender(
      <Switch
        label="Unread only"
        checked$={replacement$}
        onChange$={onChange$}
      />,
    );
    expect(original$.observed).toBe(false);
    expect(screen.getByRole('switch')).not.toBeChecked();
    act(() => original$.next(true));
    expect(screen.getByRole('switch')).not.toBeChecked();
    act(() => replacement$.next(true));
    expect(screen.getByRole('switch')).toBeChecked();
    unmount();
    expect(replacement$.observed).toBe(false);
    expect(original$.isStopped).toBe(false);
    expect(replacement$.isStopped).toBe(false);
    expect(onChange$.isStopped).toBe(false);
  });

  it('accepts an Observable input and releases its subscription on unmount', () => {
    let released = false;
    const checked$ = new Observable<boolean>((subscriber) => {
      subscriber.next(true);
      return () => {
        released = true;
      };
    });
    const { unmount } = render(
      <Switch
        label="Unread only"
        checked$={checked$}
        onChange$={new Subject<boolean>()}
      />,
    );
    expect(screen.getByRole('switch')).toBeChecked();
    unmount();
    expect(released).toBe(true);
  });

  it('uses the current output after replacement and supports synchronous consumer feedback', () => {
    const checked$ = new BehaviorSubject(false);
    const original$ = new Subject<boolean>();
    const replacement$ = new Subject<boolean>();
    const requests: boolean[] = [];
    original$.subscribe((value) => requests.push(value));
    replacement$.subscribe((value) => checked$.next(value));
    const { rerender } = render(
      <Switch label="Unread only" checked$={checked$} onChange$={original$} />,
    );
    rerender(
      <Switch
        label="Unread only"
        checked$={checked$}
        onChange$={replacement$}
      />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toBeChecked();
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(requests).toEqual([]);
    expect(replacement$.observed).toBe(true);
  });

  it('keeps disabled state visible and emits nothing when activated', () => {
    const onChange$ = new Subject<boolean>();
    const requests: boolean[] = [];
    onChange$.subscribe((value) => requests.push(value));
    render(
      <Switch
        label="Unread only"
        checked$={new BehaviorSubject(true)}
        onChange$={onChange$}
        disabled
        testId="filter"
      />,
    );
    const control = screen.getByRole('switch');
    expect(control).toBeDisabled();
    expect(control).toBeChecked();
    expect(control).toHaveAttribute('data-testid', 'filter');
    fireEvent.click(control);
    expect(requests).toEqual([]);
  });
  it('shows initial and external state and only requests changes until the consumer answers', () => {
    const checked$ = new BehaviorSubject(true);
    const onChange$ = new Subject<boolean>();
    const requests: boolean[] = [];
    onChange$.subscribe((value) => requests.push(value));
    render(
      <Switch label="Unread only" checked$={checked$} onChange$={onChange$} />,
    );
    const control = screen.getByRole('switch', { checked: true });
    fireEvent.click(control);
    fireEvent.click(control);
    expect(requests).toEqual([false, false]);
    expect(control).toBeChecked();
    act(() => checked$.next(false));
    expect(control).not.toBeChecked();
    fireEvent.click(control);
    expect(requests).toEqual([false, false, true]);
    expect(control).not.toBeChecked();
  });
  it('announces its visible consumer label and starts off before the input emits', () => {
    render(
      <Switch
        label="Unread only"
        checked$={new Subject<boolean>()}
        onChange$={new Subject<boolean>()}
      />,
    );
    const control = screen.getByRole('switch', {
      name: 'Unread only',
      checked: false,
    });
    expect(control).toHaveTextContent('Unread only');
    expect(control).toHaveAttribute('type', 'button');
    expect(control.tabIndex).toBe(0);
  });
});
