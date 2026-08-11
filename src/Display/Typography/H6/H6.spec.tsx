import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { H6 } from './H6';

describe('H6', () => {
  it('renders its content as a level-6 heading at the body role', () => {
    render(<H6>Detail</H6>);
    expect(
      screen.getByRole('heading', { level: 6, name: 'Detail' }),
    ).toBeInTheDocument();
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H6 testId={'detail-title'}>Detail</H6>);
    expect(screen.getByTestId('detail-title')).toBeInTheDocument();
  });
});
