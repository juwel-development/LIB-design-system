import { DefinitionList } from 'Display/DefinitionList/DefinitionList';
import { Table } from 'Display/Table/Table';
import { Eyebrow } from 'Display/Typography/Eyebrow/Eyebrow';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pane, ScrollContainer, Stack } from 'index';
import {
  type CSSProperties,
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
  parameters: {
    docs: {
      description: {
        component:
          "`ColumnLayout` is an arrangement of weighted columns that becomes one column when the space\nit is given cannot satisfy every column's minimum at the requested proportions. It owns the\narrangement and nothing else: no landmark, no band, no gutter, no fill, no scrolling. `Stack`'s\n`split` keeps its own viewport-keyed contract; `ColumnLayout` answers to the width of whatever\nholds it.\n\n```tsx\nimport { ColumnLayout } from '@juwel-development/design-system';\n\n<ColumnLayout.Root gap={'region'}>\n  <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>\n    <Table.Root caption={'A&R roster'}>…</Table.Root>\n  </ColumnLayout.Column>\n  {selected && (\n    <ColumnLayout.Column weight={1} minWidth={'--support-column-min-width'}>\n      <DefinitionList.Root>…</DefinitionList.Root>\n    </ColumnLayout.Column>\n  )}\n</ColumnLayout.Root>;\n```\n\n`Root` takes `fill?: boolean` (default false), `gap?: 'stack' | 'region'` (defaulting to `region`), `children` and `testId`. The\nsame gap separates the columns across the row and between the stacked lines. `Column` takes a\nrequired positive finite `weight`, a required `minWidth`, `children` and `testId`. Supply\ncolumns directly, through maps, in fragments or with conditional omissions; a column rendered\nthrough a wrapping component, loose, or nested inside another column throws\n`ColumnLayoutCompositionError`, and an invalid weight or token name throws\n`ColumnLayoutConfigurationError`.\n\n**Allocation.** In the row the gaps come off the Root's width and the rest is divided by weight:\n`2` beside `1` is two thirds and one third of what is left. Columns align at the top and keep\ntheir own heights by default. With `fill`, Root accepts its allocated height and horizontal columns\nfill it, bounding a Pane or ScrollContainer. An unsized holder leaves columns at content height.\nStacked columns always keep content height; the holder owns scrolling. No fixed height is invented.\nThe caller supplies a definite height and fitting fixed content. The internal fill frame uses\ninline-size containment; widths, minimums, order and mounted content keep their existing contract.\nA vertically bounded Table integration awaits #142, whose API is not available in this checkout. The row holds only while every share is at least its own minimum; the moment\none is not, every column takes a line of its own and fills the Root's width, a column narrower\nthan its minimum included. There is no partial wrap; maximums never change this switch. For `n` columns with gap\n`g`, total weight `S` and minimums `mᵢ`, the row fits at and above\n`(n − 1) × g + max(mᵢ × S ⁄ wᵢ)`; the space measured is the Root's, never the viewport's.\n\n**Bound tokens.** `minWidth` names a CSS custom property the consumer declares, never a\nlength or a `var()`. The name is a theme role of the product's own (`--main-column-min-width`),\nnot a library preset: the library ships no column-width ladder. Declare it on `:root`, on a\ntheme class, or on any ancestor of the Root, as a valid nonnegative CSS length:\n\n```css\n:root {\n  --main-column-min-width: 28rem;\n  --support-column-min-width: 12rem;\n}\n.dark { --support-column-min-width: 14rem; }\n```\n\nThe token is read each time layout runs, so re-pointing it in a theme class or a media query\nmoves the threshold with it. A `rem` resolves against the document root, an `em` or `ch`\nagainst the Root's inherited type, a `px` as written. A percentage is not a length the contract\naccepts: a minimum is a readable width, which the holder's width cannot define. A missing or\ninvalid token is not a responsive configuration: the switch has nothing to compare and the\ncolumns size from their content instead. Anything placed beside the columns that is not a\n`Column` is rendered as given but takes no weight, no gap and no part in the threshold, so it\nbreaks the proportions; content belongs inside a `Column`.\n\n**Maximums.** Optional `maxWidth` takes the same custom-property name form as `minWidth`. In horizontal mode columns take their weighted share up to their maximum; surplus is repeatedly redistributed by weight among columns still able to grow. If all reach their caps, unused width stays at the trailing edge with unchanged gaps, including a single capped column. A maximum below the original share applies immediately at the unchanged minimum-based threshold. Stacked columns ignore maximums and fill the holder. Themes must supply nonnegative CSS lengths and keep maximum >= minimum at every scope and responsive state. The component validates token names only: it does not read resolved lengths or guarantee an exception for maximum below minimum.\n\n**What the content owns.** A column never widens for its content and adds no truncation or\nscrolling. Running text wraps inside its track; content that cannot wrap needs its own overflow\ncontract, as `Table.Root` has. Resizing the holder never remounts a column, so focus and\nstate survive the switch, and reading and keyboard order are the order the columns are written.\n\n**Alternative arrangements.** `ColumnLayout.Alternatives` takes several Roots in order of preference and mounts the first whose row holds - three areas side by side where they fit, two with a tab group where they do not. See *ColumnLayout Alternatives*.",
      },
    },
  },
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

const FillExample: FunctionComponent<{
  columns?: number;
  narrow?: boolean;
  unsized?: boolean;
  fill?: boolean;
  scrollContainer?: boolean;
  capped?: boolean;
}> = ({
  columns = 2,
  narrow,
  unsized,
  fill = true,
  scrollContainer,
  capped,
}) => (
  <div
    data-testid="fill-holder"
    style={
      {
        '--lane-min-width': '12rem',
        '--lane-max-width': '16rem',
        width: narrow ? '20rem' : '100%',
        height: unsized ? undefined : '24rem',
        overflow: 'auto',
      } as HolderStyle
    }
  >
    <ColumnLayout.Root fill={fill} gap="stack" testId="fill-row">
      {Array.from({ length: columns }, (_, index) => index).map((index) => (
        <ColumnLayout.Column
          key={index}
          weight={1}
          minWidth="--lane-min-width"
          maxWidth={capped && index === 0 ? '--lane-max-width' : undefined}
        >
          {scrollContainer ? (
            <ScrollContainer axis="vertical" ariaLabel={`Lane ${index + 1}`}>
              <LaneEntries lane={index + 1} count={index === 0 ? 40 : 2} />
            </ScrollContainer>
          ) : (
            <Pane.Root name={`Lane ${index + 1}`}>
              <Pane.Head>
                <P>Lane {index + 1}</P>
              </Pane.Head>
              <Pane.Body ariaLabel={`Lane ${index + 1} entries`}>
                <LaneEntries lane={index + 1} count={index === 0 ? 40 : 2} />
              </Pane.Body>
              <Pane.Foot>
                <Button>Finish lane {index + 1}</Button>
              </Pane.Foot>
            </Pane.Root>
          )}
        </ColumnLayout.Column>
      ))}
    </ColumnLayout.Root>
  </div>
);

const LaneEntries: FunctionComponent<{ lane: number; count: number }> = ({
  lane,
  count,
}) => (
  <Stack>
    {Array.from({ length: count }, (_, index) => index).map((index) => (
      <Button key={index} variant="plain">
        Lane {lane} entry {index + 1}
      </Button>
    ))}
  </Stack>
);

const checkFilledColumns = async (
  canvasElement: HTMLElement,
  count: number,
) => {
  const canvas = within(canvasElement);
  const row = canvas.getByTestId('fill-row');
  const holder = canvas.getByTestId('fill-holder');
  await expectProportions(
    row,
    Array.from({ length: count }, () => 1),
  );
  await expect(row.getBoundingClientRect().height).toBe(holder.clientHeight);
  for (const column of columnsOf(row)) {
    await expect(column.getBoundingClientRect().height).toBe(
      holder.clientHeight,
    );
  }
  await expect(holder.scrollHeight).toBe(holder.clientHeight);
};

export const FillingPanes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Two panes with unequal content share the allocated height. The long body scrolls while its head and foot remain visible; short content keeps its own height inside its Pane.',
      },
    },
  },
  render: () => <FillExample />,
  play: async ({ canvasElement }) => {
    await checkFilledColumns(canvasElement, 2);
    const canvas = within(canvasElement);
    const body = canvas.getByRole('group', { name: 'Lane 1 entries' });
    const foot = canvas.getByRole('button', { name: 'Finish lane 1' });
    const footTop = foot.getBoundingClientRect().top;
    canvas.getByRole('button', { name: 'Lane 1 entry 40' }).focus();
    await expect(body.scrollTop).toBeGreaterThan(0);
    await expect(foot.getBoundingClientRect().top).toBe(footTop);
    await expect(canvas.getByTestId('fill-holder').scrollTop).toBe(0);
    await expect(
      canvas.queryByRole('group', { name: 'Lane 2 entries' }),
    ).not.toBeInTheDocument();
  },
};

