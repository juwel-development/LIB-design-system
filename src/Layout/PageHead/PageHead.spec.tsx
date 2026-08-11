import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHead } from './PageHead';

describe('PageHead', () => {
  it('renders a header whose h1 is the page title, with the lede and intro below it', () => {
    render(
      <PageHead
        title={'About the studio'}
        lede={'We design for the long read.'}
        intro={'A short standfirst under the lede.'}
        testId={'head'}
      />,
    );
    const header = screen.getByTestId('head');
    expect(header.tagName).toBe('HEADER');
    const title = screen.getByRole('heading', {
      level: 1,
      name: 'About the studio',
    });
    expect(header).toContainElement(title);
    expect(
      screen.getByText('We design for the long read.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('A short standfirst under the lede.'),
    ).toBeInTheDocument();
  });

  it('sets the title at the title role, one rung below the hero display, so it can never out-scale the homepage hero', () => {
    // The cross-route cap is a token relationship, not two clamps ordered by luck: text-title holds the
    // subpage-head value and text-display the hero's, and renderTokens pins display above title. Binding
    // here to text-title is what makes the ladder hold across routes (ADR 0004/0005).
    render(<PageHead title={'Title'} testId={'head'} />);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.className).toContain('text-title');
    expect(title.className).toContain('leading-title');
    expect(title.className).not.toContain('text-display');
    // A tokenised size, never a local clamp: no size literal appears on the heading.
    expect(title.className).not.toMatch(/text-\[/);
  });

  it('draws the lede at the lede role, foreground, capped one measure wider than the reading column', () => {
    render(<PageHead title={'Title'} lede={'The lede.'} />);
    const lede = screen.getByText('The lede.');
    expect(lede.tagName).toBe('P');
    expect(lede.className).toContain('text-lede');
    expect(lede.className).toContain('leading-lede');
    expect(lede.className).toContain('text-foreground');
    expect(lede.className).toContain('max-w-[var(--measure-wide)]');
  });

  it('draws the intro at the small role, muted, capped at the reading measure', () => {
    render(<PageHead title={'Title'} intro={'The intro.'} />);
    const intro = screen.getByText('The intro.');
    expect(intro.tagName).toBe('P');
    expect(intro.className).toContain('text-small');
    expect(intro.className).toContain('text-muted');
    expect(intro.className).toContain('max-w-[var(--measure)]');
  });

  it('renders neither paragraph when it is given only a title', () => {
    const { container } = render(<PageHead title={'Just a title'} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Just a title' }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('opts out of the index column: full width with no column span and no max-width, over the vertical band and the gutter', () => {
    // Full-bleed means it never joins the index-column grid a default Section sits in (#9). It carries
    // the band and the gutter like every other page unit, and constrains its own text - never the header
    // - so it spans the full content width.
    render(<PageHead title={'Title'} testId={'head'} />);
    const header = screen.getByTestId('head');
    expect(header.className).toContain('py-[var(--space-band)]');
    expect(header.className).toContain('px-[var(--gutter)]');
    expect(header.className).not.toMatch(/\bmax-w-/);
    expect(header.className).not.toMatch(/\bcol-/);
  });

  it('is never sticky or fixed and needs no JavaScript, so it renders identically server-side', () => {
    const { container } = render(
      <PageHead title={'Title'} lede={'Lede'} intro={'Intro'} />,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\b(sticky|fixed)\b/);
    }
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(
      <PageHead title={'Title'} lede={'Lede'} intro={'Intro'} />,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });
});
