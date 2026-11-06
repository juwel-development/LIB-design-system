import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen-composition.mjs
// Resolve the ephemeral runner without adding a browser driver to the library's dependencies.
// Scrollbars stay visible: a fallback that adds the Shell body's scrollbar narrows the content,
// which is exactly the width feedback a release/restore loop would come from.
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch({
  ignoreDefaultArgs: ['--hide-scrollbars'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const base = process.env.SCREEN_STORYBOOK_URL ?? 'http://localhost:6011';
const record = (label, result) =>
  process.stdout.write(`${JSON.stringify({ label, ...result })}\n`);

const settle = async () => {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))),
      ),
  );
};
const resize = async (width, height) => {
  await page.setViewportSize({ width, height });
  await settle();
};
const applyStylesheet = async (stylesheet) => {
  await page.evaluate(() => {
    for (const element of document.querySelectorAll(
      'style[data-vite-dev-id],link[rel="stylesheet"]',
    ))
      element.remove();
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
  await settle();
};
const open = async (story, { theme = 'light', stylesheet } = {}) => {
  await page.goto(
    `${base}/iframe.html?id=layout-screen-composition--${story}&viewMode=story&globals=theme:${theme}`,
  );
  await page.locator('main').waitFor();
  await page.waitForFunction(
    (dark) => document.documentElement.classList.contains('dark') === dark,
    theme === 'dark',
  );
  if (stylesheet) await applyStylesheet(stylesheet);
  await settle();
};

// Content-height regions of the fixtures, by test id; bodies are the bounded scroll owners.
const REGIONS = [
  'strip',
  'card',
  'focus-column',
  'profile',
  'markets',
  'facts',
  'result',
];
const geometry = () =>
  page.evaluate((regions) => {
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return {
        top: box.top,
        bottom: box.bottom,
        left: box.left,
        right: box.right,
        width: box.width,
        height: box.height,
        client: element.clientHeight,
        scroll: element.scrollHeight,
        offset: element.scrollTop,
      };
    };
    const byId = (id) => document.querySelector(`[data-testid="${id}"]`);
    const shell = byId('shell').children[1];
    const main = document.querySelector('main');
    const named = (suffix) =>
      Object.fromEntries(
        [...main.querySelectorAll(`[data-testid$="${suffix}"]`)].map(
          (element) => [element.dataset.testid, rect(element)],
        ),
      );
    // A delegated body hands scrolling to its Table's wrapper, so that wrapper is measured.
    const bodies = Object.fromEntries(
      [...main.querySelectorAll('[data-testid$="-body"]')].map((element) => [
        element.dataset.testid,
        rect(
          element.querySelector(':scope > [data-height-bounded]') ?? element,
        ),
      ]),
    );
    const scrollports = [...main.querySelectorAll('*')]
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          /auto|scroll/.test(style.overflowY) &&
          element.scrollHeight > element.clientHeight + 1
        );
      })
      .map(
        (element) =>
          element.dataset.testid ??
          element.closest('[data-testid]')?.dataset.testid,
      );
    return {
      width: innerWidth,
      height: innerHeight,
      mains: document.querySelectorAll('main').length,
      released: main.querySelector('[data-screen-unusable]') !== null,
      document: rect(document.scrollingElement),
      shell: {
        ...rect(shell),
        scrollWidth: shell.scrollWidth,
        clientWidth: shell.clientWidth,
      },
      main: rect(main),
      heads: named('-head'),
      foots: named('-foot'),
      bodies,
      regions: Object.fromEntries(
        regions.filter((id) => byId(id)).map((id) => [id, rect(byId(id))]),
      ),
      columns: named('-column'),
      tabs: main.querySelectorAll('[role="tab"]').length,
      lanes: main.querySelectorAll('[data-testid$="-foot"]').length,
      scrollports,
    };
  }, REGIONS);

