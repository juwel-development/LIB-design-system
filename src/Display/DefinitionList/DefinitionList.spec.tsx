import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DefinitionList } from './DefinitionList';

const renderSpecList = (testId?: string, itemTestId?: string) =>
  render(
    <DefinitionList.Root testId={testId}>
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

  it("draws no card, box, fill, icon or bullet anywhere - the issue's explicit Must not list", () => {
    const { container } = renderSpecList();
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/(^|[\s:])bg-/);
      expect(element.className).not.toMatch(/\brounded/);
      expect(element.className).not.toMatch(/\bshadow/);
      expect(element.className).not.toMatch(/\blist-/);
    }
  });

  it('carries no dark: class - colours are semantic tokens re-pointed by the dark class', () => {
    const { container } = renderSpecList();
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

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

  it('is one namespace object carrying exactly its four members', () => {
    expect(Object.keys(DefinitionList).sort()).toEqual(
      ['Description', 'Item', 'Root', 'Term'].sort(),
    );
  });
});
