import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { H4 } from './H4';

describe('H4', () => {
  it('renders its content as a level-4 heading at the body role', () => {
    render(<H4>Detail</H4>);
    expect(
      screen.getByRole('heading', { level: 4, name: 'Detail' }),
    ).toBeInTheDocument();
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H4 testId={'detail-title'}>Detail</H4>);
    expect(screen.getByTestId('detail-title')).toBeInTheDocument();
  });
});
