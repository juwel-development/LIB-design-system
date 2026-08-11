import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { P } from './P';

describe('P', () => {
  it('renders its content as a paragraph at the body role', () => {
    render(<P>Body copy.</P>);
    expect(screen.getByText('Body copy.').tagName).toBe('P');
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<P testId={'lead'}>Body copy.</P>);
    expect(screen.getByTestId('lead')).toBeInTheDocument();
  });
});
