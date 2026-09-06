import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { H4 } from './H4';

const statusTones = ['success', 'warning', 'error', 'info'] as const;

describe('H4', () => {
  it('offers the complete selectable typography colour family', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof H4>['color']>
    >().toEqualTypeOf<
      'foreground' | 'muted' | 'success' | 'warning' | 'error' | 'info'
    >();
  });

  it('renders its content as a level-4 heading at the body role', () => {
    render(<H4>Detail</H4>);
    expect(
      screen.getByRole('heading', { level: 4, name: 'Detail' }),
    ).toBeInTheDocument();
  });

  it.each(statusTones)(
    'leaves the rendered heading semantics unchanged when the %s status tone is selected',
    (color) => {
      render(<H4 color={color}>Patience is low.</H4>);
      const heading = screen.getByRole('heading', {
        level: 4,
        name: 'Patience is low.',
      });
      expect(heading).not.toHaveAttribute('role');
      expect(heading).not.toHaveAttribute('aria-live');
      expect(heading.childElementCount).toBe(0);
    },
  );

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H4 testId={'detail-title'}>Detail</H4>);
    expect(screen.getByTestId('detail-title')).toBeInTheDocument();
  });
});
