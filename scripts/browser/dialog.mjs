import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// npm exec --yes --package=playwright -- node scripts/browser/dialog.mjs
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const base = process.env.DIALOG_STORYBOOK_URL ?? 'http://localhost:6014';
const artifacts = process.env.DIALOG_ARTIFACTS ?? '/tmp/ticket-154-evidence';
mkdirSync(artifacts, { recursive: true });
const records = [];
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(String(error)));
const settle = async () => {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.waitForTimeout(100);
};
const geometry = () =>
  page.evaluate(() => {
    const rect = (element) => {
      if (!element) return undefined;
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        bottom: box.bottom,
        client: element.clientHeight,
        scroll: element.scrollHeight,
        offset: element.scrollTop,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflow: style.overflowY,
        tabIndex: element.getAttribute('tabindex'),
      };
    };
    const dialog = document.querySelector('dialog');
    const table = dialog.querySelector('table');
    return {
      viewport: { width: innerWidth, height: innerHeight },
      dialog: rect(dialog),
      content: rect(
        dialog.querySelector('[data-testid="summary-content"]') ??
          dialog.querySelector('[data-dialog-member="content"]'),
      ),
      table: rect(table?.parentElement),
      header: rect(table?.querySelector('thead')),
      fixed: [
        ...dialog.querySelectorAll(
          '[data-dialog-member="title"], [data-dialog-member="description"], [data-dialog-member="actions"], [data-testid="summary-pane"]>div:last-child',
        ),
      ].map(rect),
      document: rect(document.scrollingElement),
      focused: document.activeElement?.textContent,
      rows: [...(table?.querySelectorAll('tbody tr') ?? [])].map(
        (row) => row.textContent,
      ),
    };
  });
const record = async (label) => {
  const result = await geometry();
  records.push({ label, ...result });
  writeFileSync(`${artifacts}/geometry.json`, JSON.stringify(records, null, 2));
  process.stdout.write(`${JSON.stringify({ label, ...result })}\n`);
  return result;
};
const open = async (story = 'layout-dialog--bounded-summary') => {
  await page.goto(`${base}/iframe.html?id=${story}&viewMode=story`);
  await page
    .getByRole('button', { name: 'Review recordings', exact: true })
    .click();
  await page.getByRole('dialog').waitFor();
  await settle();
};
const resize = async (width, height) => {
  await page.setViewportSize({ width, height });
  await settle();
};
const bounded = (result) => {
  assert(
    result.table.client > 60 && result.table.scroll > result.table.client,
    'Table has a usable independently scrolling viewport',
  );
  assert.equal(
    result.table.tabIndex,
    '0',
    'Overflowing Table is keyboard reachable',
  );
  assert(
    result.dialog.scroll <= result.dialog.client + 1 &&
      result.dialog.offset === 0,
    'Dialog stays still',
  );
  assert(
    result.content.scroll <= result.content.client + 1,
    'Content adds no scroll region',
  );
  assert(
    result.document.scroll <= result.document.client + 1,
    'Document stays still',
  );
  for (const box of [...result.fixed, result.header])
    assert(
      box.y >= result.dialog.y && box.bottom <= result.dialog.bottom + 1,
      'All fixed regions are visible together',
    );
};
const fallback = (result) => {
  assert.equal(
    result.dialog.overflow,
    'auto',
    'Whole dialog owns fallback overflow',
  );
  assert(
    result.dialog.scroll > result.dialog.client,
    'Fallback has one whole-task scroll range',
  );
  assert(
    result.table.scroll <= result.table.client + 1,
    'Table releases its height',
  );
  assert.equal(
    result.table.overflow,
    'visible',
    'Table contributes no independent scroll region',
  );
  assert.notEqual(
    result.table.tabIndex,
    '0',
    'Fallback contributes no Table scroll stop',
  );
  assert.equal(result.content.overflow, 'visible');
  assert.equal(result.document.offset, 0, 'Background stays still');
};
const noHorizontalOverflow = (result) => {
  for (const box of [
    result.dialog,
    result.content,
    result.table,
    result.document,
  ])
    assert(
      box.scrollWidth <= box.clientWidth + 1,
      'Wrapping content adds no horizontal overflow',
    );
};
const press = async (key) => {
  await page.keyboard.press(key);
  await page.waitForTimeout(200);
  await settle();
};
const retainedFocusVisible = () =>
  page.evaluate(() => {
    const focused = document.activeElement.getBoundingClientRect();
    const modal = document.querySelector('dialog').getBoundingClientRect();
    const style = getComputedStyle(document.activeElement);
    const ring =
      style.outlineStyle === 'none'
        ? 0
        : parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
    return (
      focused.top - ring >= modal.top && focused.bottom + ring <= modal.bottom
    );
  });
