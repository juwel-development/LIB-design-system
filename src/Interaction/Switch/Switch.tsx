import { cva } from 'class-variance-authority';
import { type FunctionComponent, useEffect, useState } from 'react';
import type { Observable, Subject } from 'rxjs';

const switchControl = cva([
  'inline-flex max-w-full items-center gap-[var(--space-stack)] rounded-[var(--radius-control)] bg-transparent p-0 text-start cursor-pointer',
  'font-secondary font-medium text-body text-foreground disabled:text-muted disabled:cursor-not-allowed',
  'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  '[&>[data-track]]:inline-flex [&>[data-track]]:shrink-0 [&>[data-track]]:box-content [&>[data-track]]:w-[calc(2*var(--switch-thumb-size))] [&>[data-track]]:p-[var(--switch-track-inset)]',
  '[&>[data-track]]:rounded-[var(--radius-control)] [&>[data-track]]:border [&>[data-track]]:border-solid [&>[data-track]]:border-control-border [&>[data-track]]:bg-surface',
  "[&>[data-track]::before]:content-[''] [&>[data-track]::before]:block [&>[data-track]::before]:size-[var(--switch-thumb-size)] [&>[data-track]::before]:rounded-[var(--radius-control)] [&>[data-track]::before]:bg-foreground",
  'aria-checked:[&>[data-track]]:justify-end',
  'disabled:[&>[data-track]]:border-disabled disabled:[&>[data-track]::before]:bg-disabled',
  'forced-colors:[&>[data-track]]:[forced-color-adjust:none] forced-colors:[&>[data-track]]:border-[ButtonText] forced-colors:[&>[data-track]]:bg-[Canvas] forced-colors:[&>[data-track]::before]:bg-[ButtonText]',
  'forced-colors:disabled:text-[GrayText] forced-colors:disabled:[&>[data-track]]:border-[GrayText] forced-colors:disabled:[&>[data-track]::before]:bg-[GrayText]',
  '[&>[data-label]]:min-w-0 [&>[data-label]]:wrap-anywhere',
]);

export interface ISwitchProps {
  /** A visible, stable name for the setting, not a changing on/off caption. */
  label: string;
  /** Consumer-owned state. Off until the current source first emits, including on replacement. */
  checked$: Observable<boolean>;
  /** Requests the opposite of the displayed state; only an input emission changes the display. */
  onChange$: Subject<boolean>;
  /** Native disabled conduct; the current state remains visible. */
  disabled?: boolean;
  testId?: string;
}

/**
 * One immediate binary setting, named by its visible label. A native button supplies a single
 * tab stop and Space/Enter activation without submitting a surrounding form. Thumb position and
 * aria-checked expose the input state; neither activation nor focus changes it independently.
 * Use Choices for described alternatives, or a checkbox in a Form for a submitted selection.
 */
export const Switch: FunctionComponent<ISwitchProps> = ({
  label,
  checked$,
  onChange$,
  disabled,
  testId,
}) => {
  const [isChecked, setChecked] = useState(false);
  useEffect(() => {
    setChecked(false);
    const subscription = checked$.subscribe(setChecked);
    return () => subscription.unsubscribe();
  }, [checked$]);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      data-testid={testId}
      className={switchControl()}
      onClick={() => onChange$.next(!isChecked)}
    >
      <span data-track aria-hidden="true" />
      <span data-label>{label}</span>
    </button>
  );
};
