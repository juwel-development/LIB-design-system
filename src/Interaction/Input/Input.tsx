import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { type FunctionComponent, useEffect, useId, useRef } from 'react';
import type { Subject } from 'rxjs';

// One recipe, deliberately not shared with TextArea (issue #5): each control owns its whole recipe
// so one-recipe-per-component holds without a base module. Colours are semantic tokens re-pointed by
// `.dark`, so no variant carries a `dark:` class. The border is the only boundary of a transparent
// control, drawn in `controlBorder` (>=3:1 against surface) and turned `error` on both `:user-invalid`
// and `aria-invalid` so a server-rendered and a browser-validated invalid state paint identically.
// Focus adds only the shared ring - the border never changes on focus (docs/adr/0002).
const input = cva(
  'block w-full rounded-[var(--radius-control)] border border-solid border-control-border bg-transparent px-3 py-2 text-foreground transition-colors duration-[var(--motion-duration-color)] outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] [&:user-invalid]:border-error aria-[invalid=true]:border-error disabled:cursor-not-allowed disabled:border-disabled disabled:text-muted',
  {
    variants: {
      // text/email/url are visually identical; the axis only selects the control's `type`
      // attribute (issue #5), so each option carries no class of its own.
      variant: { text: '', email: '', url: '' },
    },
    defaultVariants: { variant: 'text' },
  },
);

interface IInputProps extends VariantProps<typeof input> {
  /** Always rendered and associated with the control; never replaced by the placeholder. */
  label: string;
  /** How the surrounding form reads the value on submit. */
  name: string;
  required?: boolean;
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
 * A labelled single-line text control. Its value is uncontrolled - the form reads it by `name` on
 * submit - so it works with JavaScript disabled. Ids are minted internally, so the prop surface
 * stays closed and the label/hint/error associations survive with no hydration.
 */
export const Input: FunctionComponent<IInputProps> = ({
  label,
  name,
  variant,
  required,
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

  // reset$ is an inbound command, so the component is the subscriber here rather than the emitter
  // it is for onInput$ (coding.md#asynchrony). Emptying the live node keeps focus and any in-flight
  // IME composition, which a `key` remount discards (issue #64). It owns this subscription's teardown
  // and never completes the Subject - the consumer owns its lifetime.
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
      <label htmlFor={controlId} className={'font-medium text-foreground'}>
        {label}
      </label>
      <input
        ref={controlRef}
        id={controlId}
        name={name}
        type={variant ?? 'text'}
        className={input({ variant })}
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
      {!required && <span className={'text-muted text-sm'}>optional</span>}
      {hint && (
        <p id={hintId} className={'text-muted text-sm'}>
          {hint}
        </p>
      )}
      {invalid && (
        <p id={errorId} className={'text-error text-sm'}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};
