import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import { DefinitionListConfigurationError } from './DefinitionListConfigurationError';

// The dl is the inline-size container its items measure, and the one place density lands: it pads
// its items from the role of its treatment, so Item, Term and Description carry no density of
// their own and nothing is passed down (docs/agents/standards/design-system-components.md,
// "Compound components": a Root styles the descendants it owns through its one recipe).
const definitionList = cva('@container', {
  variants: {
    density: {
      comfortable: '[&>div]:py-[var(--space-definition-item)]',
      compact: '[&>div]:py-[var(--space-definition-item-compact)]',
    },
  },
  defaultVariants: { density: 'comfortable' },
});

// Rules are the layout; each Item owns its grid and hairlines, and the grids line up because every
// item resolves the same tracks. The all-or-one switch is ColumnLayout's "Holy Albatross": below the
// threshold `--definition-stack` is 100% (term track full, gap none) and `--definition-fit` is 1px;
// at it they are 0, and the style query on the latter pins the dd beside the first, column-one dt.
const item = cva(
  [
    'grid gap-[var(--space-stack)] border-b border-solid border-border first:border-t',
    '[--definition-stack:clamp(0px,(var(--definition-threshold)-100%)*1000000,100%)]',
    '[--definition-fit:clamp(0px,(var(--definition-threshold)-100cqi)*1000000,1px)]',
    'grid-cols-[max(calc((100%-var(--space-region))*var(--definition-term-share)),var(--definition-stack))_minmax(0,1fr)]',
    'gap-x-[max(0px,var(--space-region)-var(--definition-stack))]',
    '[&>dt]:col-start-1 [&>dt]:self-baseline [&>dd]:col-start-1 [&>dd]:self-baseline',
    '[@container_style(--definition-fit:0px)]:[&>dd]:col-start-2',
    '[@container_style(--definition-fit:0px)]:[&>dd]:row-start-1',
  ].join(' '),
);

// The term at the subtitle role - a step below title (docs/adr/0005 fixes the role, no size prop), so
// terms never tie with the heading introducing the list. Foreground, and no measure cap. The term
// is sized like a heading and is not one: with its description it is the reading matter, so both
// take the body face, never the heading face (docs/adr/0004, #120).
const term = cva(
  'font-body text-subtitle leading-subtitle text-foreground wrap-break-word',
);

// The description at the body role, muted, capped at the reading measure in both layout modes.
const description = cva(
  'font-body text-body leading-body text-muted max-w-[var(--measure)] wrap-break-word',
);

/** The name of a CSS custom property, as written in a stylesheet: `--summary-term-min-width`. */
type MinWidthToken = `--${string}`;

/** One of the two columns: its share of the row relative to the other's, and the theme token that
 *  holds its minimum readable width. */
type Column = { weight: number; minWidth: MinWidthToken };

const TERM_COLUMN: Column = {
  weight: 1,
  minWidth: '--definition-term-min-width',
};
const DESCRIPTION_COLUMN: Column = {
  weight: 2,
  minWidth: '--definition-description-min-width',
};

// The ident grammar CSS gives a custom property name, restricted to ASCII so a `var()`, a length,
// a space or a brace can never ride in on the name.
const TOKEN_NAME = /^--[A-Za-z0-9_-]+$/;

const checkColumn = (
  name: 'termColumn' | 'descriptionColumn',
  column: Column,
): Column => {
  if (!Number.isFinite(column.weight) || column.weight <= 0) {
    throw new DefinitionListConfigurationError(
      `${name} needs a positive finite weight (got ${column.weight})`,
    );
  }
  if (!TOKEN_NAME.test(column.minWidth)) {
    throw new DefinitionListConfigurationError(
      `${name} needs a custom-property name such as --summary-term-min-width for minWidth (got ${JSON.stringify(column.minWidth)})`,
    );
  }
  return column;
};

// The documented threshold, `g + max(m_i * S / w_i)` with the region gap as g, left to the browser
// to resolve so a theme re-pointing a minimum - or the gap - moves it with no script in between.
const thresholdOf = (termColumn: Column, descriptionColumn: Column): string => {
  const total = termColumn.weight + descriptionColumn.weight;
  return `calc(var(--space-region) + max(var(${termColumn.minWidth}) * ${total / termColumn.weight}, var(${descriptionColumn.minWidth}) * ${total / descriptionColumn.weight}))`;
};

// React's CSSProperties is closed over known properties; the two custom properties the item
// recipe reads are declared here so the style object stays typed without an assertion.
type DefinitionListRootStyle = CSSProperties & {
  '--definition-threshold': string;
  '--definition-term-share': string;
};

interface IDefinitionListRootProps extends VariantProps<typeof definitionList> {
  /** The term column's share of the row and its minimum readable width, shared by every item.
   *  Defaults to weight `1` and the library's `--definition-term-min-width`; a consumer's own
   *  token is declared in the theme with a nonnegative CSS length, as ColumnLayout's are. */
  termColumn?: Column;
  /** The description column's share and minimum, likewise. Defaults to weight `2` and
   *  `--definition-description-min-width`. */
  descriptionColumn?: Column;
  children?: ReactNode;
  testId?: string;
}

