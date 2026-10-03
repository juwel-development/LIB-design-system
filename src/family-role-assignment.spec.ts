import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Reads every component source off disk and pins which of them read the heading, body and control
// family roles (#120, docs/adr/0004 Amendments). All three fall back to the primary face, so in jsdom
// and on the library's own values the assignment is invisible; what is checkable is the set, so a
// component that starts or stops reading a role has to change this list and argue for it - the shape
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

// Word boundaries rather than a trailing space, as in label-leading-optin.spec.ts: a utility written
// last in a class string has none, and the leading `(?<![\\w-])` keeps `font-body` from matching inside
// `--font-body` in a TSDoc line, so a component is counted for reading a role, not for naming it.
const carries = (utility: string, source: string): boolean =>
  new RegExp(`(?<![\\w-])${utility}(?![\\w-])`).test(source);

const carrying = (utility: string): string[] =>
  componentSources(srcRoot)
    .filter((path) => carries(utility, readFileSync(path, 'utf8')))
    .map((path) => relative(srcRoot, path))
    .sort();

// Tailwind's own family utilities and every arbitrary form a face can take - `font-[…]`, the v4
// `font-(…)` shorthand and the `[font-family:…]` property - in any variant-prefixed spelling. A
// numeric `font-[600]` is a weight, which docs/adr/0005 permits as a literal, so it is let through.
const faceLiteral =
  /\bfont-(?:sans|serif|mono)\b|\bfont-\[(?!\d)|\bfont-\(|\[font-family:/g;

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

  it('gives all reading matter the body family role, and nothing else reads it', () => {
    // What the visitor came to read: the paragraph primitives, the reading block, a checklist, a
    // definition list's term and description, a table's value cells, the page head's lede and intro
    // and the Dialog's description. The term reads body whatever its size: it is not a heading.
    expect(carrying('font-body')).toEqual(
      [
        join('Display', 'Checklist', 'Checklist.tsx'),
        join('Display', 'DefinitionList', 'DefinitionList.tsx'),
        join('Display', 'Table', 'Table.tsx'),
        join('Display', 'Typography', 'P', 'P.tsx'),
        join('Display', 'Typography', 'Prose', 'Prose.tsx'),
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

  it('leaves no component reading the primary face directly: it is the face the three roles fall back to', () => {
    // --font-primary stays declared and re-pointable, and a theme that sets only it still moves every
    // heading, paragraph and control; but no element names it, so re-pointing one role moves one role.
    expect(carrying('font-primary')).toEqual([]);
  });

  it('keeps the secondary face on the apparatus that names things, untouched by the three roles', () => {
    // The labelling half of the contract is unchanged by #120: anything carrying it before still does.
    expect(carrying('font-secondary').length).toBeGreaterThan(10);
  });

  it.each([
    'font-sans',
    'font-serif',
    'font-mono',
    'md:font-serif',
    'font-[Georgia]',
    'font-[family-name:var(--brand)]',
    'font-(family-name:--brand)',
    'font-(--brand)',
    '[font-family:Georgia]',
  ])('catches the face literal %s', (literal) => {
    expect(
      `className={'${literal} text-body'}`.match(faceLiteral),
    ).not.toBeNull();
  });

  it.each([
    'font-primary',
    'font-secondary',
    'font-heading',
    'font-body',
    'font-control',
    'font-medium',
    'font-[600]',
  ])('leaves the role or weight utility %s alone', (role) => {
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
