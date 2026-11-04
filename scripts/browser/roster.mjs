import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// SCREEN_STORYBOOK_URL=http://localhost:6012 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/roster.mjs
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const base = process.env.SCREEN_STORYBOOK_URL ?? 'http://localhost:6012';
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
    `${base}/iframe.html?id=layout-screen-roster--${story}&viewMode=story`,
  );
  await page.getByRole('main').waitFor();
  if (stylesheet) {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll(
        'style[data-vite-dev-id], link[rel="stylesheet"]',
      ))
        element.remove();
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
  page.evaluate(() => {
    const rect = (element) => {
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
        scrollWidth: element.scrollWidth,
        offset: element.scrollTop,
      };
    };
    const byId = (id) => document.querySelector(`[data-testid="${id}"]`);
    const table = document.querySelector('main table');
    const scrollport = table.parentElement;
    const row = table.querySelector('tbody tr');
    const fixedTable = [...table.children]
      .filter((element) => element.matches('caption, thead'))
      .reduce(
        (sum, element) => sum + element.getBoundingClientRect().height,
        0,
      );
    const ring = parseFloat(getComputedStyle(scrollport).paddingTop);
    return {
      width: innerWidth,
      height: innerHeight,
      rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
      mains: document.querySelectorAll('main').length,
      headings: document.querySelectorAll('main h1').length,
      headingSlot: !!document.querySelector('main > header'),
      headingGap:
        parseFloat(getComputedStyle(document.querySelector('main')).rowGap) ||
        0,
      shell: rect(byId('shell').children[1]),
      document: rect(document.scrollingElement),
      board: rect(byId('roster-column').parentElement),
      roster: rect(byId('roster-column')),
      detailColumn: rect(byId('detail-column')),
      list: rect(byId('list-body')),
      table: rect(scrollport),
      detail: rect(byId('detail-body')),
      head: rect(byId('list-head')),
      detailHead: rect(byId('detail-head')),
      foot: rect(byId('list-foot')),
      header: rect(table.querySelector('thead')),
      search: rect(byId('search')),
      rowMinimum:
        fixedTable + (row?.getBoundingClientRect().height ?? 0) + 2 * ring,
      selected: [...table.querySelectorAll('[aria-selected="true"]')].map(
        (element) => element.textContent,
      ),
      rows: table.querySelectorAll('tbody tr').length,
    };
  });
const record = (label, result) =>
  process.stdout.write(`${JSON.stringify({ label, ...result })}\n`);
const bounded = (result, long = true) => {
  assert.equal(result.mains, 1);
  assert.equal(result.headings, 1);
  assert(
    Math.abs(result.head.top - result.detailHead.top) < 1,
    'Panel heads align',
  );
  assert(
    result.roster.width >= 15 * result.rootFont - 1 &&
      result.roster.width <= 17 * result.rootFont + 1,
    'Roster respects 15–17rem',
  );
  assert(
    result.detailColumn.width > result.roster.width,
    'Uncapped detail receives remainder',
  );
  assert(
    Math.abs(result.detailColumn.right - result.board.right) < 1,
    'Detail consumes remaining board width',
  );
  assert(
    result.document.scrollWidth <= result.width,
    'No horizontal document overflow',
  );
  assert.equal(result.shell.offset, 0);
  assert(
    result.shell.scroll <= result.shell.client + 1,
    'Initial reference fit has no Shell overflow',
  );
  assert(
    result.document.scroll <= result.document.client + 1,
    'Document remains still',
  );
  for (const region of [
    result.head,
    result.foot,
    result.detailHead,
    result.search,
  ])
    assert(
      region.top >= result.shell.top && region.bottom <= result.height,
      'Fixed content initially visible',
    );
  assert(
    result.table.client + 1 >= result.rowMinimum,
    'A complete row and focus room fit',
  );
  if (long) {
    assert(result.table.scroll > result.table.client, 'Table bounds long rows');
    assert(
      result.detail.scroll > result.detail.client,
      'Detail independently bounds long content',
    );
  } else {
    assert(
      result.table.scroll <= result.table.client + 1,
      'Short/empty table retains natural height',
    );
  }
};
const natural = (result) => {
  assert(
    result.table.client >= result.table.scroll - 1,
    'Whole Table releases',
  );
  assert(
    result.detail.client >= result.detail.scroll - 1,
    'Whole detail releases',
  );
  assert(result.shell.scroll > result.shell.client, 'Shell owns overflow');
};

