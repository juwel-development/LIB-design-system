import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Box as PublicBox } from 'index';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Box } from './Box';

describe('Box', () => {
  it('publishes Box through the component entry point', () => {
    expect(PublicBox).toBe(Box);
  });

  it('renders the children it is handed, unmodified and in order', () => {
    render(
      <Box>
        <h3>Summary</h3>
        <p>First fact</p>
        <p>Second fact</p>
      </Box>,
    );
    const box = screen.getByText('Summary').parentElement;
    expect(box).not.toBeNull();
    expect(box?.textContent).toBe('SummaryFirst factSecond fact');
  });

  it('exposes an accessible group named by `name`, with no visible heading of its own', () => {
    render(
      <Box name={'Selected artist'}>
        <p>Fact</p>
      </Box>,
    );
    const group = screen.getByRole('group', { name: 'Selected artist' });
    expect(group).toBeInTheDocument();
    // The name is the group's accessible name only: no heading is rendered from it.
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(group).not.toHaveTextContent('Selected artist');
  });

  it('is an ordinary enclosure without a name: no role, no label and no landmark', () => {
    render(
      <Box testId={'plain'}>
        <p>Fact</p>
      </Box>,
    );
    const box = screen.getByTestId('plain');
    expect(box).not.toHaveAttribute('role');
    expect(box).not.toHaveAttribute('aria-label');
    expect(box).not.toHaveAttribute('aria-labelledby');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('treats an empty name as no name, so it never exposes a group that has nothing to announce', () => {
    render(
      <Box name={''} testId={'blank'}>
        <p>Fact</p>
      </Box>,
    );
    const box = screen.getByTestId('blank');
    expect(box).not.toHaveAttribute('role');
    expect(box).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('renders an empty enclosure with no invented empty-state text', () => {
    render(<Box testId={'empty'} />);
    const box = screen.getByTestId('empty');
    expect(box).toBeInTheDocument();
    expect(box).toBeEmptyDOMElement();
  });

  it('adds no focus stop of its own, named or not', () => {
    const { rerender } = render(<Box testId={'box'}>Fact</Box>);
    expect(screen.getByTestId('box')).not.toHaveAttribute('tabindex');
    expect(screen.getByTestId('box').tabIndex).toBe(-1);

    rerender(
      <Box name={'Named'} testId={'box'}>
        Fact
      </Box>,
    );
    const named = screen.getByRole('group', { name: 'Named' });
    expect(named).not.toHaveAttribute('tabindex');
    expect(named.tabIndex).toBe(-1);
  });

  it('leaves consumer controls inside it independently focusable and operable', () => {
    const activate$ = new Subject<void>();
    const activations: string[] = [];
    const subscription = activate$.subscribe(() =>
      activations.push('activated'),
    );
    render(
      <Box name={'Actions'}>
        <Input label={'Artist'} name={'artist'} />
        <Button onClick$={activate$}>Activate</Button>
      </Box>,
    );
    const box = screen.getByRole('group', { name: 'Actions' });
    const input = within(box).getByRole('textbox', { name: 'Artist' });
    const button = within(box).getByRole('button', { name: 'Activate' });
    input.focus();
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'Ada' } });
    expect(input).toHaveValue('Ada');
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(activations).toEqual(['activated']);
    fireEvent.click(box);
    expect(activations).toEqual(['activated']);
    subscription.unsubscribe();
  });

  it('intercepts no key: Tab and Enter pass through the box unprevented, so controls keep their ordinary keyboard behaviour', () => {
    render(
      <Box name={'Actions'}>
        <Input label={'Artist'} name={'artist'} />
        <Button>Activate</Button>
      </Box>,
    );
    const box = screen.getByRole('group', { name: 'Actions' });
    const input = within(box).getByRole('textbox', { name: 'Artist' });
    const button = within(box).getByRole('button', { name: 'Activate' });
    input.focus();
    // fireEvent returns false when a listener called preventDefault: the box must never do so.
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
    expect(input).toHaveFocus();
    button.focus();
    expect(fireEvent.keyDown(button, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(button, { key: ' ' })).toBe(true);
    expect(button).toHaveFocus();
  });

  it('maps testId to the test hook attribute and omits it otherwise', () => {
    const { container, rerender } = render(<Box>Fact</Box>);
    expect(container.querySelector('[data-testid]')).toBeNull();

    rerender(<Box testId={'summary'}>Fact</Box>);
    expect(screen.getByTestId('summary')).toHaveTextContent('Fact');
  });

  it('insets its content from the one box inset role, so a theme re-points the padding without a prop', () => {
    // jsdom resolves no stylesheet, so the token contract - not the layout - is what is pinned
    // here; the rendered inset is measured in the browser evidence (docs/agents/reports/117).
    render(<Box testId={'box'}>Fact</Box>);
    expect(screen.getByTestId('box').className).toContain(
      'var(--space-box-inset)',
    );
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(
      <Box name={'Named'}>
        <p>Fact</p>
      </Box>,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });
});
