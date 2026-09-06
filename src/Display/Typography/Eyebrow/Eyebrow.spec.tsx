import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Eyebrow } from './Eyebrow';

const statusTones = ['success', 'warning', 'error', 'info'] as const;

describe('Eyebrow', () => {
  it('offers the complete selectable typography colour family', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof Eyebrow>['color']>
    >().toEqualTypeOf<
      'foreground' | 'muted' | 'success' | 'warning' | 'error' | 'info'
    >();
  });

  it('renders its content as a paragraph at the label role', () => {
    render(<Eyebrow>Case studies</Eyebrow>);
    expect(screen.getByText('Case studies').tagName).toBe('P');
  });

  it.each(statusTones)(
    'leaves the rendered paragraph semantics unchanged when the %s status tone is selected',
    (color) => {
      render(<Eyebrow color={color}>Patience is low.</Eyebrow>);
      const eyebrow = screen.getByText('Patience is low.');
      expect(eyebrow.tagName).toBe('P');
      expect(eyebrow).not.toHaveAttribute('role');
      expect(eyebrow).not.toHaveAttribute('aria-live');
      expect(eyebrow.childElementCount).toBe(0);
    },
  );

  it('takes the muted colour role by default, because the device is defined as muted', () => {
    render(<Eyebrow>Case studies</Eyebrow>);
    expect(screen.getByText('Case studies')).toHaveClass('text-muted');
  });

  it('takes the foreground colour role when asked, and nothing else paints text', () => {
    render(<Eyebrow color={'foreground'}>Case studies</Eyebrow>);
    const eyebrow = screen.getByText('Case studies');
    expect(eyebrow).toHaveClass('text-foreground');
    expect(eyebrow).not.toHaveClass('text-muted');
  });

  it('reads the secondary family, label size and label tracking roles', () => {
    render(<Eyebrow>Case studies</Eyebrow>);
    expect(screen.getByText('Case studies')).toHaveClass(
      'font-secondary',
      'text-label',
      'tracking-label',
    );
  });

  it('exposes the one sanctioned host hook through testId', () => {
    render(<Eyebrow testId={'section-label'}>Case studies</Eyebrow>);
    expect(screen.getByTestId('section-label')).toBeInTheDocument();
  });
});
