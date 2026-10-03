import { DefinitionList } from 'Display/DefinitionList/DefinitionList';
import { Table } from 'Display/Table/Table';
import { Eyebrow } from 'Display/Typography/Eyebrow/Eyebrow';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type CSSProperties,
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { ColumnLayout } from './ColumnLayout';

// The stories stand in for the consumer: they declare the minimum-width tokens on a holder, the
// way a product theme declares them on `:root` or a theme class, and size the holder to show the
// switch. Nothing here is a prop of the component.
type HolderStyle = CSSProperties & Record<`--${string}`, string>;

const comparison: HolderStyle = {
  '--main-column-min-width': '28rem',
  '--support-column-min-width': '12rem',
};

const Holder: FunctionComponent<{
  width: string;
  style?: HolderStyle;
  testId?: string;
  children: ReactNode;
}> = ({ width, style, testId, children }) => (
  <div
    style={{ ...comparison, ...style, width, maxWidth: '100%' }}
    data-testid={testId}
  >
    {children}
  </div>
);

const Artists: FunctionComponent<{ rows?: number }> = ({ rows = 4 }) => (
  <Table.Root caption={'A&R roster'}>
    <Table.Head>
      <Table.Row>
        <Table.HeaderCell scope={'col'}>Artist</Table.HeaderCell>
        <Table.HeaderCell scope={'col'} align={'right'}>
          Streams
        </Table.HeaderCell>
        <Table.HeaderCell scope={'col'}>Stage</Table.HeaderCell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      {['Marlow Vane', 'Ida Sol', 'The Low Tide', 'Jonas Reiter']
        .slice(0, rows)
        .map((artist, index) => (
          <Table.Row key={artist}>
            <Table.Cell>{artist}</Table.Cell>
            <Table.Cell align={'right'}>{(index + 1) * 12_480}</Table.Cell>
            <Table.Cell variant={'note'}>In conversation</Table.Cell>
          </Table.Row>
        ))}
    </Table.Body>
  </Table.Root>
);

const Summary: FunctionComponent = () => (
  <DefinitionList.Root>
    <DefinitionList.Item>
      <DefinitionList.Term>Artist</DefinitionList.Term>
      <DefinitionList.Description>Marlow Vane</DefinitionList.Description>
    </DefinitionList.Item>
    <DefinitionList.Item>
      <DefinitionList.Term>Home market</DefinitionList.Term>
      <DefinitionList.Description>Germany</DefinitionList.Description>
    </DefinitionList.Item>
    <DefinitionList.Item>
      <DefinitionList.Term>Contact</DefinitionList.Term>
      <DefinitionList.Description>
        management@example.com
      </DefinitionList.Description>
    </DefinitionList.Item>
  </DefinitionList.Root>
);

const columnsOf = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );

const widthOf = (element: HTMLElement): number =>
  element.getBoundingClientRect().width;

// One row: every column shares the first column's top edge and the next starts after the last.
const isOneRow = (root: HTMLElement): boolean => {
  const rectangles = columnsOf(root).map((column) =>
    column.getBoundingClientRect(),
  );
  return rectangles.every(
    (rectangle, index) =>
      rectangle.top === rectangles[0]?.top &&
      (index === 0 || (rectangles[index - 1]?.right ?? 0) <= rectangle.left),
  );
};

// One column: every track is as wide as the root and sits below the one before it.
const isOneColumn = (root: HTMLElement): boolean => {
  const width = widthOf(root);
  const rectangles = columnsOf(root).map((column) =>
    column.getBoundingClientRect(),
  );
  return rectangles.every(
    (rectangle, index) =>
      Math.abs(rectangle.width - width) < 0.5 &&
      (index === 0 || (rectangles[index - 1]?.bottom ?? 0) <= rectangle.top),
  );
};

