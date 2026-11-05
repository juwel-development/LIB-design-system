import { type RefObject, useLayoutEffect } from 'react';

export const useModalScrollLock = (
  root: RefObject<HTMLDialogElement | undefined>,
): void => {
  useLayoutEffect(() => {
    const dialog = root.current;
    if (!dialog) return;
    const page = dialog.ownerDocument.documentElement;
    let previous: { value: string; priority: string } | undefined;
    const synchronize = () => {
      if (dialog.open && previous === undefined) {
        previous = {
          value: page.style.getPropertyValue('overflow'),
          priority: page.style.getPropertyPriority('overflow'),
        };
        page.style.setProperty('overflow', 'hidden');
      } else if (!dialog.open && previous !== undefined) {
        page.style.setProperty('overflow', previous.value, previous.priority);
        previous = undefined;
      }
    };
    synchronize();
    const observer = new MutationObserver(synchronize);
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    return () => {
      observer.disconnect();
      if (previous !== undefined)
        page.style.setProperty('overflow', previous.value, previous.priority);
    };
  }, [root]);
};
