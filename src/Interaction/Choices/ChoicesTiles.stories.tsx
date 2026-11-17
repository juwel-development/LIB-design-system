import type { Meta, StoryObj } from '@storybook/react-vite';
import { Choices, Figure } from 'index';
import { type CSSProperties, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof Choices.Root> = {
  title: 'Interaction/Choices/Tiles',
  component: Choices.Root,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof meta>;
type GalleryTheme = CSSProperties & Record<`--${string}`, string>;

// The real inventory sizes, with abstract edge-marked art rather than consumer Face composition.
const inventories = [
  { title: 'Hairstyles', count: 14, first: 'Bald', dash: false },
  { title: 'Hair colours', count: 11, first: 'Natural black', dash: false },
  { title: 'Beards', count: 7, first: 'No beard', dash: true },
  { title: 'Headwear', count: 5, first: 'No headwear', dash: true },
  { title: 'Eyes', count: 6, first: 'Round eyes', dash: false },
] as const;

const optionId = (category: number, index: number): string =>
  `category-${category}-choice-${index}`;
const optionLabel = (first: string, index: number): string => {
  if (index === 0) return first;
  if (index === 1) return 'Long flowing waves swept over the shoulder';
  if (index === 2) return 'Lange geschwungene Strähnen über beiden Schultern';
  if (index === 3)
    return 'Donaudampfschifffahrtsgesellschaftskapitänsanwärterauswahl';
  return `Option ${index + 1}`;
};
const artworkSource = (index: number, alternate: boolean): string => {
  const width = index % 2 === 0 ? 240 : 120;
  const height = index % 2 === 0 ? 120 : 240;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="M0 0h16v16H0ZM${width - 16} 0h16v16h-16ZM0 ${height - 16}h16v16H0ZM${width - 16} ${height - 16}h16v16h-16Z" fill="#d7263d"/><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 3}" ry="${height / 3}" fill="${alternate ? '#19855a' : '#146ac8'}"/><text x="${width / 2}" y="${height / 2 + 8}" text-anchor="middle" fill="white" font-size="24">${index + 1}</text></svg>`)}`;
};

const Gallery = () => {
  const [category, setCategory] = useState(0);
  const [selected, setSelected] = useState(optionId(0, 0));
  const [alternate, setAlternate] = useState(false);
  const [roomy, setRoomy] = useState(false);
  const [ignore, setIgnore] = useState(false);
  const [revision, setRevision] = useState(0);
  const [requests, setRequests] = useState<string[]>([]);
  const [onSelect$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe((value) => {
      setRequests((previous) => [...previous, value]);
      if (!ignore) setSelected(value);
    });
    return () => subscription.unsubscribe();
  }, [onSelect$, ignore]);
  const inventory = inventories[category] ?? inventories[0];
  const changeCategory = (index: number): void => {
    setCategory(index);
    setSelected(optionId(index, 0));
  };
  return (
    <div
      data-testid="tile-gallery"
      style={
        {
          '--choice-tile-min-width': roomy ? '13rem' : '9rem',
          '--gallery-artwork-size': '64px',
          color: 'var(--color-foreground)',
          background: 'var(--color-surface)',
        } as GalleryTheme
      }
    >
      <p>
        Complete inventories, one category at a time. Red marks touch every
        artboard edge. Names and images are consumer-owned; the art here is an
        abstract fixture.
      </p>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBlock: 16 }}
      >
        {inventories.map((entry, index) => (
          <button
            key={entry.title}
            type="button"
            onClick={() => changeCategory(index)}
          >
            {entry.title}
          </button>
        ))}
        <button type="button" onClick={() => setAlternate(!alternate)}>
          Update artwork
        </button>
        <button type="button" onClick={() => setRoomy(!roomy)}>
          Change tile token
        </button>
        <button
          type="button"
          onClick={() => setIgnore(!ignore)}
          aria-pressed={ignore}
        >
          Ignore requests
        </button>
        <button type="button" onClick={() => setRevision(revision + 1)}>
          Rerender
        </button>
      </div>
      <button type="button">Before gallery</button>
      <Choices.Root
        arrangement="tiles"
        selected={selected}
        onSelect$={onSelect$}
        label={inventory.title}
      >
        {Array.from({ length: inventory.count }, (_, index) => (
          <Choices.Choice
            key={optionId(category, index)}
            value={optionId(category, index)}
            name={inventory.dash && index === 0 ? inventory.first : undefined}
          >
            {inventory.dash && index === 0 ? (
              '–'
            ) : (
              <>
                <Figure
                  presentation="artwork"
                  size="--gallery-artwork-size"
                  src={artworkSource(index, alternate)}
                  alt=""
                  width={index % 2 === 0 ? 240 : 120}
                  height={index % 2 === 0 ? 120 : 240}
                  priority
                />
                <span>{optionLabel(inventory.first, index)}</span>
              </>
            )}
          </Choices.Choice>
        ))}
      </Choices.Root>
      <button type="button">After gallery</button>
      <details>
        <summary>Selection requests</summary>
        <pre
          data-testid="requests"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {JSON.stringify(requests)}
        </pre>
      </details>
      <p>Render revision: {revision}</p>
    </div>
  );
};

