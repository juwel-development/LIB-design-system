import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

// SCREEN_STORYBOOK_URL=http://localhost:6168 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/foot-placement.mjs
// Optional FOOT_PLACEMENT_PART=plays|matrix|fallback|lifecycle|dialog|baseline runs one part.
// FOOT_PLACEMENT_ENGINE=firefox|webkit runs another engine; FOOT_PLACEMENT_EXECUTABLE names a build.
// FOOT_PLACEMENT_BASELINE=<dir> names the dist folder built from the base revision; the baseline
// part then proves an omitted placement lays out every element exactly as before.
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const engine = process.env.FOOT_PLACEMENT_ENGINE ?? 'chromium';
// Scrollbars stay visible: Playwright hides them in Chromium by default, which hides width feedback.
const browser = await createRequire(executable)('playwright')[engine].launch({
  executablePath: process.env.FOOT_PLACEMENT_EXECUTABLE,
  ignoreDefaultArgs: engine === 'chromium' ? ['--hide-scrollbars'] : [],
});
const page = await browser.newPage();
const base = process.env.SCREEN_STORYBOOK_URL ?? 'http://localhost:6168';
const part = process.env.FOOT_PLACEMENT_PART;
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
    ['finished', 'errored'].includes(
      window.__STORYBOOK_PREVIEW__?.currentRender?.phase,
    ),
  );
const open = async (id, { stylesheet, dist } = {}) => {
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
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
const REFERENCE = [
  [1920, 1080],
  [1280, 720],
];
const planning = (language, spacing) =>
  `layout-pane-foot-placement--release-planning-${
    {
      'en compact': 'english',
      'de compact': 'german',
      'en comfortable': 'comfortable',
      'de comfortable': 'comfortable-german',
    }[`${language} ${spacing}`]
  }`;
const words = {
  en: {
    release: 'The Release',
    pool: 'Eligible Recordings',
    complete: 'Complete the Release',
    placement: 'Foot at bottom',
    title: 'Release title',
  },
  de: {
    release: 'Das Release',
    pool: 'Geeignete Aufnahmen',
    complete: 'Release abschließen',
    placement: 'Foot at bottom',
    title: 'Release-Titel',
  },
};

const plays = async () => {
  // The stories carry their own measured assertions; a failing one logs an AssertionError.
  for (const [width, height] of REFERENCE)
    for (const story of [
      'layout-pane--foot-at-bottom',
      'layout-pane--foot-at-bottom-empty-body',
      'layout-pane--foot-at-bottom-long-body',
      'layout-pane--foot-at-bottom-child-owned',
      'layout-pane--foot-at-bottom-bounded-table',
      'layout-pane--foot-at-bottom-unsized',
      'layout-pane--short-body',
      'layout-pane--long-body',
      'layout-pane--child-owned-scroll',
      'layout-pane--stacked',
      'layout-pane--bounded-table',
      'layout-pane--stepped-bounded-table',
      'layout-pane-foot-placement--release-planning-english',
      'layout-pane-foot-placement--release-planning-german',
      'layout-pane-foot-placement--release-planning-comfortable',
      'layout-pane-foot-placement--release-planning-comfortable-german',
      'layout-dialog--bounded-summary-foot-at-bottom',
      'layout-dialog--bounded-summary-short-foot-at-bottom',
      'layout-dialog--bounded-summary-screen-short-foot-at-bottom',
    ]) {
      const before = failures.length;
      await resize(width, height);
      await open(story);
      const errors = failures.slice(before);
      record(`play ${story} ${width}x${height}`, { errors });
      assert.deepEqual(errors, [], `${story} play passes`);
    }
};

// The release pane's action against its inner corner, the fact inventory and its visibility, and
// every scroller between the content and the document.
const measure = () =>
  page.evaluate(() => {
    const length = (value) => Number.parseFloat(value) || 0;
    const rect = (element) => element.getBoundingClientRect();
    const scrollers = (element) => {
      const list = [];
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      )
        if (/auto|scroll|hidden|clip/.test(getComputedStyle(parent).overflow))
          list.push(parent);
      return list;
    };
    // Visible means inside the viewport and every clipping ancestor, without being scrolled to.
    const visible = (element) => {
      const box = rect(element);
      if (box.width === 0 || box.height === 0) return false;
      if (box.top < -0.5 || box.bottom > innerHeight + 0.5) return false;
      return scrollers(element).every((parent) => {
        const clip = rect(parent);
        return box.top >= clip.top - 0.5 && box.bottom <= clip.bottom + 0.5;
      });
    };
    const shell = document.querySelector('[data-testid="shell"]').children[1];
    const pane = document.querySelector('[data-testid="release-pane"]');
    const panes = [...document.querySelectorAll('[data-pane-body]')].map(
      (body) => body.parentElement,
    );
    const facts = [
      ...document.querySelectorAll(
        'main h1, main h2, main h3, main label, main li, main p, main [data-testid^="running-time"], main button',
      ),
    ].filter((element) => !element.closest('[hidden]'));
    const result = {
      viewport: [innerWidth, innerHeight],
      document: [
        document.scrollingElement.scrollHeight,
        document.scrollingElement.clientHeight,
        document.documentElement.scrollWidth,
      ],
      shell: [shell.scrollHeight, shell.clientHeight, shell.scrollWidth],
      arrangement: document.querySelector('[data-testid="three-columns"]')
        ? 'three columns'
        : 'tabs',
      released: panes.some((element) =>
        element.hasAttribute('data-screen-unusable'),
      ),
      completes: document.querySelectorAll('[data-testid="release-complete"]')
        .length,
      hidden: facts
        .filter((element) => !visible(element))
        .map((element) => element.textContent.slice(0, 40)),
      truncated: facts
        .filter(
          (element) =>
            getComputedStyle(element).textOverflow === 'ellipsis' ||
            element.scrollWidth > element.clientWidth + 1,
        )
        .map((element) => element.textContent.slice(0, 40)),
      types: [
        ...new Set(
          facts.map(
            (element) =>
              `${element.tagName} ${getComputedStyle(element).fontSize}`,
          ),
        ),
      ].sort(),
      groups: [...document.querySelectorAll('main [role="group"]')].map(
        (element) => element.getAttribute('aria-label'),
      ),
    };
    if (!pane) return result;
    const style = getComputedStyle(pane);
    const box = rect(pane);
    const action = pane.querySelector('[data-testid="release-complete"]');
    const body = pane.querySelector(':scope > [data-pane-body]');
    const foot = pane.querySelector('[data-testid="release-foot"]');
    return {
      ...result,
      pane: {
        bottomGap:
          box.bottom -
          length(style.borderBottomWidth) -
          length(style.paddingBottom) -
          rect(action).bottom,
        rightGap:
          box.right -
          length(style.borderRightWidth) -
          length(style.paddingRight) -
          rect(action).right,
        footBottomGap:
          box.bottom -
          length(style.borderBottomWidth) -
          length(style.paddingBottom) -
          rect(foot).bottom,
        bodyToFoot: rect(foot).top - rect(body).bottom,
        slotGap: length(style.rowGap),
        inset: length(style.paddingBottom),
        body: [body.clientHeight, body.scrollHeight],
        bodyStop: body.getAttribute('tabindex'),
        actionVisible: visible(action),
      },
    };
  });
