import { render, screen } from '@testing-library/react';
import { Screen } from 'index';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('Screen public contract', () => {
  it('supplies one main with caller heading before preserved interactive content', () => {
    const { rerender } = render(
      <Screen heading={<h1>Workspace</h1>}>
        <input aria-label="Selection" defaultValue="Kept" />
      </Screen>,
    );
    const main = screen.getByRole('main');
    const input = screen.getByRole('textbox');
    input.focus();
    rerender(
      <Screen heading={<h1>Arbeitsbereich</h1>}>
        <input aria-label="Selection" defaultValue="Kept" />
      </Screen>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(main).toContainElement(screen.getByRole('heading', { level: 1 }));
    expect(main).toContainElement(input);
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Kept');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(main).not.toHaveAttribute('tabindex');
    expectTypeOf<ComponentProps<typeof Screen>>().not.toHaveProperty('style');
    expectTypeOf<ComponentProps<typeof Screen>>().not.toHaveProperty(
      'className',
    );
    expectTypeOf<keyof ComponentProps<typeof Screen>>().toEqualTypeOf<
      'heading' | 'children' | 'testId'
    >();
  });
});
