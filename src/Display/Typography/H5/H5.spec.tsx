import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { H5 } from './H5';

describe('H5', () => {
  it('renders its content as a level-5 heading at the body role', () => {
    render(<H5>Detail</H5>);
    expect(
      screen.getByRole('heading', { level: 5, name: 'Detail' }),
    ).toBeInTheDocument();
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H5 testId={'detail-title'}>Detail</H5>);
    expect(screen.getByTestId('detail-title')).toBeInTheDocument();
  });
});
