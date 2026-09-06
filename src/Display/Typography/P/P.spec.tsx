import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { P } from './P';

const statusTones = ['success', 'warning', 'error', 'info'] as const;

describe('P', () => {
  it('offers the complete selectable typography colour family', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof P>['color']>
    >().toEqualTypeOf<
      'foreground' | 'muted' | 'success' | 'warning' | 'error' | 'info'
    >();
  });

  it('renders its content as a paragraph at the body role', () => {
    render(<P>Body copy.</P>);
    expect(screen.getByText('Body copy.').tagName).toBe('P');
  });

  it.each(statusTones)(
    'leaves the rendered paragraph semantics unchanged when the %s status tone is selected',
    (color) => {
      render(<P color={color}>Patience is low.</P>);
      const paragraph = screen.getByText('Patience is low.');
      expect(paragraph.tagName).toBe('P');
      expect(paragraph).not.toHaveAttribute('role');
      expect(paragraph).not.toHaveAttribute('aria-live');
      expect(paragraph).toHaveTextContent('Patience is low.');
      expect(paragraph.childElementCount).toBe(0);
    },
  );

  it('exposes the one sanctioned host hook through testId', () => {
    render(<P testId={'lead'}>Body copy.</P>);
    expect(screen.getByTestId('lead')).toBeInTheDocument();
  });
});