const contentBox = (element: Element) => {
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return {
    left:
      box.left +
      parseFloat(style.borderLeftWidth) +
      parseFloat(style.paddingLeft),
    right:
      box.right -
      parseFloat(style.borderRightWidth) -
      parseFloat(style.paddingRight),
    top:
      box.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop),
  };
};

const intersects = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right - 0.5 &&
  b.left < a.right - 0.5 &&
  a.top < b.bottom - 0.5 &&
  b.top < a.bottom - 0.5;

// A type role's size in CSS px: the roles are declared in rem.
const rolePixels = (role: string): number =>
  parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(role),
  ) * parseFloat(getComputedStyle(document.documentElement).fontSize);

const measureGallery = async (
  group: HTMLElement,
  artwork = 64,
): Promise<number> => {
  const bounds = group.getBoundingClientRect();
  const tiles = within(group).getAllByRole('radio');
  const style = getComputedStyle(group);
  const minimum =
    parseFloat(style.getPropertyValue('--choice-tile-min-width')) *
    parseFloat(getComputedStyle(document.documentElement).fontSize);
  const gap = parseFloat(style.columnGap);
  const columns = Math.max(
    1,
    Math.floor((bounds.width + gap) / (minimum + gap)),
  );
  await expect(style.display).toBe('grid');
  await expect(
    new Set(tiles.map((tile) => Math.round(tile.getBoundingClientRect().left)))
      .size,
  ).toBe(Math.min(columns, tiles.length));
  await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth + 1);
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
  const firstWidth = tiles[0]?.getBoundingClientRect().width ?? 0;
  for (const tile of tiles) {
    const box = tile.getBoundingClientRect();
    await expect(Math.abs(box.width - firstWidth)).toBeLessThan(1);
    await expect(box.left).toBeGreaterThanOrEqual(bounds.left - 1);
    await expect(box.right).toBeLessThanOrEqual(bounds.right + 1);
    await expect(tile.scrollWidth).toBeLessThanOrEqual(tile.clientWidth + 1);
    const marker = tile.querySelector('[data-choice-marker]');
    const name = tile.querySelector<HTMLElement>('[data-choice-name]');
    if (!marker || !name) throw new Error('A tile needs its marker and name');
    const content = contentBox(tile);
    const markerBox = marker.getBoundingClientRect();
    const nameCell = name.getBoundingClientRect();
    const nameRange = document.createRange();
    nameRange.selectNodeContents(name);
    const nameText = nameRange.getBoundingClientRect();
    // The marker sits in the top inline-end corner; the name spans the content width beneath it.
    await expect(Math.abs(markerBox.right - content.right)).toBeLessThan(1);
    await expect(Math.abs(markerBox.top - content.top)).toBeLessThan(1);
    await expect(Math.abs(nameCell.left - content.left)).toBeLessThan(1);
    await expect(Math.abs(nameCell.right - content.right)).toBeLessThan(1);
    await expect(nameCell.top).toBeGreaterThanOrEqual(markerBox.bottom);
    await expect(nameText.left).toBeGreaterThanOrEqual(content.left - 1);
    await expect(nameText.right).toBeLessThanOrEqual(content.right + 1);
    await expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth + 1);
    const caption = getComputedStyle(name);
    await expect(caption.textAlign).toBe('center');
    await expect(parseFloat(caption.fontSize)).toBe(rolePixels('--text-small'));
    await expect(caption.hyphens).toBe('auto');
    await expect(caption.overflowWrap).toBe('break-word');
    for (const image of tile.querySelectorAll('img')) {
      await image.decode();
      const art = image.getBoundingClientRect();
      await expect(art.width).toBe(artwork);
      await expect(art.height).toBe(artwork);
      await expect(art.left).toBeGreaterThanOrEqual(box.left);
      await expect(art.right).toBeLessThanOrEqual(box.right);
      await expect(art.top).toBeCloseTo(content.top, 1);
      await expect(
        Math.abs((art.left + art.right) / 2 - (box.left + box.right) / 2),
      ).toBeLessThanOrEqual(1);
      await expect(intersects(art, markerBox)).toBe(false);
      await expect(nameCell.top).toBeGreaterThanOrEqual(art.bottom);
      await expect(art.bottom).toBeLessThanOrEqual(box.bottom);
      await expect(getComputedStyle(image).objectFit).toBe('contain');
      const ratio = image.naturalWidth / image.naturalHeight;
      await expect(ratio).toBe(image.getAttribute('width') === '240' ? 2 : 0.5);
      await expect(getComputedStyle(image).clipPath).toBe('none');
      await expect(getComputedStyle(tile).overflow).toBe('visible');
    }
  }
  return columns;
};

