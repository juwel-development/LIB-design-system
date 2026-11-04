import { useContext, useLayoutEffect } from 'react';
import { ScreenAllocationContext } from './ScreenAllocationContext';

/** Only actual scroll owners register. Delegating and unbounded owners remain inert. */
export const useScreenAllocation = (
  reference: { current: HTMLElement | null },
  enabled: boolean,
  assess: (element: HTMLElement) => boolean,
): void => {
  const allocation = useContext(ScreenAllocationContext);
  useLayoutEffect(() => {
    const element = reference.current;
    if (!allocation || !enabled || !element) return;
    const unregister = allocation.register(() => assess(element));
    const resize =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(allocation.invalidate);
    resize?.observe(element);
    if (element.firstElementChild) resize?.observe(element.firstElementChild);
    return () => {
      resize?.disconnect();
      unregister();
    };
  }, [allocation, reference, enabled, assess]);
};
