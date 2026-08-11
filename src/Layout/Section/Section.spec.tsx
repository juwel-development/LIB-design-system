import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from './Section';

describe('Section', () => {
  it('renders a section element carrying data-section, so the join can key off the preceding sibling', () => {
    const { container } = render(<Section testId={'intro'}>Intro</Section>);
    const section = screen.getByTestId('intro');
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveAttribute('data-section');
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('carries data-section in the full bleed variant too, so a hero still joins the section after it', () => {
    render(
      <Section bleed={'full'} testId={'hero'}>
        Hero
      </Section>,
    );
    expect(screen.getByTestId('hero')).toHaveAttribute('data-section');
  });

  it('draws the join only against a preceding data-section sibling, so nothing before the first section gets a rule', () => {
    // The selector reads [[data-section]+&], not :not(:first-child): a header before the first
    // section leaves the header ruled by its own direction-level choice (#14), not by this component.
    render(<Section testId={'joined'}>Body</Section>);
    const section = screen.getByTestId('joined');
    expect(section.className).toContain('[[data-section]+&]:border-t');
    expect(section.className).toContain('[[data-section]+&]:border-solid');
    // No unconditional top rule and no :not(:first-child) gate that would fire beneath a header.
    expect(section.className).not.toMatch(/(^|[\s[])border-t\b/);
    expect(section.className).not.toContain(':not(:first-child)');
  });

  it('draws the join in the rule colour, not border, since it carries the whole load a gap would', () => {
    render(<Section testId={'joined'}>Body</Section>);
    const section = screen.getByTestId('joined');
    expect(section.className).toContain('[[data-section]+&]:border-rule');
    expect(section.className).not.toContain('border-border');
  });

  it('names the section as a region only when name is given, and emits no aria-label otherwise', () => {
    const { rerender } = render(<Section testId={'plain'}>Body</Section>);
    // An unnamed section is inert to assistive technology - the right default, not a gap.
    expect(screen.getByTestId('plain')).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    rerender(
      <Section name={'Pricing'} testId={'plain'}>
        Body
      </Section>,
    );
    expect(screen.getByRole('region', { name: 'Pricing' })).toBeInTheDocument();
  });

  it('applies the gutter when inset and drops it when full, keeping the vertical band on both', () => {
    const { rerender } = render(<Section testId={'s'}>Body</Section>);
    const inset = screen.getByTestId('s');
    expect(inset.className).toContain('px-[var(--gutter)]');
    expect(inset.className).toContain('py-[var(--space-band)]');

    rerender(
      <Section bleed={'full'} testId={'s'}>
        Body
      </Section>,
    );
    const full = screen.getByTestId('s');
    expect(full.className).not.toContain('px-[var(--gutter)]');
    expect(full.className).toContain('py-[var(--space-band)]');
  });

  it('sets no margin and no max-width: sections abut and Prose owns the reading measure', () => {
    render(<Section testId={'s'}>Body</Section>);
    const section = screen.getByTestId('s');
    expect(section.className).not.toMatch(/\bm[trblxy]?-/);
    expect(section.className).not.toMatch(/\bmax-w-/);
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(<Section>Body</Section>);
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  it('renders the children it is handed', () => {
    render(
      <Section>
        <p>Contents</p>
      </Section>,
    );
    expect(screen.getByText('Contents')).toBeInTheDocument();
  });
});