const tileGeometry = (group: HTMLElement) => {
  const origin = group.getBoundingClientRect();
  return within(group)
    .getAllByRole('radio')
    .map((tile) => {
      const box = tile.getBoundingClientRect();
      return {
        left: box.left - origin.left,
        top: box.top - origin.top,
        width: box.width,
        height: box.height,
      };
    });
};

export const NarrowTiles: Story = {
  render: () => (
    <div
      style={
        {
          width: 140,
          maxWidth: '100%',
          '--choice-marker-size': '2rem',
          '--gallery-artwork-size': '48px',
        } as GalleryTheme
      }
    >
      <Choices.Root
        arrangement="tiles"
        label="Narrow choices with a larger marker"
        selected="image"
        onSelect$={new Subject<string>()}
      >
        <Choices.Choice value="image">
          <Figure
            presentation="artwork"
            size="--gallery-artwork-size"
            src={artworkSource(0, false)}
            alt=""
            width={240}
            height={120}
            priority
          />
          <span>Long flowing waves swept over the shoulder</span>
        </Choices.Choice>
        <Choices.Choice value="text">
          Donaudampfschifffahrtsgesellschaftskapitänsanwärterauswahl
        </Choices.Choice>
        <Choices.Choice value="none" name="No beard">
          –
        </Choices.Choice>
      </Choices.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('radiogroup');
    await expect(await measureGallery(group, 48)).toBe(1);
    for (const tile of within(group).getAllByRole('radio')) {
      const marker = tile.querySelector('[data-choice-marker]');
      await expect(marker?.getBoundingClientRect().height).toBe(32);
    }
    canvasElement.dataset.tileMeasurements = JSON.stringify(
      tileGeometry(group),
    );
    canvasElement.dataset.tilePlay = 'passed';
  },
};

