import type { Meta, StoryObj } from '@storybook/react-vite';
import { Choices, Figure } from 'index';
import { type CSSProperties, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof Choices.Root> = {
  title: 'Interaction/Choices/Columns',
  component: Choices.Root,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof meta>;
type ChoicesTheme = CSSProperties & Record<`--${string}`, string>;

const categories = [
  'Hair',
  'Hair colour',
  'Long flowing hair and shoulder-length accessories',
  'Lange geschwungene Strähnen über beiden Schultern',
  'Donaudampfschifffahrtsgesellschaftskapitänsanwärterauswahl',
  'Eyes',
  'Eyebrows',
  'Nose',
  'Mouth',
  'Beards',
  'Headwear',
  'Glasses',
  'Facial details',
];
const categoryId = (index: number): string => `category-${index}`;
const hairstyleId = (index: number): string => `hairstyle-${index}`;
const artwork = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="240"><path d="M0 0h120v240H0Z" fill="#146ac8"/><path d="M0 0h12v12H0Zm108 0h12v12h-12ZM0 228h12v12H0Zm108 0h12v12h-12Z" fill="#d7263d"/></svg>')}`;

const ColumnsAndGallery = () => {
  const [selected, setSelected] = useState(categoryId(3));
  const [hairstyle, setHairstyle] = useState(hairstyleId(0));
  const [wideColumns, setWideColumns] = useState(false);
  const [wideTiles, setWideTiles] = useState(false);
  const [ignoreRequests, setIgnoreRequests] = useState(false);
  const [requests, setRequests] = useState<string[]>([]);
  const [onSelect$] = useState(() => new Subject<string>());
  const [onHairstyle$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe((value) => {
      setRequests((previous) => [...previous, value]);
      if (!ignoreRequests) setSelected(value);
    });
    return () => subscription.unsubscribe();
  }, [onSelect$, ignoreRequests]);
  useEffect(() => {
    const subscription = onHairstyle$.subscribe(setHairstyle);
    return () => subscription.unsubscribe();
  }, [onHairstyle$]);
  return (
    <div
      style={
        {
          '--choice-column-min-width': wideColumns ? '22rem' : '14rem',
          '--choice-tile-min-width': wideTiles ? '15rem' : '9rem',
          '--workload-artwork-size': '64px',
        } as ChoicesTheme
      }
    >
      <p>
        Thirteen text categories beside the complete fourteen-choice Hairstyle
        gallery. Abstract art stands in for consumer-owned artwork; long English
        and German names wrap in full.
      </p>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBlock: 16 }}
      >
        <button type="button" onClick={() => setWideColumns(!wideColumns)}>
          Change column token
        </button>
        <button type="button" onClick={() => setWideTiles(!wideTiles)}>
          Change tile token
        </button>
        <button
          type="button"
          onClick={() => setIgnoreRequests(!ignoreRequests)}
        >
          Toggle unanswered requests
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,28rem),1fr))',
          gap: 'var(--space-stack)',
          alignItems: 'start',
        }}
      >
        <section style={{ minWidth: 0, maxWidth: '34rem' }}>
          <h2>Categories</h2>
          <button type="button">Before categories</button>
          <Choices.Root
            arrangement="columns"
            label="Categories"
            selected={selected}
            onSelect$={onSelect$}
          >
            {categories.map((name, index) => (
              <Choices.Choice key={name} value={categoryId(index)}>
                {name}
              </Choices.Choice>
            ))}
          </Choices.Root>
          <button type="button">After categories</button>
          <p>Existing vertical and wrapping boundaries:</p>
          <div style={{ width: 'calc((100% - var(--space-stack)) / 2)' }}>
            <Choices.Root
              label="Vertical comparison"
              selected="other"
              onSelect$={onSelect$}
            >
              <Choices.Choice value="hair">Hair</Choices.Choice>
              <Choices.Choice value="other">Other</Choices.Choice>
            </Choices.Root>
            <Choices.Root
              arrangement="wrapping"
              label="Wrapping comparison"
              selected="other"
              onSelect$={onSelect$}
            >
              <Choices.Choice value="hair">Hair</Choices.Choice>
              <Choices.Choice value="other">Other</Choices.Choice>
            </Choices.Root>
          </div>
        </section>
        <section style={{ minWidth: 0 }}>
          <h2>Hairstyles</h2>
          <Choices.Root
            arrangement="tiles"
            label="Hairstyles"
            selected={hairstyle}
            onSelect$={onHairstyle$}
          >
            {Array.from({ length: 14 }, (_, index) => (
              <Choices.Choice
                key={hairstyleId(index)}
                value={hairstyleId(index)}
                name={index === 0 ? 'No hairstyle' : undefined}
              >
                {index === 0 ? (
                  '–'
                ) : (
                  <>
                    <Figure
                      presentation="artwork"
                      size="--workload-artwork-size"
                      src={artwork}
                      alt=""
                      width={120}
                      height={240}
                      priority
                    />
                    <span>
                      {index === 1
                        ? categories[2]
                        : index === 2
                          ? categories[3]
                          : `Hairstyle ${index}`}
                    </span>
                  </>
                )}
              </Choices.Choice>
            ))}
          </Choices.Root>
        </section>
      </div>
      <output aria-label="Category requests">{JSON.stringify(requests)}</output>
    </div>
  );
};