export const FourFillingColumns: Story = {
  render: () => <FillExample columns={4} />,
  play: async ({ canvasElement }) => checkFilledColumns(canvasElement, 4),
};

export const FillingScrollContainers: Story = {
  render: () => <FillExample scrollContainer />,
  play: async ({ canvasElement }) => {
    await checkFilledColumns(canvasElement, 2);
    const canvas = within(canvasElement);
    const scroller = canvas.getByRole('group', { name: 'Lane 1' });
    canvas.getByRole('button', { name: 'Lane 1 entry 40' }).focus();
    await expect(scroller.scrollTop).toBeGreaterThan(0);
    await expect(canvas.getByTestId('fill-holder').scrollTop).toBe(0);
  },
};

export const StackedFillingColumns: Story = {
  render: () => <FillExample narrow />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const holder = canvas.getByTestId('fill-holder');
    const row = canvas.getByTestId('fill-row');
    await expect(isOneColumn(row)).toBe(true);
    await expect(holder.scrollHeight).toBeGreaterThan(holder.clientHeight);
    await expect(
      canvas.queryByRole('group', { name: 'Lane 1 entries' }),
    ).not.toBeInTheDocument();
    const last = canvas.getByRole('button', { name: 'Finish lane 2' });
    last.focus();
    await expect(holder.scrollTop).toBeGreaterThan(0);
    await expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      holder.getBoundingClientRect().bottom,
    );
  },
};

