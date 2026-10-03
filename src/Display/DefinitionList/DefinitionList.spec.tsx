import { render, screen, within } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { DefinitionList } from './DefinitionList';
import { DefinitionListConfigurationError } from './DefinitionListConfigurationError';

type RootProps = ComponentProps<typeof DefinitionList.Root>;

const renderSpecList = (
  overrides: Partial<RootProps> & { itemTestId?: string } = {},
) => {
  const { itemTestId, ...props } = overrides;
  return render(
    <DefinitionList.Root testId={'the-list'} {...props}>
      <DefinitionList.Item testId={itemTestId}>
        <DefinitionList.Term>Casting</DefinitionList.Term>
        <DefinitionList.Term>Moulding</DefinitionList.Term>
        <DefinitionList.Description>
          Shaping by pouring into a form and letting it set.
        </DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Turning</DefinitionList.Term>
        <DefinitionList.Description>
          Cutting on a lathe.
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>,
  );
};

// The switch is two custom properties the Root writes and every Item reads; their text is the
// documented fit threshold `g + max(m_i * S / w_i)` and the term's share of the row, so the spec
// reads them back as the observable form of the contract. Geometry is a browser fact and lives in
// the stories' play functions.
const thresholdOf = (): string =>
  screen
    .getByTestId('the-list')
    .style.getPropertyValue('--definition-threshold');
const termShareOf = (): string =>
  screen
    .getByTestId('the-list')
    .style.getPropertyValue('--definition-term-share');

