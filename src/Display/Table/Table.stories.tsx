import { Icon } from 'Display/Icon/Icon';
import { Button } from 'Interaction/Button/Button';
import { Link } from 'Interaction/Link/Link';
import { ScrollContainer } from 'Layout/ScrollContainer/ScrollContainer';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type ComponentProps,
  type FunctionComponent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BehaviorSubject, map, type Observable, Subject } from 'rxjs';
import { Table } from './Table';

const meta: Meta<typeof Table.Root> = {
  title: 'Display/Table',
  component: Table.Root,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          `A sortable table is composed, not configured. The consumer owns every part of the sort - the ordered column, its direction, the ordering of the rows and when a request is answered - and the library supplies three pieces to compose it from: \`Table.HeaderCell\` takes \`ariaSort\` (\`'none' | 'ascending' | 'descending' | 'other'\`), accessibility metadata describing the order *currently displayed* - set it on the one ordered column, omit it on the rest; changing it neither reorders rows nor triggers anything. \`Button variant="plain"\` carries the header's label and action in the header's own typography. \`Icon\` draws \`sort\`, \`sort-ascending\` or \`sort-descending\` to match the displayed order.

\`\`\`tsx
<Table.HeaderCell scope={'col'} ariaSort={order.column === 'name' ? order.direction : undefined}>
  <Button variant={'plain'} onClick$={sortByName$}>
    Name <Icon name={order.column === 'name' ? \`sort-\${order.direction}\` : 'sort'} />
  </Button>
</Table.HeaderCell>
\`\`\`

Until the consumer's data arrives, the icon and \`ariaSort\` keep stating the old order - metadata describes what is displayed, never what was requested.

\`Table\` handles residual horizontal overflow automatically in every \`notes\` mode, with no opt-in, and never bounds its own height. For a long table, put it inside a \`ScrollContainer\` with \`axis="vertical"\`, named for what it holds rather than with the caption: the container and the table's own scroll region are two consecutive tab stops, and two stops announced by one name read as one thing.

\`\`\`tsx
<div style={{ height: '20rem' }}>
  <ScrollContainer axis={'vertical'} ariaLabel={'Parts catalogue'}>
    <Table.Root caption={'Parts'}>…</Table.Root>
  </ScrollContainer>
</div>
\`\`\``,
          [
            "`Table` is a composable data table where the rules are the layout: compose `Table.Root` (with its required `caption`) from `Head`, `Body`, `Footer`, `Row`, `HeaderCell` and `Cell`. `Table.Row` additionally supports consumer-owned selection and independent row activation through two optional props, `onClick$?: Subject<void>` and `isSelected$?: Observable<boolean>`, tied by the consumer to each row's own stable identity.",
            '`onClick$` makes the row body interactive: the `tr` keeps its row semantics and gains a tab stop, the shared focus ring and a pointer cursor. Clicking the row body, or pressing Enter or Space while the row has focus, emits exactly once; Space does not scroll the page and a held key does not repeat the request. A nested link, button or other control - and anything inside one - performs its own operation and never activates the row, so consumers stop no propagation. Activation changes nothing about the row: the consumer decides what the request means and answers by rerendering from its own state. Without `onClick$` the row body is inert and adds no tab stop while nested controls stay operable; removing it stops activation and keeps the rendered selection.',
            "`isSelected$` is the consumer's selection for the row, rendered as `aria-selected` and as a marker bar along the row's leading edge in `--color-foreground` - a shape that survives without colour perception, distinct from the focus ring. Omitted or not yet emitted reads unselected; a replaced source reads unselected until it emits; unmounting unsubscribes. Make each `isSelected$` once per row, not inline per render. Selection and activation are independent, so a row may be selected and noninteractive, interactive and unselected, or both; rendering and selection changes never emit an activation. A table holding a selection input insets every row's first cell by the cell padding, head and foot included, so the marker has room and no column shifts as the selection moves; a table holding an interactive row makes ring room around itself so a focused row's ring is never clipped by the scroll region; a table with neither keeps its static geometry exactly.",
            "Table holds no row identity, selection registry or policy. A reordered or temporarily removed row finds the same streams again through its identity, and removing a row never asks the consumer to clear or replace its selection. An interactive row announces no verb of its own, so word the caption, a row header or a nested link to make the row's purpose plain.",
            "Accessibility, an accepted limitation (#113): the row stays a `tr` in a `table` - no grid role, no arrow-key navigation. `aria-selected` is a WAI-ARIA 1.2 state of `row` and valid here, but Chromium exposes a row's selected state only inside a `grid`, so Chrome and Edge screen readers do not announce selection on these rows. The marker bar is the one guaranteed selection cue; a consumer that needs the selection spoken words it in the row's content or in a live region of its own.",
            "`--table-selection-marker-thickness` names the marker bar's weight, defaulting to `2px`, declared in all three token stylesheets. It must stay above zero: it is the one persistent selection cue.",
          ].join('\n\n'),
        ].join('\n\n'),
      },
    },
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

