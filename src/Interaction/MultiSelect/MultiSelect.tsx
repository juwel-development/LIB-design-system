import { cva } from 'class-variance-authority';
import {
  Children,
  createContext,
  type FocusEvent,
  Fragment,
  type FunctionComponent,
  isValidElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefCallback,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { Observable, Subject } from 'rxjs';
import { fitChips } from './fitChips';
import { MultiSelectCompositionError } from './MultiSelectCompositionError';

// Field styling follows Select and ADRs 0001-0004: Root paints the label and hint from here and
// the closed control's box from the literal class strings below, which it owns outright.
const multiSelectRoot = cva(
  [
    'relative flex flex-col gap-[var(--space-stack)]',
    '[&>label]:font-secondary [&>label]:font-medium [&>label]:text-body [&>label]:text-foreground',
    '[&>p]:font-secondary [&>p]:text-small [&>p]:text-muted',
  ].join(' '),
);

// The checked row is told apart by the tick and a boundary flip from `controlBorder` to
// `foreground` (the Choices treatment), keyed on aria-checked so the attribute the device reads
// is the one the paint follows. The marker is square where the Choices marker is round: the two
// conventions are how a viewer tells independent toggles from an exclusive choice.
const multiSelectOption = cva(
  [
    'group/option flex w-full flex-row items-center gap-3 text-left',
    'rounded-[var(--radius-control)] bg-transparent px-3 py-2 hover:bg-backing',
    'cursor-pointer disabled:cursor-not-allowed',
    'transition-colors duration-[var(--motion-duration-color)]',
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  ].join(' '),
);

const FOCUS_RING =
  'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]';

const FIELD = [
  'group/field relative flex items-center gap-1',
  'rounded-[var(--radius-control)] border border-solid border-control-border bg-transparent px-3 py-2',
  'font-primary text-body text-foreground transition-colors duration-[var(--motion-duration-color)]',
  'data-[disabled]:border-disabled data-[disabled]:text-muted',
].join(' ');

const TRIGGER = `absolute inset-0 flex cursor-pointer items-center justify-end rounded-[var(--radius-control)] bg-transparent px-3 text-muted disabled:cursor-not-allowed ${FOCUS_RING}`;

// The clip window around the chips: its padding and negative margin reserve the focus ring's
// width and offset, so a chip removal's ring is not cut by the overflow that hides the chips.
const CLIP =
  'relative min-w-0 flex-1 overflow-hidden p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))] -m-[calc(var(--focus-ring-width)+var(--focus-ring-offset))] pointer-events-none';

const TRACK =
  'relative flex min-h-[calc(var(--text-body)*var(--leading-body))] items-center gap-1';

const CHIP = [
  'relative inline-flex max-w-[12rem] shrink-0 items-center gap-1 pointer-events-auto',
  'rounded-[var(--radius-control)] bg-backing py-0.5 pr-0.5 pl-2 font-secondary text-small text-foreground',
  'group-data-[disabled]/field:text-muted data-[overflow]:invisible data-[overflow]:absolute',
].join(' ');

const COUNT = `relative inline-flex shrink-0 cursor-pointer items-center rounded-[var(--radius-control)] bg-backing px-2 py-0.5 font-secondary text-small text-foreground disabled:cursor-not-allowed disabled:text-muted pointer-events-auto ${FOCUS_RING}`;

const ICON_BUTTON = `relative inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-control)] text-muted transition-colors duration-[var(--motion-duration-color)] hover:text-foreground disabled:cursor-not-allowed disabled:hover:text-muted ${FOCUS_RING}`;

const SURFACE = [
  'absolute left-0 right-0 z-10 flex flex-col gap-1 overflow-y-auto p-1',
  'rounded-[var(--radius-control)] border border-solid border-border bg-surface shadow-[var(--elevation-floating)]',
  'max-h-[var(--multiselect-surface-max-height,50vh)]',
  'data-[placement=below]:top-full data-[placement=below]:mt-1 data-[placement=above]:bottom-full data-[placement=above]:mb-1',
].join(' ');

// Keeps the floating shadow, and a focused option's ring, clear of the viewport edge.
const SURFACE_MARGIN = 8;

type Placement = 'below' | 'above';

type Option = { value: string; label: string };

type FocusRequest =
  | { kind: 'firstOption' }
  | { kind: 'afterRemoval'; index: number; control: HTMLElement }
  | { kind: 'afterClear'; control: HTMLElement };

type MultiSelectContract = {
  selected: ReadonlySet<string>;
  disabled: boolean;
  toggle: (value: string) => void;
};

const MultiSelectContext = createContext<MultiSelectContract | undefined>(
  undefined,
);

const useMultiSelectContract = (member: string): MultiSelectContract => {
  const contract = useContext(MultiSelectContext);
  if (contract === undefined) {
    throw new MultiSelectCompositionError(member);
  }
  return contract;
};

export interface IMultiSelectRootProps {
  /** Always rendered and associated with the dropdown trigger; also names the option group. */
  label: string;
  /** The current set of selected identities. Rendered from the latest emission only: empty
   *  before the first one, and empty again while a replacement source has not yet emitted. */
  selected$: Observable<readonly string[]>;
  /** Emits a fresh full proposed selection - option order, no duplicates, only supplied
   *  identities - once per toggle, chip removal or clear-all. Nothing else emits. */
  onChange$: Subject<readonly string[]>;
  /** Caller-localized wording shown in the closed control while nothing is selected. */
  emptyLabel: string;
  /** Accessible-name wording for a chip's removal control; `{label}` stands for the option's
   *  label, e.g. `Remove {label}`. */
  removeLabel: string;
  /** Accessible name of the clear-all control. */
  clearLabel: string;
  /** Wording for the hidden-selection count; `{count}` stands for the number, e.g. `+{count}`. */
  overflowLabel: string;
  hint?: string;
  /** Keeps the selection visible, closes an open dropdown and permits no user change. */
  disabled?: boolean;
  testId?: string;
  /** Compose MultiSelect.Option children; arrays and fragments are supported. */
  children?: ReactNode;
}

export interface IMultiSelectOptionProps {
  /** The unique, stable identity `selected$` names and proposals carry. Not React's `key`. */
  value: string;
  /** Caller-localized text; the chip and the row both read it. */
  children: string;
  testId?: string;
}

const attach =
  <T extends HTMLElement>(ref: RefObject<T | undefined>): RefCallback<T> =>
  (node) => {
    ref.current = node ?? undefined;
  };

const widthOf = (element: Element): number =>
  element.getBoundingClientRect().width;

// Root reads the options it can see - direct children, arrays and fragments - for the chips'
// order and labels; the rows themselves render through the context, as in Choices.
const collectOptions = (children: ReactNode): Option[] =>
  Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) {
      return [];
    }
    if (child.type === Fragment) {
      return collectOptions((child.props as { children?: ReactNode }).children);
    }
    if (child.type === MultiSelectOption) {
      const { value, children: label } = child.props as IMultiSelectOptionProps;
      return [{ value, label }];
    }
    return [];
  });

