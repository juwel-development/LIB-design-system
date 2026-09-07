import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dark, light } from './Palette';
import {
  renderDarkTokens,
  renderLightTokens,
  renderTokens,
} from './renderTokens';

const readSrc = (file: string): string =>
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', file),
    'utf8',
  );

const tokensCss = readSrc('tokens.css');

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

/* Depletion's color-mix(in oklab, …) colours exist only in the browser; to prove the shipped
   palettes keep every one at 3:1 (docs/adr/0010), the mix is replayed here: hex → linear sRGB →
   OKLab (Björn Ottosson's reference matrices, the ones CSS Color 4 specifies), lerp, and back to
   linear sRGB - the form WCAG relative luminance is defined on, so no hex round-trip is needed. */
const toLinearRgb = (hex: string): [number, number, number] => {
  const channel = (offset: number): number => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return [channel(1), channel(3), channel(5)];
};

const toOklab = (hex: string): [number, number, number] => {
  const [r, g, b] = toLinearRgb(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const mixedLuminance = (from: string, to: string, share: number): number => {
  const start = toOklab(from);
  const end = toOklab(to);
  const [L, a, b] = start.map(
    (component, index) =>
      component * share + (end[index] as number) * (1 - share),
  ) as [number, number, number];
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  // Clamp like a browser does: a point on the line between two in-gamut colours can poke just
  // outside sRGB, and luminance is defined on the displayed (gamut-mapped) colour.
  const clamp = (value: number): number => Math.min(1, Math.max(0, value));
  const red = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const mixedContrastRatio = (
  from: string,
  to: string,
  share: number,
  against: string,
): number => {
  const first = mixedLuminance(from, to, share);
  const second = relativeLuminance(against);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

describe('Palette', () => {
  it('keeps tokens.css in sync with the palette', () => {
    // tokens.css is generated. If this fails, run `npm run build:tokens`.
    expect(tokensCss).toBe(renderTokens());
  });

  it('keeps the single-theme token variants in sync with the palette, so the three cannot drift', () => {
    // The light-only and dark-only variants (issue #62) are generated from the same palette.
    // If this fails, run `npm run build:tokens`.
    expect(readSrc('tokens.light.css')).toBe(renderLightTokens());
    expect(readSrc('tokens.dark.css')).toBe(renderDarkTokens());
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

  it.each(
    (
      [
        ['light', light],
        ['dark', dark],
      ] as const
    ).flatMap(([theme, tokens]) =>
      (['success', 'warning', 'error', 'info'] as const).map(
        (role) => [theme, role, tokens] as const,
      ),
    ),
  )(
    "keeps the %s theme's `%s` status tone at least 4.5:1 against surface (WCAG 2.2 SC 1.4.3)",
    (_theme, role, tokens) => {
      expect(
        contrastRatio(tokens[role], tokens.surface),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('ships the agreed status-tone palette while keeping the dark values unchanged', () => {
    expect({
      success: light.success,
      warning: light.warning,
      error: light.error,
      info: light.info,
    }).toEqual({
      success: '#047857',
      warning: '#b45309',
      error: '#d63384',
      info: '#0e7490',
    });
    expect({
      success: dark.success,
      warning: dark.warning,
      error: dark.error,
      info: dark.info,
    }).toEqual({
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f48fb1',
      info: '#22d3ee',
    });
  });

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

  it.each(
    (
      [
        ['light', light],
        ['dark', dark],
      ] as const
    ).flatMap(([theme, tokens]) =>
      (['primary', 'primaryHover', 'secondary', 'secondaryHover'] as const).map(
        (role) => [theme, role, tokens] as const,
      ),
    ),
  )(
    "keeps the %s theme's `%s` fill at least 3:1 against surface (WCAG 2.2 SC 1.4.11)",
    (_theme, role, tokens) => {
      // Why the fills carry controlBorder's floor, hover roles included: see `primary` in
      // PaletteTokens. The light `secondary` that failed it at 2.77:1 is issue #78.
      expect(
        contrastRatio(tokens[role], tokens.surface),
      ).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(
    (
      [
        ['light', light],
        ['dark', dark],
      ] as const
    ).flatMap(([theme, tokens]) =>
      (
        [
          ['primary', 'primaryForeground'],
          ['primaryHover', 'primaryForeground'],
          ['secondary', 'secondaryForeground'],
          ['secondaryHover', 'secondaryForeground'],
        ] as const
      ).map(([fill, ink]) => [theme, fill, ink, tokens] as const),
    ),
  )(
    "keeps the %s theme's `%s` fill at least 4.5:1 against `%s` (WCAG 2.2 SC 1.4.3)",
    (_theme, fill, ink, tokens) => {
      // The other half of the box a fill sits in: the surface test above says it must be seen, this
      // says its label must be read. The rule itself, the `body`-role reasoning behind 4.5 rather
      // than 3, and why `disabled`/`disabledHover` are deliberately absent here: see
      // `primaryForeground` in PaletteTokens (issue #93).
      expect(contrastRatio(tokens[fill], tokens[ink])).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  it('keeps each light fill distinct from the hover it steps into, with hover the darker of the two', () => {
    // Light hover steps *darker* than rest; dark inverts that (see the palette's dark comment).
    // Pinned so correcting a fill that fails its floor cannot be done by promoting the hover value
    // into the rest slot, which would collapse the two into one colour.
    for (const [rest, hover] of [
      [light.primary, light.primaryHover],
      [light.secondary, light.secondaryHover],
    ] as const) {
      expect(rest).not.toBe(hover);
      expect(relativeLuminance(hover)).toBeLessThan(relativeLuminance(rest));
    }
  });

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

  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)(
    'keeps the meter fill and the error endpoint at least 3:1 against the meter track in the %s theme (WCAG 2.2 SC 1.4.11)',
    (_theme, tokens) => {
      // The filled share is the only thing telling the level apart from the capacity, so both ends
      // of the depletion path carry controlBorder's floor against the track. See docs/adr/0010.
      expect(
        contrastRatio(tokens.meterFill, tokens.meterTrack),
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrastRatio(tokens.error, tokens.meterTrack),
      ).toBeGreaterThanOrEqual(3);
    },
  );

  it.each([
    ['light', light],
    ['dark', dark],
  ] as const)(
    'keeps every intermediate depletion colour at least 3:1 against the meter track in the %s theme (docs/adr/0010)',
    (_theme, tokens) => {
      // Depletion has no threshold: every share in [0, 1] is a colour a viewer can be shown, so the
      // floor holds along the whole OKLab line, not just at its ends. Sampled at 1% steps.
      for (let step = 0; step <= 100; step++) {
        expect(
          mixedContrastRatio(
            tokens.meterFill,
            tokens.error,
            step / 100,
            tokens.meterTrack,
          ),
        ).toBeGreaterThanOrEqual(3);
      }
    },
  );

  it('uses plain hex values the stylesheet can consume directly, except where alpha is part of the colour', () => {
    // The scrim is the one role whose alpha belongs to the colour itself: the page beneath must
    // show through the veil, and a solid hex cannot say so. Every other role stays opaque hex.
    for (const tokens of [light, dark]) {
      for (const [name, value] of Object.entries(tokens)) {
        if (name === 'scrim') {
          expect(value).toMatch(/^rgb\(\d+ \d+ \d+ \/ 0?\.\d+\)$/);
        } else {
          expect(value).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it('ships the same translucent scrim in both themes, its alpha part of the colour', () => {
    expect(light.scrim).toBe('rgb(15 23 42 / 0.5)');
    expect(dark.scrim).toBe('rgb(15 23 42 / 0.5)');
  });
});
