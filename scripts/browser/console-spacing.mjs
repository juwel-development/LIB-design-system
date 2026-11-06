import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// SCREEN_STORYBOOK_URL=http://localhost:6158 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/console-spacing.mjs
// Optional CONSOLE_SPACING_PART=plays|matrix|behavior|baseline runs one part (all by default).
// CONSOLE_SPACING_BASELINE=<dir> names the dist folder built from the base revision; the
// baseline part then proves the omitted treatment renders every element exactly as before.
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const base = process.env.SCREEN_STORYBOOK_URL ?? 'http://localhost:6158';
const part = process.env.CONSOLE_SPACING_PART;
const failures = [];
page.on('pageerror', (error) => failures.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error' && !/favicon|404/.test(message.text()))
    failures.push(message.text());
});
const record = (label, result) =>
  process.stdout.write(`${JSON.stringify({ label, ...result })}\n`);
const settle = async () => {
  await page.evaluate(() => document.fonts.ready);
  for (let frame = 0; frame < 4; frame++)
    await page.evaluate(() => new Promise(requestAnimationFrame));
};
const resize = async (width, height) => {
  await page.setViewportSize({ width, height });
  await settle();
};
const finished = () =>
  page.waitForFunction(() =>
    ['completed', 'finished', 'errored', 'rendered'].includes(
      window.__STORYBOOK_PREVIEW__?.currentRender?.phase,
    ),
  );
const open = async (id, { stylesheet, theme = 'light', dist } = {}) => {
  await page.goto(
    `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`,
  );
  await finished();
  if (stylesheet) {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll(
        'style[data-vite-dev-id], link[rel="stylesheet"]',
      ))
        element.remove();
    });
    await page.addStyleTag({
      content: readFileSync(
        dist
          ? `${dist}/${stylesheet}`
          : new URL(`../../dist/${stylesheet}`, import.meta.url),
        'utf8',
      ),
    });
  }
  await settle();
};

const plays = async () => {
  // The stories carry their own measured assertions; a failing one logs an AssertionError.
  for (const theme of ['light', 'dark'])
    for (const [width, height] of [
      [1280, 720],
      [1920, 1080],
    ])
      for (const story of [
        'compact-spacing',
        'compact-delegated-table',
        'compact-heading-inside-panel',
        'compact-without-foot',
        'compact-short-content',
        'spacing-scope',
        'compact-with-dialog',
      ]) {
        const before = failures.length;
        await resize(width, height);
        await open(`layout-screen--${story}`, { theme });
        await page.waitForFunction(() =>
          ['finished', 'errored'].includes(
            window.__STORYBOOK_PREVIEW__?.currentRender?.phase,
          ),
        );
        const errors = failures.slice(before);
        record(`play ${story} ${theme} ${width}x${height}`, { errors });
        assert.deepEqual(errors, [], `${story} play passes`);
      }
};

// Geometry of the console: Screen's air, every work-area Pane's enclosure and body, and the
// computed lengths the treatment must leave alone (descendant spacing, controls, type).
const measure = () =>
  page.evaluate(() => {
    const length = (value) => Number.parseFloat(value) || 0;
    const rect = (element) => element.getBoundingClientRect();
    const main = document.querySelector('main');
    const style = getComputedStyle(main);
    const header = main.querySelector(':scope > header');
    const content = main.lastElementChild;
    const shell = document.querySelector('[data-testid="shell"]')?.children[1];
    const scroller = (element) => ({
      client: element.clientHeight,
      scroll: element.scrollHeight,
    });
    const panes = [...main.querySelectorAll('[data-pane-body]')]
      .map((body) => body.parentElement)
      .filter((pane) => !pane.closest('dialog') && rect(pane).height > 0)
      .map((pane) => {
        const paneStyle = getComputedStyle(pane);
        const slots = [...pane.children];
        const body = pane.querySelector(':scope > [data-pane-body]');
        const owner = body.querySelector(':scope > div:has(> table)') ?? body;
        const ring = length(
          getComputedStyle(body.firstElementChild ?? body).paddingTop,
        );
        const item = body.querySelector('li');
        const foot = slots.at(-1) === body ? undefined : slots.at(-1);
        return {
          name: pane.getAttribute('aria-label') ?? '',
          top: rect(pane).top,
          height: rect(pane).height,
          inset: [paneStyle.paddingTop, paneStyle.paddingBottom].map(length),
          gaps: slots
            .slice(1)
            .map((slot, index) => rect(slot).top - rect(slots[index]).bottom),
          body: scroller(owner),
          bodyTop: rect(body).top,
          bodyBottom: rect(body).bottom,
          footBottom: foot && rect(foot).bottom,
          firstItem: item && rect(item).height,
          firstItemFits:
            item === null
              ? undefined
              : rect(item).height + 2 * ring <= owner.clientHeight + 1,
          descendants: [...pane.querySelectorAll('*')].map((element) => {
            const s = getComputedStyle(element);
            return `${s.rowGap} ${s.columnGap} ${s.padding} ${s.fontSize} ${s.lineHeight} ${s.outlineWidth} ${
              element.matches('button, input, select, textarea')
                ? rect(element).height
                : ''
            }`;
          }),
        };
      });
    return {
      viewport: [innerWidth, innerHeight],
      document: scroller(document.scrollingElement),
      shell: shell && scroller(shell),
      released: main.querySelector('[data-screen-unusable]') !== null,
      main: { top: rect(main).top, height: rect(main).height },
      block: [length(style.paddingTop), length(style.paddingBottom)],
      gutter: [length(style.paddingLeft), length(style.paddingRight)],
      heading: header && rect(header).height,
      headingGap: header ? rect(content).top - rect(header).bottom : 0,
      panes,
    };
  });
