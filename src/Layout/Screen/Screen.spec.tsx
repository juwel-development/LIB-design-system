import { render, screen } from '@testing-library/react';
import { H1, Pane, Screen } from 'index';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('Screen public contract', () => {
  it('allows the only H1 inside the panel without an empty heading slot', () => {
    render(
      <Screen>
        <Pane.Root>
          <Pane.Head>
            <H1>Contracts</H1>
          </Pane.Head>
          <Pane.Body ariaLabel="Contracts">Roster</Pane.Body>
        </Pane.Root>
      </Screen>,
    );
    const main = screen.getByRole('main');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main).toContainElement(
      screen.getByRole('heading', { name: 'Contracts' }),
    );
    expect(main.children).toHaveLength(1);
    expect(main).not.toHaveAttribute('tabindex');
  });

  it('preserves the same edited input and focus across heading omission and restoration', () => {
    const { rerender } = render(
      <Screen heading={<h1>Workspace</h1>}>
        <input aria-label="Selection" defaultValue="Kept" />
      </Screen>,
    );
    const input = screen.getByRole<HTMLInputElement>('textbox');
    input.value = 'Edited';
    input.focus();
    for (const heading of [
      undefined,
      <h1 key="restored">Workspace</h1>,
      undefined,
    ]) {
      rerender(
        <Screen heading={heading}>
          <input aria-label="Selection" defaultValue="Kept" />
        </Screen>,
      );
      expect(screen.getByRole('textbox')).toBe(input);
      expect(input).toHaveFocus();
      expect(input).toHaveValue('Edited');
      expect(screen.getByRole('main').children).toHaveLength(
        heading === undefined ? 1 : 2,
      );
    }
  });

  it('preserves supplied empty ReactNode slots instead of guessing their visibility', () => {
    const { rerender } = render(<Screen heading={null}>Content</Screen>);
    for (const heading of [null, false, true, '', <span key="empty" />]) {
      rerender(<Screen heading={heading}>Content</Screen>);
      expect(screen.getByRole('main').children).toHaveLength(2);
    }
    rerender(<Screen heading={undefined}>Content</Screen>);
    expect(screen.getByRole('main').children).toHaveLength(1);
  });

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
