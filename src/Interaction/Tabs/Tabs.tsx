import { cva, type VariantProps } from 'class-variance-authority';
import {
  createContext,
  type FocusEvent,
  type FunctionComponent,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useId,
} from 'react';
import type { Subject } from 'rxjs';
import { TabsCompositionError } from './TabsCompositionError';

// Two accommodations for a row wider than its space, neither of which clips or elides a label
// (#121): `scroll` keeps one line and scrolls it; `wrap` breaks the row onto further lines. The
// scroll clip needs ring room written from the focus-ring tokens: padding holds the clip off the
// outline, the negative margin hands it back, scroll-padding keeps a nearest scrollIntoView inside.
const tabsList = cva('flex flex-row', {
  variants: {
    overflow: {
      scroll: [
        'overflow-x-auto',
        'p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
        'm-[calc(-1*(var(--focus-ring-width)+var(--focus-ring-offset)))]',
        'scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
      ].join(' '),
      wrap: 'flex-wrap',
    },
  },
  defaultVariants: { overflow: 'scroll' },
});

// Navigation typography - the tracked grotesk label, muted at rest, foreground when current -
// keyed on aria-selected, so the attribute the device reads is the one the paint follows. The
// marker keeps one thickness and flips only colour on the shared motion token, so selection
// shifts no geometry. The focus ring sits in the base with its colour at rest, as on Button.
const tabsTab = cva(
  [
    'font-secondary text-label tracking-label',
    'text-muted hover:text-foreground aria-selected:text-foreground',
    'border-b-[length:var(--tab-marker-thickness)] border-solid border-transparent aria-selected:border-foreground',
    'cursor-pointer select-none px-[var(--tab-inset-inline)] py-[var(--tab-inset-block)]',
    'transition-colors duration-[var(--motion-duration-color)]',
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  ].join(' '),
  {
    // The tab follows its row's accommodation: on one scrolling line it never shrinks or breaks;
    // in a wrapping row a label wider than the row takes a line of its own and breaks across lines.
    variants: {
      overflow: {
        scroll: 'shrink-0 text-nowrap',
        wrap: 'text-wrap',
      },
    },
    defaultVariants: { overflow: 'scroll' },
  },
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

// The row's accommodation reaches each tab through the List, not the Root: it is the List's prop,
// and a Tab reads it as any other variant. Outside a List the recipe default applies.
type TabsListContract = { overflow: VariantProps<typeof tabsList>['overflow'] };

const TabsListContext = createContext<TabsListContract>({
  overflow: undefined,
});

const useTabsContract = (member: string): TabsContract => {
  const contract = useContext(TabsContext);
  if (contract === undefined) {
    throw new TabsCompositionError(member);
  }
  return contract;
};

// Fixed-width UTF-16 units preserve every string, including lone surrogates, without whitespace
// or collisions between escaped and literal values. Encoding changes IDs only, never selection.
const encodeValue = (value: string): string =>
  value
    .split('')
    .map((unit) => unit.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');

const keepFocusedTabVisible = (event: FocusEvent<HTMLButtonElement>): void => {
  event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};

const tabId = (baseId: string, value: string): string =>
  `${baseId}tab-${encodeValue(value)}`;
const panelId = (baseId: string, value: string): string =>
  `${baseId}panel-${encodeValue(value)}`;

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

export interface ITabsRootProps {
  /** The key of the active tab. Must name a declared tab/panel pair; the consumer owns it. */
  active: string;
  /** Emits the selected key on click and on arrow navigation. Tabs never selects on its own. */
  onSelect$: Subject<string>;
  /** The tab list's accessible name. */
  label: string;
  children: ReactNode;
  testId?: string;
}

/** `overflow` is the row's accommodation for labels wider than its space - `scroll` (the default)
 *  keeps one line and scrolls it; `wrap` breaks the row onto further lines. Neither shortens a label. */
export interface ITabsListProps extends VariantProps<typeof tabsList> {
  children: ReactNode;
  testId?: string;
}

export interface ITabsTabProps {
  /** The stable identity connecting this tab to its panel and emitted by selection requests.
   *  Not React's `key`, and never inferred from the label or the position. */
  value: string;
  /** The visible text label. Text only - no icons, no per-tab markup. */
  children: string;
  testId?: string;
}

export interface ITabsPanelProps {
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

const TabsList: FunctionComponent<ITabsListProps> = ({
  overflow,
  children,
  testId,
}) => {
  const { label } = useTabsContract('List');
  return (
    <TabsListContext.Provider value={{ overflow }}>
      <div
        role="tablist"
        aria-label={label}
        className={tabsList({ overflow })}
        data-testid={testId}
      >
        {children}
      </div>
    </TabsListContext.Provider>
  );
};

const TabsTab: FunctionComponent<ITabsTabProps> = ({
  value,
  children,
  testId,
}) => {
  const { active, onSelect$, baseId } = useTabsContract('Tab');
  const { overflow } = useContext(TabsListContext);
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
      className={tabsTab({ overflow })}
      onClick={() => onSelect$.next(value)}
      onKeyDown={requestNeighbour}
      onFocus={keepFocusedTabVisible}
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
 * - A label is never clipped, shortened or hidden, however long its translation runs: it is the
 *   tab's whole text and whole accessible name in both accommodations below.
 * - `List`'s `overflow="scroll"` (the default) keeps the row one line - no wrap, no shrink - and
 *   scrolls it horizontally on overflow, holding its own ring room so the focused tab's ring
 *   survives the scroll clip. Focus reveals a scrolled-off tab, so every tab is reachable.
 * - `List`'s `overflow="wrap"` breaks the row onto further lines instead, with nothing to scroll:
 *   every tab is in view at once, a label wider than the row takes a line of its own and breaks
 *   across lines, and the tabs on one line share a height so their markers sit on one baseline.
 *   Roving tabindex, arrow order and the panel associations are identical in both accommodations.
 * - Selection is marked by a persistent line under the active tab: `--tab-marker-thickness` in
 *   `foreground`, constant thickness in both states, so switching shifts no widths and no weights.
 *   Keyboard focus is the separate shared focus ring. Colour moves on the one motion token.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - One List with Tab elements as direct DOM children (arrays and fragments are supported),
 *   and the Panels under the same Root - as siblings of the List, or with it inside one
 *   arrangement (see the separation contract below). Do not wrap tabs in host elements.
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
 * - Tabs sets no spacing between the row and the panel; the separation contract is a `Stack`
 *   between Root and its members - `<Tabs.Root><Stack gap="region"><Tabs.List/>…<Tabs.Panel/>…
 *   </Stack></Tabs.Root>` - so the row and the view sit one region gap apart, from the token the
 *   consumer's other groups already use. Inactive panels are hidden, so the gap stays exactly one.
 * - The panel is an opaque slot: compose the view's own rhythm inside it - a `Stack`, a `Prose` -
 *   as the view owns it.
 * - Reach for `overflow="wrap"` where labels are translated and the width is a window rather than
 *   a column: a wrapped row keeps every view in sight at a narrow desktop width, where a scrolled
 *   row keeps the line and asks the viewer to scroll it.
 */
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
} as const;
