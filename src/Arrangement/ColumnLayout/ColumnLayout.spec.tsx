import { fireEvent, render, screen } from '@testing-library/react';
import {
  type ComponentProps,
  type FunctionComponent,
  type ReactNode,
  useState,
} from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { ColumnLayout } from './ColumnLayout';
import { ColumnLayoutCompositionError } from './ColumnLayoutCompositionError';
import { ColumnLayoutConfigurationError } from './ColumnLayoutConfigurationError';

// The switch is one custom property the Root writes and every Column reads; its text is the
// documented fit threshold, `(n - 1) * g + max(m_i * S / w_i)`, so the spec reads it back as the
// observable form of the contract. Geometry itself is a browser fact and lives in the stories.
const thresholdOf = (element: HTMLElement): string =>
  element.style.getPropertyValue('--column-layout-threshold');

const weightOf = (element: HTMLElement): string =>
  element.style.getPropertyValue('--column-layout-weight');

describe('ColumnLayout', () => {
  it('offers Root only the two attested gap roles, defaulting to region (ADR 0008)', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof ColumnLayout.Root>['gap']>
    >().toEqualTypeOf<'stack' | 'region'>();
  });

  it('constrains a column to a numeric weight and a custom-property name, never a length', () => {
    expectTypeOf<
      ComponentProps<typeof ColumnLayout.Column>['weight']
    >().toEqualTypeOf<number>();
    expectTypeOf<
      ComponentProps<typeof ColumnLayout.Column>['minWidth']
    >().toEqualTypeOf<`--${string}`>();
    // @ts-expect-error a raw length is not a token name
    const length: ComponentProps<typeof ColumnLayout.Column>['minWidth'] =
      '20rem';
    // @ts-expect-error a var() expression is not a token name
    const expression: ComponentProps<typeof ColumnLayout.Column>['minWidth'] =
      'var(--main-column-min-width)';
    expect([length, expression]).toHaveLength(2);
  });

  it('renders a plain container that claims no landmark and no heading', () => {
    const { container } = render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={1} minWidth={'--main'}>
          Matter
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    const root = screen.getByTestId('layout');
    expect(root.tagName).toBe('DIV');
    expect(root).not.toHaveAttribute('role');
    expect(
      container.querySelector('section, nav, h1, h2, h3, h4, h5, h6'),
    ).toBeNull();
  });

  it('keeps the columns in reading order as direct children of the root, their content unmodified', () => {
    render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--main'} testId={'first'}>
          <p>First</p>
        </ColumnLayout.Column>
        <ColumnLayout.Column
          weight={1}
          minWidth={'--support'}
          testId={'second'}
        >
          <p>Second</p>
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    const root = screen.getByTestId('layout');
    const first = screen.getByTestId('first');
    const second = screen.getByTestId('second');
    expect(Array.from(root.children)).toEqual([first, second]);
    expect(first.tagName).toBe('DIV');
    expect(first).not.toHaveAttribute('role');
    expect(screen.getByText('First').parentElement).toBe(first);
    expect(screen.getByText('Second').parentElement).toBe(second);
  });

  it('separates the columns on the region space role by default, in both arrangements', () => {
    render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={1} minWidth={'--main'}>
          Matter
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    const root = screen.getByTestId('layout');
    // One `gap` serves the row and the stacked lines alike, so the chosen role separates the
    // columns whichever way they are arranged.
    expect(root.className).toContain('gap-[var(--space-region)]');
    expect(root.className).not.toContain('gap-[var(--space-stack)]');
    expect(root.className).not.toMatch(/\bgap-[xy]-/);
  });

  it('separates the columns on the sibling space role when asked for it', () => {
    render(
      <ColumnLayout.Root gap={'stack'} testId={'layout'}>
        <ColumnLayout.Column weight={1} minWidth={'--main'}>
          Matter
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    const root = screen.getByTestId('layout');
    expect(root.className).toContain('gap-[var(--space-stack)]');
    expect(root.className).not.toContain('gap-[var(--space-region)]');
    expect(root.className).not.toContain('--space-band');
  });

  it('writes the fit threshold for a 2:1 arrangement - one gap plus the larger of each minimum scaled by S / w (brief, #116)', () => {
    render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
          Main
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--support-column-min-width'}>
          Support
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(thresholdOf(screen.getByTestId('layout'))).toBe(
      'calc(1 * var(--column-layout-gap) + max(var(--main-column-min-width) * 1.5, var(--support-column-min-width) * 3))',
    );
  });

  it('writes two gaps and a quarter share for each minor column in a 2:1:1 arrangement', () => {
    render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--a'}>
          A
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--b'}>
          B
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--c'}>
          C
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(thresholdOf(screen.getByTestId('layout'))).toBe(
      'calc(2 * var(--column-layout-gap) + max(var(--a) * 2, var(--b) * 4, var(--c) * 4))',
    );
  });

  it('accepts fractional positive weights and scales each minimum by the same total', () => {
    render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={0.5} minWidth={'--a'}>
          A
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1.5} minWidth={'--b'}>
          B
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(thresholdOf(screen.getByTestId('layout'))).toBe(
      'calc(1 * var(--column-layout-gap) + max(var(--a) * 4, var(--b) * 1.3333333333333333))',
    );
  });

  it('hands each column its weight so the row divides the remaining width in proportion', () => {
    render(
      <ColumnLayout.Root>
        <ColumnLayout.Column weight={2} minWidth={'--a'} testId={'a'}>
          A
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={0.5} minWidth={'--b'} testId={'b'}>
          B
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(weightOf(screen.getByTestId('a'))).toBe('2');
    expect(weightOf(screen.getByTestId('b'))).toBe('0.5');
  });

  it('reads the gap it was given for the threshold, so the switch and the paint cannot disagree', () => {
    const { rerender } = render(
      <ColumnLayout.Root gap={'stack'} testId={'layout'}>
        <ColumnLayout.Column weight={1} minWidth={'--a'}>
          A
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--b'}>
          B
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    const root = screen.getByTestId('layout');
    expect(root.className).toContain(
      '[--column-layout-gap:var(--space-stack)]',
    );
    expect(thresholdOf(root)).toContain('1 * var(--column-layout-gap)');
    rerender(
      <ColumnLayout.Root gap={'region'} testId={'layout'}>
        <ColumnLayout.Column weight={1} minWidth={'--a'}>
          A
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--b'}>
          B
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(root.className).toContain(
      '[--column-layout-gap:var(--space-region)]',
    );
    expect(root.className).not.toContain('--space-stack');
  });

  it('contains no tracks, no gaps and no threshold when it has no columns', () => {
    render(<ColumnLayout.Root testId={'layout'} />);
    const root = screen.getByTestId('layout');
    expect(root.children).toHaveLength(0);
    expect(thresholdOf(root)).toBe('');
  });

  it('gives a single column the whole width: its threshold is its own minimum and no gap', () => {
    render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={3} minWidth={'--only'}>
          Only
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(thresholdOf(screen.getByTestId('layout'))).toBe(
      'calc(0 * var(--column-layout-gap) + max(var(--only) * 1))',
    );
  });

  it('counts rendered columns only, so an omitted conditional column reserves neither width nor gap', () => {
    const summary: ReactNode = false;
    render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--main'} testId={'main'}>
          Main
        </ColumnLayout.Column>
        {summary}
        {undefined}
      </ColumnLayout.Root>,
    );
    const root = screen.getByTestId('layout');
    expect(root.children).toHaveLength(1);
    expect(thresholdOf(root)).toBe(
      'calc(0 * var(--column-layout-gap) + max(var(--main) * 1))',
    );
  });

  it('counts columns supplied through arrays and fragments, as a map or a conditional pair renders them', () => {
    render(
      <ColumnLayout.Root testId={'layout'}>
        {[
          <ColumnLayout.Column key={'a'} weight={1} minWidth={'--a'}>
            A
          </ColumnLayout.Column>,
          <ColumnLayout.Column key={'b'} weight={1} minWidth={'--b'}>
            B
          </ColumnLayout.Column>,
        ]}
        {/* biome-ignore lint/complexity/noUselessFragments: the fragment is the case under test */}
        <>
          <ColumnLayout.Column weight={2} minWidth={'--c'}>
            C
          </ColumnLayout.Column>
        </>
      </ColumnLayout.Root>,
    );
    const root = screen.getByTestId('layout');
    expect(root.children).toHaveLength(3);
    expect(thresholdOf(root)).toBe(
      'calc(2 * var(--column-layout-gap) + max(var(--a) * 4, var(--b) * 4, var(--c) * 2))',
    );
  });

  it('redistributes when a column is inserted later, keeping the retained column mounted with its focus and state', () => {
    const Screen: FunctionComponent = () => {
      const [hasSummary, setHasSummary] = useState(false);
      return (
        <>
          <button type={'button'} onClick={() => setHasSummary(true)}>
            Show summary
          </button>
          <ColumnLayout.Root testId={'layout'}>
            <ColumnLayout.Column weight={2} minWidth={'--main'} testId={'main'}>
              <input aria-label={'Search'} />
            </ColumnLayout.Column>
            {hasSummary && (
              <ColumnLayout.Column
                weight={1}
                minWidth={'--support'}
                testId={'summary'}
              >
                Summary
              </ColumnLayout.Column>
            )}
          </ColumnLayout.Root>
        </>
      );
    };
    render(<Screen />);
    const root = screen.getByTestId('layout');
    const main = screen.getByTestId('main');
    const search = screen.getByRole('textbox', { name: 'Search' });
    search.focus();
    fireEvent.change(search, { target: { value: 'jars' } });
    expect(thresholdOf(root)).toBe(
      'calc(0 * var(--column-layout-gap) + max(var(--main) * 1))',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show summary' }));

    expect(Array.from(root.children)).toEqual([
      main,
      screen.getByTestId('summary'),
    ]);
    expect(thresholdOf(root)).toBe(
      'calc(1 * var(--column-layout-gap) + max(var(--main) * 1.5, var(--support) * 3))',
    );
    expect(screen.getByTestId('main')).toBe(main);
    expect(document.activeElement).toBe(search);
    expect(search).toHaveValue('jars');
  });

  it('updates the allocation when weights change, without remounting the columns', () => {
    const { rerender } = render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--a'} testId={'a'}>
          A
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--b'} testId={'b'}>
          B
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    rerender(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={1} minWidth={'--a'} testId={'a'}>
          A
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--b'} testId={'b'}>
          B
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(thresholdOf(screen.getByTestId('layout'))).toBe(
      'calc(1 * var(--column-layout-gap) + max(var(--a) * 2, var(--b) * 2))',
    );
    expect(weightOf(screen.getByTestId('a'))).toBe('1');
    expect(screen.getByTestId('a')).toBe(a);
    expect(screen.getByTestId('b')).toBe(b);
  });

  it('lets an inner arrangement sit inside a column with its own threshold, counted apart from the outer one', () => {
    render(
      <ColumnLayout.Root testId={'outer'}>
        <ColumnLayout.Column weight={2} minWidth={'--main'}>
          <ColumnLayout.Root testId={'inner'}>
            <ColumnLayout.Column weight={1} minWidth={'--x'}>
              X
            </ColumnLayout.Column>
            <ColumnLayout.Column weight={1} minWidth={'--y'}>
              Y
            </ColumnLayout.Column>
          </ColumnLayout.Root>
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--support'}>
          Support
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(thresholdOf(screen.getByTestId('outer'))).toBe(
      'calc(1 * var(--column-layout-gap) + max(var(--main) * 1.5, var(--support) * 3))',
    );
    expect(thresholdOf(screen.getByTestId('inner'))).toBe(
      'calc(1 * var(--column-layout-gap) + max(var(--x) * 2, var(--y) * 2))',
    );
  });

  it('throws when a column is composed outside Root, loud and early', () => {
    expect(() =>
      render(
        <ColumnLayout.Column weight={1} minWidth={'--main'}>
          Loose
        </ColumnLayout.Column>,
      ),
    ).toThrowError(ColumnLayoutCompositionError);
  });

  it('throws when a column reaches Root through a wrapping component, since Root could not count it', () => {
    const Summary: FunctionComponent = () => (
      <ColumnLayout.Column weight={1} minWidth={'--support'}>
        Summary
      </ColumnLayout.Column>
    );
    expect(() =>
      render(
        <ColumnLayout.Root>
          <ColumnLayout.Column weight={2} minWidth={'--main'}>
            Main
          </ColumnLayout.Column>
          <Summary />
        </ColumnLayout.Root>,
      ),
    ).toThrowError(ColumnLayoutCompositionError);
  });

  it('throws when a column is nested inside another column rather than inside its own Root', () => {
    expect(() =>
      render(
        <ColumnLayout.Root>
          <ColumnLayout.Column weight={2} minWidth={'--main'}>
            <ColumnLayout.Column weight={1} minWidth={'--nested'}>
              Nested
            </ColumnLayout.Column>
          </ColumnLayout.Column>
        </ColumnLayout.Root>,
      ),
    ).toThrowError(ColumnLayoutCompositionError);
  });

  it.each([
    ['zero', 0],
    ['a negative weight', -1],
    ['NaN', Number.NaN],
    ['an infinite weight', Number.POSITIVE_INFINITY],
  ])(
    'throws ColumnLayoutConfigurationError for %s, a programmer error rather than a state to repair',
    (_case, weight) => {
      expect(() =>
        render(
          <ColumnLayout.Root>
            <ColumnLayout.Column weight={weight} minWidth={'--main'}>
              Main
            </ColumnLayout.Column>
          </ColumnLayout.Root>,
        ),
      ).toThrowError(ColumnLayoutConfigurationError);
    },
  );

  it.each([
    ['a bare prefix', '--'],
    ['a space', '--main width'],
    ['a var() expression', '--main)'],
    ['a length', '--20rem;'],
    ['a closing brace', '--main}'],
  ])(
    'throws ColumnLayoutConfigurationError for a malformed token name with %s',
    (_case, minWidth) => {
      expect(() =>
        render(
          <ColumnLayout.Root>
            <ColumnLayout.Column
              weight={1}
              minWidth={minWidth as `--${string}`}
            >
              Main
            </ColumnLayout.Column>
          </ColumnLayout.Root>,
        ),
      ).toThrowError(ColumnLayoutConfigurationError);
    },
  );

  it('renders testId on either member as the test attribute and emits none when it is omitted', () => {
    const { container, rerender } = render(
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={1} minWidth={'--main'} testId={'column'}>
          Matter
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(container.firstElementChild).toHaveAttribute(
      'data-testid',
      'layout',
    );
    expect(screen.getByTestId('column')).toBeInTheDocument();
    rerender(
      <ColumnLayout.Root>
        <ColumnLayout.Column weight={1} minWidth={'--main'}>
          Matter
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    expect(container.firstElementChild).not.toHaveAttribute('data-testid');
    expect(container.firstElementChild?.firstElementChild).not.toHaveAttribute(
      'data-testid',
    );
  });

  it('takes no outer space and carries no dark: class - the theme re-points the tokens underneath', () => {
    const { container } = render(
      <ColumnLayout.Root gap={'stack'} testId={'layout'}>
        <ColumnLayout.Column weight={1} minWidth={'--main'}>
          Matter
        </ColumnLayout.Column>
      </ColumnLayout.Root>,
    );
    const root = screen.getByTestId('layout');
    expect(root.className).not.toMatch(/\bm[trblxy]?-/);
    expect(root.className).not.toContain('px-[var(--gutter)]');
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });
});
