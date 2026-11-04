import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// npm exec --yes --package=playwright -- node scripts/browser/screen.mjs
// Resolve the ephemeral runner without adding a browser driver to the library's dependencies.
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const base = process.env.SCREEN_STORYBOOK_URL ?? 'http://localhost:6011';
const evaluate = async (expression) => page.evaluate(expression);
const call = async (command, ...args) => {
  if (command === 'keypress') {
    await page.keyboard.press(args[1]);
    if (args[1] === 'PageDown')
      await page.waitForFunction(() => document.activeElement.scrollTop > 0);
  }
};
const settle = async () =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))),
      ),
  );
const resize = async (width, height) => {
  await page.setViewportSize({ width, height });
  await settle();
};
const open = async (story) => {
  await page.goto(
    `${base}/iframe.html?id=layout-screen--${story}&viewMode=story`,
  );
  await page.locator('main').waitFor();
  await settle();
};
const geometry = async () =>
  await evaluate(`(() => {
 const rect = e => { const r = e.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, left:r.left, width:r.width, height:r.height, client:e.clientHeight, scroll:e.scrollHeight, offset:e.scrollTop }; };
 const byId = id => document.querySelector('[data-testid="'+id+'"]');
 const shell = byId('shell')?.children[1];
 return { width:innerWidth, height:innerHeight, main:document.querySelectorAll('main').length, heading:document.querySelectorAll('main h1').length, document:rect(document.scrollingElement), shell:shell && rect(shell), list:byId('list-body') && rect(byId('list-body')), detail:byId('detail-body') && rect(byId('detail-body')), fixed:[...document.querySelectorAll('main h1,[data-testid$="head"],[data-testid$="foot"]')].map(rect), table:document.querySelector('main table') && rect(document.querySelector('main table').parentElement) };
})()`);
const record = (label, result) =>
  process.stdout.write(`${JSON.stringify({ label, ...result })}\n`);
const bounded = (result, delegated = false) => {
  assert.equal(result.main, 1);
  assert.equal(result.heading, 1);
  for (const rect of result.fixed)
    assert(
      rect.top >= 0 && rect.bottom <= result.height + 1,
      'Fixed regions initially visible',
    );
  assert(
    result.shell.scroll <= result.shell.client + 1,
    'Shell stays still in bounded mode',
  );
  assert(
    result.document.scroll <= result.document.client + 1,
    'Document stays still',
  );
  const body = delegated ? result.table : result.list;
  assert(
    body.client > 30 && body.scroll > body.client,
    'Usable independently scrolling list',
  );
  assert(
    result.detail.scroll > result.detail.client,
    'Independent detail scrolling',
  );
};
const natural = (result, delegated = false) => {
  const body = delegated ? result.table : result.list;
  assert(body.client >= body.scroll - 1, 'Whole list content is released');
  assert(
    result.detail.client >= result.detail.scroll - 1,
    'Whole detail content is released',
  );
  assert(
    result.shell.scroll > result.shell.client,
    'Shell owns fallback overflow',
  );
};

for (const story of [
  'heading-above',
  'heading-inside-panel',
  'delegated-table',
  'with-sidebar',
]) {
  await open(story);
  for (const [width, height] of [
    [1920, 1080],
    [1280, 720],
    [1279, 720],
  ]) {
    await resize(width, height);
    const result = await geometry();
    record(`${story} ${width}x${height}`, result);
    bounded(result, story === 'delegated-table');
  }
  await evaluate(
    `(() => { window.retainedInput = document.querySelector('input'); retainedInput.value='retained text'; retainedInput.focus(); retainedInput.setSelectionRange(2,6); return true; })()`,
  );
  await resize(1280, 320);
  const fallback = await geometry();
  record(`${story} short`, fallback);
  natural(fallback, story === 'delegated-table');
  assert(
    await evaluate(
      'document.activeElement === retainedInput && retainedInput.value === "retained text" && retainedInput.selectionStart === 2 && retainedInput.selectionEnd === 6',
    ),
    'Input identity, value, selection and focus survive fallback',
  );
  await resize(1280, 720);
  bounded(await geometry(), story === 'delegated-table');
  assert(
    await evaluate('document.activeElement === retainedInput'),
    'Restoration preserves focus',
  );
  await resize(800, 720);
  natural(await geometry(), story === 'delegated-table');
  assert(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    'No horizontal document overflow',
  );
}

