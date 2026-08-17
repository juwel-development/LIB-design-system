import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Root owns both tracks so the sticky index has this grid as its containing block - the whole guarantee
// rests on Index being a direct child. One column below 64rem, index above content; at `lg` a fixed
// 10rem index track and `minmax(0,1fr)` beside it, with `items-start` giving the index cell the full row
// height to stick within. The three numbers are literals stated in prose (docs/adr/0003), not tokens.
const railRoot = cva(
  [
    'grid gap-[var(--space-stack)]',
    'lg:grid-cols-[10rem_minmax(0,1fr)] lg:items-start lg:gap-x-12',
  ].join(' '),
);

// The index track: sticky with a 1.5rem offset only at and above 64rem; below it the index lies down
// and stays static, so it needs no opaque fill, edge or stacking decision. It is aria-hidden - it
// repeats the section's heading, which lives in the content track. The label role sits on each part.
const railIndex = cva('lg:sticky lg:top-6');

// Both parts at the label role (docs/adr/0005 binds it to no heading), told apart by colour alone. The
// numeral is muted with a hairline under it in `border`, not `rule` - the page-structure weight Section
// joins carry, which a device this small should not draw. The name is foreground. Colours are semantic
// tokens re-pointed by `.dark`, so no class carries a `dark:` prefix.
const railNumeral = cva(
  'block border-b border-solid border-border pb-1 font-secondary text-label tracking-label text-muted',
);

const railName = cva(
  'block pt-1 font-secondary text-label tracking-label text-foreground',
);

interface IRailRootProps {
  children?: ReactNode;
  testId?: string;
}

interface IRailIndexProps {
  /** The filing numeral as a string - `02`, not `2`. Zero-padding is a brand decision, so the caller
   *  writes the exact glyphs. Omitted, the index renders its name alone with no empty numeral element. */
  number?: string;
  children?: ReactNode;
  testId?: string;
}

interface IRailContentProps {
  children?: ReactNode;
  testId?: string;
}

const RailRoot: FunctionComponent<IRailRootProps> = ({ children, testId }) => (
  <div className={railRoot()} data-testid={testId}>
    {children}
  </div>
);

const RailIndex: FunctionComponent<IRailIndexProps> = ({
  number,
  children,
  testId,
}) => (
  <div className={railIndex()} data-testid={testId} aria-hidden="true">
    {number !== undefined && <span className={railNumeral()}>{number}</span>}
    <span className={railName()}>{children}</span>
  </div>
);

const RailContent: FunctionComponent<IRailContentProps> = ({
  children,
  testId,
}) => <div data-testid={testId}>{children}</div>;

/**
 * A section filed beside a sticky index: the section's matter in the wide track and, at and above 64rem,
 * a persistent index in the narrow one. Composed from three members - `Root` renders the two-track grid,
 * `Index` the sticky filing device, `Content` the opaque slot for the matter. `Root` is a `div` with no
 * landmark; the section's heading lives in `Content`, and `Index` repeats it only as a visual marker.
 *
 * @Guarantees — enforced on every render
 * - `Index` persists beside its section at and above 64rem and reads as a filed heading above the text
 *   below it. The switch is a media query, not a prop.
 * - `Index` is decorative to assistive technology (`aria-hidden`): it repeats the heading the content
 *   track carries and does not replace it.
 * - The index numeral is muted with a hairline under it in `border`; the name is foreground; both sit at
 *   the label role. Colours are semantic tokens re-pointed by `.dark`, so no class carries a `dark:` prefix.
 * - `number` is optional: omitted, the index renders the name alone and no empty numeral element.
 * - `Content` renders its children unmodified and sets no measure cap - `Prose` owns the reading measure.
 * - `Content` sets no spacing between those children either - a composed `Stack` owns the gap. The slot
 *   is opaque, so it cannot see the pieces whose rhythm it would set: the same reason it sets no measure.
 * - No margin, max-width, fill, box or vertical rule; no `tabular-nums` or `font-variant-numeric`.
 * - It needs no JavaScript: `position: sticky` is CSS.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - `Rail.Index` is a direct child of `Rail.Root`: `position: sticky` positions against the grid
 *   container, so the index sticks for the height of its row only when Root is its parent.
 * - The section's heading lives in `Rail.Content`. `Index` is aria-hidden and carries no heading, so a
 *   consumer that files a section only in the index leaves it without an accessible name.
 *
 * @UXGuidelines
 * - The heading `Content` is required to carry and the section's matter beneath it are two pieces in one
 *   opaque slot, and the slot separates nothing. Compose the column inside it -
 *   `<Rail.Content><Stack gap="…"><H2>Work</H2>{matter}</Stack></Rail.Content>` - and take the space role
 *   from `Stack`'s own guidance: `Rail` holds no opinion on which of the two roles this position wants.
 * - An index is an information layer, not a layout remedy. Measured on the page that prompted it, the
 *   filing numeral bought 0px of width across three fallback rungs, and the column it sits in closed only
 *   +224px of a 933px deficit - it widens a composition's span, not its content. If a page sags, the
 *   answer is a column; whether that column should also be an index is a separate decision.
 * - Do not place a rail on a hero or a full-bleed section. A bleeding section drops the gutter, so there
 *   is no inset for an index track to stand in, and a poster is not a filed section.
 */
export const Rail = {
  Root: RailRoot,
  Index: RailIndex,
  Content: RailContent,
} as const;
