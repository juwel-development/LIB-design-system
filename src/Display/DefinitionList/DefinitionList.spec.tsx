import { render, screen, within } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { DefinitionList } from './DefinitionList';

type Density = NonNullable<
  ComponentProps<typeof DefinitionList.Root>['density']
>;

const renderSpecList = (
  testId?: string,
  itemTestId?: string,
  density?: Density,
) =>
  render(
    <DefinitionList.Root testId={testId} density={density}>
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
    renderSpecList(undefined, 'multi-term');
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
      const { container } = renderSpecList(undefined, undefined, density);
      for (const element of container.querySelectorAll('*')) {
        expect(element.className).not.toMatch(/(^|[\s:])bg-/);
        expect(element.className).not.toMatch(/\brounded/);
        expect(element.className).not.toMatch(/\bshadow/);
        expect(element.className).not.toMatch(/\blist-/);
      }
    },
  );

  it.each(['comfortable', 'compact'] as const)(
    'carries no dark: class at %s density - colours are semantic tokens re-pointed by the dark class',
    (density) => {
      const { container } = renderSpecList(undefined, undefined, density);
      for (const element of container.querySelectorAll('*')) {
        expect(element.className).not.toMatch(/\bdark:/);
      }
    },
  );

  it('lays the item out single-column by default and two baseline-aligned columns at 64rem', () => {
    // The switch is a media query, not a prop; jsdom computes no layout, so we assert the markup the
    // stylesheet keys on. Single column is the grid base; the fixed term track and baseline arrive at lg.
    renderSpecList(undefined, 'item');
    const item = screen.getByTestId('item');
    expect(item).toHaveClass('grid');
    expect(item.className).toMatch(/\blg:grid-cols-\[/);
    expect(item).toHaveClass('lg:items-baseline');
  });

  it('sets the single-column term-to-description gap from the stack spacing role', () => {
    renderSpecList(undefined, 'item');
    expect(screen.getByTestId('item')).toHaveClass('gap-[var(--space-stack)]');
  });

  it('exposes the one sanctioned host hook through testId on Root and Item', () => {
    renderSpecList('the-list', 'the-item');
    expect(screen.getByTestId('the-list').tagName).toBe('DL');
    expect(screen.getByTestId('the-item').tagName).toBe('DIV');
  });

  it('is comfortable by default and states the resolved density on the dl, so a server renders the mode with no hydration', () => {
    renderSpecList('the-list');
    expect(screen.getByTestId('the-list')).toHaveAttribute(
      'data-density',
      'comfortable',
    );
  });

  it('offers density as the one new Root prop, closed to two named treatments', () => {
    expectTypeOf<ComponentProps<typeof DefinitionList.Root>>().toEqualTypeOf<{
      children?: ReactNode;
      testId?: string;
      density?: 'comfortable' | 'compact' | null;
    }>();
  });

  it('keeps the dl/div/dt/dd structure and the term-before-description order at compact density (#123)', () => {
    const { container } = renderSpecList('the-list', undefined, 'compact');
    const list = screen.getByTestId('the-list');
    expect(list.tagName).toBe('DL');
    expect(list).toHaveAttribute('data-density', 'compact');
    expect(container.querySelectorAll('dl > div')).toHaveLength(2);
    expect(container.querySelectorAll('dl > div > dt')).toHaveLength(3);
    expect(container.querySelectorAll('dl > div > dd')).toHaveLength(2);
    for (const item of container.querySelectorAll('dl > div')) {
      const members = [...item.children].map((child) => child.tagName);
      expect(members.at(-1)).toBe('DD');
      expect(members.slice(0, -1).every((tag) => tag === 'DT')).toBe(true);
    }
  });

  it('seats a compact term at the label role in the secondary family, muted - a fact label, not a heading', () => {
    // The consumer evidence (#123): subtitle-sized terms read as section headings beside short facts.
    // A compact term is the label of its value, so it takes the one label device the library has -
    // the treatment Table's header cells carry - and is told apart from its value by colour.
    renderSpecList(undefined, undefined, 'compact');
    const term = screen.getByText('Turning');
    expect(term.tagName).toBe('DT');
    expect(term).toHaveClass('font-secondary');
    expect(term).toHaveClass('text-label');
    expect(term).toHaveClass('tracking-label');
    expect(term).toHaveClass('text-muted');
    expect(term.className).not.toMatch(/\btext-subtitle\b/);
    expect(term.className).not.toMatch(/\bleading-label\b/);
  });

  it('seats a compact description at the small role, foreground, with tabular figures, still measure-capped', () => {
    // Facts are often figures stacked one above the other - a wage above a royalty - which is the
    // same comparison Table's value cells make column to column; the small role carries that floor.
    renderSpecList(undefined, undefined, 'compact');
    const description = screen.getByText('Cutting on a lathe.');
    expect(description.tagName).toBe('DD');
    expect(description).toHaveClass('font-primary');
    expect(description).toHaveClass('text-small');
    expect(description).toHaveClass('text-foreground');
    expect(description).toHaveClass('tabular-nums');
    expect(description).toHaveClass('max-w-[var(--measure)]');
    expect(description.className).not.toMatch(/\btext-body\b/);
  });

  it('switches a compact item into two proportional columns on the width of its container, not the viewport', () => {
    // The consumer defect: a fixed 16rem term track keyed on a 64rem viewport eats a one-third panel
    // on a wide screen. Compact makes the dl an inline-size container and keys the item on it.
    renderSpecList('the-list', 'item', 'compact');
    expect(screen.getByTestId('the-list')).toHaveClass('@container');
    const item = screen.getByTestId('item');
    expect(item).toHaveClass('grid');
    expect(item.className).toMatch(
      /@sm:grid-cols-\[minmax\(0,1fr\)_minmax\(0,2fr\)\]/,
    );
    expect(item).toHaveClass('@sm:items-baseline');
    expect(item.className).not.toMatch(/\blg:/);
  });

  it('leaves the comfortable list keyed on the viewport with no container context, so the default renders as before', () => {
    renderSpecList('the-list', 'item');
    expect(screen.getByTestId('the-list').className).not.toMatch(/@container/);
    const item = screen.getByTestId('item');
    expect(item.className).toMatch(/\blg:grid-cols-\[/);
    expect(item.className).not.toMatch(/@sm:/);
  });

  it('pads each item from the spacing role of its density, so a brand tunes the two treatments apart', () => {
    renderSpecList(undefined, 'comfortable-item');
    expect(screen.getByTestId('comfortable-item')).toHaveClass(
      'py-[var(--space-definition-item)]',
    );
    renderSpecList(undefined, 'compact-item', 'compact');
    expect(screen.getByTestId('compact-item')).toHaveClass(
      'py-[var(--space-definition-item-compact)]',
    );
  });

  it('separates a compact term column from its values by the region role and stacked terms by the stack role', () => {
    renderSpecList(undefined, 'item', 'compact');
    const item = screen.getByTestId('item');
    expect(item).toHaveClass('gap-[var(--space-stack)]');
    expect(item).toHaveClass('@sm:gap-x-[var(--space-region)]');
  });

  it('lets an unbroken compact value wrap inside its column instead of overflowing the panel', () => {
    // A proportional track can be narrower than one long token - a URL, a German compound - and a
    // panel or Dialog has nowhere for the overflow to go. Comfortable keeps its measure-wide line.
    renderSpecList(undefined, undefined, 'compact');
    expect(screen.getByText('Cutting on a lathe.')).toHaveClass(
      'wrap-break-word',
    );
    expect(screen.getByText('Turning')).toHaveClass('wrap-break-word');
  });

  it('keeps the hairlines at compact density - the rules are still the layout', () => {
    const { container } = renderSpecList(undefined, undefined, 'compact');
    for (const item of container.querySelectorAll('dl > div')) {
      expect(item.className).toMatch(/\bborder-b\b/);
      expect(item.className).toMatch(/\bborder-border\b/);
      expect(item.className).toMatch(/\bfirst:border-t\b/);
    }
  });

  it('is one namespace object carrying exactly its four members', () => {
    expect(Object.keys(DefinitionList).sort()).toEqual(
      ['Description', 'Item', 'Root', 'Term'].sort(),
    );
  });
});