const geometry = (group: HTMLElement) =>
  within(group)
    .getAllByRole('radio')
    .map((row) => {
      const box = row.getBoundingClientRect();
      return {
        left: box.left - group.getBoundingClientRect().left,
        top: box.top - group.getBoundingClientRect().top,
        width: box.width,
        height: box.height,
      };
    });

const measureColumns = async (group: HTMLElement): Promise<number> => {
  const rows = within(group).getAllByRole('radio');
  const bounds = group.getBoundingClientRect();
  const boxes = geometry(group);
  await expect(getComputedStyle(group).display).toBe('grid');
  await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth + 1);
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
  for (const [index, row] of rows.entries()) {
    const box = boxes[index];
    if (!box) throw new Error('Every choice needs geometry');
    await expect(Math.abs(box.width - (boxes[0]?.width ?? 0))).toBeLessThan(1);
    const rowBounds = row.getBoundingClientRect();
    await expect(rowBounds.left).toBeGreaterThanOrEqual(bounds.left - 1);
    await expect(rowBounds.right).toBeLessThanOrEqual(bounds.right + 1);
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
    const marker = row.querySelector('[data-choice-marker]');
    const label = row.querySelector('[data-choice-label]');
    if (!marker || !label)
      throw new Error('Every row needs its marker and label');
    const markerBox = marker.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    await expect(markerBox.right).toBeLessThanOrEqual(labelBox.left);
    await expect(markerBox.top).toBeGreaterThanOrEqual(labelBox.top);
    await expect(markerBox.top).toBeLessThan(labelBox.bottom);
  }
  return new Set(boxes.map((box) => Math.round(box.left))).size;
};

