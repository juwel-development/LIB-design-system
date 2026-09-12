import { cva } from 'class-variance-authority';
import { type FunctionComponent, type ReactNode, useId } from 'react';
import type { Subject } from 'rxjs';

// Field styling follows Input and ADRs 0001–0004; native appearance retains the platform picker.
const selectRoot = cva(
  [
    'flex flex-col gap-[var(--space-stack)]',
    '[&>label]:font-secondary [&>label]:font-medium [&>label]:text-body [&>label]:text-foreground',
    '[&>span]:font-secondary [&>span]:text-muted [&>span]:text-small',
    '[&>p]:font-secondary [&>p]:text-small [&>p]:text-muted [&>p[data-error]]:text-error',
    '[&>select]:block [&>select]:w-full [&>select]:rounded-[var(--radius-control)] [&>select]:border [&>select]:border-solid [&>select]:border-control-border [&>select]:bg-transparent [&>select]:px-3 [&>select]:py-2',
    '[&>select]:font-primary [&>select]:text-body [&>select]:text-foreground [&>select]:transition-colors [&>select]:duration-[var(--motion-duration-color)]',
    '[&>select]:outline-focus-ring [&>select]:outline-offset-[var(--focus-ring-offset)] [&>select]:focus-visible:outline [&>select]:focus-visible:outline-[length:var(--focus-ring-width)]',
    '[&>select:user-invalid]:border-error [&>select]:aria-[invalid=true]:border-error [&>select]:disabled:cursor-not-allowed [&>select]:disabled:border-disabled [&>select]:disabled:text-muted',
  ].join(' '),
);

export interface ISelectRootProps {
  /** Always rendered and associated with the control. */
  label: string;
  /** How the surrounding form reads the value on submit. */
  name: string;
  required?: boolean;
  /** Caller-localized marker, rendered only when the field is optional. */
  optionalLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  hint?: string;
  errorMessage?: string;
  testId?: string;
  /** Initial selection only; omitted or unmatched values start empty. */
  defaultValue?: string;
  /** Emits the selected value only on user changes; never on render or native form reset. */
  onChange$?: Subject<string>;
  /** Caller-localized wording for the first, empty option, which remains selectable. */
  placeholder: string;
  /** Compose Select.Option children; arrays, fragments and consumer components are supported. */
  children?: ReactNode;
}

/**
 * An uncontrolled native single-select field. The first option is always empty and selectable;
 * `required` makes that empty value invalid. Option updates preserve a surviving selected value
 * and fall back to empty when it disappears, without emitting. The form reads the value by name.
 */
const SelectRoot: FunctionComponent<ISelectRootProps> = ({
  label,
  name,
  required,
  optionalLabel,
  disabled,
  invalid,
  hint,
  errorMessage,
  testId,
  defaultValue,
  onChange$,
  placeholder,
  children,
}) => {
  const id = useId();
  const controlId = `${id}-control`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : undefined, invalid && errorMessage ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={selectRoot()}>
      <label htmlFor={controlId}>{label}</label>
      <select
        id={controlId}
        name={name}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue ?? ''}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-testid={testId}
        onChange={(event) =>
          !disabled && onChange$?.next(event.currentTarget.value)
        }
      >
        <option value={''}>{placeholder}</option>
        {children}
      </select>
      {!required && optionalLabel && <span>{optionalLabel}</span>}
      {hint && <p id={hintId}>{hint}</p>}
      {invalid && errorMessage && (
        <p id={errorId} data-error>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export interface ISelectOptionProps {
  /** Unique, stable, nonempty identity; the empty string belongs to Root's placeholder. */
  value: string;
  /** Caller-localized text; native options do not accept rich content. */
  children: string;
  testId?: string;
}

const SelectOption: FunctionComponent<ISelectOptionProps> = ({
  value,
  children,
  testId,
}) => (
  <option value={value} data-testid={testId}>
    {children}
  </option>
);

/**
 * An uncontrolled native single-select field composed from Root and Option.
 * Root owns the label, selectable empty placeholder and field messages; Option renders text.
 *
 * @Guarantees
 * - Required rejects empty; forms read the current stable value by name.
 * - onChange$ emits user changes (including clearing), never rendering, option updates or reset.
 * - Omitted/unmatched defaults start empty; later defaultValue changes do not select a value.
 * - Removing the selected option falls back to empty without emitting.
 *
 * @CallerMustEnsure
 * - Compose Option members under Root; arrays, fragments and consumer components are supported.
 * - Option values are unique, stable and nonempty, with stable React keys when mapping children.
 * - The consumer owns all wording, stream lifetime and domain reconciliation on updates/reset.
 * - Native reset restores the original default while its option stays mounted, otherwise empty.
 *   A newly mounted option does not inherit a removed option's reset default; remount Root to
 *   initialize another record. Translation/reordering with stable keys preserves native state.
 */
export const Select = {
  Root: SelectRoot,
  Option: SelectOption,
} as const;
