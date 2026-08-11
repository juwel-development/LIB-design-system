import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The marker is a rule, not a glyph - and this is worth writing down because it outlives this one
// component and there is no ADR carrying it. A checkbox character, dingbat or icon is an *invented
// graphic*, and in a design language built from 1px rules and type an invented graphic is the thing
// that reads as borrowed. So the tick is the structural hairline already on the page, doing one more
// job - and it is unconditional: no prop removes it, reshapes it or swaps it. A future primitive
// needing a marker for some other job has nowhere else to find this stance; it is here on purpose.

// The ul: an unstyled list. `list-none` strips the browser marker (so no bullet is ever drawn) and
// resets its default indent; `role="list"` is restored in the markup because `list-style: none`
// silently drops list semantics in Safari/VoiceOver. Colours are semantic tokens re-pointed by
// `.dark`, so no selector carries a `dark:` class.
const checklistRoot = cva('m-0 list-none p-0');

// The li: body copy in `foreground` - items are content, not annotation, so they are not muted. The
// tick is drawn as a `::before` pseudo-element, the only route to a rule: CSS `::marker` styles just
// colour, font and content, so it cannot draw a line, and a `✓` in the content would be announced on
// every single item. The li is a flex row so the tick sits in a left gutter with the text hanging
// indented beside it; `before:mt-[0.7em]` drops the rule to the optical middle of the first line. Its
// colour is the `rule` role - a table's top rule and a list's tick are one job, a 1px mark at the
// weight where structure becomes visible - its length and thickness the two named tick tokens, no
// literal here. Hairlines sit *between* items in the `border` colour, with no rule above the first or
// below the last, so the list is open at both ends - deliberately unlike a closed list, which closes
// at the foot. The between-item gap reads `--space-stack`, split above and below the hairline so it
// sits centred in the gap.
const checklistItem = cva(
  [
    'flex items-start gap-3 font-primary text-body leading-body text-foreground',
    "before:mt-[0.7em] before:h-[var(--tick-thickness)] before:w-[var(--tick-length)] before:shrink-0 before:bg-[var(--color-rule)] before:content-['']",
    '[&:not(:first-child)]:mt-[var(--space-stack)] [&:not(:first-child)]:border-border [&:not(:first-child)]:border-t [&:not(:first-child)]:border-solid [&:not(:first-child)]:pt-[var(--space-stack)]',
  ].join(' '),
);

interface IChecklistRootProps {
  children?: ReactNode;
  testId?: string;
}

interface IChecklistItemProps {
  children?: ReactNode;
}

const ChecklistRoot: FunctionComponent<IChecklistRootProps> = ({
  children,
  testId,
}) => (
  // biome-ignore lint/a11y/noRedundantRoles: list-style:none silently strips the ul's list semantics in Safari/VoiceOver; the explicit role restores them (issue #13)
  <ul className={checklistRoot()} role={'list'} data-testid={testId}>
    {children}
  </ul>
);

const ChecklistItem: FunctionComponent<IChecklistItemProps> = ({
  children,
}) => <li className={checklistItem()}>{children}</li>;

/**
 * A list of things to confirm or prepare, composed from its two members. Each item is hairline-separated
 * and marked by a short rule sitting in the left indent - never a checkbox, bullet, dingbat or icon.
 * This is a reading device, not a form control: it renders no interactive checkbox and owns no state.
 *
 * @Guarantees — enforced on every render
 * - `Root` renders a `ul` carrying `role="list"`; `Item` renders an `li`. Works with JavaScript off.
 * - The marker is a `::before` rule reading `--color-rule`, `--tick-length` and `--tick-thickness` - no
 *   glyph, character, dingbat, icon or `::marker` content, and nothing is announced on each item.
 * - Items render at the body type role in `foreground`; they are content, not annotation.
 * - Hairlines in `border` separate items, with no rule above the first or below the last, so the list
 *   is open at both ends. The between-item gap reads `--space-stack`.
 */
export const Checklist = {
  Root: ChecklistRoot,
  Item: ChecklistItem,
} as const;
