import { Link } from 'Interaction/Link/Link';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Note } from './Note';

// Every prop combination the recipe can be called with, so the "emits nothing else" pins below hold
// across the whole surface rather than on the default alone.
const everyColour = [undefined, 'foreground', 'muted'] as const;

describe('Note', () => {
  it('renders its content as a paragraph in the secondary family at the small role', () => {
    render(<Note>We reply within two working days.</Note>);
    const note = screen.getByText('We reply within two working days.');
    expect(note.tagName).toBe('P');
    expect(note).toHaveClass('font-secondary', 'text-small');
  });

  it('takes the foreground colour role by default, because an annotation is read at the point of decision where an Eyebrow is skimmed past', () => {
    render(<Note>We reply within two working days.</Note>);
    const note = screen.getByText('We reply within two working days.');
    expect(note).toHaveClass('text-foreground');
    expect(note).not.toHaveClass('text-muted');
  });

  it('takes the muted colour role when asked, and nothing else paints text', () => {
    render(<Note color={'muted'}>We treat your data in confidence.</Note>);
    const note = screen.getByText('We treat your data in confidence.');
    expect(note).toHaveClass('text-muted');
    expect(note).not.toHaveClass('text-foreground');
  });

  it.each(everyColour)(
    'emits no tracking, no weight, no measure and no margin at color=%s - the first two are what make an Eyebrow and the last two what make a reading column, and a Note is neither',
    (color) => {
      render(<Note color={color}>We reply within two working days.</Note>);
      const className = screen.getByText(
        'We reply within two working days.',
      ).className;
      expect(className).not.toMatch(/\btracking-/);
      expect(className).not.toMatch(
        /\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/,
      );
      expect(className).not.toMatch(/\bmax-w-/);
      expect(className).not.toMatch(/\bm[trblxy]?-/);
    },
  );

  it('carries a ReactNode, so an annotation with a link inside it survives as one paragraph', () => {
    render(
      <Note color={'muted'}>
        We treat your data in confidence, see{' '}
        <Link href={'/privacy'}>our privacy notice</Link>.
      </Note>,
    );
    const anchor = screen.getByRole('link', { name: 'our privacy notice' });
    expect(anchor.closest('p')).toBeInTheDocument();
  });

  it.each(everyColour)(
    'carries no ARIA role and no live region at color=%s - a form message is the note Form owns, which is where status and alert live',
    (color) => {
      render(<Note color={color}>We reply within two working days.</Note>);
      const note = screen.getByText('We reply within two working days.');
      expect(note).not.toHaveAttribute('role');
      expect(note).not.toHaveAttribute('aria-live');
    },
  );

  it('exposes the one sanctioned host hook through testId', () => {
    render(
      <Note testId={'routing-note'}>We reply within two working days.</Note>,
    );
    expect(screen.getByTestId('routing-note')).toBeInTheDocument();
  });
});