const assertStill = (result) => {
  assert.equal(result.mains, 1, 'Exactly one main');
  assert(
    result.document.scroll <= result.document.client + 1,
    'The document never scrolls',
  );
  assert(
    result.shell.scrollWidth <= result.shell.clientWidth + 1,
    'Nothing overflows sideways',
  );
};
const assertBounded = (label, result) => {
  assertStill(result);
  assert(!result.released, `${label}: bounded`);
  assert(
    result.shell.scroll <= result.shell.client + 1,
    `${label}: Shell body stays still`,
  );
  const fixed = [
    ...Object.values(result.heads),
    ...Object.values(result.foots),
    ...Object.values(result.regions),
  ];
  for (const box of fixed)
    assert(
      box.top >= result.shell.top - 1 && box.bottom <= result.height + 1,
      `${label}: fixed content and content-height regions in view`,
    );
  for (const id of Object.keys(result.regions))
    assert(
      !result.scrollports.includes(id),
      `${label}: ${id} gains no scrollport`,
    );
  for (const id of result.scrollports)
    assert(
      id?.endsWith('-body'),
      `${label}: only bounded bodies scroll (found ${id})`,
    );
};
const assertNatural = async (label, result) => {
  assertStill(result);
  assert(result.released, `${label}: released`);
  for (const [id, box] of Object.entries(result.bodies))
    assert(box.client >= box.scroll - 1, `${label}: ${id} released whole`);
  // Everything is reachable in the Shell body: its scroll range covers the lowest box.
  const lowest = Math.max(
    ...[
      ...Object.values(result.heads),
      ...Object.values(result.foots),
      ...Object.values(result.regions),
      ...Object.values(result.bodies),
    ].map((box) => box.bottom),
  );
  assert(
    lowest - result.shell.top + result.shell.offset <= result.shell.scroll + 1,
    `${label}: lowest content within the Shell body's scroll range`,
  );
  if (lowest > result.shell.bottom + 1)
    assert(
      result.shell.scroll > result.shell.client,
      `${label}: Shell body owns the fallback`,
    );
};

// Bounded (true) or released (false) at each reference window: measured outcomes for these
// fixtures, not promises about consumer content. Where German wraps further it can release.
const EXPECTATIONS = {
  'contract-detail': { 1920: true, 1280: true },
  'contract-detail-german': { 1920: true, 1280: true },
  'head-above-pane': { 1920: true, 1280: true },
  'head-above-pane-german': { 1920: true, 1280: false },
  'focus-column': { 1920: true, 1280: true },
  'focus-column-german': { 1920: true, 1280: false },
  'profile-only': { 1920: true, 1280: false },
  'profile-only-heading-german': { 1920: true, 1280: false },
  'profile-only-overflowing': { 1920: false, 1280: false },
  'table-only': { 1920: true, 1280: true },
  'table-only-german': { 1920: true, 1280: true },
  'table-only-overflowing': { 1920: false, 1280: false },
  'content-columns': { 1920: true, 1280: true },
  'content-columns-german': { 1920: true, 1280: true },
};
const WINDOWS = { 1920: 1080, 1280: 720 };
const checkReference = async (story, label = story) => {
  const outcomes = {};
  for (const [width, height] of Object.entries(WINDOWS)) {
    await resize(Number(width), height);
    const result = await geometry();
    record(`${label} ${width}x${height}`, result);
    if (EXPECTATIONS[story][width]) assertBounded(`${label} ${width}`, result);
    else await assertNatural(`${label} ${width}`, result);
    outcomes[width] = result;
  }
  return outcomes;
};
const releasedFor = (heights) =>
  page.evaluate(
    (frames) =>
      new Promise((resolve) => {
        const states = [];
        const node = document.querySelector('main [data-testid]');
        const sample = () => {
          states.push(
            document.querySelector('main [data-screen-unusable]') !== null &&
              document.querySelector('main [data-testid]') === node,
          );
          if (states.length < frames) requestAnimationFrame(sample);
          else resolve(states);
        };
        requestAnimationFrame(sample);
      }),
    heights,
  );

// 1 · Reference windows, English and German, every fixture, light theme and source CSS.
for (const story of Object.keys(EXPECTATIONS)) {
  await open(story);
  await checkReference(story);
}

// 1a · Four lanes side by side at 1920, four tabs at 1280; the head spans its column only.
await open('contract-detail');
await resize(1920, 1080);
const wide = await geometry();
assert.equal(wide.tabs, 0, 'Four lanes side by side at 1920×1080');
assert.equal(wide.lanes, 5, 'Roster foot and four lane acts in view');
const strip = wide.regions.strip;
const detail = wide.columns['detail-column'];
const roster = wide.columns['roster-column'];
assert(
  Math.abs(strip.width - detail.width) < 1 && strip.left >= roster.right,
  'The head spans the detail column only',
);
assert(
  roster.top === detail.top && roster.bottom === detail.bottom,
  'The Roster keeps the full height beside the head',
);
for (const id of ['songs-body', 'sessions-body', 'pool-body', 'releases-body'])
  assert(
    wide.bodies[id].scroll > wide.bodies[id].client &&
      wide.bodies[id].top >= strip.bottom,
    `${id} scrolls on its own below the head`,
  );
