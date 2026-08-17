import { cva } from 'class-variance-authority';
import { type FunctionComponent, useEffect, useId, useRef } from 'react';
import type { Subject } from 'rxjs';

// One recipe, deliberately not shared with Input (issue #5): each control owns its whole recipe so
// one-recipe-per-component holds without a base module. Colours are semantic tokens re-pointed by
// `.dark`, so no `dark:` class is needed. The border is the only boundary of a transparent control,
// drawn in `controlBorder` (>=3:1 against surface) and turned `error` on both `:user-invalid` and
// `aria-invalid` so a server-rendered and a browser-validated invalid state paint identically. Focus
// adds only the shared ring - the border never changes on focus (docs/adr/0002). Height is the
// recipe's, not a `rows` prop. The control's face, and the placeholder that follows it, are
// docs/adr/0004's (#90). Its size is that ADR's too (#92): `body` is the one role clearing the 16px
// below which iOS Safari zooms the viewport on focus, a floor published on --text-body because a
// re-pointed token can break it.
const textArea = cva(
  'block min-h-24 w-full rounded-[var(--radius-control)] border border-solid border-control-border bg-transparent px-3 py-2 font-primary text-body text-foreground transition-colors duration-[var(--motion-duration-color)] outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] [&:user-invalid]:border-error aria-[invalid=true]:border-error disabled:cursor-not-allowed disabled:border-disabled disabled:text-muted',
);

interface ITextAreaProps {
  /** Always rendered and associated with the control; never replaced by the placeholder. */
  label: string;
  /** How the surrounding form reads the value on submit. */
  name: string;
  required?: boolean;
  /**
   * How a non-required field says so, in the consuming app's language. Left out, the field carries
   * no marker at all: the library translates nothing and ships no wording of its own (issue #74).
   */
  optionalLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  placeholder?: string;
  autocomplete?: 'name' | 'email' | 'url' | 'organization' | 'tel' | 'off';
  hint?: string;
  errorMessage?: string;
  onInput$?: Subject<string>;
  /** Emit to empty the control in place, keeping the same node so focus and IME composition survive. */
  reset$?: Subject<void>;
  testId?: string;
}

/**
 * A labelled multi-line text control. Its value is uncontrolled - the form reads it by `name` on
 * submit - so it works with JavaScript disabled. Ids are minted internally, so the prop surface
 * stays closed and the label/hint/error associations survive with no hydration.
 */
export const TextArea: FunctionComponent<ITextAreaProps> = ({
  label,
  name,
  required,
  optionalLabel,
  invalid,
  disabled,
  defaultValue,
  placeholder,
  autocomplete,
  hint,
  errorMessage,
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

  // reset$ is an inbound command, so the component subscribes here (coding.md#asynchrony), unlike
  // onInput$ which it emits on. Emptying the live node keeps focus and any in-flight IME composition,
  // which a `key` remount would discard (issue #64).
  const controlRef = useRef<HTMLTextAreaElement>(null);
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
      {/* Each of these declares `font-secondary` on itself, never on the wrapper above - the
          wrapper would hand the labelling face to the control too (docs/adr/0004, #90). The
          label's size is declared here for the same reason, and it is `body` - the control's own
          role, not `label`, whose 13px would set a field's label smaller than the hint and error
          message beneath it and would arrive letter-spaced (docs/adr/0004, #92). */}
      <label
        htmlFor={controlId}
        className={'font-secondary font-medium text-body text-foreground'}
      >
        {label}
      </label>
      <textarea
        ref={controlRef}
        id={controlId}
        name={name}
        className={textArea()}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autocomplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-testid={testId}
        onInput={(event) => onInput$?.next(event.currentTarget.value)}
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