const visibleRemovals = (root: HTMLElement): HTMLButtonElement[] =>
  Array.from(
    root.querySelectorAll<HTMLButtonElement>(
      '[data-multiselect-chip]:not([data-overflow]) button',
    ),
  );

// Focus is lost when the render removed the focused control, or hid it behind the count: a
// browser's own fixup for a control turned inert is silent and uneven, so the rule is applied here.
const focusIsLost = (root: HTMLElement): boolean => {
  const active = document.activeElement;
  return (
    !root.contains(active) ||
    (active instanceof Element && active.closest('[data-overflow]') !== null)
  );
};

const firstOption = (surface: HTMLElement): HTMLElement | undefined =>
  surface.querySelector<HTMLElement>(
    '[role="checkbox"][aria-checked="true"]',
  ) ??
  surface.querySelector<HTMLElement>('[role="checkbox"]') ??
  undefined;

const CloseGlyph: FunctionComponent = () => (
  <svg
    aria-hidden={true}
    focusable={false}
    viewBox={'0 0 16 16'}
    className={'size-3'}
  >
    <path
      d={'M4 4l8 8M12 4l-8 8'}
      fill={'none'}
      stroke={'currentColor'}
      strokeWidth={1.5}
      strokeLinecap={'round'}
    />
  </svg>
);

