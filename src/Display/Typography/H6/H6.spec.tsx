import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { H6 } from './H6';

const statusTones = ['success', 'warning', 'error', 'info'] as const;

describe('H6', () => {
  it('offers the complete selectable typography colour family', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof H6>['color']>
    >().toEqualTypeOf<
      'foreground' | 'muted' | 'success' | 'warning' | 'error' | 'info'
    >();
  });

  it('renders its content as a level-6 heading at the body role', () => {
    render(<H6>Detail</H6>);
    expect(
      screen.getByRole('heading', { level: 6, name: 'Detail' }),
    ).toBeInTheDocument();
  });

  it.each(statusTones)(
    'leaves the rendered heading semantics unchanged when the %s status tone is selected',
    (color) => {
      render(<H6 color={color}>Patience is low.</H6>);
      const heading = screen.getByRole('heading', {
        level: 6,
        name: 'Patience is low.',
      });
      expect(heading).not.toHaveAttribute('role');
      expect(heading).not.toHaveAttribute('aria-live');
      expect(heading.childElementCount).toBe(0);
    },
  );

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H6 testId={'detail-title'}>Detail</H6>);
    expect(screen.getByTestId('detail-title')).toBeInTheDocument();
  });
});
