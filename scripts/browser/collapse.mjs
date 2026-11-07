import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// SCREEN_STORYBOOK_URL=http://localhost:6170 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/collapse.mjs
// Optional COLLAPSE_PART=plays|keyboard|accessibility|composition|resizing runs one part.
// COLLAPSE_ENGINE=firefox|webkit runs another engine; COLLAPSE_EXECUTABLE names a build.
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const engine = process.env.COLLAPSE_ENGINE ?? 'chromium';
// Scrollbars stay visible: Playwright hides them in Chromium by default, which hides width feedback.
// Firefox follows macOS's default of tabbing to form controls only; 7 is Full Keyboard Access.
const browser = await createRequire(executable)('playwright')[engine].launch({
  executablePath: process.env.COLLAPSE_EXECUTABLE,
  firefoxUserPrefs:
    engine === 'firefox' ? { 'accessibility.tabfocus': 7 } : undefined,
  ignoreDefaultArgs: engine === 'chromium' ? ['--hide-scrollbars'] : [],
});
const page = await browser.newPage();
const base = process.env.SCREEN_STORYBOOK_URL ?? 'http://localhost:6170';
const part = process.env.COLLAPSE_PART;
const failures = [];
page.on('pageerror', (error) => failures.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error' && !/favicon|404/.test(message.text()))
    failures.push(message.text());
});
const record = (label, result) =>
  process.stdout.write(`${JSON.stringify({ engine, label, ...result })}\n`);
const settle = async () => {
  await page.evaluate(() => document.fonts.ready);
  for (let frame = 0; frame < 4; frame++)
    await page.evaluate(() => new Promise(requestAnimationFrame));
};
const resize = async (width, height) => {
  await page.setViewportSize({ width, height });
  await settle();
};
const open = async (id) => {
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
  await page.waitForFunction(() =>
    ['finished', 'errored'].includes(
      window.__STORYBOOK_PREVIEW__?.currentRender?.phase,
    ),
  );
  await settle();
};
const SIZES = [
  [1920, 1080],
  [1280, 720],
  [768, 720],
  [360, 720],
  [1280, 520],
  [1280, 420],
];

const plays = async () => {
  // The stories carry their own measured assertions; a failing one logs an AssertionError.
  for (const [width, height] of SIZES.slice(0, 4))
    for (const story of [
      'default',
      'initially-expanded',
      'independent-instances',
      'retained-field-state',
      'long-wording',
    ]) {
      const before = failures.length;
      await resize(width, height);
      await open(`interaction-collapse--${story}`);
      const errors = failures.slice(before);
      record(`play ${story} ${width}x${height}`, { errors });
      assert.deepEqual(errors, [], `${story} play passes at ${width}`);
    }
};

const disclosure = () =>
  page.evaluate(() => {
    const details = document.querySelector('details');
    const summary = details.querySelector('summary');
    const content = summary.nextElementSibling;
    return {
      open: details.open,
      focused: document.activeElement === summary,
      contentHeight:
        details.getBoundingClientRect().height -
        summary.getBoundingClientRect().height,
      fieldVisible: content.querySelector('input').checkVisibility(),
      ring: getComputedStyle(summary).outlineStyle,
      indicator: getComputedStyle(summary).listStyleType,
    };
  });

