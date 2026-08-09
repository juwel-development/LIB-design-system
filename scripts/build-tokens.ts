/* Regenerates src/tokens.css from the palette. Run via `npm run build:tokens`. */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTokens } from '../src/Theme/renderTokens';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'src', 'tokens.css');

writeFileSync(target, renderTokens(), 'utf8');
process.stdout.write(`wrote ${target}\n`);
