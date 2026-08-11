import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders a footer element that is the contentinfo landmark of the page', () => {
    render(<Footer testId={'foot'}>Small print</Footer>);
    const footer = screen.getByTestId('foot');
    expect(footer.tagName).toBe('FOOTER');
    expect(screen.getByRole('contentinfo')).toBe(footer);
  });

  it('places children directly inside the footer, wrapping them in nothing', () => {
    render(
      <Footer>
        <p>Colophon</p>
      </Footer>,
    );
    const paragraph = screen.getByText('Colophon');
    expect(paragraph.parentElement?.tagName).toBe('FOOTER');
  });

  it('takes no naming prop and emits no aria-label, since one contentinfo per page needs no name', () => {
    render(<Footer testId={'foot'}>Small print</Footer>);
    expect(screen.getByTestId('foot')).not.toHaveAttribute('aria-label');
  });

  it('draws the top rule by default in the rule colour, so the page keeps one hairline weight', () => {
    render(<Footer testId={'foot'}>Small print</Footer>);
    const footer = screen.getByTestId('foot');
    expect(footer.className).toContain('border-t');
    expect(footer.className).toContain('border-solid');
    expect(footer.className).toContain('border-rule');
    expect(footer.className).not.toContain('border-border');
  });

  it('omits the top rule when edge is none', () => {
    render(
      <Footer edge={'none'} testId={'foot'}>
        Small print
      </Footer>,
    );
    expect(screen.getByTestId('foot').className).not.toContain('border-t');
  });

  it('draws the rule unconditionally, not keyed on the preceding sibling, so it survives after any element', () => {
    render(
      <>
        <div>Raw consumer markup, carrying no data-section</div>
        <Footer testId={'foot'}>Small print</Footer>
      </>,
    );
    const footer = screen.getByTestId('foot');
    // Unlike Section's join there is no "first footer", so the rule is a plain border, never a
    // selector keyed on a data-section sibling or a :not(:first-child) gate.
    expect(footer.className).toContain('border-t');
    expect(footer.className).not.toContain('[data-section]');
    expect(footer.className).not.toContain(':not(:first-child)');
  });

  it('sets the secondary face, the small role and the muted colour, and no tracking', () => {
    render(<Footer testId={'foot'}>Small print</Footer>);
    const footer = screen.getByTestId('foot');
    expect(footer.className).toContain('font-secondary');
    expect(footer.className).toContain('text-small');
    expect(footer.className).toContain('text-muted');
    // A footer's slot legitimately holds a sentence; label tracking across one is damage, not a device.
    expect(footer.className).not.toContain('tracking-label');
  });

  it('reads the shell air vertically and the gutter horizontally, so it aligns with an inset section', () => {
    render(<Footer testId={'foot'}>Small print</Footer>);
    const footer = screen.getByTestId('foot');
    expect(footer.className).toContain('py-[var(--space-region)]');
    expect(footer.className).toContain('px-[var(--gutter)]');
  });

  it('is never sticky or fixed and needs no JavaScript', () => {
    render(<Footer testId={'foot'}>Small print</Footer>);
    const footer = screen.getByTestId('foot');
    expect(footer.className).not.toMatch(/\b(sticky|fixed)\b/);
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(<Footer>Small print</Footer>);
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });
});
