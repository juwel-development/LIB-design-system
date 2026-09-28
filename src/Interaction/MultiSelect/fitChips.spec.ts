import { describe, expect, it } from 'vitest';
import { fitChips } from './fitChips';

describe('fitChips', () => {
  it('shows every chip when they all fit, so no count is reserved for nothing', () => {
    expect(fitChips([40, 50, 60], 30, 160, 5)).toBe(3);
  });

  it('shows the leading chips that leave room for the count and the gaps before it', () => {
    // 40 + 5 + 50 + 5 + 30 = 130 fits; adding 60 + 5 does not.
    expect(fitChips([40, 50, 60, 70], 30, 130, 5)).toBe(2);
    expect(fitChips([40, 50, 60, 70], 30, 129, 5)).toBe(1);
  });

  it('falls back to a count-only display when not even the first chip fits beside the count', () => {
    expect(fitChips([120, 50], 30, 100, 5)).toBe(0);
  });

  it('shows nothing for an empty selection', () => {
    expect(fitChips([], 30, 100, 5)).toBe(0);
  });

  it('treats a layout that reports no widths as fitting, so a layout-less document hides nothing', () => {
    expect(fitChips([0, 0, 0], 0, 0, 0)).toBe(3);
  });

  it('never mutates the widths it is handed', () => {
    const widths = Object.freeze([40, 50, 60]);
    expect(fitChips(widths, 30, 100, 5)).toBe(1);
    expect(widths).toEqual([40, 50, 60]);
  });
});
