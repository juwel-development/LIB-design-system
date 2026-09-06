import { cva } from 'class-variance-authority';
import {
  createContext,
  type FunctionComponent,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useId,
} from 'react';
import type { Subject } from 'rxjs';

// The row is a single scrolling line, never a wrap: overflow is an accommodation, not a strip. The
// ring room is written from the two focus-ring tokens so it cannot drift from the ring it exists
// for: padding holds the scroll clip off the outline, the negative margin hands the room back to
// the page, and scroll-padding makes a nearest scrollIntoView stop with the ring inside the clip.
const tabsList = cva(
  [
    'flex flex-row overflow-x-auto',
    'p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    'm-[calc(-1*(var(--focus-ring-width)+var(--focus-ring-offset)))]',
    'scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
  ].join(' '),
);

// Navigation typography - the tracked grotesk label, muted at rest, foreground when current -
// keyed on aria-selected, so the attribute the device reads is the one the paint follows. The
// marker keeps one thickness and flips only colour on the shared motion token, so selection
// shifts no geometry. The focus ring sits in the base with its colour at rest, as on Button.
const tabsTab = cva(
  [
    'font-secondary text-label tracking-label',
    'text-muted hover:text-foreground aria-selected:text-foreground',
    'border-b-[length:var(--tab-marker-thickness)] border-solid border-transparent aria-selected:border-foreground',
    'shrink-0 cursor-pointer select-none text-nowrap px-4 py-2',
    'transition-colors duration-[var(--motion-duration-color)]',
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  ].join(' '),
);

// The panel paints nothing of its own; the recipe carries only the focus ring its Tab stop needs -
// the ring follows focusability, not control-ness.
const tabsPanel = cva(
  'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
);

type TabsContract = {
  active: string;
  onSelect$: Subject<string>;
  label: string;
  baseId: string;
};

const TabsContext = createContext<TabsContract | undefined>(undefined);

const useTabsContract = (member: string): TabsContract => {
  const contract = useContext(TabsContext);
  if (contract === undefined) {
    throw new Error(`Tabs.${member} must be composed inside Tabs.Root`);
  }
  return contract;
};

const tabId = (baseId: string, value: string): string =>
  `${baseId}tab-${value}`;
const panelId = (baseId: string, value: string): string =>
  `${baseId}panel-${value}`;

// The wrap-around rule on its own: the neighbouring tab in the arrow's direction, from the
// rendered row (`:scope >` keeps a nested instance's tabs out of it), wrapping at either end -
// so tab order is rendered order.
const neighbourTab = (
  current: HTMLButtonElement,
  step: 1 | -1,
): HTMLButtonElement | undefined => {
  const row = current.closest('[role="tablist"]');
  if (row === null) {
    return undefined;
  }
  const tabs = Array.from(
    row.querySelectorAll<HTMLButtonElement>(':scope > [role="tab"]'),
  );
  const index = tabs.indexOf(current);
  return tabs[(index + step + tabs.length) % tabs.length];
};

interface ITabsRootProps {
  /** The key of the active tab. Must name a declared tab/panel pair; the consumer owns it. */
  active: string;
  /** Emits the selected key on click and on arrow navigation. Tabs never selects on its own. */
  onSelect$: Subject<string>;
  /** The tab list's accessible name. */
  label: string;
  children: ReactNode;
  testId?: string;
}

interface ITabsListProps {
  children: ReactNode;
  testId?: string;
}

interface ITabsTabProps {
  /** The stable identity connecting this tab to its panel and emitted by selection requests.
   *  Not React's `key`, and never inferred from the label or the position. */
  value: string;
  /** The visible text label. Text only - no icons, no per-tab markup. */
  children: string;
  testId?: string;
}

interface ITabsPanelProps {
  /** The tab this panel belongs to - exactly one panel per tab value within a Root. */
  value: string;
  /** Mounted only while active; departure unmounts it, return mounts it fresh. */
  children: ReactNode;
  testId?: string;
}

