/**
 * How many leading chips fit on one line beside the hidden-selection count. Every chip fits
 * when their widths and gaps do; otherwise the count is reserved and the longest prefix that
 * leaves room for it - and the gap before it - is shown, down to a count-only display.
 */
export const fitChips = (
  chipWidths: readonly number[],
  countWidth: number,
  availableWidth: number,
  gap: number,
): number => {
  const gaps = Math.max(chipWidths.length - 1, 0) * gap;
  const total = chipWidths.reduce((sum, width) => sum + width, 0) + gaps;
  if (total <= availableWidth) {
    return chipWidths.length;
  }
  let visible = 0;
  let used = countWidth;
  for (const width of chipWidths) {
    if (used + width + gap > availableWidth) {
      break;
    }
    used += width + gap;
    visible += 1;
  }
  return visible;
};