const showRelease = async (language) => {
  const tab = page.getByRole('tab', { name: words[language].release });
  if (await tab.count()) {
    await tab.click();
    await settle();
  }
};

const matrix = async () => {
  for (const [width, height] of REFERENCE)
    for (const language of ['en', 'de'])
      for (const spacing of ['compact', 'comfortable']) {
        await resize(width, height);
        await open(planning(language, spacing));
        await showRelease(language);
        const result = await measure();
        const label = `reference ${language} ${spacing} ${width}x${height}`;
        record(label, result);
        assert.equal(
          result.arrangement,
          width === 1920 ? 'three columns' : 'tabs',
        );
        assert.equal(result.completes, 1, `${label}: one Complete`);
        assert(
          result.document[0] <= result.document[1] &&
            result.document[2] <= width,
          `${label}: no document scrolling`,
        );
        assert(!result.released, `${label}: bounded`);
        assert(result.shell[0] <= result.shell[1] + 1, `${label}: Shell still`);
        assert.deepEqual(result.hidden, [], `${label}: every fact in view`);
        assert.deepEqual(result.truncated, [], `${label}: nothing truncated`);
        assert(Math.abs(result.pane.bottomGap) <= 1, `${label}: action bottom`);
        assert(Math.abs(result.pane.rightGap) <= 1, `${label}: action right`);
        assert(
          result.pane.body[1] <= result.pane.body[0] &&
            result.pane.bodyStop === null,
          `${label}: short rules body, no stop`,
        );
        assert(result.pane.bodyToFoot > result.pane.slotGap);
      }
  // Without the placement the same screen keeps the #141 default: the foot follows the body.
  for (const [width, height] of REFERENCE) {
    await resize(width, height);
    await open(
      'layout-pane-foot-placement--release-planning-default-placement',
    );
    await showRelease('en');
    const result = await measure();
    record(`default placement ${width}x${height}`, result);
    assert(result.pane.bottomGap > 1, 'Default leaves spare height in Root');
    assert(Math.abs(result.pane.bodyToFoot - result.pane.slotGap) <= 0.5);
  }
  // Both placements type alike: the same element types at the same sizes.
  await resize(1920, 1080);
  await open('layout-pane-foot-placement--release-planning-default-placement');
  const omitted = await measure();
  await open('layout-pane-foot-placement--release-planning-english');
  assert.deepEqual((await measure()).types, omitted.types, 'Same type sizes');
};

