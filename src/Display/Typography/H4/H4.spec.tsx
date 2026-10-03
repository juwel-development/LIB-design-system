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

  it('reads the heading family role, so a theme giving headings their own face reaches this level (#120)', () => {
    // docs/adr/0004, the amendment: a heading is the one text that departs from the content face on
    // demand, and every level departs together. Asserted on the element, so a face moved to a wrapper
    // or left on the content role fails here.
    render(<H4>Welcome</H4>);
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading.className).toContain('font-heading');
    expect(heading.className).not.toContain('font-primary');
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
