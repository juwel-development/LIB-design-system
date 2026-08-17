import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on a plain <div>. The two axes are two positions and take different roles, so the base
// sets `gap-y` and the variant sets `gap-x` - a shorthand would hand the caller both. `gap` holds the
// two roles attested along a line and defaults to `region`, the wider one every clustered site uses;
// the wrapped-line gap and the baseline alignment have one answer each in the evidence, so the recipe
// fixes them and no prop reaches them (docs/adr/0008). Header hand-writes a near-identical row and
// cannot import this one (architecture standard, the import test); it deliberately differs on gap-y.
const cluster = cva(
  'flex flex-wrap items-baseline gap-y-[var(--space-stack)]',
  {
    variants: {
      gap: {
        stack: 'gap-x-[var(--space-stack)]',
        region: 'gap-x-[var(--space-region)]',
      },
      justify: {
        start: '',
        between: 'justify-between',
      },
    },
    defaultVariants: { gap: 'region', justify: 'start' },
  },
);

export interface IClusterProps extends VariantProps<typeof cluster> {
  /** The clustered matter. Rendered unmodified: `Cluster` imposes no anatomy and wraps nothing in an
   *  item element. */
  children?: ReactNode;
  testId?: string;
}

/**
 * A horizontal arrangement that wraps: children in a row, aligned on their baselines, with a wider
 * gap along a line than between wrapped lines. It owns one arrangement and nothing else - no
 * landmark, no band, no join, no gutter, no fill - and takes no outer space, so whatever holds it
 * owns the rhythm around it.
 *
 * @Guarantees — enforced on every render
 * - It renders a `div` with no landmark role, no `nav` of its own and no margin.
 * - Children wrap onto further lines rather than overflowing or shrinking, at every prop combination.
 * - Children are always aligned on their baselines. These rows mix type at different roles — a nav
 *   link at the label role beside a credit line at the small role — and centring them makes the type
 *   look mis-set, so this is the arrangement rather than a default to override (docs/adr/0008).
 * - `gap` selects which space role separates items **along a line**: `region` (the default), the gap
 *   between one group and the next, or `stack`, the sibling gap between items that belong together.
 *   Nothing else — neither the band role, which is vertical padding and never a gap, nor the gutter,
 *   which is measured against the screen where these roles are measured against the type.
 * - The gap between **wrapped lines** is always `--space-stack` and no prop can change it: a wrapped
 *   line sitting as far from its neighbour as its items sit from each other stops reading as one group.
 * - `justify="start"` (the default) runs the row from the start edge; `justify="between"` distributes
 *   it end to end, which is the row with a group at each end.
 * - No literal length and no numbered spacing rung appears in the recipe: every value it emits is a
 *   role the token layer already names, so a second brand re-points all of them.
 * - `children` render unmodified, and it needs no JavaScript.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - A cluster that navigates is wrapped in — or wraps — the caller's own `<nav aria-label="…">`.
 *   This component declares no landmark, exactly as `Footer`'s guidance already directs.
 * - The gutter and the vertical band belong to whatever holds it — a `Section`, a `Footer` — and not
 *   to a prop here, or two components own one job.
 *
 * @UXGuidelines
 * - `gap="stack"` is the row whose items belong together, as a form's actions do. `gap="region"`
 *   separates one group from the next; reach for it when the row's items are not a single set.
 * - `justify="between"` needs two groups to distribute. A row of loose items pushed end to end reads
 *   as a gap in the middle rather than as a distribution.
 */
export const Cluster: FunctionComponent<IClusterProps> = ({
  gap,
  justify,
  children,
  testId,
}) => (
  <div className={cluster({ gap, justify })} data-testid={testId}>
    {children}
  </div>
);
