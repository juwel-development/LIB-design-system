import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Cluster } from './Cluster';

describe('Cluster', () => {
  // The utilities as a *set*. Which order the class attribute lists them in decides nothing -
  // precedence comes from the stylesheet - so nothing here pins the order the recipe happens to
  // declare its variants in, and no assertion goes red on a reorder that changes no pixel.
  const utilities = (element: Element) =>
    element.className.split(/\s+/).filter(Boolean);

  it('renders a plain container that claims no landmark and no nav of its own', () => {
    const { container } = render(<Cluster testId={'cluster'}>Matter</Cluster>);
    const cluster = screen.getByTestId('cluster');
    expect(cluster.tagName).toBe('DIV');
    // A cluster that navigates is named by the caller's own nav, exactly as Footer's guidance says.
    expect(cluster).not.toHaveAttribute('role');
    expect(cluster).not.toHaveAttribute('aria-label');
    expect(container.querySelector('nav, header, footer, section')).toBeNull();
  });

  it('places children unmodified, adding nothing to and stripping nothing from them', () => {
    render(
      <Cluster testId={'cluster'}>
        <a href={'/one'}>One</a>
      </Cluster>,
    );
    const child = screen.getByText('One');
    expect(child.tagName).toBe('A');
    expect(child.parentElement).toBe(screen.getByTestId('cluster'));
  });

  it('wraps its children onto further lines rather than overflowing one', () => {
    render(<Cluster testId={'cluster'}>Matter</Cluster>);
    const cluster = screen.getByTestId('cluster');
    expect(utilities(cluster)).toContain('flex');
    expect(utilities(cluster)).toContain('flex-wrap');
  });

  it('aligns children on their baselines in every combination of props', () => {
    render(
      <>
        <Cluster testId={'default'}>Matter</Cluster>
        <Cluster gap={'stack'} justify={'between'} testId={'stack-between'}>
          Matter
        </Cluster>
        <Cluster gap={'region'} justify={'start'} testId={'region-start'}>
          Matter
        </Cluster>
      </>,
    );
    // These rows mix type at different roles - a nav link at the label role beside a credit line at
    // the small role - and centring them makes the type look mis-set, so baseline is not a default
    // to be overridden (docs/adr/0008).
    for (const id of ['default', 'stack-between', 'region-start']) {
      const cluster = screen.getByTestId(id);
      expect(utilities(cluster)).toContain('items-baseline');
      expect(utilities(cluster).join(' ')).not.toMatch(
        /\bitems-(center|end)\b/,
      );
    }
  });

  it('separates items along a line on the region role by default', () => {
    render(<Cluster testId={'cluster'}>Matter</Cluster>);
    expect(utilities(screen.getByTestId('cluster'))).toContain(
      'gap-x-[var(--space-region)]',
    );
  });

  it('separates items along a line on the sibling role when asked for it', () => {
    render(
      <Cluster gap={'stack'} testId={'cluster'}>
        Matter
      </Cluster>,
    );
    const cluster = screen.getByTestId('cluster');
    expect(utilities(cluster)).toContain('gap-x-[var(--space-stack)]');
    expect(utilities(cluster)).not.toContain('gap-x-[var(--space-region)]');
  });

  it('fixes the wrapped-line gap to the sibling role, whichever inline gap is asked for', () => {
    render(
      <>
        <Cluster testId={'default'}>Matter</Cluster>
        <Cluster gap={'stack'} testId={'stack'}>
          Matter
        </Cluster>
        <Cluster gap={'region'} justify={'between'} testId={'region'}>
          Matter
        </Cluster>
      </>,
    );
    // One attested role in that position, so the recipe fixes it and no prop can reach it: a wrapped
    // line sitting as far from its neighbour as its items sit from each other stops reading as one
    // group (docs/adr/0008).
    for (const id of ['default', 'stack', 'region']) {
      expect(utilities(screen.getByTestId(id))).toContain(
        'gap-y-[var(--space-stack)]',
      );
    }
  });

  it('sets the two axes separately, never through one shorthand gap', () => {
    render(
      <Cluster gap={'stack'} testId={'cluster'}>
        Matter
      </Cluster>,
    );
    // gap="stack" puts the same role on both axes, and a shorthand would still be wrong: the axes
    // are two positions, and only one of them is the caller's.
    expect(
      utilities(screen.getByTestId('cluster')).some((utility) =>
        utility.startsWith('gap-['),
      ),
    ).toBe(false);
  });

  it('never emits the band role or the gutter as a gap - neither is on offer (ADR 0008)', () => {
    render(
      <>
        <Cluster testId={'default'}>Matter</Cluster>
        <Cluster gap={'stack'} testId={'stack'}>
          Matter
        </Cluster>
        <Cluster gap={'region'} justify={'between'} testId={'region'}>
          Matter
        </Cluster>
      </>,
    );
    for (const id of ['default', 'stack', 'region']) {
      const className = screen.getByTestId(id).className;
      expect(className).not.toContain('--space-band');
      expect(className).not.toContain('--gutter');
    }
  });

  it('runs from the start until asked to distribute end to end', () => {
    const { rerender } = render(<Cluster testId={'cluster'}>Matter</Cluster>);
    expect(utilities(screen.getByTestId('cluster'))).not.toContain(
      'justify-between',
    );
    rerender(
      <Cluster justify={'between'} testId={'cluster'}>
        Matter
      </Cluster>,
    );
    expect(utilities(screen.getByTestId('cluster'))).toContain(
      'justify-between',
    );
  });

  it('takes no outer space, so whatever holds it owns the rhythm around it', () => {
    render(
      <Cluster gap={'region'} justify={'between'} testId={'cluster'}>
        Matter
      </Cluster>,
    );
    for (const utility of utilities(screen.getByTestId('cluster'))) {
      expect(utility).not.toMatch(/^m[trblxy]?-/);
      expect(utility).not.toMatch(/^p[trblxy]?-/);
    }
  });

  it('expresses every value through a role, never a length or a numbered spacing rung', () => {
    render(
      <Cluster gap={'stack'} justify={'between'} testId={'cluster'}>
        Matter
      </Cluster>,
    );
    // A spacing this component cannot express through a role is a request for a measurement, which
    // docs/adr/0003 and docs/adr/0004 answer.
    for (const utility of utilities(screen.getByTestId('cluster'))) {
      expect(utility).not.toMatch(/-\d/);
      expect(utility).not.toMatch(/\d(px|rem|em|ch|vh|vw)\b/);
    }
  });

  it('renders testId as the test attribute and emits none when it is omitted', () => {
    const { rerender, container } = render(
      <Cluster testId={'cluster'}>Matter</Cluster>,
    );
    expect(container.firstElementChild).toHaveAttribute(
      'data-testid',
      'cluster',
    );
    rerender(<Cluster>Matter</Cluster>);
    expect(container.firstElementChild).not.toHaveAttribute('data-testid');
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(
      <Cluster gap={'stack'} justify={'between'}>
        Matter
      </Cluster>,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  // Nothing here pins Header's private nav row against this component, the way Stack's spec pins the
  // six columns that hand-write its arrangement. That row sets one shorthand `gap`, so it renders
  // --space-region between its wrapped lines where a Cluster renders --space-stack: the two now emit
  // deliberately different classes and an equality spec would be red for a difference that is the
  // point (docs/adr/0008, "A `rowGap` prop on `Cluster`"). Header is not touched by this ticket.
});
