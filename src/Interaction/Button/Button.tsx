import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';
import type { Subject } from 'rxjs';

// No `dark:` classes here by design: every colour below is a semantic token whose value is
// re-pointed by the `.dark` class in tokens.css, so one set of classes serves both themes.
// The colour transition is stated once in the base, on the motion token, so no variant can
// disagree with it - see docs/adr/0001-motion-token-contract.md. The one focus ring is in the
// base too: identical across variants, drawn with outline, colour at rest so it never fades in -
// see docs/adr/0002-focus-ring-token-contract.md. The corner is in the base as well, one radius
// token every variant shares, so none can disagree - see docs/adr/0003-radius-token-contract.md.
// The face is in the base for the same reason - see docs/adr/0004-typography-token-contract.md (#90).
// The size is in the base for the same reason, and here it is load-bearing: the recipe fixes
// vertical padding and sets no height, so the font-size is what drives it (docs/adr/0004, #92).
// No `text-nowrap` (#119): the line is broken only where the holder is narrower than the words,
// which is the case that used to overflow, and `text-balance` keeps the two lines it then makes
// of a translated label even rather than leaving one word on the second. No break inside a word:
// `overflow-wrap: break-word` never engages here (the inline-flex text item is sized to its longest
// word) and `anywhere` would let a row squeeze the button to letters, so one word wider than the
// holder stays the consumer's wording to shorten, as it is for every other text in the library.
const button = cva(
  'font-primary text-body text-balance transition-colors duration-[var(--motion-duration-color)] rounded-[var(--radius-control)] py-2 sm:py-2 cursor-pointer disabled:cursor-not-allowed select-none inline-flex flex-row items-center justify-center gap-2 outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-disabled disabled:hover:bg-disabled-hover',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover disabled:bg-disabled disabled:hover:bg-disabled-hover',
        ghost:
          'px-2 min-w-0 bg-transparent text-foreground hover:underline hover:decoration-[length:var(--underline-thickness)] hover:underline-offset-[var(--underline-offset)] disabled:bg-disabled disabled:hover:bg-disabled-hover',
        // The two unfilled variants (#119) are identified by their edge, as Input is: the boundary
        // sits outside the inset, so they share Input's height exactly rather than primary's.
        // Disabled follows Input too - edge and ink go to the disabled tones, no fill appears.
        outline:
          'border border-solid border-control-border bg-transparent text-foreground hover:bg-backing disabled:border-disabled disabled:text-muted disabled:hover:bg-transparent',
        // The hover inverts to the tone instead of tinting with backing: error text on backing
        // measures 4.11:1 in the shipped light theme, under the 4.5:1 text floor, while surface
        // ink on an error fill is the published error-against-surface constraint read backwards.
        destructive:
          'border border-solid border-error bg-transparent text-error hover:bg-error hover:text-surface disabled:border-disabled disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted',
      },
      inline: {
        true: '',
        false: '',
      },
    },
    // Whether the width floor applies at all is structural (docs/adr/0008): a faced action in a
    // table cell or beside a field takes its content's width and the px-3 inset every field
    // control renders, so the two sit flush. ghost never had a floor, so `inline` leaves it alone.
    compoundVariants: [
      {
        variant: ['primary', 'secondary', 'outline', 'destructive'],
        inline: false,
        class: 'px-4 sm:px-6 min-w-[var(--control-min-width)]',
      },
      {
        variant: ['primary', 'secondary', 'outline', 'destructive'],
        inline: true,
        class: 'px-3 min-w-0',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      inline: false,
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
 * - `primary` and `secondary`: the filled actions, floored at the control minimum width so a row
 *   of them aligns
 * - `outline`: the quiet secondary - an unfilled control identified by its `controlBorder` edge,
 *   for actions that should not compete with the primary one
 * - `destructive`: an action that removes or ends something, outlined in the `error` status tone
 *   and filled with it on hover. The tone reinforces words it never replaces: the label, or the
 *   `ariaLabel` of a symbol-only button, must say what the action does
 * - `ghost`: the padded text action with a hover underline and no floor
 * - `inline`: a faced button sized to its content with the field inset, for an action in a table
 *   cell or beside a field. An action set in its surrounding text is a plain action, not this
 *
 * @UXGuidelines
 * - Use clear, action-oriented text (e.g., "Save" instead of "OK")
 * - Keep button text short; a translated label that runs longer wraps where the layout constrains
 *   it, so the words stay readable rather than overflowing
 * - Use primary buttons for main actions, secondary buttons for alternative actions
 * - Maintain consistent button styling throughout the application
 * - Provide visual feedback on hover/active states
 * - Ensure sufficient touch target size (minimum 44x44px) for mobile users
 * - Position primary actions on the right for multi-button layouts
 * - A submit button's busy state is a label swap ("Send" to "Sending…"), never a spinner: it costs
 *   nothing to render server-side and keeps a Form's `sending` state driver-agnostic
 *
 * @Accessibility
 * - Ensure adequate color contrast (4.5:1 minimum ratio)
 * - Provide focus styles for keyboard navigation
 * - Use appropriate ARIA attributes when needed
 * - Status colour never stands alone: a destructive action is named by its words or symbol
 */
export const Button: FunctionComponent<IButtonProps> = ({
  children,
  disabled,
  testId,
  variant,
  inline,
  onClick$,
  ariaLabel,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      data-testid={testId}
      className={button({ variant, inline })}
      onClick={() => onClick$?.next()}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};
