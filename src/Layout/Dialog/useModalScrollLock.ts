import { type RefObject, useLayoutEffect } from 'react';

type PageScrollLock = {
  overflow: string;
  priority: string;
  dialogs: Set<HTMLDialogElement>;
};

const PAGE_SCROLL_LOCKS = new WeakMap<HTMLElement, PageScrollLock>();

// Mutation observers can report the replacement opening before the previous dialog closing,
// even when the consumer closes first. Share the snapshot until both observers have settled.
const acquireScrollLock = (dialog: HTMLDialogElement): (() => void) => {
  const page = dialog.ownerDocument.documentElement;
  let lock = PAGE_SCROLL_LOCKS.get(page);
  if (lock === undefined) {
    lock = {
      overflow: page.style.getPropertyValue('overflow'),
      priority: page.style.getPropertyPriority('overflow'),
      dialogs: new Set<HTMLDialogElement>(),
    };
    PAGE_SCROLL_LOCKS.set(page, lock);
    page.style.setProperty('overflow', 'hidden');
  }
  const acquired = lock;
  acquired.dialogs.add(dialog);
  return () => {
    acquired.dialogs.delete(dialog);
    if (acquired.dialogs.size === 0) {
      page.style.setProperty('overflow', acquired.overflow, acquired.priority);
      PAGE_SCROLL_LOCKS.delete(page);
    }
  };
};

export const useModalScrollLock = (
  root: RefObject<HTMLDialogElement | undefined>,
): void => {
  useLayoutEffect(() => {
    const dialog = root.current;
    if (!dialog) return;
    let release: (() => void) | undefined;
    const synchronize = () => {
      if (dialog.open && release === undefined) {
        release = acquireScrollLock(dialog);
      } else if (!dialog.open && release !== undefined) {
        release();
        release = undefined;
      }
    };
    synchronize();
    const observer = new MutationObserver(synchronize);
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    return () => {
      observer.disconnect();
      release?.();
    };
  }, [root]);
};