const toggle = async (expected) => {
  await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent === 'Compact spacing')
      .click(),
  );
  await page.waitForFunction(
    (pressed) =>
      [...document.querySelectorAll('button')]
        .find((button) => button.textContent === 'Compact spacing')
        .getAttribute('aria-pressed') === pressed,
    String(expected === 'compact'),
  );
  await settle();
};
const sum = (values) => values.reduce((total, value) => total + value, 0);
const compare = (comfortable, compact) => {
  assert.deepEqual(compact.gutter, comfortable.gutter, 'Gutter unchanged');
  assert(
    compact.document.scroll <= compact.document.client + 1,
    'No page scroll',
  );
  if (!compact.released)
    assert(compact.shell.scroll <= compact.shell.client + 1, 'Shell still');
  for (const [index, value] of compact.block.entries())
    assert(value < comfortable.block[index], 'Screen block air reduced');
  if (comfortable.headingGap > 0)
    assert(compact.headingGap < comfortable.headingGap, 'Heading gap reduced');
  assert.equal(compact.panes.length, comfortable.panes.length);
  return compact.panes.map((pane, index) => {
    const before = comfortable.panes[index];
    assert.equal(pane.name, before.name);
    assert(
      pane.inset.every((value, side) => value < before.inset[side]),
      'Inset reduced',
    );
    assert(
      pane.gaps.every((value, slot) => value < before.gaps[slot]),
      'Slot gaps reduced',
    );
    assert.deepEqual(
      pane.descendants,
      before.descendants,
      `${pane.name}: descendants unchanged`,
    );
    const enclosure =
      sum(comfortable.block) -
      sum(compact.block) +
      comfortable.headingGap -
      compact.headingGap +
      sum(before.inset) -
      sum(pane.inset) +
      sum(before.gaps) -
      sum(pane.gaps);
    const recovered = pane.body.client - before.body.client;
    const bounded = !comfortable.released && !compact.released;
    if (bounded && pane.body.scroll > pane.body.client + 1)
      assert(
        Math.abs(recovered - enclosure) <= 1,
        `${pane.name}: body gains the enclosure room`,
      );
    return {
      pane: pane.name,
      enclosure: Math.round(enclosure * 10) / 10,
      body: [before.body.client, pane.body.client],
      recovered,
      content: pane.body.scroll,
      shortfall: [
        Math.max(0, before.body.scroll - before.body.client),
        Math.max(0, pane.body.scroll - pane.body.client),
      ],
      firstItem: pane.firstItem,
      firstItemFits: [before.firstItemFits, pane.firstItemFits],
      footBottom: [before.footBottom, pane.footBottom],
    };
  });
};

