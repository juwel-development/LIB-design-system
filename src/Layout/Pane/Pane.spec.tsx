import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Button, Pane, Screen, Table } from 'index';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IPaneFootProps } from './Pane';

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

  it('leaves the sole overflowing keyboard group to the named table and preserves fixed content', () => {
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(800);
    render(
      <Pane.Root>
        <Pane.Head>Available artists</Pane.Head>
        <Pane.Body scrollOwner="child" ariaLabel="Unused body name">
          <Table.Root bounded caption="Artist roster">
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell scope="col">Artist</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <Button>Open artist</Button>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Pane.Body>
        <Pane.Foot>
          <Button>Confirm roster</Button>
        </Pane.Foot>
      </Pane.Root>,
    );
    const wrapper = screen.getByRole('group', { name: 'Artist roster' });
    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(
      within(wrapper).getByRole('table', { name: 'Artist roster' }),
    ).toBeInTheDocument();
    expect(
      within(wrapper).getByRole('columnheader', { name: 'Artist' }),
    ).toBeInTheDocument();
    expect(
      within(wrapper).queryByText('Available artists'),
    ).not.toBeInTheDocument();
    expect(
      within(wrapper).queryByRole('button', { name: 'Confirm roster' }),
    ).not.toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Open artist' }).focus());
    expect(screen.getByRole('button', { name: 'Open artist' })).toHaveFocus();
  });
  it.each([
    ['releases', 300, true],
    ['keeps', 0, false],
  ])(
    "%s Screen's bound for a pane with a %ipx row above it, counting that row against the remainder",
    (_, above, isReleased) => {
      // 400px of remainder holds a 100px head and a usable body; the 100px a row above the pane
      // - a tab row - leaves of it does not.
      const boxes: Record<string, { top: number; height: number }> = {
        row: { top: 0, height: above },
        pane: { top: above, height: 400 - above },
        head: { top: above, height: 100 },
      };
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: Element) {
          const isRemainder = this.parentElement?.tagName === 'MAIN';
          const box = isRemainder
            ? { top: 0, height: 400 }
            : (boxes[this.getAttribute('data-testid') ?? ''] ?? {
                top: 0,
                height: 0,
              });
          return { ...box, bottom: box.top + box.height } as DOMRect;
        },
      );
      render(
        <Screen>
          <div data-testid="row">Views</div>
          <Pane.Root testId="pane">
            <Pane.Head testId="head">Facts</Pane.Head>
            <Pane.Body ariaLabel="Entries">Rows</Pane.Body>
          </Pane.Root>
        </Screen>,
      );
      expect(
        screen.getByTestId('pane').hasAttribute('data-screen-unusable'),
      ).toBe(isReleased);
    },
  );
  it('measures its room again when content above it inside Screen changes, so the bound returns', async () => {
    const boxes: Record<string, { top: number; height: number }> = {
      pane: { top: 300, height: 100 },
      head: { top: 300, height: 100 },
    };
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        const box =
          this.parentElement?.tagName === 'MAIN'
            ? { top: 0, height: 400 }
            : (boxes[this.getAttribute('data-testid') ?? ''] ?? {
                top: 0,
                height: 0,
              });
        return { ...box, bottom: box.top + box.height } as DOMRect;
      },
    );
    const example = (strip: string) => (
      <Screen>
        <p>{strip}</p>
        <Pane.Root testId="pane">
          <Pane.Head testId="head">Facts</Pane.Head>
          <Pane.Body ariaLabel="Entries">Rows</Pane.Body>
        </Pane.Root>
      </Screen>
    );
    const { rerender } = render(example('A long strip of facts'));
    expect(screen.getByTestId('pane')).toHaveAttribute('data-screen-unusable');
    boxes.pane = { top: 0, height: 400 };
    await act(async () => rerender(example('Short')));
    expect(screen.getByTestId('pane')).not.toHaveAttribute(
      'data-screen-unusable',
    );
  });
  it('measures its room again when content above it changes only an attribute, so the bound returns', async () => {
    const boxes: Record<string, { top: number; height: number }> = {
      pane: { top: 300, height: 100 },
      head: { top: 300, height: 100 },
    };
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        const box =
          this.parentElement?.tagName === 'MAIN'
            ? { top: 0, height: 400 }
            : (boxes[this.getAttribute('data-testid') ?? ''] ?? {
                top: 0,
                height: 0,
              });
        return { ...box, bottom: box.top + box.height } as DOMRect;
      },
    );
    const example = (isLong: boolean) => (
      <Screen>
        <div>
          <p>Facts</p>
          <p hidden={!isLong}>A long strip of facts</p>
        </div>
        <Pane.Root testId="pane">
          <Pane.Head testId="head">Facts</Pane.Head>
          <Pane.Body ariaLabel="Entries">Rows</Pane.Body>
        </Pane.Root>
      </Screen>
    );
    const { rerender } = render(example(true));
    expect(screen.getByTestId('pane')).toHaveAttribute('data-screen-unusable');
    boxes.pane = { top: 0, height: 400 };
    await act(async () => rerender(example(false)));
    expect(screen.getByTestId('pane')).not.toHaveAttribute(
      'data-screen-unusable',
    );
  });

  it('renders an omitted foot placement exactly as the after-body default', () => {
    const pane = (placement?: 'after-body') => (
      <Pane.Root name="Release">
        <Pane.Head>Facts</Pane.Head>
        <Pane.Body ariaLabel="Rules">One rule</Pane.Body>
        <Pane.Foot placement={placement}>
          <button type="button">Complete</button>
        </Pane.Foot>
      </Pane.Root>
    );
    const omitted = render(pane()).container.innerHTML;
    const explicit = render(pane('after-body')).container.innerHTML;
    expect(explicit).toBe(omitted);
  });
  it('keeps the foot, a typed value, its selection and focus when the placement switches', () => {
    const pane = (placement: IPaneFootProps['placement']) => (
      <Pane.Root name="Release">
        <Pane.Head>
          <input aria-label="Release title" defaultValue="" />
        </Pane.Head>
        <Pane.Body ariaLabel="Rules">One rule</Pane.Body>
        <Pane.Foot placement={placement} testId="foot">
          <button type="button">Complete</button>
        </Pane.Foot>
      </Pane.Root>
    );
    const { rerender } = render(pane('after-body'));
    const foot = screen.getByTestId('foot');
    const input = screen.getByRole<HTMLInputElement>('textbox');
    fireEvent.input(input, { target: { value: 'Night Drive' } });
    input.focus();
    input.setSelectionRange(2, 6);
    for (const placement of ['bottom', 'after-body', 'bottom'] as const) {
      rerender(pane(placement));
      expect(screen.getByTestId('foot')).toBe(foot);
      expect(screen.getByRole('textbox')).toBe(input);
      expect(input).toHaveFocus();
      expect(input).toHaveValue('Night Drive');
      expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
    }
  });
  it('keeps a short body inert when the foot sits at the bottom', () => {
    render(
      <Pane.Root testId="pane">
        <Pane.Body ariaLabel="Rules" testId="body">
          One rule
        </Pane.Body>
        <Pane.Foot placement="bottom">
          <button type="button">Complete</button>
        </Pane.Foot>
      </Pane.Root>,
    );
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByTestId('body')).not.toHaveAttribute('tabindex');
    expect(screen.getByTestId('pane')).toHaveTextContent('One ruleComplete');
  });
  it('keeps one named stop for an overflowing body when the foot sits at the bottom', () => {
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200);
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(800);
    render(
      <Pane.Root>
        <Pane.Body ariaLabel="Rules">Long content</Pane.Body>
        <Pane.Foot placement="bottom">Act</Pane.Foot>
      </Pane.Root>,
    );
    expect(screen.getByRole('group', { name: 'Rules' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getAllByRole('group')).toHaveLength(1);
  });
  it('offers foot placement only as a closed choice', () => {
    render(
      <Pane.Root>
        {/* @ts-expect-error placement is a closed choice, not a CSS value */}
        <Pane.Foot placement="flex-end">Act</Pane.Foot>
        {/* @ts-expect-error Head has no placement */}
        <Pane.Head placement="bottom">Facts</Pane.Head>
      </Pane.Root>,
    );
    expect(screen.getByText('Act')).toBeInTheDocument();
  });
});