const retainInput = async () => {
  await page.getByTestId('entry-2').focus();
  await page.keyboard.press('Enter');
  await page.getByTestId('search').fill('Morgan');
  await page.getByTestId('search').evaluate((element) => {
    window.retainedInput = element;
    element.setSelectionRange(1, 4);
  });
  await settle();
};
const retained = async () => {
  assert(
    await page.evaluate(
      () =>
        document.activeElement === window.retainedInput &&
        window.retainedInput.value === 'Morgan' &&
        window.retainedInput.selectionStart === 1 &&
        window.retainedInput.selectionEnd === 4,
    ),
    'Input node, value, selection and focus survive',
  );
  assert.equal(
    await page.locator('tr[aria-selected="true"]').getAttribute('data-testid'),
    'entry-2',
    'Row selection survives',
  );
};
const clickWithoutMovingFocus = async (name) => {
  await page
    .getByRole('button', { name, exact: true })
    .evaluate((element) => element.click());
  await settle();
};
const keyboard = async (fallback) => {
  await page.getByTestId('search').focus();
  let reachedLast = false;
  let reachedPagination = false;
  for (let step = 0; step < 45; step++) {
    await page.keyboard.press('Tab');
    await settle();
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const table = document.querySelector('main table').parentElement;
      const header = document
        .querySelector('main thead')
        .getBoundingClientRect();
      return {
        id: element.dataset.testid,
        top: rect.top,
        bottom: rect.bottom,
        ring: parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset),
        outline: style.outlineStyle,
        tableBottom: table.getBoundingClientRect().bottom,
        headerBottom: header.bottom,
        viewport: innerHeight,
      };
    });
    if (focus.id === 'entry-40') {
      reachedLast = true;
      assert.equal(
        focus.outline,
        'solid',
        'Last row has visible keyboard focus',
      );
      assert(
        focus.top - focus.ring >=
          (fallback ? (await geometry()).shell.top : focus.headerBottom) - 1,
        'Last row and ring clear sticky header / Shell bar',
      );
      assert(
        focus.bottom + focus.ring <=
          (fallback ? focus.viewport : focus.tableBottom) + 1,
        'Last row and ring fully visible',
      );
    }
    if (focus.id === 'next-page') {
      reachedPagination = true;
      assert(
        focus.top >= (await geometry()).shell.top &&
          focus.bottom <= focus.viewport,
        'Pagination reached visibly by Tab',
      );
      break;
    }
  }
  assert(
    reachedLast && reachedPagination,
    'Tab traverses final row then pagination',
  );
  await page.keyboard.press('Shift+Tab');
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.testid),
    'entry-40',
    'Shift+Tab returns to last row',
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  if (!fallback) await page.keyboard.press('Tab');
  await settle();
  assert(
    await page.evaluate(() =>
      /Final detail action|Letzte Detailaktion/.test(
        document.activeElement.textContent,
      ),
    ),
    'Final detail action reachable',
  );
  record(
    `native keyboard ${fallback ? 'fallback' : 'bounded'}`,
    await geometry(),
  );
};

