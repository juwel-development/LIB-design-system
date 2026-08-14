/* Regenerates the token stylesheets from the palette. Run via `npm run build:tokens`.
   tokens.css is light-only; tokens.dark.css is the optional dark layer (issue #62). */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDarkTokens, renderTokens } from '../src/Theme/renderTokens';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const [file, render] of [
  ['tokens.css', renderTokens],
  ['tokens.dark.css', renderDarkTokens],
] as const) {
  const target = join(root, 'src', file);
  writeFileSync(target, render(), 'utf8');
  process.stdout.write(`wrote ${target}\n`);
}
