import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Reads every component source off disk and fails on a hard-coded corner. A component styles its
// corners from --radius-control and never from a rounded-* literal - the ban ADR 0003 records.
// biome cannot match a substring inside a long class string, so no lint rule can see this; a
// source scan can, the same technique Palette.spec.ts uses to pin tokens.css to its renderer. It
// covers every component present and future, with no exemption list.
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

// Any rounded- utility that is not the arbitrary-value form reading a radius token.
const roundedLiteral = /rounded-(?!\[var\(--radius-)\S*/g;

describe('radius literal ban', () => {
  const sources = componentSources(srcRoot);

  it('scans at least one component, so an empty roster cannot pass vacuously', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it.each(sources)(
    'styles corners from the radius token, not a literal, in %s',
    (path) => {
      const offending = readFileSync(path, 'utf8').match(roundedLiteral) ?? [];
      expect(offending).toEqual([]);
    },
  );
});
