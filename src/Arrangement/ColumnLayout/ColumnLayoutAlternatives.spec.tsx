import { Button } from 'Interaction/Button/Button';
import { Tabs } from 'Interaction/Tabs/Tabs';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  type ComponentProps,
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { renderToString } from 'react-dom/server';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ColumnLayout } from './ColumnLayout';
import { ColumnLayoutConfigurationError } from './ColumnLayoutConfigurationError';

// Fit is a browser fact: jsdom lays nothing out, so the spec stands in for the layout engine by
// answering each declaration's fit in preference order, keyed by the Alternatives' testId, and by
// firing the observer. Selection and lifecycle are proven here; real fit lives in the stories.
type Fits = Record<string, readonly boolean[]>;

const installLayout = (initial: Fits) => {
  let fits = initial;
  const callbacks = new Set<ResizeObserverCallback>();
  const observed: Element[] = [];
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const probes = this.parentElement;
      const owner = probes?.parentElement?.getAttribute('data-testid') ?? '';
      const isProbe = probes?.hasAttribute('data-column-layout-fit') === true;
      const index = isProbe ? Array.from(probes.children).indexOf(this) : -1;
      const width = isProbe && fits[owner]?.[index] === false ? 1 : 0;
      return { width, height: 0 } as DOMRect;
    },
  );
  class ControlledResizeObserver {
    private readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(element: Element): void {
      observed.push(element);
      callbacks.add(this.callback);
    }
    unobserve(): void {}
    disconnect(): void {
      observed.length = 0;
      callbacks.delete(this.callback);
    }
  }
  vi.stubGlobal('ResizeObserver', ControlledResizeObserver);
  const notify = (): void => {
    for (const callback of callbacks) {
      callback([], {} as ResizeObserver);
    }
  };
  return {
    set: (next: Fits) => {
      fits = next;
    },
    resize: (next: Fits) => {
      fits = next;
      act(notify);
    },
    // The browser delivers observations outside any React batch; what is on screen when the
    // callback returns is what the next paint shows.
    resizeOutsideReact: (next: Fits) => {
      fits = next;
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', false);
      notify();
    },
    observing: (): number => observed.length,
  };
};

const thresholdOf = (element: HTMLElement | undefined): string =>
  element?.style.getPropertyValue('--column-layout-threshold') ?? '';

const area = (name: string, content: ReactNode = name) => (
  <ColumnLayout.Column key={name} weight={1} minWidth={'--area-min-width'}>
    <section aria-label={name}>{content}</section>
  </ColumnLayout.Column>
);

const areaNames = (): (string | null)[] =>
  screen.queryAllByRole('region').map((region) => region.ariaLabel);

// Three simultaneous areas preferred, then two with a shared surface: the brief's two arrangements,
// with neutral names. `fallback` is the consumer's optional third answer.
const threeThenTwo = (fallback?: ReactNode) => (
  <ColumnLayout.Alternatives fallback={fallback} testId={'layout'}>
    <ColumnLayout.Root>
      {area('Pool')}
      {area('Sides')}
      {area('Release')}
    </ColumnLayout.Root>
    <ColumnLayout.Root>
      {area('Group')}
      {area('Sides')}
    </ColumnLayout.Root>
  </ColumnLayout.Alternatives>
);

// An area with an interaction owner of its own: it subscribes to the consumer's stream while
// mounted, so a subscription that outlives its removal shows as `observed`.
const Subscribed: FunctionComponent<{ source$: Subject<string> }> = ({
  source$,
}) => {
  const [latest, setLatest] = useState('nothing yet');
  useEffect(() => {
    const subscription = source$.subscribe(setLatest);
    return () => subscription.unsubscribe();
  }, [source$]);
  return <output>{latest}</output>;
};

// Local interaction state the library must not carry across a removal.
const Counter: FunctionComponent = () => {
  const [count, setCount] = useState(0);
  return (
    <button type={'button'} onClick={() => setCount(count + 1)}>
      count is {count}
    </button>
  );
};

