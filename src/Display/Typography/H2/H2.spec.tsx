import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { H2 } from './H2';

describe('H2', () => {
  it('renders its content as a level-2 heading, binding the outline level to the title role', () => {
    render(<H2>Section</H2>);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Section' }),
    ).toBeInTheDocument();
  });

  it('carries the same optical correction as the page head, the title role rendered one way', () => {
    // The title role is rendered by two components - this and PageHead's h1 - and they must agree, or
    // one role reads two ways (docs/adr/0005). The title role is also the smallest that takes the
    // correction: H3 down carries none (#57).
    render(<H2 testId={'section-title'}>Section</H2>);
    const heading = screen.getByTestId('section-title');
    expect(heading).toHaveClass('tracking-optical');
    expect(heading.className).not.toContain('tracking-label');
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H2 testId={'section-title'}>Section</H2>);
    expect(screen.getByTestId('section-title')).toBeInTheDocument();
  });
});
