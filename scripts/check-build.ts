import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import manifest from '../package.json';

const styles = Object.entries(manifest.exports).filter(([name]) =>
  /^\.\/styles.*\.css$/.test(name),
);
assert.equal(styles.length, 3, 'all three stylesheet exports must exist');
for (const [name, target] of styles) {
  assert(typeof target === 'string');
  assert.match(target, /^\.\/dist\/.+\.css$/);
  const css = readFileSync(
    new URL(target, new URL('../', import.meta.url)),
    'utf8',
  );
  assert.doesNotMatch(
    css,
    /@import\s+(?:url\(\s*)?['"]tailwindcss(?:\/[^'"]*)?['"]/,
  );
  assert.doesNotMatch(css, /\.text-9xl\b|\.bg-stone-50\b/);
  process.stdout.write(
    `PASS ${name} -> ${target}: exists; no Tailwind import; no .text-9xl or .bg-stone-50\n`,
  );
}

const javascript = readFileSync(
  new URL('../dist/design-system.js', import.meta.url),
  'utf8',
);
assert.match(javascript, /^["']use client["'];/);
assert.doesNotMatch(
  javascript,
  /\bimport\s*(?:[^;]*?\bfrom\s*)?['"][^'"]*\.css(?:\?[^'"]*)?['"]|\bimport\s*\(\s*['"][^'"]*\.css(?:\?[^'"]*)?['"]/,
);
process.stdout.write(
  'PASS dist/design-system.js: starts with "use client"; no CSS import\n',
);

// Pin the declarations consumers reach through the existing Choices namespace export (#173).
const choicesDeclarations = readFileSync(
  new URL('../dist/types/Interaction/Choices/Choices.d.ts', import.meta.url),
  'utf8',
);
assert.equal(
  choicesDeclarations,
  readFileSync(
    new URL('./snapshots/choices.d.ts.snap', import.meta.url),
    'utf8',
  ),
  'the Choices declaration snapshot must match its published contract',
);
assert.match(
  readFileSync(new URL('../dist/types/index.d.ts', import.meta.url), 'utf8'),
  /export \{ Choices \} from ['"]Interaction\/Choices\/Choices['"]/,
);
process.stdout.write('PASS Choices public export and declaration snapshot\n');
