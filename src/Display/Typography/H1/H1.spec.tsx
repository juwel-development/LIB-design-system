import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { H1 } from './H1';

describe('H1', () => {
  // The utilities as a *set*. Which order the class attribute lists them in decides nothing -
  // precedence comes from the stylesheet - so nothing here pins the order the recipe declares in.
  const utilities = (element: Element) =>
    element.className.split(/\s+/).filter(Boolean);

  // Every value of the one variant, rendered together and returned by test id. What the base fixes -
  // the face, the size, the leading, the tracking and the measure - holds across both, so the tests
  // that assert on the base walk this rather than sampling one of them.
  const renderEveryColour = () => {
    render(
      <>
        <H1 testId={'default'}>Welcome</H1>
        <H1 color={'foreground'} testId={'foreground'}>
          Welcome
        </H1>
        <H1 color={'muted'} testId={'muted'}>
          Welcome
        </H1>
      </>,
    );
    return ['default', 'foreground', 'muted'];
  };

  it('renders its content as a level-1 heading, binding the outline level to the display role', () => {
    render(<H1>Welcome</H1>);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeInTheDocument();
  });

  it('carries the large-type optical correction and never the label tracking', () => {
    // Two quantities on one property that must not collapse (docs/adr/0004): the correction belongs to
    // the biggest type on the page, the fixed letter-spacing to the label device. #57 settled the
    // scope after the correction shipped on the subpage head while the hero went without.
    render(<H1 testId={'page-title'}>Welcome</H1>);
    const heading = screen.getByTestId('page-title');
    expect(heading).toHaveClass('tracking-optical');
    expect(heading.className).not.toContain('tracking-label');
  });

  it('bounds its line at the display measure in every colour, so the bound sits on the base', () => {
    // The display role's measure is narrower than the reading column because bigger type wants fewer
    // characters per line (docs/adr/0004). It holds under every `color`, so it belongs to the base and
    // not to a variant - pinned across all of them so a later variant refactor cannot drop it silently.
    for (const id of renderEveryColour()) {
      expect(utilities(screen.getByTestId(id))).toContain(
        'max-w-[var(--measure-display)]',
      );
    }
  });

  it('reads the bound from the measure token and never from a character count of its own', () => {
    // A `ch` count written here would be the token's value copied, and a consumer re-pointing
    // `--measure-display` would move the token while the heading stayed where the library left it.
    for (const id of renderEveryColour()) {
      const bounds = utilities(screen.getByTestId(id)).filter((utility) =>
        utility.startsWith('max-w-'),
      );
      expect(bounds).toEqual(['max-w-[var(--measure-display)]']);
    }
  });

  it('takes the display measure and never the reading column or the wide one', () => {
    // One measure role per type role (docs/adr/0008): the level fixes the role and the role fixes the
    // measure, so there is nothing for a caller to select between and no second bound on offer.
    for (const id of renderEveryColour()) {
      const className = screen.getByTestId(id).className;
      expect(className).not.toContain('--measure)');
      expect(className).not.toContain('--measure-wide');
    }
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H1 testId={'page-title'}>Welcome</H1>);
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
  });
});
