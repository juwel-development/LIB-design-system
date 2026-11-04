const length = (value: string): number => Number.parseFloat(value) || 0;

// A normal line plus its local box insets is usable even when an individual item is very tall.
// This deliberately does not demand the tallest paragraph, wrapped control or image fit in full.
const normalLine = (element: HTMLElement): number => {
  const style = getComputedStyle(element);
  return (
    (length(style.lineHeight) || length(style.fontSize)) +
    length(style.paddingTop) +
    length(style.paddingBottom) +
    length(style.borderTopWidth) +
    length(style.borderBottomWidth)
  );
};

/** Scroll-owner-local budget: one normal content/control line, focus room and pinned chrome.
 * Hidden and nonoverflowing owners accept without adding floors or changing their layout.
 */
export const hasUsableScrollAllocation = (
  viewport: HTMLElement,
  content: HTMLElement,
  pinnedHeight = 0,
): boolean => {
  if (
    !viewport.getClientRects().length ||
    viewport.scrollHeight <= viewport.clientHeight + 1
  )
    return true;
  const controls = Array.from(
    content.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, a[href], [tabindex]',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  const controlLine = controls.reduce(
    (maximum, element) => Math.max(maximum, normalLine(element)),
    0,
  );
  const viewportStyle = getComputedStyle(viewport);
  const contentStyle = getComputedStyle(content);
  const focusRoom =
    length(viewportStyle.paddingTop) +
    length(viewportStyle.paddingBottom) +
    length(contentStyle.paddingTop) +
    length(contentStyle.paddingBottom);
  if (
    controls.length === 0 &&
    content.scrollHeight <=
      length(contentStyle.paddingTop) + length(contentStyle.paddingBottom)
  )
    return true;
  const budget =
    Math.max(
      length(contentStyle.lineHeight) || length(contentStyle.fontSize),
      controlLine,
    ) +
    focusRoom +
    pinnedHeight;
  return viewport.clientHeight + 1 >= Math.min(viewport.scrollHeight, budget);
};
