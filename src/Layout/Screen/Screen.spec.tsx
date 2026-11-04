import { Pane } from 'Layout/Pane/Pane';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Screen } from './Screen';

describe('Screen', () => {
  it('supplies one main with the consumer heading before its content', () => {
    render(
      <Screen heading={<h1>Workspace</h1>} testId="workspace">
        <button type="button">Choose</button>
      </Screen>,
    );
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-testid', 'workspace');
    expect(main).not.toHaveAttribute('tabindex');
    expect(
      screen
        .getByRole('heading')
        .compareDocumentPosition(screen.getByRole('button')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
  it('keeps the same focused input and selection through every absent heading form', () => {
    const { rerender } = render(
      <Screen heading={<h1>Workspace</h1>}>
        <input aria-label="Search" defaultValue="written" />
      </Screen>,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'retained text' } });
    input.setSelectionRange(2, 6);
    for (const heading of [
      undefined,
      null,
      false,
      <h1 key="heading">Again</h1>,
    ]) {
      rerender(
        <Screen heading={heading}>
          <input aria-label="Search" defaultValue="written" />
        </Screen>,
      );
      expect(screen.getByRole('textbox')).toBe(input);
      expect(input).toHaveFocus();
      expect(input).toHaveValue('retained text');
      expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
    }
  });
  it('accepts a heading inside the panel without a second heading region', () => {
    render(
      <Screen>
        <Pane.Root>
          <Pane.Head>
            <h1>Entries</h1>
          </Pane.Head>
          <Pane.Body ariaLabel="Entries">
            <button type="button">Choose</button>
          </Pane.Body>
        </Pane.Root>
      </Screen>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('main').children).toHaveLength(1);
  });
  it.each([undefined, null, false])(
    'reserves no heading region for %s',
    (heading) => {
      render(
        <Screen heading={heading}>
          <p>Content</p>
        </Screen>,
      );
      expect(screen.getByRole('main').children).toHaveLength(1);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    },
  );
  it('does not infer the output of a custom heading component', () => {
    const Empty = () => null;
    render(
      <Screen heading={<Empty />}>
        <p>Content</p>
      </Screen>,
    );
    expect(screen.getByRole('main').children).toHaveLength(2);
  });
});
