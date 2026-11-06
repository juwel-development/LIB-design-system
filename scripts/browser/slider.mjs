import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// SLIDER_STORYBOOK_URL=http://localhost:6160 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/slider.mjs
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const base = process.env.SLIDER_STORYBOOK_URL ?? 'http://localhost:6160';
const artifacts = process.env.SLIDER_ARTIFACTS ?? '/tmp/lib160-browser';
mkdirSync(artifacts, { recursive: true });
const errors = [];
const assertionErrors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' && message.text().includes('AssertionError'))
    assertionErrors.push(message.text());
});
const record = (name, result) =>
  process.stdout.write(`${JSON.stringify({ name, ...result })}\n`);
const settle = async () => {
  await page.evaluate(() => document.fonts.ready);
  for (let frame = 0; frame < 4; frame++)
    await page.evaluate(() => new Promise(requestAnimationFrame));
};
const open = async (story, theme, stylesheet) => {
  await page.goto(
    `${base}/iframe.html?id=interaction-slider--${story}&viewMode=story&globals=theme:${theme}`,
  );
  await page.locator('#storybook-root').getByRole('slider').first().waitFor();
  await page.waitForFunction(
    (dark) => document.documentElement.classList.contains('dark') === dark,
    theme === 'dark',
  );
  // Let the play function run against the source stylesheet before swapping it out.
  await page.waitForFunction(
    () => window.__STORYBOOK_PREVIEW__?.currentRender?.phase === 'finished',
  );
  if (stylesheet) {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll(
        'style[data-vite-dev-id],link[rel="stylesheet"]',
      ))
        element.remove();
      if (
        document.querySelector('style[data-vite-dev-id],link[rel="stylesheet"]')
      )
        throw Error('Source stylesheet remained');
    });
    await page.addStyleTag({
      content: readFileSync(
        new URL('../../.storybook/storybook.css', import.meta.url),
        'utf8',
      ),
    });
    await page.addStyleTag({
      content: readFileSync(
        new URL(`../../dist/${stylesheet}`, import.meta.url),
        'utf8',
      ),
    });
  }
  await settle();
};
// Chrome's CDP tree reports `valuetext` as the bare number even for an ARIA slider carrying
// aria-valuetext (checked on 156.0.8078), so the announcement is read from the DOM attribute.
const accessibleSliders = async () => {
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send('Accessibility.getFullAXTree');
  await session.detach();
  const property = (node, name) =>
    node.properties?.find((entry) => entry.name === name)?.value.value;
  return {
    sliders: nodes
      .filter((node) => !node.ignored && node.role?.value === 'slider')
      .map((node) => ({
        name: node.name?.value,
        description: node.description?.value,
        value: node.value?.value,
        disabled: property(node, 'disabled') ?? false,
      })),
    liveRegions: nodes.filter(
      (node) =>
        !node.ignored &&
        (property(node, 'live') ?? 'off') !== 'off' &&
        node.role?.value !== 'RootWebArea',
    ).length,
    exposedText: nodes
      .filter((node) => !node.ignored && node.role?.value === 'StaticText')
      .map((node) => node.name?.value),
  };
};
const themedStylesheets = (theme) => [
  undefined,
  'styles.css',
  theme === 'dark' ? 'styles.dark.css' : 'styles.light.css',
];