export const InlineNames: Story = {
  render: () => (
    <div
      style={
        {
          width: 400,
          maxWidth: '100%',
          '--choice-tile-min-width': '20rem',
        } as GalleryTheme
      }
    >
      <Choices.Root
        arrangement="tiles"
        label="Inline tile names"
        selected="image"
        onSelect$={new Subject<string>()}
      >
        <Choices.Choice value="image" description="Complete artwork and name.">
          <img src={artworkSource(0, false)} alt="" width={64} height={64} />
          Long <strong>flowing</strong> waves
        </Choices.Choice>
        <Choices.Choice value="text" description="A text-only choice.">
          Long <strong>flowing</strong> waves
        </Choices.Choice>
      </Choices.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('radiogroup');
    for (const tile of within(group).getAllByRole('radio')) {
      await expect(tile).toHaveAccessibleName('Long flowing waves');
      const label = tile.querySelector('[data-choice-label]');
      const marker = tile.querySelector('[data-choice-marker]');
      if (!label || !marker)
        throw new Error('A tile needs its name and marker');
      const text = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      const textBoxes: DOMRect[] = [];
      while (text.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(text.currentNode);
        textBoxes.push(range.getBoundingClientRect());
      }
      const nameTop = textBoxes[0]?.top ?? 0;
      for (const box of textBoxes) {
        await expect(box.top).toBeCloseTo(nameTop, 0);
        await expect(box.top).toBeGreaterThanOrEqual(
          marker.getBoundingClientRect().bottom,
        );
      }
      await expect(tile.scrollWidth).toBeLessThanOrEqual(tile.clientWidth);
    }
    canvasElement.dataset.tileMeasurements = JSON.stringify(
      tileGeometry(group),
    );
    canvasElement.dataset.tilePlay = 'passed';
  },
};

