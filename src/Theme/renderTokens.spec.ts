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
