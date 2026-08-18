import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Scope discovery to this tree's src. An agent working in a git worktree has its own
    // src/ under this directory, and vitest's default include walks those, so a worktree
    // mid-TDD (spec ahead of code) would fail this tree's pre-commit run. A positive
    // include beats a per-worktree exclude. The second entry is this tree's own root-level
    // specs — `release-notes.spec.ts`, which pins `.releaserc.js` from beside it — and is
    // worktree-safe for the same reason: a worktree's copy sits a directory down.
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      '*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['./src/**/*.stories.tsx', './src/**/*.spec.tsx'],
    },
  },
});
