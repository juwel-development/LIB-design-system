import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// SCREEN_STORYBOOK_URL=http://localhost:6012 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/work-areas.mjs
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const base = process.env.SCREEN_STORYBOOK_URL ?? 'http://localhost:6012';
const failures = [];
page.on('pageerror', (error) => failures.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error' && !/favicon|404/.test(message.text()))
    failures.push(message.text());
});
const settle = async () => {
  await page.evaluate(() => document.fonts.ready);
  for (let frame = 0; frame < 4; frame++)
    await page.evaluate(() => new Promise(requestAnimationFrame));
};
const resize = async (width, height) => {
  await page.setViewportSize({ width, height });
  await settle();
};
const open = async (story, stylesheet) => {
  await page.goto(
    `${base}/iframe.html?id=layout-screen-work-areas--${story}&viewMode=story`,
  );
  await page.getByRole('main').waitFor();
  if (stylesheet) {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll(
        'style[data-vite-dev-id], link[rel="stylesheet"]',
      ))
        element.remove();
    });
    assert.equal(
      await page.evaluate(
        () =>
          document.querySelectorAll(
            'style[data-vite-dev-id], link[rel="stylesheet"]',
          ).length,
      ),
      0,
    );
    await page.addStyleTag({
      content: readFileSync(
        new URL(`../../dist/${stylesheet}`, import.meta.url),
        'utf8',
      ),
    });
  }
  await settle();
};
const record = (label, result) =>
  process.stdout.write(`${JSON.stringify({ label, ...result })}\n`);

const geometry = () =>
  page.evaluate(() => {
    const rect = (element) => {
      if (!element) return undefined;
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        left: bounds.left,
        right: bounds.right,
        width: bounds.width,
        height: bounds.height,
        client: element.clientHeight,
        scroll: element.scrollHeight,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        offset: element.scrollTop,
        content: element.firstElementChild?.getBoundingClientRect().height,
      };
    };
    const byId = (id) => document.querySelector(`[data-testid="${id}"]`);
    const main = document.querySelector('main');
    const alternatives = byId('alternatives');
    const row = ['three-areas', 'grouped-areas', 'two-areas']
      .map(byId)
      .find(Boolean);
    const ids = [...document.querySelectorAll('[id]')].map(
      (element) => element.id,
    );
    const tabs = [...main.querySelectorAll('[role="tab"]')];
    const active = document.activeElement;
    return {
      width: innerWidth,
      height: innerHeight,
      rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
      gap: row ? parseFloat(getComputedStyle(row).columnGap) : undefined,
      mains: document.querySelectorAll('main').length,
      headings: main.querySelectorAll('h1').length,
      document: rect(document.scrollingElement),
      bar: rect(byId('shell').children[0]),
      shell: rect(byId('shell').children[1]),
      navigation: rect(document.querySelector('nav')),
      alternatives: rect(alternatives),
      mounted: ['three-areas', 'grouped-areas', 'two-areas'].filter(byId),
      columns: [...main.querySelectorAll('[data-testid$="-column"]')].map(
        (column) => ({ id: column.dataset.testid, ...rect(column) }),
      ),
      areas: [...main.querySelectorAll('h2')].map(
        (heading) => heading.textContent,
      ),
      tabs: tabs.map((tab) => ({
        label: tab.textContent,
        selected: tab.getAttribute('aria-selected') === 'true',
        tabIndex: tab.tabIndex,
        controls: tab.getAttribute('aria-controls'),
        panelLabelledBy: document
          .getElementById(tab.getAttribute('aria-controls'))
          ?.getAttribute('aria-labelledby'),
        id: tab.id,
        ...rect(tab),
      })),
      tabRow: rect(main.querySelector('[role="tablist"]')),
      panels: [...main.querySelectorAll('[role="tabpanel"]')].map((panel) => ({
        hidden: panel.hidden,
        children: panel.childElementCount,
      })),
      pool: {
        head: rect(byId('pool-head')),
        body: rect(byId('pool-body')),
      },
      sides: {
        head: rect(byId('sides-head')),
        body: rect(byId('sides-body')),
      },
      release: {
        head: rect(byId('release-head')),
        body: rect(byId('release-body')),
        foot: rect(byId('release-foot')),
      },
      line: parseFloat(getComputedStyle(main).lineHeight),
      released: document.querySelectorAll('[data-screen-unusable]').length,
      duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      owners: {
        title: document.querySelectorAll('[name="title"]').length,
        matrix: document.querySelectorAll('[name="matrix"]').length,
        medium: document.querySelectorAll('[name="medium"]').length,
        complete: [...main.querySelectorAll('button')].filter(
          (button) => button.type === 'button' && !button.closest('[role]'),
        ).length,
      },
      title: document.querySelector('[name="title"]')?.value,
      matrix: document.querySelector('[name="matrix"]')?.value,
      matrixRetained:
        window.matrixNode === undefined
          ? undefined
          : window.matrixNode === document.querySelector('[name="matrix"]'),
      placed: byId('placed-count')?.textContent,
      focus:
        active === document.body
          ? 'document'
          : `${active.tagName.toLowerCase()}:${active.getAttribute('name') ?? active.getAttribute('role') ?? active.textContent}`,
    };
  });