export const UnsizedFillingColumns: Story = {
  render: () => <FillExample unsized />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId('fill-row');
    const [long, short] = columnsOf(row);
    await expect(isOneRow(row)).toBe(true);
    await expect(long?.getBoundingClientRect().height).toBeGreaterThan(
      short?.getBoundingClientRect().height ?? 0,
    );
    await expect(
      canvas.queryByRole('group', { name: 'Lane 1 entries' }),
    ).not.toBeInTheDocument();
  },
};

export const FillResize: Story = {
  render: () => <FillExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const holder = canvas.getByTestId('fill-holder');
    const row = canvas.getByTestId('fill-row');
    // Keep the row's threshold independent of the platform's scrollbar width.
    holder.style.scrollbarGutter = 'stable';
    const gutter = holder.offsetWidth - holder.clientWidth;
    const columns = columnsOf(row);
    const button = canvas.getByRole('button', { name: 'Lane 1 entry 1' });
    button.focus();
    await checkFilledColumns(canvasElement, 2);
    holder.style.width = '20rem';
    await expect(isOneColumn(row)).toBe(true);
    await expect(columnsOf(row)).toEqual(columns);
    await expect(document.activeElement).toBe(button);
    holder.style.width = '100%';
    await checkFilledColumns(canvasElement, 2);
    holder.style.setProperty('--lane-min-width', '80rem');
    await expect(isOneColumn(row)).toBe(true);
    await expect(columnsOf(row)).toEqual(columns);
    holder.style.setProperty('--lane-min-width', '12rem');
    holder.style.width = `calc(24rem + var(--space-stack) + ${gutter}px)`;
    await checkFilledColumns(canvasElement, 2);
    holder.style.width = `calc(24rem + var(--space-stack) + ${gutter}px - 1px)`;
    await expect(isOneColumn(row)).toBe(true);
    holder.style.width = '100%';
    await checkFilledColumns(canvasElement, 2);
    await expect(columnsOf(row)).toEqual(columns);
    await expect(document.activeElement).toBe(button);
  },
};