// Every keyboard stop in main is revealed when reached: inside the viewport and every clip.
const walk = async () => {
  await page.evaluate(() => document.activeElement?.blur());
  const stops = [];
  for (let stop = 0; stop < 60; stop++) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element?.closest('main')) return undefined;
      const box = element.getBoundingClientRect();
      // A stop taller than its clip (a tab panel) is revealed when it overlaps that clip.
      const outside = (top, bottom) =>
        box.height > bottom - top
          ? box.bottom <= top || box.top >= bottom
          : box.top < top - 0.5 || box.bottom > bottom + 0.5;
      let clipped = outside(0, innerHeight);
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        if (!/auto|scroll|hidden|clip/.test(getComputedStyle(parent).overflow))
          continue;
        const clip = parent.getBoundingClientRect();
        if (outside(clip.top, clip.bottom)) clipped = true;
      }
      return {
        name:
          element.getAttribute('aria-label') ??
          element.textContent?.slice(0, 30),
        clipped,
      };
    });
    if (result) stops.push(result);
  }
  return stops;
};

const fallback = async () => {
  for (const language of ['en', 'de'])
    for (const [width, height] of [
      [1024, 720],
      [800, 720],
      [1280, 480],
      [1920, 560],
      [800, 400],
      [1280, 320],
      [1920, 360],
    ]) {
      // The room returns to the reference window of the same arrangement, so the release pane
      // that shrank is the one that must restore.
      const room = width >= 1280 && height < 720 ? [width, 1080] : [1280, 720];
      if (width === 1920) room[1] = 1080;
      await resize(...room);
      await open(planning(language, 'compact'));
      await showRelease(language);
      await page.evaluate(() => {
        window.retained = document.querySelector(
          '[data-testid="release-complete"]',
        );
      });
      await resize(width, height);
      const result = await measure();
      const stops = await walk();
      const label = `fallback ${language} ${width}x${height}`;
      record(label, {
        ...result,
        stops: stops.length,
        clipped: stops.filter((stop) => stop.clipped).map((stop) => stop.name),
      });
      assert(result.document[2] <= width, `${label}: no horizontal overflow`);
      assert(
        result.shell[2] <= result.shell[1] + width,
        `${label}: Shell has no horizontal scroll`,
      );
      assert.equal(result.completes, 1);
      assert(
        stops.some((stop) => stop.name === words[language].complete),
        `${label}: Complete reachable by keyboard`,
      );
      assert.deepEqual(
        stops.filter((stop) => stop.clipped),
        [],
        `${label}: every stop revealed`,
      );
      // While the Shell body is still the pane is bounded and its foot must be in view;
      // otherwise the content has been released to the enclosing scroll.
      if (result.shell[0] <= result.shell[1] + 1)
        assert(result.pane.actionVisible, `${label}: foot in view`);
      // Every case here is released, stacked or overflowing: none leaves spare height, so the
      // anchor yields to the fallback and the foot follows the body by the slot gap.
      assert(
        Math.abs(result.pane.bodyToFoot - result.pane.slotGap) <= 1,
        `${label}: foot follows the body`,
      );
      await resize(...room);
      const restored = await measure();
      record(`${label} restored`, restored);
      assert(!restored.released, `${label}: bound restored`);
      assert(restored.shell[0] <= restored.shell[1] + 1, `${label}: still`);
      assert(Math.abs(restored.pane.bottomGap) <= 1, `${label}: corner again`);
      assert(Math.abs(restored.pane.rightGap) <= 1);
      assert(
        await page.evaluate(
          () =>
            window.retained ===
            document.querySelector('[data-testid="release-complete"]'),
        ),
        `${label}: same action node after restoration`,
      );
    }
};

