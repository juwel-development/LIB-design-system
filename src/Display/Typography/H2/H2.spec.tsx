import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { H2 } from './H2';

const statusTones = ['success', 'warning', 'error', 'info'] as const;

describe('H2', () => {
  it('offers the complete selectable typography colour family', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof H2>['color']>
    >().toEqualTypeOf<
      'foreground' | 'muted' | 'success' | 'warning' | 'error' | 'info'
    >();
  });

  it('renders its content as a level-2 heading, binding the outline level to the title role', () => {
    render(<H2>Section</H2>);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Section' }),
    ).toBeInTheDocument();
  });

  it.each(statusTones)(
    'leaves the rendered heading semantics unchanged when the %s status tone is selected',
    (color) => {
      render(<H2 color={color}>Patience is low.</H2>);
      const heading = screen.getByRole('heading', {
        level: 2,
        name: 'Patience is low.',
      });
      expect(heading).not.toHaveAttribute('role');
      expect(heading).not.toHaveAttribute('aria-live');
      expect(heading.childElementCount).toBe(0);
    },
  );

  it('carries the same optical correction as the page head, the title role rendered one way', () => {
    // The title role is rendered by two components - this and PageHead's h1 - and they must agree, or
    // one role reads two ways (docs/adr/0005). The title role is also the smallest that takes the
    // correction: H3 down carries none (#57).
    render(<H2 testId={'section-title'}>Section</H2>);
    const heading = screen.getByTestId('section-title');
    expect(heading).toHaveClass('tracking-optical');
    expect(heading.className).not.toContain('tracking-label');
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<H2 testId={'section-title'}>Section</H2>);
    expect(screen.getByTestId('section-title')).toBeInTheDocument();
  });
});
