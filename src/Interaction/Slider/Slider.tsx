import { cva } from 'class-variance-authority';
import type { FunctionComponent } from 'react';
import type { Subject } from 'rxjs';

// The track and thumb are vendor pseudo-elements, so every dimension on them needs a token name -
// no consumer selector reaches them (ADR 0004's test; the tick precedent). The track takes
// `controlBorder`: the one thing separating an unfilled control from the surface, >=3:1 against it.
// The thumb takes `primary`, a filled operable element like a Button's fill, under the same 3:1.
// WebKit does not centre the thumb on the track, hence the computed negative margin; Firefox does,
// but draws a default thumb border WebKit does not, hence border-none on its thumb alone.
const slider = cva(
  [
    'block h-[var(--slider-thumb-size)] w-full cursor-pointer appearance-none bg-transparent',
    'outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
    '[&::-webkit-slider-runnable-track]:h-[var(--slider-track-thickness)] [&::-webkit-slider-runnable-track]:rounded-[var(--radius-control)] [&::-webkit-slider-runnable-track]:bg-control-border',
    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-[var(--slider-thumb-size)] [&::-webkit-slider-thumb]:rounded-[var(--radius-control)] [&::-webkit-slider-thumb]:bg-primary',
    '[&::-webkit-slider-thumb]:mt-[calc((var(--slider-track-thickness)-var(--slider-thumb-size))/2)]',
    '[&::-moz-range-track]:h-[var(--slider-track-thickness)] [&::-moz-range-track]:rounded-[var(--radius-control)] [&::-moz-range-track]:bg-control-border',
    '[&::-moz-range-thumb]:size-[var(--slider-thumb-size)] [&::-moz-range-thumb]:rounded-[var(--radius-control)] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-primary',
  ].join(' '),
);

export interface ISliderProps {
  /** The operating range's lower bound - interaction geometry, not a content rule (ADR 0009). */
  min: number;
  /** The operating range's upper bound. */
  max: number;
  /** The increment a movement produces. Defaults to 1: whole-step movement. */
  step?: number;
  /** The current value. Controlled - the consumer holds it and passes it back in. */
  value: number;
  /** Emits the new value on every change. */
  onChange$: Subject<number>;
  /** The control's accessible name. */
  label: string;
  /**
   * How the value is announced, in the consumer's wording ("$60 a week"). Left out, assistive
   * technology reads the bare number: the library ships no wording of its own.
   */
  valueText?: string;
  testId?: string;
}

/**
 * A control that sets one numeric value by moving one thumb along a fixed, visible operating
 * range. Controlled: the consumer holds the value and passes it back in. It renders the value
 * nowhere - the consumer sets any figures beside it with typography - and it fills its
 * container's width the way `Input` does.
 */
export const Slider: FunctionComponent<ISliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange$,
  label,
  valueText,
  testId,
}) => (
  <input
    type={'range'}
    className={slider()}
    min={min}
    max={max}
    step={step}
    value={value}
    aria-label={label}
    aria-valuetext={valueText}
    data-testid={testId}
    onChange={(event) => onChange$.next(event.currentTarget.valueAsNumber)}
  />
);
