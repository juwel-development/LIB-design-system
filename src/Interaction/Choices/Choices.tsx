import { cva, type VariantProps } from 'class-variance-authority';
import {
  Children,
  createContext,
  Fragment,
  type FunctionComponent,
  isValidElement,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useId,
} from 'react';
import type { Subject } from 'rxjs';
import { ChoicesCompositionError } from './ChoicesCompositionError';

const choicesGroup = cva('min-w-0 gap-[var(--space-stack)]', {
  variants: {
    arrangement: {
      vertical: 'flex flex-col [&>[role=radio]]:w-full',
      wrapping: 'flex flex-row flex-wrap items-start',
      columns: [
        'grid items-start grid-cols-[repeat(auto-fill,minmax(min(100%,var(--choice-column-min-width)),1fr))]',
        '[&>[role=radio][aria-checked=false]]:border-transparent',
      ].join(' '),
      tiles: [
        'grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--choice-tile-min-width)),1fr))]',
        '[&>[role=radio]]:grid [&>[role=radio]]:grid-cols-[var(--choice-marker-size)_minmax(0,1fr)_var(--choice-marker-size)] [&>[role=radio]]:content-start [&>[role=radio]]:gap-x-0 [&>[role=radio]]:gap-y-2',
        '[&_[data-choice-marker]]:col-start-3 [&_[data-choice-marker]]:row-start-1 [&_[data-choice-marker]]:mt-0',
        '[&_[data-choice-content]]:contents [&_[data-choice-label]]:contents',
        '[&_[data-choice-label]>img]:col-start-2 [&_[data-choice-label]>img]:row-start-1 [&_[data-choice-label]>img]:justify-self-center',
        '[&_[data-choice-name]]:col-span-full [&_[data-choice-name]]:min-w-0 [&_[data-choice-name]]:text-center [&_[data-choice-name]]:text-small [&_[data-choice-name]]:hyphens-auto [&_[data-choice-name]]:wrap-break-word',
        '[&_[data-choice-description]]:col-span-full [&_[data-choice-description]]:text-center',
      ].join(' '),
    },
  },
  defaultVariants: { arrangement: 'vertical' },
});

// The selected row is told apart by the marker dot and a boundary flip from `controlBorder` to
// `foreground` - Tabs' marker treatment, keyed on aria-checked so the attribute the device reads
// is the one the paint follows. One boundary thickness in both states, so selection shifts no
// geometry. Inert mutes only the name's ink (the Sidebar treatment); the selection stays visible.
const choicesChoice = cva(
  [
    'group/choice flex min-w-0 max-w-full flex-none flex-row items-start gap-3 text-left wrap-anywhere',
    'rounded-[var(--radius-control)] border border-solid border-control-border bg-transparent aria-checked:border-foreground',
    'px-3 py-2',
    'cursor-pointer disabled:cursor-not-allowed',
    'transition-colors duration-[var(--motion-duration-color)]',
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  ].join(' '),
);

type ChoicesContract = {
  arrangement: IChoicesRootProps['arrangement'];
  selected: string;
  onSelect$: Subject<string>;
  inert: boolean;
};

const ChoicesContext = createContext<ChoicesContract | undefined>(undefined);

const useChoicesContract = (member: string): ChoicesContract => {
  const contract = useContext(ChoicesContext);
  if (contract === undefined) {
    throw new ChoicesCompositionError(member);
  }
  return contract;
};

// The wrap-around rule on its own: the neighbouring row in the arrow's direction, from the
// rendered group (`:scope >` keeps a nested instance's rows out of it), wrapping at either end -
// so arrow order is rendered order.
const neighbourChoice = (
  current: HTMLButtonElement,
  step: 1 | -1,
): HTMLButtonElement | undefined => {
  const group = current.closest('[role="radiogroup"]');
  if (group === null) {
    return undefined;
  }
  const rows = Array.from(
    group.querySelectorAll<HTMLButtonElement>(':scope > [role="radio"]'),
  );
  const index = rows.indexOf(current);
  return rows[(index + step + rows.length) % rows.length];
};

const ARROW_STEP: Record<string, 1 | -1> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1,
};