// --- Selectable rows: the consumer side of Row's `onClick$` / `isSelected$` contract (#113) -----

type Artist = {
  /** The stable identity the consumer ties each row's streams to - never the row's position. */
  id: string;
  name: string;
  genre: string;
  listeners: string;
  note: string;
};

const ARTISTS: readonly Artist[] = [
  {
    id: 'nova',
    name: 'Nova Reyes',
    genre: 'Synth-pop',
    listeners: '1 240 000',
    note: 'Touring until spring',
  },
  {
    id: 'kestrel',
    name: 'Kestrel & the Low Tide',
    genre: 'Folk',
    listeners: '318 000',
    note: 'Second album in mixing',
  },
  {
    id: 'oyelaran',
    name: 'Adaeze Oyelaran',
    genre: 'Afrobeats',
    listeners: '2 905 000',
    note: 'Unsigned',
  },
  {
    id: 'mire',
    name: 'Mire',
    genre: 'Ambient',
    listeners: '87 000',
    note: 'Catalogue only',
  },
];

const LONG_NAME_ARTISTS: readonly Artist[] = [
  {
    id: 'orchestra',
    name: 'The Greater Metropolitan Youth Orchestra and Community Chorus of the Northern Lakes Region',
    genre: 'Orchestral and choral works, recorded live',
    listeners: '12 400',
    note: 'A note long enough to wrap onto a second and a third line at the comfortable reading width of this column, so the row grows with its content.',
  },
  ...ARTISTS.slice(0, 2),
];

// One stream pair per artist, made once and tied to the id: a reordered or hidden row finds the same
// streams again, so selection and activation stay with the artist and never with a position.
type ArtistRow = {
  artist: Artist;
  onClick$: Subject<void>;
  isSelected$: Observable<boolean>;
};

const rowsFor = (
  artists: readonly Artist[],
  selected$: BehaviorSubject<string | undefined>,
): readonly ArtistRow[] =>
  artists.map((artist) => ({
    artist,
    onClick$: new Subject<void>(),
    isSelected$: selected$.pipe(map((id) => id === artist.id)),
  }));

// The story's args are the Root's own `caption` and `notes`, so the docs controls drive the table.
type ArtistRosterProps = Pick<
  ComponentProps<typeof Table.Root>,
  'caption' | 'notes'
> & {
  artists?: readonly Artist[];
  /** The consumer's starting selection; `undefined` starts without one. */
  initial?: string;
  /** Rows answer activation requests; `false` renders the same selection on inert rows. */
  interactive?: boolean;
  /** A link on the name and an action button per row, to show them operating independently. */
  nestedControls?: boolean;
  /** Reordering and temporary removal controls, to show selection following identity. */
  rearrangeable?: boolean;
  /** A control that takes activation away and gives it back while the selection stays. */
  availabilityToggle?: boolean;
};

