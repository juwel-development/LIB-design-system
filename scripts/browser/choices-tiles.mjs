import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// npm run build && npm run storybook -- --ci --port 6173
// npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/choices-tiles.mjs
// This harness only supplies browser/viewport/theme/CSS and captures evidence. Every assertion
// (including keyboard and geometry) lives in the storybook/test play function, never in a driver.
// Headless Chromium gives the document real focus; Orca's background surface cannot paint :focus-visible.
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const base = process.env.CHOICES_STORYBOOK_URL ?? 'http://localhost:6173';
const evidence = process.env.CHOICES_EVIDENCE_DIR ?? '/tmp/choices-173-browser';
mkdirSync(evidence, { recursive: true });
const report = { browser: browser.version(), cases: [] };
try {
  for (const [delivery, theme] of [
    ['source', 'light'],
    ['source', 'dark'],
    ['styles.css', 'light'],
    ['styles.css', 'dark'],
    ['styles.light.css', 'light'],
    ['styles.dark.css', 'dark'],
  ]) {
    for (const width of [1920, 1280, 1024, 684]) {
      for (const story of [
        'tiles--narrow-tiles',
        'tiles--full-inventory',
        'tiles--inline-names',
        'columns--consumer-workload',
      ]) {
        const height = width === 1920 ? 1080 : 720;
        const page = await browser.newPage({ viewport: { width, height } });
        // embed disables automatic playback, so setup finishes before invoking exactly one play.
        await page.goto(
          `${base}/iframe.html?id=interaction-choices-${story}&viewMode=story&embed=true&globals=theme:${theme}`,
        );
        await page.waitForSelector('[role=radiogroup]');
        await page.evaluate(
          (theme) =>
            document.documentElement.classList.toggle('dark', theme === 'dark'),
          theme,
        );
        if (delivery !== 'source') {
          await page.evaluate(() => {
            document
              .querySelectorAll('style,link[rel=stylesheet]')
              .forEach((element) => {
                element.remove();
              });
          });
          await page.addStyleTag({
            content: readFileSync('.storybook/storybook.css', 'utf8'),
          });
          await page.addStyleTag({
            content: readFileSync(`dist/${delivery}`, 'utf8'),
          });
        }
        const measurements = await page.evaluate(async (theme) => {
          await document.fonts.ready;
          const canvasElement = document.querySelector('#storybook-root');
          await window.__STORYBOOK_PREVIEW__.currentRender.story.playFunction({
            canvasElement,
            globals: { theme },
          });
          return JSON.parse(
            canvasElement.dataset.tileMeasurements ??
              canvasElement.dataset.columnMeasurements,
          );
        }, theme);
        const screenshot = `${delivery}-${theme}-${width}-${story}.png`;
        await page.screenshot({
          path: `${evidence}/${screenshot}`,
          fullPage: true,
        });
        report.cases.push({
          story,
          delivery,
          theme,
          width,
          height,
          measurements,
          screenshot,
        });
        process.stdout.write(
          `PASS ${delivery} ${theme} ${width}×${height}: ${story} play\n`,
        );
        await page.close();
      }
    }
  }
  writeFileSync(
    `${evidence}/results.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
