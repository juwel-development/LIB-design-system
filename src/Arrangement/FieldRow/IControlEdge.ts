export interface IControlEdge {
  /** Where the item's box starts; items sharing a top sit on one row. */
  top: number;
  /** How far below the item's content top its control's bottom edge sits, before any padding. */
  controlEdge: number;
}
