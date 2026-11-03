import { readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as library from './index';

const errorModules = readdirSync(dirname(fileURLToPath(import.meta.url)), {
  recursive: true,
  encoding: 'utf8',
}).filter((path) => path.endsWith('Error.ts'));

describe('package barrel', () => {
  it('discovers error modules so export coverage cannot pass on an empty roster', () => {
    expect(errorModules.length).toBeGreaterThan(0);
  });

  it.each(errorModules)(
    'exports %s by identity so consumers can match thrown errors by type',
    async (path) => {
      const module = await import(/* @vite-ignore */ `./${path}`);
      for (const [name, error] of Object.entries(module)) {
        expect(library).toHaveProperty(name, error);
      }
    },
  );
});
