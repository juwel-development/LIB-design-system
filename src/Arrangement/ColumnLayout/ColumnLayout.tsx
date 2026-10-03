import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  Children,
  type CSSProperties,
  createContext,
  Fragment,
  type FunctionComponent,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
} from 'react';
import { ColumnLayoutCompositionError } from './ColumnLayoutCompositionError';
import { ColumnLayoutConfigurationError } from './ColumnLayoutConfigurationError';

// A wrapping flex row that aligns its tracks to the top. The gap variant also publishes the chosen
// role as `--column-layout-gap`, which the threshold below reads, so the switch and the paint take
// the role from one declaration. Nothing here measures: the arrangement needs no JavaScript.
const columnLayout = cva('flex flex-wrap items-start', {
  variants: {
    gap: {
      stack:
        'gap-[var(--space-stack)] [--column-layout-gap:var(--space-stack)]',
      region:
        'gap-[var(--space-region)] [--column-layout-gap:var(--space-region)]',
    },
  },
  defaultVariants: { gap: 'region' },
});

// The all-or-one switch, after Heydon Pickering's "Holy Albatross". `100%` is the Root's content
// width W; the threshold T is on the Root. At W >= T the basis clamps to 0 and the columns share
// one line, growing by weight over the width left after the gaps - the proportional allocation
// exactly. Below T the difference is amplified past 100% and clamps there, so every column takes
// a line of its own and fills it. The factor is chosen so a 1/64px shortfall, Chrome's layout
// grain, already clamps; `0px` and `100%` are the switch's two states, not measurements.
// `min-w-0` keeps a column's content from widening its track: the content owns its own wrapping.
const columnLayoutColumn = cva(
  'min-w-0 grow-[var(--column-layout-weight)] basis-[clamp(0px,(var(--column-layout-threshold)-100%)*1000000,100%)]',
);

// React's CSSProperties is closed over known properties; the two custom properties the recipes
// read are declared here so the style objects stay typed without an assertion.
type ColumnLayoutRootStyle = CSSProperties & {
  '--column-layout-threshold': string;
};
type ColumnLayoutColumnStyle = CSSProperties & {
  '--column-layout-weight': number;
};

/** The name of a CSS custom property, as written in a stylesheet: `--main-column-min-width`. */
type MinWidthToken = `--${string}`;

type Track = { weight: number; minWidth: MinWidthToken };

// Present only on a Column the Root counted: the Root wraps each direct Column child in it, and a
// Column clears it for its own descendants. Anything else is outside the composition.
const ColumnLayoutContext = createContext<boolean>(false);

// The ident grammar CSS gives a custom property name, restricted to ASCII so a `var()`, a length,
// a space or a brace can never ride in on the name.
const TOKEN_NAME = /^--[A-Za-z0-9_-]+$/;

const toTrack = (
  element: ReactElement<IColumnLayoutColumnProps>,
  index: number,
): Track => {
  const { weight, minWidth } = element.props;
  if (!Number.isFinite(weight) || weight <= 0) {
    throw new ColumnLayoutConfigurationError(
      `column ${index + 1} needs a positive finite weight (got ${weight})`,
    );
  }
  if (!TOKEN_NAME.test(minWidth)) {
    throw new ColumnLayoutConfigurationError(
      `column ${index + 1} needs a custom-property name such as --main-column-min-width for minWidth (got ${JSON.stringify(minWidth)})`,
    );
  }
  return { weight, minWidth };
};

// The documented threshold, `(n - 1) * g + max(m_i * S / w_i)`, left to the browser to resolve
// so a theme re-pointing a minimum - or the gap - moves it with no script in between.
const thresholdOf = (tracks: readonly Track[]): string => {
  const total = tracks.reduce((sum, track) => sum + track.weight, 0);
  const shares = tracks.map(
    (track) => `var(${track.minWidth}) * ${total / track.weight}`,
  );
  return `calc(${tracks.length - 1} * var(--column-layout-gap) + max(${shares.join(', ')}))`;
};

const isFragment = (
  node: ReactNode,
): node is ReactElement<{ children?: ReactNode }> =>
  isValidElement(node) && node.type === Fragment;

export interface IColumnLayoutRootProps
  extends VariantProps<typeof columnLayout> {
  /** The columns, as `ColumnLayout.Column` elements: direct children, or arrays and fragments of
   *  them. A conditional that renders nothing reserves nothing. */
  children?: ReactNode;
  testId?: string;
}

export interface IColumnLayoutColumnProps {
  /** This column's share of the width left after the gaps, relative to its siblings' weights: a
   *  positive finite number. `2` beside `1` is a two-thirds/one-third arrangement. */
  weight: number;
  /** The name of the consumer's custom property holding this column's minimum readable width,
   *  such as `--main-column-min-width`. A token name, never a length or a `var()`: the consumer
   *  declares it in the theme with a nonnegative CSS length. */
  minWidth: MinWidthToken;
  /** The column's content. Rendered unmodified: the column imposes no anatomy. */
  children?: ReactNode;
  testId?: string;
}

const isColumn = (
  node: ReactNode,
): node is ReactElement<IColumnLayoutColumnProps> =>
  isValidElement(node) && node.type === ColumnLayoutColumn;

const collectColumns = (
  children: ReactNode,
): ReactElement<IColumnLayoutColumnProps>[] =>
  Children.toArray(children).flatMap((child) => {
    if (isFragment(child)) {
      return collectColumns(child.props.children);
    }
    return isColumn(child) ? [child] : [];
  });

