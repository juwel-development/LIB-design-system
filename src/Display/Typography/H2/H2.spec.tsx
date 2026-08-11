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

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H2 testId={'section-title'}>Section</H2>);
    expect(screen.getByTestId('section-title')).toBeInTheDocument();
  });
});
