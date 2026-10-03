import { Icon } from 'Display/Icon/Icon';
import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import { Link } from 'Interaction/Link/Link';
import { ScrollContainer } from 'Layout/ScrollContainer/ScrollContainer';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type ComponentProps,
  type CSSProperties,
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { BehaviorSubject, map, type Observable, Subject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';
import { Table, type TableColumnAllocation } from './Table';

const meta: Meta<typeof Table.Root> = {
  title: 'Display/Table',
  component: Table.Root,
  parameters: {
    layout: 'padded',
    viewport: { options: MINIMAL_VIEWPORTS },
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
          [
            "**Column allocation (#115).** `Table.Root columns` declares every column's share of the width once, in the order the cells of every row are written, and every row shares it: `{ width: role }` is a fixed column that takes its role's theme width at any available width; `{ weight: n, minWidth?: role }` is a proportional column that shares the width the fixed columns leave by its positive weight, floored at its named minimum. While a minimum holds one column, the other proportional columns share what is left; a fixed `width` smaller than its `minWidth` resolves to the minimum; all-fixed columns do not stretch. Nothing a row holds moves a boundary: filtering, sorting, paging, long or short content, an empty body and its repopulation leave the allocation as it was - only the definitions, the theme and the available width can change it. Omit `columns` and widths follow content exactly as before.",
            "The width roles are `name`, `fact`, `figure` and `action` - the four column jobs the consumer specification attests, each a theme token a brand re-points (`--table-column-name` 12rem, `--table-column-fact` 9rem, `--table-column-figure` 8rem, `--table-column-action` 12.5rem by default, cell insets included; `action` holds one standard control at comfortable density). They are jobs, not a size ladder: allocate the subject's `name` first, proportional with a floor so it wraps rather than vanishes; facts proportional at `fact`; figures fixed at `figure` and right-aligned; the action column fixed at `action`, last.",
            "Under an allocation the table lays out as a CSS grid of subgrids - still a semantic `table`, every `tr` still a box carrying its rule - and no narrow-viewport `notes` rule applies: the note column stays, rows stay tabular, and what does not fit scrolls in the wrapper as it does for every table. Text wraps inside its allocation, an unbroken run included; the table never truncates, hides or resizes content. A cell whose content cannot wrap - a `Button`, an `Input` - needs a column whose width or minimum holds it: the allocation never widens for content, so an under-allocated control overflows its cell. A proportional column with no `minWidth` may shrink to nothing once the fixed widths and floors alone exceed the available width, which is why the subject's `name` column carries a floor. Every row must write exactly as many cells as there are `columns`. Cells align to the top of their row under an allocation; a content-driven table keeps the browser's middle alignment.",
            '**Density (#115).** `Table.Root density` is `comfortable` (the default, the former cell spacing exactly: `--table-cell-inset-inline` 1rem and `--table-cell-inset-block` 0.5rem) or `compact` (`--table-cell-inset-inline-compact` 0.5rem, `--table-cell-inset-block-compact` 0.25rem). It insets every header and body cell from the chosen pair and nothing else: no type size moves, no control inside a cell changes its dimensions, and two tables on one page may differ. Compact is for a dense comparison the viewer scans, not for fitting more in.',
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
    density: {
      control: { type: 'radio' },
      options: ['comfortable', 'compact'],
      description: 'The cell insets, per table; comfortable is the default',
    },
    columns: {
      control: false,
      description:
        'The column allocations in cell order; omit for content-driven widths',
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

// --- Column allocation and density (#115) --------------------------------------------------------
// The consumer declares the allocation once on Root. Everything below the table in these stories -
// search, sort, paging, the long/short toggle - is the consumer's, and none of it moves a boundary.

type Candidate = {
  id: string;
  name: string;
  role: string;
  proficiency: string;
  age: number;
  wage: number;
};

const CANDIDATES: readonly Candidate[] = [
  {
    id: 'hagenbach',
    name: 'Friederike Hagenbach-Wittgenstein',
    role: 'Marktforschungsabteilungsleitung',
    proficiency: 'Außergewöhnlich',
    age: 34,
    wage: 1250,
  },
  {
    id: 'okonkwo',
    name: 'Chukwuemeka Okonkwo-Adeyemi',
    role: 'Artists and repertoire scouting',
    proficiency: 'Hervorragend',
    age: 29,
    wage: 980,
  },
  {
    id: 'brandstaetter',
    name: 'Maximiliane Brandstätter',
    role: 'Songwriting',
    proficiency: 'Durchschnittlich',
    age: 41,
    wage: 1100,
  },
  {
    id: 'sato',
    name: 'Sato Haruki',
    role: 'Market research',
    proficiency: 'Gut',
    age: 26,
    wage: 760,
  },
  {
    id: 'vanderberg',
    name: 'Johanna van der Berg-Oosterhuis',
    role: 'Artists and repertoire scouting',
    proficiency: 'Außergewöhnlich',
    age: 38,
    wage: 1400,
  },
  {
    id: 'ndiaye',
    name: 'Aminata Ndiaye',
    role: 'Songwriting',
    proficiency: 'Gut',
    age: 31,
    wage: 890,
  },
  {
    id: 'eisenhauer',
    name: 'Theodor Eisenhauer',
    role: 'Marktforschungsabteilungsleitung',
    proficiency: 'Durchschnittlich',
    age: 52,
    wage: 1020,
  },
  {
    id: 'quintero',
    name: 'María Fernanda Quintero Salazar',
    role: 'Market research',
    proficiency: 'Hervorragend',
    age: 45,
    wage: 1180,
  },
  {
    id: 'lindqvist',
    name: 'Åsa Lindqvist',
    role: 'Songwriting',
    proficiency: 'Außergewöhnlich',
    age: 27,
    wage: 1310,
  },
  {
    id: 'papadopoulos',
    name: 'Konstantinos Papadopoulos',
    role: 'Artists and repertoire scouting',
    proficiency: 'Gut',
    age: 36,
    wage: 940,
  },
];

// The Staff: Candidates comparison from the consumer specification: the name first, proportional
// with a floor so it wraps rather than vanishes; two facts proportional; two figures and the action
// column fixed, last.
const CANDIDATE_COLUMNS: readonly TableColumnAllocation[] = [
  { weight: 2, minWidth: 'name' },
  { weight: 1, minWidth: 'fact' },
  { weight: 1, minWidth: 'fact' },
  { width: 'figure' },
  { width: 'figure' },
  { width: 'action' },
];

type CandidateColumn = 'name' | 'role' | 'proficiency' | 'age' | 'wage';

const PAGE_SIZE = 4;

const orderedCandidates = (
  rows: readonly Candidate[],
  order: { column: CandidateColumn; direction: Direction } | undefined,
): Candidate[] => {
  if (order === undefined) return [...rows];
  const sign = order.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const leftValue = left[order.column];
    const rightValue = right[order.column];
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * sign;
    }
    return String(leftValue).localeCompare(String(rightValue), 'de') * sign;
  });
};

type CandidatesProps = {
  rows?: readonly Candidate[];
  density?: ComponentProps<typeof Table.Root>['density'];
  /** Search, paging and the label toggle; off for the static comparisons. */
  controls?: boolean;
  caption?: string;
};

const Candidates: FunctionComponent<CandidatesProps> = ({
  rows = CANDIDATES,
  density,
  controls = false,
  caption = 'Candidates',
}) => {
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<
    { column: CandidateColumn; direction: Direction } | undefined
  >(undefined);
  const [page, setPage] = useState(0);
  const [isVerbose, setIsVerbose] = useState(false);
  const [search$] = useState(() => new Subject<string>());
  const [sort$] = useState(
    () =>
      new Map<CandidateColumn, Subject<void>>(
        (['name', 'role', 'proficiency', 'age', 'wage'] as const).map(
          (column) => [column, new Subject<void>()],
        ),
      ),
  );
  const [nextPage$] = useState(() => new Subject<void>());
  const [previousPage$] = useState(() => new Subject<void>());
  const [toggleLabels$] = useState(() => new Subject<void>());

  useEffect(() => {
    const subscriptions = [
      search$.subscribe((value) => {
        setQuery(value);
        setPage(0);
      }),
      nextPage$.subscribe(() => setPage((current) => current + 1)),
      previousPage$.subscribe(() =>
        setPage((current) => Math.max(0, current - 1)),
      ),
      toggleLabels$.subscribe(() => setIsVerbose((current) => !current)),
      ...[...sort$].map(([column, request$]) =>
        request$.subscribe(() =>
          setOrder((current) => ({
            column,
            direction:
              current?.column === column && current.direction === 'ascending'
                ? 'descending'
                : 'ascending',
          })),
        ),
      ),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  }, [search$, sort$, nextPage$, previousPage$, toggleLabels$]);

  const matching = rows.filter((candidate) =>
    candidate.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const ordered = orderedCandidates(matching, order);
  const shown = controls
    ? ordered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : ordered;
  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));

  const header = (column: CandidateColumn, label: string) => (
    <Table.HeaderCell
      scope={'col'}
      align={column === 'age' || column === 'wage' ? 'right' : 'left'}
      ariaSort={order?.column === column ? order.direction : undefined}
    >
      <Button variant={'plain'} onClick$={sort$.get(column)}>
        {label}{' '}
        <Icon
          name={order?.column === column ? `sort-${order.direction}` : 'sort'}
        />
      </Button>
    </Table.HeaderCell>
  );

  return (
    <div className={'flex flex-col gap-[var(--space-region)]'}>
      {controls && (
        <div
          className={
            'flex flex-row flex-wrap items-end gap-[var(--space-stack)]'
          }
        >
          <Input
            label={'Search by name'}
            name={'candidate-search'}
            onInput$={search$}
          />
          <Button variant={'ghost'} onClick$={toggleLabels$}>
            {isVerbose ? 'Short labels' : 'Long labels'}
          </Button>
        </div>
      )}
      <Table.Root
        caption={caption}
        columns={CANDIDATE_COLUMNS}
        density={density}
      >
        <Table.Head>
          <Table.Row>
            {header(
              'name',
              isVerbose ? 'Name der Bewerberin oder des Bewerbers' : 'Name',
            )}
            {header('role', isVerbose ? 'Bevorzugte Rolle' : 'Preferred role')}
            {header(
              'proficiency',
              isVerbose ? 'Rollenkompetenz' : 'Proficiency',
            )}
            {header('age', isVerbose ? 'Alter' : 'Age')}
            {header('wage', isVerbose ? 'Wochenlohn' : 'Wage per week')}
            <Table.HeaderCell scope={'col'}>
              {isVerbose ? 'Einstellungsaktionen' : 'Actions'}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {shown.map((candidate) => (
            <Table.Row key={candidate.id}>
              <Table.HeaderCell scope={'row'}>
                <Link href={`#${candidate.id}`}>{candidate.name}</Link>
              </Table.HeaderCell>
              <Table.Cell variant={'note'}>{candidate.role}</Table.Cell>
              <Table.Cell variant={'note'}>{candidate.proficiency}</Table.Cell>
              <Table.Cell align={'right'}>{candidate.age}</Table.Cell>
              <Table.Cell align={'right'}>
                {isVerbose
                  ? `${candidate.wage.toLocaleString('de-DE')} $ pro Woche`
                  : `${candidate.wage} $/wk`}
              </Table.Cell>
              <Table.Cell variant={'note'}>
                <Button variant={'ghost'}>
                  {isVerbose ? 'Einstellen' : 'Hire'}
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {controls && (
        <div
          className={
            'flex flex-row flex-wrap items-center gap-[var(--space-stack)]'
          }
        >
          <Button
            variant={'ghost'}
            onClick$={previousPage$}
            disabled={page === 0}
          >
            Previous page
          </Button>
          <Button
            variant={'ghost'}
            onClick$={nextPage$}
            disabled={page + 1 >= pageCount}
          >
            Next page
          </Button>
          <p
            className={'font-secondary text-muted text-small'}
            aria-live={'polite'}
          >
            {ordered.length === 0
              ? 'No candidates match.'
              : `Page ${page + 1} of ${pageCount}, ${ordered.length} candidates.`}
          </p>
        </div>
      )}
    </div>
  );
};

type HolderStyle = CSSProperties & {
  '--table-column-name'?: string;
  '--table-column-figure'?: string;
};

const Holder: FunctionComponent<{
  width: string;
  style?: HolderStyle;
  testId?: string;
  children?: ReactNode;
}> = ({ width, style, testId, children }) => (
  <div style={{ width, ...style }} data-testid={testId}>
    {children}
  </div>
);

const widthsOf = (root: HTMLElement): number[] =>
  within(root)
    .getAllByRole('columnheader')
    .map(
      (header) => Math.round(header.getBoundingClientRect().width * 10) / 10,
    );

const boundaryOf = (element: Element): string => {
  const box = element.getBoundingClientRect();
  return `${Math.round(box.left)}-${Math.round(box.right)}`;
};

const edgesOf = (root: HTMLElement): string =>
  within(root).getAllByRole('columnheader').map(boundaryOf).join(' ');

// Every row's cells sit on the header's boundaries: the fact that makes an allocation one.
const isEveryRowOn = (root: HTMLElement, edges: string): boolean =>
  within(root)
    .getAllByRole('row')
    .every(
      (row) => Array.from(row.children).map(boundaryOf).join(' ') === edges,
    );

const dimensionRows = (
  <>
    <Table.Head>
      <Table.Row>
        <Table.HeaderCell scope={'col'}>Part</Table.HeaderCell>
        <Table.HeaderCell scope={'col'} align={'right'}>
          Height
        </Table.HeaderCell>
        <Table.HeaderCell scope={'col'} align={'right'}>
          Width
        </Table.HeaderCell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      {parts.map((part) => (
        <Table.Row key={part.name}>
          <Table.HeaderCell scope={'row'}>{part.name}</Table.HeaderCell>
          <Table.Cell align={'right'}>{part.height} mm</Table.Cell>
          <Table.Cell align={'right'}>{part.width} mm</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </>
);

/**
 * Fixed-only: `name`, `figure`, `figure` take their theme widths (12rem, 8rem, 8rem at the
 * defaults) and nothing stretches to fill the 64rem holder - unused space stays unused.
 */
export const FixedColumns: Story = {
  args: { caption: 'Dimensions' },
  render: (args) => (
    <Holder width={'64rem'} testId={'holder'}>
      <Table.Root
        {...args}
        columns={[{ width: 'name' }, { width: 'figure' }, { width: 'figure' }]}
      >
        {dimensionRows}
      </Table.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(widthsOf(canvasElement)).toEqual([192, 128, 128]);
    await expect(isEveryRowOn(canvasElement, edgesOf(canvasElement))).toBe(
      true,
    );
    const holder = canvas.getByTestId('holder').getBoundingClientRect();
    const last = canvas.getAllByRole('columnheader').at(-1);
    await expect(last?.getBoundingClientRect().right).toBeLessThan(
      holder.right - 400,
    );
  },
};

/** Proportional-only at `3` and `1`: three quarters and one quarter of the 48rem holder. */
export const ProportionalColumns: Story = {
  args: { caption: 'Parts and their notes' },
  render: (args) => (
    <Holder width={'48rem'}>
      <Table.Root {...args} columns={[{ weight: 3 }, { weight: 1 }]}>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell scope={'col'}>Part</Table.HeaderCell>
            <Table.HeaderCell scope={'col'}>Note</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {parts.map((part) => (
            <Table.Row key={part.name}>
              <Table.HeaderCell scope={'row'}>{part.name}</Table.HeaderCell>
              <Table.Cell variant={'note'}>as shipped, dry</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    await expect(widthsOf(canvasElement)).toEqual([576, 192]);
  },
};

/**
 * Minimums redistribute predictably. Above: `3` and `1` both floored at `name` (12rem) in a 40rem
 * holder - the quarter share (10rem) falls under its floor, so that column takes 12rem and the
 * other takes the 28rem left, not its nominal 30rem. Below: a `figure` column floored at `name`
 * resolves to the 12rem minimum, not its 8rem width.
 */
export const RedistributionAtMinimums: Story = {
  args: { caption: 'Parts and their notes' },
  render: (args) => (
    <div className={'flex flex-col gap-[var(--space-region)]'}>
      <Holder width={'40rem'} testId={'proportional'}>
        <Table.Root
          {...args}
          columns={[
            { weight: 3, minWidth: 'name' },
            { weight: 1, minWidth: 'name' },
          ]}
        >
          {dimensionRows}
        </Table.Root>
      </Holder>
      <Holder width={'40rem'} testId={'fixed'}>
        <Table.Root
          caption={'Dimensions, figure floored at name'}
          columns={[{ width: 'figure', minWidth: 'name' }, { weight: 1 }]}
        >
          {dimensionRows}
        </Table.Root>
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      widthsOf(canvas.getByTestId('proportional')).slice(0, 2),
    ).toEqual([448, 192]);
    await expect(widthsOf(canvas.getByTestId('fixed')).slice(0, 2)).toEqual([
      192, 448,
    ]);
  },
};

/**
 * The consumer's Staff: Candidates comparison, with its own search, sort, paging and a toggle
 * between short English and long German labels. Every one of those changes the rows and none of
 * them moves a column boundary; an empty result keeps the header on the same boundaries and the
 * next match comes back onto them. Long names wrap inside the `name` floor; the `action` column
 * holds its control at any width.
 */
export const ComparisonStability: Story = {
  args: { caption: 'Candidates' },
  render: () => <Candidates controls />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edges = edgesOf(canvasElement);
    await expect(isEveryRowOn(canvasElement, edges)).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: /^Name/ }));
    await expect(edgesOf(canvasElement)).toBe(edges);
    await userEvent.click(canvas.getByRole('button', { name: /^Wage/ }));
    await expect(edgesOf(canvasElement)).toBe(edges);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(edgesOf(canvasElement)).toBe(edges);
    await userEvent.click(canvas.getByRole('button', { name: 'Long labels' }));
    await expect(edgesOf(canvasElement)).toBe(edges);
    await expect(isEveryRowOn(canvasElement, edges)).toBe(true);
    const search = canvas.getByRole('textbox', { name: 'Search by name' });
    await userEvent.type(search, 'Sato');
    await expect(canvas.getAllByRole('row')).toHaveLength(2);
    await expect(edgesOf(canvasElement)).toBe(edges);
    await userEvent.type(search, 'xyz');
    await expect(canvas.getAllByRole('row')).toHaveLength(1);
    await expect(edgesOf(canvasElement)).toBe(edges);
    await userEvent.clear(search);
    await expect(canvas.getAllByRole('row')).toHaveLength(1 + PAGE_SIZE);
    await expect(edgesOf(canvasElement)).toBe(edges);
    await expect(isEveryRowOn(canvasElement, edges)).toBe(true);
  },
};

const RESIZABLE_WIDTHS = ['64rem', '40rem'] as const;

const ResizableCandidates: FunctionComponent = () => {
  const [index, setIndex] = useState(0);
  const [toggle$] = useState(() => new Subject<void>());
  useEffect(() => {
    const subscription = toggle$.subscribe(() =>
      setIndex((current) => (current + 1) % RESIZABLE_WIDTHS.length),
    );
    return () => subscription.unsubscribe();
  }, [toggle$]);
  return (
    <div className={'flex flex-col gap-[var(--space-region)]'}>
      <div>
        <Button variant={'ghost'} onClick$={toggle$}>
          Holder is {RESIZABLE_WIDTHS[index]}: toggle
        </Button>
      </div>
      <Holder width={RESIZABLE_WIDTHS[index] ?? '64rem'} testId={'holder'}>
        <Table.Root
          caption={'Candidates'}
          columns={[
            { weight: 2, minWidth: 'name' },
            { weight: 1, minWidth: 'fact' },
            { width: 'figure' },
            { width: 'action' },
          ]}
          testId={'table'}
        >
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell scope={'col'}>Name</Table.HeaderCell>
              <Table.HeaderCell scope={'col'}>Preferred role</Table.HeaderCell>
              <Table.HeaderCell scope={'col'} align={'right'}>
                Wage per week
              </Table.HeaderCell>
              <Table.HeaderCell scope={'col'}>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {CANDIDATES.slice(0, 4).map((candidate) => (
              <Table.Row key={candidate.id}>
                <Table.HeaderCell scope={'row'}>
                  {candidate.name}
                </Table.HeaderCell>
                <Table.Cell variant={'note'}>{candidate.role}</Table.Cell>
                <Table.Cell align={'right'}>{candidate.wage} $/wk</Table.Cell>
                <Table.Cell variant={'note'}>
                  <Button variant={'ghost'}>Hire</Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Holder>
    </div>
  );
};

/**
 * The available width changes and the proportional columns redistribute while the fixed ones hold.
 * At 64rem `name` and `role` share the 43.5rem the figure and action columns leave as 29rem and
 * 14.5rem. At 40rem both floors bind (12rem and 9rem), the fixed columns keep 8rem and 12.5rem,
 * and the 1.5rem that no longer fits scrolls in the wrapper. Back at 64rem the shares return.
 */
export const AvailableWidthChanges: Story = {
  args: { caption: 'Candidates' },
  render: () => <ResizableCandidates />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wide = [464, 232, 128, 200];
    await expect(widthsOf(canvasElement)).toEqual(wide);
    await userEvent.click(canvas.getByRole('button', { name: /toggle/ }));
    await expect(widthsOf(canvasElement)).toEqual([192, 144, 128, 200]);
    const wrapper = canvas.getByTestId('table');
    await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
    await userEvent.click(canvas.getByRole('button', { name: /toggle/ }));
    await expect(widthsOf(canvasElement)).toEqual(wide);
    await expect(wrapper.scrollWidth).toBe(wrapper.clientWidth);
  },
};

const UNBROKEN_IDENTIFIER =
  'LBL-2026-STAFF-CANDIDATE-00042-HAGENBACH-WITTGENSTEIN';

/**
 * Insufficient width: a 30rem holder for 32.5rem of floors and fixed widths. The allocation holds -
 * `name` at its 12rem floor, `figure` and `action` at their widths - and the wrapper scrolls the
 * 2.5rem that does not fit, with no page-wide scrolling. The secondary Button keeps its own width
 * inside the `action` column, the long German label and the unbroken identifier wrap inside the
 * `name` column, and no cell's content crosses into its neighbour.
 */
export const InsufficientWidth: Story = {
  args: { caption: 'Candidates' },
  render: (args) => (
    <Holder width={'30rem'}>
      <Table.Root
        {...args}
        columns={[
          { weight: 2, minWidth: 'name' },
          { width: 'figure' },
          { width: 'action' },
        ]}
        testId={'table'}
      >
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell scope={'col'}>
              Name der Bewerberin oder des Bewerbers
            </Table.HeaderCell>
            <Table.HeaderCell scope={'col'} align={'right'}>
              Wochenlohn
            </Table.HeaderCell>
            <Table.HeaderCell scope={'col'}>
              Einstellungsaktionen
            </Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Row>
            <Table.HeaderCell scope={'row'}>
              Friederike Hagenbach-Wittgenstein
            </Table.HeaderCell>
            <Table.Cell align={'right'}>1.250 $</Table.Cell>
            <Table.Cell variant={'note'}>
              <Button variant={'secondary'}>Einstellen</Button>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope={'row'}>
              {UNBROKEN_IDENTIFIER}
            </Table.HeaderCell>
            <Table.Cell align={'right'}>980 $</Table.Cell>
            <Table.Cell variant={'note'}>
              <Button variant={'secondary'}>Einstellen</Button>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(widthsOf(canvasElement)).toEqual([192, 128, 200]);
    const wrapper = canvas.getByTestId('table');
    await expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
    const page = document.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
    for (const row of canvas.getAllByRole('row')) {
      const cells = Array.from(row.children);
      cells.forEach((cell, index) => {
        const next = cells[index + 1];
        if (next !== undefined) {
          expect(cell.getBoundingClientRect().right).toBeLessThanOrEqual(
            next.getBoundingClientRect().left + 0.5,
          );
        }
        for (const child of cell.children) {
          expect(child.getBoundingClientRect().right).toBeLessThanOrEqual(
            cell.getBoundingClientRect().right + 0.5,
          );
        }
        expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
      });
    }
  },
};

/**
 * Below 48rem (the large-mobile viewport here, or any narrower window): the first table, with no
 * allocation, drops its supplementary note column as before; the second and third keep every
 * column and every row tabular under their allocation, whatever `notes` says - the residual
 * overflow scrolls instead. Note typography is unchanged in all three. Above 48rem all three show
 * every column, and the play checks whichever case the viewport is in.
 */
export const NotesKeptUnderAllocation: Story = {
  args: { caption: 'Material specification', notes: 'supplementary' },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const isNarrow = window.innerWidth < 768;
    const noteDisplays = (holder: string) =>
      Array.from(
        canvas.getByTestId(holder).querySelectorAll('[data-variant=note]'),
      ).map((cell) => getComputedStyle(cell).display);
    const contentDriven = noteDisplays('content-driven');
    await expect(contentDriven.length).toBeGreaterThan(0);
    await expect(contentDriven.every((display) => display === 'none')).toBe(
      isNarrow,
    );
    for (const holder of ['allocated-supplementary', 'allocated-content']) {
      const root = canvas.getByTestId(holder);
      await expect(
        noteDisplays(holder).every((display) => display !== 'none'),
      ).toBe(true);
      await expect(within(root).getAllByRole('cell')).toHaveLength(
        within(root).getAllByRole('row').length * 2 - 2,
      );
      for (const row of within(root).getAllByRole('row')) {
        const tops = new Set(
          Array.from(row.children).map((cell) =>
            Math.round(cell.getBoundingClientRect().top),
          ),
        );
        await expect(tops.size).toBe(1);
      }
      await expect(root.scrollWidth).toBeGreaterThanOrEqual(root.clientWidth);
    }
  },
  render: (args) => (
    <div className={'flex flex-col gap-[var(--space-region)]'}>
      <Table.Root {...args} testId={'content-driven'}>
        {specificationRows}
      </Table.Root>
      <Table.Root
        {...args}
        columns={[
          { weight: 1, minWidth: 'fact' },
          { width: 'figure' },
          { weight: 2 },
        ]}
        testId={'allocated-supplementary'}
      >
        {specificationRows}
      </Table.Root>
      <Table.Root
        caption={'Release notes'}
        notes={'content'}
        columns={[{ width: 'figure' }, { width: 'figure' }, { weight: 1 }]}
        testId={'allocated-content'}
      >
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
            <Table.Cell align={'right'}>2026-08-11</Table.Cell>
            <Table.Cell variant={'note'}>Added the Table primitive.</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell scope={'row'}>1.1.0</Table.HeaderCell>
            <Table.Cell align={'right'}>2026-08-11</Table.Cell>
            <Table.Cell variant={'note'}>Added the Eyebrow label.</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </div>
  ),
};

/**
 * Comfortable and compact on one page: the same comparison twice, the second with `density="compact"`.
 * Compact halves the cell insets and changes nothing else - type sizes, the action buttons' height,
 * the header buttons' ring and the sortable headers behave the same in both.
 */
export const Density: Story = {
  args: { caption: 'Candidates' },
  render: () => (
    <div className={'flex flex-col gap-[var(--space-region)]'}>
      <div data-testid={'comfortable'}>
        <Candidates
          rows={CANDIDATES.slice(0, 4)}
          caption={'Candidates, comfortable'}
        />
      </div>
      <div data-testid={'compact'}>
        <Candidates
          rows={CANDIDATES.slice(0, 4)}
          density={'compact'}
          caption={'Candidates, compact'}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cellOf = (holder: string) =>
      within(canvas.getByTestId(holder)).getAllByRole('cell')[0];
    const comfortable = cellOf('comfortable');
    const compact = cellOf('compact');
    if (comfortable === undefined || compact === undefined)
      throw new Error('no cells');
    await expect(getComputedStyle(comfortable).paddingLeft).toBe('16px');
    await expect(getComputedStyle(comfortable).paddingTop).toBe('8px');
    await expect(getComputedStyle(compact).paddingLeft).toBe('8px');
    await expect(getComputedStyle(compact).paddingTop).toBe('4px');
    await expect(getComputedStyle(compact).fontSize).toBe(
      getComputedStyle(comfortable).fontSize,
    );
    const buttonHeight = (holder: string) =>
      within(canvas.getByTestId(holder))
        .getAllByRole('button', { name: 'Hire' })[0]
        ?.getBoundingClientRect().height;
    await expect(buttonHeight('compact')).toBe(buttonHeight('comfortable'));
  },
};

/**
 * A theme moves a role and every table allocating by it moves: the second holder re-points
 * `--table-column-name` to 20rem and `--table-column-figure` to 6rem, so the same markup takes
 * 20rem and 6rem instead of the 12rem and 8rem defaults beside it.
 */
export const ThemedColumnWidths: Story = {
  args: { caption: 'Dimensions' },
  render: (args) => (
    <div className={'flex flex-col gap-[var(--space-region)]'}>
      <Holder width={'48rem'} testId={'default'}>
        <Table.Root
          {...args}
          columns={[{ width: 'name' }, { width: 'figure' }, { weight: 1 }]}
        >
          {dimensionRows}
        </Table.Root>
      </Holder>
      <Holder
        width={'48rem'}
        style={{
          '--table-column-name': '20rem',
          '--table-column-figure': '6rem',
        }}
        testId={'themed'}
      >
        <Table.Root
          caption={'Dimensions, under a theme scope'}
          columns={[{ width: 'name' }, { width: 'figure' }, { weight: 1 }]}
        >
          {dimensionRows}
        </Table.Root>
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(widthsOf(canvas.getByTestId('default')).slice(0, 3)).toEqual([
      192, 128, 448,
    ]);
    await expect(widthsOf(canvas.getByTestId('themed')).slice(0, 3)).toEqual([
      320, 96, 352,
    ]);
  },
};
