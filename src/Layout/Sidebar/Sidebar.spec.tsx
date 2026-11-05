import { fireEvent, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { userEvent } from 'storybook/test';
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
        <p>The active section&apos;s matter.</p>
      </Sidebar.Content>
    </Sidebar.Root>,
  );

describe('Sidebar', () => {
  it('accepts a fill bound without measuring an ancestor scrollport and keeps selection and content semantics', () => {
    const measure = vi.spyOn(window, 'getComputedStyle');
    const select = new Subject<string>();
    const selected: string[] = [];
    select.subscribe((key) => selected.push(key));
    render(
      <Sidebar.Root fill active="hub" label="Sections" onSelect$={select}>
        <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
        <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
        <Sidebar.Content>
          <main>
            <input aria-label="Draft" defaultValue="Retained" />
          </main>
        </Sidebar.Content>
      </Sidebar.Root>,
    );
    expect(measure).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Staff' }));
    expect(selected).toEqual(['staff']);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue(
      'Retained',
    );
    measure.mockRestore();
  });

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
    expect(screen.getByRole('button', { name: 'Staff' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByText("The active section's matter.")).toBeVisible();
  });

  it('requests the current section once without changing its indication, content or focus', () => {
    const onSelect$ = new Subject<string>();
    const emitted: string[] = [];
    onSelect$.subscribe((entryKey) => emitted.push(entryKey));
    renderSidebar({ active: 'staff', onSelect$ });
    const active = screen.getByRole('button', { name: 'Staff' });
    expect(active).not.toBeDisabled();
    active.focus();
    expect(active).toHaveFocus();
    expect(emitted).toEqual([]);
    fireEvent.click(active);
    expect(emitted).toEqual(['staff']);
    expect(active).toHaveAttribute('aria-current', 'true');
    expect(active).toHaveFocus();
    expect(screen.getByText("The active section's matter.")).toBeVisible();
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

  it.each(['{Enter}', ' '])(
    'requests inactive and current entries once per %s activation and skips inert entries',
    async (key) => {
      const user = userEvent.setup();
      const onSelect$ = new Subject<string>();
      const emitted: string[] = [];
      onSelect$.subscribe((entryKey) => emitted.push(entryKey));
      renderSidebar({ onSelect$ });

      await user.tab();
      expect(screen.getByRole('button', { name: 'Hub' })).toHaveFocus();
      expect(emitted).toEqual([]);
      await user.keyboard(key);
      expect(emitted).toEqual(['hub']);
      await user.tab();
      const current = screen.getByRole('button', { name: 'Staff' });
      expect(current).toHaveFocus();
      await user.keyboard(key);
      expect(emitted).toEqual(['hub', 'staff']);
      expect(current).toHaveFocus();
      expect(current).toHaveAttribute('aria-current', 'true');
    },
  );

  it('leaves the output Subject alive when the consumer replaces it or unmounts', () => {
    const original = new Subject<string>();
    const replacement = new Subject<string>();
    const emitted: string[] = [];
    const completed = vi.fn();
    original.subscribe({
      next: (key) => emitted.push(key),
      complete: completed,
    });
    replacement.subscribe({
      next: (key) => emitted.push(key),
      complete: completed,
    });
    const view = renderSidebar({ onSelect$: original });
    view.rerender(
      <Sidebar.Root active="staff" label="Sections" onSelect$={replacement}>
        <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
        <Sidebar.Content>Changed by the consumer</Sidebar.Content>
      </Sidebar.Root>,
    );
    expect(emitted).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Staff' }));
    expect(emitted).toEqual(['staff']);
    view.unmount();
    expect(completed).not.toHaveBeenCalled();
    original.next('original still usable');
    replacement.next('replacement still usable');
    expect(emitted).toEqual([
      'staff',
      'original still usable',
      'replacement still usable',
    ]);
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
      screen.getByText("The active section's matter."),
    );
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
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

  it('renders an unbroken translated label in full and never renames or truncates it - the wrapping itself is measured in the browser by the stories', () => {
    const label = 'Vertragsverhandlungsübersicht';
    render(
      <Sidebar.Root
        active="contracts"
        label="Bereiche"
        onSelect$={new Subject()}
      >
        <Sidebar.Item entryKey="contracts">{label}</Sidebar.Item>
        <Sidebar.Content>Inhalt</Sidebar.Content>
      </Sidebar.Root>,
    );
    const entry = screen.getByRole('button', { name: label });
    expect(entry).toHaveTextContent(label);
    expect(entry).not.toHaveAttribute('title');
    expect(entry).not.toHaveAttribute('aria-label');
  });

  it('is one namespace object carrying exactly its three members', () => {
    expect(Object.keys(Sidebar).sort()).toEqual(
      ['Content', 'Item', 'Root'].sort(),
    );
  });
});