export const FullInventory: Story = {
  render: () => <Gallery />,
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    const measurements: {
      category: string;
      count: number;
      columns: number;
      tileWidth: number;
      groupWidth: number;
    }[] = [];
    await expect(
      getComputedStyle(canvas.getByTestId('tile-gallery')).backgroundColor,
    ).toBe(globals.theme === 'dark' ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)');
    const requests = canvas.getByTestId('requests');
    await expect(requests).toHaveTextContent('[]');
    let group = canvas.getByRole('radiogroup');
    const columns = await measureGallery(group);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change tile token' }),
    );
    await expect(await measureGallery(group)).toBeLessThan(columns);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change tile token' }),
    );

    const firstImage = group.querySelector('img');
    const originalSource = firstImage?.src;
    await userEvent.click(
      canvas.getByRole('button', { name: 'Update artwork' }),
    );
    await waitFor(() => expect(firstImage?.src).not.toBe(originalSource));
    await expect(group.querySelector('img')).toBe(firstImage);
    await expect(requests).toHaveTextContent('[]');
    await userEvent.click(canvas.getByRole('button', { name: 'Rerender' }));
    await expect(requests).toHaveTextContent('[]');

    for (const [category, inventory] of inventories.entries()) {
      await userEvent.click(
        canvas.getByRole('button', { name: inventory.title }),
      );
      group = canvas.getByRole('radiogroup', { name: inventory.title });
      const tiles = within(group).getAllByRole('radio');
      await expect(tiles).toHaveLength(inventory.count);
      const measuredColumns = await measureGallery(group);
      measurements.push({
        category: inventory.title,
        count: tiles.length,
        columns: measuredColumns,
        tileWidth: tiles[0]?.getBoundingClientRect().width ?? 0,
        groupWidth: group.getBoundingClientRect().width,
      });
      const first = tiles[0];
      const last = tiles.at(-1);
      if (!first || !last)
        throw new Error('The full inventory must be present');
      await expect(first).toHaveAccessibleName(inventory.first);
      if (inventory.dash) {
        await expect(first).toHaveTextContent('–');
        await expect(first.querySelector('img')).toBeNull();
      }
      const geometry = tileGeometry(group);
      await userEvent.click(
        canvas.getByRole('button', { name: 'Before gallery' }),
      );
      await userEvent.tab();
      await expect(first).toHaveFocus();
      await expect(first.matches(':focus-visible')).toBe(true);
      await expect(getComputedStyle(first).outlineStyle).toBe('solid');
      await expect(getComputedStyle(first).outlineColor).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      await expect(
        parseFloat(getComputedStyle(first).outlineOffset),
      ).toBeGreaterThan(0);
      await expect(getComputedStyle(group).overflow).toBe('visible');
      await expect(
        parseFloat(getComputedStyle(first).outlineWidth),
      ).toBeGreaterThan(0);
      await userEvent.keyboard('{ArrowLeft}');
      await expect(last).toHaveFocus();
      await expect(last).toBeChecked();
      await expect(
        last.querySelector('[data-choice-marker-dot]'),
      ).not.toBeNull();
      await userEvent.keyboard('{ArrowRight}');
      await expect(first).toHaveFocus();
      for (const tile of tiles.slice(1)) {
        await userEvent.keyboard('{ArrowDown}');
        await expect(tile).toHaveFocus();
        await expect(tile).toBeChecked();
      }
      await userEvent.tab();
      await expect(
        canvas.getByRole('button', { name: 'After gallery' }),
      ).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(last).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(first).toHaveFocus();
      await expect(first).toBeChecked();
      await expect(tileGeometry(group)).toEqual(geometry);
      const emitted: string[] = JSON.parse(requests.textContent ?? '[]');
      await expect(
        emitted.filter((value) => value.startsWith(`category-${category}-`)),
      ).toEqual([
        optionId(category, inventory.count - 1),
        optionId(category, 0),
        ...tiles.slice(1).map((_, index) => optionId(category, index + 1)),
        optionId(category, 0),
      ]);
      await userEvent.tab();
      await expect(
        canvas.getByRole('button', { name: 'After gallery' }),
      ).toHaveFocus();
    }

    await userEvent.click(
      canvas.getByRole('button', { name: 'Ignore requests' }),
    );
    const tiles = within(group).getAllByRole('radio');
    const first = tiles[0];
    const second = tiles[1];
    if (!first || !second)
      throw new Error('Two choices are needed for ignored requests');
    const before: string[] = JSON.parse(requests.textContent ?? '[]');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Before gallery' }),
    );
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{Enter} ');
    await expect(second).toHaveFocus();
    await expect(first).toBeChecked();
    await expect(second).not.toBeChecked();
    await expect(JSON.parse(requests.textContent ?? '[]')).toEqual([
      ...before,
      optionId(4, 1),
      optionId(4, 1),
      optionId(4, 1),
    ]);
    await userEvent.click(first);
    await userEvent.keyboard('{Enter} ');
    await userEvent.click(canvas.getByRole('button', { name: 'Rerender' }));
    await expect(JSON.parse(requests.textContent ?? '[]')).toHaveLength(
      before.length + 3,
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Ignore requests' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Hairstyles' }));
    await userEvent.click(
      canvas.getByRole('button', { name: 'Before gallery' }),
    );
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Bald' })).toHaveFocus();
    canvasElement.dataset.tileMeasurements = JSON.stringify(measurements);
    canvasElement.dataset.tilePlay = 'passed';
  },
};

