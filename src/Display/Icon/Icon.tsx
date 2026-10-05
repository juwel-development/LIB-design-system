import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent } from 'react';

// The glyph is sized in `em` and stroked in `currentColor`, so it takes the size and colour of the
// text it sits in and needs no size prop. Baseline at -0.125em is what seats a 1em square beside
// lowercase letters; the inline-box exists so an icon reads as a word in its line. `color` has no
// default on purpose (docs/adr/0011, the #126 amendment): absent, no class competes with the text.
const icon = cva(
  // Measured in Chrome: an svg root that sets its own colour keeps it under forced colours, so a
  // toned glyph stayed amber on the user's canvas; `auto` hands it back to CanvasText.
  'inline-block shrink-0 align-[-0.125em] forced-color-adjust-auto',
  {
    variants: {
      color: {
        muted: 'text-muted',
        success: 'text-success',
        warning: 'text-warning',
        error: 'text-error',
        info: 'text-info',
      },
    },
  },
);

// One outline for both bubbles, so the two forms of a state differ only by the mark inside it.
const bubble =
  'M3.5 2h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7.25L4 13.75V11h-.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z';

// Each name selects a drawing and nothing else: drawings are told apart by their strokes, not by
// colour or size, so they survive forced-colors mode and a monochrome print.
const drawings = {
  sort: [
    'M5.5 13V3',
    'M3 5.5l2.5-2.5L8 5.5',
    'M10.5 3v10',
    'M8 10.5l2.5 2.5 2.5-2.5',
  ],
  'sort-ascending': ['M8 13V3', 'M4 7l4-4 4 4'],
  'sort-descending': ['M8 3v10', 'M4 9l4 4 4-4'],
  bin: [
    'M2.5 4.5h11',
    'M6 4.5V3a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1.5',
    'M4 4.5l.6 8.1a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.1',
    'M6.75 7.25v3.5',
    'M9.25 7.25v3.5',
  ],
  'bubble-exclamation': [bubble, 'M8 4.5v2', 'M8 8.75h.01'],
  'bubble-tick': [bubble, 'M5.75 6.75l1.5 1.5 3-3.5'],
} as const;

export interface IIconProps extends VariantProps<typeof icon> {
  /** Which drawing. A name selects a shape, never a state or a behaviour. */
  name: keyof typeof drawings;
  /**
   * The accessible name that makes the icon a status mark (CONTEXT.md). Give it only where the icon
   * stands alone for a state; absent or empty, the icon stays hidden from assistive technology.
   */
  label?: string;
  testId?: string;
}

/**
 * A reusable visual glyph in six drawings: three sort indicators, a bin, and a speech bubble holding
 * an exclamation mark or a tick. Decorative beside the control or text that names it, or - given a
 * `label` - a status mark that stands alone for an item's state.
 *
 * @Guarantees — enforced on every render
 * - Out of the tab order in both forms: it adds no stop.
 * - Without a `label` it is hidden from assistive technology and adds no spoken name.
 * - With a non-empty `label` it is one image named by that label alone, announced once; an image
 *   without a name is never rendered.
 * - Scales with the surrounding font-size and takes the surrounding text colour unless `color`
 *   selects `muted` or a status tone. The tone changes colour only: no role, name or announcement.
 * - Every drawing differs in shape, so no meaning is carried by colour alone.
 *
 * @CallerMustEnsure
 * - An unlabelled icon sits beside what carries the meaning: a `Button` label or `ariaLabel`, a
 *   header cell's `ariaSort`. Inside a named control it stays unlabelled, or the name is said twice.
 * - A status mark's `label` states the status in the reader's language; the library words nothing.
 * - The two forms of one state use two drawings, never one drawing in two colours.
 */
export const Icon: FunctionComponent<IIconProps> = ({
  name,
  label,
  color,
  testId,
}) => (
  <svg
    // An empty label counts as none: `role="img"` without a name would be worse than hidden.
    role={label ? 'img' : undefined}
    aria-label={label || undefined}
    aria-hidden={label ? undefined : true}
    focusable={false}
    viewBox={'0 0 16 16'}
    width={'1em'}
    height={'1em'}
    className={icon({ color })}
    data-testid={testId}
  >
    {drawings[name].map((segment) => (
      <path
        key={segment}
        d={segment}
        fill={'none'}
        stroke={'currentColor'}
        strokeWidth={1.5}
        strokeLinecap={'round'}
        strokeLinejoin={'round'}
      />
    ))}
  </svg>
);
