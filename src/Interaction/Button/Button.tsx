import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';
import type { Subject } from 'rxjs';

// No `dark:` classes here by design: every colour below is a semantic token whose value is
// re-pointed by the `.dark` class in tokens.css, so one set of classes serves both themes.
// The base holds only what every variant shares: the colour transition (docs/adr/0001) and the
// one focus ring, drawn with outline, colour at rest (docs/adr/0002). The face - content face and
// body size (docs/adr/0004), control radius (docs/adr/0003), padding, disabled fill - is one string
// the three faced variants share verbatim; `plain` is the exception both ADRs' amendments record.
const face =
  'font-control text-body rounded-[var(--radius-control)] py-2 sm:py-2 disabled:bg-disabled disabled:hover:bg-disabled-hover select-none text-nowrap inline-flex flex-row items-center justify-center gap-2';
const button = cva(
  'transition-colors duration-[var(--motion-duration-color)] cursor-pointer disabled:cursor-not-allowed outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  {
    variants: {
      variant: {
        primary: `${face} px-4 sm:px-6 min-w-[var(--control-min-width)] bg-primary text-primary-foreground hover:bg-primary-hover`,
        secondary: `${face} px-4 sm:px-6 min-w-[var(--control-min-width)] bg-secondary text-secondary-foreground hover:bg-secondary-hover`,
        ghost: `${face} px-2 min-w-0 bg-transparent text-foreground hover:underline hover:decoration-[length:var(--underline-thickness)] hover:underline-offset-[var(--underline-offset)]`,
        // Inheritance is stated rather than left to the preflight reset, so the contract is in
        // the recipe and survives a host that ships its own base styles.
        plain:
          'inline p-0 min-w-0 bg-transparent [font:inherit] [letter-spacing:inherit] [color:inherit] [text-align:inherit] disabled:text-disabled',
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
 * @UXGuidelines
 * - Use clear, action-oriented text (e.g., "Save" instead of "OK")
 * - Keep button text concise (1-3 words)
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