const change = async (name) => {
  // These consumer controls sit outside the modal; invoke their real click handler to change
  // consumer state while the background is inert, without reaching into component state.
  await page
    .getByRole('button', { name, exact: true, includeHidden: true })
    .evaluate((button) => button.click());
  await settle();
};
const tableElement = () => page.getByRole('dialog').getByRole('table');
const scrollTable = async () => {
  const modal = page.getByRole('dialog');
  await modal.getByRole('button').first().focus();
  await press('Shift+Tab');
  assert(
    await page.evaluate(
      () =>
        document.activeElement ===
        document.querySelector('dialog table').parentElement,
    ),
    'Keyboard reaches named Table scroll stop',
  );
  const ring = await page.evaluate(() => ({
    width: getComputedStyle(document.activeElement).outlineWidth,
    style: getComputedStyle(document.activeElement).outlineStyle,
  }));
  assert.equal(ring.style, 'solid');
  assert(Number.parseFloat(ring.width) > 0, 'Keyboard focus is visible');
  for (let attempt = 0; attempt < 30; attempt++) {
    const atEnd = await tableElement()
      .locator('..')
      .evaluate(
        (wrapper) =>
          wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 1,
      );
    if (atEnd) break;
    await press('PageDown');
  }
  const result = await record('keyboard Table to final row');
  assert(
    result.table.offset > 0 &&
      result.dialog.offset === 0 &&
      result.document.offset === 0,
    'Only Table scrolls by keyboard',
  );
  assert(result.header.y >= result.table.y, 'Header remains pinned');
  const final = await tableElement().getByRole('row').last().boundingBox();
  assert(
    final.y + final.height <= result.table.bottom + 1,
    'Last row is visible after keyboard scrolling',
  );
  await press('Tab');
  assert(await retainedFocusVisible(), 'Tab reaches visible Cancel');
};
const checkIdentity = async () => {
  assert(
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('dialog tbody tr')];
      return (
        rows.length === 33 &&
        rows[0].textContent === 'Harbour recording 08' &&
        rows[1].textContent === rows[2].textContent &&
        rows[1] !== rows[2] &&
        rows.at(-1).textContent === 'Harbour recording 40'
      );
    }),
    'Immutable duplicate titles and row order survive',
  );
};
try {
  await resize(1280, 720);
  await page.goto(
    `${base}/iframe.html?id=layout-dialog--replacement&viewMode=story`,
  );
  await page.getByRole('button', { name: 'Start task', exact: true }).waitFor();
  await page.evaluate(() => {
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
    document.body.style.minHeight = '2000px';
  });
  await page.getByRole('button', { name: 'Start task', exact: true }).click();
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const [action, name] of [
      ['Continue to next task', 'Second task'],
      ['Return to first task', 'First task'],
    ]) {
      await page
        .getByRole('dialog')
        .getByRole('button', { name: action })
        .click();
      await settle();
      await page.mouse.move(20, 100);
      await page.mouse.wheel(0, 500);
      await settle();
      const replacement = await page.evaluate(() => ({
        overflow: document.documentElement.style.overflow,
        offset: window.scrollY,
        open: document.querySelectorAll('dialog[open]').length,
        modal: document.querySelectorAll('dialog:modal').length,
      }));
      records.push({
        label: `replacement ${name} cycle ${cycle}`,
        ...replacement,
      });
      assert.equal(
        replacement.overflow,
        'hidden',
        'Replacement keeps the page locked',
      );
      assert.equal(
        replacement.offset,
        0,
        'Replacement blocks background wheel scrolling',
      );
      assert.equal(replacement.open, 1, 'Only the replacement is open');
      assert.equal(
        replacement.modal,
        1,
        'Replacement preserves native modality',
      );
      assert(await page.getByRole('dialog', { name, exact: true }).isVisible());
    }
  }
  await page.getByRole('button', { name: 'Close task', exact: true }).click();
  await settle();
  const restored = await page.evaluate(() => ({
    overflow: document.documentElement.style.overflow,
    priority: document.documentElement.style.getPropertyPriority('overflow'),
  }));
  assert.deepEqual(restored, { overflow: 'auto', priority: 'important' });
  records.push({
    label: 'replacement restores original page overflow',
    ...restored,
  });
  await page.mouse.wheel(0, 500);
  await press('PageDown');
  assert(
    await page.evaluate(() => window.scrollY > 0),
    'Closed task releases background scrolling',
  );
  for (const stylesheet of [
    'styles.css',
    'styles.light.css',
    'styles.dark.css',
  ]) {
    for (const locale of ['en', 'de']) {
      await resize(1280, 720);
      await open(
        `layout-dialog--bounded-summary${locale === 'de' ? '-german' : ''}`,
      );
      await page.evaluate((dark) => {
        for (const element of document.querySelectorAll(
          'style[data-vite-dev-id], link[rel="stylesheet"]',
        ))
          element.remove();
        document.documentElement.classList.toggle('dark', dark);
      }, stylesheet === 'styles.dark.css');
      await page.addStyleTag({
        content: readFileSync(
          new URL(`../../dist/${stylesheet}`, import.meta.url),
          'utf8',
        ),
      });
      await settle();
      for (const [width, height] of [
        [1920, 1080],
        [1280, 720],
        [1024, 720],
        [800, 720],
      ]) {
        await resize(width, height);
        const result = await record(
          `${stylesheet} ${locale} ${width}x${height} bounded`,
        );
        bounded(result);
        noHorizontalOverflow(result);
        await checkIdentity();
        await scrollTable();
        await page.screenshot({
          path: `${artifacts}/${stylesheet}-${locale}-${width}.png`,
        });
      }
      await resize(1280, 720);
      const originalTable = await tableElement().elementHandle();
      await page.getByRole('dialog').getByRole('button').first().focus();
      for (let cycle = 0; cycle < 3; cycle++) {
        await page.getByRole('dialog').getByRole('button').first().focus();
        await resize(1280, 300);
        fallback(
          await record(`${stylesheet} ${locale} fallback cycle ${cycle}`),
        );
        assert(
          await retainedFocusVisible(),
          'Fallback reveals retained action focus',
        );
        await press('Tab');
        assert(
          await retainedFocusVisible(),
          'Final action is reachable by Tab',
        );
        if (cycle === 0)
          await page.screenshot({
            path: `${artifacts}/${stylesheet}-${locale}-fallback-end.png`,
          });
        await press('Home');
        for (
          let attempt = 0;
          attempt < 30 && (await geometry()).dialog.offset > 0;
          attempt++
        )
          await press('PageUp');
        if (cycle === 0)
          await page.screenshot({
            path: `${artifacts}/${stylesheet}-${locale}-fallback-start.png`,
          });
        assert.equal(
          (await geometry()).dialog.offset,
          0,
          'Keyboard reaches title at start of whole dialog',
        );
        for (let attempt = 0; attempt < 30; attempt++) {
          const current = (await geometry()).dialog;
          if (current.offset + current.client >= current.scroll - 1) break;
          await press('PageDown');
        }
        assert(
          await retainedFocusVisible(),
          'Keyboard reaches final action at end of whole dialog',
        );
        await resize(1280, 720);
        bounded(
          await record(`${stylesheet} ${locale} restored cycle ${cycle}`),
        );
        assert(
          await originalTable.evaluate(
            (element) => element === document.querySelector('dialog table'),
          ),
          'Resize preserves table identity',
        );
        await checkIdentity();
      }
      await page.getByRole('dialog').getByRole('button').first().focus();
      await press('Shift+Tab');
      await resize(1280, 300);
      fallback(
        await record(`${stylesheet} ${locale} focused Table releases stop`),
      );
      assert(
        await originalTable.evaluate(
          (element) => element.parentElement === document.activeElement,
        ),
        'Removing fallback tabindex preserves active element',
      );
      await resize(1280, 720);
      bounded(await geometry());
      await change('Translate summary');
      bounded(await record(`${stylesheet} ${locale} translated while open`));
      await change('Change recordings');
      const short = await record(`${stylesheet} short content while focused`);
      assert(
        short.table.client >= short.table.scroll - 1,
        'Short table stays natural',
      );
      await press('Tab');
      assert.equal(
        await tableElement().locator('..').getAttribute('tabindex'),
        null,
        'Short table drops scroll stop after blur',
      );
      await change('Change recordings');
      assert.equal(
        await tableElement().getByRole('row').count(),
        1,
        'Empty table keeps its header and name',
      );
      await change('Change recordings');
      bounded(await geometry());
      await resize(1280, 300);
      await change('Change recordings');
      fallback(await record(`${stylesheet} short content in fallback`));
      await change('Change recordings');
      await change('Change recordings');
      await resize(1280, 720);
      bounded(await geometry());
      await page.evaluate(
        () => (document.documentElement.style.fontSize = '24px'),
      );
      await settle();
      fallback(await record(`${stylesheet} enlarged typography fallback`));
      await page.evaluate(() => (document.documentElement.style.fontSize = ''));
      await settle();
      bounded(await geometry());
      for (const height of [
        650, 600, 590, 580, 560, 540, 520, 480, 400, 300, 720,
      ]) {
        await resize(1280, height);
        const threshold = await record(
          `${stylesheet} ${locale} usable-row threshold ${height}`,
        );
        if (threshold.dialog.overflow === 'auto') fallback(threshold);
        else {
          bounded(threshold);
          const minimum = await tableElement().evaluate((table) => {
            const style = getComputedStyle(table.parentElement);
            const fixed = [...table.children]
              .filter((child) => child.matches('caption,thead'))
              .reduce(
                (sum, child) => sum + child.getBoundingClientRect().height,
                0,
              );
            return (
              fixed +
              Math.max(
                ...[...table.querySelectorAll('tbody>tr')].map(
                  (row) => row.getBoundingClientRect().height,
                ),
              ) +
              parseFloat(style.paddingTop) +
              parseFloat(style.paddingBottom)
            );
          });
          assert(
            threshold.table.client + 1 >= minimum,
            'Bounded mode holds header, a complete wrapped row and focus room',
          );
        }
      }
      await page.evaluate(() => {
        window.retainedFallbackFocus = document.activeElement;
        window.fallbackChanges = 0;
        window.fallbackObserver = new MutationObserver(
          (records) => (window.fallbackChanges += records.length),
        );
        window.fallbackObserver.observe(document.querySelector('dialog'), {
          attributes: true,
          attributeFilter: ['data-dialog-unusable'],
        });
      });
      await resize(1280, 300);
      await settle();
      await page.evaluate(() => (window.fallbackChanges = 0));
      for (let frame = 0; frame < 8; frame++) await settle();
      assert.equal(
        await page.evaluate(() => window.fallbackChanges),
        0,
        'Fallback settles without allocation oscillation',
      );
      await page.evaluate(() => window.fallbackObserver.disconnect());
      await resize(1280, 720);
      bounded(await geometry());
      await page.evaluate(() => (document.body.style.minHeight = '2000px'));
      await page.mouse.move(20, 100);
      await page.mouse.wheel(0, 500);
      await settle();
      assert.equal(
        await page.evaluate(() => window.scrollY),
        0,
        'Modal locks a tall background document',
      );
      assert(
        await page.evaluate(() =>
          document.querySelector('dialog').matches(':modal'),
        ),
        'Native modality remains active',
      );
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await settle();
      assert.equal(
        await page
          .getByRole('button', { name: 'Review recordings', exact: true })
          .evaluate((button) => button === document.activeElement),
        true,
        'Dismissal restores the opener',
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.style.overflow),
        '',
        'Closing restores document overflow',
      );
      await page.getByText('Dismissed', { exact: true }).waitFor();
      await page.evaluate(() => (document.body.style.minHeight = ''));
      await page
        .getByRole('button', { name: 'Review recordings', exact: true })
        .click();
      await settle();
      await page.getByRole('dialog').getByRole('button').first().click();
      await page.getByText('Cancelled', { exact: true }).waitFor();
      await settle();
      await page
        .getByRole('button', { name: 'Review recordings', exact: true })
        .click();
      await settle();
      await page.getByRole('dialog').getByRole('button').last().click();
      await page.getByText('Confirmed', { exact: true }).waitFor();
      await settle();
      await change('Fresh lifecycle');
      await page
        .getByRole('button', { name: 'Review recordings', exact: true })
        .click();
      await settle();
      bounded(await record(`${stylesheet} fresh lifecycle reopening`));
      await change('Fresh lifecycle');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await page
        .getByRole('button', { name: 'Review recordings', exact: true })
        .click();
      await settle();
      await page.mouse.click(10, 10);
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await page.getByText('Dismissed', { exact: true }).waitFor();
    }
  }
  for (const variant of ['short', 'empty', 'screen']) {
    await resize(1280, 720);
    await open(`layout-dialog--bounded-summary-${variant}`);
    const result = await record(`existing theme nested ${variant}`);
    if (variant === 'screen') {
      bounded(result);
      await resize(1280, 300);
      fallback(await record('screen extent fallback'));
      await resize(1280, 720);
      bounded(await geometry());
    } else {
      assert(result.table.client >= result.table.scroll - 1);
      assert(
        result.dialog.height < 672,
        'Short or empty content retains natural dialog height',
      );
      assert.equal(result.table.tabIndex, null);
    }
  }
  // Direct Dialog -> Table and body-owned Content retain their existing contracts.
  for (const story of [
    'display-table--bounded-dialog',
    'display-table--bounded-content-dialog',
  ]) {
    await resize(1280, 720);
    await page.goto(`${base}/iframe.html?id=${story}&viewMode=story`);
    await page.getByRole('dialog').waitFor();
    await settle();
    bounded(await record(story));
    await resize(1280, 200);
    fallback(await record(`${story} fallback`));
    await resize(1280, 720);
    bounded(await geometry());
    await page
      .getByRole('button', { name: 'Open artist 40', exact: true })
      .focus();
    assert(
      await retainedFocusVisible(),
      'Direct Table reveals final row control',
    );
    await page.keyboard.press('Escape');
  }
  await resize(1280, 720);
  await page.goto(
    `${base}/iframe.html?id=layout-dialog--long-content&viewMode=story`,
  );
  await page
    .getByRole('button', { name: 'Review the contract…', exact: true })
    .click();
  await settle();
  const body = await record('body-owned Content');
  assert(
    body.content.scroll > body.content.client &&
      body.dialog.scroll <= body.dialog.client + 1,
    'Default Content remains scroll owner',
  );
  await resize(1280, 200);
  const bodyFallback = await record('body-owned Content whole-dialog fallback');
  assert.equal(bodyFallback.dialog.overflow, 'auto');
  assert.equal(bodyFallback.content.overflow, 'visible');
  assert(bodyFallback.content.scroll <= bodyFallback.content.client + 1);
  await resize(1280, 720);
  assert.equal((await geometry()).content.overflow, 'auto');
  await page.keyboard.press('Escape');
  await resize(1280, 720);
  await page.goto(
    `${base}/iframe.html?id=layout-pane--bounded-table&viewMode=story`,
  );
  await page
    .getByRole('table', { name: 'Artist roster', exact: true })
    .waitFor();
  await settle();
  const standalone = await page
    .getByRole('table', { name: 'Artist roster', exact: true })
    .locator('..')
    .evaluate((wrapper) => ({
      client: wrapper.clientHeight,
      scroll: wrapper.scrollHeight,
      tabIndex: wrapper.tabIndex,
    }));
  assert(
    standalone.scroll > standalone.client && standalone.tabIndex === 0,
    'Standalone Pane -> Table stays bounded',
  );
  records.push({ label: 'standalone Pane -> Table', ...standalone });
  writeFileSync(`${artifacts}/geometry.json`, JSON.stringify(records, null, 2));
  assert.deepEqual(
    browserErrors,
    [],
    'No browser exceptions during the acceptance matrix',
  );
  process.stdout.write('PASS Dialog browser acceptance\n');
} finally {
  await browser.close();
}