try {
  record('runtime', {
    browser: browser.version(),
    stylesheet: 'source plus three dist exports',
  });
  for (const stylesheet of [
    undefined,
    'styles.css',
    'styles.light.css',
    'styles.dark.css',
  ]) {
    for (const story of ['english', 'german']) {
      await open(story, stylesheet);
      if (stylesheet)
        assert.equal(
          await page
            .locator('style[data-vite-dev-id], link[rel="stylesheet"]')
            .count(),
          0,
          'Delivered stylesheet runs without source CSS',
        );
      for (const [width, height] of [
        [1920, 1080],
        [1280, 720],
        [1279, 720],
      ]) {
        await resize(width, height);
        const result = await geometry();
        record(`${stylesheet ?? 'source'} ${story} ${width}x${height}`, result);
        // Full German heading leaves 197.7px for a 201.5px usable Table at 1280×720.
        // This honest fit limit exercises the required fallback; typography/minima stay intact.
        if (story === 'german' && height === 720) natural(result);
        else bounded(result);
        assert.equal(result.headingSlot, false);
        assert.equal(result.headingGap, 0);
        assert(Math.abs(result.head.top - result.detailHead.top) < 1);
        assert.equal(result.roster.width, 272);
      }
      await resize(1920, 1080);
      await retainInput();
      for (const [width, height] of [
        [1280, 320],
        [800, 720],
        [600, 720],
        [1920, 1080],
      ]) {
        await resize(width, height);
        const result = await geometry();
        if (width === 1920) bounded(result);
        else natural(result);
        if (width === 600)
          assert(
            result.detailColumn.top >= result.roster.bottom,
            'Columns stack when their holder cannot meet declared minima',
          );
        await retained();
        record(
          `${stylesheet ?? 'source'} ${story} state ${width}x${height}`,
          result,
        );
      }
      await clickWithoutMovingFocus('Heading');
      await resize(1280, 720);
      bounded(await geometry());
      await retained();
      record(
        `${stylesheet ?? 'source'} ${story} separate heading 1280x720`,
        await geometry(),
      );
      await resize(1920, 1080);
      await clickWithoutMovingFocus('Heading');
      for (const name of ['Heading', 'Heading', 'EN / DE', 'EN / DE']) {
        await clickWithoutMovingFocus(name);
        await retained();
        bounded(await geometry());
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '32px';
      });
      await settle();
      natural(await geometry());
      await retained();
      record(`${stylesheet ?? 'source'} ${story} 200% text`, await geometry());
      await keyboard(true);
      await page.getByTestId('search').focus();
      await page
        .getByTestId('search')
        .evaluate((element) => element.setSelectionRange(1, 4));
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      await settle();
      bounded(await geometry());
      await retained();
      await keyboard(false);
      await resize(1280, 320);
      await keyboard(true);
    }
  }
  for (const story of ['short', 'empty']) {
    for (const german of [false, true]) {
      await open(story);
      if (german) await clickWithoutMovingFocus('EN / DE');
      for (const [width, height] of [
        [1920, 1080],
        [1280, 720],
      ]) {
        await resize(width, height);
        const result = await geometry();
        assert.equal(result.rows, story === 'empty' ? 0 : 1);
        assert(
          result.table.client >= result.table.scroll - 1,
          'Short Table is natural height',
        );
        assert(
          Math.abs(result.list.height - result.table.height) < 1,
          'Delegating body does not stretch short Table',
        );
        assert(
          result.foot.top - result.table.bottom < 10,
          'Pagination follows short content',
        );
        record(`${story} ${german ? 'DE' : 'EN'} ${width}x${height}`, result);
      }
    }
  }
  for (const story of ['english', 'german', 'wrapped-regions']) {
    await open(story);
    const cases = [];
    for (const height of [
      1080, 800, 724, 723, 722, 721, 720, 650, 600, 590, 580, 500, 400, 320,
      1080,
    ]) {
      await resize(1280, height);
      const result = await geometry();
      assert(
        result.table.client + 1 >= result.rowMinimum,
        'No sliver: complete row with fixed table regions and focus room',
      );
      if (result.table.scroll <= result.table.client + 1) natural(result);
      cases.push({
        height,
        table: result.table.client,
        minimum: result.rowMinimum,
        shell: result.shell.scroll,
      });
    }
    record(`${story} threshold sweep`, { cases });
  }
  await open('english');
  await resize(1280, 720);
  await page
    .locator('main table')
    .evaluate((element) => element.parentElement.focus());
  await page.keyboard.press('PageDown');
  await page.waitForFunction(
    () => document.querySelector('main table').parentElement.scrollTop > 0,
  );
  await settle();
  let result = await geometry();
  assert(
    result.table.offset > 0 &&
      result.detail.offset === 0 &&
      result.shell.offset === 0 &&
      result.document.offset === 0,
    'Native PageDown scrolls only Table',
  );
  assert(
    result.header.top >= result.table.top &&
      result.header.bottom < result.table.bottom,
    'Wrapped header stays visible',
  );
  assert.equal(
    await page.getByTestId('list-body').getAttribute('tabindex'),
    null,
    'Delegating Pane adds no tab stop',
  );
  record('Table PageDown and pinned header', result);
  await page.getByTestId('detail-body').focus();
  await page.keyboard.press('PageDown');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="detail-body"]').scrollTop > 0,
  );
  await settle();
  result = await geometry();
  assert(
    result.detail.offset > 0 && result.shell.offset === 0,
    'Detail PageDown is independent',
  );
  record('Detail PageDown', result);
  await page.getByTestId('entry-3').focus();
  await page.evaluate(() => {
    window.retainedRow = document.activeElement;
  });
  for (const [width, height] of [
    [1280, 320],
    [600, 720],
    [1280, 720],
  ]) {
    await resize(width, height);
    assert(
      await page.evaluate(() => document.activeElement === window.retainedRow),
      'Focused row identity survives release, stacking and restoration',
    );
  }
  await open('german');
  await resize(1280, 320);
  await page.evaluate(() => {
    window.fallbackShell = document.querySelector(
      '[data-testid="shell"]',
    ).children[1];
    fallbackShell.scrollTop = 800;
    window.smallestRange = fallbackShell.scrollHeight;
  });
  for (let frame = 0; frame < 20; frame++) {
    await settle();
    assert(
      await page.evaluate(
        () =>
          fallbackShell.scrollTop === 800 &&
          fallbackShell.scrollHeight === smallestRange,
      ),
      'Fallback has stable scroll range without measurement probes',
    );
  }
  record('stable fallback scroll range (80 frames)', await geometry());
  await open('english');
  await resize(1280, 720);
  await page.getByTestId('next-page').click();
  assert.equal(
    await page.getByTestId('entry-41').count(),
    1,
    'Pagination displays the next page',
  );
  await page
    .getByRole('button', { name: 'Previous page', exact: true })
    .click();
  assert.equal(
    await page.getByTestId('entry-1').count(),
    1,
    'Previous page returns',
  );
  await page.getByTestId('search').fill('not present');
  await settle();
  assert.equal(
    (await geometry()).rows,
    0,
    'Search filters to empty without changing composition',
  );
  await page.getByTestId('search').fill('Morgan');
  await settle();
  assert.equal((await geometry()).rows, 40, 'Clearing filter restores rows');
  bounded(await geometry());
  record('pagination and filter restoration', await geometry());
  process.stdout.write('PASS Roster browser acceptance\n');
} finally {
  await browser.close();
}
