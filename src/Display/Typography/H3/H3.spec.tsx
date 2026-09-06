import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { H3 } from './H3';

const statusTones = ['success', 'warning', 'error', 'info'] as const;
const selectableColours = ['foreground', 'muted', ...statusTones] as const;

describe('H3', () => {
  it('offers the complete selectable typography colour family', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof H3>['color']>
    >().toEqualTypeOf<
      'foreground' | 'muted' | 'success' | 'warning' | 'error' | 'info'
    >();
  });

  it('renders its content as a level-3 heading, binding the outline level to the subtitle role', () => {
    render(<H3>Subsection</H3>);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Subsection' }),
    ).toBeInTheDocument();
  });

  it('keeps foreground as its default and keeps the existing muted option', () => {
    render(
      <>
        <H3>Default</H3>
        <H3 color={'muted'}>Muted</H3>
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
      render(<H3 color={color}>Patience is low.</H3>);
      const heading = screen.getByRole('heading', {
        level: 3,
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
