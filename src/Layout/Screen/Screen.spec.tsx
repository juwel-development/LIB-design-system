import { render, screen } from '@testing-library/react';
import { Screen } from 'index';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('Screen public contract', () => {
  it('preserves interactive content and focus when the heading changes', () => {
    const { rerender } = render(
      <Screen heading={<h1>Workspace</h1>}>
        <input aria-label="Selection" defaultValue="Kept" />
      </Screen>,
    );
    const input = screen.getByRole('textbox');
    input.focus();
    rerender(
      <Screen heading={<h1>Arbeitsbereich</h1>}>
        <input aria-label="Selection" defaultValue="Kept" />
      </Screen>,
    );
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Kept');
  });

  it('supplies one main with the caller heading before its content and no extra stop', () => {
    render(
      <Screen heading={<h1>Workspace</h1>}>
        <input aria-label="Selection" />
      </Screen>,
    );
    const main = screen.getByRole('main');
    const heading = screen.getByRole('heading', { level: 1 });
    const input = screen.getByRole('textbox');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(main).toContainElement(heading);
    expect(main).toContainElement(input);
    expect(
      heading.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(main).not.toHaveAttribute('tabindex');
  });

  it('exposes only heading, children and the consumer test hook', () => {
    expectTypeOf<ComponentProps<typeof Screen>>().not.toHaveProperty('style');
    expectTypeOf<ComponentProps<typeof Screen>>().not.toHaveProperty(
      'className',
    );
    expectTypeOf<keyof ComponentProps<typeof Screen>>().toEqualTypeOf<
      'heading' | 'children' | 'testId'
    >();
  });
});
