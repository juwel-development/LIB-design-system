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

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H1 testId={'page-title'}>Welcome</H1>);
    expect(screen.getByTestId('page-title')).toBeInTheDocument();
  });
});