const bodiesOf = (result) =>
  [result.pool.body, result.sides.body, result.release.body].filter(Boolean);
const fixedOf = (result) =>
  [
    result.pool.head,
    result.sides.head,
    result.release.head,
    result.release.foot,
  ].filter(Boolean);
const tops = (result) =>
  new Set(result.columns.map((column) => Math.round(column.top)));
// The documented thresholds, from the fixture theme: 20rem and 22rem minimums, equal weights.
const threeAreas = (result) => 3 * 22 * result.rootFont + 2 * result.gap;
const twoAreas = (result) => 2 * 22 * result.rootFont + result.gap;

const still = (result) => {
  assert.equal(result.mains, 1);
  assert.equal(result.headings, 1);
  assert.deepEqual(result.duplicateIds, [], 'No duplicate ids');
  assert(
    result.document.scrollWidth <= result.width,
    'No horizontal document overflow',
  );
  assert(
    result.shell.scrollWidth <= result.shell.clientWidth,
    'No horizontal body overflow',
  );
  assert(
    result.document.scroll <= result.document.client,
    'Document remains still',
  );
  assert(
    Math.abs(result.bar.top) < 1 && result.bar.bottom <= result.shell.top + 1,
    'Bar stays at the top',
  );
};
const bounded = (result, long = true) => {
  still(result);
  assert.equal(result.released, 0, 'No panel is released');
  assert(
    result.shell.scroll <= result.shell.client + 1,
    'Reference fit has no Shell overflow',
  );
  assert(
    result.navigation.right <= result.alternatives.left &&
      result.navigation.bottom <= result.height,
    'Sidebar stays beside the content',
  );
  assert.equal(tops(result).size, 1, 'Columns share one row');
  for (const region of fixedOf(result))
    assert(
      region.top >= result.shell.top && region.bottom <= result.height,
      'Fixed facts and actions are visible',
    );
  for (const body of bodiesOf(result)) {
    assert(body.bottom <= result.height, 'Body ends inside the window');
    assert(
      body.client >= result.line,
      'Body shows at least a complete text line',
    );
    if (long) assert(body.scroll > body.client, 'Body bounds long content');
    else assert(body.client <= body.content + 1, 'Short body is not stretched');
  }
};
const three = (result, long) => {
  bounded(result, long);
  assert.deepEqual(result.mounted, ['three-areas']);
  assert.deepEqual(
    result.columns.map((column) => column.id),
    ['pool-column', 'sides-column', 'release-column'],
  );
  assert.equal(result.areas.length, 3, 'Three areas, each mounted once');
  assert.equal(result.tabs.length, 0, 'No tab controls');
  assert(result.alternatives.width >= threeAreas(result), 'Three areas fit');
  assert(
    Math.abs(result.columns[2].right - result.alternatives.right) < 1,
    'The row uses the whole width',
  );
};
const grouped = (result, selected, long) => {
  bounded(result, long);
  assert.deepEqual(result.mounted, ['grouped-areas']);
  assert.deepEqual(
    result.columns.map((column) => column.id),
    ['group-column', 'sides-column'],
  );
  assert(
    result.alternatives.width < threeAreas(result) &&
      result.alternatives.width >= twoAreas(result),
    'Only the grouped arrangement fits',
  );
  assert.equal(result.areas.length, 2, 'One active view beside the sides');
  assert.equal(result.tabs.length, 2);
  assert.deepEqual(
    result.tabs.map((tab) => tab.selected),
    selected === 0 ? [true, false] : [false, true],
  );
  for (const tab of result.tabs)
    assert.equal(tab.panelLabelledBy, tab.id, 'Tab and panel name each other');
  assert.deepEqual(
    result.panels.map((panel) => [panel.hidden, panel.children]),
    selected === 0
      ? [
          [false, 1],
          [true, 0],
        ]
      : [
          [true, 0],
          [false, 1],
        ],
    'The inactive view is absent from the DOM',
  );
  assert(
    result.tabRow.scrollWidth <= result.tabRow.clientWidth + 1,
    'Tab labels fit their row',
  );
  assert(result.sides.head, 'The sides stay beside either tab');
};
const natural = (result) => {
  still(result);
  for (const body of bodiesOf(result))
    assert(body.client >= body.scroll - 1, 'Every body is released');
  assert(result.shell.scroll > result.shell.client, 'Shell owns overflow');
};
// Bounded with a usable body, or released as a whole: never a clipped sliver.
const usable = (result) => {
  still(result);
  if (result.released > 0 || tops(result).size > 1) return natural(result);
  for (const body of bodiesOf(result))
    assert(body.client >= result.line, 'A bounded body keeps a complete line');
  return undefined;
};

