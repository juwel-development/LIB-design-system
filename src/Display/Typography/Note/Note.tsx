import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The annotation device: the secondary family at the small role, because docs/adr/0004 fixes
// --font-secondary as the face labels are set in and an annotation labels rather than reads. It
// defaults to `foreground` where Eyebrow defaults to `muted`: Eyebrow inverts the ordinary default
// because its device is defined as muted, and an annotation is not - it is foreground *or* muted -
// so Note follows `P` and keeps the ordinary default. No tracking and no weight: those two
// are what make an Eyebrow. No measure and no margin: the annotation sits in no reading column, and
// the page owns the rhythm around it. Colour is re-pointed by `.dark`, so no variant carries `dark:`.
const note = cva('font-secondary text-small', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

export interface INoteProps extends VariantProps<typeof note> {
  /** The annotation. A `ReactNode` rather than a string, because these lines carry inline links. */
  children: ReactNode;
  testId?: string;
}

/**
 * A short annotation at the small type role in the secondary family — a routing line above a submit
 * button, a privacy line at the point of submission, a line beside a control. Not reading matter:
 * it takes no measure and sits in no reading column, which is what separates it from `Prose.Tail`
 * at the same size, and it carries neither the tracking nor the weight that make an `Eyebrow`.
 *
 * @Guarantees — enforced on every render
 * - Renders a `p`, reading `--font-secondary` and sized by `--text-small`.
 * - `color` selects the `foreground` (default) or `muted` role; nothing else paints text.
 * - Emits no tracking, no font-weight, no measure and no margin under any prop.
 * - Carries no ARIA role and no live region under any prop.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - The device has three carriers and this primitive is only one: use it for an annotation no other
 *   component owns. A form's own message belongs to `Form`'s `note` and a table's to its note cell,
 *   each painted by the component that owns it.
 * - Do **not** put a `Note` in `Form`'s `note` slot: that nests a `p` in a `p` and paints the text
 *   twice. Pass the wording straight to `Form` — the slot takes a `string` today, and once it widens
 *   to a node the links go in there too. `Form` cannot delegate here either — the architecture
 *   standard's one-way dependency rule is why `Prose` restates `P`'s utilities.
 * - Where the annotation is a form's status message, `Form` owns `role="status"`/`role="alert"` by
 *   state; a `Note` announces nothing.
 */
export const Note: FunctionComponent<INoteProps> = ({
  children,
  color,
  testId,
}) => (
  <p className={note({ color })} data-testid={testId}>
    {children}
  </p>
);
