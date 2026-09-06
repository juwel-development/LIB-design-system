import { cva } from 'class-variance-authority';
import type { FunctionComponent } from 'react';
import type { Subject } from 'rxjs';
import { SliderConfigurationError } from './SliderConfigurationError';

// The track and thumb are vendor pseudo-elements, so every dimension on them needs a token name -
// no consumer selector reaches them (ADR 0004's test; the tick precedent). The track takes
// `controlBorder`: the one thing separating an unfilled control from the surface, >=3:1 against it.
// The thumb takes `foreground`, a solid mark drawn on the surface like the tab marker; disabled
// paints both in the disabled role, the non-operable statement every control makes. WebKit does
// not centre the thumb on the track, hence the computed negative margin; Firefox does, but draws a
// default thumb border WebKit does not, hence border-none on its thumb alone.
const slider = cva(
  [
    'block h-[var(--slider-thumb-size)] w-full cursor-pointer appearance-none bg-transparent',
    'disabled:cursor-not-allowed',
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
    '[&::-webkit-slider-runnable-track]:h-[var(--slider-track-thickness)] [&::-webkit-slider-runnable-track]:rounded-[var(--radius-control)] [&::-webkit-slider-runnable-track]:bg-control-border',
    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-[var(--slider-thumb-size)] [&::-webkit-slider-thumb]:rounded-[var(--radius-control)] [&::-webkit-slider-thumb]:bg-foreground',
    '[&::-webkit-slider-thumb]:mt-[calc((var(--slider-track-thickness)-var(--slider-thumb-size))/2)]',
    '[&:disabled::-webkit-slider-runnable-track]:bg-disabled [&:disabled::-webkit-slider-thumb]:bg-disabled',
    '[&::-moz-range-track]:h-[var(--slider-track-thickness)] [&::-moz-range-track]:rounded-[var(--radius-control)] [&::-moz-range-track]:bg-control-border',
    '[&::-moz-range-thumb]:size-[var(--slider-thumb-size)] [&::-moz-range-thumb]:rounded-[var(--radius-control)] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-foreground',
    '[&:disabled::-moz-range-track]:bg-disabled [&:disabled::-moz-range-thumb]:bg-disabled',
  ].join(' '),
);

export interface ISliderProps {
  /** The operating range's lower bound - interaction geometry, not a content rule (ADR 0009). */
  min: number;
  /** The operating range's upper bound. */
  max: number;
  /**
   * The increment a movement produces. Defaults to 1: whole-step movement. Keeping `value` and
   * `max` on the step grid is the caller's obligation - Slider neither rejects nor repairs an
   * off-grid value, and the native control's own conduct stays observable: inside a surrounding
   * form, misalignment counts as a `stepMismatch` against that form's validity.
   */
  step?: number;
  /** The current value. Controlled - the consumer holds it and passes it back in. */
  value: number;
  /**
   * Emits the new value on every native input event. Required, not optional: the control is
   * controlled and takes no part in form submission, so a consumer that did not listen here
   * could never read a value at all.
   */
  onInput$: Subject<number>;
  /** The control's accessible name. */
  label: string;
  /**
   * How the value is announced, in the consumer's wording ("$60 a week"). Left out, assistive
   * technology reads the bare number: the library ships no wording of its own.
   */
  valueText?: string;
  /** The explicit non-operable state: native disabled conduct, no emissions, disabled paint. */
  disabled?: boolean;
  testId?: string;
}

// Structural misconfiguration is a programmer error, so it fails fast - no clamping, no
// normalization, no substitute emission. Step-grid alignment is deliberately not checked: that is
// the caller's obligation, documented on `step`, and native constraint behaviour stays observable.
const assertOperatingRange = (
  range: Pick<Required<ISliderProps>, 'min' | 'max' | 'step' | 'value'>,
): void => {
  for (const [name, given] of Object.entries(range)) {
    if (!Number.isFinite(given)) {
      throw new SliderConfigurationError(
        `\`${name}\` must be a finite number, got ${given}`,
      );
    }
  }
  if (range.min >= range.max) {
    throw new SliderConfigurationError(
      `\`min\` (${range.min}) must be below \`max\` (${range.max})`,
    );
  }
  if (range.step <= 0) {
    throw new SliderConfigurationError(
      `\`step\` (${range.step}) must be positive`,
    );
  }
  if (range.value < range.min || range.value > range.max) {
    throw new SliderConfigurationError(
      `\`value\` (${range.value}) must lie within [${range.min}, ${range.max}]`,
    );
  }
};

/**
 * A control that sets one numeric value by moving one thumb along a fixed, visible operating
 * range. Controlled: the consumer holds the value and passes it back in, and a value it does not
 * pass back is never adopted. It renders the value nowhere - the consumer sets any figures beside
 * it with typography - and it fills its container's width the way `Input` does. `disabled` is the
 * explicit non-operable state.
 */
export const Slider: FunctionComponent<ISliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onInput$,
  label,
  valueText,
  disabled,
  testId,
}) => {
  assertOperatingRange({ min, max, step, value });
  return (
    <input
      type={'range'}
      className={slider()}
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={label}
      aria-valuetext={valueText}
      data-testid={testId}
      // React's onChange rides the native input event, so every movement emits through here.
      onChange={(event) => onInput$.next(event.currentTarget.valueAsNumber)}
    />
  );
};