const lifecycle = async () => {
  // Switching placement on mounted content keeps node, focus, typed value and selection.
  for (const [width, height] of REFERENCE) {
    await resize(width, height);
    await open(planning('en', 'compact'));
    await showRelease('en');
    const title = page.getByRole('textbox', { name: words.en.title });
    await title.fill('Night Drive (deluxe)');
    await page.evaluate(() => {
      window.draft = document.activeElement;
      draft.setSelectionRange(2, 7);
      window.action = document.querySelector(
        '[data-testid="release-complete"]',
      );
    });
    const gaps = [];
    for (let flip = 0; flip < 3; flip++) {
      await page.evaluate(() =>
        [...document.querySelectorAll('button')]
          .find((button) => button.textContent === 'Foot at bottom')
          .click(),
      );
      await settle();
      gaps.push((await measure()).pane.bottomGap);
      assert(
        await page.evaluate(
          () =>
            document.activeElement === draft &&
            draft.value === 'Night Drive (deluxe)' &&
            draft.selectionStart === 2 &&
            draft.selectionEnd === 7 &&
            document.querySelector('[data-testid="release-complete"]') ===
              action,
        ),
        'Placement switch keeps node, focus, value and selection',
      );
    }
    record(`placement switch ${width}x${height}`, { bottomGaps: gaps });
    assert(gaps[0] > 1 && Math.abs(gaps[1]) <= 1 && gaps[2] > 1);
  }
  // Filling Tabs mount only the selected owner; a returning Release panel is a fresh mount
  // (#153): the typed draft is not restored and nothing keeps focus inside it.
  await resize(1280, 720);
  await open(planning('de', 'compact'));
  await showRelease('de');
  await page.getByRole('textbox', { name: words.de.title }).fill('Nachtfahrt');
  await page.getByRole('tab', { name: words.de.pool }).click();
  await settle();
  const pool = await measure();
  assert.equal(pool.completes, 0, 'Release unmounted with its tab');
  await page.getByRole('tab', { name: words.de.release }).click();
  await settle();
  const returned = await measure();
  const draft = await page
    .getByRole('textbox', { name: words.de.title })
    .inputValue();
  record('tabs lifecycle', {
    poolCompletes: pool.completes,
    completes: returned.completes,
    draft,
    focus: await page.evaluate(() => document.activeElement?.textContent),
  });
  assert.equal(returned.completes, 1);
  assert.equal(draft, '', 'A remounted panel does not restore the draft');
  assert(Math.abs(returned.pane.bottomGap) <= 1, 'Remounted at the corner');
  // Alternatives keep one arrangement mounted across the width change.
  await resize(1920, 1080);
  const wide = await measure();
  assert.equal(wide.arrangement, 'three columns');
  assert.equal(wide.completes, 1);
  // One press of the one mounted Complete emits exactly once.
  const completions = () =>
    page.evaluate(() =>
      Number(document.querySelector('[data-completions]').dataset.completions),
    );
  const pressed = await completions();
  await page.getByRole('button', { name: words.de.complete }).click();
  await settle();
  const emitted = (await completions()) - pressed;
  record('alternatives', {
    arrangement: wide.arrangement,
    completes: 1,
    emitted,
  });
  assert.equal(emitted, 1, 'One press emits once');
};

// The summary pane in a Dialog: a content-extent dialog has no spare height, so a bottom foot lays
// out exactly as the default; a screen-tall one anchors it until Dialog's whole-task fallback.
const summary = () =>
  page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]');
    const pane = document.querySelector('[data-testid="summary-pane"]');
    const foot = document.querySelector('[data-testid="summary-foot"]');
    const style = getComputedStyle(pane);
    return {
      dialog: [dialog.scrollHeight, dialog.clientHeight],
      bodyToFoot:
        foot.getBoundingClientRect().top -
        pane.firstElementChild.getBoundingClientRect().bottom,
      slotGap: Number.parseFloat(style.rowGap),
      layout: [...dialog.querySelectorAll('*')].map((element) => {
        const box = element.getBoundingClientRect();
        return [box.left, box.top, box.width, box.height]
          .map((value) => Math.round(value * 100) / 100)
          .join(' ');
      }),
    };
  });