export const DefaultContentHeight: Story = {
  render: () => <FillExample fill={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [long, short] = columnsOf(canvas.getByTestId('fill-row'));
    await expect(long?.getBoundingClientRect().height).toBeGreaterThan(
      short?.getBoundingClientRect().height ?? 0,
    );
    await expect(
      canvas.getByTestId('fill-holder').scrollHeight,
    ).toBeGreaterThan(canvas.getByTestId('fill-holder').clientHeight);
  },
};

/** The support list stops at its theme cap; the reading column receives the surplus. */
export const CappedSupport: Story = {
  render: () => (
    <Holder
      width="84rem"
      style={{
        '--support-minimum': '18rem',
        '--support-maximum': '24rem',
        '--reading-minimum': '28rem',
      }}
    >
      <ColumnLayout.Root testId="capped-row">
        <ColumnLayout.Column
          weight={1}
          minWidth="--support-minimum"
          maxWidth="--support-maximum"
        >
          <Artists rows={2} />
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={2} minWidth="--reading-minimum">
          <P>
            The reading column receives every extra pixel once the support list
            reaches its maximum.
          </P>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByTestId('capped-row');
    const [support, reading] = columnsOf(row);
    if (!support || !reading)
      throw new Error('Expected support and reading columns');
    const rootSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const gap = Number.parseFloat(getComputedStyle(row).columnGap);
    await expect(isOneRow(row)).toBe(true);
    await expect(widthOf(support)).toBeCloseTo(24 * rootSize, 1);
    await expect(widthOf(reading)).toBeCloseTo(
      widthOf(row) - gap - 24 * rootSize,
      1,
    );
  },
};

const CappedTracks: FunctionComponent<{
  allCapped?: boolean;
  fractional?: boolean;
  single?: boolean;
  fill?: boolean;
}> = ({ allCapped, fractional, single, fill }) => (
  <Holder
    width="640px"
    testId="caps-holder"
    style={{
      '--space-stack': '20px',
      '--track-minimum': '40px',
      '--first-maximum': '100px',
      '--second-maximum': '250px',
      '--third-maximum': '150px',
      height: fill ? '200px' : undefined,
    }}
  >
    <ColumnLayout.Root gap="stack" fill={fill} testId="capped-row">
      <ColumnLayout.Column
        weight={fractional ? 0.1 : 1}
        minWidth="--track-minimum"
        maxWidth="--first-maximum"
      >
        <Input label="Retained draft" name="draft" />
      </ColumnLayout.Column>
      {!single && (
        <ColumnLayout.Column
          weight={fractional ? 0.2 : 2}
          minWidth="--track-minimum"
          maxWidth="--second-maximum"
        >
          <P>Second capped column</P>
        </ColumnLayout.Column>
      )}
      {!single && (
        <ColumnLayout.Column
          weight={fractional ? 0.1 : 1}
          minWidth="--track-minimum"
          maxWidth={allCapped ? '--third-maximum' : undefined}
        >
          <P>Remaining column</P>
        </ColumnLayout.Column>
      )}
    </ColumnLayout.Root>
  </Holder>
);

const expectWidths = async (
  row: HTMLElement,
  widths: readonly number[],
): Promise<void> => {
  await expect(isOneRow(row)).toBe(true);
  const columns = columnsOf(row);
  await expect(columns).toHaveLength(widths.length);
  for (const [index, width] of widths.entries()) {
    const column = columns[index];
    if (!column) throw new Error('Expected allocated column');
    await expect(widthOf(column)).toBeCloseTo(width, 1);
  }
};

/** At 600px after gaps, caps at 100 and 250 leave 250 for the remaining column. */
export const SuccessiveCaps: Story = {
  render: () => <CappedTracks />,
  play: async ({ canvasElement }) => {
    await expectWidths(
      within(canvasElement).getByTestId('capped-row'),
      [100, 250, 250],
    );
  },
};

export const CappedFractionalWeights: Story = {
  render: () => <CappedTracks fractional />,
  play: SuccessiveCaps.play,
};