// Real key presses: Tab reaches the summary with a visible ring, Enter and Space toggle it, and
// the fields inside become stops only while open.
const keyboard = async () => {
  await resize(1280, 720);
  await open('interaction-collapse--default');
  // Start from the stop after the disclosure: Shift+Tab must land on the summary.
  await page.getByRole('button', { name: 'After the filters' }).focus();
  await page.keyboard.press('Shift+Tab');
  const reached = await disclosure();
  record('keyboard reached', reached);
  assert(reached.focused && reached.ring === 'solid' && !reached.open);
  assert.equal(reached.contentHeight, 0);
  assert.equal(reached.indicator, 'disclosure-closed');
  assert.equal(reached.fieldVisible, false);
  await page.keyboard.press('Enter');
  await settle();
  const entered = await disclosure();
  record('keyboard enter', entered);
  assert(entered.open && entered.focused && entered.fieldVisible);
  assert(entered.contentHeight > 0);
  assert.equal(entered.indicator, 'disclosure-open', 'indicator turns');
  await page.keyboard.press('Space');
  await settle();
  const spaced = await disclosure();
  record('keyboard space', spaced);
  assert(!spaced.open && spaced.focused && spaced.contentHeight === 0);
  assert.equal(spaced.indicator, reached.indicator);
  // WebKit on macOS does not Tab to buttons without the platform's keyboard-navigation setting,
  // so the walk ends at the first stop outside the story or a repeat.
  const stopsWhile = async (isOpen) => {
    await page.locator('summary').focus();
    const names = ['Filters'];
    for (let stop = 0; stop < 8; stop++) {
      await page.keyboard.press('Tab');
      const name = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element?.closest('#storybook-root')) return '';
        return element.labels?.[0]?.textContent ?? element.textContent ?? '';
      });
      if (!name || names.includes(name)) break;
      names.push(name);
    }
    record(`keyboard stops ${isOpen ? 'open' : 'closed'}`, { names });
    return names;
  };
  const after = engine === 'webkit' ? [] : ['After the filters'];
  assert.deepEqual(await stopsWhile(false), ['Filters', ...after]);
  await page.getByText('Filters', { exact: true }).click();
  assert.deepEqual(await stopsWhile(true), [
    'Filters',
    'Name contains',
    'Genre',
    'Minimum quality',
    ...after,
  ]);
  // Pointer focus in a field, then a pointer close: focus is never left in hidden content.
  await page.getByLabel('Name contains').click();
  await page.getByText('Filters', { exact: true }).click();
  await settle();
  const closed = await page.evaluate(() => {
    const content = document.querySelector('details > div');
    return {
      active: document.activeElement?.tagName,
      inHidden: content.contains(document.activeElement),
    };
  });
  record('pointer close from field', closed);
  assert.equal(closed.inHidden, false);
  await page.getByText('Filters', { exact: true }).click();
  await settle();
  const reopened = await page.evaluate(() => document.activeElement?.tagName);
  record('pointer reopen', { active: reopened });
  assert.notEqual(reopened, 'INPUT', 'no old descendant focus restored');
};

// Chromium's native tree through CDP; Playwright's aria snapshot is DOM-derived and proves nothing.
const accessibility = async () => {
  if (engine !== 'chromium') return;
  await resize(1280, 720);
  await open('interaction-collapse--default');
  const session = await page.context().newCDPSession(page);
  const tree = async () => {
    const { nodes } = await session.send('Accessibility.getFullAXTree');
    const exposed = nodes.filter((node) => !node.ignored);
    const summary = exposed.find((node) => node.name?.value === 'Filters');
    return {
      summary: summary && {
        role: summary.role?.value,
        expanded: summary.properties?.find(
          (property) => property.name === 'expanded',
        )?.value.value,
        focusable: summary.properties?.find(
          (property) => property.name === 'focusable',
        )?.value.value,
      },
      fields: exposed
        .filter((node) =>
          ['Name contains', 'Genre', 'Minimum quality'].includes(
            node.name?.value,
          ),
        )
        .map((node) => `${node.role?.value} ${node.name?.value}`),
    };
  };
  const closed = await tree();
  record('ax closed', closed);
  assert.equal(closed.summary?.expanded, false);
  assert.deepEqual(closed.fields, []);
  await page.getByText('Filters', { exact: true }).click();
  await settle();
  const opened = await tree();
  record('ax open', opened);
  assert.equal(opened.summary?.expanded, true);
  assert.equal(opened.summary?.role, closed.summary?.role);
  assert(opened.fields.length >= 3);
};

const roster = (language, expanded) =>
  `interaction-collapse-composition--artist-roster-${expanded ? 'expanded-' : ''}${
    language === 'en' ? 'english' : 'german'
  }`;
const summaries = { en: 'Filters · 2 active', de: 'Filter · 2 aktiv' };
const names = { en: 'Name contains', de: 'Name enthält' };

const measure = () =>
  page.evaluate(() => {
    const overflowing = (element) =>
      element.scrollHeight > element.clientHeight + 1;
    const shell = document.querySelector('[data-testid="shell"]').children[1];
    const pane = document.querySelector('[data-testid="roster-pane"]');
    const table = document.querySelector('[data-testid="roster-table"]');
    const head = document.querySelector('[data-testid="roster-head"]');
    const foot = document.querySelector('[data-testid="roster-foot"]');
    const scrollers = [
      document.scrollingElement,
      ...document.querySelectorAll('main *'),
      shell,
    ]
      .filter(
        (element) =>
          element === document.scrollingElement ||
          /auto|scroll/.test(getComputedStyle(element).overflowY),
      )
      .filter(overflowing)
      .map((element) =>
        element === shell
          ? 'shell'
          : element === table
            ? 'table'
            : element === document.scrollingElement
              ? 'document'
              : element.tagName,
      );
    const texts = [
      ...document.querySelectorAll('main summary, main label'),
    ].filter((element) => element.checkVisibility());
    return {
      released: pane.hasAttribute('data-screen-unusable'),
      scrollers: [...new Set(scrollers)],
      documentWidth: document.documentElement.scrollWidth,
      head: Math.round(head.getBoundingClientRect().height),
      table: [table.clientHeight, table.scrollHeight],
      footBottom: Math.round(foot.getBoundingClientRect().bottom),
      shellBottom: Math.round(shell.getBoundingClientRect().bottom),
      truncated: texts
        .filter((element) => element.scrollWidth > element.clientWidth + 1)
        .map((element) => element.textContent),
      tableRows: document.querySelectorAll(
        '[data-testid="roster-table"] tbody tr',
      ).length,
    };
  });