try {
  for (const theme of ['light', 'dark']) {
    for (const stylesheet of themedStylesheets(theme)) {
      const variant = { theme, stylesheet: stylesheet ?? 'source' };

      await open('visible-value-beside-label', theme, stylesheet);
      const holders = await page.$$eval('[data-holder]', (elements) =>
        elements.map((holder) => {
          const [labelOnly, withValue] =
            holder.querySelectorAll('input[type=range]');
          const labelBlock = labelOnly.previousElementSibling;
          const valueBlock = withValue.previousElementSibling;
          const label = valueBlock.querySelector('label');
          const value = valueBlock.querySelector('span');
          return {
            width: holder.getBoundingClientRect().width,
            lang: holder.lang,
            label: label.textContent,
            value: value.textContent,
            labelOnlyHeight: labelBlock.getBoundingClientRect().height,
            withValueHeight: valueBlock.getBoundingClientRect().height,
            sameLine:
              Math.abs(
                label.getBoundingClientRect().top -
                  value.getBoundingClientRect().top,
              ) < 1,
            labelOnlyControlTop:
              labelOnly.getBoundingClientRect().top -
              labelBlock.getBoundingClientRect().top,
            withValueControlTop:
              withValue.getBoundingClientRect().top -
              valueBlock.getBoundingClientRect().top,
            overflow: holder.scrollWidth - holder.clientWidth,
            valueColor: getComputedStyle(value).color,
            labelColor: getComputedStyle(label).color,
          };
        }),
      );
      assert.equal(holders.length, 8);
      for (const holder of holders) {
        assert.ok([525, 845].includes(holder.width), JSON.stringify(holder));
        assert.equal(holder.withValueHeight, holder.labelOnlyHeight);
        assert.equal(holder.withValueControlTop, holder.labelOnlyControlTop);
        assert.equal(holder.sameLine, true, JSON.stringify(holder));
        assert.equal(holder.overflow, 0);
        assert.equal(holder.valueColor, holder.labelColor);
        record('label/value block keeps label-only height', {
          ...variant,
          ...holder,
        });
      }
      const reference = await accessibleSliders();
      for (const slider of reference.sliders.filter(
        (_slider, index) => index % 2 === 1,
      ))
        assert.ok(!slider.name.match(/\d/), JSON.stringify(slider));
      await page.screenshot({
        path: `${artifacts}/reference-${theme}-${variant.stylesheet}.png`,
        fullPage: true,
      });

      await open('long-wording-wraps', theme, stylesheet);
      const narrow = await page
        .locator('[data-holder=narrow]')
        .evaluate((holder) => {
          const label = holder.querySelector('label');
          const value = holder.querySelector('span');
          const lineHeight = Number.parseFloat(
            getComputedStyle(value).lineHeight,
          );
          return {
            width: holder.getBoundingClientRect().width,
            overflow: holder.scrollWidth - holder.clientWidth,
            valueRightInside:
              value.getBoundingClientRect().right <=
              holder.getBoundingClientRect().right,
            valueBelowLabel:
              value.getBoundingClientRect().top >=
              label.getBoundingClientRect().bottom - 1,
            valueLines: Math.round(
              value.getBoundingClientRect().height / lineHeight,
            ),
            clipped: value.scrollHeight > value.clientHeight,
            textOverflow: getComputedStyle(value).textOverflow,
            overflowX: getComputedStyle(value).overflowX,
            text: value.textContent,
          };
        });
      assert.equal(narrow.width, 200);
      assert.equal(narrow.overflow, 0);
      assert.equal(narrow.valueRightInside, true);
      assert.equal(narrow.valueBelowLabel, true);
      assert.ok(narrow.valueLines > 1);
      assert.equal(narrow.clipped, false);
      assert.notEqual(narrow.textOverflow, 'ellipsis');
      assert.equal(narrow.overflowX, 'visible');
      record('long wording wraps in a narrow holder without truncation', {
        ...variant,
        ...narrow,
      });
      await page.screenshot({
        path: `${artifacts}/narrow-${theme}-${variant.stylesheet}.png`,
      });

      await open('controlled', theme, stylesheet);
      const control = page.locator('#storybook-root').getByRole('slider');
      await control.evaluate((element) => {
        element.dataset.mountMarker = 'original';
      });
      // The play function has already passed 65 back through the consumer.
      const before = await accessibleSliders();
      assert.deepEqual(before.sliders, [
        {
          name: 'Weekly Wage in $',
          description: undefined,
          value: 65,
          disabled: false,
        },
      ]);
      assert.equal(before.liveRegions, 0);
      assert.ok(!before.exposedText.includes('$65'), before.exposedText);
      assert.equal(await control.getAttribute('aria-valuetext'), '$65 a week');
      await control.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.getByText('$75', { exact: true }).waitFor();
      const afterKeys = await accessibleSliders();
      assert.equal(afterKeys.sliders[0].name, 'Weekly Wage in $');
      assert.equal(afterKeys.sliders[0].value, 75);
      assert.equal(afterKeys.sliders[0].description, undefined);
      assert.equal(afterKeys.liveRegions, 0);
      assert.ok(!afterKeys.exposedText.includes('$75'), afterKeys.exposedText);
      assert.equal(await control.getAttribute('aria-valuetext'), '$75 a week');
      await page.keyboard.press('End');
      await page.getByText('$300', { exact: true }).waitFor();
      await page.keyboard.press('Home');
      await page.getByText('$20', { exact: true }).waitFor();
      const box = await control.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await settle();
      const pointer = await control.evaluate((element) => ({
        value: element.valueAsNumber,
        marker: element.dataset.mountMarker,
        shown: element.previousElementSibling.querySelector('span').textContent,
        valueText: element.getAttribute('aria-valuetext'),
      }));
      assert.equal(pointer.marker, 'original');
      assert.equal(pointer.value % 5, 0);
      assert.ok(pointer.value > 20 && pointer.value < 300);
      assert.equal(pointer.shown, `$${pointer.value}`);
      assert.equal(pointer.valueText, `$${pointer.value} a week`);
      record('native keys and pointer update wording on the same control', {
        ...variant,
        keys: ['ArrowRight', 'ArrowRight', 'End', 'Home'],
        after: afterKeys.sliders[0],
        pointer,
        liveRegions: afterKeys.liveRegions,
      });

      await open('default-step', theme, stylesheet);
      const plain = await accessibleSliders();
      const plainText = await page
        .locator('#storybook-root')
        .evaluate((root) => root.textContent);
      assert.equal(plainText, 'Level');
      assert.equal(plain.sliders[0].name, 'Level');
      assert.equal(
        await page
          .locator('#storybook-root')
          .getByRole('slider')
          .getAttribute('aria-valuetext'),
        null,
      );
      record('label-only default unchanged', {
        ...variant,
        text: plainText,
        slider: plain.sliders[0],
      });

      await open('disabled', theme, stylesheet);
      const disabled = page.locator('#storybook-root').getByRole('slider');
      await disabled.focus().catch(() => undefined);
      await page.keyboard.press('ArrowRight');
      assert.equal(await disabled.inputValue(), '60');
      assert.equal((await accessibleSliders()).sliders[0].disabled, true);
      record('disabled stays inert', { ...variant, value: 60 });
    }
  }
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  assert.deepEqual(assertionErrors, [], 'No failing play functions');
  process.stdout.write('PASS Slider browser acceptance\n');
} finally {
  await browser.close();
}
