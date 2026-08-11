import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { P } from '../P/P';
import { Prose } from './Prose';

describe('Prose', () => {
  it('is one namespace object carrying exactly its four members', () => {
    expect(Object.keys(Prose).sort()).toEqual(
      ['Body', 'Lede', 'Root', 'Tail'].sort(),
    );
  });

  it('renders Root as a div bounded by the reading measure', () => {
    render(
      <Prose.Root testId={'column'}>
        <Prose.Body>Body copy.</Prose.Body>
      </Prose.Root>,
    );
    const root = screen.getByTestId('column');
    expect(root.tagName).toBe('DIV');
    // The column is capped at --measure; the ch unit inside it keeps resolving against body type.
    expect(root.className).toContain('max-w-[var(--measure)]');
  });

  it('sets no font-size on Root, so the ch measure resolves against inherited body type', () => {
    render(
      <Prose.Root testId={'column'}>
        <Prose.Body>Body copy.</Prose.Body>
      </Prose.Root>,
    );
    // A text-* size utility on Root would re-anchor ch; there must be none on the wrapper itself.
    expect(screen.getByTestId('column').className).not.toMatch(/\btext-/);
  });

  it('stacks its children on the type-scale gap and takes no margin of its own', () => {
    render(
      <Prose.Root testId={'column'}>
        <Prose.Body>Body copy.</Prose.Body>
      </Prose.Root>,
    );
    const root = screen.getByTestId('column');
    // Air goes at the edges (the measure) and inside the type, not as one-idea-per-screen gaps: the
    // sibling gap is the type-scale --space-stack, and the block dictates no page rhythm of its own.
    expect(root.className).toContain('gap-[var(--space-stack)]');
    expect(root.className).not.toMatch(/\bm[trblxy]?-/);
  });

  it('renders the lede as a paragraph at the new lede role', () => {
    render(<Prose.Lede>The opening line.</Prose.Lede>);
    const lede = screen.getByText('The opening line.');
    expect(lede.tagName).toBe('P');
    expect(lede.className).toContain('text-lede');
    expect(lede.className).toContain('leading-lede');
  });

  it('renders a body paragraph identical to the P primitive', () => {
    // Two recipes for one job (issue #21): pin them equal so they cannot drift silently apart.
    render(
      <>
        <Prose.Body>x</Prose.Body>
        <P>y</P>
      </>,
    );
    expect(screen.getByText('x').className).toBe(
      screen.getByText('y').className,
    );
  });

  it('matches P on the muted colour too, so the whole variant surface stays in step', () => {
    render(
      <>
        <Prose.Body color={'muted'}>x</Prose.Body>
        <P color={'muted'}>y</P>
      </>,
    );
    expect(screen.getByText('x').className).toBe(
      screen.getByText('y').className,
    );
  });

  it('renders the tail as a muted paragraph at the small role', () => {
    render(<Prose.Tail>A closing note.</Prose.Tail>);
    const tail = screen.getByText('A closing note.');
    expect(tail.tagName).toBe('P');
    expect(tail.className).toContain('text-small');
    expect(tail.className).toContain('text-muted');
  });

  it('renders no drop cap or other invented device', () => {
    const { container } = render(
      <Prose.Root>
        <Prose.Lede>Opening.</Prose.Lede>
        <Prose.Body>Body.</Prose.Body>
        <Prose.Tail>Tail.</Prose.Tail>
      </Prose.Root>,
    );
    // A drop cap would be a ::first-letter float or an initial-letter utility; there is none.
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/first-letter|initial-letter/);
    }
  });

  it('carries no dark: class anywhere, colours flipping through the tokens instead', () => {
    const { container } = render(
      <Prose.Root>
        <Prose.Lede>Opening.</Prose.Lede>
        <Prose.Body color={'muted'}>Body.</Prose.Body>
        <Prose.Tail>Tail.</Prose.Tail>
      </Prose.Root>,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/dark:/);
    }
  });
});
