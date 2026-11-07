import { cva } from 'class-variance-authority';
import {
  type FunctionComponent,
  type MouseEvent,
  type ReactNode,
  useState,
} from 'react';

// Native details: closed content keeps its nodes but loses its box, accessibility and tab stops in
// every engine. The marker is replaced so its size follows the summary's type and its gap a token.
// The summary holds no element: after a click on a summary's child, WebKit 27.2 ignores Tab.
const collapse = cva([
  'block min-w-0 text-foreground',
  '[&>summary]:flex [&>summary]:w-fit [&>summary]:max-w-full [&>summary]:min-w-0 [&>summary]:items-start [&>summary]:gap-[var(--space-stack)] [&>summary]:list-none [&>summary]:cursor-pointer [&>summary]:wrap-anywhere [&>summary::-webkit-details-marker]:hidden',
  '[&>summary]:rounded-[var(--radius-control)] [&>summary]:font-secondary [&>summary]:font-medium [&>summary]:text-body [&>summary]:text-foreground',
  '[&>summary]:outline-focus-ring [&>summary]:outline-offset-[var(--focus-ring-offset)] [&>summary]:focus-visible:outline [&>summary]:focus-visible:outline-[length:var(--focus-ring-width)]',
  "[&>summary::before]:content-[''] [&>summary::before]:shrink-0 [&>summary::before]:size-[0.5em] [&>summary::before]:mx-[0.25em] [&>summary::before]:mt-[calc((1lh-0.5em)/2)] [&>summary::before]:border-solid [&>summary::before]:border-current [&>summary::before]:border-r-2 [&>summary::before]:border-b-2 [&>summary::before]:-rotate-45",
  '[&[open]>summary::before]:rotate-45',
  '[&>[data-content]]:min-w-0 [&>[data-content]]:pt-[var(--space-stack)]',
]);

export interface ICollapseProps {
  /** The consumer's visible name for the content; it is the disclosure's whole accessible name. */
  summary: string;
  /** Any content. It stays mounted while collapsed, so its values and subscriptions survive. */
  children: ReactNode;
  /** Expanded on mount. Read once: later changes never override the user's own choice. */
  defaultExpanded?: boolean;
  testId?: string;
}

// The summary's click precedes the native toggle for pointer, keyboard and assistive activation.
const keepFocusVisible = (event: MouseEvent<HTMLElement>) => {
  const summary = event.currentTarget;
  const details = summary.parentElement;
  const focused = summary.ownerDocument.activeElement;
  if (
    details instanceof HTMLDetailsElement &&
    details.open &&
    focused !== summary &&
    details.contains(focused)
  )
    summary.focus({ preventScroll: true });
};

/**
 * One named section the user expands and collapses through its persistent summary.
 *
 * @Guarantees
 * - A native disclosure: pointer, Enter and Space toggle it, and the platform announces the
 *   summary's name and expanded state. A visible indicator shows the state; the summary carries
 *   the shared focus ring. It renders no text of its own.
 * - Collapsed by default. Collapsed content takes no height and exposes no accessible content or
 *   tab stop, yet stays mounted: nodes, uncontrolled values and subscriptions survive. Reopening
 *   reveals the same content and restores no earlier focus. Closing with focus inside moves it to
 *   the summary. Instances operate independently.
 * - Content grows with its height; Collapse adds no bound, scrollport or animation, so enclosing
 *   layouts such as a Screen's Pane re-measure and keep owning overflow.
 *
 * @CallerMustEnsure
 * - Word the summary, including any active-filter count, and keep actions out of it.
 * - Reveal collapsed content before focusing or validating a control inside it.
 */
export const Collapse: FunctionComponent<ICollapseProps> = ({
  summary,
  children,
  defaultExpanded,
  testId,
}) => {
  const [isInitiallyExpanded] = useState(defaultExpanded === true);
  return (
    <details
      className={collapse()}
      open={isInitiallyExpanded}
      data-testid={testId}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: summary is the native disclosure control */}
      <summary onClick={keepFocusVisible}>{summary}</summary>
      <div data-content>{children}</div>
    </details>
  );
};
