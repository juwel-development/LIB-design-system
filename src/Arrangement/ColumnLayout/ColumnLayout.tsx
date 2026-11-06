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
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
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
  {
    variants: {
      // The head keeps its content height and the next row takes what is left of a filled
      // column's height; in a content-height column both rows keep their content height.
      hasHead: {
        true: 'grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-[var(--column-layout-gap)]',
        false: '',
      },
    },
    defaultVariants: { hasHead: false },
  },
);
const columnLayoutColumnHead = cva('min-w-0');

// The selecting holder is the box the alternatives are measured against; it takes no space of
// its own. The probes sit out of flow and clipped, so a shortfall never becomes overflow.
const columnLayoutAlternatives = cva('relative min-w-0', {
  variants: { fill: { false: '', true: 'h-full min-h-0' } },
  defaultVariants: { fill: false },
});
const columnLayoutFitProbes = cva(
  'pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden',
);

// One probe per declaration, as wide as that declaration's shortfall: the Column's own switch
// expression against the holder's width less any reserve, so `0px` means the row would hold and
// `1px` that it would stack. Reading the width back is the whole measurement - no length is
// parsed in script.
const columnLayoutFitProbe = cva(
  'h-0 w-[clamp(0px,(var(--column-layout-threshold)-100%+var(--column-layout-reserve))*1000000,1px)]',
  {
    variants: {
      gap: {
        stack: '[--column-layout-gap:var(--space-stack)]',
        region: '[--column-layout-gap:var(--space-region)]',
      },
    },
    defaultVariants: { gap: 'region' },
  },
);

// React's CSSProperties is closed over known properties; the custom properties the recipes
// read are declared here so the style objects stay typed without an assertion.
type ColumnLayoutRootStyle = CSSProperties & {
  '--column-layout-threshold': string;
  '--column-layout-growth-unit': number;
};
type ColumnLayoutFitProbeStyle = CSSProperties & {
  '--column-layout-threshold': string;
  '--column-layout-reserve': string;
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
  /** Optional consumer content at content height above the column's content, spanning this
   *  column only. In a filled column the content below it takes the remaining height. Omitted,
   *  `undefined`, `null` or `false`, the column renders exactly as without it. */
  head?: ReactNode;
  /** The column's content, rendered unmodified. With a `head`, supply one element: one that
   *  accepts the remaining height (a Pane, `Alternatives fill`, `Root fill`, `Tabs.Root fill`)
   *  or content-height content. */
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
  // `data-height-passing` tells Screen's fit check to look through a box to its children: it
  // stretches to its allocation, so only what it holds has a height of its own (#159).
  const row = (
    <div
      className={columnLayout({ gap, fill })}
      style={style}
      data-height-passing={fill || undefined}
      data-testid={testId}
    >
      {markColumns(children)}
    </div>
  );
  return fill ? (
    <div className={columnLayoutFrame()} data-height-passing>
      {row}
    </div>
  ) : (
    row
  );
};

