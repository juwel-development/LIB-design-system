import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, PropsWithChildren } from 'react';
import type { Subject } from 'rxjs';

// No `dark:` classes here by design: every colour below is a semantic token whose value is
// re-pointed by the `.dark` class in tokens.css, so one set of classes serves both themes.
const button = cva(
  'py-2 sm:py-2 disabled:bg-disabled disabled:hover:bg-disabled-hover cursor-pointer disabled:cursor-not-allowed select-none text-nowrap inline-flex flex-row items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
  {
    variants: {
      variant: {
        primary:
          'px-4 sm:px-6 min-w-42 bg-primary text-primary-foreground rounded-lg transition-all duration-200 hover:bg-primary-hover focus-visible:ring-primary-ring',
        secondary:
          'px-4 sm:px-6 min-w-42 bg-secondary text-secondary-foreground rounded-lg transition-all duration-200 hover:bg-secondary-hover focus-visible:ring-secondary-ring',
        ghost:
          'px-2 min-w-0 bg-transparent text-foreground hover:underline transition-all duration-200 focus-visible:ring-ring',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

export interface IButtonProps
  extends VariantProps<typeof button>,
    PropsWithChildren {
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
 *
 * @Accessibility
 * - Ensure adequate color contrast (4.5:1 minimum ratio)
 * - Provide focus styles for keyboard navigation
 * - Use appropriate ARIA attributes when needed
 */
export const Button: FunctionComponent<PropsWithChildren<IButtonProps>> = ({
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
