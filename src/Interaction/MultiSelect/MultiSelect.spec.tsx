import { act, fireEvent, render, screen } from '@testing-library/react';
import { MultiSelect } from 'index';
import type { ComponentProps, ReactNode } from 'react';
import { BehaviorSubject, type Observable, ReplaySubject, Subject } from 'rxjs';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

const TOPICS: readonly (readonly [string, string])[] = [
  ['family', 'Family'],
  ['love', 'Love'],
  ['loss', 'Loss'],
  ['hope', 'Hope'],
  ['work', 'Work'],
  ['travel', 'Travel'],
  ['home', 'Home'],
  ['faith', 'Faith'],
  ['youth', 'Youth'],
  ['city', 'City'],
  ['nature', 'Nature'],
  ['protest', 'Protest'],
];

type RootProps = ComponentProps<typeof MultiSelect.Root>;

type Overrides = Partial<Omit<RootProps, 'children'>> & {
  options?: readonly (readonly [string, string])[];
  initial?: readonly string[];
  feedback?: boolean;
  wrap?: (field: ReactNode) => ReactNode;
};

// The controlled wiring every test repeats: a replaying source, an output Subject, a recorder of
// every emitted proposal, and, on request, the consumer feedback that turns proposals into state.
const setup = ({
  options = TOPICS,
  initial = [],
  feedback = false,
  wrap = (field) => field,
  ...overrides
}: Overrides = {}) => {
  const selected$ = new BehaviorSubject<readonly string[]>(initial);
  const onChange$ = new Subject<readonly string[]>();
  const received: (readonly string[])[] = [];
  onChange$.subscribe((next) => received.push(next));
  if (feedback) {
    onChange$.subscribe((next) => selected$.next(next));
  }
  const field = (
    props: Partial<RootProps> = {},
    optionList: readonly (readonly [string, string])[] = options,
  ) => (
    <MultiSelect.Root
      label={'Main topics'}
      selected$={selected$}
      onChange$={onChange$}
      emptyLabel={'No topics'}
      removeLabel={'Remove {label}'}
      clearLabel={'Clear topics'}
      overflowLabel={'+{count}'}
      {...overrides}
      {...props}
    >
      {optionList.map(([value, label]) => (
        <MultiSelect.Option key={value} value={value}>
          {label}
        </MultiSelect.Option>
      ))}
    </MultiSelect.Root>
  );
  const view = render(wrap(field()));
  const rerenderField = (
    props: Partial<RootProps> = {},
    optionList: readonly (readonly [string, string])[] = options,
  ) => view.rerender(wrap(field(props, optionList)));
  return { ...view, selected$, onChange$, received, rerenderField };
};

const trigger = () => screen.getByRole('button', { name: 'Main topics' });
const option = (name: string) => screen.getByRole('checkbox', { name });
const removal = (label: string) =>
  screen.getByRole('button', { name: `Remove ${label}` });
const removals = () => screen.queryAllByRole('button', { name: /^Remove / });
const clear = () => screen.getByRole('button', { name: 'Clear topics' });
const group = () => screen.getByRole('group', { name: 'Main topics' });
const open = () => fireEvent.click(trigger(), { detail: 1 });

// jsdom has no layout, so the chip measurements enter through a controlled boundary: every
// element that asks for its box answers from this table, keyed by what it is.
type Widths = { chip: number; count: number; track: number };

const rect = (width: number, top = 0, height = 0): DOMRect =>
  ({
    width,
    height,
    top,
    bottom: top + height,
    left: 0,
    right: width,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

const stubWidths = (widths: Widths) =>
  vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      if (this.hasAttribute('data-multiselect-chip')) return rect(widths.chip);
      if (this.hasAttribute('data-multiselect-count'))
        return rect(widths.count);
      if (this.hasAttribute('data-multiselect-track'))
        return rect(widths.track);
      return rect(0);
    });

