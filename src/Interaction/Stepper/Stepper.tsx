import { cva } from 'class-variance-authority';
import {
  Children,
  createContext,
  type FocusEvent,
  Fragment,
  type FunctionComponent,
  isValidElement,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import type { Observable, Subject } from 'rxjs';
import { StepperCompositionError } from './StepperCompositionError';

const stepperRoot = cva(
  'flex h-full min-h-0 min-w-0 flex-col gap-[var(--space-stack)]',
);

const stepperList = cva(
  [
    'flex flex-row shrink-0 min-w-0 overflow-x-auto',
    'p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
    'scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))]',
  ].join(' '),
);

const stepperStep = cva([
  'relative isolate flex flex-1 flex-col items-center gap-[var(--space-stack)] text-center',
  'font-secondary text-label text-foreground cursor-pointer select-none',
  'px-[var(--step-inset-inline)] py-[var(--step-inset-block)]',
  'border-b-[length:var(--step-selection-thickness)] border-solid border-transparent aria-selected:border-foreground',
  'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  "after:content-[''] after:absolute after:-z-10 after:top-[calc(var(--step-inset-block)+var(--step-marker-size)/2)] after:start-1/2 after:w-full after:border-t-[length:var(--step-connector-thickness)] after:border-border last:after:hidden",
  '[&>[data-marker]]:flex [&>[data-marker]]:shrink-0 [&>[data-marker]]:items-center [&>[data-marker]]:justify-center',
  '[&>[data-marker]]:size-[var(--step-marker-size)] [&>[data-marker]]:border [&>[data-marker]]:border-foreground [&>[data-marker]]:bg-surface [&>[data-marker]]:rounded-[var(--radius-control)]',
  '[&>[data-value-text]]:text-small [&>[data-status-content]]:text-small',
  'forced-colors:after:border-[CanvasText] forced-colors:aria-selected:border-[Highlight]',
  'forced-colors:border-b-0 forced-colors:aria-selected:border-b-[length:var(--step-selection-thickness)]',
  'forced-colors:[&>[data-marker]]:bg-[Canvas] forced-colors:[&>[data-marker]]:text-[CanvasText] forced-colors:[&>[data-marker]]:border-[CanvasText]',
]);

const stepperPanel = cva(
  'min-h-0 min-w-0 flex-auto outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
);

type StepperContract = {
  active: string | undefined;
  onSelect$: Subject<string>;
  label: string;
  baseId: string;
};

const PositionContext = createContext<number | undefined>(undefined);

const flattenSteps = (children: ReactNode): ReactNode[] =>
  Children.toArray(children).flatMap((child) =>
    isValidElement<{ children: ReactNode }>(child) && child.type === Fragment
      ? flattenSteps(child.props.children)
      : [child],
  );

const StepperContext = createContext<StepperContract | undefined>(undefined);

const useStepperContract = (member: string): StepperContract => {
  const contract = useContext(StepperContext);
  if (contract === undefined) {
    throw new StepperCompositionError(member);
  }
  return contract;
};

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

const neighbourTab = (
  current: HTMLButtonElement,
  step: 1 | -1,
): HTMLButtonElement | undefined => {
  const row = current.closest('[role="tablist"]');
  if (row === null) {
    return undefined;
  }
  const stepButtons = Array.from(
    row.querySelectorAll<HTMLButtonElement>(':scope > [role="tab"]'),
  );
  const index = stepButtons.indexOf(current);
  return stepButtons[(index + step + stepButtons.length) % stepButtons.length];
};

export interface IStepperRootProps {
  /** Consumer-owned selection. No panel is active before this source first emits. */
  active$: Observable<string>;
  /** Requests selection, including blocked steps, without changing the input. */
  onSelect$: Subject<string>;
  label: string;
  children: ReactNode;
  testId?: string;
}

export interface IStepperListProps {
  children: ReactNode;
  testId?: string;
}

export interface IStepperStepProps {
  /** Stable identity, unique within Root, paired with exactly one Panel. */
  value: string;
  label: string;
  status: 'done' | 'open' | 'blocked';
  /** Noninteractive consumer content, rendered whole and included in the accessible name. */
  valueText: ReactNode;
  /** Optional visible wording, associated as the control's accessible description. */
  statusContent?: ReactNode;
  testId?: string;
}

export interface IStepperPanelProps {
  /** The tab this panel belongs to - exactly one panel per tab value within a Root. */
  value: string;
  /** Mounted only while active; departure unmounts it, return mounts it fresh. */
  children: ReactNode;
  testId?: string;
}

const StepperRoot: FunctionComponent<IStepperRootProps> = ({
  active$,
  onSelect$,
  label,
  children,
  testId,
}) => {
  const baseId = useId();
  const [active, setActive] = useState<string>();
  useEffect(() => {
    setActive(undefined);
    const subscription = active$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [active$]);
  return (
    <StepperContext.Provider value={{ active, onSelect$, label, baseId }}>
      <div className={stepperRoot()} data-height-passing data-testid={testId}>
        {children}
      </div>
    </StepperContext.Provider>
  );
};

const StepperList: FunctionComponent<IStepperListProps> = ({
  children,
  testId,
}) => {
  const { label } = useStepperContract('List');
  return (
    <div
      role="tablist"
      aria-label={label}
      className={stepperList()}
      data-testid={testId}
    >
      {flattenSteps(children).map((child, index) => (
        <PositionContext.Provider
          key={
            isValidElement<{ value: string }>(child) ? child.props.value : index
          }
          value={index + 1}
        >
          {child}
        </PositionContext.Provider>
      ))}
    </div>
  );
};

const StepperStep: FunctionComponent<IStepperStepProps> = ({
  value,
  label,
  status,
  valueText,
  statusContent,
  testId,
}) => {
  const { active, onSelect$, baseId } = useStepperContract('Step');
  const position = useContext(PositionContext);
  if (position === undefined)
    throw new StepperCompositionError('Step (inside List)');
  const isActive = active === value;

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
      aria-labelledby={`${tabId(baseId, value)}-label ${tabId(baseId, value)}-value`}
      aria-describedby={
        statusContent !== undefined
          ? `${tabId(baseId, value)}-status`
          : undefined
      }
      tabIndex={isActive ? 0 : -1}
      data-value={value}
      data-testid={testId}
      className={stepperStep()}
      onClick={() => onSelect$.next(value)}
      onKeyDown={requestNeighbour}
      onFocus={keepFocusedTabVisible}
    >
      <span data-marker aria-hidden="true">
        {status === 'done' ? '✓' : status === 'blocked' ? '⊘' : position}
      </span>
      <span id={`${tabId(baseId, value)}-label`}>{label}</span>
      <span data-value-text id={`${tabId(baseId, value)}-value`}>
        {valueText}
      </span>
      {statusContent !== undefined ? (
        <span data-status-content id={`${tabId(baseId, value)}-status`}>
          {statusContent}
        </span>
      ) : undefined}
    </button>
  );
};

const StepperPanel: FunctionComponent<IStepperPanelProps> = ({
  value,
  children,
  testId,
}) => {
  const { active, baseId } = useStepperContract('Panel');
  const isActive = active === value;
  return (
    <div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      hidden={!isActive}
      tabIndex={isActive ? 0 : undefined}
      className={stepperPanel()}
      data-height-passing
      data-testid={testId}
    >
      {isActive ? children : undefined}
    </div>
  );
};

/**
 * Connected form steps with independent status and consumer-controlled selection.
 * @Guarantees
 * - Root observes active$ and emits identities through onSelect$ without changing selection.
 * - Source replacement clears selection until the new source emits; subscriptions tear down.
 * - Done and blocked steps remain selectable. Left/Right wraps focus and requests selection.
 * - Label and value text name each tab; optional visible status content describes it.
 * - Only the active panel mounts content; returning mounts fresh with no state cache.
 * - The row wraps text before scrolling horizontally and reveals focused steps.
 * - Root takes its parent's height; Panel passes the remainder without owning scrolling.
 *   An unsized parent retains natural content height.
 * @CallerMustEnsure
 * - Supply a valid selected identity, unique stable Step values and matching Panels.
 * - Compose one List of direct Steps (arrays/fragments supported), no wrapper components.
 * - For bounded content, List and Panels are direct DOM children of Root and the Panel's
 *   direct child accepts height (for example Pane). Fixed content must leave usable body space.
 * - Value and status slots contain no interactive descendants. Supply localized status wording
 *   when spoken status is needed; the library supplies shapes but no status translations.
 * - Persist form state outside Stepper and restore it into controls when they mount.
 */
export const Stepper = {
  Root: StepperRoot,
  List: StepperList,
  Step: StepperStep,
  Panel: StepperPanel,
} as const;
