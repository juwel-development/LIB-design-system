import { cva } from 'class-variance-authority';
import type { FunctionComponent } from 'react';

// The glyph is sized in `em` and stroked in `currentColor`, so it takes the size and colour of the
// text it sits in and needs no colour or size prop. Baseline at -0.125em is what seats a 1em square
// beside lowercase letters; the inline-box exists so an icon reads as a word in its line.
const icon = cva('inline-block shrink-0 align-[-0.125em]');

// Each name selects a drawing and nothing else: the three sort indicators are told apart by their
// arrows, not by colour or size, so they survive forced-colors mode and a monochrome print.
const drawings = {
  sort: [
    'M5.5 13V3',
    'M3 5.5l2.5-2.5L8 5.5',
    'M10.5 3v10',
    'M8 10.5l2.5 2.5 2.5-2.5',
  ],
  'sort-ascending': ['M8 13V3', 'M4 7l4-4 4 4'],
  'sort-descending': ['M8 3v10', 'M4 9l4 4 4-4'],
} as const;

export interface IIconProps {
  /** Which drawing. A name selects a shape, never a state or a behaviour. */
  name: keyof typeof drawings;
  testId?: string;
}

/**
 * A reusable visual glyph: the three sort indicators a consumer composes inside a header cell's
 * plain Button, or beside any text that names what the icon reinforces.
 *
 * @Guarantees — enforced on every render
 * - Hidden from assistive technology and out of the tab order: it adds no stop and no spoken name.
 * - Scales with the surrounding font-size and takes the surrounding text colour.
 * - The three drawings differ in shape, so the ordering is never carried by colour alone.
 *
 * @CallerMustEnsure
 * - The control or text beside it carries the meaning: a `Button` label, a header cell's `ariaSort`.
 *   An icon standing alone says nothing to a screen reader.
 */
export const Icon: FunctionComponent<IIconProps> = ({ name, testId }) => (
  <svg
    aria-hidden={true}
    focusable={false}
    viewBox={'0 0 16 16'}
    width={'1em'}
    height={'1em'}
    className={icon()}
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
