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
  'box-border grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-[var(--space-region)] px-[var(--gutter)] py-[var(--space-region)] [&>div]:min-w-0 [&>div:last-child]:min-h-0 [&>div:last-child>div]:h-full',
);

// Probe only the owned allocation wrapper. Holding its natural footprint during the probe
// prevents temporary bounding from clamping the enclosing scroll owner's position.
const observeAllocation = (
  element: HTMLElement | null,
  participants: ScreenAllocation,
) => {
  if (!element || typeof ResizeObserver === 'undefined') return;
  const heading = element.firstElementChild;
  const body = element.lastElementChild;
  const allocation = body?.firstElementChild;
  if (
    !(heading instanceof HTMLElement) ||
    !(body instanceof HTMLElement) ||
    !(allocation instanceof HTMLElement)
  )
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
        heading.offsetHeight -
        Number.parseFloat(styles.rowGap),
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
  resize.observe(heading);
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
  heading: ReactNode;
  children: ReactNode;
  testId?: string;
}

/** The active main: a content-height heading above one allocated-height child.
 * Owns gutter and region spacing, with no scrollport or keyboard stop.
 * Supply the H1, a height-accepting child, and an enclosing overflow owner.
 * Use once outside other mains and Panes; fixed content must leave usable body room.
 */
export const Screen: FunctionComponent<IScreenProps> = ({
  heading,
  children,
  testId,
}) => {
  const element = useRef<HTMLElement>(null);
  const [allocation] = useState(() => new ScreenAllocation());
  useLayoutEffect(
    () => observeAllocation(element.current, allocation),
    [allocation],
  );
  return (
    <main ref={element} className={screen()} data-testid={testId}>
      <div>{heading}</div>
      <div>
        <div>
          <ScreenAllocationContext.Provider value={allocation}>
            {children}
          </ScreenAllocationContext.Provider>
        </div>
      </div>
    </main>
  );
};
