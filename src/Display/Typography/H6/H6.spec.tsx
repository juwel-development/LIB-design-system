import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { H6 } from './H6';

const statusTones = ['success', 'warning', 'error', 'info'] as const;
const selectableColours = ['foreground', 'muted', ...statusTones] as const;

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

  it('keeps foreground as its default and keeps the existing muted option', () => {
    render(
      <>
        <H6>Default</H6>
        <H6 color={'muted'}>Muted</H6>
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Default' })).toHaveClass(
      'text-foreground',
    );
    expect(screen.getByRole('heading', { name: 'Muted' })).toHaveClass(
      'text-muted',
    );
  });

  it.each(statusTones)(
    'reinforces its content with the %s status tone without changing the heading or adding announcement semantics',
    (color) => {
      render(<H6 color={color}>Patience is low.</H6>);
      const heading = screen.getByRole('heading', {
        level: 6,
        name: 'Patience is low.',
      });
      expect(heading).toHaveClass(`text-${color}`);
      expect(
        selectableColours.filter((role) =>
          heading.classList.contains(`text-${role}`),
        ),
      ).toEqual([color]);
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