// A ResizeObserver the test drives by hand: the component observes the chip track, and a
// `resize` call stands in for the browser reporting a new width.
const installResizeObserver = () => {
  const callbacks: ResizeObserverCallback[] = [];
  class ControlledResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      callbacks.push(callback);
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', ControlledResizeObserver);
  return {
    resize: () =>
      act(() => {
        for (const callback of callbacks) {
          callback([], {} as ResizeObserver);
        }
      }),
  };
};

describe('MultiSelect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('publishes one closed namespace with curated member props', () => {
    expect(typeof MultiSelect).toBe('object');
    expect(Object.keys(MultiSelect)).toEqual(['Root', 'Option']);
    expectTypeOf<keyof typeof MultiSelect>().toEqualTypeOf<'Root' | 'Option'>();
    expectTypeOf<keyof RootProps>().toEqualTypeOf<
      | 'label'
      | 'selected$'
      | 'onChange$'
      | 'emptyLabel'
      | 'removeLabel'
      | 'clearLabel'
      | 'overflowLabel'
      | 'hint'
      | 'disabled'
      | 'testId'
      | 'children'
    >();
    expectTypeOf<RootProps['selected$']>().toEqualTypeOf<
      Observable<readonly string[]>
    >();
    expectTypeOf<RootProps['onChange$']>().toEqualTypeOf<
      Subject<readonly string[]>
    >();
    expectTypeOf<
      keyof ComponentProps<typeof MultiSelect.Option>
    >().toEqualTypeOf<'value' | 'children' | 'testId'>();
    expectTypeOf<
      ComponentProps<typeof MultiSelect.Option>['children']
    >().toEqualTypeOf<string>();
  });

  it('renders a labelled, collapsed trigger with the empty wording and no chips, clear control or options', () => {
    setup({ hint: 'Combine as many as you like', testId: 'topics' });
    const control = trigger();
    expect(screen.getByLabelText('Main topics')).toBe(control);
    expect(control).toHaveAttribute('type', 'button');
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(control).not.toHaveAttribute('aria-controls');
    expect(control).toHaveAttribute('data-testid', 'topics');
    expect(control).toHaveAccessibleDescription(
      'No topics Combine as many as you like',
    );
    expect(screen.getByText('No topics')).toBeInTheDocument();
    expect(removals()).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Clear topics' })).toBeNull();
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.queryAllByRole('checkbox')).toEqual([]);
  });

  it('renders the latest input emission as removable chips in option order, with a clear control, and emits nothing', () => {
    const { selected$, received } = setup({ initial: ['love', 'family'] });
    expect(
      removals().map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Remove Family', 'Remove Love']);
    expect(screen.queryByText('No topics')).toBeNull();
    expect(clear()).toHaveAttribute('type', 'button');
    act(() => selected$.next(['hope', 'love', 'hope']));
    expect(
      removals().map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Remove Love', 'Remove Hope']);
    act(() => selected$.next([]));
    expect(removals()).toEqual([]);
    expect(screen.getByText('No topics')).toBeInTheDocument();
    expect(received).toEqual([]);
  });

  it('renders empty before a source first emits and restores the current state from a replaying source on remount', () => {
    const late$ = new Subject<readonly string[]>();
    const onChange$ = new Subject<readonly string[]>();
    const field = (selected$: Observable<readonly string[]>) => (
      <MultiSelect.Root
        label={'Main topics'}
        selected$={selected$}
        onChange$={onChange$}
        emptyLabel={'No topics'}
        removeLabel={'Remove {label}'}
        clearLabel={'Clear topics'}
        overflowLabel={'+{count}'}
      >
        <MultiSelect.Option value={'love'}>{'Love'}</MultiSelect.Option>
      </MultiSelect.Root>
    );
    const { unmount } = render(field(late$));
    expect(removals()).toEqual([]);
    act(() => late$.next(['love']));
    expect(removals()).toHaveLength(1);
    unmount();

    const replaying$ = new ReplaySubject<readonly string[]>(1);
    replaying$.next(['love']);
    const remount = render(field(replaying$));
    expect(removals()).toHaveLength(1);
    remount.unmount();
  });

  it('discards the old source on replacement, waits for the new one, and tears down every subscription', () => {
    const { selected$, rerenderField, unmount } = setup({ initial: ['love'] });
    expect(selected$.observed).toBe(true);
    const replacement$ = new Subject<readonly string[]>();
    rerenderField({ selected$: replacement$ });
    expect(selected$.observed).toBe(false);
    expect(removals()).toEqual([]);
    act(() => selected$.next(['family']));
    expect(removals()).toEqual([]);
    act(() => replacement$.next(['family']));
    expect(
      removals().map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Remove Family']);
    unmount();
    expect(replacement$.observed).toBe(false);
  });

  it('opens a named group of checkable options anchored to the trigger without changing the selection', () => {
    const { received } = setup({ initial: ['love'] });
    open();
    const control = trigger();
    const list = group();
    expect(control).toHaveAttribute('aria-expanded', 'true');
    expect(control).toHaveAttribute('aria-controls', list.id);
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    expect(option('Love')).toHaveAttribute('aria-checked', 'true');
    expect(option('Family')).toHaveAttribute('aria-checked', 'false');
    expect(option('Love')).toHaveAttribute('type', 'button');
    fireEvent.click(control, { detail: 1 });
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group')).toBeNull();
    expect(received).toEqual([]);
  });

  it('emits one fresh full proposal per toggle in option order, keeps the dropdown open and never mutates the input', () => {
    const initial = Object.freeze(['love']);
    const { received } = setup({ initial, feedback: true });
    open();
    fireEvent.click(option('Family'));
    expect(received).toEqual([['family', 'love']]);
    expect(option('Family')).toHaveAttribute('aria-checked', 'true');
    expect(group()).toBeInTheDocument();
    fireEvent.click(option('Protest'));
    fireEvent.click(option('Love'));
    expect(received).toEqual([
      ['family', 'love'],
      ['family', 'love', 'protest'],
      ['family', 'protest'],
    ]);
    expect(received[0]).not.toBe(initial);
    expect(initial).toEqual(['love']);
    expect(new Set(received.map((proposal) => proposal)).size).toBe(3);
  });

  it('leaves the selection unchanged while a request is unanswered, so repeated toggles repeat the same proposal', () => {
    const { received } = setup({ initial: ['love'] });
    open();
    fireEvent.click(option('Family'));
    fireEvent.click(option('Family'));
    expect(received).toEqual([
      ['family', 'love'],
      ['family', 'love'],
    ]);
    expect(option('Family')).toHaveAttribute('aria-checked', 'false');
    expect(removals()).toHaveLength(1);
  });

  it('lets a consumer select none, one, several or all options independently through feedback', () => {
    const { selected$ } = setup({ feedback: true });
    open();
    for (const box of screen.getAllByRole('checkbox')) {
      fireEvent.click(box);
    }
    expect(selected$.getValue()).toEqual(TOPICS.map(([value]) => value));
    expect(
      screen
        .getAllByRole('checkbox')
        .every((box) => box.getAttribute('aria-checked') === 'true'),
    ).toBe(true);
    fireEvent.click(option('Love'));
    expect(option('Love')).toHaveAttribute('aria-checked', 'false');
    expect(option('Family')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(clear());
    expect(selected$.getValue()).toEqual([]);
    expect(
      screen
        .getAllByRole('checkbox')
        .every((box) => box.getAttribute('aria-checked') === 'false'),
    ).toBe(true);
  });

  it('removes one chip or clears everything, including hidden selections, without opening or submitting a form', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    const { received } = setup({
      initial: ['family', 'love', 'hope'],
      wrap: (field) => (
        <form aria-label={'Filters'} onSubmit={onSubmit}>
          {field}
        </form>
      ),
    });
    fireEvent.click(removal('Love'));
    expect(received).toEqual([['family', 'hope']]);
    fireEvent.click(clear());
    expect(received).toEqual([['family', 'hope'], []]);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens from the keyboard and focuses the first selected option, or the first option when none is selected', () => {
    const { selected$ } = setup({ initial: ['hope', 'love'] });
    const control = trigger();
    control.focus();
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    expect(group()).toBeInTheDocument();
    expect(option('Love')).toHaveFocus();
    fireEvent.keyDown(control, { key: 'Escape' });
    expect(screen.queryByRole('group')).toBeNull();
    expect(control).toHaveFocus();

    act(() => selected$.next([]));
    fireEvent.click(control);
    expect(option('Family')).toHaveFocus();
    fireEvent.keyDown(option('Family'), { key: 'Escape' });
    expect(control).toHaveFocus();
    fireEvent.click(control);
    expect(group()).toBeInTheDocument();
    fireEvent.click(control);
    expect(screen.queryByRole('group')).toBeNull();
    expect(control).toHaveFocus();
  });

  it('keeps focus on the trigger when a keyboard open finds no options', () => {
    setup({ options: [] });
    const control = trigger();
    control.focus();
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    expect(control).toHaveAttribute('aria-expanded', 'true');
    expect(control).toHaveFocus();
  });

  it('closes when focus leaves the whole control by keyboard and preserves the new destination', () => {
    setup({
      initial: ['love'],
      wrap: (field) => (
        <>
          {field}
          <button type={'button'}>{'Next field'}</button>
        </>
      ),
    });
    open();
    const next = screen.getByRole('button', { name: 'Next field' });
    const love = option('Love');
    love.focus();
    fireEvent.blur(love, { relatedTarget: removal('Love') });
    expect(group()).toBeInTheDocument();
    fireEvent.blur(love, { relatedTarget: next });
    next.focus();
    expect(screen.queryByRole('group')).toBeNull();
    expect(next).toHaveFocus();
  });

  it('closes on an outside pointer interaction without stealing focus from its destination', () => {
    const { received } = setup({
      initial: ['love'],
      wrap: (field) => (
        <>
          {field}
          <p>{'Elsewhere on the page'}</p>
        </>
      ),
    });
    open();
    fireEvent.pointerDown(group());
    expect(group()).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByText('Elsewhere on the page'));
    expect(screen.queryByRole('group')).toBeNull();
    expect(trigger()).not.toHaveFocus();
    expect(received).toEqual([]);
  });

  it('closes on an outside pointer interaction while an option is focused, without a detour through the trigger', () => {
    setup({
      initial: ['love'],
      wrap: (field) => (
        <>
          {field}
          <p>{'Elsewhere on the page'}</p>
        </>
      ),
    });
    open();
    option('Love').focus();
    fireEvent.pointerDown(screen.getByText('Elsewhere on the page'));
    expect(screen.queryByRole('group')).toBeNull();
    expect(trigger()).not.toHaveFocus();
  });

  it('drops an unanswered removal request once focus moves on, so a later change does not move focus', () => {
    const { selected$ } = setup({
      initial: ['family', 'love', 'loss', 'hope'],
    });
    removal('Loss').focus();
    fireEvent.click(removal('Loss'));
    removal('Family').focus();
    act(() => selected$.next(['family', 'love', 'hope']));
    expect(removal('Family')).toHaveFocus();
  });

  it('moves focus after a removal to the next chip removal, then the preceding one, then the trigger', () => {
    setup({ initial: ['family', 'love', 'hope'], feedback: true });
    removal('Love').focus();
    fireEvent.click(removal('Love'));
    expect(removal('Hope')).toHaveFocus();
    fireEvent.click(removal('Hope'));
    expect(removal('Family')).toHaveFocus();
    fireEvent.click(removal('Family'));
    expect(trigger()).toHaveFocus();
  });

  it('returns focus to the trigger when clear-all removes its own control', () => {
    setup({ initial: ['family', 'love'], feedback: true });
    clear().focus();
    fireEvent.click(clear());
    expect(removals()).toEqual([]);
    expect(trigger()).toHaveFocus();
  });

  it('keeps the selection visible while disabled, closes an open surface and permits no change', () => {
    const { received, rerenderField, selected$ } = setup({
      initial: ['love'],
    });
    open();
    expect(group()).toBeInTheDocument();
    rerenderField({ disabled: true });
    expect(screen.queryByRole('group')).toBeNull();
    const control = trigger();
    expect(control).toBeDisabled();
    expect(removal('Love')).toBeDisabled();
    expect(clear()).toBeDisabled();
    fireEvent.click(control);
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    expect(screen.queryByRole('group')).toBeNull();
    fireEvent.click(removal('Love'));
    fireEvent.click(clear());
    expect(received).toEqual([]);
    act(() => selected$.next(['family', 'love']));
    expect(removals()).toHaveLength(2);
  });

  it('updates chips and checks silently on external restore and clear while open, and on consumer reconciliation of removed options', () => {
    const { selected$, received, rerenderField } = setup({
      initial: ['family', 'love'],
    });
    open();
    act(() => selected$.next([]));
    expect(removals()).toEqual([]);
    expect(option('Love')).toHaveAttribute('aria-checked', 'false');
    act(() => selected$.next(['love', 'protest']));
    expect(removals()).toHaveLength(2);
    expect(option('Protest')).toHaveAttribute('aria-checked', 'true');
    expect(group()).toBeInTheDocument();

    rerenderField(
      {},
      TOPICS.filter(([value]) => value !== 'protest'),
    );
    act(() => selected$.next(['love']));
    expect(
      removals().map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Remove Love']);
    expect(screen.queryByRole('checkbox', { name: 'Protest' })).toBeNull();
    expect(received).toEqual([]);
  });

  it('preserves selection by identity through reordering and translation, following the new option order', () => {
    const { rerenderField } = setup({ initial: ['family', 'love'] });
    rerenderField({ label: 'Hauptthemen', removeLabel: '{label} entfernen' }, [
      ['love', 'Liebe'],
      ['hope', 'Hoffnung'],
      ['family', 'Familie'],
    ]);
    expect(
      screen
        .getAllByRole('button', { name: / entfernen$/ })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Liebe entfernen', 'Familie entfernen']);
    fireEvent.click(screen.getByRole('button', { name: 'Hauptthemen' }), {
      detail: 1,
    });
    expect(
      screen.getByRole('group', { name: 'Hauptthemen' }),
    ).toBeInTheDocument();
    expect(option('Liebe')).toHaveAttribute('aria-checked', 'true');
    expect(option('Familie')).toHaveAttribute('aria-checked', 'true');
    expect(option('Hoffnung')).toHaveAttribute('aria-checked', 'false');
  });

  it('shows the leading chips that fit and an accurate count for the rest, whose activation opens the dropdown', () => {
    stubWidths({ chip: 60, count: 30, track: 200 });
    const { received } = setup({
      initial: ['family', 'love', 'hope', 'travel', 'city'],
    });
    // 60 + 4 + 60 + 4 + 30 fits in 200; a third chip does not.
    expect(
      removals().map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Remove Family', 'Remove Love']);
    const count = screen.getByRole('button', { name: '+3' });
    expect(screen.queryByRole('button', { name: 'Remove Hope' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Remove Hope', hidden: true }),
    ).toBeInTheDocument();
    fireEvent.click(count);
    expect(group()).toBeInTheDocument();
    expect(option('City')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(clear());
    expect(received).toEqual([[]]);
  });

  it('recalculates the overflow on width, label and selection changes without changing the selection', () => {
    const widths: Widths = { chip: 60, count: 30, track: 200 };
    stubWidths(widths);
    const { resize } = installResizeObserver();
    const { selected$, received, rerenderField } = setup({
      initial: ['family', 'love', 'hope', 'travel'],
    });
    expect(removals()).toHaveLength(2);
    expect(screen.getByRole('button', { name: '+2' })).toBeInTheDocument();

    widths.track = 400;
    resize();
    expect(removals()).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /^\+/ })).toBeNull();

    widths.track = 100;
    resize();
    expect(removals()).toHaveLength(1);
    expect(screen.getByRole('button', { name: '+3' })).toBeInTheDocument();

    widths.chip = 120;
    rerenderField({ overflowLabel: '{count} weitere' });
    expect(removals()).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: '4 weitere' }),
    ).toBeInTheDocument();

    widths.chip = 60;
    act(() => selected$.next(['family']));
    expect(removals()).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /weitere$/ })).toBeNull();
    expect(received).toEqual([]);
  });

  it('returns focus to the trigger when an overflow recalculation hides the focused chip', () => {
    const widths: Widths = { chip: 60, count: 30, track: 400 };
    stubWidths(widths);
    const { resize } = installResizeObserver();
    setup({ initial: ['family', 'love', 'hope', 'travel'] });
    removal('Travel').focus();
    widths.track = 200;
    resize();
    expect(screen.queryByRole('button', { name: 'Remove Travel' })).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('opens above the control when the viewport below cannot hold the options, capped to the room it has', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        return this.hasAttribute('data-multiselect-field')
          ? rect(300, 700, 40)
          : rect(0);
      },
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 300,
    });
    vi.stubGlobal('innerHeight', 768);
    setup({ initial: ['love'] });
    open();
    const list = group();
    expect(list).toHaveAttribute('data-placement', 'above');
    expect(
      Number.parseFloat(
        list.style.getPropertyValue('--multiselect-surface-max-height'),
      ),
    ).toBeLessThanOrEqual(700);
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  });

  it('opens below the control by default', () => {
    setup({ initial: ['love'] });
    open();
    expect(group()).toHaveAttribute('data-placement', 'below');
  });

  it('throws when an Option is composed outside a Root', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(() =>
      render(<MultiSelect.Option value={'love'}>{'Love'}</MultiSelect.Option>),
    ).toThrow('MultiSelect.Option must be composed inside MultiSelect.Root');
    consoleError.mockRestore();
  });

  it('keeps two controls on one page independent in names, ids and streams', () => {
    const topics$ = new BehaviorSubject<readonly string[]>(['love']);
    const moods$ = new BehaviorSubject<readonly string[]>([]);
    const topicChanges$ = new Subject<readonly string[]>();
    const moodChanges$ = new Subject<readonly string[]>();
    const topicValues: (readonly string[])[] = [];
    const moodValues: (readonly string[])[] = [];
    topicChanges$.subscribe((next) => topicValues.push(next));
    moodChanges$.subscribe((next) => moodValues.push(next));
    render(
      <>
        <MultiSelect.Root
          label={'Main topics'}
          selected$={topics$}
          onChange$={topicChanges$}
          emptyLabel={'No topics'}
          removeLabel={'Remove {label}'}
          clearLabel={'Clear topics'}
          overflowLabel={'+{count}'}
        >
          <MultiSelect.Option value={'love'}>{'Love'}</MultiSelect.Option>
        </MultiSelect.Root>
        <MultiSelect.Root
          label={'Moods'}
          selected$={moods$}
          onChange$={moodChanges$}
          emptyLabel={'No moods'}
          removeLabel={'Remove {label}'}
          clearLabel={'Clear moods'}
          overflowLabel={'+{count}'}
        >
          <MultiSelect.Option value={'calm'}>{'Calm'}</MultiSelect.Option>
        </MultiSelect.Root>
      </>,
    );
    const topics = screen.getByRole('button', { name: 'Main topics' });
    const moods = screen.getByRole('button', { name: 'Moods' });
    expect(topics.id).not.toBe(moods.id);
    fireEvent.click(moods, { detail: 1 });
    expect(screen.getByRole('group', { name: 'Moods' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Main topics' })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }));
    expect(moodValues).toEqual([['calm']]);
    expect(topicValues).toEqual([]);
    expect(topics).toHaveAttribute('aria-expanded', 'false');
  });
});