await page.getByTestId('songs-body').evaluate((body) => {
  body.scrollTop = 300;
});
await settle();
const scrolled = await geometry();
assert(scrolled.bodies['songs-body'].offset > 0, 'One lane scrolls');
for (const id of ['sessions-body', 'pool-body', 'releases-body', 'roster-body'])
  assert.equal(scrolled.bodies[id].offset, 0, `${id} does not move with it`);
assert.equal(scrolled.shell.offset, 0, 'Neither does the Shell body');
await resize(1280, 720);
const narrow = await geometry();
assert.equal(narrow.tabs, 4, 'Four genuine tabs at 1280×720');
assert(
  narrow.foots['songs-foot'].bottom <= narrow.height,
  'The active lane fills the rest of the column with its act in view',
);
record('contract-detail lanes and tabs', {
  wide: wide.regions,
  narrow: narrow.regions,
});

// 1b · Delegated Table: the header stays in view and a focused row is revealed below it.
await page
  .getByTestId('roster-body')
  .getByRole('button', { name: /Alex Morgan 40/ })
  .focus();
await settle();
const reveal = await page.getByTestId('roster-body').evaluate((body) => {
  const wrapper = body.querySelector('[data-height-bounded]');
  const head = wrapper.querySelector('thead').getBoundingClientRect();
  const focused = document.activeElement.getBoundingClientRect();
  const frame = wrapper.getBoundingClientRect();
  return {
    scrolled: wrapper.scrollTop,
    headTop: head.top,
    headBottom: head.bottom,
    frameTop: frame.top,
    focusedTop: focused.top,
    focusedBottom: focused.bottom,
    frameBottom: frame.bottom,
  };
});
record('roster focus reveal', reveal);
assert(reveal.scrolled > 0, 'The Table wrapper scrolled to the focused row');
assert(
  reveal.headTop >= reveal.frameTop - 1 &&
    reveal.focusedTop >= reveal.headBottom - 1 &&
    reveal.focusedBottom <= reveal.frameBottom + 1,
  'Header in view, focused row revealed below it',
);
assert.equal(
  (await geometry()).shell.offset,
  0,
  'Reveal stays inside the Table',
);

// 1c · Reading order: Roster, then the head, then the lanes.
const order = await page.evaluate(() => {
  const position = (a, b) =>
    document
      .querySelector(`[data-testid="${a}"]`)
      .compareDocumentPosition(document.querySelector(`[data-testid="${b}"]`)) &
    Node.DOCUMENT_POSITION_FOLLOWING;
  return [
    position('roster-foot', 'strip'),
    position('strip', 'songs-head'),
  ].every(Boolean);
});
assert(order, 'Reading order follows the composition');

// 2 · Insufficient height, then restoration with the same nodes, focus and selection.
const preserve = async (story, prepare, verify) => {
  await open(story);
  await resize(1280, 720);
  const before = await geometry();
  await prepare();
  await resize(1280, 360);
  const short = await geometry();
  await assertNatural(`${story} 1280x360`, short);
  await page
    .getByTestId('shell')
    .locator(':scope > :nth-child(2)')
    .evaluate((body) => {
      body.scrollTop = body.scrollHeight;
    });
  await settle();
  const end = await geometry();
  const last = Math.max(
    ...Object.values({ ...end.foots, ...end.regions }).map((box) => box.bottom),
  );
  assert(
    last <= end.height + 1,
    `${story}: the end of the content is reachable`,
  );
  await resize(1280, 720);
  const restored = await geometry();
  if (EXPECTATIONS[story][1280]) assertBounded(`${story} restored`, restored);
  for (const [id, box] of Object.entries(before.regions))
    assert(
      Math.abs(restored.regions[id].height - box.height) < 1,
      `${story}: ${id} restored to the same height`,
    );
  await verify();
  record(`${story} short and restored`, { short, restored });
};
await preserve(
  'contract-detail',
  async () => {
    await page.getByRole('tab', { name: 'Pool' }).click();
    await page.getByTestId('strip').getByRole('button').focus();
    await page.evaluate(() => {
      window.keptButton = document.activeElement;
      window.keptPanel = document.querySelector(
        '[role="tabpanel"]:not([hidden])',
      );
    });
  },
  async () => {
    const kept = await page.evaluate(
      () =>
        window.keptButton === document.activeElement &&
        window.keptPanel ===
          document.querySelector('[role="tabpanel"]:not([hidden])') &&
        document.querySelector('[role="tab"][aria-selected="true"]')
          .textContent,
    );
    assert.equal(kept, 'Pool', 'Same focused node and the selected tab kept');
  },
);
await preserve(
  'focus-column',
  async () => {
    await page.getByRole('radio', { name: /Reach/ }).click();
    await page.evaluate(() => {
      window.keptChoice = document.activeElement;
    });
  },
  async () => {
    const kept = await page.evaluate(
      () =>
        window.keptChoice === document.activeElement &&
        document.activeElement.getAttribute('aria-checked'),
    );
    assert.equal(kept, 'true', 'Same focused, selected choice');
  },
);
await preserve(
  'table-only',
  async () => {
    await page.getByRole('button', { name: 'Market 3' }).focus();
    await page.evaluate(() => {
      window.keptMarket = document.activeElement;
    });
  },
  async () => {
    assert(
      await page.evaluate(() => window.keptMarket === document.activeElement),
      'Same focused market',
    );
  },
);
await preserve(
  'content-columns',
  async () => {},
  async () => {},
);

