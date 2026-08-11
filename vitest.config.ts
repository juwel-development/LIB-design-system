import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Scope discovery to this tree's own specs. Sandcastle runs each agent in a
    // git worktree under .sandcastle/worktrees/<branch>/, a full checkout with its
    // own src/. Vitest's default include walks those too, so a worktree mid-TDD
    // (spec ahead of implementation) would fail the main tree's pre-commit run.
    // Scoping positively to src/ — where every spec lives, matching coverage.include
    // below — states the truth without needing a new exclude per worktree directory.
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['./src/**/*.stories.tsx', './src/**/*.spec.tsx'],
    },
  },
});
