import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { H1 } from './H1';

describe('H1', () => {
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

  it('bounds its line at the display measure under every colour, so the bound sits on the base', () => {
    // Rendering every `color` and asserting the same bound on each is what pins it to the base: a
    // refactor that moved it onto one variant leaves the others unbounded and fails here. The set is
    // exact rather than a `toContain`, so a literal `ch` count beside the token - the token's value
    // copied, which a consumer re-pointing `--measure-display` would then not move - fails too.
    render(
      <>
        <H1>Welcome</H1>
        <H1 color={'foreground'}>Welcome</H1>
        <H1 color={'muted'}>Welcome</H1>
      </>,
    );
    for (const heading of screen.getAllByRole('heading', { level: 1 })) {
      const bounds = heading.className
        .split(/\s+/)
        .filter((utility) => utility.startsWith('max-w-'));
      expect(bounds).toEqual(['max-w-[var(--measure-display)]']);
    }
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H1 testId={'page-title'}>Welcome</H1>);
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
  });
});
