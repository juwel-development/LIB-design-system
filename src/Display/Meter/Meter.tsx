import { cva, type VariantProps } from 'class-variance-authority';
import type { CSSProperties, FunctionComponent } from 'react';
import { MeterConfigurationError } from './MeterConfigurationError';

// The track is the whole capacity: square corners, no radius token - Meter is not a control
// (docs/adr/0003). The one-pixel `rule` line identifies the capacity against the surface;
// `meterTrack` behind it makes the scale visible without boxing (docs/adr/0010). Deliberately no
// transition class: the library's one motion belongs to state changes on controls, not a display.
const meterTrack = cva(
  'w-full h-[var(--meter-track-thickness)] bg-meter-track border border-solid border-rule',
);

// The fill is a block box sized by --meter-level, the normalized share the component computes;
// block layout places it at inline-start in both LTR and RTL, no physical offset. Depleting reads
// the same share into color-mix: `meterFill` at max, `error` at min, linearly through OKLab - a
// perceptual space, so no threshold (docs/adr/0010). Both endpoints stay tokens a brand re-points.
const meterFill = cva('h-full w-[calc(var(--meter-level)*100%)]', {
  variants: {
    treatment: {
      neutral: 'bg-meter-fill',
      depleting:
        'bg-[color-mix(in_oklab,var(--color-meter-fill)_calc(var(--meter-level)*100%),var(--color-error))]',
    },
  },
  defaultVariants: {
    treatment: 'neutral',
  },
});

// React's CSSProperties is closed over known properties; the one custom property the recipes read
// is declared here so the style object stays typed without an assertion.
type MeterLevelStyle = CSSProperties & { '--meter-level': number };

export interface IMeterProps extends VariantProps<typeof meterFill> {
  /** The current level. Must lie inside `[min, max]`; an outside value throws
   *  {@link MeterConfigurationError} rather than clamping - a wrong number must not render as a
   *  plausible level. */
  value: number;
  /** The bottom of the scale. Defaults to `0`. */
  min?: number;
  /** The top of the scale. Must exceed `min`. */
  max: number;
  /** The meter's accessible name - what the level measures. Required, and never rendered visibly:
   *  the component shows a filled track and nothing else. Its wording is the consumer's. */
  label: string;
  /** Optional `aria-valuetext`, so a screen reader hears the consumer's wording ("strained")
   *  instead of a bare number. Omitted, the numeric value is announced. */
  valueText?: string;
  testId?: string;
}

/**
 * A read-only display of one numeric level within a bounded scale, shown as a filled share of a
 * whole: a short track, a fill from inline-start, no text. It states an amount - not an operation's
 * completion, and unlike a Slider it cannot be operated.
 *
 * @Guarantees — enforced on every render
 * - The root carries `role="meter"`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, the `label`
 *   as its accessible name, and `aria-valuetext` exactly when `valueText` is supplied. It is not
 *   focusable, and the visual fill is hidden from the accessibility tree.
 * - The filled share is `(value - min) / (max - min)` of the container and begins at logical
 *   inline-start under both LTR and RTL direction.
 * - Neutral paints the fill with `meterFill`; `depleting` maps the normalized level linearly
 *   through OKLab from `meterFill` at the maximum to `error` at the minimum - no threshold, no
 *   wording, no icon (docs/adr/0010-meter-depletion-is-a-treatment.md).
 * - A value change lands instantly: no width or colour animation.
 * - The track fills its container, reads `--meter-track-thickness`, keeps square corners (no
 *   radius token - Meter is not a control), and draws a persistent one-pixel `rule` line that
 *   identifies the whole capacity against the surface.
 * - Invalid numeric configuration throws {@link MeterConfigurationError}: non-finite `value`,
 *   `min` or `max`, `min >= max`, or a value outside the inclusive range. Nothing is clamped.
 * - No visible wording of its own, no numeric readout, no caption slot, no `className`/`style`
 *   passthrough.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - `label` carries meaningful wording; the component renders it to assistive technology only and
 *   does not inspect it.
 * - When `depleting` is selected, surrounding visible content explains why nearing the minimum
 *   matters - the colour walk reinforces a stated consequence and must not be its only carrier.
 *
 * @UXGuidelines
 * - Place any visible caption or readout yourself with typography; the Meter deliberately carries
 *   none, so what the level measures stays the consumer's wording.
 * - Reach for `depleting` only where a low value is genuinely more erroneous - some quantities
 *   become safer toward their minimum, which is why the treatment is opt-in.
 */
export const Meter: FunctionComponent<IMeterProps> = ({
  value,
  min = 0,
  max,
  treatment,
  label,
  valueText,
  testId,
}) => {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    throw new MeterConfigurationError(
      `value, min and max must be finite numbers (got value=${value}, min=${min}, max=${max})`,
    );
  }
  if (min >= max) {
    throw new MeterConfigurationError(
      `min must be less than max (got min=${min}, max=${max})`,
    );
  }
  if (value < min || value > max) {
    throw new MeterConfigurationError(
      `value must lie within [min, max] (got value=${value}, min=${min}, max=${max})`,
    );
  }

  const style: MeterLevelStyle = {
    '--meter-level': (value - min) / (max - min),
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: the native <meter> paints its own optimum/low/high bands the token contract cannot reach, and its fill is unstylable cross-browser; the ARIA meter pattern on a div carries the same semantics with the library's paint (#105).
    <div
      role={'meter'}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label}
      aria-valuetext={valueText}
      data-testid={testId}
      className={meterTrack()}
      style={style}
    >
      <div aria-hidden={'true'} className={meterFill({ treatment })} />
    </div>
  );
};