export const AllCapped: Story = {
  render: () => <CappedTracks allCapped />,
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByTestId('capped-row');
    await expectWidths(row, [100, 250, 150]);
    const [first, second, third] = columnsOf(row);
    if (!first || !second || !third)
      throw new Error('Expected three capped columns');
    await expect(first.getBoundingClientRect().left).toBe(
      row.getBoundingClientRect().left,
    );
    await expect(
      second.getBoundingClientRect().left - first.getBoundingClientRect().right,
    ).toBe(20);
    await expect(
      third.getBoundingClientRect().left - second.getBoundingClientRect().right,
    ).toBe(20);
    await expect(
      row.getBoundingClientRect().right - third.getBoundingClientRect().right,
    ).toBe(100);
  },
};

export const SingleCapped: Story = {
  render: () => <CappedTracks single />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId('capped-row');
    await expectWidths(row, [100]);
    canvas.getByTestId('caps-holder').style.width = '30px';
    await expect(isOneColumn(row)).toBe(true);
  },
};

/** Caps do not change the original 340px threshold, even when a share exceeds its cap. */
export const CappedThreshold: Story = {
  render: () => (
    <Holder
      width="340px"
      testId="caps-holder"
      style={{
        '--space-stack': '20px',
        '--small-minimum': '40px',
        '--large-minimum': '160px',
        '--small-maximum': '80px',
      }}
    >
      <ColumnLayout.Root gap="stack" testId="capped-row">
        <ColumnLayout.Column
          weight={1}
          minWidth="--small-minimum"
          maxWidth="--small-maximum"
        >
          <P>Capped at the threshold</P>
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth="--large-minimum">
          <P>The minimum decides the switch</P>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId('capped-row');
    const holder = canvas.getByTestId('caps-holder');
    await expectWidths(row, [80, 240]);
    holder.style.width = '339px';
    await expect(isOneColumn(row)).toBe(true);
    holder.style.width = '341px';
    await expectWidths(row, [80, 241]);
    holder.style.width = '30px';
    await expect(isOneColumn(row)).toBe(true);
    holder.style.width = '340px';
  },
};

export const CappedThemeChanges: Story = {
  render: () => <CappedTracks fill />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId('capped-row');
    const holder = canvas.getByTestId('caps-holder');
    const input = canvas.getByRole('textbox', { name: 'Retained draft' });
    input.focus();
    await userEvent.clear(input);
    await userEvent.keyboard('Preserved');
    const columns = columnsOf(row);
    await expectWidths(row, [100, 250, 250]);
    for (const column of columns)
      await expect(column.getBoundingClientRect().height).toBe(200);
    holder.style.setProperty('--first-maximum', '5em');
    holder.style.fontSize = '20px';
    await expectWidths(row, [100, 250, 250]);
    holder.style.fontSize = '24px';
    await expectWidths(row, [120, 250, 230]);
    holder.style.setProperty('--second-maximum', '200px');
    await expectWidths(row, [120, 200, 280]);
    holder.style.setProperty('--space-stack', '10px');
    await expectWidths(row, [120, 200, 300]);
    holder.style.width = '100px';
    await expect(isOneColumn(row)).toBe(true);
    holder.style.width = '640px';
    await expect(columnsOf(row)).toEqual(columns);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('Preserved');
    holder.style.fontSize = '';
    holder.style.setProperty('--first-maximum', '100px');
    holder.style.setProperty('--second-maximum', '250px');
    holder.style.setProperty('--space-stack', '20px');
  },
};

/** A theme scope and a viewport query both update caps without a React render. */
export const CappedResponsiveTheme: Story = {
  render: () => (
    <div className="column-cap-theme" data-testid="cap-theme">
      <style>{`
        .column-cap-theme { --responsive-cap: 100px; --responsive-minimum: 40px; --space-stack: 20px; }
        @media (max-width: 900px) { .column-cap-theme { --responsive-cap: 80px; } }
        .column-cap-theme.alternate { --responsive-cap: 120px; }
      `}</style>
      <Holder width="640px">
        <ColumnLayout.Root gap="stack" testId="capped-row">
          <ColumnLayout.Column
            weight={1}
            minWidth="--responsive-minimum"
            maxWidth="--responsive-cap"
          >
            <P>Theme-capped support</P>
          </ColumnLayout.Column>
          <ColumnLayout.Column weight={2} minWidth="--responsive-minimum">
            <P>Reading content</P>
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId('capped-row');
    const cap = matchMedia('(max-width: 900px)').matches ? 80 : 100;
    await expectWidths(row, [cap, 620 - cap]);
    canvas.getByTestId('cap-theme').classList.add('alternate');
    await expectWidths(row, [120, 500]);
    canvas.getByTestId('cap-theme').classList.remove('alternate');
    await expectWidths(row, [cap, 620 - cap]);
  },
};

