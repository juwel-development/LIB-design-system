import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// CHOICES_STORYBOOK_URL=http://localhost:6026 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/choices.mjs
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const base = process.env.CHOICES_STORYBOOK_URL ?? 'http://localhost:6026';
const artifacts = process.env.CHOICES_ARTIFACTS ?? '/tmp/lib156-browser';
mkdirSync(artifacts, { recursive: true });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const record = (name, result) =>
  process.stdout.write(`${JSON.stringify({ name, ...result })}\n`);
const settle = async () => {
  await page.evaluate(() => document.fonts.ready);
  for (let frame = 0; frame < 4; frame++)
    await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.evaluate(() =>
    Promise.allSettled(
      document.getAnimations().map((animation) => animation.finished),
    ),
  );
};
const resize = async (width, height = 720) => {
  await page.setViewportSize({ width, height });
  await settle();
};
const open = async (story, theme, stylesheet) => {
  await page.goto(
    `${base}/iframe.html?id=interaction-choices${story.startsWith('filter--') ? '-' : '--'}${story}&viewMode=story&globals=theme:${theme}`,
  );
  await page.getByRole('radiogroup').waitFor();
  await page.waitForFunction(
    (dark) => document.documentElement.classList.contains('dark') === dark,
    theme === 'dark',
  );
  if (stylesheet) {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll(
        'style[data-vite-dev-id],link[rel="stylesheet"]',
      ))
        element.remove();
      assertNoStyles();
      function assertNoStyles() {
        if (
          document.querySelector(
            'style[data-vite-dev-id],link[rel="stylesheet"]',
          )
        )
          throw Error('Source stylesheet remained');
      }
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
const geometry = () =>
  page.getByRole('radiogroup').evaluate((group) => {
    const rect = (element) => {
      const bounds = element.getBoundingClientRect();
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        bottom: bounds.bottom,
        right: bounds.right,
      };
    };
    const choices = [...group.querySelectorAll(':scope > [role=radio]')].map(
      (choice) => ({
        ...rect(choice),
        name: choice.textContent,
        value: choice.dataset.value,
        checked: choice.getAttribute('aria-checked'),
        background: getComputedStyle(choice).backgroundColor,
        border: getComputedStyle(choice).borderColor,
        nameColor: getComputedStyle(choice.querySelector('[id]')).color,
        marker: !!choice.querySelector('[data-choice-marker-dot]'),
        describedBy: choice.getAttribute('aria-describedby'),
        scrollWidth: choice.scrollWidth,
        clientWidth: choice.clientWidth,
        text: [...choice.querySelectorAll('[id]')].map((text) => ({
          ...rect(text),
          scrollWidth: text.scrollWidth,
          clientWidth: text.clientWidth,
          overflow: getComputedStyle(text).overflow,
          ellipsis: getComputedStyle(text).textOverflow,
        })),
      }),
    );
    const controls = document.querySelector(
      '[data-testid="search-clear-count"]',
    );
    return {
      width: innerWidth,
      height: innerHeight,
      group: rect(group),
      choices,
      controls: controls ? rect(controls) : undefined,
      documentWidth: document.documentElement.scrollWidth,
      surface: getComputedStyle(group)
        .getPropertyValue('--color-surface')
        .trim(),
    };
  });
const readable = (result) => {
  assert.ok(
    result.documentWidth <= result.width,
    'No document-wide horizontal scroll',
  );
  assert.equal(
    result.choices.filter((choice) => choice.checked === 'true').length,
    1,
  );
  assert.equal(
    result.choices.filter((choice) => choice.marker).length,
    1,
    'One visible non-color-only marker',
  );
  for (const choice of result.choices) {
    assert.equal(
      choice.background,
      'rgba(0, 0, 0, 0)',
      'Keep the existing unfilled appearance',
    );
    if (choice.checked === 'true')
      assert.equal(
        choice.border,
        choice.nameColor,
        'Keep the selected foreground boundary',
      );
    assert.ok(
      choice.x >= result.group.x - 1 && choice.right <= result.group.right + 1,
      'Choice stays in its group',
    );
    assert.ok(
      choice.scrollWidth <= choice.clientWidth + 1,
      'Choice text does not overflow',
    );
    for (const text of choice.text) {
      assert.ok(
        text.scrollWidth <= text.clientWidth + 1,
        'Names and descriptions wrap',
      );
      assert.notEqual(text.overflow, 'hidden');
      assert.notEqual(text.ellipsis, 'ellipsis');
    }
  }
};
const focus = async (value) => {
  await settle();
  const result = await page
    .getByRole('radio', { checked: true })
    .evaluate((choice) => {
      const bounds = choice.getBoundingClientRect();
      const style = getComputedStyle(choice);
      const extent =
        parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
      return {
        value: choice.dataset.value,
        focused: document.activeElement === choice,
        outline: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        y: bounds.y,
        bottom: bounds.bottom,
        height: innerHeight,
        extent,
      };
    });
  assert.equal(result.value, value);
  assert.equal(result.focused, true);
  assert.equal(result.outline, 'solid');
  assert.ok(parseFloat(result.outlineWidth) > 0);
  assert.ok(
    result.y >= result.extent - 1 &&
      result.bottom + result.extent <= result.height + 1,
    'Native focus reveals the entire choice and ring',
  );
  return result;
};