// Marks every counted Column and nothing else, keeping React's own keys for each position so a
// conditional column appearing later neither remounts its siblings nor moves their focus.
const markColumns = (children: ReactNode): ReactNode =>
  Children.map(children, (child) => {
    if (isFragment(child)) {
      return <Fragment>{markColumns(child.props.children)}</Fragment>;
    }
    if (isColumn(child)) {
      return (
        <ColumnLayoutContext.Provider value={true}>
          {child}
        </ColumnLayoutContext.Provider>
      );
    }
    return child;
  });

const ColumnLayoutRoot: FunctionComponent<IColumnLayoutRootProps> = ({
  gap,
  children,
  testId,
}) => {
  const tracks = collectColumns(children).map(toTrack);
  const style: ColumnLayoutRootStyle | undefined =
    tracks.length === 0
      ? undefined
      : { '--column-layout-threshold': thresholdOf(tracks) };
  return (
    <div className={columnLayout({ gap })} style={style} data-testid={testId}>
      {markColumns(children)}
    </div>
  );
};

const ColumnLayoutColumn: FunctionComponent<IColumnLayoutColumnProps> = ({
  weight,
  children,
  testId,
}) => {
  if (!useContext(ColumnLayoutContext)) {
    throw new ColumnLayoutCompositionError();
  }
  const style: ColumnLayoutColumnStyle = { '--column-layout-weight': weight };
  return (
    <div className={columnLayoutColumn()} style={style} data-testid={testId}>
      <ColumnLayoutContext.Provider value={false}>
        {children}
      </ColumnLayoutContext.Provider>
    </div>
  );
};

/**
 * An arrangement of weighted columns that becomes one column when the space it is given cannot
 * satisfy every column's minimum at the requested proportions. It owns the arrangement and nothing
 * else - no landmark, no band, no join, no gutter, no fill - and takes no outer space, so whatever
 * holds it owns the rhythm around it. `Stack`'s `split` keeps its own viewport-keyed contract; this
 * one answers to the width of its holder (docs/adr/0008, Amendments).
 *
 * @Guarantees — enforced on every render
 * - `Root` renders a `div` with no landmark role, no heading and no margin. Each `Column` is a
 *   `div` directly inside it, in the order written, so DOM, reading and keyboard order are the
 *   order of the children in both arrangements, and no column is ever remounted merely because
 *   the arrangement changed: resizing keeps every column's state and focus.
 * - In the horizontal arrangement the gaps are taken off the Root's content width and the rest is
 *   divided in proportion to the weights: `2`, `1`, `1` is one half and two quarters of it. The
 *   columns align at the top and keep their own heights.
 * - The row holds only while every proportional share is at least its own minimum. The moment one
 *   falls short, every column takes a line of its own and fills the Root's width - a column
 *   narrower than its minimum included: the minimum decides the switch and never floors a width.
 *   There is no in-between: no column wraps alone, no share is clamped, nothing is redistributed to
 *   postpone the switch. For n columns, gap g, total weight S and minimums m_i the row fits at and
 *   above `(n - 1) * g + max(m_i * S / w_i)`.
 * - The space measured is the Root's own width, never the viewport, so two instances on one page
 *   switch independently, and a narrow holder on a wide screen stacks.
 * - Every minimum is read from the theme as a CSS length each time layout runs, so re-pointing a
 *   token - in a theme class, a media query, or a scope around the Root - moves the threshold
 *   with it, and a font-relative length moves it as the type does.
 * - `gap` selects which space role separates the columns, across the row and between the stacked
 *   lines alike: `region` (the default), the gap between groups of blocks, or `stack`, the gap
 *   between siblings within one block. Nothing else.
 * - Only rendered columns count: a conditional that renders nothing reserves neither width nor
 *   gap, a single column fills the width, and an empty Root holds no tracks and no gaps.
 *   Allocations follow every change of columns, weights, gap, holder width or theme.
 * - A column adds no scrolling, truncation or overflow treatment of its own and does not widen its
 *   track for its content: the content keeps whatever wrapping or scrolling contract it has.
 * - Every value it emits is a role the token layer or the consumer's theme already names; the
 *   only literals are the switch's two states.
 * - A non-positive or non-finite `weight`, or a `minWidth` that is not a custom-property name,
 *   throws {@link ColumnLayoutConfigurationError}; a `Column` that is not a direct child of a
 *   `Root` - loose, nested in another column, or reached through a wrapping component - throws
 *   {@link ColumnLayoutCompositionError}. Both are programmer errors, raised loud and early.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Every `minWidth` token is declared, on the Root or an ancestor of it, as a valid nonnegative
 *   CSS length: `24rem`, `20em`, `40ch`, `320px`. A `rem` resolves against the document root, an
 *   `em` or `ch` against the Root's inherited type. A missing or invalid token is not a
 *   responsive configuration: the switch has nothing to compare and the columns size from their
 *   content instead.
 * - The holder gives the Root a definite width, as any block does. Inside a shrink-to-fit frame
 *   there is no width to measure the shares against.
 * - Content that cannot wrap - an unbroken string, a fixed-width control - needs its own overflow
 *   contract, as `Table.Root` has; the column will not widen to hold it.
 *
 * @UXGuidelines
 * - A minimum is the width below which the column's content stops being readable or operable -
 *   the narrowest a comparison table can be scanned, the narrowest a summary's labels keep their
 *   lines - not the width the designer would like. The stack is the readable fallback.
 * - Weights are structural relationships: `2` and `1` say the table is the subject and the summary
 *   its support. A ratio chosen to hit a pixel width is a measurement, and the theme owns those.
 */
export const ColumnLayout = {
  Root: ColumnLayoutRoot,
  Column: ColumnLayoutColumn,
} as const;
