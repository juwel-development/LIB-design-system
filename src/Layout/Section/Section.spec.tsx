import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from './Section';

const classesOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

// Every bleed the recipe exposes. The positioning guarantee is stated for all of them, so the tests that
// pin it walk the list rather than the default alone.
const BLEEDS = ['inset', 'full'] as const;

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

  it('is a positioning context under the default bleed and under every bleed value, so a bleed refactor cannot drop the anchor', () => {
    // Whether `relative` sits on the recipe's base or is duplicated into each option is not something the
    // DOM can tell apart, so what is pinned here is the guarantee itself rather than the recipe's shape:
    // no bleed value renders an unanchorable section. Moving it onto one option would fail on the other.
    const { rerender } = render(<Section testId={'s'}>Body</Section>);
    expect(classesOf(screen.getByTestId('s'))).toContain('relative');

    for (const bleed of BLEEDS) {
      rerender(
        <Section bleed={bleed} testId={'s'}>
          Body
        </Section>,
      );
      expect(classesOf(screen.getByTestId('s'))).toContain('relative');
    }
  });

  it('is a positioning context whether or not the section is named or carries a test id', () => {
    const { container, rerender } = render(<Section>Body</Section>);
    const bare = container.querySelector('section');
    expect(bare).toBeInTheDocument();
    expect(bare && classesOf(bare)).toContain('relative');

    rerender(
      <Section name={'Pricing'} testId={'named'}>
        Body
      </Section>,
    );
    expect(
      classesOf(screen.getByRole('region', { name: 'Pricing' })),
    ).toContain('relative');
  });

  it('anchors without becoming a stacking context: no offset, no z-index, no isolation', () => {
    // Consumer decoration hangs off the join at z-index:-1 to sit behind reading type, which works only
    // while it can escape to an outer stacking context. `relative` with `z-index: auto` makes none, so
    // the absence of z-index/isolate is the load-bearing half of the guarantee and is asserted as such.
    // Each pattern allows a leading variant prefix, since `[[data-section]+&]:` is this recipe's own
    // idiom and `[[data-section]+&]:z-10` would create the stacking context just as plain `z-10` would.
    const OFFSET_OR_LAYER =
      /(^|[\s:])-?(top|right|bottom|left|start|end|inset|z)-/;
    const POSITION_OR_ISOLATION =
      /(^|[\s:])(absolute|fixed|sticky|isolate)(\s|$)/;
    // The same declarations written out longhand, which no utility-shaped pattern would catch.
    const ARBITRARY_PROPERTY =
      /\[(top|right|bottom|left|inset|inset-block|inset-inline|z-index|isolation|position):/;

    const { rerender } = render(<Section testId={'s'}>Body</Section>);
    for (const bleed of BLEEDS) {
      rerender(
        <Section bleed={bleed} testId={'s'}>
          Body
        </Section>,
      );
      const { className } = screen.getByTestId('s');
      expect(className).not.toMatch(OFFSET_OR_LAYER);
      // The section stays in flow: it is an anchor, not a placement.
      expect(className).not.toMatch(POSITION_OR_ISOLATION);
      expect(className).not.toMatch(ARBITRARY_PROPERTY);
    }
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