const ColumnLayoutColumn: FunctionComponent<IColumnLayoutColumnProps> = ({
  weight,
  maxWidth,
  head,
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
  const hasHead = head !== undefined && head !== null && head !== false;
  // The head takes a slot of its own ahead of the content, so its arrival or departure never
  // moves the content's position among the column's children and never remounts it.
  return (
    <div
      className={columnLayoutColumn({ hasHead })}
      style={style}
      data-height-passing
      data-testid={testId}
    >
      <ColumnLayoutMembership.Provider value={false}>
        {hasHead && <div className={columnLayoutColumnHead()}>{head}</div>}
        {children}
      </ColumnLayoutMembership.Provider>
    </div>
  );
};

export interface IColumnLayoutAlternativesProps
  extends VariantProps<typeof columnLayoutAlternatives> {
  /** Accept the parent's allocated height and pass it to the mounted arrangement or fallback,
   *  which must accept it in turn (`ColumnLayout.Root fill`, `Tabs.Root fill`). */
  fill?: VariantProps<typeof columnLayoutAlternatives>['fill'];
  /** Mounted when none of the alternatives fits. Omitted, `undefined`, `null` or `false`, the
   *  last declared arrangement stays mounted instead, under its own stacking contract. */
  fallback?: ReactNode;
  /** The alternative arrangements in order of preference, as `ColumnLayout.Root` elements with
   *  at least one column each: direct children, or arrays and fragments of them. A conditional
   *  that renders nothing declares nothing. */
  children?: ReactNode;
  testId?: string;
}

type Arrangement = ReactElement<IColumnLayoutRootProps>;

// What an alternative contributes to selection: the Root to mount and the width its row holds at.
type Declaration = { arrangement: Arrangement; threshold: string };

// The outcome of one measurement, kept with the declarations it was taken for: an index into
// them, or NONE_FITS.
type Selection = { measured: string; firstFit: number };

// A selection change: the choice it mounted and the holder width that asked for it.
type Change = { to: number; width: number };

const NONE_FITS = -1;

// Changes further apart than this are separate events, not one mount answering another: a skipped
// observation is delivered in the next frame, and a content update the frame after.
const FEEDBACK_FRAMES = 3;

// The width the holder loses to `asked`, where the trail shows it: two round trips, to `asked` at
// this width and away at one other width. Only a holder whose width answers to what is mounted
// repeats itself this exactly.
const lossTo = (
  trail: readonly Change[],
  asked: number,
  width: number,
): number | undefined => {
  const [first, away, second, awayAgain] = trail;
  const isRepeated =
    first?.to === asked &&
    second?.to === asked &&
    first.width === width &&
    second.width === width &&
    away?.to === awayAgain?.to &&
    away?.width === awayAgain?.width;
  return isRepeated && awayAgain !== undefined && awayAgain.width !== width
    ? Math.abs(width - awayAgain.width)
    : undefined;
};

const isRoot = (node: ReactNode): node is Arrangement =>
  isValidElement(node) && node.type === ColumnLayoutRoot;

const collectArrangements = (children: ReactNode): Arrangement[] =>
  Children.toArray(children).flatMap((child) => {
    if (isFragment(child)) {
      return collectArrangements(child.props.children);
    }
    if (!isRoot(child)) {
      throw new ColumnLayoutConfigurationError(
        'Alternatives takes ColumnLayout.Root elements only (arrays and fragments are fine; other content or a wrapping component is not)',
      );
    }
    return [child];
  });

const toDeclaration = (
  arrangement: Arrangement,
  index: number,
): Declaration => {
  const tracks = collectColumns(arrangement.props.children).map(toTrack);
  if (tracks.length === 0) {
    throw new ColumnLayoutConfigurationError(
      `alternative ${index + 1} declares no columns, so it has no minimum to fit`,
    );
  }
  return { arrangement, threshold: thresholdOf(tracks) };
};

const probeStyleOf = (
  threshold: string,
  reserve: string,
): ColumnLayoutFitProbeStyle => ({
  '--column-layout-threshold': threshold,
  '--column-layout-reserve': reserve,
});

// A probe is as wide as its declaration's shortfall, so a width of zero is a fit. No declaration
// at all answers NONE_FITS, which is also what "none fits" reads as.
const firstFitOf = (probes: HTMLElement): number =>
  Array.from(probes.children).findIndex(
    (probe) => probe.getBoundingClientRect().width === 0,
  );

// Declaration order is the preference; the fallback and the retained last declaration come after
// every declaration that fits.
const preferenceOf = (firstFit: number): number =>
  firstFit === NONE_FITS ? Number.POSITIVE_INFINITY : firstFit;

const ColumnLayoutAlternatives: FunctionComponent<
  IColumnLayoutAlternativesProps
> = ({ fill, fallback, children, testId }) => {
  const declarations = collectArrangements(children).map(toDeclaration);
  const declared = declarations
    .map(
      ({ arrangement, threshold }) => `${arrangement.props.gap} ${threshold}`,
    )
    .join('\n');
  const probes = useRef<HTMLDivElement>(null);
  const mounted = useRef<ReactNode>(null);
  const [selection, setSelection] = useState<Selection | undefined>(undefined);
  const [reserve, setReserve] = useState(0);

  // The first selection is made before the first paint; from then on a probe changes size only
  // when its declaration's fit flips - on a holder resize or a re-pointed token alike. flushSync
  // commits the new arrangement inside the observation, so no frame paints the outgoing one.
  useLayoutEffect(() => {
    const holder = probes.current;
    if (holder === null) {
      return;
    }
    let selected: number | undefined;
    let trail: readonly Change[] = [];
    const keep = (change: Change): void => {
      const kept = [...trail.slice(-3), change];
      let frames = FEEDBACK_FRAMES;
      const tick = (): void => {
        if (trail !== kept) {
          return;
        }
        frames -= 1;
        if (frames === 0) {
          trail = [];
        } else {
          requestAnimationFrame(tick);
        }
      };
      trail = kept;
      requestAnimationFrame(tick);
    };
    const select = (): void => {
      const asked = firstFitOf(holder);
      if (asked === selected) {
        return;
      }
      const { width } = holder.getBoundingClientRect();
      const lost = lossTo(trail, asked, width);
      if (lost !== undefined) {
        // Hold the loss back from the preferred of the two, and settle on the later declaration.
        setReserve((reserved) => Math.max(reserved, lost));
        trail = [];
        if (
          selected !== undefined &&
          preferenceOf(asked) < preferenceOf(selected)
        ) {
          return;
        }
      }
      keep({ to: asked, width });
      selected = asked;
      setSelection({ measured: declared, firstFit: asked });
    };
    setReserve(0);
    select();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => flushSync(select));
    for (const probe of holder.children) {
      observer.observe(probe);
    }
    return () => {
      trail = [];
      observer.disconnect();
    };
  }, [declared]);

  const hasFallback =
    fallback !== undefined && fallback !== null && fallback !== false;
  // A selection measured for other declarations says nothing about these: what it mounted stays
  // until the effect above has measured them, so no unselected arrangement mounts in between.
  const current = selection?.measured === declared ? selection : undefined;
  const fitting =
    current === undefined
      ? undefined
      : declarations[current.firstFit]?.arrangement;
  const chosen =
    fitting ?? (hasFallback ? undefined : declarations.at(-1)?.arrangement);
  const content: ReactNode =
    current === undefined ? (
      mounted.current
    ) : chosen === undefined ? (
      hasFallback && <Fragment key="fallback">{fallback}</Fragment>
    ) : (
      <ColumnLayoutRoot
        key="arrangement"
        gap={chosen.props.gap}
        fill={chosen.props.fill}
        testId={chosen.props.testId}
      >
        {chosen.props.children}
      </ColumnLayoutRoot>
    );
  useLayoutEffect(() => {
    mounted.current = content;
  });

  // Only a declaration preferred to the mounted one is judged with the reserve: the mounted one
  // and those after it are measured at the width the holder has.
  const reserveOf = (index: number): string =>
    current !== undefined && index < preferenceOf(current.firstFit)
      ? `${reserve}px`
      : '0px';
  return (
    <div
      className={columnLayoutAlternatives({ fill })}
      data-height-passing={fill || undefined}
      data-testid={testId}
    >
      <div ref={probes} aria-hidden="true" className={columnLayoutFitProbes()}>
        {declarations.map(({ arrangement, threshold }, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: a probe's identity is its place in the order of preference
            key={index}
            className={columnLayoutFitProbe({ gap: arrangement.props.gap })}
            style={probeStyleOf(threshold, reserveOf(index))}
          />
        ))}
      </div>
      {content}
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
 * - A Column's optional `head` renders first inside that column, at content height, separated
 *   from the content by the Root's gap role and spanning that column only. In a filled
 *   horizontal column the content takes the height left below it; otherwise both keep their
 *   content height. The head adds no role, name, tab stop or scrolling, and its arrival,
 *   change or removal never remounts the content.
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
 * @Guarantees — `Alternatives`, the consumer's choice between arrangements
 * - Its children are `Root`s in the consumer's order of preference. It mounts the first whose
 *   row would hold at its own width - the same threshold, tokens and gap that Root switches at,
 *   compared by the browser, with equality fitting - also when later ones fit too. Nothing is
 *   ranked, inferred or keyed to the viewport; two instances on a page select independently.
 * - When none fits it mounts `fallback` if one was supplied, and otherwise keeps the last
 *   declared Root, which stacks under its own contract. Selection never floors a width, so it
 *   causes no horizontal overflow. With nothing declared it mounts the fallback, or nothing.
 * - Selection follows the holder's width and every token the thresholds read - a re-pointed
 *   minimum, a space role, a font-relative unit - without a resize, and is committed before the
 *   next paint. Until the first measurement (a server render, the first client render) no
 *   arrangement is mounted. Without layout, as in jsdom, every declaration measures as fitting.
 * - Only the selected arrangement is mounted: no second copy of an area, an id or a control, and
 *   nothing kept hidden. A change that leaves the selection alone touches no content. When the
 *   declarations themselves change, what is mounted stays until the new ones are measured, in
 *   the same update: nothing they do not select is mounted in between.
 * - A holder that loses width to what is mounted in it - a scroll body whose scrollbar shows for
 *   one arrangement only - settles. Once the same two selections have alternated at the same two
 *   widths twice, no more than three frames apart, the later declaration stays and the width lost
 *   is held back from every declaration preferred to the mounted one until the declarations
 *   change: an earlier one returns once it fits with that much to spare. Otherwise nothing is
 *   held back, and a width that merely drops and returns is followed exactly.
 * - On a selection change a column declared in both arrangements under the same React `key`
 *   (unkeyed: the same position) with the same element types inside stays mounted, with its
 *   state and focus. Everything else unmounts; content that returns mounts fresh, and no focus,
 *   text selection, scroll position or local state is cached or restored for it.
 * - It adds no role, name, tab stop, spacing, scrolling or selection request of its own. With
 *   `fill` it passes its parent's allocated height to what it mounts.
 * - A child that is not a `Root` - text, another element, a component wrapping a Root - or a
 *   Root without columns throws {@link ColumnLayoutConfigurationError}. Every declaration is
 *   validated, whether or not it is the one mounted.
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
 *   the stacked fallback. Filling children own their overflow; fixed content must fit the bound,
 *   or - inside Screen - releases the whole content into the enclosing scroll owner.
 * - Under a `head`, supply one child that accepts the remaining height (a Pane, `Root fill`,
 *   `Alternatives fill`, `Tabs.Root fill`) or content-height content. The head is the
 *   consumer's: its wording, controls and any heading level are not supplied by the column.
 * - The holder gives the Root a definite width, as any block does. Inside a shrink-to-fit frame
 *   there is no width to measure the shares against.
 * - Content that cannot wrap - an unbroken string, a fixed-width control - needs its own overflow
 *   contract, as `Table.Root` has; the column will not widen to hold it.
 * - `Root`'s children are `Column`s. Anything else placed beside them is rendered as given but is
 *   not a column: it takes no weight, counts for no gap or threshold, and sits in the row as
 *   content of its own width, which breaks the proportions. Content belongs inside a `Column`.
 * - For `Alternatives`: state that must survive a removal - a draft, the active tab - is kept
 *   by the application and supplied to the fresh mount; Tabs inside an arrangement receive a
 *   valid `active` whenever they mount. An area that should stay mounted carries the same `key`
 *   in each arrangement. With `fill`, the Roots and the fallback accept the height themselves.
 *   A holder whose width answers to the mounted arrangement more than three frames after the
 *   mount, or differently each time, is outside the contract: that dependency is not recognised
 *   and can alternate.
 *
 * @UXGuidelines
 * - A minimum is the width below which the column's content stops being readable or operable -
 *   the narrowest a comparison table can be scanned, the narrowest a summary's labels keep their
 *   lines - not the width the designer would like. The stack is the readable fallback.
 * - Weights are structural relationships: `2` and `1` say the table is the subject and the summary
 *   its support. A ratio chosen to hit a pixel width is a measurement, and the theme owns those.
 * - Alternatives are for one screen arranged differently, not for different screens: declare the
 *   same areas in the same reading order and let the narrower arrangement group some of them,
 *   in `Tabs` for instance. Which areas exist and how they group is the application's decision.
 */
export const ColumnLayout = {
  Root: ColumnLayoutRoot,
  Column: ColumnLayoutColumn,
  Alternatives: ColumnLayoutAlternatives,
} as const;
