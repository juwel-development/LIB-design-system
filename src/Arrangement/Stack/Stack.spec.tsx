import { Figure } from 'Display/Figure/Figure';
import { Prose } from 'Display/Typography/Prose/Prose';
import { Input } from 'Interaction/Input/Input';
import { TextArea } from 'Interaction/TextArea/TextArea';
import { Form } from 'Layout/Form/Form';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stack } from './Stack';

describe('Stack', () => {
  it('renders a plain container that claims no landmark and no heading', () => {
    const { container } = render(<Stack testId={'stack'}>Matter</Stack>);
    const stack = screen.getByTestId('stack');
    expect(stack.tagName).toBe('DIV');
    // It arranges and nothing else: the Section around it owns the landmark and the page job.
    expect(stack).not.toHaveAttribute('role');
    expect(
      container.querySelector('section, h1, h2, h3, h4, h5, h6'),
    ).toBeNull();
  });

  it('places children unmodified, adding nothing to and stripping nothing from them', () => {
    render(
      <Stack testId={'stack'}>
        <p>First</p>
      </Stack>,
    );
    const child = screen.getByText('First');
    expect(child.tagName).toBe('P');
    expect(child.parentElement).toBe(screen.getByTestId('stack'));
  });

  it('separates its children on the sibling space role by default', () => {
    render(<Stack testId={'stack'}>Matter</Stack>);
    expect(screen.getByTestId('stack').className).toContain(
      'gap-[var(--space-stack)]',
    );
  });

  it('separates groups of blocks on the region space role when asked for it', () => {
    render(
      <Stack gap={'region'} testId={'stack'}>
        Matter
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack.className).toContain('gap-[var(--space-region)]');
    expect(stack.className).not.toContain('gap-[var(--space-stack)]');
  });

  it('never emits the band role as a gap - it is vertical padding and never a gap (ADR 0008)', () => {
    render(
      <>
        <Stack testId={'default'}>Matter</Stack>
        <Stack gap={'region'} testId={'region'}>
          Matter
        </Stack>
      </>,
    );
    expect(screen.getByTestId('default').className).not.toContain(
      '--space-band',
    );
    expect(screen.getByTestId('region').className).not.toContain(
      '--space-band',
    );
  });

  it('is unbounded unless the caller asks for the reading measure', () => {
    render(<Stack testId={'stack'}>Matter</Stack>);
    expect(screen.getByTestId('stack').className).not.toMatch(/\bmax-w-/);
  });

  it('bounds the column to the reading measure when measure is set', () => {
    render(
      <Stack measure testId={'stack'}>
        Matter
      </Stack>,
    );
    expect(screen.getByTestId('stack').className).toContain(
      'max-w-[var(--measure)]',
    );
  });

  it('bounds to the reading measure only - no wider or display measure is on offer (ADR 0008)', () => {
    render(
      <Stack measure testId={'stack'}>
        Matter
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack.className).not.toContain('--measure-wide');
    expect(stack.className).not.toContain('--measure-display');
  });

  it('is a column at every width by default, never changing axis', () => {
    render(<Stack testId={'stack'}>Matter</Stack>);
    const stack = screen.getByTestId('stack');
    expect(stack.className).toContain('flex');
    expect(stack.className).toContain('flex-col');
    expect(stack.className).not.toContain('flex-row');
  });

  it('becomes a row on a wide viewport when split, at the breakpoint the two-track components use', () => {
    render(
      <Stack direction={'split'} testId={'stack'}>
        Matter
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    // Rail and DefinitionList already turn at `lg`; a second threshold would be a new one to learn.
    expect(stack.className).toContain('flex-col');
    expect(stack.className).toContain('lg:flex-row');
    // Aligned to the start edge rather than stretched: a row of blocks of unequal height should not
    // grow the short one to the tall one's height.
    expect(stack.className).toContain('lg:items-start');
  });

  it('takes no outer space, so whatever holds it owns the rhythm around it', () => {
    render(
      <Stack gap={'region'} measure direction={'split'} testId={'stack'}>
        Matter
      </Stack>,
    );
    const stack = screen.getByTestId('stack');
    expect(stack.className).not.toMatch(/\bm[trblxy]?-/);
    expect(stack.className).not.toContain('px-[var(--gutter)]');
    expect(stack.className).not.toContain('py-[var(--space-band)]');
  });

  it('expresses every value through a role, never a length or a numbered spacing rung', () => {
    render(
      <Stack gap={'region'} measure direction={'split'} testId={'stack'}>
        Matter
      </Stack>,
    );
    // A spacing this component cannot express through a role is a request for a measurement, which
    // docs/adr/0003 and docs/adr/0004 answer.
    for (const utility of screen.getByTestId('stack').className.split(' ')) {
      expect(utility).not.toMatch(/-\d/);
      expect(utility).not.toMatch(/\d(px|rem|em|ch|vh|vw)\b/);
    }
  });

  it('renders testId as the test attribute and emits none when it is omitted', () => {
    const { container } = render(<Stack>Matter</Stack>);
    expect(container.firstElementChild).not.toHaveAttribute('data-testid');
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(
      <Stack gap={'region'} measure direction={'split'}>
        Matter
      </Stack>,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  // The six specs below pin components that render this exact arrangement today against the Stack
  // that would render it. The architecture standard's import test forbids them from consuming Stack
  // (no component imports a sibling), so the duplication is deliberate and permanent - the same
  // mechanism, and the same reason, as Prose's spec pinning `Prose.Body` against `P`. What these
  // catch is drift: a recipe edited on one side and not the other.

  it('renders the same arrangement as the prose reading column', () => {
    render(
      <>
        <Prose.Root testId={'pinned'}>
          <Prose.Body>Body copy.</Prose.Body>
        </Prose.Root>
        <Stack gap={'stack'} measure testId={'stack'}>
          Matter
        </Stack>
      </>,
    );
    expect(screen.getByTestId('stack').className).toBe(
      screen.getByTestId('pinned').className,
    );
  });

  it("renders the same arrangement as the form's measure-bounded outer column", () => {
    render(
      <>
        <Form action={'/send'} testId={'pinned'}>
          <p>A field.</p>
        </Form>
        <Stack gap={'region'} measure testId={'stack'}>
          Matter
        </Stack>
      </>,
    );
    expect(screen.getByTestId('stack').className).toBe(
      screen.getByTestId('pinned').className,
    );
  });

  it("renders the same arrangement as the form's inner field column", () => {
    render(
      <>
        <Form action={'/send'} testId={'form'}>
          <p>A field.</p>
        </Form>
        <Stack testId={'stack'}>Matter</Stack>
      </>,
    );
    const fields = screen.getByTestId('form').firstElementChild;
    expect(screen.getByTestId('stack').className).toBe(fields?.className);
  });

  it("renders the same arrangement as the figure's caption column", () => {
    const { container } = render(
      <>
        <Figure
          src={'/plate.jpg'}
          alt={''}
          width={800}
          height={600}
          ratio={'landscape'}
          caption={'A plate.'}
        />
        <Stack testId={'stack'}>Matter</Stack>
      </>,
    );
    const figure = container.querySelector('figure');
    expect(screen.getByTestId('stack').className).toBe(figure?.className);
  });

  it("renders the same arrangement as the input's field column", () => {
    const { container } = render(
      <>
        <Input label={'Name'} name={'name'} />
        <Stack testId={'stack'}>Matter</Stack>
      </>,
    );
    const field = container.firstElementChild;
    expect(screen.getByTestId('stack').className).toBe(field?.className);
  });

  it("renders the same arrangement as the textarea's field column", () => {
    const { container } = render(
      <>
        <TextArea label={'Message'} name={'message'} />
        <Stack testId={'stack'}>Matter</Stack>
      </>,
    );
    const field = container.firstElementChild;
    expect(screen.getByTestId('stack').className).toBe(field?.className);
  });
});
