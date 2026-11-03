import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The annotation uses the secondary family (docs/adr/0004). Its default weight is inherited;
// strong emphasis changes weight only. The enclosing arrangement owns measure and spacing.
const note = cva('font-secondary text-small', {
  variants: {
    emphasis: { regular: '', strong: 'font-strong' },
    // Inline containment removes this text's intrinsic width from automatic table sizing (#132).
    // The block still fills its allocated width; only its own text is clipped, never its siblings.
    truncate: { true: 'min-w-0 truncate [contain:inline-size]', false: '' },
    color: {
      foreground: 'text-foreground',
      muted: 'text-muted',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      info: 'text-info',
    },
  },
  defaultVariants: {
    color: 'foreground',
    truncate: false,
    emphasis: 'regular',
  },
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
 * at the same size. It carries no tracking and inherits weight unless emphasis is requested.
 *
 * @Guarantees — enforced on every render
 * - Renders a `p`, reading `--font-secondary` and sized by `--text-small`.
 * - `color` selects `foreground` (default), `muted`, `success`, `warning`, `error` or `info`;
 *   nothing else paints text. A status tone changes colour only.
 * - Emits no tracking, no measure and no margin under any prop.
 * - Carries no ARIA role and no live region under any prop.
 * - `truncate` opts into one line with an ellipsis at the inline end, following inherited writing
 *   direction. The complete text stays in the DOM and accessibility tree. Omitted or false wraps
 *   as before. Marked text can shrink inside ordinary and allocated Table cells.
 * - `emphasis="strong"` reads `--font-weight-strong` without changing size, family or line height.
 *   This is visual only: no `strong` element, importance semantics or live announcement is added.
 *   Omitted or `regular` leaves weight inherited, exactly as before.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Communicate state in words or an accessible name; weight alone must never carry a state.
 * - Allocate a width through the enclosing layout: truncated text does not size its holder.
 * - Make the full wording reachable to sighted readers, for example by opening the item. Never
 *   truncate essential content without that path, or put links, controls or line breaks inside
 *   truncated text; use text and noninteractive inline phrasing only. No tooltip is added.
 * - The device has three carriers and this primitive is only one: use it for an annotation no other
 *   component owns. A form's own message belongs to `Form`'s `note` and a table's to its note cell,
 *   each painted by the component that owns it.
 * - Do **not** put a `Note` in `Form`'s `note` slot: that nests a `p` in a `p` and paints the text
 *   twice. The slot takes a node, so pass the wording straight to `Form` and let the links ride
 *   inside it — inline content only, never a block. `Form` cannot delegate here either — the
 *   architecture standard's one-way dependency rule is why `Prose` restates `P`'s utilities.
 * - Where the annotation is a form's status message, `Form` owns `role="status"`/`role="alert"` by
 *   state; a `Note` announces nothing.
 * - Status-toned content communicates its status without relying on colour. The caller owns any
 *   announcement behavior required when that status changes.
 */
export const Note: FunctionComponent<INoteProps> = ({
  children,
  color,
  emphasis,
  truncate,
  testId,
}) => (
  <p className={note({ color, emphasis, truncate })} data-testid={testId}>
    {children}
  </p>
);
