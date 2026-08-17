import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Reads every component source off disk and pins where the display measure is applied. The bound
// belongs to the display type role, and one component renders that role: `H1`. A second site would be
// either a heading taking a measure its role does not carry, or a container bound - and ADR 0008
// refused the container bound for `Stack` (#87). biome cannot match a substring inside a long class
// string, so no lint rule can see this; a source scan can, the technique radius-literal.spec.ts uses
// for the corner ban. It covers every component present and future, with no exemption list.
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

// Any utility reading the display measure, in every variant-prefixed form (`lg:max-w-[…]` counts).
// Not a global regex: `test` on one of those carries `lastIndex` between files and would skip every
// second match. Prose naming the token without applying it - a docblock, a comment - does not match.
const displayMeasure = /\S*\[var\(--measure-display\)\]/;

describe('display measure call site', () => {
  const sources = componentSources(srcRoot);

  it('scans at least one component, so an empty roster cannot pass vacuously', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it('applies the display measure at exactly one call site, and it is the display role', () => {
    const sites = sources.filter((path) =>
      displayMeasure.test(readFileSync(path, 'utf8')),
    );
    expect(sites.map((path) => relative(srcRoot, path))).toEqual([
      join('Display', 'Typography', 'H1', 'H1.tsx'),
    ]);
  });
});
