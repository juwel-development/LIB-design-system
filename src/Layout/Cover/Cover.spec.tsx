import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Cover } from './Cover';

describe('Cover', () => {
  it('renders a frame that holds at least the cover height and claims no landmark role', () => {
    render(<Cover testId={'cover'}>Menu</Cover>);
    const cover = screen.getByTestId('cover');
    expect(cover.className).toContain('min-h-[var(--cover-height)]');
    // Not a region and not a section: a cover is the whole page for a moment, so the frame is a
    // plain container and whatever needs a landmark sits in the slot.
    expect(cover).not.toHaveAttribute('role');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('centres the slot on both axes: the column in the middle of the leftover space', () => {
    render(<Cover testId={'cover'}>Menu</Cover>);
    const cover = screen.getByTestId('cover');
    const slot = screen.getByText('Menu');
    // Inline axis: the frame centres its items. Block axis: the slot's auto margins split the
    // leftover space equally, so a foot after it still lands on the bottom edge.
    expect(cover.className).toContain('items-center');
    expect(slot.className).toContain('my-auto');
    expect(slot.parentElement).toBe(cover);
  });

  it('renders the foot at the bottom edge, after the centred slot', () => {
    render(
      <Cover foot={'v3.1.0'} testId={'cover'}>
        Menu
      </Cover>,
    );
    const cover = screen.getByTestId('cover');
    const foot = screen.getByText('v3.1.0');
    // The frame's last child, after the auto-margined slot, so the leftover space is above it and
    // it sits on the frame's bottom edge; items-center on the frame centres it on the inline axis.
    expect(foot.parentElement).toBe(cover);
    expect(cover.lastElementChild).toBe(foot);
    expect(screen.getByText('Menu').nextElementSibling).toBe(foot);
  });

  it('renders nothing for the foot when it is not given', () => {
    render(<Cover testId={'cover'}>Menu</Cover>);
    // One element child - the slot - and no empty foot container in the DOM.
    expect(screen.getByTestId('cover').children).toHaveLength(1);
  });

  it('owns its own inset: the gutter on the inline axis and the region space on the block axis', () => {
    // The deliberate exception to "Section owns the gutter": the frame equals the viewport, so it
    // cannot sit inside a Section band without overflowing, and carries the inset itself.
    render(<Cover testId={'cover'}>Menu</Cover>);
    const cover = screen.getByTestId('cover');
    expect(cover.className).toContain('px-[var(--gutter)]');
    expect(cover.className).toContain('py-[var(--space-region)]');
  });

  it('places children and foot unmodified, adding nothing to and stripping nothing from them', () => {
    render(
      <Cover foot={<p>Legal</p>} testId={'cover'}>
        <p>Lead</p>
      </Cover>,
    );
    expect(screen.getByText('Lead').tagName).toBe('P');
    expect(screen.getByText('Legal').tagName).toBe('P');
  });

  it('emits no section element and no heading of its own', () => {
    const { container } = render(
      <Cover foot={'v3.1.0'} testId={'cover'}>
        Menu
      </Cover>,
    );
    expect(screen.getByTestId('cover').tagName).toBe('DIV');
    expect(container.querySelector('section')).toBeNull();
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('sets no margin and no max-width on the frame, which owns the whole viewport', () => {
    render(<Cover testId={'cover'}>Menu</Cover>);
    const cover = screen.getByTestId('cover');
    expect(cover.className).not.toMatch(/\bm[trblxy]?-/);
    expect(cover.className).not.toMatch(/\bmax-w-/);
  });

  it('is never sticky or fixed and needs no JavaScript, so it renders identically server-side', () => {
    const { container } = render(<Cover foot={'v3.1.0'}>Menu</Cover>);
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\b(sticky|fixed)\b/);
    }
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(<Cover foot={'v3.1.0'}>Menu</Cover>);
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });
});
