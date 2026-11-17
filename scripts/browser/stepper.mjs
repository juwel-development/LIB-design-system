import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// npm run build && npm run storybook -- --ci --port 6182
// npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/stepper.mjs
// Only supplies browser focus, viewport, theme and stylesheet delivery. All assertions live
// in storybook/test play functions; no screenshots or verification records enter the repository.
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const base = process.env.STEPPER_STORYBOOK_URL ?? 'http://localhost:6182';
try {
  for (const [delivery, theme, forcedColors] of [
    ['source', 'light', 'none'],
    ['source', 'dark', 'none'],
    ['styles.css', 'light', 'none'],
    ['styles.css', 'dark', 'none'],
    ['styles.light.css', 'light', 'none'],
    ['styles.dark.css', 'dark', 'none'],
    ['source', 'light', 'active'],
    ['styles.css', 'dark', 'active'],
  ]) {
    for (const width of [1280, 1024, 684]) {
      for (const story of [
        'setup-presentations',
        'inline-narrow',
        'inline-overflow',
        'five-steps',
        'narrow',
        'natural-height',
        'forced-colours',
      ]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
          forcedColors,
        });
        // embed prevents automatic playback before theme and delivery are ready.
        await page.goto(
          `${base}/iframe.html?id=interaction-stepper--${story}&viewMode=story&embed=true&globals=theme:${theme}`,
        );
        await page.waitForSelector('[role=tablist]');
        await page.evaluate(
          (theme) =>
            document.documentElement.classList.toggle('dark', theme === 'dark'),
          theme,
        );
        if (delivery !== 'source') {
          await page.evaluate(() => {
            document
              // Keep Storybook's shell CSS: removing it exposes hidden controls to Tab.
              .querySelectorAll('style[data-vite-dev-id$="/src/styles.css"]')
              .forEach((element) => {
                element.remove();
              });
          });
          await page.addStyleTag({
            content: readFileSync(`dist/${delivery}`, 'utf8'),
          });
        }
        const measurements = await page.evaluate(async () => {
          await document.fonts.ready;
          const canvasElement = document.querySelector('#storybook-root');
          await window.__STORYBOOK_PREVIEW__.currentRender.story.playFunction({
            canvasElement,
          });
          return canvasElement.dataset.stepperMeasurements;
        });
        process.stdout.write(
          `PASS ${delivery} ${theme} forced=${forcedColors} ${width}px ${story} ${measurements ?? ''}\n`,
        );
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