// The consumer's real names (#184), with every syllable boundary a German break may use marked "·".
// A rendered line break is legitimate after a space, after an explicit hyphen or at a marked point.
const WORKLOAD = [
  {
    title: 'Hairstyles',
    lang: 'en',
    names: [
      'Bald',
      'Short cut',
      'Side part',
      'Curls',
      'Long',
      'Buzz cut',
      'Bob',
      'Ponytail',
      'Braids',
      'Dreadlocks',
      'High bun',
      'Braided crown',
      'Vintage updo',
      'Asymmetric sidecut',
    ],
  },
  {
    title: 'Frisuren',
    lang: 'de',
    names: [
      'Glat·ze',
      'Kurz·haar·schnitt',
      'Sei·ten·schei·tel',
      'Lo·cken',
      'Lang',
      'Ras·pel·kurz',
      'Bob',
      'Pfer·de·schwanz',
      'Zöp·fe',
      'Dread·locks',
      'Ho·her Dutt',
      'Flecht·kranz',
      'Vin·tage-Hoch·steck·fri·sur',
      'A·sym·me·tri·scher Side·cut',
    ],
  },
  {
    title: 'Hair colours',
    lang: 'en',
    names: [
      'Natural black',
      'Dark brown',
      'Chestnut',
      'Auburn',
      'Copper red',
      'Strawberry blonde',
      'Golden blonde',
      'Platinum',
      'Ash grey',
      'Silver white',
      'Pastel blue',
    ],
  },
  {
    title: 'Bärte',
    lang: 'de',
    dash: 'Kein Bart',
    names: [
      'Kein Bart',
      'Drei·ta·ge·bart',
      'Voll·bart',
      'Kinn·bart',
      'Schnurr·bart',
      'Ko·te·let·ten und Schnurr·bart',
      'Ge·zwir·bel·ter Schnurr·bart',
    ],
  },
  {
    title: 'Headwear',
    lang: 'en',
    dash: 'No headwear',
    names: ['No headwear', 'Cap', 'Beanie', 'Wide-brimmed hat', 'Headband'],
  },
  {
    title: 'Eyes',
    lang: 'en',
    names: [
      'Round eyes',
      'Almond eyes',
      'Hooded eyes',
      'Monolid eyes',
      'Upturned eyes',
      'Downturned eyes',
    ],
  },
] as const;

const plain = (name: string): string => name.replaceAll('·', '');
const syllableBreaks = (name: string): Set<number> => {
  const breaks = new Set<number>();
  let index = 0;
  for (const character of name) {
    if (character === '·') breaks.add(index);
    else index++;
  }
  return breaks;
};

// Where the rendered name breaks: the prefix ending at a character spans one line more than the
// prefix before it. A single character's own range cannot say - next to a hyphenation point
// Chromium reports it with the generated hyphen, on the line above.
const renderedBreaks = (element: Element): { text: string; at: number[] } => {
  const lines = (range: Range): number =>
    new Set(
      [...range.getClientRects()]
        .filter((box) => box.width > 0)
        .map((box) => Math.round(box.top)),
    ).size;
  let text = '';
  const at: number[] = [];
  let previous = 1;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    for (let index = 0; index < (node.textContent ?? '').length; index++) {
      const range = document.createRange();
      range.setStart(element, 0);
      range.setEnd(node, index + 1);
      const spanned = lines(range);
      if (spanned > previous) at.push(text.length);
      previous = spanned;
      text += node.textContent?.[index] ?? '';
    }
  }
  return { text, at };
};