// Native Tab through every control in the main; each must come into view when focused.
const traverse = async () => {
  const expected = await page.evaluate(() => {
    const controls = [
      ...document.querySelectorAll(
        'main button, main input, main select, main [tabindex="0"]',
      ),
    ].filter(
      (element) =>
        !element.disabled &&
        element.tabIndex >= 0 &&
        element.getClientRects().length > 0,
    );
    controls.forEach((control, index) => {
      control.dataset.traversal = String(index);
    });
    [...document.querySelectorAll('nav button')].at(-1).focus();
    return controls.length;
  });
  const visited = new Set();
  for (let press = 0; press < expected + 12; press++) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const element = document.activeElement;
      let box = element.getBoundingClientRect();
      let visible = {
        top: Math.max(box.top, 0),
        bottom: Math.min(box.bottom, innerHeight),
        left: Math.max(box.left, 0),
        right: Math.min(box.right, innerWidth),
      };
      for (
        let ancestor = element.parentElement;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        if (
          !/auto|scroll|hidden|clip/.test(getComputedStyle(ancestor).overflow)
        )
          continue;
        box = ancestor.getBoundingClientRect();
        visible = {
          top: Math.max(visible.top, box.top),
          bottom: Math.min(visible.bottom, box.bottom),
          left: Math.max(visible.left, box.left),
          right: Math.min(visible.right, box.right),
        };
      }
      const own = element.getBoundingClientRect();
      return {
        index: element.dataset.traversal,
        name: element.getAttribute('name') ?? element.textContent.slice(0, 40),
        shown:
          visible.bottom - visible.top >= Math.min(own.height, 16) - 0.5 &&
          visible.right - visible.left >= Math.min(own.width, 16) - 0.5,
      };
    });
    if (stop.index === undefined) continue;
    assert(stop.shown, `Focused control is in view: ${stop.name}`);
    visited.add(stop.index);
  }
  assert.equal(visited.size, expected, 'Every control is reachable by Tab');
  return expected;
};

