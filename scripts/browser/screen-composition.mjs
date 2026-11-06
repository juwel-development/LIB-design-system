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
      heading: main.querySelector(':scope > header')
        ? rect(main.querySelector(':scope > header'))
        : null,
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
  for (const [id, box] of Object.entries(result.regions))
    assert(box.client >= box.scroll - 1, `${label}: ${id} is not clipped`);
  // Everything is reachable in the Shell body: its scroll range covers the lowest box.
  const lowest = Math.max(
    ...[
      ...(result.heading ? [result.heading] : []),
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
  'table-only-without-heading': { 1920: true, 1280: true },
  'table-only-without-heading-overflowing': { 1920: false, 1280: false },
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
const keepsTab = (tab) => [
  async () => {
    await page.getByRole('tab', { name: tab }).click();
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
    assert.equal(kept, tab, 'Same focused node and the selected tab kept');
  },
];
await preserve('contract-detail', ...keepsTab('Pool'));
await preserve('contract-detail-german', ...keepsTab('Vorrat'));
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
// A card above a Pane whose Table hides its caption: in fallback the caption sits below the
// window, and it must stay inside the Shell body rather than extend the document.
await preserve(
  'head-above-pane-german',
  async () => {},
  async () => {},
);

// 2a · In fallback Screen's heading scrolls with the content; nothing stays pinned above it.
for (const story of ['profile-only-overflowing', 'table-only-overflowing']) {
  await open(story);
  await resize(1280, 720);
  const top = await geometry();
  const region = story === 'table-only-overflowing' ? 'markets' : 'profile';
  await page
    .getByTestId('shell')
    .locator(':scope > :nth-child(2)')
    .evaluate((body) => {
      body.scrollTop = 200;
    });
  await settle();
  const moved = await geometry();
  record(`${story} heading scrolled`, {
    heading: [top.heading, moved.heading],
  });
  assert(top.heading && moved.shell.offset === 200, `${story}: scrolled`);
  for (const [before, after] of [
    [top.heading, moved.heading],
    [top.regions[region], moved.regions[region]],
  ])
    assert(
      Math.abs(before.top - after.top - 200) < 1,
      `${story}: the heading and the content move together`,
    );
}

// Clicks a toggle in the page and samples every following frame, so a release or restore that
// clipped or collapsed a content-height region on its way would show in one of them.
const toggleAndSample = (name, frames) =>
  page.evaluate(
    ({ name, frames, regions }) =>
      new Promise((resolve) => {
        const samples = [];
        const sample = () => {
          samples.push({
            released:
              document.querySelector('main [data-screen-unusable]') !== null,
            clipped: regions
              .map((id) => document.querySelector(`[data-testid="${id}"]`))
              .filter(Boolean)
              .filter(
                (element) => element.scrollHeight > element.clientHeight + 1,
              )
              .map((element) => element.dataset.testid),
          });
          if (samples.length < frames) requestAnimationFrame(sample);
          else resolve(samples);
        };
        [...document.querySelectorAll('button')]
          .find((button) => button.textContent === name)
          .click();
        requestAnimationFrame(sample);
      }),
    { name, frames, regions: REGIONS },
  );

// 3 · Dynamic fixed content: a longer head releases, removing it restores, without flicker.
for (const [story, longerHead] of [
  ['contract-detail', 'Longer head'],
  ['contract-detail-german', 'Längerer Kopf'],
  ['focus-column', 'Longer head'],
  ['content-columns', 'Longer head'],
  ['content-columns-german', 'Längerer Kopf'],
]) {
  await open(story);
  await resize(1280, 720);
  assertBounded(`${story} before`, await geometry());
  const releasing = await toggleAndSample(longerHead, 30);
  assert.deepEqual(
    releasing.flatMap((frame) => frame.clipped),
    [],
    `${story}: no region clipped while releasing`,
  );
  const longer = await geometry();
  await assertNatural(`${story} longer head`, longer);
  assert.deepEqual(
    [...new Set(await releasedFor(30))],
    [true],
    `${story}: release holds frame after frame`,
  );
  const restoring = await toggleAndSample(longerHead, 30);
  assert.deepEqual(
    restoring.flatMap((frame) => frame.clipped),
    [],
    `${story}: no region clipped while restoring`,
  );
  assertBounded(`${story} head shortened`, await geometry());
  assert.deepEqual(
    [...new Set(await releasedFor(30))],
    [false],
    `${story}: bound holds frame after frame`,
  );
  record(`${story} longer head`, longer);
}
// 3a · Fixed content above a Pane that shrinks by an attribute alone (a hidden line, no node
// added or removed and no text changed) still returns the bound.
for (const [story, head] of [
  ['contract-detail', 'strip'],
  ['head-above-pane', 'card'],
]) {
  await open(story);
  await resize(1280, 720);
  await page.getByTestId(head).evaluate((element) => {
    const line = document.createElement('p');
    line.style.height = '400px';
    element.append(line);
  });
  await settle();
  await assertNatural(`${story} taller head`, await geometry());
  await page.getByTestId(head).evaluate((element) => {
    element.lastElementChild.hidden = true;
  });
  await settle();
  assertBounded(`${story} head hidden by attribute`, await geometry());
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

// 4 · Enlarged text: twice the root size releases where it no longer fits, and restores. The
// detail's doubled rem minimums no longer fit beside the Roster, so its columns stack inside
// the still-bounded Screen and the whole content falls back to the Shell body.
const ENLARGED = {
  'contract-detail': false,
  'table-only': false,
  'content-columns': true,
};
for (const story of Object.keys(ENLARGED)) {
  await open(story);
  await resize(1920, 1080);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await settle();
  const enlarged = await geometry();
  record(`${story} 200% text`, enlarged);
  if (ENLARGED[story]) assertBounded(`${story} 200%`, enlarged);
  else await assertNatural(`${story} 200%`, enlarged);
  if (story === 'contract-detail')
    assert(
      enlarged.columns['detail-column'].top >=
        enlarged.columns['roster-column'].bottom - 1,
      'The columns stack under enlarged text',
    );
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

// 6 · No oscillation and no stuck release at the boundary, with visible scrollbars. The release
// height is searched arriving from a bounded window, the restore height arriving from a
// released one; they must meet, so no height keeps a release the bounded layout would fit.
// Each side is then held for 60 frames.
const boundary = async (from) => {
  let low = 300;
  let high = 720;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    await resize(1280, from);
    await resize(1280, middle);
    if ((await geometry()).released) low = middle;
    else high = middle;
  }
  return { low, high };
};
for (const story of ['table-only-german', 'contract-detail-german']) {
  await open(story);
  const releasing = await boundary(720);
  const restoring = await boundary(300);
  record(`${story} boundary`, { releasing, restoring });
  assert.deepEqual(restoring, releasing, `${story}: release and restore meet`);
  for (const height of [
    releasing.low - 1,
    releasing.low,
    releasing.high,
    releasing.high + 1,
  ]) {
    await resize(1280, height);
    const states = [...new Set(await releasedFor(60))];
    assert.equal(states.length, 1, `${story}: stable at ${height}px`);
  }
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