const expectProportions = async (
  root: HTMLElement,
  weights: readonly number[],
): Promise<void> => {
  const columns = columnsOf(root);
  const gap = Number.parseFloat(getComputedStyle(root).columnGap);
  const remainder = widthOf(root) - gap * (columns.length - 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  await expect(isOneRow(root)).toBe(true);
  for (const [index, column] of columns.entries()) {
    await expect(
      Math.abs(widthOf(column) - (remainder * (weights[index] ?? 0)) / total),
    ).toBeLessThan(0.5);
  }
};

const meta: Meta<typeof ColumnLayout.Root> = {
  title: 'Arrangement/ColumnLayout',
  component: ColumnLayout.Root,
  tags: ['autodocs'],
  argTypes: {
    gap: {
      control: { type: 'radio' },
      options: ['stack', 'region'],
      description:
        'Which space role separates the columns, across the row and between stacked lines alike',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The consumer case: a roster table beside its selected artist's summary, two thirds to one third
 *  of the width left after the region gap. The holder declares `--main-column-min-width: 28rem`
 *  and `--support-column-min-width: 12rem`, so the row fits from `1.5em + max(28rem × 1.5,
 *  12rem × 3)` = 42rem plus a gap. Resize the frame below that to see every column take its own
 *  line. */
export const TableAndSummary: Story = {
  args: { gap: 'region' },
  render: (args) => (
    <Holder width={'64rem'} testId={'holder'}>
      <ColumnLayout.Root gap={args.gap} testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
          <Artists />
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--support-column-min-width'}>
          <Summary />
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId('layout');
    await expectProportions(root, [2, 1]);
    const [table, summary] = columnsOf(root);
    await expect(table?.getBoundingClientRect().top).toBe(
      summary?.getBoundingClientRect().top,
    );
    await expect(table?.getBoundingClientRect().height).not.toBe(
      summary?.getBoundingClientRect().height,
    );
  },
};

/** Three columns at `2`, `1`, `1`: a half and two quarters of the remaining width, aligned at the
 *  top and each as tall as its own content. */
export const ThreeColumns: Story = {
  render: () => (
    <Holder
      width={'72rem'}
      style={{ '--aside-column-min-width': '10rem' }}
      testId={'holder'}
    >
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
          <Artists />
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--support-column-min-width'}>
          <Summary />
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--aside-column-min-width'}>
          <Note>A short aside that is far shorter than its neighbours.</Note>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId('layout');
    await expectProportions(root, [2, 1, 1]);
    const heights = columnsOf(root).map(
      (column) => column.getBoundingClientRect().height,
    );
    await expect(new Set(heights).size).toBe(heights.length);
  },
};

/** Weights are ratios, not integers: `0.5` beside `1.5` is one quarter beside three quarters. */
export const FractionalWeights: Story = {
  render: () => (
    <Holder
      width={'64rem'}
      style={{
        '--main-column-min-width': '8rem',
        '--support-column-min-width': '24rem',
      }}
    >
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={0.5} minWidth={'--main-column-min-width'}>
          <P>A quarter.</P>
        </ColumnLayout.Column>
        <ColumnLayout.Column
          weight={1.5}
          minWidth={'--support-column-min-width'}
        >
          <P>Three quarters.</P>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    await expectProportions(
      within(canvasElement).getByTestId('layout'),
      [0.5, 1.5],
    );
  },
};

/** The switch is all or one at an exact width. The three holders are sized one pixel below,
 *  exactly at, and one pixel above the documented threshold, written here the way the component
 *  resolves it: `(n − 1) × gap + max(mᵢ × S ⁄ wᵢ)`. Only the first stacks. */
const thresholdHolder: HolderStyle = {
  ...comparison,
  '--threshold':
    'calc(1 * var(--space-region) + max(var(--main-column-min-width) * 1.5, var(--support-column-min-width) * 3))',
  display: 'grid',
  gap: 'var(--space-region)',
};

export const FitThreshold: Story = {
  render: () => (
    <div style={thresholdHolder}>
      {(
        [
          ['below', 'calc(var(--threshold) - 1px)'],
          ['at', 'var(--threshold)'],
          ['above', 'calc(var(--threshold) + 1px)'],
        ] as const
      ).map(([name, width]) => (
        <div key={name} style={{ width }}>
          <Eyebrow>{`One pixel ${name}`}</Eyebrow>
          <ColumnLayout.Root testId={name}>
            <ColumnLayout.Column
              weight={2}
              minWidth={'--main-column-min-width'}
            >
              <P>Main, two thirds.</P>
            </ColumnLayout.Column>
            <ColumnLayout.Column
              weight={1}
              minWidth={'--support-column-min-width'}
            >
              <P>Support, one third.</P>
            </ColumnLayout.Column>
          </ColumnLayout.Root>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(isOneColumn(canvas.getByTestId('below'))).toBe(true);
    await expect(isOneRow(canvas.getByTestId('at'))).toBe(true);
    await expect(isOneRow(canvas.getByTestId('above'))).toBe(true);
    await expectProportions(canvas.getByTestId('at'), [2, 1]);
  },
};

/** The space measured is the holder's, never the viewport's: on one wide screen a wide holder keeps
 *  its row while a narrow one beside it stacks, each deciding for itself. */
export const TwoHolders: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-region)' }}>
      <Holder width={'52rem'}>
        <ColumnLayout.Root testId={'wide'}>
          <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
            <Artists rows={2} />
          </ColumnLayout.Column>
          <ColumnLayout.Column
            weight={1}
            minWidth={'--support-column-min-width'}
          >
            <Summary />
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </Holder>
      <Holder width={'24rem'}>
        <ColumnLayout.Root testId={'narrow'}>
          <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
            <Artists rows={2} />
          </ColumnLayout.Column>
          <ColumnLayout.Column
            weight={1}
            minWidth={'--support-column-min-width'}
          >
            <Summary />
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(isOneRow(canvas.getByTestId('wide'))).toBe(true);
    await expect(isOneColumn(canvas.getByTestId('narrow'))).toBe(true);
  },
};

/** A share failing its minimum stacks the whole arrangement even though the minimums would fit
 *  side by side: at `3` to `1` in 40rem the support column's quarter is 9.6rem against a 16rem
 *  minimum, so both stack, although 20rem + 16rem and a gap fit in 40rem. The second holder is
 *  narrower than that 16rem minimum, and the stacked column still fills it: the minimum decides
 *  the switch and never floors a width. */
export const ShareBelowMinimum: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-region)' }}>
      {(['40rem', '14rem'] as const).map((width) => (
        <Holder
          key={width}
          width={width}
          style={{
            '--main-column-min-width': '20rem',
            '--support-column-min-width': '16rem',
          }}
          testId={`holder-${width}`}
        >
          <ColumnLayout.Root testId={`layout-${width}`}>
            <ColumnLayout.Column
              weight={3}
              minWidth={'--main-column-min-width'}
            >
              <P>Three quarters would be 28.875rem here.</P>
            </ColumnLayout.Column>
            <ColumnLayout.Column
              weight={1}
              minWidth={'--support-column-min-width'}
            >
              <P>One quarter would be 9.625rem, under its 16rem minimum.</P>
            </ColumnLayout.Column>
          </ColumnLayout.Root>
        </Holder>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(isOneColumn(canvas.getByTestId('layout-40rem'))).toBe(true);
    const narrow = canvas.getByTestId('layout-14rem');
    await expect(isOneColumn(narrow)).toBe(true);
    const minimum = 16 * Number.parseFloat(getComputedStyle(narrow).fontSize);
    for (const column of columnsOf(narrow)) {
      await expect(widthOf(column)).toBeLessThan(minimum);
      await expect(
        Math.abs(widthOf(column) - widthOf(canvas.getByTestId('holder-14rem'))),
      ).toBeLessThan(0.5);
    }
  },
};

/** The minimums are theme tokens in any CSS length, read each time layout runs. Both holders are
 *  48rem wide; the first declares font-relative minimums that fit, the second sits inside a scope
 *  re-pointing the same tokens upward, and stacks. A `ch` counts the column's characters, an `em`
 *  follows its type, a `rem` the root: the threshold moves with whichever the theme chose. */
export const ThemeMinimums: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-region)' }}>
      <style>{`
        .generous-theme {
          --main-column-min-width: 60ch;
          --support-column-min-width: 22em;
        }
      `}</style>
      <Holder
        width={'48rem'}
        style={{
          '--main-column-min-width': '48ch',
          '--support-column-min-width': '12em',
        }}
      >
        <ColumnLayout.Root testId={'fits'}>
          <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
            <P>Minimum of 48ch: fits at 48rem.</P>
          </ColumnLayout.Column>
          <ColumnLayout.Column
            weight={1}
            minWidth={'--support-column-min-width'}
          >
            <P>Minimum of 12em.</P>
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </Holder>
      <div className={'generous-theme'}>
        <div style={{ width: '48rem', maxWidth: '100%' }}>
          <ColumnLayout.Root testId={'stacks'}>
            <ColumnLayout.Column
              weight={2}
              minWidth={'--main-column-min-width'}
            >
              <P>The same column under a theme asking for 60ch: stacks.</P>
            </ColumnLayout.Column>
            <ColumnLayout.Column
              weight={1}
              minWidth={'--support-column-min-width'}
            >
              <P>Minimum of 22em.</P>
            </ColumnLayout.Column>
          </ColumnLayout.Root>
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(isOneRow(canvas.getByTestId('fits'))).toBe(true);
    await expect(isOneColumn(canvas.getByTestId('stacks'))).toBe(true);
  },
};

/** Content keeps its own contract: long running text wraps inside its track, long translated
 *  labels wrap, and the table's unbroken identifier scrolls inside `Table.Root`'s own region. The
 *  tracks never overlap and the page never scrolls sideways. */
export const LongContent: Story = {
  render: () => (
    <Holder width={'56rem'}>
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
          <Table.Root caption={'Veröffentlichungsübersicht'}>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell scope={'col'}>
                  Künstlerinnen und Künstler
                </Table.HeaderCell>
                <Table.HeaderCell scope={'col'}>
                  Internationale Standardaufnahmekennung
                </Table.HeaderCell>
                <Table.HeaderCell scope={'col'} align={'right'}>
                  Streams
                </Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Marlow Vane</Table.Cell>
                <Table.Cell variant={'note'}>
                  DEA621900001DEA621900002DEA621900003DEA621900004DEA621900005
                </Table.Cell>
                <Table.Cell align={'right'}>12480</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--support-column-min-width'}>
          <P>
            Die Zusammenfassung läuft über mehrere Zeilen und bricht innerhalb
            ihrer Spalte um, ohne die Nachbarspalte zu verdrängen. Die
            Spaltenbreite folgt dem Gewicht, nicht dem Inhalt.
          </P>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement).getByTestId('layout');
    await expectProportions(root, [2, 1]);
    const [table, summary] = columnsOf(root);
    await expect(table?.getBoundingClientRect().right).toBeLessThanOrEqual(
      summary?.getBoundingClientRect().left ?? 0,
    );
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

const WithSummary: FunctionComponent = () => {
  const [selected, setSelected] = useState(false);
  const [toggle$] = useState(() => new Subject<void>());
  useEffect(() => {
    const subscription = toggle$.subscribe(() =>
      setSelected((value) => !value),
    );
    return () => subscription.unsubscribe();
  }, [toggle$]);
  return (
    <Holder width={'64rem'}>
      <div style={{ display: 'grid', gap: 'var(--space-region)' }}>
        <div>
          <Button variant={'secondary'} onClick$={toggle$}>
            {selected ? 'Clear selection' : 'Select Marlow Vane'}
          </Button>
        </div>
        <ColumnLayout.Root testId={'layout'}>
          <ColumnLayout.Column
            weight={2}
            minWidth={'--main-column-min-width'}
            testId={'table'}
          >
            <Artists />
          </ColumnLayout.Column>
          {selected && (
            <ColumnLayout.Column
              weight={1}
              minWidth={'--support-column-min-width'}
              testId={'summary'}
            >
              <Summary />
            </ColumnLayout.Column>
          )}
        </ColumnLayout.Root>
      </div>
    </Holder>
  );
};

/** The consumer decides when a summary exists. Without one the table fills the width and no gap
 *  or slot is reserved; when the summary appears, the table keeps its mounted element and the width
 *  is redistributed two to one. */
export const ConditionalColumn: Story = {
  render: () => <WithSummary />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId('layout');
    const table = canvas.getByTestId('table');
    await expect(columnsOf(root)).toHaveLength(1);
    await expect(Math.abs(widthOf(table) - widthOf(root))).toBeLessThan(0.5);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Select Marlow Vane' }),
    );

    await expect(columnsOf(root)).toHaveLength(2);
    await expect(canvas.getByTestId('table')).toBe(table);
    await expectProportions(root, [2, 1]);
  },
};