// Collapse in a bounded pane head: expanding re-measures, may release Screen's bound, and
// collapsing restores it - with one scroll owner and no remount throughout.
const composition = async () => {
  for (const [width, height] of SIZES)
    for (const language of ['en', 'de']) {
      const label = `${language} ${width}x${height}`;
      await resize(width, height);
      await open(roster(language, false));
      await page.evaluate(() => {
        window.__marks = [
          document.querySelector('[data-testid="filters"] input'),
          document.querySelector('[data-testid="roster-table"] tbody tr'),
        ];
      });
      const collapsed = await measure();
      record(`composition collapsed ${label}`, collapsed);
      await page.getByText(summaries[language]).click();
      await settle();
      await page.getByLabel(names[language]).fill('Ana');
      await settle();
      const expanded = await measure();
      record(`composition expanded ${label}`, expanded);
      await page.getByText(summaries[language]).click();
      await settle();
      const restored = await measure();
      record(`composition restored ${label}`, restored);
      const retained = await page.evaluate(
        () =>
          window.__marks[0] ===
            document.querySelector('[data-testid="filters"] input') &&
          window.__marks[1] ===
            document.querySelector('[data-testid="roster-table"] tbody tr') &&
          window.__marks[0].value === 'Ana',
      );
      for (const [state, result] of [
        ['collapsed', collapsed],
        ['expanded', expanded],
        ['restored', restored],
      ]) {
        assert(result.documentWidth <= width, `${label} ${state}: no x scroll`);
        assert.deepEqual(result.truncated, [], `${label} ${state}: no clip`);
        assert.equal(result.tableRows, 40);
        assert(
          result.scrollers.length === 1,
          `${label} ${state}: one scroll owner, got ${result.scrollers}`,
        );
        assert.equal(
          result.scrollers[0],
          result.released ? 'shell' : 'table',
          `${label} ${state}: the owner matches the bound`,
        );
        if (!result.released)
          assert(
            result.footBottom <= result.shellBottom,
            `${label}: foot in view`,
          );
      }
      assert(expanded.head > collapsed.head, `${label}: head grows`);
      if (!expanded.released && !collapsed.released)
        assert(
          expanded.table[0] < collapsed.table[0],
          `${label}: table shrinks`,
        );
      assert.deepEqual(restored, collapsed, `${label}: collapse restores`);
      assert(retained, `${label}: same nodes and typed value`);
      // Starting expanded lays out exactly as expanding by hand.
      await open(roster(language, true));
      const startedOpen = await measure();
      record(`composition started open ${label}`, startedOpen);
      assert.deepEqual(startedOpen, expanded, `${label}: initial expansion`);
    }
};

// With the filters open, room returning by resize restores the bound, and losing it releases it.
const resizing = async () => {
  await resize(1280, 520);
  await open(roster('en', true));
  await page.getByLabel(names.en).fill('Ana');
  const results = [];
  for (const height of [520, 720, 520]) {
    await resize(1280, height);
    const result = await measure();
    record(`resize expanded 1280x${height}`, result);
    results.push(result);
  }
  const [short, tall, again] = results;
  assert(short.released && again.released, 'released while short');
  assert(!tall.released, 'bounded once room returns');
  assert.deepEqual(tall.scrollers, ['table']);
  assert.deepEqual(again, short);
  assert.equal(await page.getByLabel(names.en).inputValue(), 'Ana');
};

const parts = { plays, keyboard, accessibility, composition, resizing };
try {
  for (const [name, run] of Object.entries(parts))
    if (!part || part === name) await run();
  assert.deepEqual(failures, [], 'no page errors');
  process.stdout.write(`${engine}: all collapse checks passed\n`);
} finally {
  await browser.close();
}