const dialog = async () => {
  for (const [width, height] of [...REFERENCE, [1280, 300]])
    for (const [story, original] of [
      ['bounded-summary-foot-at-bottom', 'bounded-summary'],
      ['bounded-summary-short-foot-at-bottom', 'bounded-summary-short'],
    ]) {
      await resize(width, height);
      await open(`layout-dialog--${original}`);
      await page.getByRole('button', { name: 'Review recordings' }).click();
      await settle();
      const before = await summary();
      await open(`layout-dialog--${story}`);
      const after = await summary();
      const label = `dialog ${story} ${width}x${height}`;
      record(label, { elements: after.layout.length, dialog: after.dialog });
      assert.deepEqual(after.layout, before.layout, `${label}: as default`);
    }
  await resize(1280, 720);
  await open('layout-dialog--bounded-summary-screen-short-foot-at-bottom');
  await page.evaluate(() => {
    window.retained = document.querySelector('[data-testid="summary-foot"]');
  });
  const anchored = await summary();
  await resize(1280, 300);
  const released = await summary();
  const confirm = page.getByRole('button', { name: 'Leave Medium' });
  await confirm.focus();
  const revealed = await confirm.evaluate((button) => {
    const box = button.getBoundingClientRect();
    const clip = button.closest('dialog').getBoundingClientRect();
    return box.top >= clip.top - 0.5 && box.bottom <= clip.bottom + 0.5;
  });
  await resize(1280, 720);
  const restored = await summary();
  const same = await page.evaluate(
    () =>
      window.retained ===
      document.querySelector('[data-testid="summary-foot"]'),
  );
  record('dialog screen extent short', {
    bodyToFoot: [anchored, released, restored].map((item) => item.bodyToFoot),
    released: released.dialog,
    revealed,
    same,
  });
  assert(anchored.bodyToFoot > anchored.slotGap + 1, 'Anchored when bounded');
  assert(released.dialog[0] > released.dialog[1], 'Whole dialog scrolls');
  assert(
    Math.abs(released.bodyToFoot - released.slotGap) <= 1,
    'The anchor yields to the dialog fallback',
  );
  assert(revealed, 'Focus reveals the final action inside the dialog');
  assert(restored.bodyToFoot > restored.slotGap + 1, 'Anchored again');
  assert(restored.dialog[0] <= restored.dialog[1] + 1, 'Dialog still again');
  assert(same, 'Same foot node after restoration');
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
  // The bounded-table plays assert reference-size geometry and fail at 1280x320 on the base
  // revision too, so those two stories are compared at the reference sizes only.
  for (const id of [
    'layout-pane--short-body',
    'layout-pane--long-body',
    'layout-pane--child-owned-scroll',
    'layout-pane--stacked',
    'layout-pane--bounded-table',
    'layout-pane--stepped-bounded-table',
    'layout-pane-foot-placement--release-planning-default-placement',
    'layout-screen--short-content',
    'layout-screen--compact-short-content',
    'layout-screen--delegated-table',
    'layout-screen-console-spacing--release-planning-german',
    'layout-screen-work-areas--short-bodies',
  ])
    for (const [width, height] of /bounded-table/.test(id)
      ? REFERENCE
      : [...REFERENCE, [1280, 320]]) {
      await resize(width, height);
      await open(id, { stylesheet: 'styles.css', dist });
      const before = await layout();
      await open(id, { stylesheet: 'styles.css' });
      const after = await layout();
      assert.deepEqual(after, before, `${id} ${width}x${height} unchanged`);
      record(`baseline ${id} ${width}x${height}`, {
        elements: after.length,
        identical: true,
      });
    }
};

try {
  record('runtime', { [engine]: browser.version(), storybook: base });
  if (!part || part === 'plays') await plays();
  if (!part || part === 'matrix') await matrix();
  if (!part || part === 'fallback') await fallback();
  if (!part || part === 'lifecycle') await lifecycle();
  if (!part || part === 'dialog') await dialog();
  const dist = process.env.FOOT_PLACEMENT_BASELINE;
  if (dist && (!part || part === 'baseline')) await baseline(dist);
  assert.deepEqual(failures, [], 'No page or console errors');
  process.stdout.write('PASS foot placement browser acceptance\n');
} finally {
  await browser.close();
}
