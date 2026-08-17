import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Reads every component source off disk and pins which of them set the label role's leading. The
// role gained one for the shell's benefit (#81) and is deliberately not paired into the text-label
// utility, so every other call site renders the line box it rendered before. That "unchanged" is
// invisible in jsdom, which lays nothing out; what is checkable is the opt-in set, so a component
// that starts leading its labels has to change this list and argue for it.
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

const carrying = (utility: string): string[] =>
  componentSources(srcRoot)
    .filter((path) => readFileSync(path, 'utf8').includes(`${utility} `))
    .map((path) => relative(srcRoot, path));

describe('label leading opt-in', () => {
  it('scans at least one component, so an empty roster cannot pass vacuously', () => {
    expect(componentSources(srcRoot).length).toBeGreaterThan(0);
  });

  it('finds the label role in use across the roster, so the set below is a choice and not an empty tree', () => {
    // Figure's caption, Table's caption and header cells, Eyebrow, Rail's two parts and the shell.
    expect(carrying('text-label').length).toBeGreaterThan(1);
  });

  it('leads the label role in the shell alone, leaving every other call site to render as it did', () => {
    // The shell is the one place the line box is load-bearing: it is the floor the standing slot is
    // sized against, so the header must own the height it declares rather than inherit it (#81).
    expect(carrying('leading-label')).toEqual([
      join('Layout', 'Header', 'Header.tsx'),
    ]);
  });
});
