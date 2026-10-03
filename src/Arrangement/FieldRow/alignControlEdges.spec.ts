import { describe, expect, it } from 'vitest';
import { alignControlEdges } from './alignControlEdges';

describe('alignControlEdges', () => {
  it('pads nothing when there is nothing to align', () => {
    expect(alignControlEdges([])).toEqual([]);
  });

  it('leaves a lone item unpadded, whatever its control edge', () => {
    expect(alignControlEdges([{ top: 0, controlEdge: 58 }])).toEqual([0]);
  });

  it('pads every item in a row so each control edge meets the deepest one', () => {
    // A one-line label above a control, a two-line label above a control, and a button: the
    // deepest control edge is the row's alignment line and the others are pushed down to it.
    const paddings = alignControlEdges([
      { top: 0, controlEdge: 58 },
      { top: 0, controlEdge: 82 },
      { top: 0, controlEdge: 40 },
    ]);
    expect(paddings).toEqual([24, 0, 42]);
  });

  it('aligns each wrapped row on its own line, independently of the others', () => {
    const paddings = alignControlEdges([
      { top: 0, controlEdge: 58 },
      { top: 0, controlEdge: 82 },
      { top: 140, controlEdge: 58 },
      { top: 140, controlEdge: 40 },
    ]);
    expect(paddings).toEqual([24, 0, 0, 18]);
  });

  it('treats tops within a fraction of a pixel as one row, so sub-pixel layout never splits one', () => {
    const paddings = alignControlEdges([
      { top: 100, controlEdge: 58 },
      { top: 100.4, controlEdge: 82 },
    ]);
    expect(paddings).toEqual([24, 0]);
  });

  it('keeps the input order in the output, whichever order the rows arrive in', () => {
    const paddings = alignControlEdges([
      { top: 140, controlEdge: 40 },
      { top: 0, controlEdge: 58 },
      { top: 140, controlEdge: 58 },
    ]);
    expect(paddings).toEqual([18, 0, 0]);
  });
});
