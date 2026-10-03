import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollContainer } from './ScrollContainer';

const measureAs = (
  overrides: Partial<{
    scrollWidth: number;
    clientWidth: number;
    scrollHeight: number;
    clientHeight: number;
  }> = {},
) => {
  const size = {
    scrollWidth: 300,
    clientWidth: 300,
    scrollHeight: 200,
    clientHeight: 200,
    ...overrides,
  };
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(
    size.scrollWidth,
  );
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(
    size.clientWidth,
  );
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(
    size.scrollHeight,
  );
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(
    size.clientHeight,
  );
};

describe('ScrollContainer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders its children, so a consumer owns the content and the container owns only the scrolling', () => {
    measureAs();
    render(
      <ScrollContainer ariaLabel={'Specification'}>
        <p>Weight 2.4 kg</p>
      </ScrollContainer>,
    );
    expect(screen.getByText('Weight 2.4 kg')).toBeInTheDocument();
  });

  it('adds no tab stop and no group while nothing overflows, so a fitting container is invisible to the keyboard', () => {
    measureAs();
    render(
      <ScrollContainer ariaLabel={'Specification'} testId={'scroll'}>
        <p>fits</p>
      </ScrollContainer>,
    );
    const container = screen.getByTestId('scroll');
    expect(container).not.toHaveAttribute('tabindex');
    expect(container).not.toHaveAttribute('role');
    expect(container).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('becomes a keyboard-reachable group named by ariaLabel once content overflows, even when the content is entirely static', () => {
    measureAs({ scrollHeight: 800 });
    render(
      <ScrollContainer ariaLabel={'Specification'} testId={'scroll'}>
        <p>tall</p>
      </ScrollContainer>,
    );
    const group = screen.getByRole('group', { name: 'Specification' });
    expect(group).toBe(screen.getByTestId('scroll'));
    expect(group).toHaveAttribute('tabindex', '0');
    // A generic scroll wrapper is a named group, never a region landmark.
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it.each([
    ['both', { scrollWidth: 900 }, true],
    ['both', { scrollHeight: 900 }, true],
    ['horizontal', { scrollWidth: 900 }, true],
    ['horizontal', { scrollHeight: 900 }, false],
    ['vertical', { scrollHeight: 900 }, true],
    ['vertical', { scrollWidth: 900 }, false],
  ] as const)(
    'with axis %s and overflow %o is keyboard-reachable: %s - overflow on a disabled axis is clipped, not scrolled',
    (axis, overflow, isReachable) => {
      measureAs(overflow);
      render(
        <ScrollContainer
          ariaLabel={'Specification'}
          axis={axis}
          testId={'scroll'}
        >
          <p>content</p>
        </ScrollContainer>,
      );
      const container = screen.getByTestId('scroll');
      if (isReachable) {
        expect(container).toHaveAttribute('tabindex', '0');
      } else {
        expect(container).not.toHaveAttribute('tabindex');
      }
    },
  );

  it('scrolls both axes by default and clips the axis a consumer disables', () => {
    measureAs();
    const { rerender } = render(
      <ScrollContainer ariaLabel={'Specification'} testId={'scroll'}>
        <p>content</p>
      </ScrollContainer>,
    );
    const container = screen.getByTestId('scroll');
    expect(container.className).toMatch(/\boverflow-auto\b/);

    rerender(
      <ScrollContainer
        ariaLabel={'Specification'}
        axis={'horizontal'}
        testId={'scroll'}
      >
        <p>content</p>
      </ScrollContainer>,
    );
    expect(container.className).toMatch(/\boverflow-x-auto\b/);
    expect(container.className).toMatch(/\boverflow-y-hidden\b/);

    rerender(
      <ScrollContainer
        ariaLabel={'Specification'}
        axis={'vertical'}
        testId={'scroll'}
      >
        <p>content</p>
      </ScrollContainer>,
    );
    expect(container.className).toMatch(/\boverflow-y-auto\b/);
    expect(container.className).toMatch(/\boverflow-x-hidden\b/);
  });

  it('invents no bound of its own: no height, width or viewport unit, so the parent layout is the only thing that sizes it', () => {
    measureAs();
    render(
      <ScrollContainer ariaLabel={'Specification'} testId={'scroll'}>
        <p>content</p>
      </ScrollContainer>,
    );
    const className = screen.getByTestId('scroll').className;
    expect(className).not.toMatch(/(?:^|\s)(?:max-)?[hw]-(?!full\b)/);
    expect(className).not.toMatch(/\[(?:max-)?(?:height|width):/);
    expect(className).not.toMatch(/[dsl]v[hw]/);
  });

  it('re-evaluates after resizing or content changes without moving focus, and drops the stop again when the overflow goes', () => {
    measureAs();
    render(
      <ScrollContainer ariaLabel={'Specification'} testId={'scroll'}>
        <button type={'button'}>Sort</button>
      </ScrollContainer>,
    );
    const control = screen.getByRole('button', { name: 'Sort' });
    control.focus();
    const container = screen.getByTestId('scroll');
    expect(container).not.toHaveAttribute('tabindex');

    measureAs({ scrollHeight: 900 });
    fireEvent(window, new Event('resize'));
    expect(container).toHaveAttribute('tabindex', '0');
    expect(control).toHaveFocus();

    measureAs();
    fireEvent(window, new Event('resize'));
    expect(container).not.toHaveAttribute('tabindex');
    expect(control).toHaveFocus();
  });

  it('keeps its tab stop while it holds focus itself, even once the overflow goes, and drops it only after focus has left', () => {
    // Removing tabindex from the focused element would let the browser fix focus up to the body -
    // the relocation the contract forbids - so the stop outlives the overflow until focus moves on.
    measureAs({ scrollHeight: 900 });
    render(
      <ScrollContainer ariaLabel={'Specification'} testId={'scroll'}>
        <p>content</p>
      </ScrollContainer>,
    );
    const container = screen.getByTestId('scroll');
    container.focus();
    expect(container).toHaveFocus();

    measureAs();
    fireEvent(window, new Event('resize'));
    expect(container).toHaveAttribute('tabindex', '0');
    expect(container).toHaveFocus();

    act(() => container.blur());
    expect(container).not.toHaveAttribute('tabindex');
    expect(container).not.toHaveAttribute('role');
  });

  it('neither traps focus nor intercepts the keys of controls inside it, so native scrolling and native controls both work', () => {
    measureAs({ scrollHeight: 900 });
    render(
      <ScrollContainer ariaLabel={'Specification'} testId={'scroll'}>
        <button type={'button'}>Sort</button>
      </ScrollContainer>,
    );
    const control = screen.getByRole('button', { name: 'Sort' });
    control.focus();
    for (const key of ['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'Tab']) {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      control.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    // Focus moves on, out of the container, by the browser's own order - nothing holds it.
    expect(document.activeElement).toBe(control);
  });

  it('exposes the one sanctioned host hook through testId', () => {
    measureAs();
    render(
      <ScrollContainer ariaLabel={'Specification'} testId={'scroll'}>
        <p>content</p>
      </ScrollContainer>,
    );
    expect(screen.getByTestId('scroll')).toBeInTheDocument();
  });

  it('lets a child own the horizontal axis when only vertical scrolling is enabled: the content box takes the container width instead of growing to the content', () => {
    // A Table inside a vertical ScrollContainer must still scroll horizontally in its own region.
    // Were the content box allowed to grow to the table's minimum width, the table would never
    // overflow its region and the outer container - which clips its disabled axis - would hide it.
    measureAs();
    const { rerender } = render(
      <ScrollContainer ariaLabel={'Parts'} axis={'vertical'} testId={'scroll'}>
        <p>content</p>
      </ScrollContainer>,
    );
    const content = screen.getByText('content').parentElement;
    expect(content?.className).toMatch(/\bw-full\b/);
    expect(content?.className).not.toMatch(/\bw-fit\b/);

    for (const axis of ['both', 'horizontal'] as const) {
      rerender(
        <ScrollContainer ariaLabel={'Parts'} axis={axis} testId={'scroll'}>
          <p>content</p>
        </ScrollContainer>,
      );
      // With the horizontal axis enabled the box grows with unwrappable content, so a resize
      // observer on it sees horizontal growth that the container's own size never shows.
      expect(content?.className).toMatch(/\bw-fit\b/);
      expect(content?.className).toMatch(/\bmin-w-full\b/);
    }
  });

  it('insets its content by the focus ring\u2019s room, so a focusable child flush with its edge keeps a visible ring instead of having it clipped', () => {
    // An overflow box clips at its padding edge. A Table region or a button sitting flush with the
    // container would draw its outline outside that edge, where it is clipped - so the content box
    // leaves exactly the ring's width plus offset free on every side, in the ring's own tokens.
    measureAs();
    render(
      <ScrollContainer ariaLabel={'Parts'} testId={'scroll'}>
        <p>content</p>
      </ScrollContainer>,
    );
    const content = screen.getByText('content').parentElement;
    expect(content?.className).toContain(
      'p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    );
  });
});
