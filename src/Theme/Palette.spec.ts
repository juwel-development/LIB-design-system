import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dark, light } from './Palette';
import { renderTokens } from './renderTokens';

const tokensCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'tokens.css'),
  'utf8',
);

const relativeLuminance = (hex: string): number => {
  const channel = (offset: number): number => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

const contrastRatio = (a: string, b: string): number => {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

describe('Palette', () => {
  it('keeps tokens.css in sync with the palette', () => {
    // tokens.css is generated. If this fails, run `npm run build:tokens`.
    expect(tokensCss).toBe(renderTokens());
  });

  it('defines every role in both themes, so no component needs a dark: fallback', () => {
    expect(Object.keys(dark)).toEqual(Object.keys(light));
  });

  it('names roles rather than shades', () => {
    for (const name of Object.keys(light)) {
      expect(name).not.toMatch(/\d/);
    }
  });

  it('carries a distinct value per theme where the theme is meant to differ', () => {
    // Surface and foreground inverting is the minimum a dark theme has to do; if these ever
    // match, the .dark class is decorative and the theme is not actually switching.
    expect(dark.surface).not.toBe(light.surface);
    expect(dark.foreground).not.toBe(light.foreground);
  });

  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)(
    'keeps the focus ring at least 3:1 against surface in the %s theme (WCAG 2.2 SC 1.4.11)',
    (_theme, tokens) => {
      expect(
        contrastRatio(tokens.focusRing, tokens.surface),
      ).toBeGreaterThanOrEqual(3);
    },
  );

  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)(
    'keeps the control border at least 3:1 against surface in the %s theme (WCAG 2.2 SC 1.4.11)',
    (_theme, tokens) => {
      // controlBorder is a transparent control's only boundary, so it carries the same
      // 3:1-against-surface floor the focus ring does - it cannot borrow border's 1.23:1 hairline.
      expect(
        contrastRatio(tokens.controlBorder, tokens.surface),
      ).toBeGreaterThanOrEqual(3);
    },
  );

  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)(
    'keeps the link colour at least 4.5:1 against surface in the %s theme (WCAG 2.2 SC 1.4.3)',
    (_theme, tokens) => {
      // A prose link is told apart by its underline, never by hue, so the link colour answers to the
      // text threshold (4.5:1) rather than the 3:1 the ring and control border take. See ADR 0006.
      expect(contrastRatio(tokens.link, tokens.surface)).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)(
    'keeps the table rule at least 3:1 against surface in the %s theme (WCAG 2.2 SC 1.4.11)',
    (_theme, tokens) => {
      // `rule` is the heavier top line that makes a block read as a table; a mid-neutral, lighter
      // than controlBorder and heavier than border's 1.23:1 hairline, so it carries the same
      // 3:1-against-surface floor rather than border's hairline threshold.
      expect(contrastRatio(tokens.rule, tokens.surface)).toBeGreaterThanOrEqual(
        3,
      );
    },
  );

  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)(
    'keeps the backing plate at least 4.5:1 against foreground in the %s theme (WCAG 2.2 SC 1.4.3)',
    (_theme, tokens) => {
      // A failed image renders its alt text on `backing`, so the plate answers to the text threshold
      // (4.5:1) against `foreground` - which keeps it near `surface` rather than a mid grey.
      expect(
        contrastRatio(tokens.backing, tokens.foreground),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('keeps the rule a mid-neutral between the border hairline and the control edge', () => {
    // The rule reads heavier than the row dividers but must not box like a control edge. Assert the
    // ordering per theme rather than pinning the hex, so a re-theme keeps the relationship.
    for (const tokens of [light, dark]) {
      expect(contrastRatio(tokens.rule, tokens.surface)).toBeGreaterThan(
        contrastRatio(tokens.border, tokens.surface),
      );
      expect(contrastRatio(tokens.rule, tokens.surface)).toBeLessThan(
        contrastRatio(tokens.controlBorder, tokens.surface),
      );
    }
  });

  it('uses plain hex values the stylesheet can consume directly', () => {
    for (const tokens of [light, dark]) {
      for (const value of Object.values(tokens)) {
        expect(value).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});
