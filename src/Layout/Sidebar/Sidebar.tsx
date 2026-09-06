import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode, RefCallback } from 'react';
import { Children, createContext, isValidElement, useContext } from 'react';
import type { Subject } from 'rxjs';

// One column below 64rem, the whole list above the content in normal flow; at `lg` a fixed 12rem nav
// track beside `minmax(0,1fr)`, whose zero minimum keeps wide content from displacing the track (it
// does not fix that content's own overflow). Root styles only its owned first child, leaving consumer
// navigation untouched. Padding and scroll padding reserve the focus ring's width + offset.
const sidebarRoot = cva(
  [
    'grid gap-[var(--space-region)] lg:grid-cols-[12rem_minmax(0,1fr)]',
    '[&>div:first-child]:border-solid [&>div:first-child]:border-border [&>div:first-child]:border-b [&>div:first-child]:pb-[var(--space-stack)]',
    'lg:[&>div:first-child]:border-b-0 lg:[&>div:first-child]:border-r lg:[&>div:first-child]:pb-0 lg:[&>div:first-child]:pr-[var(--space-stack)]',
    'lg:[&>div:first-child>nav]:sticky lg:[&>div:first-child>nav]:top-0 lg:[&>div:first-child>nav]:max-h-[min(100dvh,var(--sidebar-scrollport-height,100dvh))] lg:[&>div:first-child>nav]:overflow-y-auto',
    '[&>div:first-child>nav]:p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))] lg:[&>div:first-child>nav]:scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    '[&>div:first-child>nav>ul]:flex [&>div:first-child>nav>ul]:flex-col [&>div:first-child>nav>ul]:gap-[var(--space-stack)]',
  ].join(' '),
);

// A percentage max-height resolves against the content-driven grid cell, not its scrollport;
// dvh alone left an 800px nav clipped by a 384px frame (#101). Measure that external boundary.
// The ref runs only after client attachment; CSS owns the breakpoint and the viewport fallback.
const observeScrollport: RefCallback<HTMLElement> = (navigation) => {
  if (!navigation) return;
  const ancestors: HTMLElement[] = [];
  for (
    let ancestor = navigation.parentElement;
    ancestor && ancestor !== navigation.ownerDocument.documentElement;
    ancestor = ancestor.parentElement
  ) {
    ancestors.push(ancestor);
  }
  const measure = () => {
    const scrollport = ancestors.find((ancestor) =>
      /^(auto|scroll|hidden|overlay)$/.test(
        getComputedStyle(ancestor).overflowY,
      ),
    );
    if (scrollport) {
      navigation.style.setProperty(
        '--sidebar-scrollport-height',
        `${scrollport.clientHeight}px`,
      );
    } else {
      navigation.style.removeProperty('--sidebar-scrollport-height');
    }
  };
  measure();
  // Observe ancestors so a resized wrapper or responsive change of scrollport is remeasured.
  const observer =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(measure);
  for (const ancestor of ancestors) observer?.observe(ancestor);
  window.addEventListener('resize', measure);
  return () => {
    observer?.disconnect();
    window.removeEventListener('resize', measure);
    navigation.style.removeProperty('--sidebar-scrollport-height');
  };
};

// An entry at the label role, told apart by colour and underline alone - the agreed treatment carries
// no active-background role. Active keeps a persistent underline at the at-rest thickness; usable
// raises one on hover, instantly (underlines are off the motion allowlist, docs/adr/0001); inert is
// muted with no interactive response. The focus ring is the library's one contract (docs/adr/0002).
const sidebarEntry = cva(
  [
    'w-full text-left font-secondary text-label tracking-label',
    'underline-offset-[var(--underline-offset)]',
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  ].join(' '),
  {
    variants: {
      state: {
        active:
          'text-foreground underline decoration-[length:var(--underline-thickness)] cursor-pointer',
        usable:
          'text-foreground hover:underline hover:decoration-[length:var(--underline-thickness)] cursor-pointer',
        inert: 'text-muted cursor-not-allowed',
      },
    },
    defaultVariants: { state: 'usable' },
  },
);

// What an Item derives its treatment and emission from - carried by context because the agreed surface
// gives Item no active prop and no Subject; Root alone speaks them.
type SidebarSelection = {
  active: string;
  onSelect$: Subject<string>;
};

const SidebarSelectionContext = createContext<SidebarSelection | undefined>(
  undefined,
);

export interface ISidebarRootProps {
  /** The key of the active entry. The caller supplies a key identifying one non-inert entry;
   *  Sidebar renders what it is given and never selects a fallback for an invalid key. */
  active: string;
  /** The nav landmark's accessible name. */
  label: string;
  /** Emits the selected entry's key when a usable inactive entry is activated. The active and inert
   *  entries emit nothing, and neither does any render. */
  onSelect$: Subject<string>;
  /** Direct `Sidebar.Item` children in display order, then one `Sidebar.Content`. */
  children?: ReactNode;
  testId?: string;
}

