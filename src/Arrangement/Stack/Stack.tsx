import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on a plain <div>, and the variant order is load-bearing: measure, then direction, then
// gap emits the same class string six existing components hand-write, and the spec pins it - they
// cannot import this one (architecture standard, the import test). The roster is the evidence and
// not the token family: `band` is vertical padding and never a gap, and only `--measure` has ever
// bounded a container, so the bound is on-or-off rather than a set of named measures (docs/adr/0008).
// `split` turns at `lg`, the threshold Rail and DefinitionList already use.
const stack = cva('flex', {
  variants: {
    measure: { true: 'max-w-[var(--measure)]', false: '' },
    direction: {
      column: 'flex-col',
      split: 'flex-col lg:flex-row lg:items-start',
    },
    gap: {
      stack: 'gap-[var(--space-stack)]',
      region: 'gap-[var(--space-region)]',
    },
  },
  defaultVariants: { measure: false, direction: 'column', gap: 'stack' },
});

export interface IStackProps extends VariantProps<typeof stack> {
  /** The stacked matter. Rendered unmodified: `Stack` imposes no anatomy. */
  children?: ReactNode;
  testId?: string;
}

/**
 * A vertical arrangement: children in a column, separated by one named space role and optionally
 * bounded by the reading measure. It owns one axis and one gap and nothing else - no landmark, no
 * heading, no band, no join, no gutter, no fill - and takes no outer space, so whatever holds it
 * owns the rhythm around it.
 *
 * @Guarantees — enforced on every render
 * - It renders a `div` with no landmark role, no heading and no margin of its own.
 * - `gap` selects which space role separates the children: `stack` (the default), the gap between
 *   siblings within one block, or `region`, the gap between groups of blocks. Nothing else — a
 *   spacing neither role expresses is a request for a measurement (docs/adr/0003, docs/adr/0004).
 * - `measure` bounds the element to `--measure`, the reading column; omitted, the column is
 *   unbounded, which is right wherever the children are not running text. It sets no font-size, so
 *   a `ch`-counted measure keeps resolving against inherited body type.
 * - `direction="column"` (the default) never changes axis. `direction="split"` is the same column
 *   turning into a row at and above 64rem, its children aligned to their start edge rather than
 *   stretched. It is the only viewport-dependent behaviour here, and it is named for the job: the
 *   breakpoint is an implementation detail and is not part of the vocabulary.
 * - No literal length and no numbered spacing rung appears in the recipe: every value it emits is a
 *   role the token layer already names, so a second brand re-points all of them.
 * - `children` render unmodified, and it needs no JavaScript.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - The gutter and the vertical band belong to the `Section` around it —
 *   `<Section><Stack>…</Stack></Section>` — and not to a prop here, or two components own one job.
 * - A stack holding running text is a reading block: reach for `Prose` instead, which is this
 *   arrangement plus the contract that says the content is prose.
 *
 * @UXGuidelines
 * - `gap="region"` separates groups of blocks, not blocks. A region-sized gap between two paragraphs
 *   reads as missing content — the argument `Section` makes for joining rather than gapping.
 */
export const Stack: FunctionComponent<IStackProps> = ({
  gap,
  measure,
  direction,
  children,
  testId,
}) => (
  <div className={stack({ gap, measure, direction })} data-testid={testId}>
    {children}
  </div>
);
