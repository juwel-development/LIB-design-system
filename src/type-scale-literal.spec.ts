import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Reads every component source off disk and fails on a rung of Tailwind's own type scale - a
// framework internal the consumer neither declares nor owns, where ADR 0004 puts a named role
// (issue #79). Run against the pre-fix tree it caught all seven sites in `Form`, `Input` and
// `TextArea`, and nothing else in the roster. biome cannot match a substring inside a long class
// string, so no lint rule can see this; a source scan can, the technique radius-literal.spec.ts
// uses for the corner ban. It covers every component present and future, with no exemption list.
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

// The rungs, and the library utilities that share their `text-` prefix. Pinning both directions is
// what keeps the ban alive: a scan that only ever runs over clean sources stays green when the
// pattern itself breaks, and a pattern reaching one word too far would fail every component.
const rungs = [
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-9xl',
  'md:text-lg',
  'hover:text-sm',
];
const roles = [
  'text-display',
  'text-title',
  'text-subtitle',
  'text-lede',
  'text-body',
  'text-small',
  'text-label',
  'text-muted',
  'text-foreground',
  'text-error',
  'text-success',
  'text-primary-foreground',
  'text-[var(--text-small)]',
];

describe('type scale literal ban', () => {
  const sources = componentSources(srcRoot);

  it('scans at least one component, so an empty roster cannot pass vacuously', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it.each(rungs)('catches the framework rung %s', (rung) => {
    expect(`className={'${rung} text-muted'}`.match(scaleRung)).not.toBeNull();
  });

  it.each(roles)('leaves the library utility %s alone', (role) => {
    expect(`className={'${role} font-primary'}`.match(scaleRung)).toBeNull();
  });

  it.each(sources)(
    'sizes text from a type role, not a framework rung, in %s',
    (path) => {
      const offending = readFileSync(path, 'utf8').match(scaleRung) ?? [];
      expect(offending).toEqual([]);
    },
  );
});