const Operable: FunctionComponent<{ width: string; testId: string }> = ({
  width,
  testId,
}) => (
  <Holder width={width} testId={`holder-${testId}`}>
    <ColumnLayout.Root testId={testId}>
      <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
        <Input label={`Search (${testId})`} name={`search-${testId}`} />
      </ColumnLayout.Column>
      <ColumnLayout.Column weight={1} minWidth={'--support-column-min-width'}>
        <Button variant={'secondary'}>{`Open (${testId})`}</Button>
      </ColumnLayout.Column>
    </ColumnLayout.Root>
  </Holder>
);

/** Keyboard order is child order in both arrangements, because the arrangement is one stylesheet
 *  rule and never reorders or remounts a column. Shrinking the wide holder past its threshold while
 *  its search field is focused keeps the focus and the typed text. */
export const Keyboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-region)' }}>
      <Operable width={'64rem'} testId={'wide'} />
      <Operable width={'24rem'} testId={'narrow'} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(isOneRow(canvas.getByTestId('wide'))).toBe(true);
    await expect(isOneColumn(canvas.getByTestId('narrow'))).toBe(true);

    const wideSearch = canvas.getByRole('textbox', { name: 'Search (wide)' });
    wideSearch.focus();
    await userEvent.keyboard('jars');
    await userEvent.tab();
    await expect(document.activeElement).toBe(
      canvas.getByRole('button', { name: 'Open (wide)' }),
    );
    await userEvent.tab();
    await expect(document.activeElement).toBe(
      canvas.getByRole('textbox', { name: 'Search (narrow)' }),
    );
    await userEvent.tab();
    await expect(document.activeElement).toBe(
      canvas.getByRole('button', { name: 'Open (narrow)' }),
    );

    wideSearch.focus();
    canvas.getByTestId('holder-wide').style.width = '24rem';
    await expect(isOneColumn(canvas.getByTestId('wide'))).toBe(true);
    await expect(document.activeElement).toBe(wideSearch);
    await expect(wideSearch).toHaveValue('jars');
    canvas.getByTestId('holder-wide').style.width = '64rem';
    await expect(isOneRow(canvas.getByTestId('wide'))).toBe(true);
    await expect(document.activeElement).toBe(wideSearch);
  },
};

