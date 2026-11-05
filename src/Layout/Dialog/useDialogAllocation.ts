import { type RefObject, useLayoutEffect, useState } from 'react';

const length = (value: string): number => Number.parseFloat(value) || 0;
const edges = (style: CSSStyleDeclaration): number =>
  length(style.paddingTop) +
  length(style.paddingBottom) +
  length(style.borderTopWidth) +
  length(style.borderBottomWidth);
const margins = (element: Element): number => {
  const style = getComputedStyle(element);
  return length(style.marginTop) + length(style.marginBottom);
};

// Measure semantic content at its current width, never by temporarily rebounding fallback content.
// A table needs its caption, header and one complete row; surrounding fixed siblings keep their height.
const minimumHeight = (element: Element): number => {
  const style = getComputedStyle(element);
  if (style.display === 'none' || style.position === 'absolute') return 0;
  if (element.matches('table')) {
    const fixed = Array.from(element.children)
      .filter((child) => child.matches('caption, thead'))
      .reduce(
        (height, child) => height + child.getBoundingClientRect().height,
        0,
      );
    const row = Math.max(
      0,
      ...Array.from(element.querySelectorAll('tbody>tr')).map(
        (child) => child.getBoundingClientRect().height,
      ),
    );
    return fixed + row;
  }
  if (element.querySelector('table')) {
    const children = Array.from(element.children);
    return (
      edges(style) +
      Math.max(0, children.length - 1) * length(style.rowGap) +
      children.reduce(
        (height, child) =>
          height +
          margins(child) +
          (child.matches('table') || child.querySelector('table')
            ? minimumHeight(child)
            : child.getBoundingClientRect().height),
        0,
      )
    );
  }
  const item = Math.max(
    length(style.lineHeight) || length(style.fontSize),
    ...Array.from(
      element.querySelectorAll(
        'button, input, select, textarea, [role="button"]',
      ),
    ).map((child) => child.getBoundingClientRect().height),
  );
  const ring =
    length(style.getPropertyValue('--focus-ring-width')) +
    length(style.getPropertyValue('--focus-ring-offset'));
  return edges(style) + item + 2 * ring;
};

export const useDialogAllocation = (
  root: RefObject<HTMLDialogElement | undefined>,
): boolean => {
  const [isUnusable, setIsUnusable] = useState(false);
  useLayoutEffect(() => {
    const dialog = root.current;
    if (!dialog) return;
    const measure = () => {
      if (!dialog.open) return;
      const style = getComputedStyle(dialog);
      const available =
        style.maxHeight === 'none'
          ? length(style.height)
          : length(style.maxHeight);
      const required = Array.from(dialog.children).reduce(
        (height, child) =>
          height +
          margins(child) +
          (child.getAttribute('data-dialog-member') === 'content'
            ? minimumHeight(child)
            : child.getBoundingClientRect().height),
        edges(style),
      );
      setIsUnusable(available < required);
    };
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    const observe = () => {
      observer?.disconnect();
      observer?.observe(dialog);
      for (const child of dialog.querySelectorAll('*'))
        observer?.observe(child);
      measure();
    };
    observe();
    const mutations = new MutationObserver(observe);
    mutations.observe(dialog, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['open'],
    });
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [root]);
  // Releasing or restoring the allocation can move the focused control outside the scrollport.
  // Reveal it after that layout commit, retaining the same element and native keyboard behavior.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the allocation transition is the trigger
  useLayoutEffect(() => {
    const dialog = root.current;
    const focused = dialog?.ownerDocument.activeElement;
    if (
      dialog?.open &&
      focused instanceof HTMLElement &&
      dialog.contains(focused)
    ) {
      focused.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }, [root, isUnusable]);
  return isUnusable;
};
