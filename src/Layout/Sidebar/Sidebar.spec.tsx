import { fireEvent, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

const renderSidebar = (options?: {
  active?: string;
  onSelect$?: Subject<string>;
  rootId?: string;
  contentId?: string;
}) =>
  render(
    <Sidebar.Root
      active={options?.active ?? 'staff'}
      label="Sections"
      onSelect$={options?.onSelect$ ?? new Subject<string>()}
      testId={options?.rootId}
    >
      <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
      <Sidebar.Item entryKey="contracts" inert>
        Contracts
      </Sidebar.Item>
      <Sidebar.Item entryKey="staff" testId="staff-entry">
        Staff
      </Sidebar.Item>
      <Sidebar.Content testId={options?.contentId}>
        <p>The standing section&apos;s matter.</p>
      </Sidebar.Content>
    </Sidebar.Root>,
  );

describe('Sidebar', () => {
  it('renders a nav landmark named by label, listing the entries in Item order', () => {
    renderSidebar();
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    const entries = Array.from(nav.querySelectorAll('li')).map(
      (item) => item.textContent,
    );
    expect(entries).toEqual(['Hub', 'Contracts', 'Staff']);
  });

  it('renders entries as plain buttons, so activating one cannot submit a surrounding form', () => {
    const submitted = vi.fn();
    render(
      <form onSubmit={submitted}>
        <Sidebar.Root
          active="hub"
          label="Sections"
          onSelect$={new Subject<string>()}
        >
          <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
          <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
          <Sidebar.Content>content</Sidebar.Content>
        </Sidebar.Root>
      </form>,
    );
    const entry = screen.getByRole('button', { name: 'Staff' });
    expect(entry).toHaveAttribute('type', 'button');
    fireEvent.click(entry);
    expect(submitted).not.toHaveBeenCalled();
  });

  it('marks the active entry alone with aria-current="true" - the agreed value, not "page"', () => {
    renderSidebar({ active: 'staff' });
    expect(screen.getByRole('button', { name: 'Staff' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Hub' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('emits the entryKey exactly once when a usable inactive entry is activated', () => {
    const onSelect$ = new Subject<string>();
    const emitted: string[] = [];
    onSelect$.subscribe((entryKey) => emitted.push(entryKey));
    renderSidebar({ active: 'staff', onSelect$ });
    fireEvent.click(screen.getByRole('button', { name: 'Hub' }));
    expect(emitted).toEqual(['hub']);
  });

  it('keeps the active entry focusable but emits nothing when it is activated', () => {
    const onSelect$ = new Subject<string>();
    const emitted: string[] = [];
    onSelect$.subscribe((entryKey) => emitted.push(entryKey));
    renderSidebar({ active: 'staff', onSelect$ });
    const active = screen.getByRole('button', { name: 'Staff' });
    expect(active).not.toBeDisabled();
    active.focus();
    expect(active).toHaveFocus();
    fireEvent.click(active);
    expect(emitted).toEqual([]);
  });

  it('keeps an inert entry visible but disabled - out of the Tab order and emitting nothing', () => {
    const onSelect$ = new Subject<string>();
    const emitted: string[] = [];
    onSelect$.subscribe((entryKey) => emitted.push(entryKey));
    renderSidebar({ onSelect$ });
    const inert = screen.getByRole('button', { name: 'Contracts' });
    expect(inert).toBeVisible();
    expect(inert).toBeDisabled();
    fireEvent.click(inert);
    expect(emitted).toEqual([]);
  });

  it('emits nothing on render or rerender - selection is the user acting, never the component', () => {
    const onSelect$ = new Subject<string>();
    const emitted: string[] = [];
    onSelect$.subscribe((entryKey) => emitted.push(entryKey));
    const view = renderSidebar({ active: 'staff', onSelect$ });
    view.rerender(
      <Sidebar.Root active="hub" label="Sections" onSelect$={onSelect$}>
        <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
        <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
        <Sidebar.Content>content</Sidebar.Content>
      </Sidebar.Root>,
    );
    expect(emitted).toEqual([]);
  });

  it('follows the supplied active key on rerender and leaves focus where the user put it', () => {
    const onSelect$ = new Subject<string>();
    const view = renderSidebar({ active: 'staff', onSelect$ });
    const hub = screen.getByRole('button', { name: 'Hub' });
    hub.focus();
    view.rerender(
      <Sidebar.Root active="hub" label="Sections" onSelect$={onSelect$}>
        <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
        <Sidebar.Item entryKey="contracts" inert>
          Contracts
        </Sidebar.Item>
        <Sidebar.Item entryKey="staff" testId="staff-entry">
          Staff
        </Sidebar.Item>
        <Sidebar.Content>content</Sidebar.Content>
      </Sidebar.Root>,
    );
    expect(screen.getByRole('button', { name: 'Hub' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Staff' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('button', { name: 'Hub' })).toHaveFocus();
  });

  it('selects no fallback and emits no corrective event when the active key matches no entry', () => {
    const onSelect$ = new Subject<string>();
    const emitted: string[] = [];
    onSelect$.subscribe((entryKey) => emitted.push(entryKey));
    renderSidebar({ active: 'missing', onSelect$ });
    for (const entry of screen.getAllByRole('button')) {
      expect(entry).not.toHaveAttribute('aria-current');
    }
    expect(emitted).toEqual([]);
  });

  it('renders Content once, unstyled and without a landmark - the consumer owns its inside', () => {
    renderSidebar({ contentId: 'content' });
    const content = screen.getByTestId('content');
    expect(content).toContainElement(
      screen.getByText("The standing section's matter."),
    );
    expect(content.className).toBe('');
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('renders Root as a plain div: a one-column flow that becomes a 12rem nav track beside minmax(0,1fr) at lg', () => {
    // The switch is a media query, not a prop; jsdom computes no layout, so we assert the markup the
    // stylesheet keys on - the same justification as Rail's responsive assertions.
    renderSidebar({ rootId: 'root' });
    const root = screen.getByTestId('root');
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('grid');
    expect(root.className).toMatch(/\blg:grid-cols-\[12rem_minmax\(0,1fr\)\]/);
  });

  it('makes the nav sticky, height-capped and independently scrollable only at and above 64rem', () => {
    // Below lg the whole list lies above the content in normal flow: no base sticky, cap or scroller.
    renderSidebar();
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(nav).toHaveClass('lg:sticky');
    expect(nav).toHaveClass('lg:top-0');
    expect(nav).toHaveClass('lg:max-h-dvh');
    expect(nav).toHaveClass('lg:overflow-y-auto');
    expect(nav.className).not.toMatch(/(^|\s)sticky\b/);
    expect(nav.className).not.toMatch(/(^|\s)top-/);
    expect(nav.className).not.toMatch(/(^|\s)max-h-/);
    expect(nav.className).not.toMatch(/(^|\s)overflow-/);
  });

  it('tells the three entry states apart by colour and underline, with no active background role', () => {
    renderSidebar({ active: 'staff' });
    const active = screen.getByRole('button', { name: 'Staff' });
    const usable = screen.getByRole('button', { name: 'Hub' });
    const inert = screen.getByRole('button', { name: 'Contracts' });
    expect(active).toHaveClass('text-foreground');
    expect(active).toHaveClass('underline');
    expect(usable).toHaveClass('text-foreground');
    expect(usable.className).not.toMatch(/(^|\s)underline(\s|$)/);
    expect(usable.className).toMatch(/\bhover:underline\b/);
    expect(inert).toHaveClass('text-muted');
    for (const entry of [active, usable, inert]) {
      expect(entry.className).not.toMatch(/(^|[\s:])bg-/);
    }
  });

  it('carries no dark: class - colours are semantic tokens re-pointed by the dark class', () => {
    const { container } = renderSidebar();
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  it('exposes the one sanctioned host hook through testId on each member', () => {
    renderSidebar({ rootId: 'the-root', contentId: 'the-content' });
    expect(screen.getByTestId('the-root').tagName).toBe('DIV');
    expect(screen.getByTestId('staff-entry').tagName).toBe('BUTTON');
    expect(screen.getByTestId('the-content').tagName).toBe('DIV');
  });

  it('closes the surface at the type level: text-only Item children, no className anywhere', () => {
    const onSelect$ = new Subject<string>();
    const rejected = (
      // @ts-expect-error - an Item child is the entry's text, never arbitrary markup
      <Sidebar.Item entryKey="hub">
        <em>Hub</em>
      </Sidebar.Item>
    );
    const closed = (
      <Sidebar.Root
        active="hub"
        label="Sections"
        onSelect$={onSelect$}
        // @ts-expect-error - no className escape hatch on any member
        className="escape"
      />
    );
    expect(rejected).toBeDefined();
    expect(closed).toBeDefined();
  });

  it('is one namespace object carrying exactly its three members', () => {
    expect(Object.keys(Sidebar).sort()).toEqual(
      ['Content', 'Item', 'Root'].sort(),
    );
  });
});