export const ConsumerWorkload: Story = {
  render: () => <ColumnsAndGallery />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Categories' });
    const gallery = canvas.getByRole('radiogroup', { name: 'Hairstyles' });
    const rows = within(group).getAllByRole('radio');
    const first = rows[0];
    const selected = rows[3];
    const last = rows.at(-1);
    if (!first || !selected || !last)
      throw new Error('All categories must be present');
    await expect(rows).toHaveLength(13);
    await expect(within(gallery).getAllByRole('radio')).toHaveLength(14);
    await expect(await measureColumns(group)).toBe(2);
    const original = geometry(group);
    const galleryOriginal = geometry(gallery);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change column token' }),
    );
    await expect(await measureColumns(group)).toBe(1);
    await expect(geometry(gallery)).toEqual(galleryOriginal);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change column token' }),
    );
    const galleryColumns = new Set(galleryOriginal.map((box) => box.left)).size;
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change tile token' }),
    );
    await expect(
      new Set(geometry(gallery).map((box) => box.left)).size,
    ).toBeLessThan(galleryColumns);
    await expect(geometry(group)).toEqual(original);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change tile token' }),
    );

    const vertical = within(
      canvas.getByRole('radiogroup', { name: 'Vertical comparison' }),
    ).getByRole('radio', { name: 'Hair' });
    const singleLineHeight =
      vertical.querySelector('[data-choice-label]')?.getBoundingClientRect()
        .height ?? 0;
    for (const row of rows) {
      const labelHeight =
        row.querySelector('[data-choice-label]')?.getBoundingClientRect()
          .height ?? 0;
      if (labelHeight <= singleLineHeight) {
        await expect(row.getBoundingClientRect().height).toBeLessThanOrEqual(
          vertical.getBoundingClientRect().height,
        );
      }
    }
    const marker = first.querySelector('[data-choice-marker]');
    if (!marker) throw new Error('The marker must identify an unselected row');
    const controlBorder = getComputedStyle(marker).borderTopColor;
    const foreground = getComputedStyle(
      first.querySelector('[data-choice-label]') ?? first,
    ).color;
    for (const row of rows) {
      await waitFor(() =>
        expect(getComputedStyle(row).borderTopColor).toBe(
          row === selected ? foreground : 'rgba(0, 0, 0, 0)',
        ),
      );
      await expect(getComputedStyle(row).borderTopWidth).toBe('1px');
      await expect(getComputedStyle(row).backgroundColor).toBe(
        'rgba(0, 0, 0, 0)',
      );
      const rowMarker = row.querySelector('[data-choice-marker]');
      await expect(
        rowMarker && getComputedStyle(rowMarker).borderTopColor,
      ).toBe(controlBorder);
    }
    for (const name of ['Vertical comparison', 'Wrapping comparison']) {
      const comparison = canvas.getByRole('radiogroup', { name });
      const [unselected, current] = within(comparison).getAllByRole('radio');
      if (!unselected || !current)
        throw new Error('Both comparison states must be present');
      await expect(getComputedStyle(unselected).borderTopColor).toBe(
        controlBorder,
      );
      await expect(getComputedStyle(current).borderTopColor).toBe(foreground);
    }
    const dash = within(gallery).getByRole('radio', { name: 'No hairstyle' });
    await expect(dash).toHaveTextContent('–');
    await expect(dash.querySelector('img')).toBeNull();
    for (const tile of within(gallery).getAllByRole('radio')) {
      await expect(tile.getBoundingClientRect().width).toBeCloseTo(
        dash.getBoundingClientRect().width,
        0,
      );
    }

    await userEvent.click(
      canvas.getByRole('button', { name: 'Before categories' }),
    );
    await userEvent.tab();
    await expect(selected).toHaveFocus();
    await expect(selected.matches(':focus-visible')).toBe(true);
    const focus = getComputedStyle(selected);
    await expect(focus.outlineStyle).toBe('solid');
    await expect(parseFloat(focus.outlineWidth)).toBeGreaterThan(0);
    await expect(parseFloat(focus.outlineOffset)).toBeGreaterThan(0);
    await expect(focus.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    const requested = [];
    for (let offset = 1; offset <= rows.length; offset++) {
      await userEvent.keyboard('{ArrowRight}');
      const index = (3 + offset) % rows.length;
      const row = rows[index];
      if (!row) throw new Error('Arrows must target a supplied choice');
      requested.push(categoryId(index));
      await expect(row).toHaveFocus();
      await expect(row).toBeChecked();
      await expect(
        row.querySelector('[data-choice-marker-dot]'),
      ).not.toBeNull();
      await expect(geometry(group)).toEqual(original);
      await waitFor(() =>
        expect(getComputedStyle(row).borderTopColor).toBe(foreground),
      );
    }
    await userEvent.tab();
    await expect(
      canvas.getByRole('button', { name: 'After categories' }),
    ).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(selected).toHaveFocus();
    for (const index of [2, 1, 0, 12]) {
      await userEvent.keyboard('{ArrowUp}');
      requested.push(categoryId(index));
      await expect(rows[index]).toHaveFocus();
      await expect(rows[index]).toBeChecked();
    }
    await expect(last).toBeChecked();
    const requests = canvas.getByRole('status', { name: 'Category requests' });
    await expect(JSON.parse(requests.textContent ?? '[]')).toEqual(requested);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Toggle unanswered requests' }),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Before categories' }),
    );
    await userEvent.tab();
    await expect(last).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    requested.push(categoryId(0));
    await expect(first).toHaveFocus();
    await expect(last).toBeChecked();
    await expect(first).not.toBeChecked();
    await expect(JSON.parse(requests.textContent ?? '[]')).toEqual(requested);
    canvasElement.dataset.columnMeasurements = JSON.stringify({
      viewport: window.innerWidth,
      columns: await measureColumns(group),
      rows: original,
    });
  },
};
