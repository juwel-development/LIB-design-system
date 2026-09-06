import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { H5 } from './H5';

const statusTones = ['success', 'warning', 'error', 'info'] as const;

describe('H5', () => {
  it('offers the complete selectable typography colour family', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof H5>['color']>
    >().toEqualTypeOf<
      'foreground' | 'muted' | 'success' | 'warning' | 'error' | 'info'
    >();
  });

  it('renders its content as a level-5 heading at the body role', () => {
    render(<H5>Detail</H5>);
    expect(
      screen.getByRole('heading', { level: 5, name: 'Detail' }),
    ).toBeInTheDocument();
  });

  it.each(statusTones)(
    'leaves the rendered heading semantics unchanged when the %s status tone is selected',
    (color) => {
      render(<H5 color={color}>Patience is low.</H5>);
      const heading = screen.getByRole('heading', {
        level: 5,
        name: 'Patience is low.',
      });
      expect(heading).not.toHaveAttribute('role');
      expect(heading).not.toHaveAttribute('aria-live');
      expect(heading.childElementCount).toBe(0);
    },
  );

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H5 testId={'detail-title'}>Detail</H5>);
    expect(screen.getByTestId('detail-title')).toBeInTheDocument();
  });
});