const MultiSelectRoot: FunctionComponent<IMultiSelectRootProps> = ({
  label,
  selected$,
  onChange$,
  emptyLabel,
  removeLabel,
  clearLabel,
  overflowLabel,
  hint,
  disabled,
  testId,
  children,
}) => {
  const id = useId();
  const labelId = `${id}-label`;
  const triggerId = `${id}-trigger`;
  const optionsId = `${id}-options`;
  const hintId = `${id}-hint`;
  const emptyId = `${id}-empty`;
  const isDisabled = disabled === true;

  const [selected, setSelected] = useState<readonly string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number | undefined>(
    undefined,
  );
  const [placement, setPlacement] = useState<Placement>('below');
  const [, relayout] = useReducer((tick: number) => tick + 1, 0);

  const rootRef = useRef<HTMLDivElement | undefined>(undefined);
  const fieldRef = useRef<HTMLDivElement | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement | undefined>(undefined);
  const trackRef = useRef<HTMLDivElement | undefined>(undefined);
  const surfaceRef = useRef<HTMLDivElement | undefined>(undefined);
  const focusRequestRef = useRef<FocusRequest | undefined>(undefined);
  const focusWithinRef = useRef(false);

  const open = isOpen && !isDisabled;
  const options = collectOptions(children);
  const selectedSet: ReadonlySet<string> = new Set(selected);
  const selectedOptions = options.filter((option) =>
    selectedSet.has(option.value),
  );
  const shown =
    visibleCount === undefined
      ? selectedOptions.length
      : Math.min(visibleCount, selectedOptions.length);
  const hiddenCount = selectedOptions.length - shown;

  // Observe the current source instance only (docs/adr/0013): a replacement discards what the
  // old source said and waits, and teardown is the component's.
  useLayoutEffect(() => {
    setSelected([]);
    const subscription = selected$.subscribe((next) => setSelected(next));
    return () => subscription.unsubscribe();
  }, [selected$]);

  useEffect(() => {
    if (isDisabled) {
      setIsOpen(false);
    }
  }, [isDisabled]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (track === undefined || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => relayout());
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // Every chip stays measurable - an overflowing one is invisible and out of flow, not
  // display:none - so one pass after any render reads live widths and settles in one step.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (track === undefined) {
      return;
    }
    const chips = Array.from(
      track.querySelectorAll<HTMLElement>('[data-multiselect-chip]'),
    );
    const count = track.querySelector<HTMLElement>('[data-multiselect-count]');
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const fit = fitChips(
      chips.map(widthOf),
      count === null ? 0 : widthOf(count),
      widthOf(track),
      gap,
    );
    setVisibleCount((current) => (current === fit ? current : fit));
  });

  useLayoutEffect(() => {
    const field = fieldRef.current;
    const surface = surfaceRef.current;
    if (!open || field === undefined || surface === undefined) {
      return;
    }
    const box = field.getBoundingClientRect();
    const below = window.innerHeight - box.bottom - SURFACE_MARGIN;
    const above = box.top - SURFACE_MARGIN;
    const opensAbove = surface.scrollHeight > below && above > below;
    surface.style.setProperty(
      '--multiselect-surface-max-height',
      `${Math.max(opensAbove ? above : below, 0)}px`,
    );
    setPlacement(opensAbove ? 'above' : 'below');
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeFromOutside = (event: Event): void => {
      const root = rootRef.current;
      if (
        root !== undefined &&
        event.target instanceof Node &&
        !root.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeFromOutside);
    return () => document.removeEventListener('pointerdown', closeFromOutside);
  }, [open]);

  // Focus never falls to the body through this component's own DOM changes: a keyboard open
  // lands on the first selected option, a removal hands over to the next chip, and anything
  // else the render took away returns to the trigger.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const trigger = triggerRef.current;
    if (root === undefined || trigger === undefined) {
      return;
    }
    const request = focusRequestRef.current;
    if (request?.kind === 'firstOption') {
      focusRequestRef.current = undefined;
      const surface = surfaceRef.current;
      if (open && surface !== undefined) {
        firstOption(surface)?.focus();
      }
    } else if (request !== undefined) {
      if (!request.control.isConnected) {
        focusRequestRef.current = undefined;
        if (request.kind === 'afterRemoval') {
          const removals = visibleRemovals(root);
          (
            removals[request.index] ??
            removals[request.index - 1] ??
            trigger
          ).focus();
        } else {
          trigger.focus();
        }
      }
    } else if (focusWithinRef.current && focusIsLost(root)) {
      trigger.focus();
    }
    focusWithinRef.current = root.contains(document.activeElement);
  });

  const propose = (next: ReadonlySet<string>): void => {
    const proposal: string[] = [];
    for (const { value } of options) {
      if (next.has(value) && !proposal.includes(value)) {
        proposal.push(value);
      }
    }
    onChange$.next(proposal);
  };

  const toggle = (value: string): void => {
    if (isDisabled) {
      return;
    }
    const next = new Set(selectedSet);
    if (!next.delete(value)) {
      next.add(value);
    }
    propose(next);
  };

  const removeChip =
    (value: string, index: number) =>
    (event: MouseEvent<HTMLButtonElement>): void => {
      if (isDisabled) {
        return;
      }
      if (document.activeElement === event.currentTarget) {
        focusRequestRef.current = {
          kind: 'afterRemoval',
          index,
          control: event.currentTarget,
        };
      }
      const next = new Set(selectedSet);
      next.delete(value);
      propose(next);
    };

  const clearAll = (event: MouseEvent<HTMLButtonElement>): void => {
    if (isDisabled) {
      return;
    }
    if (document.activeElement === event.currentTarget) {
      focusRequestRef.current = {
        kind: 'afterClear',
        control: event.currentTarget,
      };
    }
    onChange$.next([]);
  };

  // A keyboard activation reaches a button as a click with `detail` 0; only that kind moves
  // focus into the options, so a pointer open leaves focus where the pointer put it.
  const openFromControl = (event: MouseEvent<HTMLButtonElement>): void => {
    if (isDisabled) {
      return;
    }
    if (event.detail === 0) {
      focusRequestRef.current = { kind: 'firstOption' };
    }
    setIsOpen(true);
  };

  const toggleOpen = (event: MouseEvent<HTMLButtonElement>): void => {
    if (open) {
      setIsOpen(false);
    } else {
      openFromControl(event);
    }
  };

  const openFromArrow = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== 'ArrowDown' || isDisabled) {
      return;
    }
    event.preventDefault();
    const surface = surfaceRef.current;
    if (open && surface !== undefined) {
      firstOption(surface)?.focus();
    } else {
      focusRequestRef.current = { kind: 'firstOption' };
      setIsOpen(true);
    }
  };

  const closeFromEscape = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Escape' || !open) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const noteFocus = (): void => {
    focusWithinRef.current = true;
  };

  // Focus leaving the whole control closes it. A control removed while focused fires no
  // departure the component should act on; the focus effect above restores that focus.
  const closeFromDeparture = (event: FocusEvent<HTMLDivElement>): void => {
    const root = rootRef.current;
    const destination = event.relatedTarget;
    if (
      root !== undefined &&
      destination instanceof Node &&
      root.contains(destination)
    ) {
      return;
    }
    if (!event.target.isConnected) {
      return;
    }
    focusWithinRef.current = false;
    focusRequestRef.current = undefined;
    setIsOpen(false);
  };

  // A press on the surface's own padding or scrollbar must not blur the focused option, which
  // would read as a departure and close the dropdown under the pointer.
  const keepFocusOnSurface = (event: MouseEvent<HTMLDivElement>): void => {
    if (
      !(event.target instanceof Element) ||
      event.target.closest('button') === null
    ) {
      event.preventDefault();
    }
  };

  const describedBy =
    [
      selectedOptions.length === 0 ? emptyId : undefined,
      hint ? hintId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the wrapper only observes focus and Escape bubbling from the controls it composes; every operable element inside is a real button
    <div
      ref={attach(rootRef)}
      className={multiSelectRoot()}
      onKeyDown={closeFromEscape}
      onFocus={noteFocus}
      onBlur={closeFromDeparture}
    >
      <label id={labelId} htmlFor={triggerId}>
        {label}
      </label>
      <div
        ref={attach(fieldRef)}
        data-multiselect-field
        data-disabled={isDisabled || undefined}
        className={FIELD}
      >
        <button
          ref={attach(triggerRef)}
          id={triggerId}
          type={'button'}
          aria-labelledby={labelId}
          aria-expanded={open}
          aria-controls={open ? optionsId : undefined}
          aria-describedby={describedBy}
          disabled={isDisabled}
          data-testid={testId}
          className={TRIGGER}
          onClick={toggleOpen}
          onKeyDown={openFromArrow}
        >
          <svg
            aria-hidden={true}
            focusable={false}
            viewBox={'0 0 16 16'}
            className={'size-4'}
          >
            <path
              d={'M3 6l5 5 5-5'}
              fill={'none'}
              stroke={'currentColor'}
              strokeWidth={1.5}
              strokeLinecap={'round'}
              strokeLinejoin={'round'}
            />
          </svg>
        </button>
        <div className={CLIP}>
          <div ref={attach(trackRef)} data-multiselect-track className={TRACK}>
            {selectedOptions.length === 0 && (
              <span id={emptyId} className={'truncate text-muted'}>
                {emptyLabel}
              </span>
            )}
            {selectedOptions.map(({ value, label: optionLabel }, index) => {
              const overflows = index >= shown;
              return (
                <span
                  key={value}
                  data-multiselect-chip
                  data-overflow={overflows || undefined}
                  aria-hidden={overflows || undefined}
                  inert={overflows || undefined}
                  className={CHIP}
                >
                  <span className={'truncate'}>{optionLabel}</span>
                  <button
                    type={'button'}
                    aria-label={removeLabel.replaceAll('{label}', optionLabel)}
                    disabled={isDisabled}
                    tabIndex={overflows ? -1 : undefined}
                    className={ICON_BUTTON}
                    onClick={removeChip(value, index)}
                  >
                    <CloseGlyph />
                  </button>
                </span>
              );
            })}
            {hiddenCount > 0 && (
              <button
                type={'button'}
                disabled={isDisabled}
                className={COUNT}
                onClick={openFromControl}
              >
                {overflowLabel.replaceAll('{count}', String(hiddenCount))}
              </button>
            )}
            {selectedOptions.length > 0 && (
              <span
                aria-hidden={true}
                data-multiselect-count
                className={`${COUNT} invisible absolute`}
              >
                {overflowLabel.replaceAll(
                  '{count}',
                  String(selectedOptions.length),
                )}
              </span>
            )}
          </div>
        </div>
        {selectedOptions.length > 0 ? (
          <button
            type={'button'}
            aria-label={clearLabel}
            disabled={isDisabled}
            className={ICON_BUTTON}
            onClick={clearAll}
          >
            <CloseGlyph />
          </button>
        ) : (
          <span aria-hidden={true} className={'size-6 shrink-0'} />
        )}
        <span aria-hidden={true} className={'size-6 shrink-0'} />
        {open && (
          // biome-ignore lint/a11y/useSemanticElements: a fieldset brings the UA's min-inline-size, legend naming and a disabling model the floating surface must not carry; a div with role=group named by the visible label is the disclosure content, and its mousedown only keeps the focused option focused
          <div
            ref={attach(surfaceRef)}
            id={optionsId}
            role={'group'}
            aria-labelledby={labelId}
            data-placement={placement}
            className={SURFACE}
            onMouseDown={keepFocusOnSurface}
          >
            <MultiSelectContext
              value={{ selected: selectedSet, disabled: isDisabled, toggle }}
            >
              {children}
            </MultiSelectContext>
          </div>
        )}
      </div>
      {hint && <p id={hintId}>{hint}</p>}
    </div>
  );
};