await open('heading-above');
await resize(1280, 720);
await evaluate(
  `(() => { const b = document.querySelector('[data-testid="list-body"]'); b.focus(); return true; })()`,
);
await call('keypress', '--key', 'PageDown');
await settle();
let result = await geometry();
assert(
  result.list.offset > 0 &&
    result.detail.offset === 0 &&
    result.shell.offset === 0 &&
    result.document.offset === 0,
  'Native PageDown scrolls only list',
);
record('native list PageDown', result);
await evaluate(
  `(() => { document.querySelector('[data-testid="list-foot"] button').focus(); return true; })()`,
);
await call('keypress', '--key', 'Tab');
await settle();
await call('keypress', '--key', 'PageDown');
await settle();
result = await geometry();
assert(
  result.detail.offset > 0 && result.shell.offset === 0,
  'Native PageDown scrolls only detail',
);
const ring = await evaluate(
  '({ style:getComputedStyle(document.activeElement).outlineStyle, width:getComputedStyle(document.activeElement).outlineWidth })',
);
assert.equal(ring.style, 'solid');
assert(Number.parseFloat(ring.width) > 0, 'Visible keyboard focus outline');
record('native detail PageDown and focus ring', { ...result, ring });

await resize(1280, 320);
await evaluate(
  `(() => { window.lastEntry = [...document.querySelectorAll('button')].find(b=>b.textContent==='Entry 40'); lastEntry.focus(); return true; })()`,
);
await call('keypress', '--key', 'Tab');
await settle();
assert(
  await evaluate('document.activeElement.textContent === "Next page"'),
  'Tab reaches pagination after last entry',
);
assert(
  await evaluate(
    'document.activeElement.getBoundingClientRect().bottom <= innerHeight',
  ),
  'Native focus reveal makes pagination visible',
);
await call('keypress', '--key', 'Shift+Tab');
await settle();
assert(
  await evaluate('document.activeElement === lastEntry'),
  'Shift+Tab returns to the same last entry',
);
record('fallback native focus reveal and Tab/Shift+Tab', await geometry());

await open('heading-above');
await resize(1280, 720);
await evaluate(
  `(() => { window.retainedInput=document.querySelector('input'); retainedInput.focus(); retainedInput.value='stable'; retainedInput.setSelectionRange(1,3); [...document.querySelectorAll('button')].find(b=>b.textContent==='Toggle heading').click(); return true; })()`,
);
await settle();
assert(
  await evaluate(
    'document.activeElement === retainedInput && retainedInput.selectionStart === 1 && document.querySelectorAll("main>header").length === 0',
  ),
  'Removing heading preserves focus and omits region',
);
await evaluate(
  `(() => { [...document.querySelectorAll('button')].find(b=>b.textContent==='Toggle heading').click(); return true; })()`,
);
await settle();
assert(
  await evaluate(
    'document.activeElement === retainedInput && retainedInput.value === "stable"',
  ),
  'Inserting heading preserves focus and value',
);
await evaluate(
  `(() => { [...document.querySelectorAll('button')].find(b=>b.textContent==='Translate').click(); document.documentElement.style.fontSize='24px'; return true; })()`,
);
await settle();
natural(await geometry());
record('German heading, wrapping bar and enlarged text', await geometry());
await evaluate(
  `(() => { document.documentElement.style.fontSize=''; [...document.querySelectorAll('button')].find(b=>b.textContent==='Translate').click(); return true; })()`,
);
await settle();
bounded(await geometry());

await open('delegated-table');
await resize(1280, 720);
await evaluate('document.querySelector("main table").parentElement.focus()');
await call('keypress', '--key', 'PageDown');
await settle();
const tableScroll = await geometry();
assert(
  tableScroll.table.offset > 0 && tableScroll.shell.offset === 0,
  'Delegated Table alone scrolls',
);
assert(
  (await evaluate(
    'document.querySelector("main thead").getBoundingClientRect().top',
  )) >= tableScroll.table.top,
  'Table header remains visible at the scrollport start',
);
assert(
  await evaluate(
    'document.querySelector("[data-testid=list-body]").getAttribute("tabindex") === null',
  ),
  'Delegating Pane body adds no keyboard stop',
);
record('delegated table native scroll and pinned header', tableScroll);