const checkCappedOverflow = async (
  canvasElement: HTMLElement,
  scrollContainer: boolean,
) => {
  const canvas = within(canvasElement);
  const row = canvas.getByTestId('fill-row');
  const holder = canvas.getByTestId('fill-holder');
  const cap =
    16 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  const gap = Number.parseFloat(getComputedStyle(row).columnGap);
  await expectWidths(row, [cap, widthOf(row) - gap - cap]);
  for (const column of columnsOf(row))
    await expect(column.getBoundingClientRect().height).toBe(
      holder.clientHeight,
    );
  const scroller = canvas.getByRole('group', {
    name: scrollContainer ? 'Lane 1' : 'Lane 1 entries',
  });
  const last = canvas.getByRole('button', { name: 'Lane 1 entry 40' });
  const columns = columnsOf(row);
  last.focus();
  await expect(scroller.scrollTop).toBeGreaterThan(0);
  await expect(holder.scrollTop).toBe(0);
  await expect(holder.scrollHeight).toBe(holder.clientHeight);
  holder.style.width = '20rem';
  await expect(isOneColumn(row)).toBe(true);
  await expect(holder.scrollHeight).toBeGreaterThan(holder.clientHeight);
  await expect(columnsOf(row)).toEqual(columns);
  await expect(last).toHaveFocus();
};

export const CappedFillingPanes: Story = {
  render: () => <FillExample capped />,
  play: async ({ canvasElement }) => checkCappedOverflow(canvasElement, false),
};

export const CappedFillingScrollContainers: Story = {
  render: () => <FillExample capped scrollContainer />,
  play: async ({ canvasElement }) => checkCappedOverflow(canvasElement, true),
};

const ChangingCappedColumns: FunctionComponent = () => {
  const [changed, setChanged] = useState(false);
  const [change$] = useState(() => new Subject<void>());
  useEffect(() => {
    const subscription = change$.subscribe(() => setChanged((value) => !value));
    return () => subscription.unsubscribe();
  }, [change$]);
  return (
    <Holder
      width="640px"
      style={{
        '--space-stack': '20px',
        '--track-minimum': '40px',
        '--initial-cap': '100px',
        '--changed-cap': '200px',
      }}
    >
      <Button onClick$={change$}>Change allocation</Button>
      <ColumnLayout.Root gap="stack" testId="changing-row">
        <ColumnLayout.Column
          key="draft"
          weight={changed ? 2 : 1}
          minWidth="--track-minimum"
          maxWidth={changed ? '--changed-cap' : '--initial-cap'}
        >
          <Input label="Changing draft" name="changing-draft" />
        </ColumnLayout.Column>
        <ColumnLayout.Column
          key="reading"
          weight={1}
          minWidth="--track-minimum"
        >
          <P>Reading</P>
        </ColumnLayout.Column>
        {changed && (
          <ColumnLayout.Column
            key="extra"
            weight={2}
            minWidth="--track-minimum"
          >
            <P>Extra</P>
          </ColumnLayout.Column>
        )}
      </ColumnLayout.Root>
    </Holder>
  );
};

export const CappedPropChanges: Story = {
  render: () => <ChangingCappedColumns />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId('changing-row');
    const input = canvas.getByRole('textbox', { name: 'Changing draft' });
    await userEvent.type(input, 'Preserved');
    await expectWidths(row, [100, 520]);
    // Programmatic activation preserves input focus while React changes the allocation.
    canvas.getByRole('button', { name: 'Change allocation' }).click();
    await waitFor(() => expect(columnsOf(row)).toHaveLength(3));
    await expectWidths(row, [200, 400 / 3, 800 / 3]);
    await expect(canvas.getByRole('textbox', { name: 'Changing draft' })).toBe(
      input,
    );
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('Preserved');
    canvas.getByRole('button', { name: 'Change allocation' }).click();
    await waitFor(() => expect(columnsOf(row)).toHaveLength(2));
    await expectWidths(row, [100, 520]);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('Preserved');
  },
};
