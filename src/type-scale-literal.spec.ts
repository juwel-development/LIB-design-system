import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Reads every component source off disk and fails on a rung of Tailwind's own type scale. A
// component sizes its text from a role in the ADR 0004 contract - display/title/subtitle/lede/
// body/small/label - and never from `text-sm` and its siblings, which are framework internals a
// re-theming consumer neither declares nor owns (issue #79). The two ladders happened to agree at
// one rung, which is why seven of these lived in the form family unseen; the guard is here because
// coincidence is not a contract. biome cannot match a substring inside a long class string, so no
// lint rule can see this; a source scan can, the same technique radius-literal.spec.ts uses for the
// corner ban. It covers every component present and future, with no exemption list.
const srcRoot = dirname(fileURLToPath(import.meta.url));

const componentSources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return componentSources(path);
    // Components only: stories legitimately demonstrate arbitrary markup, specs assert on it.
    return entry.name.endsWith('.tsx') &&
      !entry.name.endsWith('.stories.tsx') &&
      !entry.name.endsWith('.spec.tsx')
      ? [path]
      : [];
  });

// Tailwind's default type scale, in every variant-prefixed form (`md:text-lg` offends too). The
// role names are longer words, so `text-small` and `text-subtitle` fall outside the alternation.
const scaleRung = /\btext-(?:xs|sm|base|lg|\d?xl)\b/g;

describe('type scale literal ban', () => {
  const sources = componentSources(srcRoot);

  it('scans at least one component, so an empty roster cannot pass vacuously', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it.each(sources)(
    'sizes text from a type role, not a framework rung, in %s',
    (path) => {
      const offending = readFileSync(path, 'utf8').match(scaleRung) ?? [];
      expect(offending).toEqual([]);
    },
  );
});
