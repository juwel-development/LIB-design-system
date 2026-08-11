import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Rules are the layout (issue #11). Each Item owns its two-track grid and its hairlines, so the block
// reads as a list of terms from the rules alone - no card, box, fill, icon or bullet. Because the term
// track is a fixed width, per-item grids still line up and no subgrid is needed. Single column below
// 64rem with the term above its description; two baseline-aligned columns at and above it (Tailwind
// `lg` = 64rem). A second `dt` is pinned to the term column so it cannot auto-place into the
// description column and break the row silently. Colours are semantic tokens re-pointed by `.dark`,
// so no class carries a `dark:` prefix.
const item = cva(
  [
    'grid gap-[var(--space-stack)] py-6',
    'border-b border-solid border-border first:border-t',
    'lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-baseline lg:gap-x-12',
    'lg:[&>dt]:col-start-1 lg:[&>dd]:col-start-2 lg:[&>dd]:row-start-1',
  ].join(' '),
);

// The term at the subtitle role - a step below title (docs/adr/0005 fixes the role, no size prop), so
// terms never tie with the heading introducing the list. Foreground, and no measure cap.
const term = cva('font-primary text-subtitle leading-subtitle text-foreground');

// The description at the body role, muted, capped at the reading measure in both layout modes.
const description = cva(
  'font-primary text-body leading-body text-muted max-w-[var(--measure)]',
);

interface IDefinitionListRootProps {
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
  testId,
}) => <dl data-testid={testId}>{children}</dl>;

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
 * - Renders semantic `dl`/`div`/`dt`/`dd`, and works with JavaScript off.
 * - The term is fixed to the subtitle type role and exposes no size prop or variant (docs/adr/0005).
 * - The description is body, muted, and capped at `--measure`; the term carries no measure cap.
 * - A hairline sits above the first item and below every item, in `border`, and the block closes at
 *   the foot. No card, box, fill, icon or bullet - it reads from the rules alone.
 * - Single column below 64rem with the term above its description; two columns at and above it with a
 *   fixed term track and baseline-aligned rows. The switch is a media query, not a prop.
 *
 * @UXGuidelines
 * - Several `Term`s may share one `Description`; keep them inside one `Item` so the term column
 *   stays intact.
 */
export const DefinitionList = {
  Root: DefinitionListRoot,
  Item: DefinitionListItem,
  Term: DefinitionListTerm,
  Description: DefinitionListDescription,
} as const;
