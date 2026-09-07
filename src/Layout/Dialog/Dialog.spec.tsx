import { fireEvent, render, screen } from '@testing-library/react';
import {
  type FunctionComponent,
  type ReactNode,
  StrictMode,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Dialog } from './Dialog';
import { DialogCompositionError } from './DialogCompositionError';
import { DialogNamingError } from './DialogNamingError';

// jsdom's HTMLDialogElement is a stub: no showModal, no close, no cancel-on-Escape and no top
// layer. These fakes give the specs the *observable* native contract the component drives - open
// reflects synchronously, close fires `close` as a queued task, exactly the platform's ordering.
// Modal focus containment, background inertness and the real Escape path cannot be faked
// meaningfully and are verified in a real browser instead (see the review report for #107).
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  if (!this.open) {
    return;
  }
  this.removeAttribute('open');
  setTimeout(() => this.dispatchEvent(new Event('close')));
};

// Resolves after the queued close events of the current turn have fired, like the platform's task.
const nativeCloseSettled = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve));

// The one query role cannot express: a closed `<dialog>` is display-none and outside the
// accessibility tree, so the closed states below are reached through the explicit testId hook.
const dialogElement = (): HTMLDialogElement =>
  screen.getByTestId<HTMLDialogElement>('dialog');

const visibleDialog = (): HTMLDialogElement =>
  screen.getByRole<HTMLDialogElement>('dialog');

// The confirmation composition the consumer spec asks for: Cancel before Confirm in DOM order, so
// the least destructive action is the first focusable descendant.
const confirmation = (
  onDismiss$: Subject<void>,
  showDialog$?: Subject<boolean>,
): ReactNode => (
  <Dialog.Root
    onDismiss$={onDismiss$}
    showDialog$={showDialog$}
    testId={'dialog'}
  >
    <Dialog.Title>End employment?</Dialog.Title>
    <Dialog.Description>
      This changes the employee&apos;s assignment.
    </Dialog.Description>
    <Dialog.Actions>
      <button type={'button'}>Cancel</button>
      <button type={'button'}>End employment</button>
    </Dialog.Actions>
  </Dialog.Root>
);

// A stateful child: its count surviving a hide/show cycle proves the Subject drives visibility
// without unmounting the children.
const Counter: FunctionComponent = () => {
  const [count, setCount] = useState(0);
  return (
    <button type={'button'} onClick={() => setCount(count + 1)}>
      count is {count}
    </button>
  );
};

