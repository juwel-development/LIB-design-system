import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on a plain <div>, no variants: a Box has nothing to choose. Square corners and no
// shadow are the absence of any radius or shadow utility rather than literal resets - the control
// radius and the floating elevation belong to other roles (docs/adr/0003, docs/adr/0012). `min-w-0` lets
// a flex or grid holder shrink it below its content's min-content width, and `overflow-wrap:
// anywhere` (MultiSelect's idiom) breaks an unbroken name inside it; no overflow is hidden, so
// content with its own sizing contract is never clipped as a stand-in for wrapping.
const box = cva(
  [
    'min-w-0 border border-solid border-border bg-surface text-foreground',
    'p-[var(--space-box-inset)] [overflow-wrap:anywhere]',
  ].join(' '),
);

export interface IBoxProps {
  /** The enclosed matter - a Stack, a heading, facts. Rendered unmodified: Box imposes no anatomy. */
  children?: ReactNode;
  /** Exposes the enclosure as an accessible group with this name. Omit for an ordinary enclosure:
   *  an unnamed Box has no role and is inert to assistive technology. The name is never rendered -
   *  the consumer supplies any visible heading. */
  name?: string;
  testId?: string;
}

/**
 * A bounded content group with a semantic surface, border and inner padding. The consumer owns its
 * content, headings and internal arrangement; Stack arranges, Box encloses.
 *
 * @Guarantees — enforced on every render
 * - It paints `surface`, `foreground` and a one-pixel `border` hairline, with square corners and no
 *   shadow: it borrows neither the control radius nor the floating-layer elevation.
 * - Its inset is the one `--space-box-inset` role on all four sides. There is no padding or size
 *   prop: the theme chooses the value, and re-pointing the role moves the actual inset.
 * - It fills the width its holder allocates, border and padding included, grows with its content
 *   and shrinks inside a narrow holder: no fixed width, height, minimum viewport or aspect. Long
 *   prose and unbroken text wrap inside it rather than truncate, and nothing is clipped.
 * - With `name` it is an accessible group carrying that name; without, a plain `div` with no role,
 *   no label and no landmark. In neither case does it add a focus stop, so controls inside keep
 *   their ordinary keyboard behaviour.
 * - An empty Box is an empty enclosure - surface, border and padding - with no invented wording.
 * - `children` render unmodified, in order, and it needs no JavaScript.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Where `name` is given it matches the visible heading the consumer places inside, since the
 *   component labels the group with that string and cannot reference the heading's id.
 * - Content with its own intrinsic sizing or overflow contract - a table, a figure, a code block -
 *   handles its own overflow; the Box wraps text and never scrolls or clips on its behalf.
 * - Whether an empty group should render at all is the consumer's decision: omit the Box rather
 *   than expecting empty-state text from it.
 *
 * @UXGuidelines
 * - A Box groups related facts that read as one unit. Enclosing every group on a page turns the
 *   boundary into noise; the consumer decides which group earns one.
 */
export const Box: FunctionComponent<IBoxProps> = ({
  children,
  name,
  testId,
}) =>
  // Two renders rather than a conditional aria-label: a label on a role-less div is invalid ARIA,
  // and the lint rule that says so cannot see that the role arrives with the name.
  name === undefined ? (
    <div className={box()} data-testid={testId}>
      {children}
    </div>
  ) : (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset brings the UA's min-inline-size, which stops the box shrinking inside a narrow holder, plus legend naming and a form-disabling model a content group must not carry (MultiSelect's precedent); a div with role=group named by `name` is the whole contract
    <div
      className={box()}
      role={'group'}
      aria-label={name}
      data-testid={testId}
    >
      {children}
    </div>
  );
