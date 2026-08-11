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

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H1 testId={'page-title'}>Welcome</H1>);
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
  });
});
