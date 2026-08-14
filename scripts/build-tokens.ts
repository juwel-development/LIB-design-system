/* Regenerates the token stylesheets from the one palette. Run via `npm run build:tokens`.
   tokens.css carries both themes; tokens.light.css and tokens.dark.css are the single-theme
   opt-in variants (issue #62), so all three stay in step with the palette. */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderDarkTokens,
  renderLightTokens,
  renderTokens,
} from '../src/Theme/renderTokens';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const [file, render] of [
  ['tokens.css', renderTokens],
  ['tokens.light.css', renderLightTokens],
  ['tokens.dark.css', renderDarkTokens],
] as const) {
  const target = join(root, 'src', file);
  writeFileSync(target, render(), 'utf8');
  process.stdout.write(`wrote ${target}\n`);
}
