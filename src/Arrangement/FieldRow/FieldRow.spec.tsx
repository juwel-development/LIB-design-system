import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import { Select } from 'Interaction/Select/Select';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FieldRow } from './FieldRow';
import { FieldRowCompositionError } from './FieldRowCompositionError';
import { FieldRowConfigurationError } from './FieldRowConfigurationError';

// A geometry the test states and the component measures, per item by test id: its row's top,
// its labelled control's bottom edge below the content top, where the whole box ends when that
// differs, and where a `data-box` positioned ancestor ends. jsdom lays nothing out, so the stub
// is the browser's line layout, stated rather than computed.
type Geometry = Record<
  string,
  {
    top: number;
    controlBottom: number;
    boxBottom?: number;
    positionedBoxBottom?: number;
  }
>;

const bounds = (top: number, bottom: number): DOMRect =>
  ({
    top,
    bottom,
    height: bottom - top,
    width: 0,
    left: 0,
    right: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

const stubGeometry = (geometry: Geometry) =>
  vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      const item = this.closest('[data-field-row-item]');
      const entry = item && geometry[item.getAttribute('data-testid') ?? ''];
      if (!item || !entry) {
        return bounds(0, 0);
      }
      const isBox = this === item || this.parentElement === item;
      const bottom = isBox
        ? (entry.boxBottom ?? entry.controlBottom)
        : this.hasAttribute('data-box')
          ? (entry.positionedBoxBottom ?? entry.controlBottom)
          : entry.controlBottom;
      return bounds(entry.top, entry.top + bottom);
    });

const installResizeObserver = () => {
  const callbacks: ResizeObserverCallback[] = [];
  const observed: Element[] = [];
  class ControlledResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      callbacks.push(callback);
    }
    observe(element: Element): void {
      observed.push(element);
    }
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', ControlledResizeObserver);
  return {
    observed,
    resize: () =>
      act(() => {
        for (const callback of callbacks) {
          callback([], {} as ResizeObserver);
        }
      }),
  };
};

const paddingOf = (testId: string): number =>
  Number.parseFloat(screen.getByTestId(testId).style.paddingTop || '0');