describe('DefinitionList', () => {
  it('renders the semantic dl/div/dt/dd structure a server can render with no JavaScript', () => {
    const { container } = renderSpecList();
    const list = container.querySelector('dl');
    expect(list).toBeInTheDocument();
    // Items are the grouping divs directly inside the dl - valid there for exactly this purpose.
    const items = list?.querySelectorAll(':scope > div');
    expect(items).toHaveLength(2);
    for (const item of items ?? []) {
      expect(item.tagName).toBe('DIV');
    }
    expect(container.querySelectorAll('dl > div > dt')).toHaveLength(3);
    expect(container.querySelectorAll('dl > div > dd')).toHaveLength(2);
  });

  it('keeps several terms and their one description together in the item the wrapper exists for', () => {
    // The load-bearing case: two dt sharing one dd. Without the wrapper a second consecutive term
    // auto-places into the description column and the layout breaks silently.
    renderSpecList({ itemTestId: 'multi-term' });
    const item = screen.getByTestId('multi-term');
    expect(within(item).getByText('Casting').tagName).toBe('DT');
    expect(within(item).getByText('Moulding').tagName).toBe('DT');
    const description = within(item).getByText(
      'Shaping by pouring into a form and letting it set.',
    );
    expect(description.tagName).toBe('DD');
    expect(item.querySelectorAll('dt')).toHaveLength(2);
    expect(item.querySelectorAll('dd')).toHaveLength(1);
  });

  it('renders an empty list as an empty dl with the defaults in place, so a list awaiting facts is still valid', () => {
    render(<DefinitionList.Root testId={'empty'} />);
    const list = screen.getByTestId('empty');
    expect(list.tagName).toBe('DL');
    expect(list.childElementCount).toBe(0);
    expect(list.style.getPropertyValue('--definition-threshold')).not.toBe('');
  });

  it('sets the term at the subtitle type role with no size prop, and no measure cap', () => {
    // subtitle is H3's role: a step below title so terms never tie with the heading introducing them.
    // Size has no jsdom-observable effect, so we assert the role utility - the requirement is the role.
    renderSpecList();
    const term = screen.getByText('Turning');
    expect(term.tagName).toBe('DT');
    expect(term).toHaveClass('text-subtitle');
    expect(term).toHaveClass('text-foreground');
    expect(term.className).not.toMatch(/\bmax-w-/);
  });

  it('sets the term and the description in the body family role, whatever size the term takes (#120)', () => {
    // docs/adr/0004, the amendment: the term and its description are together the reading matter,
    // so both read --font-body - the term is sized like a heading and is not one.
    renderSpecList();
    expect(screen.getByText('Turning').className).toContain('font-body');
    expect(screen.getByText('Turning').className).not.toContain('font-heading');
    expect(screen.getByText('Cutting on a lathe.').className).toContain(
      'font-body',
    );
  });

  it('sets the description at the body role, muted, and caps it at the reading measure', () => {
    renderSpecList();
    const description = screen.getByText('Cutting on a lathe.');
    expect(description.tagName).toBe('DD');
    expect(description).toHaveClass('text-body');
    expect(description).toHaveClass('text-muted');
    expect(description).toHaveClass('max-w-[var(--measure)]');
  });

  it('rules the block with a hairline above the first item and below every item, closing the foot', () => {
    // Rules are the layout: the block reads as a list from the hairlines alone, and unlike Table it
    // closes at the foot - the last item keeps its bottom rule.
    const { container } = renderSpecList();
    const items = container.querySelectorAll('dl > div');
    for (const item of items) {
      expect(item.className).toMatch(/\bborder-b\b/);
      expect(item.className).toMatch(/\bborder-border\b/);
      expect(item.className).toMatch(/\bfirst:border-t\b/);
    }
  });

  it.each(['comfortable', 'compact'] as const)(
    "draws no card, box, fill, icon or bullet anywhere at %s density - the issue's explicit Must not list",
    (density) => {
      const { container } = renderSpecList({ density });
      for (const element of container.querySelectorAll('*')) {
        expect(element.className).not.toMatch(/(^|[\s:])bg-/);
        expect(element.className).not.toMatch(/\brounded/);
        expect(element.className).not.toMatch(/\bshadow/);
        expect(element.className).not.toMatch(/\blist-/);
      }
    },
  );

  it('carries no dark: class - colours are semantic tokens re-pointed by the dark class', () => {
    const { container } = renderSpecList({ density: 'compact' });
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  it('offers density as two named treatments and the two column allocations beside children and testId', () => {
    expectTypeOf<NonNullable<RootProps['density']>>().toEqualTypeOf<
      'comfortable' | 'compact'
    >();
    expectTypeOf<RootProps['termColumn']>().toEqualTypeOf<
      { weight: number; minWidth: `--${string}` } | undefined
    >();
    expectTypeOf<RootProps['descriptionColumn']>().toEqualTypeOf<
      { weight: number; minWidth: `--${string}` } | undefined
    >();
    expectTypeOf<
      Omit<RootProps, 'density' | 'termColumn' | 'descriptionColumn'>
    >().toEqualTypeOf<{ children?: ReactNode; testId?: string }>();
    // @ts-expect-error a raw length is not a token name
    const length: RootProps['termColumn'] = { weight: 1, minWidth: '16rem' };
    expect(length).toBeDefined();
  });

  it('pads each item from the comfortable spacing role by default and the compact role when asked, so a brand tunes the two apart', () => {
    const comfortable = renderSpecList();
    expect(screen.getByTestId('the-list').className).toContain(
      'var(--space-definition-item)',
    );
    expect(screen.getByTestId('the-list').className).not.toContain(
      'var(--space-definition-item-compact)',
    );
    comfortable.unmount();
    renderSpecList({ density: 'compact' });
    expect(screen.getByTestId('the-list').className).toContain(
      'var(--space-definition-item-compact)',
    );
    expect(screen.getByTestId('the-list').className).not.toMatch(
      /var\(--space-definition-item\)/,
    );
  });

  it('changes nothing but the item air at compact density: the term and the description keep their typography (#123 brief)', () => {
    const comfortable = renderSpecList();
    const comfortableTerm = screen.getByText('Turning').className;
    const comfortableDescription = screen.getByText(
      'Cutting on a lathe.',
    ).className;
    comfortable.unmount();
    renderSpecList({ density: 'compact' });
    expect(screen.getByText('Turning').className).toBe(comfortableTerm);
    expect(screen.getByText('Cutting on a lathe.').className).toBe(
      comfortableDescription,
    );
  });

  it('keys every item on the threshold the list writes, and on no viewport breakpoint', () => {
    renderSpecList({ itemTestId: 'item' });
    expect(screen.getByTestId('item').className).toContain(
      '--definition-threshold',
    );
    expect(screen.getByTestId('item').className).not.toMatch(/\blg:/);
  });

  it('writes the default fit threshold - one column gap plus the larger of each library minimum scaled by S / w - for a 1:2 split', () => {
    renderSpecList();
    expect(thresholdOf()).toBe(
      'calc(var(--space-definition-column) + max(var(--definition-term-min-width) * 3, var(--definition-description-min-width) * 1.5))',
    );
    expect(termShareOf()).toBe('calc(1 / 3)');
  });

  it("writes the consumer's allocation in the same form, so every item shares it whatever its content", () => {
    renderSpecList({
      termColumn: { weight: 1, minWidth: '--summary-term-min-width' },
      descriptionColumn: {
        weight: 3,
        minWidth: '--summary-description-min-width',
      },
    });
    expect(thresholdOf()).toBe(
      'calc(var(--space-definition-column) + max(var(--summary-term-min-width) * 4, var(--summary-description-min-width) * 1.3333333333333333))',
    );
    expect(termShareOf()).toBe('calc(1 / 4)');
  });

  it('lets one column be re-allocated while the other keeps its documented default', () => {
    renderSpecList({
      termColumn: { weight: 2, minWidth: '--definition-term-min-width' },
    });
    expect(thresholdOf()).toBe(
      'calc(var(--space-definition-column) + max(var(--definition-term-min-width) * 2, var(--definition-description-min-width) * 2))',
    );
    expect(termShareOf()).toBe('calc(2 / 4)');
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuses a weight of %s loudly, as ColumnLayout does - a share of nothing is a programmer error',
    (weight) => {
      expect(() =>
        renderSpecList({
          descriptionColumn: {
            weight,
            minWidth: '--definition-description-min-width',
          },
        }),
      ).toThrow(DefinitionListConfigurationError);
    },
  );

  it('refuses a minimum that is not a custom-property name, naming the column in the error', () => {
    expect(() =>
      renderSpecList({
        // The type forbids this; the runtime guard is for untyped callers and tests the message.
        termColumn: { weight: 1, minWidth: 'var(--x)' as `--${string}` },
      }),
    ).toThrow(/termColumn/);
  });

  it('separates a stacked term from its description by the stack role and the two columns by their dedicated spacing role', () => {
    renderSpecList({ itemTestId: 'item' });
    const item = screen.getByTestId('item');
    expect(item).toHaveClass('gap-[var(--space-stack)]');
    expect(item.className).toContain('var(--space-definition-column)');
  });

  it('exposes the one sanctioned host hook through testId on Root and Item', () => {
    renderSpecList({ itemTestId: 'the-item' });
    expect(screen.getByTestId('the-list').tagName).toBe('DL');
    expect(screen.getByTestId('the-item').tagName).toBe('DIV');
  });

  it('is one namespace object carrying exactly its four members', () => {
    expect(Object.keys(DefinitionList).sort()).toEqual(
      ['Description', 'Item', 'Root', 'Term'].sort(),
    );
  });
});
