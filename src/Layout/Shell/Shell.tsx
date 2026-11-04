import { cva, type VariantProps } from 'class-variance-authority';
import {
  type FunctionComponent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const shell = cva(
  'h-dvh min-w-0 overflow-clip grid grid-rows-[auto_minmax(0,1fr)]',
  { variants: { modalScope: { body: '' } } },
);
const shellBody = cva(
  'min-h-0 min-w-0 overflow-auto overscroll-contain p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))] scroll-p-[calc(var(--focus-ring-width)+var(--focus-ring-offset))] outline-focus-ring focus-visible:outline focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[calc(-1*var(--focus-ring-width))]',
  {
    variants: {
      mode: { console: '[&>div]:h-full', page: '[&>div]:min-h-full' },
    },
    defaultVariants: { mode: 'console' },
  },
);

// Geometry is read only to expose a keyboard stop; CSS alone allocates the height.
const useScrollableBody = (body: {
  current: HTMLDivElement | null;
}): boolean => {
  const [isScrollable, setIsScrollable] = useState(true);
  useLayoutEffect(() => {
    const element = body.current;
    if (!element) return;
    const measure = () =>
      setIsScrollable(
        element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth ||
          element === element.ownerDocument.activeElement,
      );
    measure();
    const resize =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    const observeContent = () => {
      resize?.disconnect();
      resize?.observe(element);
      for (const child of element.querySelectorAll('*')) resize?.observe(child);
      measure();
    };
    observeContent();
    const mutations = new MutationObserver(observeContent);
    mutations.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    window.addEventListener('resize', measure);
    element.addEventListener('blur', measure);
    return () => {
      resize?.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', measure);
      element.removeEventListener('blur', measure);
    };
  }, [body]);
  return isScrollable;
};

// Private protocol with Dialog: the marker establishes ancestry; this inherited metric is
// viewport geometry, not a theme token. Layout publication precedes passive modal presentation.
const useModalBoundary = (
  bar: { current: HTMLDivElement | null },
  enabled: boolean,
): void => {
  useLayoutEffect(() => {
    const element = bar.current;
    const frame = element?.parentElement;
    if (!enabled || !element || !frame) return;
    const measure = () =>
      frame.style.setProperty(
        '--shell-bar-bottom',
        `${element.getBoundingClientRect().bottom}px`,
      );
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener('resize', measure);
    frame.addEventListener('modal-frame-measure', measure);
    return () => {
      observer?.disconnect();
      frame.removeEventListener('modal-frame-measure', measure);
      window.removeEventListener('resize', measure);
      frame.style.removeProperty('--shell-bar-bottom');
    };
  }, [bar, enabled]);
};

export interface IShellProps
  extends VariantProps<typeof shellBody>,
    VariantProps<typeof shell> {
  /** Opt into frame-placed descendant Dialogs reserving the bar. Omitted, existing Dialogs
   * retain viewport placement. The bar stays visible, but native modal inertness still applies. */
  modalScope?: VariantProps<typeof shell>['modalScope'];
  /** Consumer-owned top bar; its content determines its height. */
  bar: ReactNode;
  /** Body content; receives the remaining height in console mode. */
  children: ReactNode;
  /** The body scroll group's name, exposed only while overflowing or focused. */
  ariaLabel: string;
  testId?: string;
}

/**
 * A viewport-owning frame with a content-height bar and the remaining height for its body.
 *
 * @Guarantees
 * - `modalScope="body"` publishes the bar boundary before modal presentation and follows bar
 *   resizing. Descendant Dialogs explicitly choose `placement="frame"`; defaults are unchanged.
 *   The library owns the measurement; consumers pass no offsets, selectors or measured lengths.
 * - CSS allocates both tracks, including when bar content wraps. Header is unchanged.
 * - Console (default) passes a finite height to its child; page lets body content grow.
 *   Both keep overflow inside the body, with the bar visible and document still.
 * - Console body scrolling is a reachability fallback for content that cannot fit; bounded
 *   panels normally own their scrolling. Page deliberately scrolls the body as a whole.
 * - Overflow makes the body a named, keyboard-reachable group, never a landmark. Removing
 *   overflow does not relocate focus. Native focus reveal and scroll keys remain intact.
 * - Body padding reserves the shared focus ring's room, with an inset ring on the body itself.
 *
 * @CallerMustEnsure
 * - Place one Shell at the viewport origin, with no outside margins, padding or siblings that
 *   add document extent. This is the application frame, not a nested fullscreen section.
 * - The bar must leave usable body space. An arbitrarily tall bar cannot fit every viewport.
 * - Supply the main landmark inside the body (inside Sidebar.Content when using Sidebar).
 * - Intermediate consumer wrappers must preserve the allocated height for bounded panels;
 *   wrappers with height: 100% and min-height: 0, or display: contents, can pass it through.
 * - Use Sidebar.Root fill in a console; below 64rem its list stacks and the body scrolls.
 * - Name the body in the viewer's language. Content and its panel arrangements remain yours.
 */
export const Shell: FunctionComponent<IShellProps> = ({
  bar,
  children,
  ariaLabel,
  mode,
  modalScope,
  testId,
}) => {
  const body = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useModalBoundary(barRef, modalScope === 'body');
  const isScrollable = useScrollableBody(body);
  return (
    <div
      className={shell({ modalScope })}
      data-modal-scope={modalScope ?? undefined}
      data-testid={testId}
    >
      <div ref={barRef}>{bar}</div>
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: the group and its name are conditional together */}
      <div
        ref={body}
        className={shellBody({ mode })}
        role={isScrollable ? 'group' : undefined}
        aria-label={isScrollable ? ariaLabel : undefined}
        tabIndex={isScrollable ? 0 : undefined}
      >
        <div>{children}</div>
      </div>
    </div>
  );
};