const MultiSelectOption: FunctionComponent<IMultiSelectOptionProps> = ({
  value,
  children,
  testId,
}) => {
  const { selected, disabled, toggle } = useMultiSelectContract('Option');
  const isChecked = selected.has(value);
  return (
    // biome-ignore lint/a11y/useSemanticElements: a native checkbox checks itself on activation, which the controlled contract forbids - the row only requests; a button carrying role="checkbox" keeps aria-checked the render's alone, the Choices precedent
    <button
      type={'button'}
      role={'checkbox'}
      aria-checked={isChecked}
      disabled={disabled}
      data-testid={testId}
      className={multiSelectOption()}
      onClick={() => toggle(value)}
    >
      <span
        className={
          'flex size-[var(--choice-marker-size)] shrink-0 items-center justify-center border border-solid border-control-border group-aria-checked/option:border-foreground'
        }
      >
        {isChecked && (
          <svg
            aria-hidden={true}
            focusable={false}
            viewBox={'0 0 16 16'}
            className={'size-3 text-foreground'}
          >
            <path
              d={'M3 8.5l3 3 7-7'}
              fill={'none'}
              stroke={'currentColor'}
              strokeWidth={2}
              strokeLinecap={'round'}
              strokeLinejoin={'round'}
            />
          </svg>
        )}
      </span>
      {/* min-w-0 and anywhere-wrapping let a long translated label wrap inside the row. */}
      <span
        className={
          'min-w-0 flex-1 font-secondary text-body text-foreground [overflow-wrap:anywhere]'
        }
      >
        {children}
      </span>
    </button>
  );
};