const STYLES = [
  [undefined, 'light'],
  ['styles.css', 'light'],
  ['styles.css', 'dark'],
  ['styles.light.css', 'light'],
  ['styles.dark.css', 'dark'],
];
const FIXTURES = [
  ['layout-screen--compact-spacing', 'en'],
  ['layout-screen--compact-spacing', 'de'],
  ['layout-screen--compact-delegated-table', 'en'],
  ['layout-screen-console-spacing--release-planning-english', 'en'],
  ['layout-screen-console-spacing--release-planning-german', 'de'],
  ['layout-screen-console-spacing--employment-negotiation-english', 'en'],
  ['layout-screen-console-spacing--employment-negotiation-german', 'de'],
];
const matrix = async () => {
  const reference = new Map();
  for (const [stylesheet, theme] of STYLES)
    for (const [id, language] of FIXTURES)
      for (const [width, height] of [
        [1280, 720],
        [1920, 1080],
      ]) {
        await resize(width, height);
        await open(id, { stylesheet, theme });
        const generic = id.startsWith('layout-screen--');
        if (generic && language === 'de') {
          await page
            .getByRole('button', { name: 'Translate', exact: true })
            .click();
          await settle();
        }
        // Release planning: the release tab where the work areas are grouped.
        const releaseTab = page.getByRole('tab', {
          name: /^(Release|Veröffentlichung)$/,
        });
        const comfortable = await measure();
        await toggle('compact');
        const compact = await measure();
        const panes = compare(comfortable, compact);
        let releaseView;
        if (await releaseTab.count()) {
          await releaseTab.click();
          await settle();
          const compactRelease = await measure();
          await toggle('comfortable');
          releaseView = compare(await measure(), compactRelease);
          await toggle('compact');
          await page
            .getByRole('tab', { name: /^(Recording pool|Aufnahmepool)$/ })
            .click();
          await settle();
        }
        await toggle('comfortable');
        const restored = await measure();
        assert.deepEqual(restored.block, comfortable.block, 'Default restored');
        const key = `${id} ${language} ${width}x${height}`;
        const summary = {
          comfortable: {
            block: comfortable.block,
            headingGap: comfortable.headingGap,
            released: comfortable.released,
            inset: comfortable.panes[0]?.inset,
            gaps: comfortable.panes[0]?.gaps,
          },
          compact: {
            block: compact.block,
            headingGap: compact.headingGap,
            released: compact.released,
            inset: compact.panes[0]?.inset,
            gaps: compact.panes[0]?.gaps,
          },
          panes,
          releaseView,
        };
        // Every delivered stylesheet renders what the source CSS renders, in both treatments.
        if (!reference.has(key)) reference.set(key, summary);
        else
          assert.deepEqual(
            summary,
            reference.get(key),
            `${key}: ${stylesheet} ${theme} matches the source geometry`,
          );
        record(`matrix ${stylesheet ?? 'source'} ${theme} ${key}`, summary);
      }
};