interface IDefinitionListItemProps {
  children?: ReactNode;
  testId?: string;
}

interface IDefinitionListTermProps {
  children?: ReactNode;
}

interface IDefinitionListDescriptionProps {
  children?: ReactNode;
}

const DefinitionListRoot: FunctionComponent<IDefinitionListRootProps> = ({
  density,
  termColumn = TERM_COLUMN,
  descriptionColumn = DESCRIPTION_COLUMN,
  children,
  testId,
}) => {
  const term = checkColumn('termColumn', termColumn);
  const value = checkColumn('descriptionColumn', descriptionColumn);
  const style: DefinitionListRootStyle = {
    '--definition-threshold': thresholdOf(term, value),
    '--definition-term-share': `calc(${term.weight} / ${term.weight + value.weight})`,
  };
  return (
    <dl
      className={definitionList({ density })}
      style={style}
      data-testid={testId}
    >
      {children}
    </dl>
  );
};

const DefinitionListItem: FunctionComponent<IDefinitionListItemProps> = ({
  children,
  testId,
}) => (
  <div className={item()} data-testid={testId}>
    {children}
  </div>
);

const DefinitionListTerm: FunctionComponent<IDefinitionListTermProps> = ({
  children,
}) => <dt className={term()}>{children}</dt>;

const DefinitionListDescription: FunctionComponent<
  IDefinitionListDescriptionProps
> = ({ children }) => <dd className={description()}>{children}</dd>;

/**
 * A typeset list of terms and their descriptions, where the rules are the layout. The consumer
 * composes the list from the four members; no member takes a data array. `Root` renders `<dl>`,
 * `Item` the grouping `<div>` (valid inside `<dl>` for exactly this purpose), `Term` a `<dt>`,
 * `Description` a `<dd>`.
 *
 * @Guarantees — enforced on every render
 * - Renders semantic `dl`/`div`/`dt`/`dd` at either density, and works with JavaScript off: the
 *   arrangement is a stylesheet rule, so nothing is measured, reordered or remounted, and resizing
 *   keeps every descendant's state, focus and keyboard order.
 * - The term is fixed to the subtitle type role and exposes no size prop or variant (docs/adr/0005).
 *   The description is body, muted, and capped at `--measure`; the term carries no measure cap.
 *   Density changes neither: `compact` pads each item from `--space-definition-item-compact` where
 *   `comfortable` (the default) pads from `--space-definition-item`, and nothing else moves.
 * - A hairline sits above the first item and below every item, in `border`, and the block closes at
 *   the foot. No card, box, fill, icon or bullet - it reads from the rules alone.
 * - Every item shares one allocation: the term column and the description column each take a share
 *   of the width left after the region gap in proportion to their weights, `1` and `2` unless the
 *   caller says otherwise. The row holds while both shares are at least their minimum readable
 *   width; the moment one falls short, every item in the list puts its terms above its description
 *   at the full width, separated by the stack role. There is no in-between, and the minimum decides
 *   the switch rather than flooring a width. For region gap g, total weight S and minimums m_i the
 *   row fits at and above `g + max(m_i * S / w_i)`.
 * - The width measured is the list's own, never the viewport, so a narrow list on a wide screen
 *   stacks while a wide one beside it keeps its columns, and a theme that re-points a minimum -
 *   at any scope - moves the threshold with it.
 * - A long phrase or an unbroken value wraps inside its column; no content is truncated, nothing
 *   overlaps, and the list never widens past its holder.
 * - A non-positive or non-finite `weight`, or a `minWidth` that is not a custom-property name,
 *   throws {@link DefinitionListConfigurationError}: a programmer error, raised loud and early.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Several `Term`s may share one `Description`; keep them inside one `Item` so the term column
 *   stays intact.
 * - A `minWidth` token the caller names is declared, on the list or an ancestor of it, as a valid
 *   nonnegative CSS length. The library's own two defaults are declared in every token stylesheet.
 * - The holder gives the list a definite width, as any block, grid track or Dialog content region
 *   does. Inside a shrink-to-fit frame an inline-size container contributes no width of its own.
 * - The two-column pin is a container style query. Where a browser lacks them the list stays in
 *   its stacked, readable arrangement at every width.
 *
 * @UXGuidelines
 * - Choose `compact` for a fact list - short values beside their labels in a panel or a content
 *   Dialog - and `comfortable` for a glossary. The choice is what the list holds, never how much
 *   air a page wants.
 * - A minimum is the width below which a column's content stops being readable - the narrowest
 *   the labels keep their lines - not the width the designer would like; the stack is the readable
 *   fallback. Weights are structural: `1` and `3` say the value is the subject and the term its
 *   label, and a ratio chosen to hit a pixel width is a measurement, which the theme owns.
 */
export const DefinitionList = {
  Root: DefinitionListRoot,
  Item: DefinitionListItem,
  Term: DefinitionListTerm,
  Description: DefinitionListDescription,
} as const;