// useId gives each Root one stable id namespace, so two instances on a page cannot collide and the
// tab/panel associations survive rerenders. That hook and the context are the component's only
// state-shaped machinery; the selection itself stays the consumer's.
const TabsRoot: FunctionComponent<ITabsRootProps> = ({
  active,
  onSelect$,
  label,
  children,
  testId,
}) => {
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ active, onSelect$, label, baseId }}>
      <div data-testid={testId}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList: FunctionComponent<ITabsListProps> = ({ children, testId }) => {
  const { label } = useTabsContract('List');
  return (
    <div
      role="tablist"
      aria-label={label}
      className={tabsList()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

const TabsTab: FunctionComponent<ITabsTabProps> = ({
  value,
  children,
  testId,
}) => {
  const { active, onSelect$, baseId } = useTabsContract('Tab');
  const isActive = active === value;

  // Left/Right move focus to the neighbouring tab and request its selection immediately -
  // activation follows focus. Other keys fall through: Up/Down keep scrolling the page, Tab
  // leaves the list for the active panel.
  const requestNeighbour = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    const neighbour = neighbourTab(
      event.currentTarget,
      event.key === 'ArrowRight' ? 1 : -1,
    );
    if (neighbour === undefined) {
      return;
    }
    neighbour.focus();
    // Measured in Chrome 152 (headless, #102): focus() centres a fully-hidden tab but leaves a
    // partially clipped one where it was, so the handler scrolls itself. `nearest` stops at the
    // row's scroll-padding, which is the ring's extent, and moves nothing already in view. The
    // whole-pixel scroll max can shave the ring's outer edge <1px at the ends (0.42px measured).
    neighbour.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const neighbourValue = neighbour.dataset.value;
    if (neighbourValue !== undefined) {
      onSelect$.next(neighbourValue);
    }
  };

  return (
    <button
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={isActive}
      aria-controls={panelId(baseId, value)}
      tabIndex={isActive ? 0 : -1}
      data-value={value}
      data-testid={testId}
      className={tabsTab()}
      onClick={() => onSelect$.next(value)}
      onKeyDown={requestNeighbour}
    >
      {children}
    </button>
  );
};

const TabsPanel: FunctionComponent<ITabsPanelProps> = ({
  value,
  children,
  testId,
}) => {
  const { active, baseId } = useTabsContract('Panel');
  const isActive = active === value;
  return (
    <div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      hidden={!isActive}
      tabIndex={isActive ? 0 : undefined}
      className={tabsPanel()}
      data-testid={testId}
    >
      {isActive ? children : undefined}
    </div>
  );
};

/**
 * A few named views sharing one surface: a horizontal tab list over exactly one visible panel,
 * following the WAI-ARIA tabs pattern. Controlled - the consumer owns the active key and all
 * content; Tabs owns the controls and the panels that present it. Composed from four members:
 * `Root` carries the contract, `List` the scrolling row, `Tab` one control, `Panel` one view.
 *
 * @Guarantees — enforced on every render
 * - Renders `role="tablist"`/`tab`/`tabpanel` with `aria-selected`, `aria-controls` and
 *   `aria-labelledby` wired per pair; ids are namespaced per instance, so two Tabs on one page
 *   cannot collide and associations survive rerenders.
 * - Selection is the value of `active`, nothing else: a selection request that goes unanswered
 *   changes nothing, and no fallback selection is invented or emitted - ever.
 * - Only the active panel mounts its children; inactive panels stay hidden and empty, so departure
 *   unmounts a view and returning mounts it fresh, with no cache and no preserved state.
 * - Left/Right move focus to the neighbouring tab, wrapping at either end, and request selection
 *   immediately; focus stays on the operated tab. Up/Down are left to the browser.
 * - Roving tabindex: Tab enters the list at the active tab, then the active panel - a consistent
 *   Tab stop whether or not its content is focusable. Inactive panels add no stop.
 * - The row scrolls horizontally on overflow - one line, no wrap, no shrink - and holds its own
 *   ring room, so the focused tab's ring survives the scroll clip.
 * - Selection is marked by a persistent line under the active tab: `--tab-marker-thickness` in
 *   `foreground`, constant thickness in both states, so switching shifts no widths and no weights.
 *   Keyboard focus is the separate shared focus ring. Colour moves on the one motion token.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - At least two tabs, each `value` unique and stable, each with exactly one matching `Panel`
 *   under the same `Root`, and `active` naming a declared pair. Invalid input is a contract
 *   violation, not a request for a fallback.
 * - An update removing the active tab supplies a valid replacement `active` and the matching
 *   composition in the same update.
 * - The newly selected view renders without noticeable delay - slower data belongs inside the
 *   immediately displayed view. Any state shared or preserved across views is the consumer's.
 *
 * @UXGuidelines
 * - Labels are short names for views, not actions; the consuming app words and translates them.
 * - This is not a router: no location, no history, no deep links. Wire `onSelect$` to whatever
 *   owns the active key and pass that key back in.
 * - The panel is an opaque slot: compose the view's own rhythm inside it - a `Stack`, a `Prose` -
 *   as the view owns it; Tabs sets no spacing between the row and the panel.
 */
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
} as const;
