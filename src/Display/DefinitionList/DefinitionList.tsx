import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  createContext,
  type FunctionComponent,
  type ReactNode,
  useContext,
} from 'react';

// Rules are the layout. Each Item owns its grid and its hairlines; the grids line up without a subgrid
// because every item resolves the same tracks. Comfortable keys its two columns on the viewport, as it
// always has; compact makes the dl an inline-size container (Root) and keys them on that, because the
// consumer defect (#123) was a 16rem term track opening inside a one-third panel on a wide screen.
const definitionListRoot = cva('', {
  variants: {
    density: {
      comfortable: '',
      compact: '@container',
    },
  },
  defaultVariants: { density: 'comfortable' },
});

// At `lg` (64rem) or `@sm` (a 24rem container) a second `dt` is pinned to the term column so it cannot
// auto-place into the description column and break the row silently. Compact's tracks are proportions,
// 1:2 as the consumer's reference drew them, so a narrow holder keeps both columns readable until it
// cannot, and then stacks. Colours are semantic tokens re-pointed by `.dark`, so no class carries `dark:`.
const item = cva(
  'grid gap-[var(--space-stack)] border-b border-solid border-border first:border-t',
  {
    variants: {
      density: {
        comfortable: [
          'py-[var(--space-definition-item)]',
          'lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-baseline lg:gap-x-12',
          'lg:[&>dt]:col-start-1 lg:[&>dd]:col-start-2 lg:[&>dd]:row-start-1',
        ].join(' '),
        compact: [
          'py-[var(--space-definition-item-compact)]',
          '@sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @sm:items-baseline @sm:gap-x-[var(--space-region)]',
          '@sm:[&>dt]:col-start-1 @sm:[&>dd]:col-start-2 @sm:[&>dd]:row-start-1',
        ].join(' '),
      },
    },
    defaultVariants: { density: 'comfortable' },
  },
);

// Comfortable: the term at the subtitle role, a step below title (docs/adr/0005 fixes the role, no
// size prop), so terms never tie with the heading introducing the list. Compact: the term is the label
// of a short fact, so it takes the label device Table's header cells carry and is told apart from its
// value by colour - a subtitle-sized term beside a one-word value read as a heading (#123).
const term = cva('', {
  variants: {
    density: {
      comfortable:
        'font-primary text-subtitle leading-subtitle text-foreground',
      compact:
        'font-secondary font-medium text-label tracking-label text-muted wrap-break-word',
    },
  },
  defaultVariants: { density: 'comfortable' },
});

// Comfortable: body, muted. Compact: the value cell's treatment - small with tabular figures, since
// stacked facts compare the way a column does - and wrapping an unbroken token inside a proportional
// track, which can be narrower than one long value. Both capped at the reading measure.
const description = cva('max-w-[var(--measure)]', {
  variants: {
    density: {
      comfortable: 'font-primary text-body leading-body text-muted',
      compact:
        'font-primary text-small text-foreground tabular-nums wrap-break-word',
    },
  },
  defaultVariants: { density: 'comfortable' },
});

type Density = NonNullable<VariantProps<typeof item>['density']>;

// Root resolves the density once and the members read it, so a consumer states it in one place.
const DensityContext = createContext<Density>('comfortable');

interface IDefinitionListRootProps
  extends VariantProps<typeof definitionListRoot> {
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
  children,
  density,
  testId,
}) => {
  const resolved: Density = density ?? 'comfortable';
  return (
    <DensityContext.Provider value={resolved}>
      <dl
        className={definitionListRoot({ density: resolved }) || undefined}
        data-density={resolved}
        data-testid={testId}
      >
        {children}
      </dl>
    </DensityContext.Provider>
  );
};

const DefinitionListItem: FunctionComponent<IDefinitionListItemProps> = ({
  children,
  testId,
}) => (
  <div
    className={item({ density: useContext(DensityContext) })}
    data-testid={testId}
  >
    {children}
  </div>
);

const DefinitionListTerm: FunctionComponent<IDefinitionListTermProps> = ({
  children,
}) => (
  <dt className={term({ density: useContext(DensityContext) })}>{children}</dt>
);

const DefinitionListDescription: FunctionComponent<
  IDefinitionListDescriptionProps
> = ({ children }) => (
  <dd className={description({ density: useContext(DensityContext) })}>
    {children}
  </dd>
);

/**
 * A typeset list of terms and their descriptions, where the rules are the layout. The consumer
 * composes the list from the four members; no member takes a data array. `Root` renders `<dl>`,
 * `Item` the grouping `<div>` (valid inside `<dl>` for exactly this purpose), `Term` a `<dt>`,
 * `Description` a `<dd>`.
 *
 * @Guarantees — enforced on every render
 * - Renders semantic `dl`/`div`/`dt`/`dd` in both densities, and works with JavaScript off. The
 *   resolved density is stated on the `dl` as `data-density`.
 * - `density="comfortable"` (the default) renders exactly as before #123: the term fixed to the
 *   subtitle type role with no size prop or variant (docs/adr/0005), the description body, muted and
 *   capped at `--measure`, single column below 64rem with the term above its description and two
 *   columns at and above it with a fixed term track and baseline-aligned rows. That switch is a
 *   media query, not a prop.
 * - `density="compact"` is the fact-list treatment (#123): the term at the label role in the
 *   secondary family, muted, the way Table labels a column; the description at the small role,
 *   foreground, with tabular figures, still capped at `--measure`. Items pad from
 *   `--space-definition-item-compact` where comfortable pads from `--space-definition-item`. The
 *   two columns key on the width of the list's own container, never the viewport: proportional 1:2
 *   tracks and baseline rows from a 24rem container upward, a single column with the term above its
 *   description below it, so a one-third panel on a wide screen and a content Dialog each get the
 *   arrangement their width allows.
 * - A hairline sits above the first item and below every item, in `border`, in both densities, and
 *   the block closes at the foot. No card, box, fill, icon or bullet - it reads from the rules alone.
 * - No literal spacing rung appears in the recipe: every space it emits is a role the token layer
 *   names, so a second brand re-points all of them.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Several `Term`s may share one `Description`; keep them inside one `Item` so the term column
 *   stays intact.
 * - A compact list sizes from its holder. It must sit where its inline size is given to it - a
 *   block, a grid track, a Dialog's content - and not in a shrink-to-fit frame that sizes from its
 *   content, where an inline-size container contributes no width of its own.
 * - Density changes typography, which is why it is not Table's: Table's compact varies cell padding
 *   only, because its type is already at the small role. Here the comfortable term's subtitle role is
 *   itself the room compact removes. Choose by what the list holds - a glossary reads comfortable,
 *   short facts beside their labels read compact - never by how much air a page wants.
 */
export const DefinitionList = {
  Root: DefinitionListRoot,
  Item: DefinitionListItem,
  Term: DefinitionListTerm,
  Description: DefinitionListDescription,
} as const;
