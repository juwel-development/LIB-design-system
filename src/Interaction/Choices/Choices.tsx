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
import { ChoicesCompositionError } from './ChoicesCompositionError';

const choicesGroup = cva('flex flex-col gap-[var(--space-stack)]');

// The selected row is told apart by the marker dot and a boundary flip from `controlBorder` to
// `foreground` - Tabs' marker treatment, keyed on aria-checked so the attribute the device reads
// is the one the paint follows. One boundary thickness in both states, so selection shifts no
// geometry. Inert mutes only the name's ink (the Sidebar treatment); the selection stays visible.
const choicesChoice = cva(
  [
    'group/choice flex w-full flex-row items-start gap-3 text-left',
    'rounded-[var(--radius-control)] border border-solid border-control-border bg-transparent aria-checked:border-foreground',
    'px-3 py-2',
    'cursor-pointer disabled:cursor-not-allowed',
    'transition-colors duration-[var(--motion-duration-color)]',
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  ].join(' '),
);

type ChoicesContract = {
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

export interface IChoicesRootProps {
  /** The key of the selected choice. Must name a declared choice; the consumer owns it. */
  selected: string;
  /** Emits a choice's key when an available non-selected row is activated by pointer or arrow
   *  keys. The selected row, an inert group and every render emit nothing. */
  onSelect$: Subject<string>;
  /** The radio group's accessible name. */
  label: string;
  /** Present with its retained selection and every description visible, but unavailable:
   *  semantically disabled, skipped by Tab, and deaf to pointer and keyboard input. */
  inert?: boolean;
  children: ReactNode;
  testId?: string;
}

export interface IChoicesChoiceProps {
  /** The stable identity `selected` names and selection requests emit. Not React's `key`, and
   *  never inferred from the name or the position. */
  value: string;
  /** The visible name. Text only - no icons, no per-row markup. */
  children: string;
  /** The visible description under the name, exposed as the row's accessible description. */
  description: string;
  testId?: string;
}

const ChoicesRoot: FunctionComponent<IChoicesRootProps> = ({
  selected,
  onSelect$,
  label,
  inert,
  children,
  testId,
}) => (
  <ChoicesContext.Provider
    value={{ selected, onSelect$, inert: inert === true }}
  >
    <div
      role={'radiogroup'}
      aria-label={label}
      aria-disabled={inert === true ? 'true' : undefined}
      className={choicesGroup()}
      data-testid={testId}
    >
      {children}
    </div>
  </ChoicesContext.Provider>
);

const ChoicesChoice: FunctionComponent<IChoicesChoiceProps> = ({
  value,
  children,
  description,
  testId,
}) => {
  const { selected, onSelect$, inert } = useChoicesContract('Choice');
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
      aria-labelledby={nameId}
      aria-describedby={descriptionId}
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
      <span className={'flex min-w-0 flex-col'}>
        {/* Name and description each declare `font-secondary` on themselves, never on the button
            above - the wrapper would hand the labelling face to a future slot too (docs/adr/0004).
            The name reads `body`, the field-label precedent from Input (#92); inert mutes its ink
            the way Sidebar's inert entry and a disabled Input do. */}
        <span
          id={nameId}
          className={
            'font-secondary font-medium text-body text-foreground group-disabled/choice:text-muted'
          }
        >
          {children}
        </span>
        <span
          id={descriptionId}
          className={'font-secondary text-muted text-small'}
        >
          {description}
        </span>
      </span>
    </button>
  );
};

/**
 * A single selection from a small set of described options: vertically arranged choice rows,
 * exactly one selected, following the WAI-ARIA radio-group pattern. Controlled - the consumer owns
 * the selected key and every word; Choices owns the rows, the marker and the highlight. Composed
 * from two members: `Root` carries the contract, `Choice` one row.
 *
 * @Guarantees — enforced on every render
 * - Renders `role="radiogroup"` named by `label`, with each row a `role="radio"` button carrying
 *   `aria-checked`, its visible name as accessible name and its description as accessible
 *   description; ids are minted per row, so two groups on a page cannot collide.
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
 * - Names and descriptions wrap at narrow widths; a row never widens its group.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Choice rows are direct children of `Root` (arrays and fragments are supported), each `value`
 *   unique and stable, and `selected` names a declared row. Invalid input is a contract violation,
 *   not a request for a fallback.
 * - An update removing the selected row supplies a valid replacement `selected` in the same update.
 * - Answering `onSelect$` by rerendering with the new `selected` is what changes the selection;
 *   a consumer that ignores a request has decided the selection stays.
 *
 * @UXGuidelines
 * - Names are short nouns for options and descriptions one or two sentences under them; the
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