const WorkloadGallery = ({
  title,
  lang,
  names,
  dash,
}: (typeof WORKLOAD)[number] & { dash?: string }) => {
  const [selected, setSelected] = useState(plain(names[0]));
  const [requests, setRequests] = useState<string[]>([]);
  const [onSelect$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe((value) => {
      setRequests((previous) => [...previous, value]);
      setSelected(value);
    });
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  return (
    <section lang={lang}>
      <h3>{title}</h3>
      <Choices.Root
        arrangement="tiles"
        selected={selected}
        onSelect$={onSelect$}
        label={title}
      >
        {names.map((syllables, index) => {
          const name = plain(syllables);
          return (
            <Choices.Choice
              key={name}
              value={name}
              name={name === dash ? name : undefined}
            >
              {name === dash ? (
                '–'
              ) : (
                <>
                  <Figure
                    presentation="artwork"
                    size="--gallery-artwork-size"
                    src={artworkSource(index, false)}
                    alt=""
                    width={index % 2 === 0 ? 240 : 120}
                    height={index % 2 === 0 ? 120 : 240}
                    priority
                  />
                  {name}
                </>
              )}
            </Choices.Choice>
          );
        })}
      </Choices.Root>
      <output aria-label={`${title} requests`} hidden>
        {JSON.stringify(requests)}
      </output>
    </section>
  );
};

export const ConsumerWorkload: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The consumer gallery from #184: 48px artwork in five 130.4px columns of a 684px gallery, with English and German names. German names hyphenate by the `lang` on their section.',
      },
    },
  },
  render: () => (
    <div
      style={
        {
          width: 684,
          maxWidth: '100%',
          '--choice-tile-min-width': '7.5rem',
          '--gallery-artwork-size': '48px',
        } as GalleryTheme
      }
    >
      <button type="button">Before galleries</button>
      {WORKLOAD.map((gallery) => (
        <WorkloadGallery key={gallery.title} {...gallery} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const measurements: {
      gallery: string;
      columns: number;
      tileWidth: number;
      breaks: string[];
    }[] = [];
    for (const gallery of WORKLOAD) {
      const group = canvas.getByRole('radiogroup', { name: gallery.title });
      const tiles = within(group).getAllByRole('radio');
      await expect(tiles).toHaveLength(gallery.names.length);
      const columns = await measureGallery(group, 48);
      const tileWidth = tiles[0]?.getBoundingClientRect().width ?? 0;
      // The consumer's own gallery: 684px, five columns sharing four 8px gaps.
      if (group.getBoundingClientRect().width >= 684) {
        await expect(columns).toBe(5);
        await expect(tileWidth).toBeCloseTo(130.4, 0);
      }
      const breaks: string[] = [];
      for (const [index, syllables] of gallery.names.entries()) {
        const name = tiles[index]?.querySelector('[data-choice-name]');
        if (!name) throw new Error('Every tile needs its name');
        await expect(tiles[index]).toHaveAccessibleName(plain(syllables));
        if ('dash' in gallery && plain(syllables) === gallery.dash) continue;
        const rendered = renderedBreaks(name);
        const allowed = syllableBreaks(syllables);
        for (const at of rendered.at) {
          breaks.push(
            `${rendered.text.slice(0, at)}|${rendered.text.slice(at)}`,
          );
          if (gallery.lang === 'de') {
            const before = rendered.text[at - 1];
            await expect(
              before === ' ' || before === '-' || allowed.has(at),
              `${rendered.text} breaks mid-syllable at ${at}`,
            ).toBe(true);
          }
        }
      }
      measurements.push({ gallery: gallery.title, columns, tileWidth, breaks });

      const before = tileGeometry(group);
      const second = tiles[1];
      if (!second) throw new Error('A second choice is needed');
      await userEvent.click(second);
      await expect(second).toBeChecked();
      await expect(tileGeometry(group)).toEqual(before);
      for (const tile of tiles) {
        const box = tile.getBoundingClientRect();
        await expect(box.width).toBeCloseTo(tileWidth, 1);
      }
    }

    const frisuren = canvas.getByRole('radiogroup', { name: 'Frisuren' });
    const [, second, third] = within(frisuren).getAllByRole('radio');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Before galleries' }),
    );
    await userEvent.tab();
    await userEvent.tab();
    await expect(second).toHaveFocus();
    await expect(second?.matches(':focus-visible')).toBe(true);
    await expect(getComputedStyle(second as Element).outlineStyle).toBe(
      'solid',
    );
    await userEvent.keyboard('{ArrowRight}');
    await expect(third).toHaveFocus();
    await expect(third).toBeChecked();
    const requests = canvas.getByLabelText('Frisuren requests', {
      selector: 'output',
    });
    await expect(JSON.parse(requests.textContent ?? '[]')).toEqual([
      'Kurzhaarschnitt',
      'Seitenscheitel',
    ]);
    canvasElement.dataset.tileMeasurements = JSON.stringify(measurements);
    canvasElement.dataset.tilePlay = 'passed';
  },
};

export const ConsumerShortenedName: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The library never shortens a name. A consumer that does, here with its own inline-block ellipsis, stays inside the name cell and still names the option in full through `name`.',
      },
    },
  },
  render: () => (
    <div
      lang="de"
      style={
        {
          width: 684,
          maxWidth: '100%',
          '--choice-tile-min-width': '7.5rem',
          '--gallery-artwork-size': '48px',
        } as GalleryTheme
      }
    >
      <Choices.Root
        arrangement="tiles"
        label="Frisuren"
        selected="sidecut"
        onSelect$={new Subject<string>()}
      >
        <Choices.Choice value="sidecut" name="Asymmetrischer Sidecut">
          <Figure
            presentation="artwork"
            size="--gallery-artwork-size"
            src={artworkSource(0, false)}
            alt=""
            width={240}
            height={120}
            priority
          />
          <span
            data-testid="shortened"
            style={{
              display: 'inline-block',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              verticalAlign: 'top',
            }}
          >
            Asymmetrischer Sidecut
          </span>
        </Choices.Choice>
        <Choices.Choice value="bob">
          <Figure
            presentation="artwork"
            size="--gallery-artwork-size"
            src={artworkSource(1, false)}
            alt=""
            width={120}
            height={240}
            priority
          />
          Bob
        </Choices.Choice>
      </Choices.Root>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('radiogroup');
    const tile = within(group).getByRole('radio', {
      name: 'Asymmetrischer Sidecut',
    });
    const shortened = within(canvasElement).getByTestId('shortened');
    const cell = tile.querySelector('[data-choice-name]');
    if (!cell) throw new Error('The tile needs its name cell');
    const cellBox = cell.getBoundingClientRect();
    const box = shortened.getBoundingClientRect();
    await expect(shortened.scrollWidth).toBeGreaterThan(shortened.clientWidth);
    await expect(box.left).toBeGreaterThanOrEqual(cellBox.left - 0.5);
    await expect(box.right).toBeLessThanOrEqual(cellBox.right + 0.5);
    canvasElement.dataset.tileMeasurements = JSON.stringify(
      tileGeometry(group),
    );
    canvasElement.dataset.tilePlay = 'passed';
  },
};

