export interface IControlEdge {
  /** Where the item's box starts; items sharing a top sit on one row. */
  top: number;
  /** How far below the item's content top its control's bottom edge sits, before any padding. */
  controlEdge: number;
}

// Half a pixel: items on one flex line share a top exactly, and the tolerance only has to absorb
// the fractional positions a zoomed or sub-pixel layout reports for the same line.
const ROW_TOLERANCE = 0.5;

const isOnRow = (row: number, top: number): boolean =>
  Math.abs(row - top) <= ROW_TOLERANCE;

/**
 * The top padding each item needs so that, on every row, every control's bottom edge meets the
 * deepest one. Rows are found from the tops alone, so the caller hands in the measurements of a
 * finished line layout and gets back one padding per item, in the same order.
 */
export const alignControlEdges = (
  items: readonly IControlEdge[],
): readonly number[] => {
  const rows: number[] = [];
  for (const { top } of items) {
    if (!rows.some((row) => isOnRow(row, top))) {
      rows.push(top);
    }
  }
  const deepest = rows.map((row) =>
    Math.max(
      ...items
        .filter((item) => isOnRow(row, item.top))
        .map((item) => item.controlEdge),
    ),
  );
  return items.map(({ top, controlEdge }) => {
    const rowIndex = rows.findIndex((row) => isOnRow(row, top));
    return (deepest[rowIndex] ?? controlEdge) - controlEdge;
  });
};
