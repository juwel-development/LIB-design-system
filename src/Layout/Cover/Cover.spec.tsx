import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Cover } from './Cover';

describe('Cover', () => {
  it('renders a plain container that claims no landmark and no heading', () => {
    const { container } = render(<Cover testId={'cover'}>Matter</Cover>);
    const cover = screen.getByTestId('cover');
    expect(cover.tagName).toBe('DIV');
    expect(cover).not.toHaveAttribute('role');
    expect(
      container.querySelector('section, h1, h2, h3, h4, h5, h6'),
    ).toBeNull();
  });

  it('holds at least the cover height, a floor and never a ceiling', () => {
    render(<Cover testId={'cover'}>Matter</Cover>);
    const cover = screen.getByTestId('cover');
    expect(cover.className).toContain('min-h-[var(--cover-height)]');
    expect(cover.className).not.toMatch(/(^| )h-\[/);
  });

  it('centers its slot on both axes of the leftover space', () => {
    render(<Cover testId={'cover'}>Matter</Cover>);
    const slot = screen.getByText('Matter');
    expect(slot.className).toContain('justify-center');
    expect(slot.className).toContain('items-center');
    expect(slot.className).toContain('grow');
  });

  it('places children unmodified inside the centered slot', () => {
    render(
      <Cover testId={'cover'}>
        <p>First</p>
      </Cover>,
    );
    const child = screen.getByText('First');
    expect(child.tagName).toBe('P');
  });

  it('renders the foot on the bottom edge when one is given', () => {
    render(
      <Cover foot={<p>v1.0.0</p>} testId={'cover'}>
        Matter
      </Cover>,
    );
    const cover = screen.getByTestId('cover');
    const foot = screen.getByText('v1.0.0');
    // The foot is the frame's last child, after the growing slot, which is what pins it to the
    // bottom edge without a position or a margin.
    expect(cover.lastElementChild).toBe(foot);
  });

  it('renders no foot element at all when none is given, never an empty placeholder', () => {
    render(<Cover testId={'cover'}>Matter</Cover>);
    expect(screen.getByTestId('cover').children).toHaveLength(1);
  });

  it('owns its own inset, the deliberate exception to Section owning the gutter', () => {
    render(<Cover testId={'cover'}>Matter</Cover>);
    const cover = screen.getByTestId('cover');
    // A Section band around a viewport-height frame would overflow the viewport, so this is the
    // one component that carries the gutter and a vertical inset itself.
    expect(cover.className).toContain('px-[var(--gutter)]');
    expect(cover.className).toContain('py-[var(--space-region)]');
  });

  it('expresses every value through a role, never a length or a numbered spacing rung', () => {
    render(
      <Cover foot={<p>foot</p>} testId={'cover'}>
        Matter
      </Cover>,
    );
    const frame = screen.getByTestId('cover');
    for (const element of [frame, ...Array.from(frame.children)]) {
      for (const utility of element.className.split(' ')) {
        expect(utility).not.toMatch(/-\d/);
        expect(utility).not.toMatch(/\d(px|rem|em|ch|vh|vw|svh)\b/);
      }
    }
  });
});
