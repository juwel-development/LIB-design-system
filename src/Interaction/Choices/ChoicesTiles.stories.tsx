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

const measureGallery = async (group: HTMLElement): Promise<number> => {
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
    for (const image of tile.querySelectorAll('img')) {
      await image.decode();
      const art = image.getBoundingClientRect();
      await expect(art.width).toBe(64);
      await expect(art.height).toBe(64);
      await expect(art.left).toBeGreaterThanOrEqual(box.left);
      await expect(art.right).toBeLessThanOrEqual(box.right);
      await expect(art.top).toBeGreaterThanOrEqual(box.top);
      await expect(art.bottom).toBeLessThanOrEqual(box.bottom);
      await expect(getComputedStyle(image).objectFit).toBe('contain');
      const ratio = image.naturalWidth / image.naturalHeight;
      await expect(ratio).toBe(image.getAttribute('width') === '240' ? 2 : 0.5);
      await expect(getComputedStyle(image).clipPath).toBe('none');
      await expect(getComputedStyle(tile).overflow).toBe('visible');
      const text = image.nextElementSibling?.getBoundingClientRect();
      await expect(text?.top).toBeGreaterThanOrEqual(art.bottom);
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
