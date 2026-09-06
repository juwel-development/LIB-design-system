import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on a plain <div>. Six components hand-write this same utility set and their specs pin
// it as a set, not an order (architecture standard, the import test). `band` is vertical padding,
// never a gap; `split` turns at `lg`, the Rail/DefinitionList threshold. The bound holds the two
// container roles docs/adr/0008's Amendments attest (#97), sized as the guarantees below argue (#99).
const stack = cva('flex', {
  variants: {
    gap: {
      stack: 'gap-[var(--space-stack)]',
      region: 'gap-[var(--space-region)]',
    },
    measure: {
      true: 'max-w-[var(--measure)]',
      false: '',
      action: 'w-[var(--measure-action)] max-w-full mx-auto',
    },
    align: {
      start: 'text-start',
      center: 'text-center',
    },
    direction: {
      column: 'flex-col',
      split: 'flex-col lg:flex-row lg:items-start',
    },
  },
  defaultVariants: { gap: 'stack', measure: false, direction: 'column' },
});

export interface IStackProps extends VariantProps<typeof stack> {
  /** The stacked matter. Rendered unmodified: `Stack` imposes no anatomy. */
  children?: ReactNode;
  testId?: string;
}

/**
 * A vertical arrangement: children in a column, separated by one named space role and optionally
 * bounded by the reading measure or the action column, with optional inherited text alignment.
 * It owns no landmark, heading, band, join, gutter or fill and takes no outer space, so whatever
 * holds it owns the rhythm around it.
 *
 * @Guarantees — enforced on every render
 * - It renders a `div` with no landmark role, no heading and no margin of its own - the one
 *   exception the action column's auto inline margins, which name no space role and take no space:
 *   they only centre the bound column inside a holder wider than the bound.
 * - `gap` selects which space role separates the children: `stack` (the default), the gap between
 *   siblings within one block, or `region`, the gap between groups of blocks. Nothing else — a
 *   spacing neither role expresses is a request for a measurement (docs/adr/0003, docs/adr/0004).
 * - `measure` bounds the element to `--measure`, the reading column; omitted, the column is
 *   unbounded, which is right wherever the children are not running text. It sets no font-size, so
 *   a `ch`-counted measure keeps resolving against inherited body type.
 * - `measure="action"` bounds the element to `--measure-action`, the action column - the width a
 *   stack of full-width controls fills, so they read as one unit and their labels align. The column
 *   asks for that bound as its own definite width, capped at its holder's, so it reaches the bound
 *   even inside a shrink-to-fit frame that sizes from its content - `Cover`'s slot - independently
 *   of what its siblings measure, and its auto inline margins keep it centred in a holder that
 *   stays wider. (#99, correcting #97's reasoning: `w-full` fills a containing slot but cannot
 *   raise a shrink-to-fit ancestor's intrinsic width, so it never guaranteed the bound.) The two
 *   options answer different questions about what the column holds - text or controls - never how
 *   wide it should be (docs/adr/0008, Amendments).
 * - `direction="column"` (the default) never changes axis. `direction="split"` is the same column
 *   turning into a row at and above 64rem, its children aligned to their start edge rather than
 *   stretched. It is the only viewport-dependent behaviour here, and it is named for the job: the
 *   breakpoint is an implementation detail and is not part of the vocabulary.
 * - `align="center"` centres inline text within each receiving text block; `align="start"`
 *   resets it to the logical start edge in LTR or RTL. Omission sets no alignment, so nested
 *   Stacks inherit. Descendants that declare their own alignment retain it.
 * - Alignment never moves or resizes child boxes or changes gap, measure, direction, wrapping or
 *   overflow. A narrower text block centres within itself, not on its holder's axis; an unbroken
 *   word wider than its block is outside the centring guarantee, including in split arrangements.
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
  align,
  children,
  testId,
}) => (
  <div
    className={stack({ gap, measure, direction, align })}
    data-testid={testId}
  >
    {children}
  </div>
);
