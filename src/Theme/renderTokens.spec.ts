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

describe('renderTokens radius contract', () => {
  it('names the one corner every control reads, defaulting to what rounded-lg resolved to', () => {
    expect(renderTokens()).toContain('--radius-control: 0.5rem;');
  });

  it('declares no structure radius, a value masquerading as a role', () => {
    expect(renderTokens()).not.toContain('--radius-none');
  });

  it('keeps radius out of the Tailwind colour map, since it is not a colour', () => {
    // @theme inline registers each declaration as a Tailwind colour; a radius token in there
    // would emit --color-radius-control.
    const themeInline =
      renderTokens().match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeInline).not.toContain('radius');
  });
});

describe('renderTokens typography contract', () => {
  // The library ships no face, so it holds no font values to read; the type-role sizes are its
  // own, and the two floors below are checked against them the way the contrast test checks the
  // ring. 1rem is 16px.
  const remPx = (name: string): number => {
    const match = renderTokens().match(
      new RegExp(`--${name}:\\s*([0-9.]+)rem;`),
    );
    return match ? Number.parseFloat(match[1] as string) * 16 : Number.NaN;
  };

  // A plain @theme block (not @theme inline) is the colour-free one; it generates the
  // font-*/text-*/leading-*/tracking-* utilities a sealed recipe reaches.
  const themeBlock = (): string =>
    renderTokens().match(/@theme \{([^}]*)\}/)?.[1] ?? '';

  it('names two family roles defaulting to inherit, so the library ships no face', () => {
    const theme = themeBlock();
    expect(theme).toContain('--font-primary: inherit;');
    expect(theme).toContain('--font-secondary: inherit;');
  });

  it('declares the type roles, leading and tracking so the utilities exist', () => {
    const theme = themeBlock();
    expect(theme).toContain('--text-display: clamp(3rem, 7vw, 6rem);');
    expect(theme).toContain('--leading-display: 1.05;');
    expect(theme).toContain('--text-title: clamp(2.25rem, 5vw, 4.25rem);');
    expect(theme).toContain('--leading-title: 1.1;');
    expect(theme).toContain('--text-subtitle: clamp(1.5rem, 3vw, 2.25rem);');
    expect(theme).toContain('--leading-subtitle: 1.2;');
    expect(theme).toContain('--text-lede: 1.25rem;');
    expect(theme).toContain('--leading-lede: 1.4;');
    expect(theme).toContain('--text-body: 1.0625rem;');
    expect(theme).toContain('--leading-body: 1.6;');
    expect(theme).toContain('--tracking-label: 0.14em;');
    expect(theme).toContain('--tracking-optical: -0.02em;');
  });

  it('sizes the lede role above body and below the subtitle floor, a paragraph not a heading', () => {
    // The lede is the reading block's opening paragraph (Prose #21): larger than body, smaller than
    // the smallest a subtitle ever gets (its clamp floor), so it never borrows a heading's size.
    const subtitleFloor = Number.parseFloat(
      themeBlock().match(/--text-subtitle:\s*clamp\(([0-9.]+)rem/)?.[1] ??
        'NaN',
    );
    expect(remPx('text-lede')).toBeGreaterThan(remPx('text-body'));
    expect(remPx('text-lede')).toBeLessThan(subtitleFloor * 16);
  });

  it('emits the lede role in the typography @theme block, not :root or the colour map', () => {
    // A Tailwind --text-*/--leading-* namespace: it generates the text-lede/leading-lede utilities
    // Prose.Lede reaches, so it belongs in the plain @theme block, never in @theme inline.
    expect(themeBlock()).toContain('--text-lede');
    expect(themeBlock()).toContain('--leading-lede');
    const themeInline =
      renderTokens().match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeInline).not.toContain('lede');
  });

  it('keeps display the largest role, so a subpage head can never out-scale the hero', () => {
    // Enforce the invariant, not a fixed pair of values: display's clamp ceiling must clear title's,
    // which now holds the subpage-head value display mistakenly carried. See the ADR (0004).
    const ceilingRem = (role: string): number => {
      const match = themeBlock().match(
        new RegExp(`--text-${role}:\\s*clamp\\([^)]*,\\s*([0-9.]+)rem\\)`),
      );
      return match ? Number.parseFloat(match[1] as string) : Number.NaN;
    };
    expect(ceilingRem('display')).toBeGreaterThan(ceilingRem('title'));
  });

  it('keeps typography out of the Tailwind colour map, since it is not a colour', () => {
    // @theme inline registers each declaration as a Tailwind colour; a type token in there would
    // emit a bogus --color-font-primary.
    const themeInline =
      renderTokens().match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeInline).not.toContain('--font-');
    expect(themeInline).not.toContain('--text-');
    expect(themeInline).not.toContain('--tracking-');
  });

  it('carries the reading measure in ch in :root, out of every @theme block', () => {
    const css = renderTokens();
    expect(css).toContain('--measure: 66ch;');
    expect(css).toContain('--measure-display: 36ch;');
    expect(css).toContain('--measure-wide: 72ch;');
    // ch has no Tailwind namespace, so it must not sit in the utility-generating block.
    expect(themeBlock()).not.toContain('--measure');
  });

  it('keeps the page-head standfirst measure wider than the reading column and narrower than a display heading', () => {
    // --measure-wide is the lede of a page head (PageHead #18): a slightly wider opening statement, so
    // it clears the reading measure - but it is still running text, so it stays inside the display
    // measure a big heading takes. Assert the ordering, not the exact ch values.
    const ch = (name: string): number =>
      Number.parseFloat(
        renderTokens().match(new RegExp(`--${name}:\\s*([0-9.]+)ch;`))?.[1] ??
          'NaN',
      );
    expect(ch('measure-wide')).toBeGreaterThan(ch('measure'));
    expect(ch('measure-wide')).toBeGreaterThan(ch('measure-display'));
  });

  it('overrides no Tailwind built-in, so a consumer keeps their own type and faces', () => {
    const css = renderTokens();
    expect(css).not.toContain('--text-base');
    expect(css).not.toContain('--font-sans');
    expect(css).not.toContain('--font-serif');
  });

  it('keeps --text-label at least 13px, below which its tracking reads as damage', () => {
    expect(remPx('text-label')).toBeGreaterThanOrEqual(13);
  });

  it('keeps --text-small at least 15px, below which tabular figures stop comparing', () => {
    expect(remPx('text-small')).toBeGreaterThanOrEqual(15);
  });
});

