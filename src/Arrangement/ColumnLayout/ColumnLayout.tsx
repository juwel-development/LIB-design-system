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
    fill: {
      false: '',
      true: 'h-full min-h-0 content-start [--column-layout-shortfall:clamp(0px,(var(--column-layout-threshold)-100cqi)*1000000,1px)] [&>div]:[@container_style(--column-layout-shortfall:0px)]:h-full [&>div]:[@container_style(--column-layout-shortfall:0px)]:min-h-0',
    },
    gap: {
      stack:
        'gap-[var(--space-stack)] [--column-layout-gap:var(--space-stack)]',
      region:
        'gap-[var(--space-region)] [--column-layout-gap:var(--space-region)]',
    },
  },
  defaultVariants: { gap: 'region', fill: false },
});

// A fill frame supplies the query width without imposing block-size containment. The row's
// registered shortfall resolves against it, so style queries release the columns when stacked.
const columnLayoutFrame = cva(
  'h-full min-h-0 min-w-0 [container-type:inline-size]',
);

// The all-or-one switch, after Heydon Pickering's "Holy Albatross": `100%` is the Root's width W
// and the threshold T sits on the Root, so W >= T clamps the basis to 0 (one line, grown by weight)
// and W < T amplifies the shortfall past 100% (a line each). The factor turns a 1/64px shortfall,
// Chrome's layout grain, into a full switch; `0px` and `100%` are the two states, not measurements.
const columnLayoutColumn = cva(
  'min-w-0 grow-[calc(var(--column-layout-weight)/var(--column-layout-growth-unit))] basis-[clamp(0px,(var(--column-layout-threshold)-100%)*1000000,100%)] max-w-[var(--column-layout-maximum)]',
);

// React's CSSProperties is closed over known properties; the custom properties the recipes
// read are declared here so the style objects stay typed without an assertion.
type ColumnLayoutRootStyle = CSSProperties & {
  '--column-layout-threshold': string;
  '--column-layout-growth-unit': number;
};
type ColumnLayoutColumnStyle = CSSProperties & {
  '--column-layout-weight': number;
  '--column-layout-maximum': string;
};

/** The name of a CSS custom property, as written in a stylesheet: `--main-column-min-width`. */
type WidthToken = `--${string}`;

type Track = { weight: number; minWidth: WidthToken; maxWidth?: WidthToken };

// Granted only to a Column the Root counted: the Root wraps each direct Column child in it, and a
// Column revokes it for its own descendants. Anything else is outside the composition.
const ColumnLayoutMembership = createContext<boolean>(false);

// The ident grammar CSS gives a custom property name, restricted to ASCII so a `var()`, a length,
// a space or a brace can never ride in on the name.
const TOKEN_NAME = /^--[A-Za-z0-9_-]+$/;

const toTrack = (
  element: ReactElement<IColumnLayoutColumnProps>,
  index: number,
): Track => {
  const { weight, minWidth, maxWidth } = element.props;
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
  if (maxWidth !== undefined && !TOKEN_NAME.test(maxWidth)) {
    throw new ColumnLayoutConfigurationError(
      `column ${index + 1} needs a custom-property name such as --support-column-max-width for maxWidth (got ${JSON.stringify(maxWidth)})`,
    );
  }
  return { weight, minWidth, maxWidth };
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

// Flex factors below one leave surplus unallocated, even after other columns freeze at caps.
const growthUnitOf = (tracks: readonly Track[]): number =>
  tracks.some((track) => track.maxWidth !== undefined)
    ? Math.min(1, ...tracks.map((track) => track.weight))
    : 1;

const isFragment = (
  node: ReactNode,
): node is ReactElement<{ children?: ReactNode }> =>
  isValidElement(node) && node.type === Fragment;

export interface IColumnLayoutRootProps
  extends VariantProps<typeof columnLayout> {
  /** Accept the parent's allocated height and pass it to horizontal columns. Unsized parents
   *  and stacked columns retain content height; the holder owns stacked overflow. */
  fill?: VariantProps<typeof columnLayout>['fill'];
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
  minWidth: WidthToken;
  /** Optional horizontal cap, named by a theme custom property. Stacked columns ignore it.
   * The theme must supply a nonnegative CSS length at least as large as minWidth; resolved
   * lengths are not read or validated by the component. */
  maxWidth?: WidthToken;
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
        <ColumnLayoutMembership.Provider value={true}>
          {child}
        </ColumnLayoutMembership.Provider>
      );
    }
    return child;
  });

const ColumnLayoutRoot: FunctionComponent<IColumnLayoutRootProps> = ({
  gap,
  fill,
  children,
  testId,
}) => {
  const tracks = collectColumns(children).map(toTrack);
  const style: ColumnLayoutRootStyle | undefined =
    tracks.length === 0
      ? undefined
      : {
          '--column-layout-threshold': thresholdOf(tracks),
          '--column-layout-growth-unit': growthUnitOf(tracks),
        };
  const row = (
    <div
      className={columnLayout({ gap, fill })}
      style={style}
      data-testid={testId}
    >
      {markColumns(children)}
    </div>
  );
  return fill ? <div className={columnLayoutFrame()}>{row}</div> : row;
};

