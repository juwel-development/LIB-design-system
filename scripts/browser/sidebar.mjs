import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// SIDEBAR_STORYBOOK_URL=http://localhost:6015 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/sidebar.mjs
const executable = realpathSync(
  execFileSync('which', ['playwright'], { encoding: 'utf8' }).trim(),
);
const { chromium } = createRequire(executable)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
const base = process.env.SIDEBAR_STORYBOOK_URL ?? 'http://localhost:6015';
const artifacts = process.env.SIDEBAR_ARTIFACTS ?? '/tmp/lib-155-browser';
mkdirSync(artifacts, { recursive: true });
const state = () =>
  page.evaluate(() => {
    const root = document.querySelector('[data-testid="navigation-example"]');
    const navigation = root.querySelector('nav');
    const entries = [...navigation.querySelectorAll('button')];
    const current = navigation.querySelector('[aria-current="true"]');
    const content = root.querySelector('[data-testid="navigation-content"]');
    const text = (id) =>
      root.querySelector(`[data-testid="${id}"]`)?.textContent;
    const measureBounds = (element) => {
      const bounds = element.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
      };
    };
    return {
      width: innerWidth,
      height: innerHeight,
      userAgent: navigator.userAgent,
      theme: document.documentElement.className,
      surface: getComputedStyle(document.body).backgroundColor,
      current: current?.textContent,
      currentCount: navigation.querySelectorAll('[aria-current]').length,
      focused: document.activeElement.matches('button, input')
        ? document.activeElement.textContent
        : undefined,
      outline: getComputedStyle(document.activeElement).outlineStyle,
      outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
      underline: getComputedStyle(current).textDecorationLine,
      requests: text('navigation-requests'),
      draft: text('draft-state'),
      subordinate: !!root.querySelector('[data-testid="subordinate-content"]'),
      input: root.querySelector('input')?.value,
      sameEntry:
        !window.sidebarProbe || window.sidebarProbe.entry === entries[1],
      sameSection:
        !window.sidebarProbe ||
        window.sidebarProbe.section ===
          root.querySelector('[data-testid="section-content"]'),
      track: measureBounds(navigation.parentElement),
      content: measureBounds(content),
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      entries: entries.map((entry) => {
        const range = document.createRange();
        range.selectNodeContents(entry);
        const bounds = entry.getBoundingClientRect();
        return {
          label: entry.textContent,
          disabled: entry.disabled,
          overflow: entry.scrollWidth > entry.clientWidth,
          readable: [...range.getClientRects()].every(
            (line) =>
              line.left >= bounds.left - 0.5 &&
              line.right <= bounds.right + 0.5,
          ),
          bounds: measureBounds(entry),
        };
      }),
    };
  });