export interface ISidebarItemProps {
  /** Identifies the entry to the application - what `onSelect$` emits and `active` names. React's
   *  reserved `key` is not the entry identifier. */
  entryKey: string;
  /** The entry's visible text. Text-only by type: an entry is a label, never arbitrary markup. */
  children: string;
  /** Present in the order but unavailable: muted, semantically disabled, skipped by Tab. */
  inert?: boolean;
  testId?: string;
}

export interface ISidebarContentProps {
  children?: ReactNode;
  testId?: string;
}

const SidebarItem: FunctionComponent<ISidebarItemProps> = ({
  entryKey,
  children,
  inert,
  testId,
}) => {
  const selection = useContext(SidebarSelectionContext);
  const isActive = selection !== undefined && selection.active === entryKey;
  const selectEntry = () => {
    if (!isActive) selection?.onSelect$.next(entryKey);
  };
  return (
    <li>
      <button
        type="button"
        className={sidebarEntry({
          state: inert ? 'inert' : isActive ? 'active' : 'usable',
        })}
        disabled={inert}
        aria-current={isActive ? 'true' : undefined}
        data-testid={testId}
        onClick={selectEntry}
      >
        {children}
      </button>
    </li>
  );
};

const SidebarContent: FunctionComponent<ISidebarContentProps> = ({
  children,
  testId,
}) => <div data-testid={testId}>{children}</div>;

const SidebarRoot: FunctionComponent<ISidebarRootProps> = ({
  active,
  label,
  onSelect$,
  children,
  testId,
}) => {
  const parts = Children.toArray(children).filter(isValidElement);
  return (
    <div className={sidebarRoot()} data-testid={testId}>
      <div>
        <nav ref={observeScrollport} aria-label={label}>
          <SidebarSelectionContext value={{ active, onSelect$ }}>
            <ul>{parts.filter((part) => part.type === SidebarItem)}</ul>
          </SidebarSelectionContext>
        </nav>
      </div>
      {parts.filter((part) => part.type === SidebarContent)}
    </div>
  );
};

/**
 * The standing application navigation beside the active section's content: a `nav` landmark named by
 * `label`, listing text entries as plain buttons, and a `Content` track for the section the
 * application shows. Selection is a request - activating a usable inactive entry emits its key through
 * `onSelect$` - and the application answers by rerendering with a new `active`. Composed from `Root`,
 * `Item` and `Content`; Root assembles its direct Items into the list, in order, and places Content
 * beside them at 64rem or below them under it.
 *
 * @Guarantees — enforced on every render
 * - For valid caller input, the active entry alone carries `aria-current="true"`. Sidebar owns no
 *   selection, URL, history or fallback: it renders the key it is given; a missing key marks nothing.
 * - Activating the active entry or an inert one emits nothing; no render emits anything. Entries are
 *   non-submitting `type="button"` buttons with native Tab/Enter/Space behaviour - no tabs/menu model.
 * - An inert entry stays visible but muted and disabled, so Tab skips it and activation is inert too.
 * - At and above 64rem the nav is a fixed 12rem track, sticky at the top of the scrolling area with no
 *   assumed top-bar offset, capped to the screen/scrolling-area height with independent entry scrolling.
 *   Content sits beside it in `minmax(0,1fr)`, so wide content cannot displace the track.
 * - Below 64rem the whole list lies above the content in normal flow - no stickiness, no cap, no
 *   drawer. Sidebar sets no viewport-height minimum and grows with its content.
 * - It separates the tracks itself (the region space role and a `border` hairline) but gives the
 *   content track no padding and no landmark - the consumer owns everything inside `Content`.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Entry keys are unique and `active` names one non-inert entry. Sidebar corrects nothing.
 * - Items and the one Content are direct children of `Root` - Root assembles only what it can see,
 *   and an Item rendered outside a Root has no selection to derive its treatment from.
 * - Focus after the content changes belongs to the application; Sidebar leaves it on the activated
 *   entry.
 *
 * @UXGuidelines
 * - Entries are section labels: short, parallel, text-only. A destination that is a URL belongs to
 *   `Link` in a `Header` or `Footer`, not here - Sidebar requests sections, it does not navigate.
 * - Keep inert entries listed: a section that exists but holds nothing yet keeps its place in the
 *   order, which is the point of inertness being a visual state rather than an absence.
 */
export const Sidebar = {
  Root: SidebarRoot,
  Item: SidebarItem,
  Content: SidebarContent,
} as const;