describe('renderTokens aspect contract', () => {
  // The four aspect roles are a Tailwind --aspect-* namespace, so they generate the aspect-*
  // utilities Figure's recipe reaches and belong in a plain @theme block, never :root or the colour map.
  const aspectBlock = (): string =>
    (renderTokens().match(/@theme \{[\s\S]*?\}/g) ?? []).find((block) =>
      block.includes('--aspect-portrait'),
    ) ?? '';

  it('emits the four aspect roles inside a @theme block, so the aspect-* utilities exist', () => {
    const block = aspectBlock();
    expect(block).toContain('--aspect-portrait:  4 / 5;');
    expect(block).toContain('--aspect-square:    1 / 1;');
    expect(block).toContain('--aspect-landscape: 3 / 2;');
    expect(block).toContain('--aspect-wide:     16 / 9;');
  });

  it('keeps the aspect roles out of :root and the Tailwind colour map, since a @theme namespace generates the utilities', () => {
    const css = renderTokens();
    // @theme inline would register a bogus --color-aspect-*; :root would generate no utility.
    const themeInline = css.match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeInline).not.toContain('aspect');
    const root = css.match(/:root \{([^}]*)\}/)?.[1] ?? '';
    expect(root).not.toContain('aspect');
  });

  it('emits the aspect block after the typography block, where a reader meets both theme namespaces', () => {
    const css = renderTokens();
    expect(css.indexOf('--aspect-portrait')).toBeGreaterThan(
      css.indexOf('--text-display'),
    );
  });

  it('re-points no Tailwind built-in, leaving --aspect-video alone', () => {
    // ADR 0004: only new role names. --aspect-wide resolves to today's 16/9 and diverges the moment
    // a brand re-points ours, which is the point; the built-in --aspect-video is never touched.
    expect(renderTokens()).not.toContain('--aspect-video');
  });
});

