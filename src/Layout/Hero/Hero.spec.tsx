import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders a container that holds at least the fold height and claims no landmark role', () => {
    render(<Hero testId={'hero'}>Poster</Hero>);
    const hero = screen.getByTestId('hero');
    expect(hero.className).toContain('min-h-[var(--fold-height)]');
    // Not a region: the Section around it owns the landmark, so the fold is a plain container.
    expect(hero).not.toHaveAttribute('role');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('centres the slot by default, the conventional hero', () => {
    render(<Hero testId={'hero'}>Poster</Hero>);
    expect(screen.getByTestId('hero').className).toContain('justify-center');
  });

  it('pins the slot to the top of the fold when place is start', () => {
    render(
      <Hero place={'start'} testId={'hero'}>
        Poster
      </Hero>,
    );
    const hero = screen.getByTestId('hero');
    expect(hero.className).toContain('justify-start');
    expect(hero.className).not.toContain('justify-center');
  });

  it('spreads the slot across the fold when place is between, so a foot lands on the bottom edge', () => {
    render(
      <Hero place={'between'} testId={'hero'}>
        Poster
      </Hero>,
    );
    const hero = screen.getByTestId('hero');
    expect(hero.className).toContain('justify-between');
    expect(hero.className).not.toContain('justify-center');
  });

  it('places children unmodified, adding nothing to and stripping nothing from them', () => {
    render(
      <Hero testId={'hero'}>
        <p>Lead</p>
      </Hero>,
    );
    const lead = screen.getByText('Lead');
    expect(lead.tagName).toBe('P');
    expect(lead.parentElement).toBe(screen.getByTestId('hero'));
  });

  it('is a flex column gapped with the stack space, and sets no margin and no max-width', () => {
    render(<Hero testId={'hero'}>Poster</Hero>);
    const hero = screen.getByTestId('hero');
    expect(hero.className).toContain('flex');
    expect(hero.className).toContain('flex-col');
    expect(hero.className).toContain('gap-[var(--space-stack)]');
    expect(hero.className).not.toMatch(/\bm[trblxy]?-/);
    expect(hero.className).not.toMatch(/\bmax-w-/);
  });

  it('owns no bleed, no section element and no heading of its own', () => {
    const { container } = render(<Hero testId={'hero'}>Poster</Hero>);
    const hero = screen.getByTestId('hero');
    expect(hero.tagName).toBe('DIV');
    expect(hero.className).not.toContain('px-[var(--gutter)]');
    expect(container.querySelector('section')).toBeNull();
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('is never sticky or fixed and needs no JavaScript, so it renders identically server-side', () => {
    const { container } = render(<Hero>Poster</Hero>);
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\b(sticky|fixed)\b/);
    }
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(<Hero>Poster</Hero>);
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });
});
