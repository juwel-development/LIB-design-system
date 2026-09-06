import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

const collectionRoot = cva('m-0 list-none p-0');
const collectionItem = cva(
  'py-[var(--space-collection-item)] [&+li]:border-t [&+li]:border-solid [&+li]:border-border',
);

export interface ICollectionRootProps {
  /** Collection.Item children, including mapped items and conditional omissions. */
  children?: ReactNode;
  testId?: string;
}

export interface ICollectionItemProps {
  /** Freely composed content; its typography, arrangement and interaction remain its own. */
  children?: ReactNode;
  testId?: string;
}

const CollectionRoot: FunctionComponent<ICollectionRootProps> = ({
  children,
  testId,
}) => (
  // biome-ignore lint/a11y/noRedundantRoles: list-style:none removes list semantics in Safari/VoiceOver; Checklist establishes this explicit-role precedent.
  <ul className={collectionRoot()} role={'list'} data-testid={testId}>
    {children}
  </ul>
);

const CollectionItem: FunctionComponent<ICollectionItemProps> = ({
  children,
  testId,
}) => (
  <li className={collectionItem()} data-testid={testId}>
    {children}
  </li>
);

/**
 * A vertical group of freely composed items with internal hairlines and open outer edges.
 * The library owns spacing and separation; the consumer owns content, arrangement and interaction.
 *
 * @Guarantees
 * - Root is a semantic list and Item a list item, with no visual markers or horizontal indent.
 * - Each item takes vertical padding from --space-collection-item; adjacent items share one
 *   hairline in the border colour role. Empty and single-item roots have no rules or placeholder.
 * - Children render in supplied order, retaining their own typography and arrangement.
 * - Neither member adds focus stops, interaction, or responsive content rearrangement.
 *
 * @CallerMustEnsure
 * - Supply Collection.Item as Root's rendered children, directly or through fragments and maps.
 * - Compose each item's content with typography, arrangements and controls for the jobs it contains.
 */
export const Collection = {
  Root: CollectionRoot,
  Item: CollectionItem,
} as const;
