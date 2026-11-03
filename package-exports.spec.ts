import { describe, expect, it } from 'vitest';
import manifest from './package.json';

describe('package stylesheet exports', () => {
  it('delivers every stylesheet from dist instead of asking the host to compile source', () => {
    const styles = Object.entries(manifest.exports).filter(([name]) =>
      /^\.\/styles.*\.css$/.test(name),
    );

    expect(styles.map(([name]) => name).sort()).toEqual([
      './styles.css',
      './styles.dark.css',
      './styles.light.css',
    ]);
    for (const [, target] of styles) {
      expect(target).toMatch(/^\.\/dist\/.+\.css$/);
    }
    expect(JSON.stringify(manifest.exports)).not.toMatch(
      /\.\/src\/styles[^"\s]*\.css/,
    );
  });
  it('preserves explicitly imported CSS when a host tree-shakes the package', () => {
    expect(manifest).toHaveProperty('sideEffects', ['**/*.css']);
  });

  it('requires Tailwind v4 only for hosts that opt into the tokens route', () => {
    expect(manifest.peerDependencies).toHaveProperty('tailwindcss', '^4.0.0');
    expect(manifest).toHaveProperty(
      'peerDependenciesMeta.tailwindcss.optional',
      true,
    );
  });
});
