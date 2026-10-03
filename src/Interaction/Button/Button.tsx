import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';
import type { Subject } from 'rxjs';

// No `dark:` classes here by design: every colour below is a semantic token whose value is
// re-pointed by the `.dark` class in tokens.css, so one set of classes serves both themes.
// Every variant shares colour motion and the focus ring. Faced controls share their typography,
// radius and label arrangement; plain inherits its surrounding text. Long words wrap within the
// available width without clipping, and faced minimum widths yield to a narrower holder (#119).
const face =
  'font-control text-body text-balance wrap-anywhere rounded-[var(--radius-control)] select-none inline-flex flex-row items-center justify-center gap-2';
const button = cva(
  'transition-colors duration-[var(--motion-duration-color)] cursor-pointer disabled:cursor-not-allowed outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  {
    variants: {
      variant: {
        // The four faced variants share one floor, `--control-min-width`, so a row of them aligns,
        // and the floor yields to a holder narrower than it (#119): `min()` against the holder's
        // width lets the button shrink and its label wrap instead of forcing the holder to overflow.
        // A holder sized to its content (an auto track, a table cell) has no width to yield to, so
        // there the button takes its content width. Measured: a filled button in forced colours has
        // no boundary at all - the UA forces the fill to ButtonFace, which can equal Canvas, and
        // preflight zeroes the border - so the filled variants draw one there and nowhere else.
        primary: `${face} px-4 sm:px-6 py-2 min-w-[min(var(--control-min-width),100%)] bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-disabled disabled:hover:bg-disabled-hover forced-colors:border`,
        secondary: `${face} px-4 sm:px-6 py-2 min-w-[min(var(--control-min-width),100%)] bg-secondary text-secondary-foreground hover:bg-secondary-hover disabled:bg-disabled disabled:hover:bg-disabled-hover forced-colors:border`,
        ghost: `${face} px-2 py-2 min-w-0 bg-transparent text-foreground hover:underline hover:decoration-[length:var(--underline-thickness)] hover:underline-offset-[var(--underline-offset)] disabled:bg-disabled disabled:hover:bg-disabled-hover`,
        // Unfilled and identified by its edge (#119). The edge sits outside the inset, so each inset
        // gives back the edge's pixel and the outlined button is exactly a filled one's height.
        // Disabled follows Input: edge and ink go to the disabled tones and no fill appears.
        outlined: `${face} px-[calc(1rem_-_1px)] sm:px-[calc(1.5rem_-_1px)] py-[calc(0.5rem_-_1px)] min-w-[min(var(--control-min-width),100%)] border border-solid border-secondary bg-transparent text-secondary hover:bg-backing disabled:border-disabled disabled:text-muted disabled:hover:bg-transparent`,
        destructive: `${face} px-4 sm:px-6 py-2 min-w-[min(var(--control-min-width),100%)] bg-error text-error-foreground hover:bg-error-hover disabled:bg-disabled disabled:hover:bg-disabled-hover forced-colors:border`,
        plain:
          'inline p-0 min-w-0 max-w-full whitespace-normal wrap-anywhere bg-transparent [font:inherit] [letter-spacing:inherit] [color:inherit] [text-align:inherit] disabled:text-disabled',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

interface IButtonProps extends VariantProps<typeof button> {
  /** Optional: an icon-only button renders none, and names itself with `ariaLabel` instead. */
  children?: ReactNode;
  onClick$?: Subject<void>;
  disabled?: boolean;
  testId?: string;
  /** Accessible label for icon-only buttons where there is no visible text */
  ariaLabel?: string;
  /** Defaults to `button`. Set `submit` for the button that submits a surrounding form -
   *  a bare <button> inside a form submits it implicitly, which is rarely what is wanted
   *  for the secondary actions sitting next to it. */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Button component for user interactions.
 *
 * @component
 *
 * @Variants
 * - `primary` and `secondary`: the filled actions
 * - `outlined`: the quiet secondary - `secondary` text and edge on an unfilled surface, for an
 *   action beside a primary one that must not compete with it
 * - `destructive`: an action that removes or ends something, filled with the `error` status tone
 *   and inked with `errorForeground`. The tone reinforces words it never replaces: the label, or
 *   the `ariaLabel` of a symbol-only button, must say what the action does
 * - `ghost`: the padded text action with a hover underline and no floor
 *
 * The four faced variants share the control minimum width and inset, so a row of them aligns, and
 * every one of them shrinks and wraps its label where its holder is narrower than that.
 *
 * @UXGuidelines
 * - Use clear, action-oriented text (e.g., "Save" instead of "OK")
 * - Keep button text short; a translated label that runs longer wraps where the layout constrains
 *   it, so the words stay readable rather than overflowing
 * - Use primary buttons for main actions, secondary buttons for alternative actions
 * - `plain` is a plain action (CONTEXT.md): an operable button in the typography and colour of the
 *   text around it, with no face, padding, corner or hover underline of its own. Reach for it where
 *   the action belongs to a line of content - a sortable column header composed with `Icon` - and
 *   for `ghost` where a quiet but still button-shaped action is wanted
 * - Maintain consistent button styling throughout the application
 * - Provide visual feedback on hover/active states
 * - Ensure sufficient touch target size (minimum 44x44px) for mobile users
 * - Position primary actions on the right for multi-button layouts
 * - A submit button's busy state is a label swap ("Send" to "Sending…"), never a spinner: it costs
 *   nothing to render server-side and keeps a Form's `sending` state driver-agnostic
 *
 * @Accessibility
 * - Ensure adequate color contrast (4.5:1 minimum ratio)
 * - Provide focus styles for keyboard navigation: every variant, `plain` included, draws the shared
 *   focus ring and nothing else changes on focus
 * - A disabled `plain` button is told apart by the `disabled` text tone and keeps native disabled semantics
 * - Use appropriate ARIA attributes when needed
 * - Status colour never stands alone: a destructive action is named by its words or symbol
 */
export const Button: FunctionComponent<IButtonProps> = ({
  children,
  disabled,
  testId,
  variant,
  onClick$,
  ariaLabel,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      data-testid={testId}
      className={button({ variant })}
      onClick={() => onClick$?.next()}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};
