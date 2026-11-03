import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Pane } from 'index';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Pane', () => {
  afterEach(() => vi.restoreAllMocks());
  it('leaves scroll semantics to a child-owned region even when the child overflows', () => {
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(800);
    render(
      <Pane.Root>
        <Pane.Body scrollOwner="child" ariaLabel="Unused" testId="body">
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: fixture represents a child-owned keyboard scroll region */}
          <section aria-label="Child region" tabIndex={0}>
            Rows
          </section>
        </Pane.Body>
      </Pane.Root>,
    );
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByTestId('body')).not.toHaveAttribute('tabindex');
    expect(
      screen.getByRole('region', { name: 'Child region' }),
    ).toHaveAttribute('tabindex', '0');
  });
  it('makes only an overflowing body a named keyboard stop', () => {
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(800);
    render(
      <Pane.Root>
        <Pane.Head>Facts</Pane.Head>
        <Pane.Body ariaLabel="Entries">Long content</Pane.Body>
        <Pane.Foot>Act</Pane.Foot>
      </Pane.Root>,
    );
    expect(screen.getByRole('group', { name: 'Entries' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getAllByRole('group')).toHaveLength(1);
  });
  it('groups consumer-owned head, body and foot in reading order under the supplied name', () => {
    render(
      <Pane.Root name="Letter">
        <Pane.Head>Subject</Pane.Head>
        <Pane.Body ariaLabel="Letter text">Message</Pane.Body>
        <Pane.Foot>
          <button type="button">Reply</button>
        </Pane.Foot>
      </Pane.Root>,
    );
    const pane = screen.getByRole('group', { name: 'Letter' });
    expect(pane).toHaveTextContent('SubjectMessageReply');
    expect(
      within(pane).getByRole('button', { name: 'Reply' }),
    ).toBeInTheDocument();
    expect(pane).not.toHaveAttribute('tabindex');
  });
  it.each([undefined, ''])(
    'keeps an unnamed enclosure and fitting body inert (%s)',
    (name) => {
      render(
        <Pane.Root name={name} testId="pane">
          <Pane.Body ariaLabel="Entries" testId="body">
            A short message
          </Pane.Body>
        </Pane.Root>,
      );
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
      for (const id of ['pane', 'body']) {
        expect(screen.getByTestId(id)).not.toHaveAttribute('tabindex');
        expect(screen.getByTestId(id)).not.toHaveAttribute('aria-label');
      }
    },
  );

  it('allows every slot to be omitted without inventing content or landmarks', () => {
    const { rerender } = render(<Pane.Root testId="pane" />);
    expect(screen.getByTestId('pane')).toBeEmptyDOMElement();
    rerender(
      <Pane.Root>
        <Pane.Head>Facts only</Pane.Head>
        <Pane.Foot>Act only</Pane.Foot>
      </Pane.Root>,
    );
    expect(screen.getByText('Facts only')).toBeInTheDocument();
    expect(screen.getByText('Act only')).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('updates overflow after resize and retains a focused stop until blur', () => {
    const height = vi
      .spyOn(Element.prototype, 'scrollHeight', 'get')
      .mockReturnValue(800);
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
    render(
      <Pane.Root>
        <Pane.Body ariaLabel="Entries">
          <button type="button">Select</button>
        </Pane.Body>
      </Pane.Root>,
    );
    const body = screen.getByRole('group', { name: 'Entries' });
    body.focus();
    height.mockReturnValue(100);
    fireEvent(window, new Event('resize'));
    expect(body).toHaveFocus();
    expect(body).toHaveAttribute('tabindex', '0');
    act(() => screen.getByRole('button', { name: 'Select' }).focus());
    expect(body).not.toHaveAttribute('tabindex');
    expect(body).not.toHaveAttribute('role');
    height.mockReturnValue(800);
    fireEvent(window, new Event('resize'));
    expect(body).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button')).toHaveFocus();
  });

  it('re-measures replaced content and leaves child control keys alone', async () => {
    const height = vi
      .spyOn(Element.prototype, 'scrollHeight', 'get')
      .mockReturnValue(100);
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
    const { rerender } = render(
      <Pane.Root>
        <Pane.Body ariaLabel="Entries">Short</Pane.Body>
      </Pane.Root>,
    );
    height.mockReturnValue(800);
    rerender(
      <Pane.Root>
        <Pane.Body ariaLabel="Entries">
          <button type="button">Select last</button>
        </Pane.Body>
      </Pane.Root>,
    );
    expect(
      await screen.findByRole('group', { name: 'Entries' }),
    ).toHaveAttribute('tabindex', '0');
    const control = screen.getByRole('button');
    for (const key of ['ArrowDown', 'PageDown', 'Tab', ' ']) {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      });
      control.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('does not add a second stop when ownership changes to the child', () => {
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(800);
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
    const { rerender } = render(
      <Pane.Root>
        <Pane.Body ariaLabel="Entries">Content</Pane.Body>
      </Pane.Root>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('tabindex', '0');
    rerender(
      <Pane.Root>
        <Pane.Body scrollOwner="child" ariaLabel="Entries">
          Content
        </Pane.Body>
      </Pane.Root>,
    );
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });
});