export const CaptionOnlyInTiles: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Only tiles set names as centred, hyphenating `small` captions; the other arrangements keep `body` names that wrap anywhere.',
      },
    },
  },
  render: () => (
    <div lang="de" style={{ width: 684, maxWidth: '100%' }}>
      {(['vertical', 'wrapping', 'columns', 'tiles'] as const).map(
        (arrangement) => (
          <Choices.Root
            key={arrangement}
            arrangement={arrangement}
            label={arrangement}
            selected="sidecut"
            onSelect$={new Subject<string>()}
          >
            <Choices.Choice value="sidecut">
              Asymmetrischer Sidecut
            </Choices.Choice>
            <Choices.Choice value="dutt">Hoher Dutt</Choices.Choice>
          </Choices.Root>
        ),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const measurements: Record<string, string[]> = {};
    for (const arrangement of ['vertical', 'wrapping', 'columns', 'tiles']) {
      const group = within(canvasElement).getByRole('radiogroup', {
        name: arrangement,
      });
      for (const choice of within(group).getAllByRole('radio')) {
        const label = choice.querySelector('[data-choice-label]');
        const name = choice.querySelector('[data-choice-name]') ?? label;
        if (!name) throw new Error('Every choice needs its name');
        const style = getComputedStyle(name);
        measurements[arrangement] = [
          ...(measurements[arrangement] ?? []),
          `${style.fontSize} ${style.hyphens} ${style.textAlign}`,
        ];
        if (arrangement === 'tiles') {
          await expect(parseFloat(style.fontSize)).toBe(
            rolePixels('--text-small'),
          );
          await expect(style.hyphens).toBe('auto');
          await expect(style.textAlign).toBe('center');
        } else {
          await expect(parseFloat(style.fontSize)).toBe(
            rolePixels('--text-body'),
          );
          await expect(style.hyphens).toBe('manual');
          await expect(style.overflowWrap).toBe('anywhere');
        }
      }
    }
    canvasElement.dataset.tileMeasurements = JSON.stringify(measurements);
    canvasElement.dataset.tilePlay = 'passed';
  },
};
