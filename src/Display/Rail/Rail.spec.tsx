import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Rail } from './Rail';

const renderRail = (options?: {
  number?: string;
  rootId?: string;
  indexId?: string;
  contentId?: string;
}) =>
  render(
    <Rail.Root testId={options?.rootId}>
      <Rail.Index number={options?.number} testId={options?.indexId}>
        Work
      </Rail.Index>
      <Rail.Content testId={options?.contentId}>
        <p>The section&apos;s matter.</p>
      </Rail.Content>
    </Rail.Root>,
  );

describe('Rail', () => {
  it('renders Root as a plain div with a two-track grid at lg and one column below - no landmark', () => {
    // The switch is a media query, not a prop; jsdom computes no layout, so we assert the markup the
    // stylesheet keys on. One column is the grid base; the fixed 10rem index track arrives at lg.
    renderRail({ rootId: 'root' });
    const root = screen.getByTestId('root');
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('grid');
    expect(root.className).toMatch(/\blg:grid-cols-\[10rem_/);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(root.querySelector('aside')).not.toBeInTheDocument();
  });

  it('makes the index sticky with a top offset only at and above 64rem, and static below it', () => {
    // position: sticky sticks against the grid container - which is why Index must be a direct child of
    // Root. Below lg the index lies down and is static, so it carries no base sticky class.
    renderRail({ indexId: 'index' });
    const index = screen.getByTestId('index');
    expect(index).toHaveClass('lg:sticky');
    expect(index).toHaveClass('lg:top-6');
    expect(index.className).not.toMatch(/(^|\s)sticky\b/);
    expect(index.className).not.toMatch(/(^|\s)top-/);
  });

  it('hides the index from assistive technology - it repeats the heading the content track carries', () => {
    renderRail({ indexId: 'index' });
    expect(screen.getByTestId('index')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the name alone when number is omitted, with no empty numeral element', () => {
    const { container } = renderRail({ indexId: 'index' });
    const index = screen.getByTestId('index');
    expect(index).toHaveTextContent('Work');
    // Exactly one child - the name - and no bordered numeral element left standing empty.
    expect(index.children).toHaveLength(1);
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bborder-b\b/);
    }
  });

  it('sets both parts at the label role, told apart by colour: numeral muted, name foreground', () => {
    renderRail({ number: '02' });
    const numeral = screen.getByText('02');
    const name = screen.getByText('Work');
    for (const part of [numeral, name]) {
      expect(part).toHaveClass('font-secondary');
      expect(part).toHaveClass('text-label');
      expect(part).toHaveClass('tracking-label');
    }
    expect(numeral).toHaveClass('text-muted');
    expect(name).toHaveClass('text-foreground');
  });

  it('draws a hairline under the numeral in border, not the page-structure rule weight', () => {
    renderRail({ number: '02' });
    const numeral = screen.getByText('02');
    expect(numeral.className).toMatch(/\bborder-b\b/);
    expect(numeral).toHaveClass('border-border');
    expect(numeral.className).not.toMatch(/\bborder-rule\b/);
  });

  it('sets no tabular-nums class and no font-variant-numeric anywhere - the declined proposal ask', () => {
    // The one thing the proposal asks for that we decline: an index numeral has nothing to compare
    // column-to-column, so tabular figures are a reflex here, not a function.
    const { container } = renderRail({ number: '02' });
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\btabular-nums\b/);
      expect(element.className).not.toMatch(/font-variant-numeric/);
    }
  });

  it('renders content children unmodified and caps them at no measure - Prose owns the reading width', () => {
    renderRail({ contentId: 'content' });
    const content = screen.getByTestId('content');
    expect(content).toContainElement(screen.getByText("The section's matter."));
    expect(content.className ?? '').not.toMatch(/\bmax-w-/);
  });

  it('separates the content children by nothing - the opaque slot leaves the rhythm to a composed Stack', () => {
    // Deliberate, not an oversight: Content cannot see the heading and the matter it is handed, so it
    // does not own the gap between them. A caller that wants one composes a Stack inside the slot.
    renderRail({ contentId: 'content' });
    const content = screen.getByTestId('content');
    expect(content.className ?? '').not.toMatch(/\bgap-/);
    expect(content.className ?? '').not.toMatch(/\bspace-y-/);
    expect(content.className ?? '').not.toMatch(/\bflex\b/);
  });

  it('draws no margin, max-width, fill, box or vertical rule anywhere', () => {
    const { container } = renderRail({ number: '02' });
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/(^|[\s:])m[xytrbl]?-/);
      expect(element.className).not.toMatch(/\bmax-w-/);
      expect(element.className).not.toMatch(/(^|[\s:])bg-/);
      expect(element.className).not.toMatch(/\brounded/);
      expect(element.className).not.toMatch(/\bshadow/);
      expect(element.className).not.toMatch(/\bborder-[lrx]\b/);
    }
  });

  it('carries no dark: class - colours are semantic tokens re-pointed by the dark class', () => {
    const { container } = renderRail({ number: '02' });
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  it('exposes the one sanctioned host hook through testId on each member', () => {
    renderRail({
      rootId: 'the-root',
      indexId: 'the-index',
      contentId: 'the-content',
    });
    expect(screen.getByTestId('the-root').tagName).toBe('DIV');
    expect(screen.getByTestId('the-index').tagName).toBe('DIV');
    expect(screen.getByTestId('the-content').tagName).toBe('DIV');
  });

  it('is one namespace object carrying exactly its three members', () => {
    expect(Object.keys(Rail).sort()).toEqual(
      ['Content', 'Index', 'Root'].sort(),
    );
  });
});