const labelNodes = (children: ReactNode): ReactNode[] =>
  Children.map(children, (child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? labelNodes(child.props.children)
      : child,
  ) ?? [];

const tileLabel = (children: ReactNode): ReactNode => {
  const nodes = labelNodes(children);
  // Image sources cover native images and caller components such as Figure without importing them.
  // Keep the remaining inline content together: each unwrapped text run becomes its own grid item.
  const isArtwork = (node: ReactNode): boolean =>
    isValidElement<{ src?: string }>(node) &&
    (node.type === 'img' || node.props.src !== undefined);
  return (
    <>
      {nodes.filter(isArtwork)}
      <span data-choice-name>{nodes.filter((node) => !isArtwork(node))}</span>
    </>
  );
};

export interface IChoicesRootProps extends VariantProps<typeof choicesGroup> {
  /** Full-width vertical rows by default; wrapping uses content-sized rows. Columns shares equal
   *  columns of quiet rows; tiles puts each image above its centred name, the marker in the tile's
   *  corner. Column counts follow available width and independent themed minimum widths; arrows
   *  keep declared order. */
  arrangement?: VariantProps<typeof choicesGroup>['arrangement'];
  /** The key of the selected choice. Must name a declared choice; the consumer owns it. */
  selected: string;
  /** Emits a choice's key when an available non-selected row is activated by pointer or arrow
   *  keys. The selected row, an inert group and every render emit nothing. */
  onSelect$: Subject<string>;
  /** The radio group's accessible name. */
  label: string;
  /** Present with its retained selection and every supplied description visible, but unavailable:
   *  semantically disabled, skipped by Tab, and deaf to pointer and keyboard input. */
  inert?: boolean;
  children: ReactNode;
  testId?: string;
}

export interface IChoicesChoiceProps {
  /** The stable identity `selected` names and selection requests emit. Not React's `key`, and
   *  never inferred from the name or the position. */
  value: string;
  /** Visible text naming the option, optionally with non-interactive decoration. */
  children: ReactNode;
  /** The option's accessible name when its visible label does not name it, such as a dash. */
  name?: string;
  /** Optional visible text under the name, exposed as the choice's accessible description. */
  description?: string;
  testId?: string;
}

const ChoicesRoot: FunctionComponent<IChoicesRootProps> = ({
  arrangement,
  selected,
  onSelect$,
  label,
  inert,
  children,
  testId,
}) => (
  <ChoicesContext.Provider
    value={{ arrangement, selected, onSelect$, inert: inert === true }}
  >
    <div
      role={'radiogroup'}
      aria-label={label}
      aria-disabled={inert === true ? 'true' : undefined}
      className={choicesGroup({ arrangement })}
      data-testid={testId}
    >
      {children}
    </div>
  </ChoicesContext.Provider>
);

const ChoicesChoice: FunctionComponent<IChoicesChoiceProps> = ({
  value,
  children,
  name,
  description,
  testId,
}) => {
  const { arrangement, selected, onSelect$, inert } =
    useChoicesContract('Choice');
  const isSelected = selected === value;
  const id = useId();
  const nameId = `${id}-name`;
  const descriptionId = `${id}-description`;

  // Down/Right move focus to the next row, Up/Left to the previous, wrapping - and request its
  // selection immediately: activation follows focus, the Tabs precedent. Arrowing back onto the
  // row `selected` still names moves focus but requests nothing, like clicking it. Disabled rows
  // receive no key events in a browser; the inert guard covers synthetic dispatch too.
  const requestNeighbour = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const step = ARROW_STEP[event.key];
    if (step === undefined || inert) {
      return;
    }
    event.preventDefault();
    const neighbour = neighbourChoice(event.currentTarget, step);
    if (neighbour === undefined) {
      return;
    }
    neighbour.focus();
    const neighbourValue = neighbour.dataset.value;
    if (neighbourValue !== undefined && neighbourValue !== selected) {
      onSelect$.next(neighbourValue);
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a native radio checks itself on activation, which the controlled contract forbids - the row only requests; a button carrying role="radio" keeps aria-checked the render's alone, the Tabs/Sidebar precedent
    <button
      type={'button'}
      role={'radio'}
      aria-checked={isSelected}
      aria-label={name}
      aria-labelledby={name === undefined ? nameId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={isSelected && !inert ? 0 : -1}
      disabled={inert}
      data-value={value}
      data-testid={testId}
      className={choicesChoice()}
      onClick={() => {
        if (!isSelected) {
          onSelect$.next(value);
        }
      }}
      onKeyDown={requestNeighbour}
    >
      {/* mt-[0.3rem] seats the marker on the optical middle of the name's line box - the
          Checklist chevron's technique - since items-start alone tops it out. */}
      <span
        data-choice-marker
        aria-hidden={true}
        className={
          'mt-[0.3rem] flex size-[var(--choice-marker-size)] shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-solid border-control-border'
        }
      >
        {isSelected && (
          <span
            data-choice-marker-dot
            className={
              'size-[var(--choice-marker-dot-size)] rounded-[var(--radius-control)] bg-foreground'
            }
          />
        )}
      </span>
      {/* min-w-0 lets long names and descriptions wrap inside the flex row instead of widening it. */}
      <span data-choice-content className={'flex min-w-0 flex-col'}>
        {/* Name and description declare their own family role so a future slot cannot inherit
            the labelling face from the button (docs/adr/0004). */}
        <span
          id={nameId}
          data-choice-label
          className={
            'font-secondary font-medium text-body text-foreground group-disabled/choice:text-muted'
          }
        >
          {arrangement === 'tiles' ? tileLabel(children) : children}
        </span>
        {description && (
          <span
            id={descriptionId}
            data-choice-description
            className={'font-secondary text-muted text-small'}
          >
            {description}
          </span>
        )}
      </span>
    </button>
  );
};

/**
 * A single selection from a small set of named options with optional descriptions: choice rows,
 * exactly one selected, following the WAI-ARIA radio-group pattern. Controlled - the consumer owns
 * the selected key and every word; Choices owns the rows, the marker and the highlight. Composed
 * from two members: `Root` carries the contract, `Choice` one row.
 *
 * @Guarantees — enforced on every render
 * - Renders `role="radiogroup"` named by `label`, with each row a `role="radio"` button carrying
 *   `aria-checked`, its `name` (when supplied) or visible label text as accessible name, and its
 *   description as accessible description when supplied; omitted or empty descriptions render no content or association.
 *   Ids are minted per row, so two groups on a page cannot collide.
 * - Selection is the value of `selected`, nothing else: activating an available non-selected row
 *   emits its key on `onSelect$`; the selected row, an unanswered request and every render emit
 *   nothing, and no fallback selection is invented - ever.
 * - Activating any part of an available row - its name and description text included - requests
 *   that row. Exactly the row `selected` names shows the marker dot and the `foreground` boundary,
 *   so selection survives without colour perception; keyboard focus is the separate shared ring.
 * - Down/Right move focus to the next row and Up/Left to the previous, wrapping at either end,
 *   requesting selection as focus moves. Roving tabindex: Tab enters the group at the selected row.
 * - An inert group keeps the selected marker, highlight and every name and description visible,
 *   mutes only the names' ink, exposes `aria-disabled` on the group with every row disabled, adds
 *   no Tab stop, and emits nothing for any pointer or keyboard input.
 * - `arrangement="vertical"` (the default) gives every choice the group's width. `wrapping`
 *   sizes choices to content without sharing surplus width and flows whole choices onto further
 *   lines. Names, unbroken words and supplied descriptions wrap within the available group width.
 * - `columns` shares equal-width columns using `--choice-column-min-width`, preserving vertical
 *   row anatomy and height. Only its unselected row boundaries are transparent; the marker keeps
 *   its `controlBorder` box and the selected row its dot and `foreground` boundary at fixed thickness.
 * - `tiles` shares equal-width columns using the independent `--choice-tile-min-width`. The
 *   marker sits in the tile's top inline-end corner, and the image row keeps a marker-wide gutter
 *   on both inline sides, so the image is centred and never under the marker. The name spans the
 *   tile's content width beneath, centred, at the `small` role; it hyphenates by the `lang` in
 *   effect, breaks a word anywhere only when nothing else fits, and is never truncated or clamped.
 *   Text-only tiles keep the column width. Both grids fit one column below their minimum, and
 *   selection changes no geometry. Artwork remains uncropped.
 * - `vertical`, `wrapping` and `columns` set names at `body` beside the marker, wrapping anywhere
 *   without hyphenation.
 * - Arrow order is declared order even across visual line breaks, never spatial row navigation.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Labels contain visible text naming the option, optionally with decorative content. Supply
 *   `name` when the visible label does not name the option (for example a dash for "No beard").
 *   Decorative images carry `alt=""` and other decoration `aria-hidden`; nothing is interactive
 *   or focusable, since the row is the control. All content must be phrasing content valid inside
 *   a button. Figure artwork without caption or overlay renders an img and is the intended source.
 * - Declare `--choice-column-min-width` and `--choice-tile-min-width` as positive definite CSS
 *   lengths. Ensure fixed artwork fits the tile's content width less two `--choice-marker-size`
 *   gutters (including below the minimum); artwork retains its own size/contain contract and is
 *   never cropped by Choices.
 * - Set the correct `lang` on the page or an ancestor of a `tiles` group: tile names hyphenate by
 *   it, and without it a long word can only break at an arbitrary letter.
 * - Shortening a tile name is the consumer's decision: content that sizes or shortens itself does
 *   so within the name cell's width. A label shortened visibly must still name the option in full
 *   through `name`.
 * - Choice rows are direct children of `Root` (arrays and fragments are supported), each `value`
 *   unique and stable, and `selected` names a declared row. Invalid input is a contract violation,
 *   not a request for a fallback.
 * - An update removing the selected row supplies a valid replacement `selected` in the same update.
 * - Answering `onSelect$` by rerendering with the new `selected` is what changes the selection;
 *   a consumer that ignores a request has decided the selection stays.
 *
 * @UXGuidelines
 * - Names are short nouns for options and optional descriptions one or two sentences under them; the
 *   consuming app words and translates both - the library ships no text of its own.
 * - This is not a form field: no `<label>` pairing, no validation, no submission. Wire `onSelect$`
 *   to whatever owns the selected key and pass that key back in.
 * - Availability is the group's, not a row's: there is no per-row disabled. A choice that cannot
 *   be offered is left out by the caller.
 */
export const Choices = {
  Root: ChoicesRoot,
  Choice: ChoicesChoice,
} as const;
