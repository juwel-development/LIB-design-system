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
    // include beats a per-worktree exclude.
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['./src/**/*.stories.tsx', './src/**/*.spec.tsx'],
    },
  },
});