try {
  record('runtime', { browser: browser.version(), base });
  for (const [theme, stylesheet] of [
    ['light', undefined],
    ['dark', undefined],
    ['light', 'styles.css'],
    ['dark', 'styles.css'],
    ['light', 'styles.light.css'],
    ['dark', 'styles.dark.css'],
  ]) {
    for (const locale of ['english', 'german']) {
      await resize(1280);
      await open(`filter--${locale}`, theme, stylesheet);
      const reference = await geometry();
      readable(reference);
      assert.ok(
        theme === 'dark'
          ? reference.surface === '#0f172a'
          : ['#fff', '#ffffff'].includes(reference.surface),
        'The requested shipped theme is active',
      );
      assert.equal(
        reference.group.width,
        892,
        'Actual #316 reference head allocation',
      );
      assert.equal(
        new Set(reference.choices.map((choice) => choice.y)).size,
        1,
        'All five fit one row',
      );
      assert.ok(reference.group.height < 50, 'Compact head row');
      assert.ok(
        reference.controls.y >= reference.group.bottom + 7,
        'Search/Clear/count remains the second logical row',
      );
      assert.ok(
        new Set(reference.choices.map((choice) => choice.width)).size > 2,
        'Content widths, not equal distribution',
      );
      assert.ok(
        reference.choices.at(-1).right < reference.group.right - 50,
        'No surplus-width stretching',
      );
      assert.ok(
        reference.choices.every((choice) => choice.describedBy === null),
      );
      record('reference head', {
        locale,
        theme,
        stylesheet: stylesheet ?? 'source',
        ...reference,
      });
      if (stylesheet?.startsWith('styles.'))
        await page.screenshot({
          path: `${artifacts}/${locale}-${theme}-1280.png`,
        });
      await page.getByRole('tabpanel').focus();
      await page.keyboard.press('Tab');
      const positions = [];
      positions.push(await focus('all'));
      for (const [key, value] of [
        ['ArrowRight', 'ar'],
        ['ArrowDown', 'research'],
        ['ArrowRight', 'songwriting'],
        ['ArrowRight', 'producer'],
        ['ArrowDown', 'all'],
        ['ArrowUp', 'producer'],
        ['ArrowLeft', 'songwriting'],
      ]) {
        await page.keyboard.press(key);
        positions.push(await focus(value));
      }
      for (const width of [800, 320]) {
        await resize(width);
        const narrow = await geometry();
        readable(narrow);
        if (width === 320)
          assert.ok(
            new Set(narrow.choices.map((choice) => choice.y)).size > 1,
            'Narrow allocations wrap',
          );
        const checked = await page
          .getByRole('radio', { checked: true })
          .getAttribute('data-value');
        assert.equal(checked, 'songwriting', 'Selection survives resize');
        await page.keyboard.press('ArrowRight');
        positions.push(await focus('producer'));
        await page.keyboard.press('ArrowRight');
        positions.push(await focus('all'));
        await page.keyboard.press('ArrowLeft');
        positions.push(await focus('producer'));
        await page.keyboard.press('ArrowLeft');
        positions.push(await focus('songwriting'));
        if (width === 320 && stylesheet?.startsWith('styles.'))
          await page.screenshot({
            path: `${artifacts}/${locale}-${theme}-320-focus.png`,
          });
        record('narrow wrap', {
          locale,
          theme,
          stylesheet: stylesheet ?? 'source',
          ...narrow,
        });
      }
      await resize(1280);
      await page.keyboard.press('ArrowRight');
      positions.push(await focus('producer'));
      assert.equal(
        await page.getByRole('cell').count(),
        1,
        'The controlled filter updates the same table',
      );
      await page.keyboard.press('Tab');
      assert.equal(
        await page
          .getByRole('textbox')
          .evaluate((element) => document.activeElement === element),
        true,
      );
      await page.keyboard.press('Shift+Tab');
      positions.push(await focus('producer'));
      await page.getByRole('button', { name: /Clear|Zurücksetzen/ }).click();
      assert.equal(
        await page
          .getByRole('radio', { checked: true })
          .getAttribute('data-value'),
        'all',
      );
      assert.equal(
        await page.getByRole('cell').count(),
        4,
        'Clear restores the filter',
      );
      record('keyboard across lines and resize', {
        locale,
        theme,
        stylesheet: stylesheet ?? 'source',
        positions,
      });
    }
    for (const story of ['long-descriptions', 'wrapping-long-text']) {
      for (const width of [1280, 320]) {
        await resize(width);
        await open(story, theme, stylesheet);
        const result = await geometry();
        readable(result);
        assert.equal(result.choices.length, 3);
        assert.ok(
          result.choices.every((choice) => choice.describedBy !== null),
        );
        await page.getByRole('radio', { checked: true }).focus();
        await page.keyboard.press('ArrowUp');
        record('long words and descriptions', {
          story,
          theme,
          stylesheet: stylesheet ?? 'source',
          ...result,
          focus: await focus('unbroken'),
        });
      }
    }
    await resize(1280);
    await open('vertical-label-only', theme, stylesheet);
    const vertical = await geometry();
    readable(vertical);
    assert.equal(new Set(vertical.choices.map((choice) => choice.y)).size, 3);
    assert.ok(
      vertical.choices.every((choice) => choice.width === vertical.group.width),
    );
    record('vertical default', {
      theme,
      stylesheet: stylesheet ?? 'source',
      ...vertical,
    });
    for (const story of ['inert-with-retained-selection', 'wrapping-inert']) {
      await open(story, theme, stylesheet);
      const radios = page.getByRole('radio');
      for (const radio of await radios.all()) {
        assert.equal(await radio.isDisabled(), true);
        assert.equal(await radio.getAttribute('tabindex'), '-1');
      }
      assert.equal(await page.getByRole('radio', { checked: true }).count(), 1);
      await page.keyboard.press('Tab');
      assert.equal(
        await radios.evaluateAll((choices) =>
          choices.includes(document.activeElement),
        ),
        false,
      );
      record('inert', {
        theme,
        stylesheet: stylesheet ?? 'source',
        story,
        radios: await radios.count(),
      });
    }
    await open('unanswered-requests', theme, stylesheet);
    const before = page.getByRole('button', { name: 'Before choices' });
    const daily = page.getByRole('radio', { name: 'Daily digest' });
    const weekly = page.getByRole('radio', { name: 'Weekly summary' });
    await before.focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await daily.evaluate((choice) => document.activeElement === choice),
      true,
    );
    await page.keyboard.press('ArrowRight');
    assert.equal(
      await weekly.evaluate((choice) => document.activeElement === choice),
      true,
    );
    await page
      .getByText('Requests: 1; submissions: 0', { exact: true })
      .waitFor();
    assert.equal(
      await daily.getAttribute('aria-checked'),
      'true',
      'Unanswered arrow request does not change selection',
    );
    await page.keyboard.press('Enter');
    await page
      .getByText('Requests: 2; submissions: 0', { exact: true })
      .waitFor();
    await page.keyboard.press('Space');
    await page
      .getByText('Requests: 3; submissions: 0', { exact: true })
      .waitFor();
    await weekly.click();
    await page
      .getByText('Requests: 4; submissions: 0', { exact: true })
      .waitFor();
    await daily.click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page
      .getByText('Requests: 4; submissions: 0', { exact: true })
      .waitFor();
    assert.equal(await daily.getAttribute('aria-checked'), 'true');
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .getByRole('button', { name: 'After choices' })
        .evaluate((element) => document.activeElement === element),
      true,
    );
    record(
      'native activation, selected silence, unanswered requests and no form submission',
      {
        theme,
        stylesheet: stylesheet ?? 'source',
        requests: 4,
        submissions: 0,
      },
    );
  }
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  process.stdout.write('PASS Choices browser acceptance\n');
} finally {
  await browser.close();
}
