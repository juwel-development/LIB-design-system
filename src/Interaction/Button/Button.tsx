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
// The face is in the base for the same reason: an action is what the visitor came to perform, so it
// reads --font-primary, and no variant gets to disagree about which face an action is set in -
// see docs/adr/0004-typography-token-contract.md (issue #90).
const button = cva(
  'font-primary transition-colors duration-[var(--motion-duration-color)] rounded-[var(--radius-control)] py-2 sm:py-2 disabled:bg-disabled disabled:hover:bg-disabled-hover cursor-pointer disabled:cursor-not-allowed select-none text-nowrap inline-flex flex-row items-center justify-center gap-2 outline-focus-ring outline-offset-[var(--focus-ring-offset)] focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)]',
  {
    variants: {
      variant: {
        primary:
          'px-4 sm:px-6 min-w-[var(--control-min-width)] bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary:
          'px-4 sm:px-6 min-w-[var(--control-min-width)] bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        ghost:
          'px-2 min-w-0 bg-transparent text-foreground hover:underline hover:decoration-[length:var(--underline-thickness)] hover:underline-offset-[var(--underline-offset)]',
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