await open('narrow-holder');
await resize(1920, 1080);
natural(await geometry());
record('wide viewport, narrow holder', await geometry());
for (const story of ['short-content', 'empty-content']) {
  await open(story);
  await resize(1280, 720);
  const result = await geometry();
  assert(
    result.list.client >= result.list.scroll - 1,
    'Short list retains natural height',
  );
  assert(
    result.list.client < result.detail.height + 100,
    'Short body is not stretched',
  );
  record(story, result);
}
await open('unsized');
await resize(1280, 720);
assert(
  await evaluate(
    'document.querySelector("main").getBoundingClientRect().height > document.querySelector("main h1").getBoundingClientRect().height',
  ),
  'Unsized Screen grows with its content',
);
record('unsized', await geometry());

await open('heading-above');
const thresholdCases = [];
for (const height of [
  600, 560, 552, 550, 549, 548, 540, 520, 480, 420, 320, 720,
]) {
  await resize(1280, height);
  const fit = await evaluate(`(() => {
    const body=document.querySelector('[data-testid="list-body"]');
    const item=body.querySelector('button');
    const inset=parseFloat(getComputedStyle(body.firstElementChild).paddingTop);
    return { height:innerHeight, body:body.getBoundingClientRect().height, content:body.scrollHeight, minimum:item.getBoundingClientRect().height+2*inset };
  })()`);
  assert(
    fit.body >= fit.minimum,
    'Fallback happens before even a nonzero body loses a complete control and its ring',
  );
  thresholdCases.push(fit);
}
record('usable-body threshold sweep', { cases: thresholdCases });

await resize(1280, 320);
await evaluate(`(() => {
 window.fallbackInput=document.querySelector('input');
 window.fallbackShell=document.querySelector('[data-testid="shell"]').children[1];
 fallbackShell.scrollTop=500;
 window.smallestScrollRange=fallbackShell.scrollHeight;
 window.changes=0;
 window.markerObserver=new MutationObserver(records=>{ changes+=records.length; });
 markerObserver.observe(document.querySelector('main'), { subtree:true, attributes:true, attributeFilter:['data-screen-unusable'] });
 return true;
})()`);
for (let index = 0; index < 12; index++) {
  await settle();
  assert(
    await evaluate(
      'fallbackShell.scrollTop === 500 && fallbackShell.scrollHeight >= smallestScrollRange',
    ),
    'No probing collapses fallback scroll range',
  );
}
assert.equal(
  await evaluate('changes'),
  0,
  'Fallback settles without oscillation',
);
await evaluate('markerObserver.disconnect()');

await open('with-sidebar');
for (const width of [1024, 1023, 800]) {
  await resize(width, 720);
  const result = await geometry();
  natural(result);
  const navigation = await evaluate(
    `(() => { const r=document.querySelector('nav').getBoundingClientRect(); const m=document.querySelector('main').getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,mainLeft:m.left,mainTop:m.top}; })()`,
  );
  if (width === 1024)
    assert(navigation.right <= navigation.mainLeft, 'Sidebar stands at 64rem');
  else
    assert(
      navigation.bottom <= navigation.mainTop,
      'Sidebar stacks below 64rem',
    );
  record(`Sidebar boundary ${width}`, { ...result, navigation });
}
await open('without-foot');
await resize(1280, 720);
bounded(await geometry());
record('optional foot absent', await geometry());

for (const stylesheet of [
  'styles.css',
  'styles.light.css',
  'styles.dark.css',
]) {
  for (const story of [
    'heading-above',
    'heading-inside-panel',
    'delegated-table',
  ]) {
    await open(story);
    await page.evaluate(() => {
      for (const element of document.querySelectorAll(
        'style[data-vite-dev-id]',
      ))
        element.remove();
    });
    await page.addStyleTag({
      content: readFileSync(
        new URL(`../../dist/${stylesheet}`, import.meta.url),
        'utf8',
      ),
    });
    await resize(1280, 720);
    record(`${stylesheet} ${story} bounded`, await geometry());
    bounded(await geometry(), story === 'delegated-table');
    await resize(1280, 320);
    natural(await geometry(), story === 'delegated-table');
    await resize(1280, 720);
    bounded(await geometry(), story === 'delegated-table');
  }
}

process.stdout.write('PASS Screen browser acceptance\n');

await browser.close();
