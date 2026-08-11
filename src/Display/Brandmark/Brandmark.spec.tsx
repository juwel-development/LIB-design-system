import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Brandmark } from './Brandmark';

// A generic placeholder mark: no real brand asset ships in this repo (issue #16, Out of scope).
const Mark = () => (
  <svg viewBox={'0 0 10 10'} data-testid={'mark-svg'}>
    <rect width={'10'} height={'10'} />
  </svg>
);

describe('Brandmark', () => {
  it('names a mark with role="img" and aria-label when name is non-empty', () => {
    render(
      <Brandmark name={'Acme'} cut={'full'} testId={'mark'}>
        <Mark />
      </Brandmark>,
    );
    const mark = screen.getByTestId('mark');
    expect(mark).toHaveAttribute('role', 'img');
    expect(mark).toHaveAttribute('aria-label', 'Acme');
    expect(mark).not.toHaveAttribute('aria-hidden');
  });

  it('leaves the accessibility tree with aria-hidden and no role when name is ""', () => {
    // The case most likely to be got wrong: role="img" with no name is an unnamed image in the
    // tree, worse than an absent one, so a decorative mark must leave the tree entirely.
    render(
      <Brandmark name={''} cut={'compact'} testId={'mark'}>
        <Mark />
      </Brandmark>,
    );
    const mark = screen.getByTestId('mark');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark).not.toHaveAttribute('role');
    expect(mark).not.toHaveAttribute('aria-label');
  });

  it('reflects the cut it is given in data-cut, for both values', () => {
    const { rerender } = render(
      <Brandmark name={'Acme'} cut={'full'} testId={'mark'}>
        <Mark />
      </Brandmark>,
    );
    expect(screen.getByTestId('mark')).toHaveAttribute('data-cut', 'full');
    rerender(
      <Brandmark name={'Acme'} cut={'compact'} testId={'mark'}>
        <Mark />
      </Brandmark>,
    );
    expect(screen.getByTestId('mark')).toHaveAttribute('data-cut', 'compact');
  });

  it('is inline-flex, which keeps the mark off the text baseline', () => {
    render(
      <Brandmark name={'Acme'} cut={'full'} testId={'mark'}>
        <Mark />
      </Brandmark>,
    );
    expect(screen.getByTestId('mark')).toHaveClass('inline-flex');
  });

  it('renders children unmodified - it adds nothing to and strips nothing from the SVG', () => {
    render(
      <Brandmark name={'Acme'} cut={'full'} testId={'mark'}>
        <Mark />
      </Brandmark>,
    );
    const svg = screen.getByTestId('mark-svg');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(screen.getByTestId('mark').querySelector('svg')).toBe(svg);
  });

  it('sets no colour, no dimension, no link and no margin', () => {
    render(
      <Brandmark name={'Acme'} cut={'full'} testId={'mark'}>
        <Mark />
      </Brandmark>,
    );
    const mark = screen.getByTestId('mark');
    expect(mark.tagName).toBe('SPAN');
    expect(mark.querySelector('a')).toBeNull();
    expect(mark.className).not.toMatch(/\bdark:/);
    expect(mark.className).not.toMatch(/(^|[\s:])(text-|bg-|fill-)/);
    expect(mark.className).not.toMatch(
      /\b(w-|h-|max-w-|min-w-|m-|mx-|my-|mt-|mb-|ml-|mr-)/,
    );
  });
});
