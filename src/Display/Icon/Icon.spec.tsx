import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

const names = ['sort', 'sort-ascending', 'sort-descending'] as const;

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
});
