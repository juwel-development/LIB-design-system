import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// npm run build && npm run storybook -- --ci --port 6172
// node scripts/browser/figure-artwork.mjs
// Uses Orca's embedded browser and Python 3/Pillow for read-only screenshot pixel probes.
const executable =
  process.env.ORCA_CLI_COMMAND ??
  (process.env.ORCA_DEV_REPO_ROOT ? 'orca-dev' : 'orca');
const base = process.env.FIGURE_STORYBOOK_URL ?? 'http://localhost:6172';
const evidence = process.env.FIGURE_EVIDENCE_DIR ?? '/tmp/figure-172-browser';
mkdirSync(evidence, { recursive: true });
const commands = [];
const report = { started: new Date().toISOString(), cases: [] };
const command = (...arguments_) => {
  const output = execFileSync(executable, [...arguments_, '--json'], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const response = JSON.parse(output);
  assert.equal(response.ok, true, output);
  commands.push({ command: arguments_[0], result: response.result });
  return response.result;
};

const { browserPageId: page } = command(
  'tab',
  'create',
  '--url',
  `${base}/iframe.html?id=display-figure-artwork--consumer-tokens&viewMode=story`,
);
report.page = page;
const evaluate = (operation, ...arguments_) => {
  const expression = `(${operation.toString()})(${arguments_.map((value) => JSON.stringify(value)).join(',')})`;
  const response = command('eval', '--page', page, '--expression', expression);
  return JSON.parse(response.result);
};
const screenshot = (name) => {
  const { path } = command('screenshot', '--page', page);
  const destination = join(evidence, `${name}.png`);
  copyFileSync(path, destination);
  return destination;
};

try {
  command(
    'viewport',
    '--page',
    page,
    '--width',
    '1100',
    '--height',
    '1000',
    '--scale',
    '1',
  );
  command(
    'wait',
    '--page',
    page,
    '--selector',
    '[data-testid="artwork-gallery"]',
  );
  command('snapshot', '--page', page, '--interactive');
  report.story = evaluate(async () => {
    const preview = window.__STORYBOOK_PREVIEW__;
    while (!['finished', 'errored'].includes(preview?.currentRender?.phase)) {
      await new Promise(requestAnimationFrame);
    }
    return {
      phase: preview.currentRender.phase,
      userAgent: navigator.userAgent,
      scale: devicePixelRatio,
    };
  });
  assert.equal(
    report.story.phase,
    'finished',
    'The measured Storybook play must pass',
  );

  const deliveries = [
    ['styles.css', 'light', 'dist/styles.css'],
    ['styles.css', 'dark', 'dist/styles.css'],
    ['styles.light.css', 'light', 'dist/styles.light.css'],
    ['styles.dark.css', 'dark', 'dist/styles.dark.css'],
    ['tokens.css + Tailwind host', 'light', 'src/styles.css'],
    ['tokens.css + Tailwind host', 'dark', 'src/styles.css'],
    ['tokens.light.css + Tailwind host', 'light', 'src/styles.light.css'],
    ['tokens.dark.css + Tailwind host', 'dark', 'src/styles.dark.css'],
  ];

  for (const [stylesheet, theme, source] of deliveries) {
    const label = `${stylesheet.replace(/[^a-z0-9]+/gi, '-')}-${theme}`;
    const stylesheetText = source.startsWith('dist/')
      ? readFileSync(resolve(source), 'utf8')
      : await fetch(`${base}/${source}?direct`).then((response) => {
          assert.equal(response.ok, true, `Tailwind host ${source}`);
          return response.text();
        });
    assert.ok(
      !stylesheetText.includes('@tailwind '),
      'Tailwind host must compile its utilities',
    );
    const installed = evaluate(
      async (text, selectedTheme) => {
        for (const element of document.querySelectorAll(
          'style, link[rel="stylesheet"]',
        ))
          element.remove();
        const style = document.createElement('style');
        style.textContent = text;
        document.head.append(style);
        document.documentElement.classList.toggle(
          'dark',
          selectedTheme === 'dark',
        );
        document.documentElement.style.fontSize = '16px';
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        return {
          stylesheets: document.styleSheets.length,
          rules: style.sheet.cssRules.length,
        };
      },
      stylesheetText,
      theme,
    );
    assert.equal(
      installed.stylesheets,
      1,
      'No Storybook or source stylesheet may mask a delivery defect',
    );
    const result = {
      stylesheet,
      theme,
      source,
      sha256: createHash('sha256').update(stylesheetText).digest('hex'),
      installed,
    };

    result.geometry = evaluate(async () => {
      const images = Array.from(
        document.querySelectorAll('[data-testid="artwork-gallery"] img'),
      );
      await Promise.all(images.map((image) => image.decode()));
      const box = (element) => {
        const rectangle = element.getBoundingClientRect();
        return {
          x: rectangle.x,
          y: rectangle.y,
          width: rectangle.width,
          height: rectangle.height,
        };
      };
      return images.map((image) => {
        const style = getComputedStyle(image);
        return {
          name: image.alt,
          testId: image.dataset.testid,
          box: box(image),
          intrinsic: [
            Number(image.getAttribute('width')),
            Number(image.getAttribute('height')),
          ],
          natural: [image.naturalWidth, image.naturalHeight],
          fit: style.objectFit,
          position: style.objectPosition,
          background: style.backgroundColor,
          border: style.borderWidth,
          radius: style.borderRadius,
          clip: style.clipPath,
          mask: style.maskImage,
          shrink: style.flexShrink,
          loaded: image.complete && image.naturalWidth > 0,
        };
      });
    });
    for (const layout of ['roomy', 'constrained']) {
      for (const [size, extent] of [
        ['small', 32],
        ['medium', 64],
        ['large', 128],
        ['fourth', 93],
      ]) {
        const image = result.geometry.find(
          (image) => image.testId === `${layout}-${size}`,
        );
        assert.deepEqual([image.box.width, image.box.height], [extent, extent]);
        assert.deepEqual(image.intrinsic, [300, 150]);
      }
    }
    for (const image of result.geometry.filter(
      (image) => image.testId !== 'default-figure',
    )) {
      assert.equal(image.loaded, true);
      assert.equal(image.fit, 'contain');
      assert.equal(image.position, '50% 50%');
      assert.equal(image.background, 'rgba(0, 0, 0, 0)');
      assert.equal(image.border, '0px');
      assert.equal(image.radius, '0px');
      assert.equal(image.clip, 'none');
      assert.equal(image.mask, 'none');
      assert.equal(image.shrink, '0');
    }
    const framed = result.geometry.find(
      (image) => image.testId === 'default-figure',
    );
    assert.deepEqual([framed.box.width, framed.box.height], [240, 240]);
    assert.equal(framed.fit, 'cover');
    assert.equal(framed.position, '50% 0%');
    assert.notEqual(framed.background, 'rgba(0, 0, 0, 0)');

    result.pressure = evaluate(() => {
      const constrained = document.querySelector('[data-layout="constrained"]');
      constrained.style.width = '160px';
      for (const row of constrained.querySelectorAll('[data-size]'))
        row.style.flexWrap = 'nowrap';
      const measurements = Array.from(constrained.querySelectorAll('img')).map(
        (image) => ({
          size: image.dataset.testid,
          width: image.getBoundingClientRect().width,
          height: image.getBoundingClientRect().height,
        }),
      );
      const wrapper = document.querySelector(
        '[data-testid="wrapper-examples"]',
      );
      wrapper.style.width = '160px';
      wrapper.style.flexWrap = 'nowrap';
      const wrappers = Array.from(wrapper.children).map((element) => ({
        tag: element.tagName,
        width: element.getBoundingClientRect().width,
        imageWidth: (element.matches('img')
          ? element
          : element.querySelector('img')
        ).getBoundingClientRect().width,
        shrink: getComputedStyle(element).flexShrink,
      }));
      wrapper.style.removeProperty('width');
      wrapper.style.flexWrap = 'wrap';
      constrained.style.width = '220px';
      for (const row of constrained.querySelectorAll('[data-size]'))
        row.style.flexWrap = 'wrap';
      return { measurements, wrappers };
    });
    assert.deepEqual(
      result.pressure.measurements.map((image) => [image.width, image.height]),
      [
        [32, 32],
        [64, 64],
        [128, 128],
        [93, 93],
      ],
    );
    for (const wrapper of result.pressure.wrappers) {
      assert.deepEqual(
        [wrapper.width, wrapper.imageWidth, wrapper.shrink],
        [128, 128, '0'],
      );
    }

    result.live = evaluate(async () => {
      const gallery = document.querySelector('[data-testid="artwork-gallery"]');
      const image = gallery.querySelector('[data-testid="live-artwork"]');
      const extent = () => [
        image.getBoundingClientRect().width,
        image.getBoundingClientRect().height,
      ];
      const before = extent();
      gallery.style.setProperty('--fixture-artwork-live', '117px');
      await new Promise(requestAnimationFrame);
      const changed = extent();
      const retained =
        image === gallery.querySelector('[data-testid="live-artwork"]');
      document.documentElement.style.fontSize = '28px';
      const rootChanged = extent();
      const pixelSizes = Array.from(
        gallery.querySelectorAll('[data-layout="constrained"] img'),
      ).map((element) => element.getBoundingClientRect().width);
      document.documentElement.style.fontSize = '16px';
      gallery.style.setProperty('--fixture-artwork-live', '64px');
      const roomy = gallery.querySelector('[data-layout="roomy"]');
      roomy.style.width = '900px';
      const widened = Array.from(roomy.querySelectorAll('img')).map(
        (element) => element.getBoundingClientRect().width,
      );
      roomy.style.width = '16px';
      const narrowerThanImage = Array.from(roomy.querySelectorAll('img')).map(
        (element) => element.getBoundingClientRect().width,
      );
      roomy.style.width = '640px';
      return {
        before,
        changed,
        retained,
        rootChanged,
        pixelSizes,
        widened,
        narrowerThanImage,
        restored: extent(),
      };
    });
    assert.deepEqual(result.live.before, [64, 64]);
    assert.deepEqual(result.live.changed, [117, 117]);
    assert.equal(result.live.retained, true);
    assert.deepEqual(result.live.rootChanged, [117, 117]);
    for (const sizes of [
      result.live.pixelSizes,
      result.live.widened,
      result.live.narrowerThanImage,
    ])
      assert.deepEqual(sizes, [32, 64, 128, 93]);
    assert.deepEqual(result.live.restored, [64, 64]);

    result.wrappers = evaluate(() => {
      const root = document.querySelector('[data-testid="wrapper-examples"]');
      root.scrollIntoView({ block: 'center' });
      return Array.from(root.children).map((outermost) => {
        const image = outermost.matches('img')
          ? outermost
          : outermost.querySelector('img');
        const rectangle = image.getBoundingClientRect();
        const caption = outermost.querySelector('figcaption');
        const overlay = outermost.querySelector(
          '[data-testid="artwork-overlay"]',
        );
        const imageBox = {
          x: rectangle.x,
          y: rectangle.y,
          width: rectangle.width,
          height: rectangle.height,
        };
        const overlayBox = overlay?.getBoundingClientRect();
        const captionBox = caption?.getBoundingClientRect();
        return {
          id: outermost.dataset.testid,
          tag: outermost.tagName,
          imageBox,
          natural: [image.naturalWidth, image.naturalHeight],
          alt: image.getAttribute('alt'),
          inventedName:
            image.hasAttribute('aria-label') || image.hasAttribute('title'),
          hookCount: document.querySelectorAll(
            `[data-testid="${outermost.dataset.testid}"]`,
          ).length,
          caption: caption && {
            top: captionBox.top,
            height: captionBox.height,
            width: captionBox.width,
            fits: caption.scrollWidth <= caption.clientWidth,
            color: getComputedStyle(caption).color,
          },
          overlay: overlay && {
            x: overlayBox.x,
            y: overlayBox.y,
            width: overlayBox.width,
            height: overlayBox.height,
            hidden: overlay.getAttribute('aria-hidden'),
            position: getComputedStyle(overlay).position,
          },
        };
      });
    });
    for (const wrapper of result.wrappers) {
      assert.deepEqual(
        [wrapper.imageBox.width, wrapper.imageBox.height],
        [128, 128],
      );
      assert.equal(wrapper.hookCount, 1);
      assert.equal(wrapper.inventedName, false);
      if (wrapper.caption) {
        assert.ok(wrapper.caption.top >= wrapper.imageBox.y + 128);
        assert.ok(wrapper.caption.height > 0);
        assert.equal(wrapper.caption.fits, true);
        assert.equal(wrapper.alt, '');
      } else assert.ok(wrapper.alt.length > 0);
      if (wrapper.overlay) {
        const { hidden, position, ...rectangle } = wrapper.overlay;
        assert.deepEqual(rectangle, wrapper.imageBox);
        assert.equal(hidden, 'true');
        assert.equal(position, 'absolute');
      }
    }
    result.imageOnlyTokens = evaluate(() => {
      const gallery = document.querySelector('[data-testid="artwork-gallery"]');
      const wrapper = gallery.querySelector('[data-testid="wrapper-examples"]');
      const images = Array.from(wrapper.querySelectorAll('img'));
      const token = gallery.style.getPropertyValue('--fixture-artwork-large');
      for (const image of images)
        image.style.setProperty('--fixture-artwork-large', '128px');
      gallery.style.removeProperty('--fixture-artwork-large');
      wrapper.style.display = 'block';
      const measurements = Array.from(wrapper.children).map((outermost) => {
        const image = outermost.matches('img')
          ? outermost
          : outermost.querySelector('img');
        const overlay = outermost.querySelector(
          '[data-testid="artwork-overlay"]',
        );
        return {
          id: outermost.dataset.testid,
          width: outermost.getBoundingClientRect().width,
          imageWidth: image.getBoundingClientRect().width,
          overlayWidth: overlay?.getBoundingClientRect().width,
        };
      });
      gallery.style.setProperty('--fixture-artwork-large', token);
      for (const image of images)
        image.style.removeProperty('--fixture-artwork-large');
      wrapper.style.display = 'flex';
      return measurements;
    });
    for (const wrapper of result.imageOnlyTokens) {
      assert.deepEqual(
        [wrapper.width, wrapper.imageWidth],
        [128, 128],
        'A token declared only on the image must also size its wrappers',
      );
      if (wrapper.overlayWidth !== undefined)
        assert.equal(wrapper.overlayWidth, 128);
    }
    result.screenshot = screenshot(label);
    const probes = result.wrappers.flatMap((wrapper) => {
      const { x, y, width, height } = wrapper.imageBox;
      const [sourceWidth, sourceHeight] = wrapper.natural;
      const scale = Math.min(width / sourceWidth, height / sourceHeight);
      const left = x + (width - sourceWidth * scale) / 2;
      const top = y + (height - sourceHeight * scale) / 2;
      const right = left + sourceWidth * scale;
      const bottom = top + sourceHeight * scale;
      const edgePoints = [
        [left + 3, top + 3],
        [right - 3, top + 3],
        [left + 3, bottom - 3],
        [right - 3, bottom - 3],
      ];
      const transparentPoints = [[x + width / 2, y + height / 2]];
      if (sourceWidth > sourceHeight)
        transparentPoints.push([x + width / 2, y + 8]);
      if (sourceHeight > sourceWidth)
        transparentPoints.push([x + 8, y + height / 2]);
      return [
        ...edgePoints.map((point) => ({ id: wrapper.id, kind: 'edge', point })),
        ...transparentPoints.map((point) => ({
          id: wrapper.id,
          kind: 'transparent',
          point,
        })),
      ];
    });
    result.pixels = JSON.parse(
      execFileSync(
        'python3',
        [
          '-c',
          `
import io, json, sys
from PIL import Image, ImageCms
request = json.load(sys.stdin)
image = Image.open(request['path'])
if 'icc_profile' in image.info:
    profile = ImageCms.ImageCmsProfile(io.BytesIO(image.info['icc_profile']))
    image = ImageCms.profileToProfile(image, profile, ImageCms.createProfile('sRGB'))
image = image.convert('RGB')
result = []
for probe in request['probes']:
    x, y = map(int, probe['point'])
    pixel = image.getpixel((x, y))
    expected = [(215, 38, 61)] if probe['kind'] == 'edge' else [(255, 255, 255), (184, 199, 212)]
    assert any(max(abs(a-b) for a,b in zip(pixel, color)) <= 3 for color in expected), (probe, pixel)
    result.append({**probe, 'pixel': pixel})
print(json.dumps(result))
`,
        ],
        {
          input: JSON.stringify({ path: result.screenshot, probes }),
          encoding: 'utf8',
        },
      ),
    );
    report.cases.push(result);
    writeFileSync(
      join(evidence, 'results.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    process.stdout.write(
      `PASS ${stylesheet} (${theme}): geometry, flex pressure, live/root/holder changes, wrappers, ${result.pixels.length} painted pixel probes\n`,
    );
  }
  evaluate(() => {
    window.scrollTo(0, 0);
    return true;
  });
  report.gallery = screenshot('gallery');
  evaluate(() => {
    document
      .querySelector('[data-layout="constrained"]')
      .scrollIntoView({ block: 'start' });
    return true;
  });
  report.constrained = screenshot('constrained');
  report.finished = new Date().toISOString();
  report.passed = true;
  process.stdout.write(
    `PASS all ${report.cases.length} delivery/theme cases; evidence: ${evidence}\n`,
  );
} finally {
  writeFileSync(
    join(evidence, 'results.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(
    join(evidence, 'commands.json'),
    `${JSON.stringify(commands, null, 2)}\n`,
  );
}
