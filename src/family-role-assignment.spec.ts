import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Reads every component source off disk and pins which of them read the heading and control family
// roles (#120, docs/adr/0004 Amendments). Both roles default to the primary face, so in jsdom and on
// the library's own values the assignment is invisible; what is checkable is the set, so a component
// that starts or stops reading either role has to change this list and argue for it - the shape
// label-leading-optin.spec.ts uses. The face-literal ban below is the family half of the type-scale
// ban: the library ships no face, so no component may name one.
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

const carries = (utility: string, source: string): boolean =>
  new RegExp(`(?<![\\w-])${utility}(?![\\w-])`).test(source);

const carrying = (utility: string): string[] =>
  componentSources(srcRoot)
    .filter((path) => carries(utility, readFileSync(path, 'utf8')))
    .map((path) => relative(srcRoot, path))
    .sort();

// Tailwind's own family utilities and the arbitrary-value form, in every variant-prefixed spelling.
// The role utilities are longer words, so font-primary and font-heading fall outside the alternation.
const faceLiteral = /\bfont-(?:sans|serif|mono)\b|\bfont-\[/g;

describe('family role assignment', () => {
  it('scans at least one component, so an empty roster cannot pass vacuously', () => {
    expect(componentSources(srcRoot).length).toBeGreaterThan(0);
  });

  it('gives every heading element the heading family role, and nothing else reads it', () => {
    // H1-H6 and the two h1 treatments outside H1 (docs/adr/0005): the subpage head and the Dialog
    // title. A heading reads one face wherever it is rendered, so a consumer re-pointing
    // --font-heading moves every heading on the page at once and no paragraph with it.
    expect(carrying('font-heading')).toEqual(
      [
        join('Display', 'Typography', 'H1', 'H1.tsx'),
        join('Display', 'Typography', 'H2', 'H2.tsx'),
        join('Display', 'Typography', 'H3', 'H3.tsx'),
        join('Display', 'Typography', 'H4', 'H4.tsx'),
        join('Display', 'Typography', 'H5', 'H5.tsx'),
        join('Display', 'Typography', 'H6', 'H6.tsx'),
        join('Layout', 'Dialog', 'Dialog.tsx'),
        join('Layout', 'PageHead', 'PageHead.tsx'),
      ].sort(),
    );
  });

  it('gives every control the control family role, and nothing else reads it', () => {
    // The box the viewer operates (CONTEXT.md: Control): the action and the five fields. Their
    // labels, hints and errors stay apparatus in the secondary face, so the role is on the control
    // element alone, never on the field wrapper.
    expect(carrying('font-control')).toEqual(
      [
        join('Interaction', 'Button', 'Button.tsx'),
        join('Interaction', 'Input', 'Input.tsx'),
        join('Interaction', 'MultiSelect', 'MultiSelect.tsx'),
        join('Interaction', 'NumberInput', 'NumberInput.tsx'),
        join('Interaction', 'Select', 'Select.tsx'),
        join('Interaction', 'TextArea', 'TextArea.tsx'),
      ].sort(),
    );
  });

  it('leaves no heading reading the content face, so the heading role is the only face a heading has', () => {
    for (const path of carrying('font-heading')) {
      const source = readFileSync(join(srcRoot, path), 'utf8');
      // Dialog paints its description in the content face beside its title; the h1 is what is pinned.
      const headingElements =
        source.match(/<h[1-6][^>]*>|className=\{h[1-6]\(/g) ?? [];
      expect(headingElements.length, path).toBeGreaterThan(0);
    }
    expect(carrying('font-primary')).not.toContain(
      join('Display', 'Typography', 'H1', 'H1.tsx'),
    );
  });

  it.each([
    'font-sans',
    'font-serif',
    'font-mono',
    'md:font-serif',
    'font-[Georgia]',
  ])('catches the face literal %s', (literal) => {
    expect(
      `className={'${literal} text-body'}`.match(faceLiteral),
    ).not.toBeNull();
  });

  it.each([
    'font-primary',
    'font-secondary',
    'font-heading',
    'font-control',
    'font-medium',
  ])('leaves the role utility %s alone', (role) => {
    expect(`className={'${role} text-body'}`.match(faceLiteral)).toBeNull();
  });

  it.each(componentSources(srcRoot))(
    'names a family role and never a face in %s',
    (path) => {
      const offending = readFileSync(path, 'utf8').match(faceLiteral) ?? [];
      expect(offending).toEqual([]);
    },
  );
});