try {
  record('runtime', {
    chromium: browser.version(),
    storybook: base,
  });

  // Reference windows, both locales, source CSS and every delivered stylesheet.
  for (const stylesheet of [
    undefined,
    'styles.css',
    'styles.light.css',
    'styles.dark.css',
  ])
    for (const story of ['english', 'german']) {
      await resize(1920, 1080);
      await open(story, stylesheet);
      const wide = await geometry();
      three(wide);
      record(`${stylesheet ?? 'source'} ${story} 1920x1080 three areas`, wide);
      await resize(1280, 720);
      const laptop = await geometry();
      grouped(laptop, 0);
      record(`${stylesheet ?? 'source'} ${story} 1280x720 grouped`, laptop);
      await page.getByRole('tab').nth(1).click();
      await settle();
      const second = await geometry();
      grouped(second, 1);
      record(`${stylesheet ?? 'source'} ${story} 1280x720 second tab`, second);
      await resize(1920, 1080);
      three(await geometry());
    }

  // Active bodies scroll on their own; the document, the Shell body and the neighbours stay.
  await resize(1280, 720);
  await open('english');
  const offsets = { pool: 0, sides: 0 };
  for (const area of ['pool', 'sides']) {
    await page.getByTestId(`${area}-body`).hover();
    await page.mouse.wheel(0, 400);
    await settle();
    const scrolled = await geometry();
    still(scrolled);
    assert.equal(scrolled.shell.offset, 0, 'Shell body does not scroll');
    assert(scrolled[area].body.offset > 0, 'The hovered body scrolls');
    const neighbour = area === 'pool' ? 'sides' : 'pool';
    assert.equal(
      scrolled[neighbour].body.offset,
      offsets[neighbour],
      'The neighbour keeps its position',
    );
    offsets[area] = scrolled[area].body.offset;
    record(`wheel over ${area} body`, scrolled);
  }

  // Short bodies keep their height; fixed regions and the foot do not move to the bound.
  for (const [width, height] of [
    [1920, 1080],
    [1280, 720],
  ]) {
    await resize(width, height);
    await open('short-bodies');
    const short = await geometry();
    if (width === 1920) {
      three(short, false);
      for (const body of bodiesOf(short))
        assert(body.scroll <= body.client + 1, 'Short content does not scroll');
    } else grouped(short, 0, false);
    record(`short bodies ${width}x${height}`, short);
  }
  await resize(1920, 1080);
  const shortRelease = (await geometry()).release;
  assert(
    shortRelease.foot.top - shortRelease.body.bottom < 16,
    'The foot follows a short body',
  );

  // The two-area case: one declaration, side by side at both windows, no tab and no third track.
  for (const story of ['read-only', 'read-only-german'])
    for (const [width, height] of [
      [1920, 1080],
      [1280, 720],
    ]) {
      await resize(width, height);
      await open(story);
      const pair = await geometry();
      bounded(pair);
      assert.deepEqual(pair.mounted, ['two-areas']);
      assert.deepEqual(
        pair.columns.map((column) => column.id),
        ['sides-column', 'release-column'],
      );
      assert.equal(pair.tabs.length, 0, 'No obsolete tab');
      assert.equal(pair.pool.head, undefined, 'No pool is mounted');
      assert(
        Math.abs(pair.columns[0].width - pair.columns[1].width) < 1 &&
          Math.abs(pair.columns[1].right - pair.alternatives.right) < 1,
        'Two equal columns use the whole width: no reserved track',
      );
      record(`${story} ${width}x${height}`, pair);
    }

  // The boundary is the Alternatives' own width against the documented threshold, exactly.
  await open('english');
  const boundary = [];
  for (let width = 1450; width <= 1466; width++) {
    await resize(width, 800);
    const result = await geometry();
    assert.equal(
      result.mounted[0] === 'three-areas',
      result.alternatives.width >= 3 * 22 * result.rootFont + 2 * result.gap,
      `Selection at ${width} follows the three-area threshold`,
    );
    assert.equal(tops(result).size, 1, 'A selected arrangement is not stacked');
    boundary.push([width, result.alternatives.width, result.mounted[0]]);
  }
  assert(
    boundary.some(
      ([, width, mounted]) => width === 1104 && mounted === 'three-areas',
    ),
    'Equality fits',
  );
  record('three-area boundary sweep', { boundary });
  const stacking = [];
  for (let width = 810; width <= 826; width++) {
    await resize(width, 800);
    const result = await geometry();
    assert.deepEqual(result.mounted, ['grouped-areas'], 'The last one stays');
    assert.equal(
      tops(result).size === 1,
      result.alternatives.width >= twoAreas(result),
      `Stacking at ${width} follows the grouped threshold`,
    );
    stacking.push([width, result.alternatives.width, tops(result).size]);
  }
  record('grouped stacking sweep', { stacking });

  // A re-pointed theme token selects again at an unchanged window.
  await resize(1920, 1080);
  await open('english');
  const repoint = (value) =>
    page.evaluate((minimum) => {
      document
        .querySelector('[data-testid="shell"]')
        .parentElement.style.setProperty('--work-area-min-width', minimum);
    }, value);
  await repoint('40rem');
  await settle();
  const roomy = await geometry();
  assert.deepEqual(roomy.mounted, ['grouped-areas'], 'Token change regroups');
  assert.equal(roomy.width, 1920);
  await repoint('20rem');
  await settle();
  three(await geometry());
  record('token re-pointed at 1920x1080', roomy);

  // Lifecycle: retained, removed and returning content, one owner per control.
  await open('english');
  const title = page.getByRole('textbox', { name: 'Release title' });
  await title.fill('Night Drive II');
  const matrix = page.getByRole('textbox', { name: 'Side A · Matrix' });
  await matrix.fill('A1');
  await matrix.evaluate((element) => {
    window.matrixNode = element;
  });
  await page.getByRole('button', { name: 'Place on side A' }).first().click();
  await title.focus();
  await title.evaluate((element) => element.setSelectionRange(0, 5));
  const before = await geometry();
  assert.equal(before.placed, '1 placed', 'One activation, one emission');
  assert.equal(before.focus, 'input:title');

  await resize(1280, 720);
  const regrouped = await geometry();
  grouped(regrouped, 0);
  assert.equal(
    regrouped.focus,
    'document',
    'Focus is not left in removed content',
  );
  assert.equal(regrouped.owners.title, 0, 'The inactive view is not kept');
  assert.equal(
    regrouped.matrixRetained,
    true,
    'The sides column stays mounted',
  );
  assert.equal(regrouped.matrix, 'A1');
  assert.equal(regrouped.placed, '1 placed');
  record('lifecycle regrouped with focus in removed content', regrouped);

  await matrix.focus();
  await resize(1920, 1080);
  const widened = await geometry();
  three(widened);
  assert.equal(widened.matrixRetained, true);
  assert.equal(widened.focus, 'input:matrix', 'Retained content keeps focus');
  assert.equal(widened.title, 'Night Drive II', 'The consumer draft returns');
  assert.deepEqual(
    await page
      .getByRole('textbox', { name: 'Release title' })
      .evaluate((element) => [element.selectionStart, element.selectionEnd]),
    [14, 14],
    'No text selection is restored',
  );
  await resize(1280, 720);
  const again = await geometry();
  grouped(again, 0);
  assert.equal(again.focus, 'input:matrix');
  assert.equal(again.matrixRetained, true);

  // Genuine tabs: arrows request selection, Tab leaves the row for the active panel.
  await page.getByRole('tab').first().focus();
  await page.keyboard.press('ArrowRight');
  await settle();
  const release = await geometry();
  grouped(release, 1);
  assert.equal(release.focus, 'button:tab', 'Focus stays on the operated tab');
  assert.equal(release.title, 'Night Drive II');
  await page.keyboard.press('Tab');
  assert.equal((await geometry()).focus, 'div:tabpanel');
  await page.keyboard.press('Tab');
  assert.equal((await geometry()).focus, 'input:title');
  await page.getByRole('tab').nth(1).focus();
  await page.keyboard.press('ArrowLeft');
  await settle();
  await page.getByRole('button', { name: 'Place on side B' }).first().click();
  const placed = await geometry();
  grouped(placed, 0);
  assert.equal(placed.placed, '2 placed', 'Still one emission per activation');
  await resize(1920, 1080);
  const returned = await geometry();
  three(returned);
  assert.equal(returned.placed, '2 placed');
  assert.equal(returned.title, 'Night Drive II');
  assert.equal(returned.matrixRetained, true);
  record('lifecycle returned to three areas', returned);

  // Below the reference windows: no sideways overflow, every control reachable, in both locales.
  for (const story of ['english', 'german'])
    for (const [width, height] of [
      [1023, 720],
      [900, 720],
      [800, 720],
      [600, 720],
      [360, 640],
    ]) {
      await resize(width, height);
      await open(story);
      const narrow = await geometry();
      still(narrow);
      assert.deepEqual(narrow.mounted, ['grouped-areas']);
      assert.equal(
        tops(narrow).size === 1,
        narrow.alternatives.width >= twoAreas(narrow),
      );
      assert(narrow.shell.scroll > narrow.shell.client, 'Shell body scrolls');
      for (const column of narrow.columns)
        assert(
          column.left >= 0 && column.right <= narrow.width,
          'Columns stay inside the window',
        );
      const controls = await traverse();
      still(await geometry());
      record(`${story} ${width}x${height} below reference`, {
        ...narrow,
        controls,
      });
    }

  // Short heights: bounded with a usable body, or released as a whole; then restored.
  for (const [story, tab] of [
    ['english', 0],
    ['german', 0],
    ['german', 1],
  ]) {
    await resize(1280, 720);
    await open(story);
    if (tab === 1) await page.getByRole('tab').nth(1).click();
    const heights = [];
    for (const height of [
      720, 700, 690, 680, 676, 674, 672, 670, 660, 650, 640, 630, 620, 600, 580,
      570, 560, 500, 400, 320,
    ]) {
      await resize(1280, height);
      const result = await geometry();
      usable(result);
      heights.push([
        height,
        result.released,
        ...bodiesOf(result).map((body) => Math.round(body.client)),
      ]);
    }
    const controls = await traverse();
    await resize(1280, 720);
    grouped(await geometry(), tab);
    record(`${story} tab ${tab} short heights`, { heights, controls });
  }

  // A consumer fallback replaces the stacked last declaration, and stays bounded beside the
  // Sidebar; without one the last declaration stacks at the same window.
  await resize(1024, 720);
  await open('narrow-fallback');
  const fallback = await geometry();
  still(fallback);
  assert.deepEqual(fallback.mounted, [], 'No declared arrangement is mounted');
  assert.equal(fallback.tabs.length, 3, 'The fallback offers every area');
  assert.equal(fallback.areas.length, 1);
  assert(fallback.alternatives.width < 2 * 22 * fallback.rootFont + 24);
  assert(fallback.shell.scroll <= fallback.shell.client + 1);
  assert(fallback.pool.body.scroll > fallback.pool.body.client);
  record('fallback 1024x720', fallback);
  await resize(1280, 720);
  grouped(await geometry(), 0);
  await resize(1024, 720);
  await open('english');
  const last = await geometry();
  natural(last);
  assert.deepEqual(last.mounted, ['grouped-areas']);
  assert.equal(tops(last).size, 2, 'The last declaration stacks');
  record('no fallback 1024x720', last);

  // The component stories carry their own measured assertions; a failure reaches the console.
  for (const story of [
    'preference',
    'fit-boundary',
    'token-change',
    'none-fits',
    'lifecycle',
    'two-areas',
  ]) {
    await resize(1280, 900);
    await page.goto(
      `${base}/iframe.html?id=arrangement-columnlayout-alternatives--${story}&viewMode=story`,
    );
    await page.waitForFunction(() =>
      ['completed', 'finished', 'errored'].includes(
        window.__STORYBOOK_PREVIEW__?.currentRender?.phase,
      ),
    );
    await settle();
    record(`play ${story}`, { failures: failures.length });
  }

  assert.deepEqual(failures, [], 'No page or console errors');
  process.stdout.write('PASS Work areas browser acceptance\n');
} finally {
  await browser.close();
}
