import { cva } from 'class-variance-authority';
import { type FunctionComponent, useId } from 'react';
import type { Subject } from 'rxjs';

// Field styling follows Input and ADRs 0001–0004; native appearance retains the platform picker.
const select = cva(
  'block w-full rounded-[var(--radius-control)] border border-solid border-control-border bg-transparent px-3 py-2 font-primary text-body text-foreground transition-colors duration-[var(--motion-duration-color)] outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] [&:user-invalid]:border-error aria-[invalid=true]:border-error disabled:cursor-not-allowed disabled:border-disabled disabled:text-muted',
);

export interface ISelectProps {
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
  /** Values must be unique, stable, nonempty strings; labels belong to the consuming app. */
  options: readonly { readonly value: string; readonly label: string }[];
}

/**
 * An uncontrolled native single-select field. The first option is always empty and selectable;
 * `required` makes that empty value invalid. Option updates preserve a surviving selected value
 * and fall back to empty when it disappears, without emitting. The form reads the value by name.
 */
export const Select: FunctionComponent<ISelectProps> = ({
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
  options,
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
    <div className={'flex flex-col gap-[var(--space-stack)]'}>
      <label
        htmlFor={controlId}
        className={'font-secondary font-medium text-body text-foreground'}
      >
        {label}
      </label>
      <select
        id={controlId}
        name={name}
        required={required}
        disabled={disabled}
        className={select()}
        defaultValue={defaultValue ?? ''}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-testid={testId}
        onChange={(event) =>
          !disabled && onChange$?.next(event.currentTarget.value)
        }
      >
        <option value={''}>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {!required && optionalLabel && (
        <span className={'font-secondary text-muted text-small'}>
          {optionalLabel}
        </span>
      )}
      {hint && (
        <p id={hintId} className={'font-secondary text-muted text-small'}>
          {hint}
        </p>
      )}
      {invalid && errorMessage && (
        <p id={errorId} className={'font-secondary text-error text-small'}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};
