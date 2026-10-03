import { cva } from 'class-variance-authority';
import { type FunctionComponent, useEffect, useId, useRef } from 'react';
import type { Subject } from 'rxjs';

// One recipe of its own, not Input's (design-system-components.md §4, issue #111): a text control
// so `-`, `1.` and `1,5` survive - the Number state sanitises them to `''` (WHATWG input.html
// #number-state) - with `inputmode=decimal` as a keyboard hint only. The classes are Input's, for
// Input's reasons: tokens re-pointed by `.dark`, the ring of docs/adr/0002, the faces of 0004.
const numberInput = cva(
  'block w-full rounded-[var(--radius-control)] border border-solid border-control-border bg-transparent px-3 py-2 font-control text-body text-foreground transition-colors duration-[var(--motion-duration-color)] outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] [&:user-invalid]:border-error aria-[invalid=true]:border-error disabled:cursor-not-allowed disabled:border-disabled disabled:text-muted',
);

export interface INumberInputProps {
  /** Always rendered and associated with the control; never replaced by the placeholder. */
  label: string;
  /** How the surrounding form reads the entered text on submit. */
  name: string;
  /** Presence only: the form rejects an empty field, never a non-numeric one. */
  required?: boolean;
  /** How a non-required field says so, in the consuming app's language; left out, no marker renders. */
  optionalLabel?: string;
  hint?: string;
  /** The consumer's verdict on the text; the control renders it and keeps accepting edits. */
  invalid?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  placeholder?: string;
  /**
   * Initialises the uncontrolled field, on mount only: a later change never replaces the current
   * edit. To restore saved text, remount the field with it; native form reset returns to it.
   */
  defaultValue?: string;
  /** Emits the current text on every user edit - typing, pasting, clearing - and on nothing else. */
  onInput$?: Subject<string>;
  /** Emit to empty the control in place, keeping the same node so focus survives; `onInput$` stays silent. */
  reset$?: Subject<void>;
  testId?: string;
}

/**
 * A labelled field for typing numeric amounts and thresholds. It is a text control with a decimal
 * keyboard hint, so the entered text - blank, `0`, `-`, `1.`, `1,5` or pasted content - is kept
 * exactly as typed and read by the form by `name`. Parsing, locale and validity are the consumer's.
 */
export const NumberInput: FunctionComponent<INumberInputProps> = ({
  label,
  name,
  required,
  optionalLabel,
  hint,
  invalid,
  errorMessage,
  disabled,
  placeholder,
  defaultValue,
  onInput$,
  reset$,
  testId,
}) => {
  const id = useId();
  const controlId = `${id}-control`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : undefined, invalid ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  // reset$ is the one inbound command, so the component subscribes here (coding.md#asynchrony) and
  // owns the teardown; onInput$ it only emits on. Emptying the live node keeps focus and any
  // in-flight IME composition, which a `key` remount would discard (issue #64).
  const controlRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const subscription = reset$?.subscribe(() => {
      if (controlRef.current) {
        controlRef.current.value = '';
      }
    });
    return () => subscription?.unsubscribe();
  }, [reset$]);

  return (
    <div className={'flex flex-col gap-[var(--space-stack)]'}>
      <label
        htmlFor={controlId}
        className={'font-secondary font-medium text-body text-foreground'}
      >
        {label}
      </label>
      <input
        ref={controlRef}
        id={controlId}
        name={name}
        type={'text'}
        inputMode={'decimal'}
        className={numberInput()}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-testid={testId}
        onInput={(event) =>
          !disabled && onInput$?.next(event.currentTarget.value)
        }
      />
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
      {invalid && (
        <p id={errorId} className={'font-secondary text-error text-small'}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};
