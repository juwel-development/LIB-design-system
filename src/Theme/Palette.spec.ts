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

  it('uses plain hex values the stylesheet can consume directly', () => {
    for (const tokens of [light, dark]) {
      for (const value of Object.values(tokens)) {
        expect(value).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});
