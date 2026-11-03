import { cva, type VariantProps } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

const callout = cva(
  'min-w-0 border-s-[length:var(--callout-mark-width)] border-solid ps-[var(--space-callout-inset)] text-foreground [overflow-wrap:anywhere] forced-colors:border-s-[CanvasText]',
  {
    variants: {
      tone: {
        warning: 'border-warning',
        info: 'border-info',
        success: 'border-success',
        error: 'border-error',
      },
    },
    defaultVariants: { tone: 'warning' },
  },
);

export interface ICalloutProps extends VariantProps<typeof callout> {
  /** Content and its arrangement belong to the consumer. */
  children?: ReactNode;
  /** Optional accessible group name, never rendered as visible text. Empty means unnamed. */
  name?: string;
  testId?: string;
}

/**
 * A status-toned leading-edge mark beside consumer-owned content, without a surrounding box.
 * @Guarantees
 * - Supports warning (default), info, success and error through the theme's status tones.
 * - The logical leading border follows writing direction; forced colours use CanvasText.
 * - Only the leading edge is inset; no fill, outer space, layout, clipping or fixed size is added.
 * - Named content is a group; unnamed content has no role. Neither adds focus or announcements.
 * - Children keep their order, arrangement and native keyboard behaviour.
 * @CallerMustEnsure
 * - State the status and its consequence in visible text or a named Icon; colour is supplementary.
 * - Keep the optional name consistent with any visible heading. Own any live announcements.
 * - Keep tones at least 3:1 against the surrounding surface; the shared 4.5:1 text floor clears it.
 * - Theme --callout-mark-width is a positive CSS length; --space-callout-inset is nonnegative.
 * - Content with intrinsic sizing owns its overflow; Callout wraps prose but never clips it.
 * @UXGuidelines
 * - Mark a block needing attention; the consumer owns its text, controls and status meaning.
 */
export const Callout: FunctionComponent<ICalloutProps> = ({
  children,
  tone,
  name,
  testId,
}) =>
  name === undefined || name === '' ? (
    <div className={callout({ tone })} data-testid={testId}>
      {children}
    </div>
  ) : (
    // biome-ignore lint/a11y/useSemanticElements: a content group must not acquire fieldset form semantics or intrinsic minimum sizing
    <div
      className={callout({ tone })}
      role="group"
      aria-label={name}
      data-testid={testId}
    >
      {children}
    </div>
  );
