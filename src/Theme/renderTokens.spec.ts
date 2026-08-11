import { describe, expect, it } from 'vitest';
import { renderTokens } from './renderTokens';

describe('renderTokens motion contract', () => {
  it('names the one motion the library performs, so a consumer and the reduced-motion query can reach it', () => {
    expect(renderTokens()).toContain('--motion-duration-color: 150ms;');
  });

  it('re-points the motion token to 0ms under prefers-reduced-motion, honouring the setting for the motion it performs', () => {
    const css = renderTokens();
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/--motion-duration-color:\s*0ms;/);
  });

  it('keeps motion out of the Tailwind colour map, since it is not a colour', () => {
    // @theme inline registers each declaration as a Tailwind colour; a motion token in there
    // would emit --color-motion-duration-color.
    const themeInline =
      renderTokens().match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeInline).not.toContain('motion');
  });
});

describe('renderTokens focus ring contract', () => {
  it('emits none of the three collapsed per-variant ring roles', () => {
    const css = renderTokens();
    expect(css).not.toContain('--color-primary-ring');
    expect(css).not.toContain('--color-secondary-ring');
    // The old general ring is read as a fallback but no longer declared.
    expect(css).not.toMatch(/--color-ring:/);
  });

  it('reads the old general-ring variable as a fallback, defaulting per theme when it is undeclared', () => {
    const css = renderTokens();
    // A CSS fallback reaches its default only when the variable is undeclared, so a consumer who
    // still sets --color-ring keeps their value while an undeclared one falls through to the new
    // per-theme default.
    expect(css).toContain('--color-focus-ring: var(--color-ring, #475569);');
    expect(css).toContain('--color-focus-ring: var(--color-ring, #cbd5e1);');
  });

  it('carries the width and offset as re-pointable non-colour tokens, kept out of the Tailwind colour map', () => {
    const css = renderTokens();
    expect(css).toContain('--focus-ring-width: 3px;');
    expect(css).toContain('--focus-ring-offset: 2px;');
    const themeInline = css.match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeInline).not.toContain('--focus-ring-width');
    expect(themeInline).not.toContain('--focus-ring-offset');
  });
});