describe('renderTokens spacing contract', () => {
  it('emits the three spacing roles into :root, expressed in em so they track the type ramp', () => {
    const css = renderTokens();
    expect(css).toMatch(/--space-stack:\s*[0-9.]+em;/);
    expect(css).toMatch(/--space-region:\s*[0-9.]+em;/);
    // The vertical air inside a page section (Section #9), in em like the others so it tracks the type.
    expect(css).toMatch(/--space-band:\s*[0-9.]+em;/);
  });

  it('keeps spacing out of every @theme block, since --space-* has no Tailwind namespace', () => {
    const css = renderTokens();
    // A plain @theme block would generate utilities; @theme inline would register a bogus colour.
    const themeBlock = css.match(/@theme \{([^}]*)\}/)?.[1] ?? '';
    const themeInline = css.match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeBlock).not.toContain('--space-');
    expect(themeInline).not.toContain('--space-');
  });

  it('declares no numbered spacing rung, a value masquerading as a role', () => {
    expect(renderTokens()).not.toContain('--space-1');
  });
});

describe('renderTokens gutter contract', () => {
  it('emits the gutter into :root as a clamp, out of every @theme block', () => {
    const css = renderTokens();
    expect(css).toContain('--gutter: clamp(1.5rem, 5vw, 4rem);');
    // No Tailwind namespace: a plain @theme block would generate a utility, @theme inline a bogus colour.
    const themeBlock = css.match(/@theme \{([^}]*)\}/)?.[1] ?? '';
    const themeInline = css.match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeBlock).not.toContain('--gutter');
    expect(themeInline).not.toContain('--gutter');
  });

  it('measures the gutter against the screen, not the type, so it is the one spacing role not in em', () => {
    // It answers to how much room there is, not how large the words are - the one spacing role not in em.
    // A bare em unit is a digit directly before "em"; rem is excluded because an "r" sits between.
    expect(renderTokens()).not.toMatch(/--gutter:[^;]*[0-9.]em/);
  });
});

describe('renderTokens fold contract', () => {
  it('emits the fold height into :root, out of every @theme block', () => {
    const css = renderTokens();
    expect(css).toContain('--fold-height: min(70vh, 40rem);');
    // No Tailwind namespace: a plain @theme block would generate a utility, @theme inline a bogus colour.
    const themeBlock = css.match(/@theme \{([^}]*)\}/)?.[1] ?? '';
    const themeInline = css.match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeBlock).not.toContain('--fold-height');
    expect(themeInline).not.toContain('--fold-height');
  });

  it('keeps the fold height below the viewport, so a first screen never fills it and reads top-heavy', () => {
    // The constraint is the point, not the number 70: a fold that exactly fills the screen guarantees
    // top-heaviness, so the vh component must clear 100 - 60vh or 80vh pass, 100vh fails. Enforced
    // against the library's own value in ADR 0004's shape, never a consumer's.
    const viewportComponent = Number.parseFloat(
      renderTokens().match(/--fold-height:\s*min\(([0-9.]+)vh/)?.[1] ?? 'NaN',
    );
    expect(viewportComponent).toBeLessThan(100);
  });
});

describe('renderTokens tick contract', () => {
  it('emits the two tick dimensions into :root, out of every @theme block', () => {
    const css = renderTokens();
    expect(css).toContain('--tick-length: 0.9rem;');
    expect(css).toContain('--tick-thickness: 1px;');
    // A plain @theme block would generate utilities; @theme inline would register a bogus colour.
    const themeBlock = css.match(/@theme \{([^}]*)\}/)?.[1] ?? '';
    const themeInline = css.match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeBlock).not.toContain('--tick-');
    expect(themeInline).not.toContain('--tick-');
  });
});

describe('renderTokens underline contract', () => {
  it('emits the three underline tokens into :root, out of the Tailwind colour map', () => {
    const css = renderTokens();
    expect(css).toContain('--underline-offset: 0.18em;');
    expect(css).toContain('--underline-thickness: 1px;');
    expect(css).toContain('--underline-thickness-hover: 2px;');
    // Not colours, so they must not register a bogus --color-underline-* utility.
    const themeInline = css.match(/@theme inline \{([^}]*)\}/)?.[1] ?? '';
    expect(themeInline).not.toContain('underline');
  });

  it('keeps the hover underline thicker than the rest one, so the hover cue is visible', () => {
    // The thickening on hover is the only cue distinguishing a prose link, never hue, so it has to
    // grow. Parse both and assert the ordering rather than pinning the pair. See ADR 0006.
    const px = (name: string): number => {
      const match = renderTokens().match(
        new RegExp(`--${name}:\\s*([0-9.]+)px;`),
      );
      return match ? Number.parseFloat(match[1] as string) : Number.NaN;
    };
    expect(px('underline-thickness-hover')).toBeGreaterThan(
      px('underline-thickness'),
    );
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
