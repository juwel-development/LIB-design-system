import { fireEvent, render, screen } from '@testing-library/react';
import {
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

// jsdom lays nothing out and ships no scrollIntoView, which the arrow handler calls; give the
// environment the method it lacks. The dedicated scrolling test below swaps in its own spy.
window.HTMLElement.prototype.scrollIntoView = () => {};

// A fixed, uncontrolled composition: `active` is pinned to what the test passes, so what these
// renders prove is that Tabs renders the value it is given and never a selection of its own.
const staffTabs = (active: string, onSelect$: Subject<string>) => (
  <Tabs.Root active={active} onSelect$={onSelect$} label={'Staff'}>
    <Tabs.List>
      <Tabs.Tab value={'staff'}>Staff</Tabs.Tab>
      <Tabs.Tab value={'candidates'}>Candidates</Tabs.Tab>
      <Tabs.Tab value={'alumni'}>Alumni</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value={'staff'}>Staff list</Tabs.Panel>
    <Tabs.Panel value={'candidates'}>Candidate list</Tabs.Panel>
    <Tabs.Panel value={'alumni'}>Alumni list</Tabs.Panel>
  </Tabs.Root>
);

// The controlled harness the brief asks for: the consumer owns the active key and feeds selection
// requests back into it, exactly as a consuming product would.
const ControlledStaff: FunctionComponent<{
  onSelect$: Subject<string>;
  children?: ReactNode;
}> = ({ onSelect$, children }) => {
  const [active, setActive] = useState('staff');
  useEffect(() => {
    const subscription = onSelect$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  return (
    <Tabs.Root active={active} onSelect$={onSelect$} label={'Staff'}>
      <Tabs.List>
        <Tabs.Tab value={'staff'}>Staff</Tabs.Tab>
        <Tabs.Tab value={'candidates'}>Candidates</Tabs.Tab>
        <Tabs.Tab value={'alumni'}>Alumni</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value={'staff'}>{children ?? 'Staff list'}</Tabs.Panel>
      <Tabs.Panel value={'candidates'}>Candidate list</Tabs.Panel>
      <Tabs.Panel value={'alumni'}>Alumni list</Tabs.Panel>
    </Tabs.Root>
  );
};

// A stateful child: its count surviving a tab switch would mean Tabs kept the subtree alive.
const Counter: FunctionComponent = () => {
  const [count, setCount] = useState(0);
  return (
    <button type={'button'} onClick={() => setCount(count + 1)}>
      count is {count}
    </button>
  );
};

describe('Tabs Component', () => {
  it('renders a tab list named by the label prop', () => {
    render(staffTabs('staff', new Subject<string>()));
    expect(screen.getByRole('tablist', { name: 'Staff' })).toBeInTheDocument();
  });

  it('renders every tab with its text label, in rendered order', () => {
    render(staffTabs('staff', new Subject<string>()));
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Staff',
      'Candidates',
      'Alumni',
    ]);
  });

  it('selects exactly the tab named by the active prop', () => {
    render(staffTabs('candidates', new Subject<string>()));
    expect(screen.getByRole('tab', { name: 'Candidates' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    for (const name of ['Staff', 'Alumni']) {
      expect(screen.getByRole('tab', { name })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    }
  });

  it('shows exactly one panel - the active value names - and its content', () => {
    render(staffTabs('candidates', new Subject<string>()));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Candidate list');
    expect(screen.queryByText('Staff list')).not.toBeInTheDocument();
  });

  it('wires each tab to its own panel: aria-controls one way, aria-labelledby back', () => {
    render(staffTabs('candidates', new Subject<string>()));
    const tab = screen.getByRole('tab', { name: 'Candidates' });
    const panel = screen.getByRole('tabpanel');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    expect(screen.getByRole('tabpanel', { name: 'Candidates' })).toBe(panel);
  });

  it('keeps inactive panels hidden and empty, so they add nothing to any tree', () => {
    render(staffTabs('staff', new Subject<string>()));
    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(3);
    const hiddenPanels = panels.filter((panel) => panel.hidden);
    expect(hiddenPanels).toHaveLength(2);
    for (const panel of hiddenPanels) {
      expect(panel).toBeEmptyDOMElement();
    }
  });

  it('gives two instances collision-free tab and panel ids', () => {
    render(
      <>
        {staffTabs('staff', new Subject<string>())}
        {staffTabs('staff', new Subject<string>())}
      </>,
    );
    const ids = [
      ...screen.getAllByRole('tab'),
      ...screen.getAllByRole('tabpanel', { hidden: true }),
    ].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps ids stable across rerenders and selection changes, so associations survive', () => {
    const onSelect$ = new Subject<string>();
    const { rerender } = render(staffTabs('staff', onSelect$));
    const idsBefore = screen.getAllByRole('tab').map((tab) => tab.id);
    rerender(staffTabs('candidates', onSelect$));
    expect(screen.getAllByRole('tab').map((tab) => tab.id)).toEqual(idsBefore);
  });

  it('requests selection through the Subject on click, and renders no selection of its own', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(staffTabs('staff', onSelect$));

    fireEvent.click(screen.getByRole('tab', { name: 'Candidates' }));

    expect(selected).toHaveBeenCalledWith('candidates');
    // The active prop did not change, so neither does the rendered selection - no optimism.
    expect(screen.getByRole('tab', { name: 'Staff' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Staff list');
  });

  it('follows the supplied active prop when the consumer answers a selection request', () => {
    const onSelect$ = new Subject<string>();
    render(<ControlledStaff onSelect$={onSelect$} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Candidates' }));

    expect(screen.getByRole('tab', { name: 'Candidates' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Candidate list');
  });

  it('moves focus and requests selection with ArrowRight, staying on the tab', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(<ControlledStaff onSelect$={onSelect$} />);
    const staff = screen.getByRole('tab', { name: 'Staff' });
    staff.focus();

    fireEvent.keyDown(staff, { key: 'ArrowRight' });

    const candidates = screen.getByRole('tab', { name: 'Candidates' });
    expect(selected).toHaveBeenCalledWith('candidates');
    expect(candidates).toHaveFocus();
    expect(candidates).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps ArrowRight from the last tab to the first', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(<ControlledStaff onSelect$={onSelect$} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Alumni' }));
    const alumni = screen.getByRole('tab', { name: 'Alumni' });
    alumni.focus();

    fireEvent.keyDown(alumni, { key: 'ArrowRight' });

    expect(selected).toHaveBeenLastCalledWith('staff');
    expect(screen.getByRole('tab', { name: 'Staff' })).toHaveFocus();
  });

  it('wraps ArrowLeft from the first tab to the last', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(<ControlledStaff onSelect$={onSelect$} />);
    const staff = screen.getByRole('tab', { name: 'Staff' });
    staff.focus();

    fireEvent.keyDown(staff, { key: 'ArrowLeft' });

    expect(selected).toHaveBeenLastCalledWith('alumni');
    expect(screen.getByRole('tab', { name: 'Alumni' })).toHaveFocus();
  });

  it('leaves Up and Down to the browser, so vertical scrolling keeps working', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    render(staffTabs('staff', onSelect$));
    const staff = screen.getByRole('tab', { name: 'Staff' });
    staff.focus();

    fireEvent.keyDown(staff, { key: 'ArrowDown' });
    fireEvent.keyDown(staff, { key: 'ArrowUp' });

    expect(selected).not.toHaveBeenCalled();
    expect(staff).toHaveFocus();
  });

  it('enters the tab list at the active tab: roving tabindex, 0 on active, -1 elsewhere', () => {
    render(staffTabs('candidates', new Subject<string>()));
    expect(screen.getByRole('tab', { name: 'Candidates' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    for (const name of ['Staff', 'Alumni']) {
      expect(screen.getByRole('tab', { name })).toHaveAttribute(
        'tabindex',
        '-1',
      );
    }
  });

  it('makes the active panel a Tab stop when its content is text-only', () => {
    render(staffTabs('staff', new Subject<string>()));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
  });

  it('keeps the active panel a Tab stop when its content has focusable descendants', () => {
    const onSelect$ = new Subject<string>();
    render(
      <ControlledStaff onSelect$={onSelect$}>
        <Counter />
      </ControlledStaff>,
    );
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
  });

  it('gives inactive panels no Tab stop', () => {
    render(staffTabs('staff', new Subject<string>()));
    const inactive = screen
      .getAllByRole('tabpanel', { hidden: true })
      .filter((panel) => panel.hidden);
    for (const panel of inactive) {
      expect(panel).not.toHaveAttribute('tabindex');
    }
  });

  it('unmounts a departed panel and mounts the return fresh, retaining no inactive state', () => {
    const onSelect$ = new Subject<string>();
    render(
      <ControlledStaff onSelect$={onSelect$}>
        <Counter />
      </ControlledStaff>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'count is 0' }));
    expect(
      screen.getByRole('button', { name: 'count is 1' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Candidates' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Staff' }));

    expect(
      screen.getByRole('button', { name: 'count is 0' }),
    ).toBeInTheDocument();
  });

  it('shows the supplied replacement when a valid update removes the active tab, emitting nothing', () => {
    const onSelect$ = new Subject<string>();
    const selected = vi.fn();
    onSelect$.subscribe(selected);
    const { rerender } = render(staffTabs('staff', onSelect$));

    rerender(
      <Tabs.Root active={'candidates'} onSelect$={onSelect$} label={'Staff'}>
        <Tabs.List>
          <Tabs.Tab value={'candidates'}>Candidates</Tabs.Tab>
          <Tabs.Tab value={'alumni'}>Alumni</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value={'candidates'}>Candidate list</Tabs.Panel>
        <Tabs.Panel value={'alumni'}>Alumni list</Tabs.Panel>
      </Tabs.Root>,
    );

    expect(screen.getByRole('tab', { name: 'Candidates' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Candidate list');
    expect(selected).not.toHaveBeenCalled();
  });

  it('throws when a member is composed outside Tabs.Root, loud and early', () => {
    // The member cannot render without the Root's contract, so this is an invariant, not a state.
    expect(() =>
      render(<Tabs.Tab value={'staff'}>Staff</Tabs.Tab>),
    ).toThrowError(/Tabs\.Root/);
  });

  it('marks selection with a persistent line from the marker token, in foreground, not a shade', () => {
    render(staffTabs('staff', new Subject<string>()));
    const className = screen.getByRole('tab', { name: 'Staff' }).className;

    // The marker's thickness is the named token, held constant across both states so selection
    // shifts no geometry; only its colour flips, keyed on aria-selected.
    expect(className).toContain(
      'border-b-[length:var(--tab-marker-thickness)]',
    );
    expect(className).toContain('border-transparent');
    expect(className).toContain('aria-selected:border-foreground');
    // Semantic tokens only: no dark: class, no numeric ramp step.
    expect(className).not.toContain('dark:');
    expect(className).not.toMatch(
      /(?:bg|text|ring|border|from|via|to)-[a-z]+-(?:50|[1-9]00)\b/,
    );
  });

  it('keeps text weight identical across selection, so switching shifts no widths', () => {
    render(staffTabs('staff', new Subject<string>()));
    const className = screen.getByRole('tab', { name: 'Staff' }).className;

    expect(className).not.toMatch(/aria-selected:font-/);
    expect(className).not.toMatch(/aria-selected:tracking-/);
    expect(className).not.toMatch(/aria-selected:text-(?:label|body|small)/);
  });

  it('draws the one focus ring as an outline, colour at rest, separate from the marker', () => {
    render(staffTabs('staff', new Subject<string>()));
    const className = screen.getByRole('tab', { name: 'Staff' }).className;

    expect(className).toContain('outline-focus-ring');
    expect(className).toContain('outline-offset-[var(--focus-ring-offset)]');
    expect(className).toContain(
      'focus-visible:outline-[length:var(--focus-ring-width)]',
    );
    expect(className).not.toMatch(/(?:^|\s|:)ring-/);
    expect(className).not.toContain('outline-none');
    expect(className).not.toContain('focus-visible:outline-focus-ring');
  });

  it('draws the same focus ring on the active panel, which is focusable too', () => {
    render(staffTabs('staff', new Subject<string>()));
    const className = screen.getByRole('tabpanel').className;

    expect(className).toContain('outline-focus-ring');
    expect(className).toContain('outline-offset-[var(--focus-ring-offset)]');
    expect(className).toContain(
      'focus-visible:outline-[length:var(--focus-ring-width)]',
    );
  });

  it('transitions colour through the motion token, never transition-all', () => {
    render(staffTabs('staff', new Subject<string>()));
    const className = screen.getByRole('tab', { name: 'Staff' }).className;

    expect(className).toContain('transition-colors');
    expect(className).toContain('duration-[var(--motion-duration-color)]');
    expect(className).not.toContain('transition-all');
  });

  it('scrolls the row horizontally on overflow rather than wrapping or shrinking a tab', () => {
    render(staffTabs('staff', new Subject<string>()));
    const listClassName = screen.getByRole('tablist').className;
    const tabClassName = screen.getByRole('tab', { name: 'Staff' }).className;

    expect(listClassName).toContain('overflow-x-auto');
    expect(listClassName).not.toContain('flex-wrap');
    expect(tabClassName).toContain('shrink-0');
    expect(tabClassName).toContain('text-nowrap');
  });

  it('scrolls the newly focused tab into view itself, since focus alone does not', () => {
    // Measured in Chrome 152 (headless, #102): focus() centres a fully-hidden tab but leaves a
    // partially clipped one exactly where it was, so arrowing to a half-visible tab kept it half
    // visible. jsdom lays nothing out, so what is checkable is that the handler asks.
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const onSelect$ = new Subject<string>();
    render(staffTabs('staff', onSelect$));
    const staff = screen.getByRole('tab', { name: 'Staff' });
    staff.focus();

    fireEvent.keyDown(staff, { key: 'ArrowRight' });

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });

  it('reserves ring room in the scroll box, written from the focus-ring tokens', () => {
    render(staffTabs('staff', new Subject<string>()));
    const listClassName = screen.getByRole('tablist').className;

    // The scroll clip would cut the outline at every edge, so the row pads by exactly the ring's
    // extent, hands the room back with a matching negative margin, and sets the same value as
    // scroll-padding so a nearest scrollIntoView stops with the ring inside the clip.
    expect(listClassName).toContain(
      'p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    );
    expect(listClassName).toContain(
      'm-[calc(-1*(var(--focus-ring-width)+var(--focus-ring-offset)))]',
    );
    expect(listClassName).toContain(
      'scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    );
  });
});
