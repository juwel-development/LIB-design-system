import { ScreenAllocation } from 'Layout/ScreenAllocation/ScreenAllocation';
import { ScreenAllocationContext } from 'Layout/ScreenAllocation/ScreenAllocationContext';
import { cva } from 'class-variance-authority';
import {
  type FunctionComponent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const screen = cva(
  'box-border grid h-full min-h-0 min-w-0 px-[var(--gutter)] py-[var(--space-region)] [&>div]:min-w-0 [&>div:last-child]:min-h-0 [&>div:last-child>div]:h-full',
  {
    variants: {
      hasHeading: {
        true: 'grid-rows-[auto_minmax(0,1fr)] gap-[var(--space-region)]',
        false: 'grid-rows-[minmax(0,1fr)]',
      },
    },
  },
);

// Probe only the owned allocation wrapper. Holding its natural footprint during the probe
// prevents temporary bounding from clamping the enclosing scroll owner's position.
const observeAllocation = (
  element: HTMLElement | null,
  heading: HTMLDivElement | null,
  body: HTMLDivElement | null,
  allocation: HTMLDivElement | null,
  participants: ScreenAllocation,
) => {
  if (!element || !body || !allocation || typeof ResizeObserver === 'undefined')
    return;
  let frame = 0;
  const measure = () => {
    frame = 0;
    const styles = getComputedStyle(element);
    const available = Math.max(
      0,
      element.clientHeight -
        Number.parseFloat(styles.paddingTop) -
        Number.parseFloat(styles.paddingBottom) -
        (heading ? heading.offsetHeight + Number.parseFloat(styles.rowGap) : 0),
    );
    body.style.minHeight = `${body.offsetHeight}px`;
    allocation.style.height = `${available}px`;
    const mustRelease =
      allocation.scrollHeight > available + 1 || !participants.accepts();
    allocation.style.height = mustRelease ? 'auto' : '';
    body.style.alignSelf = mustRelease ? 'start' : '';
    body.style.minHeight = '';
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(measure);
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(element);
  if (heading) resize.observe(heading);
  resize.observe(allocation);
  const mutations = new MutationObserver((records) => {
    if (
      records.some(
        (record) => record.target !== body && record.target !== allocation,
      )
    )
      schedule();
  });
  mutations.observe(element, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
  element.addEventListener('load', schedule, true);
  const subscription = participants.invalidated$.subscribe(schedule);
  document.fonts?.addEventListener('loadingdone', schedule);
  measure();
  return () => {
    subscription.unsubscribe();
    document.fonts?.removeEventListener('loadingdone', schedule);
    resize.disconnect();
    mutations.disconnect();
    cancelAnimationFrame(frame);
    element.removeEventListener('load', schedule, true);
  };
};

export interface IScreenProps {
  heading?: ReactNode;
  children: ReactNode;
  testId?: string;
}

/** The active main: one allocated-height child with an optional separate heading.
 * Owns gutter and region spacing, with no scrollport or keyboard stop.
 * Supply one visible H1 in the heading or child, a height-accepting child and an overflow owner.
 * Omit heading (undefined) for no slot or gap; other ReactNode values retain the slot.
 * Use once outside other mains and Panes; fixed content must leave usable body room.
 */
export const Screen: FunctionComponent<IScreenProps> = ({
  heading,
  children,
  testId,
}) => {
  const element = useRef<HTMLElement>(null);
  const headingElement = useRef<HTMLDivElement>(null);
  const bodyElement = useRef<HTMLDivElement>(null);
  const allocationElement = useRef<HTMLDivElement>(null);
  const hasHeading = heading !== undefined;
  const [allocation] = useState(() => new ScreenAllocation());
  useLayoutEffect(
    () =>
      observeAllocation(
        element.current,
        hasHeading ? headingElement.current : null,
        bodyElement.current,
        allocationElement.current,
        allocation,
      ),
    [allocation, hasHeading],
  );
  return (
    <main ref={element} className={screen({ hasHeading })} data-testid={testId}>
      {hasHeading && <div ref={headingElement}>{heading}</div>}
      <div ref={bodyElement}>
        <div ref={allocationElement}>
          <ScreenAllocationContext.Provider value={allocation}>
            {children}
          </ScreenAllocationContext.Provider>
        </div>
      </div>
    </main>
  );
};