const records = [];
const record = (value) => {
  records.push(value);
  writeFileSync(
    `${artifacts}/results.json`,
    JSON.stringify(records, undefined, 2),
  );
  process.stdout.write(`${JSON.stringify(value)}\n`);
};
const activate = async (entry, method) => {
  if (method === 'mouse') await entry.click();
  else await page.keyboard.press(method);
};
try {
  for (const language of ['english', 'german']) {
    const names =
      language === 'english'
        ? [
            'Hub',
            'Contracts',
            'Songs',
            'Artists and repertoire',
            'Staff',
            'Market research',
          ]
        : [
            'Zentrale',
            'Verträge',
            'Songs',
            'Künstlerinnen und Künstler',
            'Mitarbeiterinnen und Mitarbeiter',
            'Marktforschung',
          ];
    for (const theme of ['light', 'dark']) {
      for (const width of [1023, 1024]) {
        for (const content of ['ordinary', 'subordinate']) {
          const name = `${content}-${language}-${theme}-${width}`;
          await page.setViewportSize({ width, height: 720 });
          await page.goto(
            `${base}/iframe.html?id=layout-sidebar--${content}-${language}&viewMode=story&globals=theme:${theme}`,
          );
          await page.getByTestId('navigation-example').waitFor();
          await page.evaluate(() => document.fonts.ready);
          await page.evaluate((theme) => {
            document.documentElement.classList.toggle('dark', theme === 'dark');
          }, theme);
          const current = page.getByRole('button', {
            name: names[1],
            exact: true,
          });
          const initial = await state();
          assert.equal(initial.width, width);
          assert.equal(initial.theme.includes('dark'), theme === 'dark');
          assert.equal(initial.current, names[1]);
          assert.equal(initial.currentCount, 1);
          assert.equal(initial.overflow, false);
          assert.ok(
            initial.entries.every((entry) => entry.readable && !entry.overflow),
          );
          assert.equal(initial.entries[2].disabled, true);
          if (width >= 1024) {
            assert.equal(initial.track.width, 192);
            assert.ok(initial.content.left >= initial.track.right);
          } else assert.ok(initial.content.top >= initial.track.bottom);
          const expected = [];
          const expectRequests = async () => {
            const result = await state();
            assert.equal(
              result.requests,
              expected.length ? expected.join(', ') : initial.requests,
            );
            assert.equal(result.currentCount, 1);
            assert.equal(result.sameEntry, true);
            assert.ok(result.underline.includes('underline'));
            return result;
          };
          await page.evaluate(() => {
            window.sidebarProbe = {
              entry: document.querySelectorAll('nav button')[1],
              section: document.querySelector(
                '[data-testid="section-content"]',
              ),
            };
          });
          await page.keyboard.press('Tab');
          assert.equal((await state()).focused, names[0]);
          await page.keyboard.press('Tab');
          const focused = await state();
          assert.equal(focused.focused, names[1]);
          assert.equal(focused.outline, 'solid');
          assert.equal(focused.outlineWidth, '3px');
          assert.deepEqual(
            focused.entries.map((entry) => entry.bounds),
            initial.entries.map((entry) => entry.bounds),
          );
          await expectRequests();
          await page.screenshot({ path: `${artifacts}/${name}-focus.png` });
          const activations = [];
          for (const method of ['mouse', 'Enter', 'Space']) {
            if (content === 'subordinate') {
              if (!(await state()).subordinate) {
                await page
                  .getByRole('button', {
                    name:
                      language === 'english'
                        ? 'Open subordinate task'
                        : 'Untergeordnete Aufgabe öffnen',
                  })
                  .click();
                assert.equal((await state()).input, '');
              }
              await page.getByRole('textbox').fill('Discard this draft');
              assert.equal((await state()).draft, 'Discard this draft');
              assert.equal((await state()).current, names[1]);
            }
            await current.focus();
            await expectRequests();
            await activate(current, method);
            expected.push('contracts');
            const result = await expectRequests();
            assert.equal(result.current, names[1]);
            assert.equal(result.focused, names[1]);
            assert.equal(result.subordinate, false);
            if (content === 'ordinary') assert.equal(result.sameSection, true);
            else
              assert.equal(
                result.draft,
                language === 'english' ? 'No draft' : 'Kein Entwurf',
              );
            activations.push({
              entry: 'current',
              method,
              requests: result.requests,
              focus: result.focused,
              underline: result.underline,
            });
          }
          await page
            .getByRole('button', { name: names[2], exact: true })
            .click({ force: true });
          await expectRequests();
          await current.focus();
          await page.keyboard.press('Tab');
          assert.equal((await state()).focused, names[3]);
          await expectRequests();
          for (const [index, method] of ['Enter', 'Space', 'mouse'].entries()) {
            const target = page.getByRole('button', {
              name: names[[3, 0, 4][index]],
              exact: true,
            });
            if (method !== 'mouse') await target.focus();
            await activate(target, method);
            expected.push(['artists', 'hub', 'staff'][index]);
            const result = await expectRequests();
            assert.equal(result.current, names[[3, 0, 4][index]]);
            assert.equal(result.focused, result.current);
            activations.push({
              entry: 'inactive',
              method,
              requests: result.requests,
              focus: result.focused,
            });
          }
          await page.screenshot({ path: `${artifacts}/${name}-after.png` });
          record({
            name,
            initial,
            focused,
            activations,
            final: await state(),
            outcome: 'PASS',
          });
        }
      }
    }
  }
  // Retain Storybook's frame and surface, replacing only the source component stylesheet.
  for (const stylesheet of [
    'styles.css',
    'styles.light.css',
    'styles.dark.css',
  ]) {
    for (const language of ['english', 'german']) {
      for (const width of [800, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(
          `${base}/iframe.html?id=layout-sidebar--subordinate-${language}&viewMode=story`,
        );
        await page.getByTestId('navigation-example').waitFor();
        await page.evaluate(() => {
          for (const element of document.querySelectorAll(
            'style[data-vite-dev-id$="/src/styles.css"], link[rel="stylesheet"]',
          ))
            element.remove();
        });
        await page.addStyleTag({
          content: readFileSync(
            new URL(`../../dist/${stylesheet}`, import.meta.url),
            'utf8',
          ),
        });
        await page.evaluate(() => document.fonts.ready);
        const initial = await state();
        if (width >= 1024) assert.equal(initial.track.width, 192);
        else assert.ok(initial.content.top >= initial.track.bottom);
        assert.equal(initial.overflow, false);
        await page.getByRole('textbox').fill('Dispose this draft');
        await page
          .getByRole('button', {
            name: language === 'english' ? 'Contracts' : 'Verträge',
            exact: true,
          })
          .focus();
        await page.keyboard.press('Enter');
        const result = await state();
        assert.equal(result.requests, 'contracts');
        assert.equal(result.subordinate, false);
        assert.equal(result.current, initial.current);
        assert.equal(result.focused, initial.current);
        await page.screenshot({
          path: `${artifacts}/${stylesheet}-${language}-${width}.png`,
        });
        record({
          name: `${stylesheet}-${language}-${width}`,
          initial,
          final: result,
          outcome: 'PASS',
        });
      }
    }
  }
  assert.deepEqual(errors, []);
  process.stdout.write(
    `PASS ${records.length} Sidebar cases; browser ${browser.version()}; artifacts: ${artifacts}\n`,
  );
} finally {
  await browser.close();
}