/**
 * A dropdown for selecting zero, one or several options independently from a finite set. The
 * closed control is one labelled line: the selected options as individually removable chips in
 * option order, a `+N` count for the ones that do not fit, a clear-all control and the dropdown
 * arrow. Open, it presents a single column of checkable options anchored to the control. The
 * consumer owns the options, the selection, every word and the meaning of the selected set;
 * MultiSelect owns the control, the selection semantics, focus and the themed presentation.
 * Composed from `Root`, which carries the contract, and `Option`, one checkable row.
 *
 * @Guarantees — enforced on every render
 * - The visible `label` names the trigger and the option group. The trigger exposes
 *   `aria-expanded`, and while open `aria-controls` names the group; each option is a
 *   `role="checkbox"` button whose visible text is its name and whose `aria-checked` is the
 *   render's alone. Selection has a visible tick independent of colour.
 * - Selection is the latest `selected$` emission and nothing else: empty before the first
 *   emission, empty again while a replacement source has not emitted, chips and checks updated
 *   silently on every emission - open, closed or disabled. Chips follow option order and dedupe
 *   identities; an identity with no supplied option renders no chip.
 * - Every toggle, chip removal and clear-all emits one fresh full proposal on `onChange$` -
 *   option order, no duplicates, only supplied identities, never a handed-in array - and
 *   nothing else emits: not rendering, opening, closing, option updates, source replacement
 *   or a `selected$` emission. The dropdown stays open while toggling. An unanswered request
 *   leaves the selection as it was.
 * - The control stays on one line: the leading chips that fit are shown, the rest are counted
 *   by `overflowLabel`, down to a count-only display. Overflow is recalculated on width, label
 *   and selection changes without touching the selection, and the count's activation opens the
 *   dropdown, so every selection stays reachable. A long chip label truncates visually while
 *   its removal control keeps the full name.
 * - The dropdown floats over the page (the shared `--elevation-floating` role), opens above the
 *   control when the viewport below cannot hold it, is capped to the room it has and scrolls
 *   its options.
 * - Enter, Space or ArrowDown on the closed trigger opens and focuses the first selected option
 *   in option order, or the first option; with no options focus stays on the trigger. Tab
 *   traverses chips, clear-all and options normally with no trap; Space toggles a focused
 *   option. Escape closes and returns focus to the trigger. Focus leaving the whole control, an
 *   outside pointer interaction and the trigger itself close it, none of them moving focus or
 *   emitting.
 * - Chip removals and clear-all are named, non-submitting buttons outside the trigger. When a
 *   removal takes its own focused control away, focus moves to the next visible removal, then
 *   the preceding one, then the trigger; clear-all returns focus to the trigger; a chip hidden by
 *   overflow while focused hands focus to the trigger. Focus never falls to the body.
 * - `disabled` keeps the selection visible, closes an open dropdown, disables every control and
 *   emits nothing; `selected$` still updates the rendering.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Options are direct children of `Root` (arrays and fragments supported), each `value` unique
 *   and stable across reordering and translation, with stable React keys when mapping.
 * - `selected$` names supplied identities only. An update that removes options removes their
 *   identities from the selection in the same logical update; MultiSelect prunes nothing and
 *   invents nothing.
 * - Answering `onChange$` by emitting the accepted selection on `selected$` is what changes the
 *   selection - immediately, for ordinary interaction. A replaying source (a `BehaviorSubject`
 *   or `ReplaySubject(1)`) lets a remounted control show the current state at once.
 * - The consumer owns both streams' lifetime, completion and error; MultiSelect owns only the
 *   teardown of its `selected$` subscription.
 *
 * @UXGuidelines
 * - Every word is the caller's: `emptyLabel` for the empty control, `removeLabel` with `{label}`
 *   for a chip's removal name, `clearLabel` for clear-all, `overflowLabel` with `{count}` for the
 *   hidden count, optional `hint`, and each option's text. The library ships no English.
 * - Keep `overflowLabel` short (`+{count}`, `{count} weitere`): it shares the one line.
 * - This is a consumer-controlled selection control, not a form field: no `name`, native
 *   submission, reset or validation.
 */
export const MultiSelect = {
  Root: MultiSelectRoot,
  Option: MultiSelectOption,
} as const;
