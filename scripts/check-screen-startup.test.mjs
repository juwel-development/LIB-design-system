import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

for (const executable of ['/missing-screen-browser', process.execPath]) {
  test(`reports browser startup failure and removes its profile: ${executable}`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'screen-startup-test-'));
    try {
      const result = spawnSync(process.execPath, ['scripts/check-screen.mjs'], {
        env: { ...process.env, CHROME_PATH: executable, TMPDIR: directory },
        encoding: 'utf8',
        timeout: 5000,
      });
      assert.equal(
        result.error,
        undefined,
        'failure must terminate without a timeout',
      );
      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /Chrome (startup failed|exited before startup)/,
      );
      assert.deepEqual(
        readdirSync(directory),
        [],
        'temporary profile is removed',
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
