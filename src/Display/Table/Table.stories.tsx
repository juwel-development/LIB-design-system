import { Icon } from 'Display/Icon/Icon';
import { Button } from 'Interaction/Button/Button';
import { ScrollContainer } from 'Layout/ScrollContainer/ScrollContainer';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useMemo, useState } from 'react';
import { Subject } from 'rxjs';
import { Table } from './Table';

const meta: Meta<typeof Table.Root> = {
  title: 'Display/Table',
  component: Table.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    caption: {
      control: { type: 'text' },
      description: "The table's accessible name, rendered as the first child",
    },
    notes: {
      control: { type: 'radio' },
      options: [undefined, 'supplementary', 'content'],
      description: 'What the note column is; governs narrow-viewport behaviour',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const specificationRows = (
  <>
    <Table.Head>
      <Table.Row>
        <Table.HeaderCell scope={'col'}>Property</Table.HeaderCell>
        <Table.HeaderCell scope={'col'} align={'right'}>
          Value
        </Table.HeaderCell>
        <Table.HeaderCell scope={'col'}>Note</Table.HeaderCell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      <Table.Row>
        <Table.HeaderCell scope={'row'}>Weight</Table.HeaderCell>
        <Table.Cell variant={'value'} align={'right'}>
          2.4 kg
        </Table.Cell>
        <Table.Cell variant={'note'}>dry, no cable</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell scope={'row'}>Width</Table.HeaderCell>
        <Table.Cell variant={'value'} align={'right'}>
          320 mm
        </Table.Cell>
        <Table.Cell variant={'note'}>at the widest point</Table.Cell>
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell scope={'row'}>Power</Table.HeaderCell>
        <Table.Cell variant={'value'} align={'right'}>
          65 W
        </Table.Cell>
        <Table.Cell variant={'note'}>continuous</Table.Cell>
      </Table.Row>
    </Table.Body>
  </>
);

/** A supplementary note column: dropped below 48rem for everyone. */
export const SupplementaryNotes: Story = {
  args: {
    caption: 'Material specification',
    notes: 'supplementary',
  },
  render: (args) => <Table.Root {...args}>{specificationRows}</Table.Root>,
};

/** The note is the content: each row stacks into a single column below 48rem. */
export const ContentNotes: Story = {
  args: {
    caption: 'Release notes',
    notes: 'content',
  },
  render: (args) => (
    <Table.Root {...args}>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell scope={'col'}>Version</Table.HeaderCell>
          <Table.HeaderCell scope={'col'} align={'right'}>
            Date
          </Table.HeaderCell>
          <Table.HeaderCell scope={'col'}>Change</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.HeaderCell scope={'row'}>1.2.0</Table.HeaderCell>
          <Table.Cell variant={'value'} align={'right'}>
            2026-08-11
          </Table.Cell>
          <Table.Cell variant={'note'}>Added the Table primitive.</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell scope={'row'}>1.1.0</Table.HeaderCell>
          <Table.Cell variant={'value'} align={'right'}>
            2026-08-11
          </Table.Cell>
          <Table.Cell variant={'note'}>Added the Eyebrow label.</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  ),
};

/** No note column: the table scrolls horizontally inside a keyboard-reachable region. */
export const NoNoteColumn: Story = {
  args: {
    caption: 'Dimensions',
  },
  render: (args) => (
    <Table.Root {...args}>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell scope={'col'}>Part</Table.HeaderCell>
          <Table.HeaderCell scope={'col'} align={'right'}>
            Height
          </Table.HeaderCell>
          <Table.HeaderCell scope={'col'} align={'right'}>
            Width
          </Table.HeaderCell>
          <Table.HeaderCell scope={'col'} align={'right'}>
            Depth
          </Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.HeaderCell scope={'row'}>Enclosure</Table.HeaderCell>
          <Table.Cell align={'right'}>44 mm</Table.Cell>
          <Table.Cell align={'right'}>320 mm</Table.Cell>
          <Table.Cell align={'right'}>210 mm</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell scope={'row'}>Bracket</Table.HeaderCell>
          <Table.Cell align={'right'}>12 mm</Table.Cell>
          <Table.Cell align={'right'}>80 mm</Table.Cell>
          <Table.Cell align={'right'}>80 mm</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  ),
};

// --- Consumer-composed sortable headers ---------------------------------------------------------
// Everything below the Table is the consumer's: which column is ordered, which way, how the rows are
// ordered, and when a request is answered. The Table only renders the `ariaSort` it is handed and
// the plain Button with the matching Icon the consumer composes into the header cell.

interface IPart {
  name: string;
  height: number;
  width: number;
}

const parts: readonly IPart[] = [
  { name: 'Enclosure', height: 44, width: 320 },
  { name: 'Bracket', height: 12, width: 80 },
  { name: 'Lid', height: 6, width: 318 },
  { name: 'Foot', height: 9, width: 24 },
];

type SortableColumn = 'name' | 'height' | 'width';
type Direction = 'ascending' | 'descending';
interface IOrder {
  column: SortableColumn;
  direction: Direction;
}

const ordered = (rows: readonly IPart[], order: IOrder): IPart[] =>
  [...rows].sort((left, right) => {
    const a = left[order.column];
    const b = right[order.column];
    const sign = order.direction === 'ascending' ? 1 : -1;
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * sign;
    return String(a).localeCompare(String(b)) * sign;
  });

const nextOrder = (current: IOrder, column: SortableColumn): IOrder => ({
  column,
  direction:
    current.column === column && current.direction === 'ascending'
      ? 'descending'
      : 'ascending',
});

const iconFor = (
  current: IOrder,
  column: SortableColumn,
): 'sort' | 'sort-ascending' | 'sort-descending' =>
  current.column !== column ? 'sort' : `sort-${current.direction}`;

interface ISortablePartsProps {
  /** How long the consumer's backend takes to answer; 0 answers at once. */
  responseDelay: number;
}

const SortableParts: FunctionComponent<ISortablePartsProps> = ({
  responseDelay,
}) => {
  const [order, setOrder] = useState<IOrder>({
    column: 'name',
    direction: 'ascending',
  });
  const [isWaiting, setIsWaiting] = useState(false);
  const requests = useMemo(
    () => ({
      name: new Subject<void>(),
      height: new Subject<void>(),
      width: new Subject<void>(),
    }),
    [],
  );
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscriptions = (Object.keys(requests) as SortableColumn[]).map(
      (column) =>
        requests[column].subscribe(() => {
          const requested = nextOrder(order, column);
          if (responseDelay === 0) {
            setOrder(requested);
            return;
          }
          // The consumer's response is pending: the displayed order, its icon and ariaSort all
          // stay as they are until the data arrives.
          setIsWaiting(true);
          clearTimeout(timer);
          timer = setTimeout(() => {
            setOrder(requested);
            setIsWaiting(false);
          }, responseDelay);
        }),
    );
    return () => {
      clearTimeout(timer);
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  }, [order, requests, responseDelay]);

  const header = (column: SortableColumn, label: string) => (
    <Table.HeaderCell
      scope={'col'}
      align={column === 'name' ? 'left' : 'right'}
      ariaSort={order.column === column ? order.direction : undefined}
    >
      <Button variant={'plain'} onClick$={requests[column]}>
        {label} <Icon name={iconFor(order, column)} />
      </Button>
    </Table.HeaderCell>
  );

  return (
    <>
      <Table.Root caption={'Parts'}>
        <Table.Head>
          <Table.Row>
            {header('name', 'Part')}
            {header('height', 'Height')}
            {header('width', 'Width')}
            <Table.HeaderCell scope={'col'}>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {ordered(parts, order).map((part) => (
            <Table.Row key={part.name}>
              <Table.HeaderCell scope={'row'}>{part.name}</Table.HeaderCell>
              <Table.Cell align={'right'}>{part.height} mm</Table.Cell>
              <Table.Cell align={'right'}>{part.width} mm</Table.Cell>
              <Table.Cell variant={'note'}>
                <Button variant={'ghost'}>Edit</Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <p
        className={'font-secondary text-muted text-small'}
        aria-live={'polite'}
      >
        {isWaiting ? 'Waiting for the consumer\u2019s data…' : ''}
      </p>
    </>
  );
};

/**
 * Sortable headers composed by the consumer: a plain Button carrying the label and the Icon for
 * the order currently displayed, `ariaSort` on the one ordered column only, and an action-only
 * column with no sort control at all. The Table holds no sort state.
 */
export const SortableHeaders: Story = {
  args: { caption: 'Parts' },
  render: () => <SortableParts responseDelay={0} />,
};

/**
 * The same, with the consumer's response delayed: activating a header leaves the rows, the icon
 * and `ariaSort` exactly as they were until the consumer's data arrives. Accessible metadata
 * describes the displayed order, never the requested one.
 */
export const SortableHeadersDelayedResponse: Story = {
  args: { caption: 'Parts' },
  render: () => <SortableParts responseDelay={1500} />,
};

const wideColumns = [
  'Height',
  'Width',
  'Depth',
  'Mass',
  'Material',
  'Finish',
  'Supplier',
];
const wideValues = [
  44,
  320,
  210,
  2400,
  'Aluminium 6061',
  'Anodised black',
  'Nordwerk GmbH',
];

const wideRows = (
  <>
    <Table.Head>
      <Table.Row>
        <Table.HeaderCell scope={'col'}>Part</Table.HeaderCell>
        {wideColumns.map((label) => (
          <Table.HeaderCell key={label} scope={'col'} align={'right'}>
            {label}
          </Table.HeaderCell>
        ))}
        <Table.HeaderCell scope={'col'}>Note</Table.HeaderCell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      {['Enclosure', 'Bracket', 'Lid', 'Foot'].map((name) => (
        <Table.Row key={name}>
          <Table.HeaderCell scope={'row'}>{name}</Table.HeaderCell>
          {wideValues.map((value) => (
            <Table.Cell key={String(value)} align={'right'}>
              {value}
            </Table.Cell>
          ))}
          <Table.Cell variant={'note'}>as shipped, dry</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </>
);

/**
 * A note column and more columns than fit: residual horizontal overflow scrolls automatically in
 * every `notes` mode. Narrow the viewport until the table overflows and the wrapper becomes a
 * keyboard-reachable group named by the caption; widen it again and the tab stop goes.
 */
export const ResidualOverflowWithNotes: Story = {
  args: {
    caption: 'Material specification',
    notes: 'supplementary',
  },
  render: (args) => <Table.Root {...args}>{wideRows}</Table.Root>,
};

const manyParts = Array.from({ length: 24 }, (_, index) => `Part ${index + 1}`);

/**
 * A long, wide table inside a vertically bounded ScrollContainer. The outer container owns the
 * vertical axis; the Table owns residual horizontal overflow. Tab reaches the container (when it
 * overflows), then the Table's region, then the header buttons; arrow keys scroll whichever holds
 * focus, and the focus ring stays visible on each. The container is named for what it holds, not
 * with the caption: two stops announced by one name in a row read as one thing.
 */
export const InsideVerticalScrollContainer: Story = {
  args: { caption: 'Parts' },
  render: () => (
    <div style={{ height: '14rem' }}>
      <ScrollContainer axis={'vertical'} ariaLabel={'Parts catalogue'}>
        <Table.Root caption={'Parts'}>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell scope={'col'} ariaSort={'ascending'}>
                <Button variant={'plain'}>
                  Part <Icon name={'sort-ascending'} />
                </Button>
              </Table.HeaderCell>
              {wideColumns.map((label) => (
                <Table.HeaderCell key={label} scope={'col'} align={'right'}>
                  <Button variant={'plain'}>
                    {label} <Icon name={'sort'} />
                  </Button>
                </Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {manyParts.map((name) => (
              <Table.Row key={name}>
                <Table.HeaderCell scope={'row'}>{name}</Table.HeaderCell>
                {wideValues.map((value) => (
                  <Table.Cell key={String(value)} align={'right'}>
                    {value}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </ScrollContainer>
    </div>
  ),
};