// 3 · Dynamic fixed content: a longer head releases, removing it restores, without flicker.
for (const story of ['contract-detail', 'focus-column', 'content-columns']) {
  await open(story);
  await resize(1280, 720);
  assertBounded(`${story} before`, await geometry());
  await page.getByRole('button', { name: 'Longer head' }).click();
  await settle();
  const longer = await geometry();
  await assertNatural(`${story} longer head`, longer);
  assert.deepEqual(
    [...new Set(await releasedFor(30))],
    [true],
    `${story}: release holds frame after frame`,
  );
  await page.getByRole('button', { name: 'Longer head' }).click();
  await settle();
  assertBounded(`${story} head shortened`, await geometry());
  assert.deepEqual(
    [...new Set(await releasedFor(30))],
    [false],
    `${story}: bound holds frame after frame`,
  );
  record(`${story} longer head`, longer);
}
await open('content-columns');
await resize(1280, 720);
await page.getByRole('button', { name: 'End', exact: true }).click();
await settle();
const ended = await geometry();
assertBounded('content-columns ended', ended);
assert(
  ended.regions.result && ended.regions.facts,
  'Two content-height columns',
);
record('content-columns ended', ended);

// 4 · Enlarged text: twice the root size releases where it no longer fits, and restores.
for (const story of ['contract-detail', 'table-only', 'content-columns']) {
  await open(story);
  await resize(1920, 1080);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await settle();
  const enlarged = await geometry();
  record(`${story} 200% text`, enlarged);
  if (enlarged.released) await assertNatural(`${story} 200%`, enlarged);
  else assertBounded(`${story} 200%`, enlarged);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  await settle();
  assertBounded(`${story} text restored`, await geometry());
}

// 5 · Width stacking: below 64rem the Sidebar stacks above the content, which leaves Screen
// unsized, so every region takes its natural height and the Shell body scrolls; bounds return.
await open('contract-detail');
await resize(1024, 720);
assertBounded('contract-detail 1024x720', await geometry());
await resize(800, 720);
const stacked = await geometry();
record('contract-detail stacked 800x720', stacked);
assertStill(stacked);
for (const [id, box] of Object.entries(stacked.bodies))
  assert(box.client >= box.scroll - 1, `${id} takes its natural height`);
assert(stacked.shell.scroll > stacked.shell.client, 'The Shell body scrolls');
await resize(1280, 720);
assertBounded('contract-detail unstacked', await geometry());

// 6 · No oscillation at the boundary with visible scrollbars: find the release height, then
// hold each side of it for 60 frames.
await open('table-only-german');
await resize(1280, 720);
let low = 300;
let high = 720;
while (high - low > 1) {
  const middle = Math.floor((low + high) / 2);
  await resize(1280, middle);
  if ((await geometry()).released) low = middle;
  else high = middle;
}
for (const height of [low - 1, low, high, high + 1]) {
  await resize(1280, height);
  const states = [...new Set(await releasedFor(60))];
  assert.equal(states.length, 1, `Stable at ${height}px`);
  record(`boundary ${height}px`, { released: states[0] });
}

// 7 · Both themes and the three built stylesheets at both reference windows.
for (const [theme, stylesheet] of [
  ['dark', undefined],
  ['light', 'styles.css'],
  ['dark', 'styles.css'],
  ['light', 'styles.light.css'],
  ['dark', 'styles.dark.css'],
]) {
  for (const story of [
    'contract-detail',
    'contract-detail-german',
    'focus-column',
    'table-only-german',
    'content-columns',
    'profile-only-overflowing',
  ]) {
    await open(story, { theme, stylesheet });
    await checkReference(story, `${theme} ${stylesheet ?? 'source'} ${story}`);
  }
}

assert.deepEqual(errors, [], 'No page errors');
process.stdout.write('PASS Screen composition browser acceptance\n');
await browser.close();