/** `gap="stack"` separates the columns on the sibling role instead of the region role, across the
 *  row and between the stacked lines alike. */
export const StackGap: Story = {
  args: { gap: 'stack' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-region)' }}>
      <Holder width={'64rem'}>
        <ColumnLayout.Root gap={args.gap} testId={'row'}>
          <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
            <Artists rows={2} />
          </ColumnLayout.Column>
          <ColumnLayout.Column
            weight={1}
            minWidth={'--support-column-min-width'}
          >
            <Summary />
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </Holder>
      <Holder width={'24rem'}>
        <ColumnLayout.Root gap={args.gap} testId={'stacked'}>
          <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
            <Artists rows={2} />
          </ColumnLayout.Column>
          <ColumnLayout.Column
            weight={1}
            minWidth={'--support-column-min-width'}
          >
            <Summary />
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </Holder>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId('row');
    const stacked = canvas.getByTestId('stacked');
    const expected = Number.parseFloat(getComputedStyle(row).columnGap);
    const [first, second] = columnsOf(row);
    await expect(
      (second?.getBoundingClientRect().left ?? 0) -
        (first?.getBoundingClientRect().right ?? 0),
    ).toBeCloseTo(expected, 1);
    const [top, bottom] = columnsOf(stacked);
    await expect(
      (bottom?.getBoundingClientRect().top ?? 0) -
        (top?.getBoundingClientRect().bottom ?? 0),
    ).toBeCloseTo(expected, 1);
    if (args.gap === 'stack') {
      await expect(expected).toBeLessThan(
        Number.parseFloat(getComputedStyle(row).fontSize),
      );
    }
  },
};