const ArtistRoster: FunctionComponent<ArtistRosterProps> = ({
  caption,
  notes,
  artists = ARTISTS,
  initial,
  interactive = true,
  nestedControls = false,
  rearrangeable = false,
  availabilityToggle = false,
}) => {
  const [selected$] = useState(
    () => new BehaviorSubject<string | undefined>(initial),
  );
  const [rows] = useState(() => rowsFor(artists, selected$));
  const [selected, setSelected] = useState(initial);
  const [available, setAvailable] = useState(interactive);
  const [reversed, setReversed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [log, setLog] = useState<readonly string[]>([]);
  const [toggleAvailability$] = useState(() => new Subject<void>());
  const [reverse$] = useState(() => new Subject<void>());
  const [hide$] = useState(() => new Subject<void>());
  const [actions] = useState(
    () => new Map(rows.map((row) => [row.artist.id, new Subject<void>()])),
  );

  // The consumer's selection policy: an activation selects that artist, and nothing else moves it.
  useEffect(() => {
    const subscriptions = rows.map((row) =>
      row.onClick$.subscribe(() => {
        selected$.next(row.artist.id);
        setSelected(row.artist.id);
        setLog((current) => [...current, `activated ${row.artist.name}`]);
      }),
    );
    for (const [id, action$] of actions) {
      subscriptions.push(
        action$.subscribe(() =>
          setLog((current) => [...current, `signed ${id} (row action)`]),
        ),
      );
    }
    subscriptions.push(
      toggleAvailability$.subscribe(() => setAvailable((value) => !value)),
      reverse$.subscribe(() => setReversed((value) => !value)),
      hide$.subscribe(() => setHidden((value) => !value)),
    );
    return () => {
      for (const subscription of subscriptions) {
        subscription.unsubscribe();
      }
    };
  }, [rows, actions, selected$, toggleAvailability$, reverse$, hide$]);

  const ordered = reversed ? [...rows].reverse() : rows;
  const shown = hidden
    ? ordered.filter((row) => row.artist.id !== selected)
    : ordered;
  const selectedName = rows.find((row) => row.artist.id === selected)?.artist
    .name;

  return (
    <div className={'flex flex-col gap-[var(--space-region)]'}>
      {(availabilityToggle || rearrangeable) && (
        <div className={'flex flex-row flex-wrap gap-[var(--space-stack)]'}>
          {availabilityToggle && (
            <Button variant={'secondary'} onClick$={toggleAvailability$}>
              {available ? 'Make rows unavailable' : 'Make rows available'}
            </Button>
          )}
          {rearrangeable && (
            <>
              <Button variant={'secondary'} onClick$={reverse$}>
                {reversed ? 'Restore order' : 'Reverse order'}
              </Button>
              <Button
                variant={'secondary'}
                onClick$={hide$}
                disabled={selected === undefined}
              >
                {hidden
                  ? 'Show the selected artist'
                  : 'Hide the selected artist'}
              </Button>
            </>
          )}
        </div>
      )}
      <Table.Root caption={caption} notes={notes}>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell scope={'col'}>Artist</Table.HeaderCell>
            <Table.HeaderCell scope={'col'}>Genre</Table.HeaderCell>
            <Table.HeaderCell scope={'col'} align={'right'}>
              Monthly listeners
            </Table.HeaderCell>
            {nestedControls && (
              <Table.HeaderCell scope={'col'}>Action</Table.HeaderCell>
            )}
            <Table.HeaderCell scope={'col'}>Note</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {shown.map((row) => (
            <Table.Row
              key={row.artist.id}
              onClick$={available ? row.onClick$ : undefined}
              isSelected$={row.isSelected$}
              testId={`row-${row.artist.id}`}
            >
              <Table.HeaderCell scope={'row'}>
                {nestedControls ? (
                  <Link href={`#artist-${row.artist.id}`}>
                    {row.artist.name}
                  </Link>
                ) : (
                  row.artist.name
                )}
              </Table.HeaderCell>
              <Table.Cell>{row.artist.genre}</Table.Cell>
              <Table.Cell align={'right'}>{row.artist.listeners}</Table.Cell>
              {nestedControls && (
                <Table.Cell>
                  <Button
                    variant={'secondary'}
                    onClick$={actions.get(row.artist.id)}
                  >
                    Sign
                  </Button>
                </Table.Cell>
              )}
              <Table.Cell variant={'note'}>{row.artist.note}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <p
        className={'font-secondary text-muted text-small'}
        aria-live={'polite'}
        data-testid={'selection-readout'}
      >
        {selectedName === undefined
          ? 'No artist selected.'
          : `Selected: ${selectedName}.`}
        {log.length > 0 && ` Last event: ${log[log.length - 1]}.`}
      </p>
    </div>
  );
};

/**
 * Interactive rows with consumer-owned selection: click a row body, or Tab to it and press Enter or
 * Space, and the consumer answers the activation by selecting that artist. The marker bar is the
 * selection; the focus ring is keyboard position, and the two are independent.
 */
export const InteractiveRows: Story = {
  args: { caption: 'Artists on the roster', notes: 'supplementary' },
  render: (args) => <ArtistRoster {...args} />,
};

/**
 * Selection without activation: `isSelected$` alone marks the row and announces `aria-selected`,
 * while no row adds a tab stop - the agreed unavailable-row case.
 */
export const SelectedWithoutActivation: Story = {
  args: { caption: 'Artists on the roster', notes: 'supplementary' },
  render: (args) => (
    <ArtistRoster {...args} initial={'kestrel'} interactive={false} />
  ),
};

/**
 * Nested link and button inside interactive rows: each performs its own operation and never
 * activates the row, with no propagation handling on the consumer's side. Clicking the name
 * follows the link; clicking Sign logs the row action; clicking anywhere else selects.
 */
export const IndependentNestedControls: Story = {
  args: { caption: 'Artists on the roster', notes: 'supplementary' },
  render: (args) => <ArtistRoster {...args} initial={'nova'} nestedControls />,
};

/**
 * Taking activation away and giving it back: without `onClick$` the rows stop emitting and lose
 * their tab stop while the selection they were given stays rendered.
 */
export const ChangingActivationAvailability: Story = {
  args: { caption: 'Artists on the roster', notes: 'supplementary' },
  render: (args) => (
    <ArtistRoster {...args} initial={'oyelaran'} availabilityToggle />
  ),
};

/**
 * Long names and notes wrap inside interactive, selected rows; the marker spans the grown row. With
 * `notes` unset the table is the scrollable region, and a focused row's ring stays unclipped.
 */
export const LongLabels: Story = {
  args: { caption: 'Artists on the roster' },
  render: (args) => (
    <ArtistRoster {...args} artists={LONG_NAME_ARTISTS} initial={'orchestra'} />
  ),
};

/**
 * Selection follows identity, not position: reverse the order and the marker moves with its
 * artist; hide the selected artist and the selection is kept until the row returns. Table asks
 * nothing of the consumer when a row leaves.
 */
export const StableIdentities: Story = {
  args: { caption: 'Artists on the roster', notes: 'supplementary' },
  render: (args) => (
    <ArtistRoster {...args} initial={'kestrel'} rearrangeable />
  ),
};