const behavior = async () => {
  // Fallback and restoration: compact releases at a smaller height than the default, settles
  // without oscillation and restores the bounds; focus, value and selection survive.
  await resize(1280, 720);
  await open('layout-screen--compact-spacing');
  const release = {};
  for (const spacing of ['comfortable', 'compact']) {
    if (spacing === 'compact') await toggle('compact');
    let threshold;
    for (let height = 720; height >= 300; height -= 4) {
      await resize(1280, height);
      if ((await measure()).released) {
        threshold = height;
        break;
      }
    }
    release[spacing] = threshold;
    await resize(1280, 720);
  }
  assert(release.compact < release.comfortable, 'Compact releases later');
  record('release heights (first released height, 4px steps)', release);
  await page.evaluate(() => {
    window.retained = document.querySelector('input');
    retained.focus();
    retained.value = 'retained text';
    retained.setSelectionRange(2, 6);
  });
  await resize(1280, 320);
  const released = await measure();
  assert(released.released, 'Compact releases at an insufficient height');
  assert(released.shell.scroll > released.shell.client, 'Shell owns fallback');
  for (const pane of released.panes)
    assert(pane.body.client >= pane.body.scroll - 1, 'Whole body released');
  await page.evaluate(() => {
    window.changes = 0;
    window.markers = new MutationObserver((records) => {
      changes += records.length;
    });
    markers.observe(document.querySelector('main'), {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-screen-unusable'],
    });
  });
  for (let frame = 0; frame < 12; frame++) await settle();
  assert.equal(
    await page.evaluate(() => changes),
    0,
    'No fallback oscillation',
  );
  await resize(1280, 720);
  const restored = await measure();
  assert(!restored.released, 'Bounds restore');
  assert(
    await page.evaluate(
      () =>
        document.activeElement === retained &&
        retained.value === 'retained text' &&
        retained.selectionStart === 2 &&
        retained.selectionEnd === 6,
    ),
    'Focus, value and selection survive release and restoration',
  );
  record('compact fallback and restoration', {
    released: released.released,
    restored: restored.released,
  });

  // Keyboard focus: every stop in the compact console shows the same ring, and no ring is cut
  // by an overflow ancestor that does not also cut it in the default treatment.
  const clipped = async () => {
    await page.evaluate(() => document.body.focus());
    await page.evaluate(() =>
      document
        .querySelector('main')
        .querySelector('button, input, [tabindex="0"]')
        ?.focus(),
    );
    const results = [];
    for (let stop = 0; stop < 40; stop++) {
      await page.keyboard.press('Tab');
      const result = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element?.closest('main')) return undefined;
        const style = getComputedStyle(element);
        const room =
          Number.parseFloat(style.outlineWidth) +
          Number.parseFloat(style.outlineOffset);
        const box = element.getBoundingClientRect();
        // A ring at a scrolled-away edge is native focus reveal, which brings the border box and
        // not the outline into view; any other cut is a clip the enclosure caused.
        let cut = false;
        let scrolledEdge = false;
        for (
          let parent = element.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          const overflow = getComputedStyle(parent);
          if (!/auto|scroll|hidden|clip/.test(overflow.overflow)) continue;
          const clip = parent.getBoundingClientRect();
          const top = box.top - room < clip.top - 0.5;
          const bottom = box.bottom + room > clip.bottom + 0.5;
          const side =
            box.left - room < clip.left - 0.5 ||
            box.right + room > clip.right + 0.5;
          const end = parent.scrollHeight - parent.clientHeight;
          if (
            (top && parent.scrollTop > 0) ||
            (bottom && parent.scrollTop < end - 0.5)
          )
            scrolledEdge = true;
          else if (top || bottom || side) cut = true;
        }
        return {
          name:
            element.getAttribute('aria-label') ??
            element.textContent?.slice(0, 30),
          outline: `${style.outlineStyle} ${style.outlineWidth}`,
          cut,
          scrolledEdge,
        };
      });
      if (result) results.push(result);
    }
    return results;
  };
  for (const id of [
    'layout-screen--compact-spacing',
    'layout-screen--compact-delegated-table',
    'layout-screen-console-spacing--release-planning-german',
    'layout-screen-console-spacing--employment-negotiation-german',
  ]) {
    await resize(1280, 720);
    await open(id);
    const comfortable = await clipped();
    await toggle('compact');
    const compact = await clipped();
    // A released default has no body stops, so stops are matched by name, not position.
    const rings = new Map(comfortable.map((stop) => [stop.name, stop.outline]));
    for (const stop of compact) {
      if (rings.has(stop.name))
        assert.equal(stop.outline, rings.get(stop.name), 'Same ring');
      assert(!stop.cut, `${id}: ${stop.name} ring is not clipped`);
    }
    record(`focus rings ${id}`, {
      stops: [comfortable.length, compact.length],
      outline: compact[0]?.outline,
      cutDefault: comfortable
        .filter((stop) => stop.cut)
        .map((stop) => stop.name),
      cutCompact: compact.filter((stop) => stop.cut).map((stop) => stop.name),
      scrolledEdgeDefault: comfortable
        .filter((stop) => stop.scrolledEdge)
        .map((stop) => stop.name),
      scrolledEdgeCompact: compact
        .filter((stop) => stop.scrolledEdge)
        .map((stop) => stop.name),
    });
  }

  // Lifecycle in the grouped arrangement: switching keeps the selected tab, the focused draft
  // and its node; a panel mounted afterwards takes the current treatment.
  await resize(1280, 720);
  await open('layout-screen-console-spacing--release-planning-english');
  await page.getByRole('tab', { name: 'Release', exact: true }).click();
  const title = page.getByRole('textbox', { name: 'Release title' });
  await title.fill('Night Drive (deluxe)');
  await page.evaluate(() => {
    window.draft = document.activeElement;
  });
  await toggle('compact');
  assert(
    await page.evaluate(
      () =>
        document.activeElement === draft &&
        draft.value === 'Night Drive (deluxe)',
    ),
    'Draft node, value and focus survive the switch',
  );
  assert.equal(
    await page
      .getByRole('tab', { name: 'Release', exact: true })
      .getAttribute('aria-selected'),
    'true',
  );
  await page.getByRole('tab', { name: 'Recording pool', exact: true }).click();
  await settle();
  const mounted = await measure();
  const pool = mounted.panes.find((pane) => pane.name === 'Recording pool');
  assert(
    pool && pool.inset[0] < 16,
    'A newly mounted panel takes the compact inset',
  );
  record('grouped lifecycle', { poolInset: pool.inset, poolGaps: pool.gaps });

  // A delegated bounded Table still scrolls alone with its header in view.
  await open('layout-screen--compact-delegated-table');
  await toggle('compact');
  await page.evaluate(() =>
    document.querySelector('main table').parentElement.focus(),
  );
  await page.keyboard.press('PageDown');
  await page.waitForFunction(() => document.activeElement.scrollTop > 0);
  const table = await page.evaluate(() => {
    const scroller = document.querySelector('main table').parentElement;
    const shell = document.querySelector('[data-testid="shell"]').children[1];
    return {
      offset: scroller.scrollTop,
      shell: shell.scrollTop,
      headerTop: document.querySelector('main thead').getBoundingClientRect()
        .top,
      top: scroller.getBoundingClientRect().top,
    };
  });
  assert(table.offset > 0 && table.shell === 0, 'Table alone scrolls');
  assert(table.headerTop >= table.top, 'Header in view');
  record('compact delegated table', table);

  // Short body: natural height, the foot follows it by the compact slot gap.
  await open('layout-screen--compact-short-content');
  await toggle('compact');
  const short = await measure();
  for (const pane of short.panes.filter(
    (pane) => pane.body.scroll <= pane.body.client + 1,
  ))
    assert(
      pane.footBottom === undefined ||
        pane.footBottom < pane.top + pane.height - pane.inset[1] - 1 ||
        pane.gaps.length < 2,
      `${pane.name}: foot follows a short body`,
    );
  record('compact short bodies', {
    panes: short.panes.map((pane) => ({
      name: pane.name,
      body: pane.body,
      gaps: pane.gaps,
      paneBottom: pane.top + pane.height,
      footBottom: pane.footBottom,
    })),
  });
};