describe('Dialog Component', () => {
  it('renders a native dialog naming itself through the visible title', () => {
    render(confirmation(new Subject<void>()));
    const dialog = screen.getByRole('dialog', { name: 'End employment?' });
    expect(dialog.tagName).toBe('DIALOG');
  });

  it('renders the title as the h1 of the dialog independent task', () => {
    render(confirmation(new Subject<void>()));
    expect(
      screen.getByRole('heading', { level: 1, name: 'End employment?' }),
    ).toBeInTheDocument();
  });

  it('resets the heading context, so the h1 states the task rather than continuing the page ladder', () => {
    render(confirmation(new Subject<void>()));
    expect(visibleDialog()).toHaveAttribute('headingreset');
  });

  it('connects the description independently of the title', () => {
    render(confirmation(new Subject<void>()));
    expect(
      screen.getByRole('dialog', { name: 'End employment?' }),
    ).toHaveAccessibleDescription("This changes the employee's assignment.");
  });

  it('never promotes arbitrary content to the accessible description', () => {
    const onDismiss$ = new Subject<void>();
    render(
      <Dialog.Root onDismiss$={onDismiss$} testId={'dialog'}>
        <Dialog.Title>Choose a plan</Dialog.Title>
        <Dialog.Content>A whole form of block content</Dialog.Content>
        <Dialog.Actions>
          <button type={'button'}>Close</button>
        </Dialog.Actions>
      </Dialog.Root>,
    );
    expect(screen.getByRole('dialog')).not.toHaveAccessibleDescription();
  });

  it('names an intentionally titleless dialog through ariaLabel', () => {
    const onDismiss$ = new Subject<void>();
    render(
      <Dialog.Root
        onDismiss$={onDismiss$}
        ariaLabel={'Sign in'}
        testId={'dialog'}
      >
        <Dialog.Content>Form content</Dialog.Content>
        <Dialog.Actions>
          <button type={'button'}>Close</button>
        </Dialog.Actions>
      </Dialog.Root>,
    );
    expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('writes no naming or description reference to an absent member, keeping every idref resolvable', () => {
    // An aria-labelledby or aria-describedby pointing at nothing is an ARIA authoring error that
    // audit tooling flags: absent members must mean absent references, not dangling ones.
    const onDismiss$ = new Subject<void>();
    render(
      <Dialog.Root
        onDismiss$={onDismiss$}
        ariaLabel={'Sign in'}
        testId={'dialog'}
      >
        <Dialog.Actions>
          <button type={'button'}>Close</button>
        </Dialog.Actions>
      </Dialog.Root>,
    );
    const dialog = visibleDialog();
    expect(dialog).not.toHaveAttribute('aria-labelledby');
    expect(dialog).not.toHaveAttribute('aria-describedby');
  });

  it('rejects a second naming source, loud and early', () => {
    // Exactly one of visible Title or ariaLabel - both is an invariant violation, not a state.
    const onDismiss$ = new Subject<void>();
    expect(() =>
      render(
        <Dialog.Root onDismiss$={onDismiss$} ariaLabel={'End employment'}>
          <Dialog.Title>End employment?</Dialog.Title>
          <Dialog.Actions>
            <button type={'button'}>Cancel</button>
          </Dialog.Actions>
        </Dialog.Root>,
      ),
    ).toThrowError(DialogNamingError);
  });

  it.each([
    ['Title', <Dialog.Title key={'t'}>t</Dialog.Title>],
    ['Description', <Dialog.Description key={'d'}>d</Dialog.Description>],
    ['Content', <Dialog.Content key={'c'}>c</Dialog.Content>],
    ['Actions', <Dialog.Actions key={'a'}>a</Dialog.Actions>],
  ])('throws when %s is composed outside Dialog.Root', (_member, jsx) => {
    expect(() => render(jsx)).toThrowError(DialogCompositionError);
  });

  it('preserves the consumer DOM order of the regions and of the action controls', () => {
    render(confirmation(new Subject<void>()));
    const text = visibleDialog().textContent ?? '';
    expect(text.indexOf('End employment?')).toBeLessThan(
      text.indexOf('This changes'),
    );
    const actions = screen.getAllByRole('button');
    expect(actions.map((control) => control.textContent)).toEqual([
      'Cancel',
      'End employment',
    ]);
  });

  it('opens on mount when no visibility Subject is supplied', () => {
    render(confirmation(new Subject<void>()));
    expect(visibleDialog().open).toBe(true);
  });

  it('performs no action by opening: dismissal has not been reported', () => {
    const onDismiss$ = new Subject<void>();
    const dismissals: number[] = [];
    onDismiss$.subscribe(() => dismissals.push(1));
    render(confirmation(onDismiss$));
    expect(dismissals).toEqual([]);
  });

  it('starts closed until the first emission when a visibility Subject is supplied', () => {
    render(confirmation(new Subject<void>(), new Subject<boolean>()));
    expect(dialogElement().open).toBe(false);
  });

  it('follows the Subject booleans without unmounting its children', () => {
    const showDialog$ = new Subject<boolean>();
    render(
      <Dialog.Root
        onDismiss$={new Subject<void>()}
        showDialog$={showDialog$}
        testId={'dialog'}
      >
        <Dialog.Title>Counter</Dialog.Title>
        <Dialog.Actions>
          <Counter />
        </Dialog.Actions>
      </Dialog.Root>,
    );
    showDialog$.next(true);
    fireEvent.click(screen.getByRole('button', { name: /count is/ }));
    expect(
      screen.getByRole('button', { name: 'count is 1' }),
    ).toBeInTheDocument();

    showDialog$.next(false);
    expect(dialogElement().open).toBe(false);

    showDialog$.next(true);
    expect(visibleDialog().open).toBe(true);
    // The count survived the hide: the children were never unmounted.
    expect(
      screen.getByRole('button', { name: 'count is 1' }),
    ).toBeInTheDocument();
  });

  it('hides on a consumer-emitted false without reporting a dismissal', async () => {
    const onDismiss$ = new Subject<void>();
    const showDialog$ = new Subject<boolean>();
    const dismissals: number[] = [];
    onDismiss$.subscribe(() => dismissals.push(1));
    render(confirmation(onDismiss$, showDialog$));
    showDialog$.next(true);

    showDialog$.next(false);
    await nativeCloseSettled();

    expect(dialogElement().open).toBe(false);
    expect(dismissals).toEqual([]);
  });

  it('resets to closed when the Subject instance is replaced, and stops observing the old one', async () => {
    const onDismiss$ = new Subject<void>();
    const first = new Subject<boolean>();
    const second = new Subject<boolean>();
    const { rerender } = render(confirmation(onDismiss$, first));
    first.next(true);
    expect(visibleDialog().open).toBe(true);

    rerender(confirmation(onDismiss$, second));
    await nativeCloseSettled();

    expect(dialogElement().open).toBe(false);
    expect(first.observed).toBe(false);
    first.next(true);
    expect(dialogElement().open).toBe(false);
    second.next(true);
    expect(visibleDialog().open).toBe(true);
  });

  it('owns its subscription teardown on unmount and never completes the consumer Subject', () => {
    const showDialog$ = new Subject<boolean>();
    const { unmount } = render(confirmation(new Subject<void>(), showDialog$));
    unmount();
    expect(showDialog$.observed).toBe(false);
    expect(showDialog$.isStopped).toBe(false);
  });

  it('reports Escape as a dismissal first, then a false visibility transition - never a true one', () => {
    const onDismiss$ = new Subject<void>();
    const showDialog$ = new Subject<boolean>();
    const events: string[] = [];
    render(confirmation(onDismiss$, showDialog$));
    onDismiss$.subscribe(() => events.push('dismiss'));
    showDialog$.subscribe((visible) => events.push(`show:${visible}`));
    showDialog$.next(true);

    // The browser reports Escape on a modal dialog as a `cancel` event; jsdom has no such default,
    // so the event is dispatched directly at the seam the platform owns.
    const dialog = visibleDialog();
    fireEvent(dialog, new Event('cancel', { cancelable: true }));

    expect(events).toEqual(['show:true', 'dismiss', 'show:false']);
    expect(dialog.open).toBe(false);
  });

  it('reports Escape as a dismissal and ends the presentation in mount-open mode', () => {
    const onDismiss$ = new Subject<void>();
    const dismissals: number[] = [];
    onDismiss$.subscribe(() => dismissals.push(1));
    render(confirmation(onDismiss$));

    const dialog = visibleDialog();
    fireEvent(dialog, new Event('cancel', { cancelable: true }));

    expect(dismissals).toEqual([1]);
    expect(dialog.open).toBe(false);
  });

  it('reports a Scrim interaction as a dismissal', () => {
    const onDismiss$ = new Subject<void>();
    const showDialog$ = new Subject<boolean>();
    const events: string[] = [];
    render(confirmation(onDismiss$, showDialog$));
    onDismiss$.subscribe(() => events.push('dismiss'));
    showDialog$.subscribe((visible) => events.push(`show:${visible}`));
    showDialog$.next(true);
    const dialog = visibleDialog();
    // A backdrop click targets the dialog element itself at coordinates outside its box; jsdom
    // lays nothing out, so the box is stated explicitly.
    dialog.getBoundingClientRect = () =>
      ({ left: 100, top: 100, right: 500, bottom: 400 }) as DOMRect;

    fireEvent.click(dialog, { clientX: 10, clientY: 10 });

    expect(events).toEqual(['show:true', 'dismiss', 'show:false']);
    expect(dialog.open).toBe(false);
  });

  it('does not dismiss on a click landing on the dialog surface itself', () => {
    // A click in the dialog's own padding also targets the dialog element; only coordinates
    // outside the box are the Scrim.
    const onDismiss$ = new Subject<void>();
    const dismissals: number[] = [];
    onDismiss$.subscribe(() => dismissals.push(1));
    render(confirmation(onDismiss$));
    const dialog = visibleDialog();
    dialog.getBoundingClientRect = () =>
      ({ left: 100, top: 100, right: 500, bottom: 400 }) as DOMRect;

    fireEvent.click(dialog, { clientX: 300, clientY: 200 });

    expect(dismissals).toEqual([]);
    expect(dialog.open).toBe(true);
  });

  it('does not dismiss on a click on content inside the dialog', () => {
    const onDismiss$ = new Subject<void>();
    const dismissals: number[] = [];
    onDismiss$.subscribe(() => dismissals.push(1));
    render(confirmation(onDismiss$));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(dismissals).toEqual([]);
    expect(visibleDialog().open).toBe(true);
  });

  it('synchronizes the visibility Subject to false when another native mechanism closes the element, without inventing a dismissal', async () => {
    const onDismiss$ = new Subject<void>();
    const showDialog$ = new Subject<boolean>();
    const events: string[] = [];
    render(confirmation(onDismiss$, showDialog$));
    onDismiss$.subscribe(() => events.push('dismiss'));
    showDialog$.subscribe((visible) => events.push(`show:${visible}`));
    showDialog$.next(true);

    // A form with method="dialog", or any other platform path, closes the element directly.
    visibleDialog().close();
    await nativeCloseSettled();

    expect(events).toEqual(['show:true', 'show:false']);
  });

  it('ignores the stale close event when a new presentation began before it fired', async () => {
    // The platform queues the close event, so a rapid false-then-true reopens the element before
    // the event lands; acting on it would emit false into the new presentation and steal focus.
    const onDismiss$ = new Subject<void>();
    const showDialog$ = new Subject<boolean>();
    const events: string[] = [];
    render(confirmation(onDismiss$, showDialog$));
    showDialog$.subscribe((visible) => events.push(`show:${visible}`));

    showDialog$.next(true);
    showDialog$.next(false);
    showDialog$.next(true);
    await nativeCloseSettled();

    expect(visibleDialog().open).toBe(true);
    expect(events).toEqual(['show:true', 'show:false', 'show:true']);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('ignores the stale close event of a replaced Subject whose successor opened immediately', async () => {
    const onDismiss$ = new Subject<void>();
    const first = new Subject<boolean>();
    const second = new Subject<boolean>();
    const { rerender } = render(confirmation(onDismiss$, first));
    first.next(true);
    const events: string[] = [];
    second.subscribe((visible) => events.push(`show:${visible}`));

    rerender(confirmation(onDismiss$, second));
    second.next(true);
    await nativeCloseSettled();

    expect(visibleDialog().open).toBe(true);
    expect(events).toEqual(['show:true']);
  });

  it('stays open through StrictMode double-invoked effects in mount-open mode', async () => {
    // StrictMode mounts, cleans up and mounts again: the cleanup's queued close event must count
    // as stale once the second mount has reopened the element.
    const onDismiss$ = new Subject<void>();
    const dismissals: number[] = [];
    onDismiss$.subscribe(() => dismissals.push(1));
    render(<StrictMode>{confirmation(onDismiss$)}</StrictMode>);
    await nativeCloseSettled();

    expect(visibleDialog().open).toBe(true);
    expect(dismissals).toEqual([]);
  });

  it('moves focus to the first focusable descendant on opening, so Cancel-first compositions focus Cancel', () => {
    const showDialog$ = new Subject<boolean>();
    render(confirmation(new Subject<void>(), showDialog$));
    showDialog$.next(true);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('returns focus to the opener when the presentation ends and the opener is still connected', async () => {
    const showDialog$ = new Subject<boolean>();
    render(
      <>
        <button type={'button'}>Open</button>
        {confirmation(new Subject<void>(), showDialog$)}
      </>,
    );
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    showDialog$.next(true);
    expect(opener).not.toHaveFocus();

    showDialog$.next(false);
    await nativeCloseSettled();

    expect(opener).toHaveFocus();
  });

  it('does not restore focus to an opener that stopped being focusable', async () => {
    // Connected but disabled: the contract restores only a connected, focusable opener and
    // invents no fallback for anything else.
    const showDialog$ = new Subject<boolean>();
    render(
      <>
        <button type={'button'}>Open</button>
        {confirmation(new Subject<void>(), showDialog$)}
      </>,
    );
    const opener = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Open',
    });
    opener.focus();
    showDialog$.next(true);
    opener.disabled = true;

    showDialog$.next(false);
    await nativeCloseSettled();

    expect(opener).not.toHaveFocus();
  });

  it('captures no opener when nothing was focused on opening, so closing never focuses body', async () => {
    render(confirmation(new Subject<void>()));
    const dialog = visibleDialog();
    screen.getByRole('button', { name: 'Cancel' }).focus();

    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    await nativeCloseSettled();

    expect(document.body).not.toHaveFocus();
  });

  it('leaves the consumer-owned completion focus alone when confirmation removed the opener', async () => {
    // With the opener gone the component invents no fallback; the consumer focuses its own stable
    // destination and the Dialog must not fight it.
    const showDialog$ = new Subject<boolean>();
    const Harness: FunctionComponent = () => {
      const [hasOpener, setHasOpener] = useState(true);
      return (
        <>
          {hasOpener && <button type={'button'}>Open</button>}
          <h2 tabIndex={-1}>Staff</h2>
          <button type={'button'} onClick={() => setHasOpener(false)}>
            Remove opener
          </button>
          {confirmation(new Subject<void>(), showDialog$)}
        </>
      );
    };
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    showDialog$.next(true);
    fireEvent.click(screen.getByRole('button', { name: 'Remove opener' }));

    showDialog$.next(false);
    const destination = screen.getByRole('heading', { name: 'Staff' });
    destination.focus();
    // The queued close event lands after the consumer already moved on; it must not steal this.
    await nativeCloseSettled();

    expect(destination).toHaveFocus();
  });

  it('exposes the explicit testId hook on every member', () => {
    const onDismiss$ = new Subject<void>();
    render(
      <Dialog.Root onDismiss$={onDismiss$} testId={'root'}>
        <Dialog.Title testId={'title'}>Title</Dialog.Title>
        <Dialog.Description testId={'description'}>Words</Dialog.Description>
        <Dialog.Content testId={'content'}>Body</Dialog.Content>
        <Dialog.Actions testId={'actions'}>
          <button type={'button'}>Close</button>
        </Dialog.Actions>
      </Dialog.Root>,
    );
    for (const id of ['root', 'title', 'description', 'content', 'actions']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });
});