describe('ColumnLayout.Alternatives', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mounts the first declared arrangement that fits, even when later ones fit too', () => {
    installLayout({ layout: [true, true] });
    render(threeThenTwo());
    expect(areaNames()).toEqual(['Pool', 'Sides', 'Release']);
  });

  it('passes over a preferred arrangement that does not fit and mounts the next that does', () => {
    installLayout({ layout: [false, true] });
    render(threeThenTwo());
    expect(areaNames()).toEqual(['Group', 'Sides']);
  });

  it('keeps the last declared arrangement when none fits and no fallback was supplied', () => {
    installLayout({ layout: [false, false] });
    render(threeThenTwo());
    expect(areaNames()).toEqual(['Group', 'Sides']);
  });

  it('mounts the fallback when none of the alternatives fits', () => {
    installLayout({ layout: [false, false] });
    render(threeThenTwo(<section aria-label={'Everything'}>Fallback</section>));
    expect(areaNames()).toEqual(['Everything']);
  });

  it('leaves the fallback unmounted while any alternative fits', () => {
    installLayout({ layout: [false, true] });
    render(threeThenTwo(<section aria-label={'Everything'}>Fallback</section>));
    expect(areaNames()).toEqual(['Group', 'Sides']);
  });

  it.each([undefined, null, false])(
    'treats a fallback of %s as not supplied, so the last arrangement stays',
    (fallback) => {
      installLayout({ layout: [false, false] });
      render(threeThenTwo(fallback));
      expect(areaNames()).toEqual(['Group', 'Sides']);
    },
  );

  it('follows the available width: a fit change selects again without a rerender from the consumer', () => {
    const layout = installLayout({ layout: [true, true] });
    render(threeThenTwo(<section aria-label={'Everything'}>Fallback</section>));
    layout.resize({ layout: [false, true] });
    expect(areaNames()).toEqual(['Group', 'Sides']);
    layout.resize({ layout: [false, false] });
    expect(areaNames()).toEqual(['Everything']);
    layout.resize({ layout: [true, true] });
    expect(areaNames()).toEqual(['Pool', 'Sides', 'Release']);
  });

  it('selects per instance, so two holders of different widths differ on one page', () => {
    installLayout({ wide: [true, true], narrow: [false, true] });
    const instance = (testId: string) => (
      <ColumnLayout.Alternatives testId={testId}>
        <ColumnLayout.Root>
          {area(`${testId} pool`)}
          {area(`${testId} sides`)}
          {area(`${testId} release`)}
        </ColumnLayout.Root>
        <ColumnLayout.Root>
          {area(`${testId} group`)}
          {area(`${testId} sides`)}
        </ColumnLayout.Root>
      </ColumnLayout.Alternatives>
    );
    render(
      <>
        {instance('wide')}
        {instance('narrow')}
      </>,
    );
    expect(areaNames()).toEqual([
      'wide pool',
      'wide sides',
      'wide release',
      'narrow group',
      'narrow sides',
    ]);
  });

  it('leaves mounted content alone when the width changes without changing the selection', () => {
    const layout = installLayout({ layout: [true, true] });
    const stream$ = new Subject<string>();
    let subscriptions = 0;
    const counted$ = new Subject<string>();
    const subscribe = counted$.subscribe.bind(counted$);
    vi.spyOn(counted$, 'subscribe').mockImplementation((...observer) => {
      subscriptions += 1;
      return subscribe(...(observer as Parameters<typeof subscribe>));
    });
    render(
      <ColumnLayout.Alternatives testId={'layout'}>
        <ColumnLayout.Root>
          {area('Pool', <Subscribed source$={counted$} />)}
          {area('Sides', <input aria-label={'Note'} defaultValue={''} />)}
          {area('Release', <Subscribed source$={stream$} />)}
        </ColumnLayout.Root>
        <ColumnLayout.Root>
          {area('Group')}
          {area('Sides')}
        </ColumnLayout.Root>
      </ColumnLayout.Alternatives>,
    );
    const note = screen.getByRole('textbox', { name: 'Note' });
    note.focus();
    fireEvent.change(note, { target: { value: 'Edited' } });

    layout.resize({ layout: [true, true] });
    layout.resize({ layout: [true, false] });

    expect(screen.getByRole('textbox', { name: 'Note' })).toBe(note);
    expect(note).toHaveFocus();
    expect(note).toHaveValue('Edited');
    expect(subscriptions).toBe(1);
  });

  it('keeps a column mounted across a selection change when both arrangements declare it under one key', () => {
    const layout = installLayout({ layout: [true, true] });
    const sides = area(
      'Sides',
      <input aria-label={'Note'} defaultValue={''} />,
    );
    render(
      <ColumnLayout.Alternatives testId={'layout'}>
        <ColumnLayout.Root>
          {area('Pool')}
          {sides}
          {area('Release')}
        </ColumnLayout.Root>
        <ColumnLayout.Root>
          {area('Group')}
          {sides}
        </ColumnLayout.Root>
      </ColumnLayout.Alternatives>,
    );
    const note = screen.getByRole('textbox', { name: 'Note' });
    note.focus();
    fireEvent.change(note, { target: { value: 'Edited' } });

    layout.resize({ layout: [false, true] });

    expect(areaNames()).toEqual(['Group', 'Sides']);
    expect(screen.getByRole('textbox', { name: 'Note' })).toBe(note);
    expect(note).toHaveFocus();
    expect(note).toHaveValue('Edited');

    layout.resize({ layout: [true, true] });

    expect(areaNames()).toEqual(['Pool', 'Sides', 'Release']);
    expect(screen.getByRole('textbox', { name: 'Note' })).toBe(note);
    expect(note).toHaveFocus();
    expect(note).toHaveValue('Edited');
  });

  it('unmounts content the selected arrangement no longer declares, releasing its subscriptions', () => {
    const layout = installLayout({ layout: [true, true] });
    const pool$ = new Subject<string>();
    render(
      <ColumnLayout.Alternatives testId={'layout'}>
        <ColumnLayout.Root>
          {area('Pool', <Subscribed source$={pool$} />)}
          {area('Sides')}
        </ColumnLayout.Root>
        <ColumnLayout.Root>{area('Sides')}</ColumnLayout.Root>
      </ColumnLayout.Alternatives>,
    );
    expect(pool$.observed).toBe(true);

    layout.resize({ layout: [false, true] });

    expect(screen.queryByRole('region', { name: 'Pool' })).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(pool$.observed).toBe(false);
  });

  it('mounts returning content fresh: no local state, focus or text selection comes back with it', () => {
    const layout = installLayout({ layout: [true, true] });
    render(
      <ColumnLayout.Alternatives testId={'layout'}>
        <ColumnLayout.Root>
          {area('Sides')}
          {area(
            'Release',
            <>
              <input aria-label={'Title'} defaultValue={'Untitled'} />
              <Counter />
            </>,
          )}
        </ColumnLayout.Root>
        <ColumnLayout.Root>{area('Sides')}</ColumnLayout.Root>
      </ColumnLayout.Alternatives>,
    );
    const title = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Title',
    });
    fireEvent.change(title, { target: { value: 'Night drive' } });
    fireEvent.click(screen.getByRole('button', { name: 'count is 0' }));
    title.focus();
    title.setSelectionRange(0, 5);

    layout.resize({ layout: [false, true] });
    layout.resize({ layout: [true, true] });

    const returned = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Title',
    });
    expect(returned).not.toBe(title);
    expect(returned).toHaveValue('Untitled');
    expect(returned).not.toHaveFocus();
    expect(document.body).toHaveFocus();
    expect(returned.selectionEnd).toBe(returned.selectionStart);
    expect(
      screen.getByRole('button', { name: 'count is 0' }),
    ).toBeInTheDocument();
  });

  it('shows a consumer-owned draft again on return, without restoring the interaction around it', () => {
    const layout = installLayout({ layout: [true, true] });
    const Editor: FunctionComponent = () => {
      const [draft, setDraft] = useState('Untitled');
      return (
        <ColumnLayout.Alternatives testId={'layout'}>
          <ColumnLayout.Root>
            {area('Sides')}
            {area(
              'Release',
              <input
                aria-label={'Title'}
                defaultValue={draft}
                onChange={(event) => setDraft(event.target.value)}
              />,
            )}
          </ColumnLayout.Root>
          <ColumnLayout.Root>{area('Sides')}</ColumnLayout.Root>
        </ColumnLayout.Alternatives>
      );
    };
    render(<Editor />);
    const title = screen.getByRole('textbox', { name: 'Title' });
    title.focus();
    fireEvent.change(title, { target: { value: 'Night drive' } });

    layout.resize({ layout: [false, true] });
    layout.resize({ layout: [true, true] });

    const returned = screen.getByRole('textbox', { name: 'Title' });
    expect(returned).not.toBe(title);
    expect(returned).toHaveValue('Night drive');
    expect(returned).not.toHaveFocus();
  });

  it('emits one action per activation whichever arrangement holds the control, and never duplicates its id', () => {
    const layout = installLayout({ layout: [true, true] });
    const place$ = new Subject<void>();
    let placements = 0;
    place$.subscribe(() => {
      placements += 1;
    });
    const sides = area(
      'Sides',
      <>
        <p id={'side-totals'}>Totals</p>
        <Button onClick$={place$}>Place</Button>
      </>,
    );
    render(
      <ColumnLayout.Alternatives testId={'layout'}>
        <ColumnLayout.Root>
          {area('Pool')}
          {sides}
        </ColumnLayout.Root>
        <ColumnLayout.Root>{sides}</ColumnLayout.Root>
      </ColumnLayout.Alternatives>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Place' }));
    expect(placements).toBe(1);

    layout.resize({ layout: [false, true] });

    expect(document.querySelectorAll('#side-totals')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Place' }));
    expect(placements).toBe(2);
  });

  it('leaves the active view to the consumer: regrouping into tabs requests nothing and remembers nothing', () => {
    const layout = installLayout({ layout: [true, true] });
    const select$ = new Subject<string>();
    const requests: string[] = [];
    select$.subscribe((value) => requests.push(value));
    const workspace = (active: string) => (
      <ColumnLayout.Alternatives testId={'layout'}>
        <ColumnLayout.Root>
          {area('Pool')}
          {area('Sides')}
          {area('Release', <input aria-label={'Title'} />)}
        </ColumnLayout.Root>
        <ColumnLayout.Root>
          <ColumnLayout.Column
            key={'Group'}
            weight={1}
            minWidth={'--area-min-width'}
          >
            <Tabs.Root active={active} onSelect$={select$} label={'Work areas'}>
              <Tabs.List>
                <Tabs.Tab value={'pool'}>Pool</Tabs.Tab>
                <Tabs.Tab value={'release'}>Release</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value={'pool'}>Pool content</Tabs.Panel>
              <Tabs.Panel value={'release'}>
                <input aria-label={'Title'} />
              </Tabs.Panel>
            </Tabs.Root>
          </ColumnLayout.Column>
          {area('Sides')}
        </ColumnLayout.Root>
      </ColumnLayout.Alternatives>
    );
    const { rerender } = render(workspace('pool'));
    screen.getByRole('textbox', { name: 'Title' }).focus();

    layout.resize({ layout: [false, true] });

    expect(requests).toEqual([]);
    expect(screen.getByRole('tab', { name: 'Pool' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel', { name: 'Pool' })).toHaveTextContent(
      'Pool content',
    );
    expect(screen.queryByRole('textbox', { name: 'Title' })).toBeNull();
    const release = screen.getByRole('tab', { name: 'Release' });
    expect(
      document.getElementById(release.getAttribute('aria-controls') ?? ''),
    ).toBeEmptyDOMElement();

    fireEvent.click(release);
    expect(requests).toEqual(['release']);
    rerender(workspace('release'));
    layout.resize({ layout: [true, true] });
    layout.resize({ layout: [false, true] });

    expect(requests).toEqual(['release']);
    expect(screen.getByRole('tab', { name: 'Release' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('textbox', { name: 'Title' })).not.toHaveFocus();
  });

  it('accepts arrangements through arrays, fragments and conditionals, in their written order', () => {
    installLayout({ layout: [false, false, true] });
    const withTabs: ReactNode = false;
    const narrower = (
      <>
        <ColumnLayout.Root>{area('Medium')}</ColumnLayout.Root>
        <ColumnLayout.Root>{area('Narrow')}</ColumnLayout.Root>
      </>
    );
    render(
      <ColumnLayout.Alternatives testId={'layout'}>
        {[<ColumnLayout.Root key={'wide'}>{area('Wide')}</ColumnLayout.Root>]}
        {withTabs}
        {narrower}
      </ColumnLayout.Alternatives>,
    );
    expect(areaNames()).toEqual(['Narrow']);
  });

  it('mounts nothing when nothing is declared, and the fallback when only a fallback is', () => {
    installLayout({});
    const { rerender } = render(
      <ColumnLayout.Alternatives testId={'layout'} />,
    );
    expect(screen.getByTestId('layout')).toHaveTextContent('');
    rerender(
      <ColumnLayout.Alternatives
        testId={'layout'}
        fallback={<section aria-label={'Everything'}>Fallback</section>}
      />,
    );
    expect(areaNames()).toEqual(['Everything']);
  });

  it.each([
    ['a host element', <div key={'loose'}>Loose</div>],
    ['text', 'Loose'],
    [
      'a column outside any arrangement',
      <ColumnLayout.Column key={'loose'} weight={1} minWidth={'--loose'} />,
    ],
  ])(
    'rejects %s among the alternatives, since it declares no arrangement',
    (_, loose) => {
      installLayout({ layout: [true] });
      expect(() =>
        render(
          <ColumnLayout.Alternatives testId={'layout'}>
            <ColumnLayout.Root>{area('Sides')}</ColumnLayout.Root>
            {loose}
          </ColumnLayout.Alternatives>,
        ),
      ).toThrow(ColumnLayoutConfigurationError);
    },
  );

  it('rejects an arrangement that reaches it through a wrapping component, since it could not be measured', () => {
    installLayout({ layout: [true] });
    const Wrapped: FunctionComponent = () => (
      <ColumnLayout.Root>{area('Sides')}</ColumnLayout.Root>
    );
    expect(() =>
      render(
        <ColumnLayout.Alternatives testId={'layout'}>
          <Wrapped />
        </ColumnLayout.Alternatives>,
      ),
    ).toThrow(ColumnLayoutConfigurationError);
  });

  it('rejects an arrangement without columns: with no minimum it has no place in the preference', () => {
    installLayout({ layout: [true, true] });
    expect(() =>
      render(
        <ColumnLayout.Alternatives testId={'layout'}>
          <ColumnLayout.Root />
          <ColumnLayout.Root>{area('Sides')}</ColumnLayout.Root>
        </ColumnLayout.Alternatives>,
      ),
    ).toThrow(/alternative 1 declares no columns/);
  });

  it('validates every declaration, including one that is not selected', () => {
    installLayout({ layout: [true, true] });
    expect(() =>
      render(
        <ColumnLayout.Alternatives testId={'layout'}>
          <ColumnLayout.Root>{area('Sides')}</ColumnLayout.Root>
          <ColumnLayout.Root>
            <ColumnLayout.Column
              weight={1}
              minWidth={'20rem' as `--${string}`}
            />
          </ColumnLayout.Root>
        </ColumnLayout.Alternatives>,
      ),
    ).toThrow(ColumnLayoutConfigurationError);
  });

  it('measures each declaration against the threshold its own row switches at, gap role included', () => {
    const layout = installLayout({ layout: [true, true] });
    render(
      <ColumnLayout.Alternatives testId={'layout'}>
        <ColumnLayout.Root testId={'three'}>
          <ColumnLayout.Column weight={2} minWidth={'--pool-min-width'} />
          <ColumnLayout.Column weight={1} minWidth={'--sides-min-width'} />
          <ColumnLayout.Column weight={1} minWidth={'--release-min-width'} />
        </ColumnLayout.Root>
        <ColumnLayout.Root gap={'stack'} testId={'two'}>
          <ColumnLayout.Column weight={1} minWidth={'--group-min-width'} />
          <ColumnLayout.Column weight={1} minWidth={'--sides-min-width'} />
        </ColumnLayout.Root>
      </ColumnLayout.Alternatives>,
    );
    const [three, two] = Array.from(
      screen.getByTestId('layout').firstElementChild?.children ?? [],
    ) as HTMLElement[];
    expect(thresholdOf(three)).toBe(
      'calc(2 * var(--column-layout-gap) + max(var(--pool-min-width) * 2, var(--sides-min-width) * 4, var(--release-min-width) * 4))',
    );
    expect(thresholdOf(three)).toBe(thresholdOf(screen.getByTestId('three')));
    expect(three?.className).toContain(
      '[--column-layout-gap:var(--space-region)]',
    );
    layout.resize({ layout: [false, true] });
    expect(thresholdOf(two)).toBe(
      'calc(1 * var(--column-layout-gap) + max(var(--group-min-width) * 2, var(--sides-min-width) * 2))',
    );
    expect(thresholdOf(two)).toBe(thresholdOf(screen.getByTestId('two')));
    expect(two?.className).toContain(
      '[--column-layout-gap:var(--space-stack)]',
    );
  });

  it('selects again when the declarations change, without waiting for a resize', () => {
    const layout = installLayout({ layout: [true, true] });
    const { rerender } = render(threeThenTwo());
    expect(areaNames()).toEqual(['Pool', 'Sides', 'Release']);
    layout.set({ layout: [false, true] });
    rerender(
      <ColumnLayout.Alternatives testId={'layout'}>
        <ColumnLayout.Root>
          <ColumnLayout.Column weight={1} minWidth={'--wider-min-width'}>
            <section aria-label={'Wider'} />
          </ColumnLayout.Column>
        </ColumnLayout.Root>
        <ColumnLayout.Root>{area('Sides')}</ColumnLayout.Root>
      </ColumnLayout.Alternatives>,
    );
    expect(areaNames()).toEqual(['Sides']);
  });

  it('applies a fit change before the browser paints, not a frame later', () => {
    const layout = installLayout({ layout: [true, true] });
    render(threeThenTwo());
    layout.resizeOutsideReact({ layout: [false, true] });
    expect(areaNames()).toEqual(['Group', 'Sides']);
  });

  it('mounts no arrangement where nothing can be measured yet, such as a server render', () => {
    const markup = renderToString(
      threeThenTwo(<section aria-label={'Everything'}>Fallback</section>),
    );
    expect(markup).not.toContain('aria-label');
  });

  it('selects once where the platform offers no ResizeObserver', () => {
    installLayout({ layout: [false, true] });
    vi.stubGlobal('ResizeObserver', undefined);
    expect(() => render(threeThenTwo())).not.toThrow();
    expect(areaNames()).toEqual(['Group', 'Sides']);
  });

  it('stops observing when it unmounts', () => {
    const layout = installLayout({ layout: [true, true] });
    const { unmount } = render(threeThenTwo());
    expect(layout.observing()).toBe(2);
    unmount();
    expect(layout.observing()).toBe(0);
  });

  it('exposes nothing of its own: no role, no name, no tab stop, and probes hidden from assistive technology', () => {
    installLayout({ layout: [true, true] });
    render(threeThenTwo());
    const root = screen.getByTestId('layout');
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('tabindex');
    expect(root.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(root.firstElementChild).toHaveTextContent('');
    expect(screen.getAllByRole('region')).toHaveLength(3);
  });

  it('offers an opt-in fill mode and a fallback slot, and nothing that takes a measurement', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof ColumnLayout.Alternatives>['fill']>
    >().toEqualTypeOf<boolean>();
    expectTypeOf<
      ComponentProps<typeof ColumnLayout.Alternatives>
    >().toHaveProperty('fallback');
    expectTypeOf<
      keyof ComponentProps<typeof ColumnLayout.Alternatives>
    >().toEqualTypeOf<'fill' | 'fallback' | 'children' | 'testId'>();
  });
});
