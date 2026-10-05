import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Icon } from './Icon';

const names = ['sort', 'sort-ascending', 'sort-descending'] as const;

const addedNames = ['bin', 'bubble-exclamation', 'bubble-tick'] as const;
const everyName = [...names, ...addedNames] as const;
const colors = ['muted', 'success', 'warning', 'error', 'info'] as const;

const colorClassesOf = (icon: HTMLElement): string[] =>
  Array.from(icon.classList).filter((name) => name.startsWith('text-'));

const drawingOf = (testId: string): string =>
  Array.from(screen.getByTestId(testId).querySelectorAll('path'))
    .map((path) => path.getAttribute('d'))
    .join(' ');

describe('Icon', () => {
  it.each(names)(
    'renders %s as an inline svg hidden from assistive technology and out of the tab order, so the containing control supplies the only spoken name',
    (name) => {
      render(<Icon name={name} testId={'icon'} />);
      const icon = screen.getByTestId('icon');
      expect(icon.tagName.toLowerCase()).toBe('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
      expect(icon).not.toHaveAttribute('tabindex');
      expect(icon).not.toHaveAttribute('role');
      expect(icon).not.toHaveAttribute('aria-label');
    },
  );

  it('draws three distinguishable shapes, so the ordering is told apart by form rather than by colour or size', () => {
    render(
      <>
        <Icon name={'sort'} testId={'unsorted'} />
        <Icon name={'sort-ascending'} testId={'ascending'} />
        <Icon name={'sort-descending'} testId={'descending'} />
      </>,
    );
    const drawings = [
      drawingOf('unsorted'),
      drawingOf('ascending'),
      drawingOf('descending'),
    ];
    expect(new Set(drawings).size).toBe(3);
    for (const drawing of drawings) expect(drawing).not.toBe('');
  });

  it.each(names)(
    'scales %s with the surrounding text and takes its colour from it, so it sits in a muted header cell or a body line alike',
    (name) => {
      render(<Icon name={name} testId={'icon'} />);
      const icon = screen.getByTestId('icon');
      // 1em sizes the glyph from the font-size it sits in; currentColor takes the text colour.
      expect(icon).toHaveAttribute('width', '1em');
      expect(icon).toHaveAttribute('height', '1em');
      for (const path of icon.querySelectorAll('path')) {
        expect(path).toHaveAttribute('stroke', 'currentColor');
        expect(path).toHaveAttribute('fill', 'none');
      }
    },
  );

  it('adds nothing to the accessibility tree inside a named button, so the button label is spoken once', () => {
    render(
      <button type={'button'}>
        Name <Icon name={'sort-ascending'} />
      </button>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Name');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders no name of its own, so meaning comes from the control or text beside it', () => {
    const { container } = render(<Icon name={'sort'} />);
    expect(container).toHaveTextContent('');
  });

  it('offers six drawings named for their shape, never for a state or an action (#126)', () => {
    expectTypeOf<ComponentProps<typeof Icon>['name']>().toEqualTypeOf<
      (typeof everyName)[number]
    >();
  });

  it.each(addedNames)(
    'renders %s hidden, out of the tab order, sized in em and stroked in the text colour, like every drawing before it (#126)',
    (name) => {
      render(<Icon name={name} testId={'icon'} />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
      expect(icon).not.toHaveAttribute('tabindex');
      expect(icon).not.toHaveAttribute('role');
      expect(icon).not.toHaveAttribute('aria-label');
      expect(icon).toHaveAttribute('width', '1em');
      expect(icon).toHaveAttribute('height', '1em');
      for (const path of icon.querySelectorAll('path')) {
        expect(path).toHaveAttribute('stroke', 'currentColor');
        expect(path).toHaveAttribute('fill', 'none');
      }
    },
  );

  it('draws six distinct path sets, so no two names share a shape (#126)', () => {
    render(
      everyName.map((name) => <Icon key={name} name={name} testId={name} />),
    );
    const drawings = everyName.map(drawingOf);
    expect(new Set(drawings).size).toBe(6);
    for (const drawing of drawings) expect(drawing).not.toBe('');
  });

  it('tells the two bubbles apart by the mark inside one shared outline, so the two forms of a state differ in shape and not in colour (#126)', () => {
    render(
      <>
        <Icon name={'bubble-exclamation'} testId={'exclamation'} />
        <Icon name={'bubble-tick'} testId={'tick'} />
      </>,
    );
    const segmentsOf = (testId: string): (string | null)[] =>
      Array.from(screen.getByTestId(testId).querySelectorAll('path')).map(
        (path) => path.getAttribute('d'),
      );
    const exclamation = segmentsOf('exclamation');
    const tick = segmentsOf('tick');
    expect(exclamation[0]).toBe(tick[0]);
    expect(exclamation.slice(1)).not.toEqual(tick.slice(1));
  });

  it.each(everyName)(
    'becomes a status mark when %s is given a label: one image named by the label alone, still out of the tab order (#126)',
    (name) => {
      render(<Icon name={name} label={'Wartet auf Antwort'} />);
      const mark = screen.getByRole('img', { name: 'Wartet auf Antwort' });
      expect(screen.getAllByRole('img')).toHaveLength(1);
      expect(mark.tagName.toLowerCase()).toBe('svg');
      expect(mark).not.toHaveAttribute('aria-hidden');
      expect(mark).toHaveAttribute('focusable', 'false');
      expect(mark).not.toHaveAttribute('tabindex');
      // The name comes from the label only: nothing inside the svg can add to or replace it.
      expect(mark).toHaveTextContent('');
      expect(mark.querySelector('title, desc, text')).toBeNull();
    },
  );

  it('stays hidden with an empty label, so an image is never exposed without a name (#126)', () => {
    render(<Icon name={'bubble-tick'} label={''} testId={'icon'} />);
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('role');
    expect(icon).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('offers muted and the four status tones as its colour, and no foreground: absent already means the surrounding text (#126)', () => {
    expectTypeOf<
      NonNullable<ComponentProps<typeof Icon>['color']>
    >().toEqualTypeOf<(typeof colors)[number]>();
  });

  it.each(colors)(
    'takes the %s role as its one colour and keeps stroking in currentColor, so the tone reaches the glyph through the text colour (#126)',
    (color) => {
      render(
        <Icon name={'bubble-exclamation'} color={color} testId={'icon'} />,
      );
      const icon = screen.getByTestId('icon');
      // docs/adr/0011, the #126 amendment: one semantic role per glyph, selected by name.
      expect(colorClassesOf(icon)).toEqual([`text-${color}`]);
      for (const path of icon.querySelectorAll('path')) {
        expect(path).toHaveAttribute('stroke', 'currentColor');
      }
    },
  );

  it.each(everyName)(
    'sets no colour of its own on %s without a colour, so the glyph keeps the colour of the text it sits in (#126)',
    (name) => {
      render(<Icon name={name} testId={'icon'} />);
      expect(colorClassesOf(screen.getByTestId('icon'))).toEqual([]);
    },
  );

  it.each(colors)(
    'changes colour only with the %s tone: no role, no name and no live region, so the label and the shape carry the status (#126)',
    (color) => {
      const { container } = render(
        <Icon name={'bubble-exclamation'} color={color} testId={'icon'} />,
      );
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toHaveAttribute('role');
      expect(icon).not.toHaveAttribute('aria-label');
      expect(
        container.querySelector('[aria-live], [role="status"]'),
      ).toBeNull();
    },
  );

  it('keeps a labelled mark a labelled image under a tone, so colour reinforces the name and never replaces it (#126)', () => {
    render(<Icon name={'bubble-tick'} label={'Beantwortet'} color={'muted'} />);
    expect(
      screen.getByRole('img', { name: 'Beantwortet' }),
    ).toBeInTheDocument();
  });
});
