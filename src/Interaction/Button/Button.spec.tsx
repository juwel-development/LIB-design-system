import { fireEvent, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays the children content', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('has the correct button type', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('can submit a surrounding form when asked to', () => {
    render(<Button type={'submit'}>Absenden</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('stays a plain button by default, so it cannot submit a form by accident', () => {
    render(
      <form>
        <Button>Abbrechen</Button>
      </form>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('handles click events via Subjects', () => {
    const onClick$ = new Subject<void>();

    const handleClick = vi.fn();
    onClick$.subscribe(handleClick);
    render(<Button onClick$={onClick$}>Click Me</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not emit while disabled', () => {
    const onClick$ = new Subject<void>();
    const handleClick = vi.fn();
    onClick$.subscribe(handleClick);
    render(
      <Button onClick$={onClick$} disabled={true}>
        Click Me
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('reaches for semantic tokens rather than a shade, so the theme can move underneath it', () => {
    render(<Button variant={'primary'}>Click Me</Button>);
    const className = screen.getByRole('button').className;

    expect(className).toContain('bg-primary');
    expect(className).toContain('text-primary-foreground');
    // A `dark:` class would mean the variant hard-codes one theme's colour.
    expect(className).not.toContain('dark:');
    // Numeric ramp steps are what the semantic layer replaced. Scoped to the colour utilities
    // so unrelated numbers - duration-200, ring-offset-2 - do not trip it.
    expect(className).not.toMatch(
      /(?:bg|text|ring|border|from|via|to)-[a-z]+-(?:50|[1-9]00)\b/,
    );
  });

  it.each(['primary', 'secondary', 'ghost'] as const)(
    'carries no elevation on the %s variant, so press has no geometry',
    (variant) => {
      render(<Button variant={variant}>Click Me</Button>);
      const className = screen.getByRole('button').className;

      // Elevation - a raised card that depresses when pressed - is not part of the
      // colour-by-role token contract. No shadow at any state, and press has no shift.
      expect(className).not.toMatch(/shadow-/);
      expect(className).not.toMatch(/translate-/);
    },
  );

  it.each(['primary', 'secondary', 'ghost'] as const)(
    'transitions colour through the motion token on the %s variant, never transition-all or a hard-coded duration',
    (variant) => {
      render(<Button variant={variant}>Click Me</Button>);
      const className = screen.getByRole('button').className;

      // The library's one motion is a colour transition, reached through a named token so a
      // consumer and prefers-reduced-motion can re-point it. transition-all is banned - paint only.
      expect(className).toContain('transition-colors');
      expect(className).toContain('duration-[var(--motion-duration-color)]');
      expect(className).not.toContain('transition-all');
      expect(className).not.toContain('duration-200');
    },
  );

  it('exposes an accessible name for icon-only buttons', () => {
    render(<Button ariaLabel={'Close'} />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
