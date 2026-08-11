import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { H3 } from './H3';

describe('H3', () => {
  it('renders its content as a level-3 heading, binding the outline level to the subtitle role', () => {
    render(<H3>Subsection</H3>);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Subsection' }),
    ).toBeInTheDocument();
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H3 testId={'subsection-title'}>Subsection</H3>);
    expect(screen.getByTestId('subsection-title')).toBeInTheDocument();
  });
});