const baseline = async (dist) => {
  const layout = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('#storybook-root *')].map((element) => {
        const box = element.getBoundingClientRect();
        return [box.left, box.top, box.width, box.height]
          .map((value) => Math.round(value * 100) / 100)
          .join(' ');
      }),
    );
  for (const [stylesheet, theme] of STYLES.filter(([name]) => name))
    for (const id of [
      'layout-screen--heading-above',
      'layout-screen--heading-inside-panel',
      'layout-screen--delegated-table',
      'layout-screen--with-sidebar',
      'layout-screen--short-content',
      'layout-screen--without-foot',
      'layout-screen-work-areas--english',
      'layout-screen-work-areas--german',
      'layout-screen-roster--english',
      'layout-pane--long-body',
      'layout-pane--short-body',
    ])
      for (const [width, height] of [
        [1280, 720],
        [1920, 1080],
        [1280, 320],
      ]) {
        await resize(width, height);
        await open(id, { stylesheet, theme, dist });
        const before = await layout();
        await open(id, { stylesheet, theme });
        const after = await layout();
        assert.deepEqual(
          after,
          before,
          `${id} ${stylesheet} ${width}x${height} unchanged`,
        );
        record(`baseline ${stylesheet} ${theme} ${id} ${width}x${height}`, {
          elements: after.length,
          identical: true,
        });
      }
};

try {
  record('runtime', { chromium: browser.version(), storybook: base });
  if (!part || part === 'plays') await plays();
  if (!part || part === 'matrix') await matrix();
  if (!part || part === 'behavior') await behavior();
  const dist = process.env.CONSOLE_SPACING_BASELINE;
  if (dist && (!part || part === 'baseline')) await baseline(dist);
  assert.deepEqual(failures, [], 'No page or console errors');
  process.stdout.write('PASS console spacing browser acceptance\n');
} finally {
  await browser.close();
}
