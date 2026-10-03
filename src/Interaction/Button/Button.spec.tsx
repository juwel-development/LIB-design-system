import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Subject } from 'rxjs';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
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
    // so an unrelated number like a duration does not trip it.
    expect(className).not.toMatch(
      /(?:bg|text|ring|border|from|via|to)-[a-z]+-(?:50|[1-9]00)\b/,
    );
  });

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
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

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
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

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'styles its corner from the radius token on the %s variant, never a rounded-* literal',
    (variant) => {
      render(<Button variant={variant}>Click Me</Button>);
      const className = screen.getByRole('button').className;

      // The corner is one named token every control reads, set once in the base so no variant can
      // disagree - a consumer theme re-points --radius-control to move it. rounded-lg (0.5rem) is
      // what it defaults to, so nothing changes visually.
      expect(className).toContain('rounded-[var(--radius-control)]');
      expect(className).not.toContain('rounded-lg');
      expect(className).not.toMatch(/rounded-(?!\[var\(--radius-)/);
    },
  );

  it.each(['primary', 'secondary', 'outline', 'destructive'] as const)(
    'floors its width from the control-min-width token on the %s variant, never a raw min-w-* literal',
    (variant) => {
      render(<Button variant={variant}>Click Me</Button>);
      const className = screen.getByRole('button').className;

      // The minimum width is one named token primary and secondary share, so a consumer theme can
      // re-point --control-min-width to lower or zero the floor under a compact actions row. 10.5rem
      // is what it defaults to, so nothing changes visually. ghost keeps its own explicit zero.
      expect(className).toContain('min-w-[var(--control-min-width)]');
      expect(className).not.toMatch(/min-w-(?!\[var\(--control-min-width)/);
    },
  );

  it('keeps its distinct zero floor on the ghost variant, not the shared token', () => {
    render(<Button variant={'ghost'}>Click Me</Button>);
    const className = screen.getByRole('button').className;

    // ghost carrying no minimum is an intentional role, not the token set to zero, so it stays a
    // literal min-w-0 and is untouched by --control-min-width.
    expect(className).toContain('min-w-0');
    expect(className).not.toContain('--control-min-width');
  });

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'draws one focus ring as an outline on the %s variant, identical across variants and never a box-shadow ring',
    (variant) => {
      render(<Button variant={variant}>Click Me</Button>);
      const className = screen.getByRole('button').className;

      // One ring for every variant - colour, width and offset from the shared tokens, drawn with
      // outline. Tailwind's ring compiles to box-shadow, which is not rendered in forced-colors
      // mode, so no ring-*/ring-offset-*/outline-none survives on any variant.
      expect(className).toContain('outline-focus-ring');
      expect(className).toContain('outline-offset-[var(--focus-ring-offset)]');
      expect(className).toContain(
        'focus-visible:outline-[length:var(--focus-ring-width)]',
      );
      expect(className).not.toMatch(/(?:^|\s|:)ring-/);
      expect(className).not.toContain('outline-none');
    },
  );

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'sets the focus-ring colour at rest on the %s variant, so it cannot fade in on focus',
    (variant) => {
      render(<Button variant={variant}>Click Me</Button>);
      const className = screen.getByRole('button').className;

      // outline-color is in Tailwind's colours group and would transition; a ring that fades is
      // briefly invisible. Colour at rest, only width and style toggle on focus-visible.
      expect(className).toContain('outline-focus-ring');
      expect(className).not.toContain('focus-visible:outline-focus-ring');
    },
  );

  it('draws the ghost hover underline from the library underline tokens, not the browser default', () => {
    render(<Button variant={'ghost'}>Click Me</Button>);
    const className = screen.getByRole('button').className;

    // The line appears on hover, so it takes --underline-thickness and --underline-offset like
    // Link's appearing treatments - never --underline-thickness-hover, which names the thickened
    // state of a line already on screen (docs/adr/0006). Instant by construction: decoration is off
    // the transition allowlist (docs/adr/0001), so no transition-* is set on it.
    expect(className).toContain(
      'hover:decoration-[length:var(--underline-thickness)]',
    );
    expect(className).toContain(
      'hover:underline-offset-[var(--underline-offset)]',
    );
    expect(className).not.toContain('--underline-thickness-hover');
    expect(className).not.toMatch(/transition-\[?[^ ]*decoration/);
  });

  it('exposes an accessible name for icon-only buttons', () => {
    render(<Button ariaLabel={'Close'} />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'sets the content face for the %s variant, so an action reads in the face the theme gave actions (#90)',
    (variant) => {
      render(<Button variant={variant}>Send</Button>);

      // docs/adr/0004, the amendment: actions are `primary`. It sits in the base, so no variant
      // can disagree - the move the radius, the ring and the colour transition already make.
      expect(screen.getByRole('button').className).toContain('font-primary');
    },
  );

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'sizes the %s variant at the body role, carried by the base so no variant can disagree (#92)',
    (variant) => {
      render(<Button variant={variant}>Send</Button>);

      // docs/adr/0004, the size amendment: the button's own height is driven by its font-size, so
      // the size sits in the base beside the radius, the ring and the colour transition rather
      // than being repeated - or contradicted - per variant.
      expect(screen.getByRole('button').className).toContain('text-body');
    },
  );

  it('renders the same size wherever it is placed, so its height belongs to the component and not to the page around it (#92)', () => {
    // The defect: with no size of its own the button inherited one, so the same variant stood
    // taller in a reading column than in a header. jsdom lays nothing out, so what is checkable is
    // that the button names a size itself and names the same one in both containers.
    render(
      <>
        <div className={'text-small'}>
          <Button>Send</Button>
        </div>
        <div className={'text-label'}>
          <Button>Send</Button>
        </div>
      </>,
    );

    const [inFooter, inHeader] = screen.getAllByRole('button');
    expect(inFooter?.className).toContain('text-body');
    expect(inHeader?.className).toBe(inFooter?.className);
  });

  it('keeps a closed prop surface: the two game action variants and the inline fit arrive as named props, not an attribute bag (#119)', () => {
    expectTypeOf<keyof ComponentProps<typeof Button>>().toEqualTypeOf<
      | 'children'
      | 'onClick$'
      | 'disabled'
      | 'testId'
      | 'ariaLabel'
      | 'type'
      | 'variant'
      | 'inline'
    >();
    expectTypeOf<ComponentProps<typeof Button>['variant']>().toEqualTypeOf<
      | 'primary'
      | 'secondary'
      | 'ghost'
      | 'outline'
      | 'destructive'
      | null
      | undefined
    >();
    expectTypeOf<ComponentProps<typeof Button>['inline']>().toEqualTypeOf<
      boolean | null | undefined
    >();
  });

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'keeps its accessible name from its label on the %s variant, so a tone never replaces the words (#119)',
    (variant) => {
      render(<Button variant={variant}>Vertrag beenden</Button>);
      expect(
        screen.getByRole('button', { name: 'Vertrag beenden' }),
      ).toBeInTheDocument();
    },
  );

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'names an icon-only %s button through ariaLabel, so a symbol-only destructive action still says what it does (#119)',
    (variant) => {
      render(<Button variant={variant} ariaLabel={'Delete contract'} />);
      expect(
        screen.getByRole('button', { name: 'Delete contract' }),
      ).toBeInTheDocument();
    },
  );

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'is natively disabled and emits nothing on the %s variant when disabled (#119)',
    (variant) => {
      const onClick$ = new Subject<void>();
      const handleClick = vi.fn();
      onClick$.subscribe(handleClick);
      render(
        <Button variant={variant} onClick$={onClick$} disabled={true}>
          Entfernen
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Entfernen' });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    },
  );

  it('draws the outline variant as an unfilled control: boundary from controlBorder, no fill, foreground text (#119)', () => {
    render(<Button variant={'outline'}>Filter zurücksetzen</Button>);
    const className = screen.getByRole('button').className;

    // The quiet secondary is identified by its edge, the way Input and TextArea are: the one
    // boundary role an unfilled control reads (>=3:1 against surface), never a fill and never a
    // shade. It keeps the control inset and the control minimum width, so it aligns beside primary.
    expect(className).toContain('border-control-border');
    expect(className).toContain('bg-transparent');
    expect(className).toContain('text-foreground');
    expect(className).not.toContain('bg-secondary');
    expect(className).not.toContain('dark:');
    expect(className).not.toMatch(
      /(?:bg|text|ring|border|from|via|to)-[a-z]+-(?:50|[1-9]00)\b/,
    );
  });

  it('tints the outline variant with backing on hover, the plate already constrained to carry foreground text (#119)', () => {
    render(<Button variant={'outline'}>Filter zurücksetzen</Button>);
    const className = screen.getByRole('button').className;

    expect(className).toContain('hover:bg-backing');
    expect(className).not.toContain('hover:underline');
  });

  it('draws the destructive variant in the error tone on boundary and text, and fills with it on hover carrying surface as ink (#119)', () => {
    render(<Button variant={'destructive'}>Vertrag beenden</Button>);
    const className = screen.getByRole('button').className;

    // error is a general status tone (docs/adr/0011) at >=4.5:1 against surface. Contrast is
    // symmetric, so that one constraint also carries surface as the ink on an error fill - which
    // is why the hover inverts to the tone rather than tinting with backing, where error text
    // falls below 4.5:1 in the shipped light theme (4.11:1).
    expect(className).toContain('border-error');
    expect(className).toContain('text-error');
    expect(className).toContain('bg-transparent');
    expect(className).toContain('hover:bg-error');
    expect(className).toContain('hover:text-surface');
    expect(className).not.toContain('hover:bg-backing');
    expect(className).not.toContain('dark:');
  });

  it.each(['outline', 'destructive'] as const)(
    'disables the %s variant the way an unfilled control does: boundary and text go to the disabled tones, no grey fill appears (#119)',
    (variant) => {
      render(
        <Button variant={variant} disabled={true}>
          Entfernen
        </Button>,
      );
      const className = screen.getByRole('button').className;

      expect(className).toContain('disabled:border-disabled');
      expect(className).toContain('disabled:text-muted');
      expect(className).not.toContain('disabled:bg-disabled');
      expect(className).not.toContain('disabled:hover:bg-disabled-hover');
    },
  );

  it.each(['primary', 'secondary', 'ghost'] as const)(
    'keeps the %s variant disabled appearance it shipped with, so nothing already on a page moves (#119)',
    (variant) => {
      render(
        <Button variant={variant} disabled={true}>
          Entfernen
        </Button>,
      );
      const className = screen.getByRole('button').className;

      expect(className).toContain('disabled:bg-disabled');
      expect(className).toContain('disabled:hover:bg-disabled-hover');
    },
  );

  it.each(['primary', 'secondary', 'outline', 'destructive'] as const)(
    'sizes an inline %s button to its content: the control minimum width is dropped and the inset is the field inset (#119)',
    (variant) => {
      render(
        <Button variant={variant} inline={true}>
          Öffnen
        </Button>,
      );
      const className = screen.getByRole('button').className;

      // Structural, not a token choice (docs/adr/0008): whether the floor applies at all. A faced
      // action in a table cell or beside a field takes its content's width and the px-3 inset
      // every field control already renders, so the two sit flush.
      expect(className).toContain('min-w-0');
      expect(className).not.toContain('--control-min-width');
      expect(className).toContain('px-3');
      expect(className).not.toMatch(/(?:^|\s)px-4(?:\s|$)/);
      expect(className).not.toContain('sm:px-6');
    },
  );

  it.each(['primary', 'secondary', 'outline', 'destructive'] as const)(
    'keeps the control minimum width on the %s variant unless asked to be inline (#119)',
    (variant) => {
      render(<Button variant={variant}>Öffnen</Button>);
      const className = screen.getByRole('button').className;

      expect(className).toContain('min-w-[var(--control-min-width)]');
      expect(className).not.toMatch(/(?:^|\s)min-w-0(?:\s|$)/);
    },
  );

  it('renders a ghost button identically with and without inline, since it never had a floor to drop (#119)', () => {
    render(
      <>
        <Button variant={'ghost'}>Öffnen</Button>
        <Button variant={'ghost'} inline={true}>
          Öffnen
        </Button>
      </>,
    );
    const [plain, inline] = screen.getAllByRole('button');
    expect(inline?.className).toBe(plain?.className);
  });

  it.each(['primary', 'secondary', 'ghost', 'outline', 'destructive'] as const)(
    'lets a long label wrap on the %s variant where the layout constrains it, in balanced lines, instead of forcing one line (#119)',
    (variant) => {
      render(
        <Button variant={variant}>
          Marktforschungsschwerpunkt festlegen und Bericht öffnen
        </Button>,
      );
      const className = screen.getByRole('button').className;

      // jsdom lays nothing out; what is checkable is that no rule forbids the break. The line is
      // only ever broken where the holder is narrower than the words, which is the case that used
      // to overflow - a short label in a wide row renders exactly as before.
      expect(className).not.toContain('text-nowrap');
      expect(className).not.toContain('whitespace-nowrap');
      expect(className).toContain('text-balance');
      // No forced break inside a word, as nowhere else in the library: a word wider than the
      // holder is wording to shorten, and a soft break would let a row squeeze a button to letters.
      expect(className).not.toMatch(
        /wrap-anywhere|wrap-break-word|break-all|break-words/,
      );
    },
  );
});