const ColumnLayoutColumn: FunctionComponent<IColumnLayoutColumnProps> = ({
  weight,
  maxWidth,
  children,
  testId,
}) => {
  const isCounted = useContext(ColumnLayoutMembership);
  if (!isCounted) {
    throw new ColumnLayoutCompositionError();
  }
  const style: ColumnLayoutColumnStyle = {
    '--column-layout-weight': weight,
    '--column-layout-maximum':
      maxWidth === undefined
        ? 'none'
        : `max(var(${maxWidth}), clamp(0px, (var(--column-layout-threshold) - 100%) * 1000000, 100%))`,
  };
  return (
    <div className={columnLayoutColumn()} style={style} data-testid={testId}>
      <ColumnLayoutMembership.Provider value={false}>
        {children}
      </ColumnLayoutMembership.Provider>
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
 * - `Root` renders plain containers with no landmark role, no heading and no margin. Each
 *   `Column` is a `div` directly inside the row, so DOM, reading and keyboard order are the
 *   order of the children in both arrangements, and no column is ever remounted merely because
 *   the arrangement changed: resizing keeps every column's state and focus.
 * - In the horizontal arrangement the gaps are taken off the Root's content width and the rest is
 *   divided in proportion to the weights: `2`, `1`, `1` is one half and two quarters of it. The
 *   columns align at the top and keep their own heights by default (`fill={false}`). Optional
 *   maximums cap each allocation and redistribute surplus by weight among columns still able
 *   to grow. If all are capped, unused width stays at the trailing edge with unchanged gaps.
 * - With `fill`, Root accepts its parent's allocated height and every horizontal column takes
 *   that height, bounding a filling Pane, Table or ScrollContainer. An internal inline-size
 *   frame supplies the width query; columns remain direct children of the row.
 * - In an unsized parent, `fill` invents no bound: columns retain content height. When stacked,
 *   columns return to content height and the holder owns scrolling. No column scrolls itself.
 * - The row holds only while every proportional share is at least its own minimum. The moment one
 *   falls short, every column takes a line of its own and fills the Root's width - a column
 *   narrower than its minimum included: the minimum decides the switch and never floors a width.
 *   There is no in-between: no column wraps alone. Caps and redistribution never postpone
 *   the switch; stacked columns ignore their maximums. For n columns, gap g, total weight S and
 *   minimums m_i the row fits at and above `(n - 1) * g + max(m_i * S / w_i)`.
 * - The space measured is the Root's own width, never the viewport, so two instances on one page
 *   switch independently, and a narrow holder on a wide screen stacks.
 * - Every bound is read from the theme as a CSS length each time layout runs, so re-pointing a
 *   token - in a theme class, a media query, or a scope around the Root - updates allocation.
 *   Minimums move the threshold; maximums change caps. Font-relative bounds follow the type.
 * - `gap` selects which space role separates the columns, across the row and between the stacked
 *   lines alike: `region` (the default), the gap between groups of blocks, or `stack`, the gap
 *   between siblings within one block. Nothing else.
 * - Only rendered columns count: a conditional that renders nothing reserves neither width nor
 *   gap, a single uncapped column fills the width, and an empty Root holds no tracks and no gaps.
 *   Allocations follow every change of columns, weights, gap, holder width or theme.
 * - A column adds no scrolling, truncation or overflow treatment of its own and does not widen its
 *   track for its content: the content keeps whatever wrapping or scrolling contract it has.
 * - Every value it emits is a role the token layer or the consumer's theme already names; the
 *   only literals are the switch's two states.
 * - A non-positive or non-finite `weight`, or a bound that is not a custom-property name,
 *   throws {@link ColumnLayoutConfigurationError}; a `Column` that is not a direct child of a
 *   `Root` - loose, nested in another column, or reached through a wrapping component - throws
 *   {@link ColumnLayoutCompositionError}. Both are programmer errors, raised loud and early.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Every `minWidth` and supplied `maxWidth` token is declared, on the Root or an ancestor of it,
 *   as a valid nonnegative CSS length: `24rem`, `20em`, `40ch`, `320px`. A `rem` resolves against
 *   the document root, an `em` or `ch` against the Root's inherited type. Missing or invalid
 *   bounds are outside this contract and can invalidate the switch or cap.
 * - Maximums must be at least their column's minimum in every scope and responsive state.
 *   Percentages are outside the contract. Resolved lengths are not read by the component;
 *   maximum below minimum has no guaranteed runtime exception. A valid maximum below the
 *   original share at the threshold applies immediately, with its surplus redistributed.
 * - With `fill`, the holder supplies a definite height to bound content and owns overflow for
 *   the stacked fallback. Filling children own their overflow; fixed content must fit the bound.
 * - The holder gives the Root a definite width, as any block does. Inside a shrink-to-fit frame
 *   there is no width to measure the shares against.
 * - Content that cannot wrap - an unbroken string, a fixed-width control - needs its own overflow
 *   contract, as `Table.Root` has; the column will not widen to hold it.
 * - `Root`'s children are `Column`s. Anything else placed beside them is rendered as given but is
 *   not a column: it takes no weight, counts for no gap or threshold, and sits in the row as
 *   content of its own width, which breaks the proportions. Content belongs inside a `Column`.
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