describe('FieldRow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderFilter = (
    options: { weight?: number; gap?: 'stack' | 'region' } = {},
  ) =>
    render(
      <FieldRow.Root gap={options.gap} testId={'row'}>
        <FieldRow.Field
          weight={options.weight}
          minWidth={'--search-min-width'}
          testId={'search'}
        >
          <Input name={'search'} label={'Name'} testId={'search-control'} />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--region-min-width'} testId={'region'}>
          <Select.Root
            name={'region'}
            label={'Region'}
            placeholder={'Any'}
            testId={'region-control'}
          >
            <Select.Option value={'eu'}>Europe</Select.Option>
          </Select.Root>
        </FieldRow.Field>
        <FieldRow.Actions testId={'actions'}>
          <Button>Apply</Button>
          <Button variant={'secondary'}>Reset</Button>
        </FieldRow.Actions>
      </FieldRow.Root>,
    );

  it('renders a plain container that claims no landmark, no form and no role of its own', () => {
    const { container } = renderFilter();
    const root = screen.getByTestId('row');
    expect(root.tagName).toBe('DIV');
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('aria-label');
    expect(container.querySelector('form, nav, section, fieldset')).toBeNull();
  });

  it('keeps the fields and then the actions in content order, so reading and keyboard order follow it', () => {
    renderFilter();
    const root = screen.getByTestId('row');
    expect(Array.from(root.children)).toEqual([
      screen.getByTestId('search'),
      screen.getByTestId('region'),
      screen.getByTestId('actions'),
    ]);
    const focusable = root.querySelectorAll('input, select, button');
    expect(Array.from(focusable).map((element) => element.tagName)).toEqual([
      'INPUT',
      'SELECT',
      'BUTTON',
      'BUTTON',
    ]);
  });

  it('leaves each field to own its label, control and messages, rendering it unmodified inside the item', () => {
    render(
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--search-min-width'} testId={'search'}>
          <Input
            name={'search'}
            label={'Name'}
            hint={'Partial names match'}
            invalid={true}
            errorMessage={'Enter a name'}
            optionalLabel={'optional'}
          />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    const control = screen.getByLabelText('Name');
    expect(control).toHaveAccessibleDescription(
      'Partial names match Enter a name',
    );
    expect(screen.getByText('optional')).toBeInTheDocument();
    expect(screen.getByTestId('search')).toContainElement(control);
  });

  it('weights fields equally by default, so a row divides its width evenly among them', () => {
    renderFilter();
    expect(screen.getByTestId('search').style.flexGrow).toBe('1');
    expect(screen.getByTestId('region').style.flexGrow).toBe('1');
  });

  it('grows a weighted field in proportion to its weight, including a fractional one', () => {
    const { rerender } = renderFilter({ weight: 2 });
    expect(screen.getByTestId('search').style.flexGrow).toBe('2');
    rerender(
      <FieldRow.Root testId={'row'}>
        <FieldRow.Field
          weight={0.5}
          minWidth={'--search-min-width'}
          testId={'search'}
        >
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    expect(screen.getByTestId('search').style.flexGrow).toBe('0.5');
  });

  it('shares a row from nothing rather than from a base width, so the proportion is of the whole row', () => {
    renderFilter({ weight: 2 });
    const utilities = screen.getByTestId('search').className.split(/\s+/);
    expect(utilities).toContain('basis-0');
    expect(utilities).toContain('shrink');
    expect(screen.getByTestId('search').style.flexBasis).toBe('');
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['infinite', Number.POSITIVE_INFINITY],
    ['not a number', Number.NaN],
  ])(
    'throws for a %s weight, since a share of nothing cannot be laid out',
    (_case, weight) => {
      expect(() =>
        render(
          <FieldRow.Root>
            <FieldRow.Field weight={weight} minWidth={'--search-min-width'}>
              <Input name={'search'} label={'Name'} />
            </FieldRow.Field>
          </FieldRow.Root>,
        ),
      ).toThrowError(FieldRowConfigurationError);
    },
  );

  it('reads the minimum width from the named theme token, yielding to the holder when the field is alone and narrower', () => {
    renderFilter();
    expect(screen.getByTestId('search').style.minWidth).toBe(
      'min(var(--search-min-width), 100%)',
    );
  });

  it.each([
    ['a literal length', '16rem'],
    ['a var() expression', 'var(--search-min-width)'],
    ['a CSS expression', 'calc(--search-min-width + 1rem)'],
    ['a name with a space', '--search min'],
    ['a name that closes a function', '--search)'],
    ['a bare dashes prefix', '--'],
    ['a single-dash name', '-search'],
  ])(
    'throws for %s as a minimum width, accepting token names only',
    (_case, minWidth) => {
      expect(() =>
        render(
          <FieldRow.Root>
            {/* @ts-expect-error - the type refuses it as well; the runtime guard is what is under test. */}
            <FieldRow.Field minWidth={minWidth}>
              <Input name={'search'} label={'Name'} />
            </FieldRow.Field>
          </FieldRow.Root>,
        ),
      ).toThrowError(FieldRowConfigurationError);
    },
  );

  it('gives the actions their content width and no share of the row', () => {
    renderFilter();
    const actions = screen.getByTestId('actions');
    expect(actions.style.flexGrow).toBe('');
    expect(actions.className.split(/\s+/)).toContain('flex-none');
  });

  it('separates items along a row on the sibling role by default and on the region role when asked', () => {
    const { rerender } = renderFilter();
    const utilities = () => screen.getByTestId('row').className.split(/\s+/);
    expect(utilities()).toContain('gap-x-[var(--space-stack)]');
    expect(utilities()).not.toContain('gap-x-[var(--space-region)]');
    rerender(
      <FieldRow.Root gap={'region'} testId={'row'}>
        <FieldRow.Field minWidth={'--search-min-width'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    expect(utilities()).toContain('gap-x-[var(--space-region)]');
    expect(utilities()).not.toContain('gap-x-[var(--space-stack)]');
  });

  it('fixes the gap between wrapped rows and between the actions to the sibling role, whichever row gap is chosen', () => {
    for (const gap of ['stack', 'region'] as const) {
      const { unmount } = renderFilter({ gap });
      expect(screen.getByTestId('row').className.split(/\s+/)).toContain(
        'gap-y-[var(--space-stack)]',
      );
      const group = screen.getByTestId('actions').firstElementChild;
      expect(group?.className.split(/\s+/)).toContain(
        'gap-[var(--space-stack)]',
      );
      expect(group?.className.split(/\s+/)).toContain('flex-wrap');
      unmount();
    }
  });

  it('pads each item on a row so every control bottom meets the deepest one, leaving taller controls their height', () => {
    stubGeometry({
      search: { top: 0, controlBottom: 58 },
      region: { top: 0, controlBottom: 82 },
      actions: { top: 0, controlBottom: 40 },
    });
    renderFilter();
    expect(paddingOf('search')).toBe(24);
    expect(paddingOf('region')).toBe(0);
    expect(paddingOf('actions')).toBe(42);
  });

  it('aligns a wrapped row on its own line, so a row never answers to the row above it', () => {
    stubGeometry({
      search: { top: 0, controlBottom: 58 },
      region: { top: 0, controlBottom: 82 },
      actions: { top: 140, controlBottom: 40 },
    });
    renderFilter();
    expect(paddingOf('search')).toBe(24);
    expect(paddingOf('actions')).toBe(0);
  });

  it('measures the control a field labels, never the field box, so a hint or error below adds no padding', () => {
    // The first field's box reaches to the bottom of its error message; only the labelled
    // control's edge is the alignment line, and both controls already share it.
    stubGeometry({
      search: { top: 0, controlBottom: 58, boxBottom: 100 },
      region: { top: 0, controlBottom: 58 },
    });
    render(
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--search-min-width'} testId={'search'}>
          <Input
            name={'search'}
            label={'Name'}
            invalid={true}
            errorMessage={'Enter a name'}
          />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--region-min-width'} testId={'region'}>
          <Input name={'region'} label={'Region'} />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    expect(paddingOf('search')).toBe(0);
    expect(paddingOf('region')).toBe(0);
  });

  it('measures an absolutely positioned control by the box it fills, so a trigger spanning its field aligns on the field border', () => {
    // MultiSelect's labelled trigger spans the field box inside its border; the border is the
    // edge a viewer sees. The stub hands the positioned box a deeper bottom than the trigger.
    stubGeometry({
      tags: {
        top: 0,
        controlBottom: 58,
        boxBottom: 100,
        positionedBoxBottom: 60,
      },
      region: { top: 0, controlBottom: 58, boxBottom: 100 },
    });
    render(
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--tags-min-width'} testId={'tags'}>
          <div>
            <label htmlFor={'tags-trigger'}>Tags</label>
            <div data-box style={{ position: 'relative' }}>
              <button
                type={'button'}
                id={'tags-trigger'}
                style={{ position: 'absolute' }}
              >
                Any tag
              </button>
            </div>
          </div>
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--region-min-width'} testId={'region'}>
          <Input name={'region'} label={'Region'} />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    expect(paddingOf('tags')).toBe(0);
    expect(paddingOf('region')).toBe(2);
  });

  it('falls back to the box bottom for a child that labels no control, so an unlabelled item still sits on the line', () => {
    stubGeometry({
      note: { top: 0, controlBottom: 30, boxBottom: 30 },
      region: { top: 0, controlBottom: 58 },
    });
    render(
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--note-min-width'} testId={'note'}>
          <span>Matches 12 labels</span>
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--region-min-width'} testId={'region'}>
          <Input name={'region'} label={'Region'} />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    expect(paddingOf('note')).toBe(28);
    expect(paddingOf('region')).toBe(0);
  });

  it('observes the label as well as the content, so a label that grows while a message goes still moves the control', () => {
    const { observed } = installResizeObserver();
    stubGeometry({ search: { top: 0, controlBottom: 58 } });
    render(
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--search-min-width'} testId={'search'}>
          <Input name={'search'} label={'Name'} hint={'Partial names match'} />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    expect(observed).toContain(screen.getByText('Name').closest('label'));
  });

  it('re-aligns when the holder resizes, observing the items rather than remeasuring on a timer', () => {
    const { observed, resize } = installResizeObserver();
    const geometry: Geometry = {
      search: { top: 0, controlBottom: 58 },
      region: { top: 0, controlBottom: 58 },
    };
    stubGeometry(geometry);
    render(
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--search-min-width'} testId={'search'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--region-min-width'} testId={'region'}>
          <Input name={'region'} label={'A label that wraps once narrow'} />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    expect(paddingOf('search')).toBe(0);
    expect(observed).toContain(
      screen.getByTestId('search').firstElementChild as Element,
    );
    geometry.region = { top: 0, controlBottom: 82 };
    resize();
    expect(paddingOf('search')).toBe(24);
  });

  it('re-aligns on a re-render, so a message appearing or a label changing moves the controls together', () => {
    const geometry: Geometry = {
      search: { top: 0, controlBottom: 58 },
      region: { top: 0, controlBottom: 58 },
    };
    stubGeometry(geometry);
    const filter = (label: string) => (
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--search-min-width'} testId={'search'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--region-min-width'} testId={'region'}>
          <Input name={'region'} label={label} />
        </FieldRow.Field>
      </FieldRow.Root>
    );
    const { rerender } = render(filter('Region'));
    geometry.region = { top: 0, controlBottom: 82 };
    rerender(filter('Region of the first release'));
    expect(paddingOf('search')).toBe(24);
  });

  it('renders without a ResizeObserver, aligning once on render where the platform offers no observer', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    stubGeometry({
      search: { top: 0, controlBottom: 58 },
      region: { top: 0, controlBottom: 82 },
    });
    expect(() => renderFilter()).not.toThrow();
    expect(paddingOf('search')).toBe(24);
  });

  it('keeps the same mounted control, its value and its focus through a change of weights, gap or padding', () => {
    const geometry: Geometry = {
      search: { top: 0, controlBottom: 58 },
      region: { top: 0, controlBottom: 58 },
      actions: { top: 0, controlBottom: 40 },
    };
    stubGeometry(geometry);
    const { rerender } = renderFilter();
    const control = screen.getByTestId('search-control') as HTMLInputElement;
    control.value = 'Ruby';
    control.focus();
    geometry.region = { top: 0, controlBottom: 82 };
    rerender(
      <FieldRow.Root gap={'region'} testId={'row'}>
        <FieldRow.Field
          weight={3}
          minWidth={'--search-min-width'}
          testId={'search'}
        >
          <Input name={'search'} label={'Name'} testId={'search-control'} />
        </FieldRow.Field>
        <FieldRow.Field minWidth={'--region-min-width'} testId={'region'}>
          <Select.Root
            name={'region'}
            label={'Region'}
            placeholder={'Any'}
            testId={'region-control'}
          >
            <Select.Option value={'eu'}>Europe</Select.Option>
          </Select.Root>
        </FieldRow.Field>
        <FieldRow.Actions testId={'actions'}>
          <Button>Apply</Button>
        </FieldRow.Actions>
      </FieldRow.Root>,
    );
    expect(screen.getByTestId('search-control')).toBe(control);
    expect(control.value).toBe('Ruby');
    expect(document.activeElement).toBe(control);
    expect(paddingOf('search')).toBe(24);
  });

  it('reserves no space for an omitted field and takes a field in later without remounting the others', () => {
    const filter = (showRegion: boolean) => (
      <FieldRow.Root testId={'row'}>
        <FieldRow.Field minWidth={'--search-min-width'} testId={'search'}>
          <Input name={'search'} label={'Name'} testId={'search-control'} />
        </FieldRow.Field>
        {showRegion && (
          <FieldRow.Field minWidth={'--region-min-width'} testId={'region'}>
            <Input name={'region'} label={'Region'} />
          </FieldRow.Field>
        )}
        <FieldRow.Actions testId={'actions'}>
          <Button>Apply</Button>
        </FieldRow.Actions>
      </FieldRow.Root>
    );
    const { rerender } = render(filter(false));
    expect(screen.getByTestId('row').children).toHaveLength(2);
    const control = screen.getByTestId('search-control');
    rerender(filter(true));
    expect(screen.getByTestId('row').children).toHaveLength(3);
    expect(screen.getByTestId('search-control')).toBe(control);
  });

  it('lays out a single field and no actions, since one field in a filter is still a row', () => {
    render(
      <FieldRow.Root testId={'row'}>
        <FieldRow.Field minWidth={'--search-min-width'} testId={'search'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
      </FieldRow.Root>,
    );
    expect(screen.getByTestId('row').children).toHaveLength(1);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('throws when a Field or the Actions is composed outside a Root, as every compound here does', () => {
    expect(() =>
      render(
        <FieldRow.Field minWidth={'--search-min-width'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>,
      ),
    ).toThrowError(FieldRowCompositionError);
    expect(() =>
      render(
        <FieldRow.Actions>
          <Button>Apply</Button>
        </FieldRow.Actions>,
      ),
    ).toThrowError(FieldRowCompositionError);
  });

  it('takes no outer space and names every value through a role, never a unit length or a spacing rung', () => {
    renderFilter({ gap: 'region' });
    const root = screen.getByTestId('row');
    for (const element of [root, ...Array.from(root.children)]) {
      for (const utility of element.className.split(/\s+/).filter(Boolean)) {
        expect(utility).not.toMatch(/^m[trblxy]?-/);
        expect(utility).not.toMatch(/^p[trblxy]?-/);
        expect(utility).not.toMatch(/\d(px|rem|em|ch|vh|vw)\b/);
        expect(utility).not.toMatch(/-[1-9]/);
      }
      expect(element.className).not.toContain('--space-band');
      expect(element.className).not.toContain('--gutter');
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  it('renders testId on each member and emits none when it is omitted', () => {
    const { container } = render(
      <FieldRow.Root>
        <FieldRow.Field minWidth={'--search-min-width'}>
          <Input name={'search'} label={'Name'} />
        </FieldRow.Field>
        <FieldRow.Actions>
          <Button>Apply</Button>
        </FieldRow.Actions>
      </FieldRow.Root>,
    );
    expect(container.querySelector('[data-testid]')).toBeNull();
  });
});
