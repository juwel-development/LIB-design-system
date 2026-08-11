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

  it('takes no tracking at all, the floor under the large-type correction', () => {
    // The correction stops at the title role (#57). The subtitle role is the first one below it, so
    // this is where the floor is pinned - an optical correction reaching ordinary type is the failure
    // docs/adr/0004 records, one rung earlier.
    render(<H3 testId={'subsection-title'}>Subsection</H3>);
    expect(screen.getByTestId('subsection-title').className).not.toContain(
      'tracking-',
    );
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H3 testId={'subsection-title'}>Subsection</H3>);
    expect(screen.getByTestId('subsection-title')).toBeInTheDocument();
  });
});
