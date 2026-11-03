import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Shell } from 'index';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Shell', () => {
  afterEach(() => vi.restoreAllMocks());
  it.each(['console', 'page'] as const)(
    'makes overflowing %s content keyboard reachable and retains focus when overflow disappears',
    (mode) => {
      const height = vi
        .spyOn(Element.prototype, 'scrollHeight', 'get')
        .mockReturnValue(900);
      vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(300);
      render(
        <Shell mode={mode} bar="Controls" ariaLabel="Workspace">
          <main>
            <button type="button">Last action</button>
          </main>
        </Shell>,
      );
      const body = screen.getByRole('group', { name: 'Workspace' });
      expect(body).toHaveAttribute('tabindex', '0');
      body.focus();
      height.mockReturnValue(300);
      fireEvent(window, new Event('resize'));
      expect(body).toHaveFocus();
      expect(body).toHaveAttribute('tabindex', '0');
      act(() => screen.getByRole('button').focus());
      expect(body).not.toHaveAttribute('tabindex');
      expect(body).not.toHaveAttribute('aria-label');
      expect(screen.getByRole('button')).toHaveFocus();
    },
  );
  it('preserves the consumer bar and main without inventing landmarks or a tab stop for fitting content', () => {
    render(
      <Shell
        bar={<header>Run controls</header>}
        ariaLabel="Workspace"
        testId="shell"
      >
        <main>Current screen</main>
      </Shell>,
    );
    expect(screen.getByRole('banner')).toHaveTextContent('Run controls');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveTextContent('Current screen');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByTestId('shell')).toContainElement(
      screen.getByRole('main'),
    );
  });
  it('updates body keyboard access when consumer content changes without a window resize', async () => {
    const height = vi
      .spyOn(Element.prototype, 'scrollHeight', 'get')
      .mockReturnValue(200);
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(300);
    const { rerender } = render(
      <Shell bar="Controls" ariaLabel="Workspace">
        <p>Short content</p>
      </Shell>,
    );
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    height.mockReturnValue(900);
    rerender(
      <Shell bar="Controls" ariaLabel="Workspace">
        <p>Long content</p>
        <button type="button">Continue</button>
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.getByRole('group', { name: 'Workspace' })).toHaveAttribute(
        'tabindex',
        '0',
      ),
    );
    const control = screen.getByRole('button');
    control.focus();
    for (const key of ['Tab', 'ArrowDown', 'PageDown', ' ']) {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      control.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    height.mockReturnValue(200);
    rerender(
      <Shell mode="page" bar="Controls" ariaLabel="Workspace">
        <p>Short again</p>
        <button type="button">Continue</button>
      </Shell>,
    );
    await waitFor(() =>
      expect(screen.queryByRole('group')).not.toBeInTheDocument(),
    );
    expect(control).toHaveFocus();
  });
});
