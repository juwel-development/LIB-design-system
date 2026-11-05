import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Callout,
  Checklist,
  Cluster,
  Collection,
  ColumnLayout,
  H1,
  H2,
  Header,
  Input,
  Meter,
  Note,
  P,
  Pane,
  Screen,
  Select,
  Shell,
  Sidebar,
  Stack,
  Tabs,
} from 'index';
import {
  type CSSProperties,
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';

const meta: Meta<typeof Screen> = {
  title: 'Layout/Screen Work Areas',
  component: Screen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A representative editing screen whose three work areas regroup by available width, composed entirely from public components: three simultaneous bounded panels where they fit, and where they do not, the first and third sharing a tabbed surface beside the second, which stays visible whichever tab is selected. The areas, their names, order and grouping are this example application's; the library holds none of them.

Shell (console) → Sidebar.Root fill → Sidebar.Content → Screen → ColumnLayout.Alternatives fill → ColumnLayout.Root fill → ColumnLayout.Column → Pane.Root passes the finite height without application CSS; in the grouped arrangement Tabs.Root fill → Tabs.Panel sits between the Column and its Pane. Every Pane keeps its Head and Foot in view and scrolls only its Body.

The example theme declares \`--work-area-min-width: 20rem\` and \`--sides-min-width: 22rem\`. Three equal columns therefore fit from \`66rem + 2 × --space-region\` and the grouped pair from \`44rem + --space-region\` of the Alternatives' own width - the width left after the Sidebar and the Screen gutter. With this theme a 1920px window mounts the three panels and a 1280px window the grouped pair. Those are outcomes of the consumer's tokens, not library breakpoints: another theme moves them, and a narrower holder in a wide window takes the grouped arrangement all the same.

The application keeps the active tab, the title draft, the medium and the placements. The sides panel is declared under the key \`sides\` in both arrangements and stays mounted through a regrouping; the pool and the release panel are removed when they move into the tab group and mount fresh, the title showing the application's draft again. Nothing is mounted twice and nothing inactive is kept hidden.

**Below the fitting widths** the last declaration stays: the tab group above the sides panel, each at the full width and at content height, with the Shell body scrolling and nothing overflowing sideways. *NarrowFallback* supplies a \`fallback\` instead - all three areas as tabs, still bounded. **At short heights** Screen's existing fallback applies: when a panel's fixed regions leave no usable body, the whole content takes its natural height and the Shell body scrolls it. The tab row above a grouped panel counts against that panel's room, so the release comes before its body is down to less than a line.

*ReadOnly* is the consumer's two-area case: it declares one arrangement of two columns, so there is no empty track and no obsolete tab. \`scripts/browser/work-areas.mjs\` records the reference geometry, keyboard order, lifecycle and fallbacks for these fixtures. They establish library behavior for representative content, not any application's actual content or theme fit.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

const theme = {
  '--work-area-min-width': '20rem',
  '--sides-min-width': '22rem',
} as CSSProperties;

const english = {
  workspace: 'Label workspace',
  account: 'Account',
  body: 'Workspace body',
  sections: 'Sections',
  entries: [
    'Releases',
    'Recordings',
    'Artists',
    'Contracts',
    'Royalties',
    'Settings',
  ],
  heading: 'Night Drive',
  areas: 'Work areas',
  pool: 'Eligible recordings',
  poolFacts: (count: number) => `${count} recordings ready to place`,
  poolList: 'Eligible recordings list',
  recording: 'Recording',
  duration: 'Running time',
  place: (side: string) => `Place on side ${side}`,
  sides: 'Sides',
  medium: 'Medium',
  mediumPlaceholder: 'Choose a medium',
  media: ['12-inch LP', '7-inch single'],
  warningName: 'Capacity warning',
  warning: 'Side B is over its capacity by 1:12.',
  side: (side: string) => `Side ${side}`,
  capacity: (side: string) => `Side ${side} running time`,
  placed: (count: number) => `${count} placed`,
  sidesList: 'Placed recordings',
  empty: 'Nothing placed yet.',
  release: 'Complete the release',
  title: 'Release title',
  rules: 'Release checks',
  rule: 'Every side stays within the capacity of the chosen medium, including the lead-out.',
  checks: '3 of 5 checks passed',
  complete: 'Complete release',
};

const german: typeof english = {
  workspace: 'Arbeitsbereich für die Veröffentlichungsplanung des Labels',
  account: 'Benutzerkonto',
  body: 'Arbeitsbereich',
  sections: 'Bereiche',
  entries: [
    'Veröffentlichungen',
    'Aufnahmen',
    'Künstlerinnen und Künstler',
    'Vertragsunterlagen',
    'Lizenzabrechnungen',
    'Einstellungen',
  ],
  heading: 'Night Drive',
  areas: 'Arbeitsbereiche',
  pool: 'Verfügbare Aufnahmen',
  poolFacts: (count: number) => `${count} Aufnahmen können zugeordnet werden`,
  poolList: 'Liste der verfügbaren Aufnahmen',
  recording: 'Aufnahme',
  duration: 'Laufzeit',
  place: (side: string) => `Auf Seite ${side} legen`,
  sides: 'Seiten',
  medium: 'Tonträgerformat',
  mediumPlaceholder: 'Tonträgerformat auswählen',
  media: ['Langspielplatte (30 cm)', 'Single (17 cm)'],
  warningName: 'Kapazitätswarnung',
  warning: 'Seite B überschreitet ihre Kapazität um 1:12.',
  side: (side: string) => `Seite ${side}`,
  capacity: (side: string) => `Laufzeit der Seite ${side}`,
  placed: (count: number) => `${count} zugeordnet`,
  sidesList: 'Zugeordnete Aufnahmen',
  empty: 'Noch nichts zugeordnet.',
  release: 'Veröffentlichung abschließen',
  title: 'Titel der Veröffentlichung',
  rules: 'Veröffentlichungsprüfungen',
  rule: 'Jede Seite bleibt einschließlich der Auslaufrille innerhalb der Kapazität des gewählten Tonträgerformats.',
  checks: '3 von 5 Prüfungen bestanden',
  complete: 'Veröffentlichung abschließen',
};

type Placement = { recording: number; side: string };

// One interaction owner per control: the button's own Subject, bridged to the application's
// placement stream for as long as the button is mounted.
const PlaceAction: FunctionComponent<{
  placement: Placement;
  place$: Subject<Placement>;
  children: string;
}> = ({ placement, place$, children }) => {
  const [activate$] = useState(() => new Subject<void>());
  const { recording, side } = placement;
  useEffect(() => {
    const subscription = activate$.subscribe(() =>
      place$.next({ recording, side }),
    );
    return () => subscription.unsubscribe();
  }, [activate$, place$, recording, side]);
  return (
    <Button variant="plain" onClick$={activate$}>
      {children}
    </Button>
  );
};

const Workspace: FunctionComponent<{
  translated?: boolean;
  count?: number;
  readOnly?: boolean;
  withFallback?: boolean;
}> = ({
  translated = false,
  count = 24,
  readOnly = false,
  withFallback = false,
}) => {
  const copy = translated ? german : english;
  const [active, setActive] = useState('pool');
  const [draft, setDraft] = useState('Night Drive');
  const [medium, setMedium] = useState('lp');
  const [placements, setPlacements] = useState<readonly Placement[]>([]);
  const [select$] = useState(() => new Subject<string>());
  const [title$] = useState(() => new Subject<string>());
  const [medium$] = useState(() => new Subject<string>());
  const [place$] = useState(() => new Subject<Placement>());
  const [navigate$] = useState(() => new Subject<string>());
  const [complete$] = useState(() => new Subject<void>());
  useEffect(() => {
    const subscriptions = [
      select$.subscribe(setActive),
      title$.subscribe(setDraft),
      medium$.subscribe(setMedium),
      place$.subscribe((placement) =>
        setPlacements((placed) => [...placed, placement]),
      ),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  }, [select$, title$, medium$, place$]);
  const recordings = Array.from({ length: count }, (_, index) => index + 1);
  const placedOn = (side: string): readonly Placement[] =>
    placements.filter((placement) => placement.side === side);

  const pool = (
    <Pane.Root name={copy.pool}>
      <Pane.Head testId="pool-head">
        <Stack>
          <H2>{copy.pool}</H2>
          <Note>{copy.poolFacts(count)}</Note>
        </Stack>
      </Pane.Head>
      <Pane.Body ariaLabel={copy.poolList} testId="pool-body">
        <Collection.Root>
          {recordings.map((recording) => (
            <Collection.Item key={recording}>
              <Stack>
                <P>
                  {copy.recording} {recording}
                </P>
                <Note>
                  {copy.duration} {3 + (recording % 4)}:{10 + recording}
                </Note>
                <Cluster>
                  <PlaceAction
                    placement={{ recording, side: 'A' }}
                    place$={place$}
                  >
                    {copy.place('A')}
                  </PlaceAction>
                  <PlaceAction
                    placement={{ recording, side: 'B' }}
                    place$={place$}
                  >
                    {copy.place('B')}
                  </PlaceAction>
                </Cluster>
              </Stack>
            </Collection.Item>
          ))}
        </Collection.Root>
      </Pane.Body>
    </Pane.Root>
  );

  const sides = (
    <Pane.Root name={copy.sides}>
      <Pane.Head testId="sides-head">
        <Stack>
          <H2>{copy.sides}</H2>
          <Select.Root
            label={copy.medium}
            name="medium"
            placeholder={copy.mediumPlaceholder}
            defaultValue={medium}
            onChange$={medium$}
            disabled={readOnly}
          >
            <Select.Option value="lp">{copy.media[0] ?? ''}</Select.Option>
            <Select.Option value="single">{copy.media[1] ?? ''}</Select.Option>
          </Select.Root>
          <Callout name={copy.warningName}>
            <P>{copy.warning}</P>
          </Callout>
          <Meter
            label={copy.capacity('A')}
            value={14 + placedOn('A').length}
            max={22}
            valueText={`${14 + placedOn('A').length}:05 / 22:00`}
          />
          <Meter
            label={copy.capacity('B')}
            value={22}
            max={22}
            valueText="23:12 / 22:00"
          />
          <Note testId="placed-count">{copy.placed(placements.length)}</Note>
        </Stack>
      </Pane.Head>
      <Pane.Body ariaLabel={copy.sidesList} testId="sides-body">
        <Stack>
          <Input label={`${copy.side('A')} · Matrix`} name="matrix" />
          {placements.length === 0 && <P>{copy.empty}</P>}
          {placements.map((placement, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a recording may be placed twice; the order of placing is the identity
            <P key={index}>
              {copy.side(placement.side)}: {copy.recording}{' '}
              {placement.recording}
            </P>
          ))}
          {recordings.map((recording) => (
            <P key={recording}>
              {copy.side(recording % 2 === 0 ? 'B' : 'A')}: {copy.recording}{' '}
              {100 + recording}
            </P>
          ))}
        </Stack>
      </Pane.Body>
    </Pane.Root>
  );

  const release = (
    <Pane.Root name={copy.release}>
      <Pane.Head testId="release-head">
        <Stack>
          <H2>{copy.release}</H2>
          <Input
            label={copy.title}
            name="title"
            defaultValue={draft}
            onInput$={title$}
            disabled={readOnly}
          />
        </Stack>
      </Pane.Head>
      <Pane.Body ariaLabel={copy.rules} testId="release-body">
        <Checklist.Root>
          {recordings.map((recording) => (
            <Checklist.Item key={recording}>
              {copy.rule} ({recording})
            </Checklist.Item>
          ))}
        </Checklist.Root>
      </Pane.Body>
      <Pane.Foot testId="release-foot">
        <Stack>
          <Note>{copy.checks}</Note>
          <Button onClick$={complete$} disabled={readOnly}>
            {copy.complete}
          </Button>
        </Stack>
      </Pane.Foot>
    </Pane.Root>
  );

  const sidesColumn = (
    <ColumnLayout.Column
      key="sides"
      weight={1}
      minWidth="--sides-min-width"
      testId="sides-column"
    >
      {sides}
    </ColumnLayout.Column>
  );
  const releaseColumn = (
    <ColumnLayout.Column
      key="release"
      weight={1}
      minWidth="--work-area-min-width"
      testId="release-column"
    >
      {release}
    </ColumnLayout.Column>
  );

  const everything: ReactNode = (
    <Tabs.Root fill active={active} onSelect$={select$} label={copy.areas}>
      <Tabs.List>
        <Tabs.Tab value="pool">{copy.pool}</Tabs.Tab>
        <Tabs.Tab value="sides">{copy.sides}</Tabs.Tab>
        <Tabs.Tab value="release">{copy.release}</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="pool">{pool}</Tabs.Panel>
      <Tabs.Panel value="sides">{sides}</Tabs.Panel>
      <Tabs.Panel value="release">{release}</Tabs.Panel>
    </Tabs.Root>
  );

  return (
    <div style={theme}>
      <Shell
        testId="shell"
        ariaLabel={copy.body}
        bar={
          <Header
            status={copy.workspace}
            action={<Button variant="plain">{copy.account}</Button>}
          />
        }
      >
        <Sidebar.Root
          fill
          active="releases"
          label={copy.sections}
          onSelect$={navigate$}
        >
          {copy.entries.map((entry, index) => (
            <Sidebar.Item
              key={entry}
              entryKey={index === 0 ? 'releases' : entry}
            >
              {entry}
            </Sidebar.Item>
          ))}
          <Sidebar.Content>
            <Screen heading={<H1>{copy.heading}</H1>}>
              {readOnly ? (
                <ColumnLayout.Alternatives fill testId="alternatives">
                  <ColumnLayout.Root fill testId="two-areas">
                    {sidesColumn}
                    {releaseColumn}
                  </ColumnLayout.Root>
                </ColumnLayout.Alternatives>
              ) : (
                <ColumnLayout.Alternatives
                  fill
                  fallback={withFallback ? everything : undefined}
                  testId="alternatives"
                >
                  <ColumnLayout.Root fill testId="three-areas">
                    <ColumnLayout.Column
                      key="pool"
                      weight={1}
                      minWidth="--work-area-min-width"
                      testId="pool-column"
                    >
                      {pool}
                    </ColumnLayout.Column>
                    {sidesColumn}
                    {releaseColumn}
                  </ColumnLayout.Root>
                  <ColumnLayout.Root fill testId="grouped-areas">
                    <ColumnLayout.Column
                      key="group"
                      weight={1}
                      minWidth="--work-area-min-width"
                      testId="group-column"
                    >
                      <Tabs.Root
                        fill
                        active={active === 'sides' ? 'pool' : active}
                        onSelect$={select$}
                        label={copy.areas}
                      >
                        <Tabs.List>
                          <Tabs.Tab value="pool">{copy.pool}</Tabs.Tab>
                          <Tabs.Tab value="release">{copy.release}</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="pool">{pool}</Tabs.Panel>
                        <Tabs.Panel value="release">{release}</Tabs.Panel>
                      </Tabs.Root>
                    </ColumnLayout.Column>
                    {sidesColumn}
                  </ColumnLayout.Root>
                </ColumnLayout.Alternatives>
              )}
            </Screen>
          </Sidebar.Content>
        </Sidebar.Root>
      </Shell>
    </div>
  );
};

/** English labels and long bodies. Three panels at 1920×1080, the tab group beside the sides
 *  panel at 1280×720 - by this theme's tokens. */
export const English: Story = { render: () => <Workspace /> };
/** German-length labels in the bar, the sidebar, the tabs, the heads and the actions. */
export const German: Story = { render: () => <Workspace translated /> };
/** Short bodies keep their content height; the foot follows the body rather than the bound. */
export const ShortBodies: Story = { render: () => <Workspace count={2} /> };
/** The consumer's two-area case: one declaration, no tab group and no reserved third track. */
export const ReadOnly: Story = { render: () => <Workspace readOnly /> };
export const ReadOnlyGerman: Story = {
  render: () => <Workspace readOnly translated />,
};
/** Below both thresholds a consumer-supplied fallback - all three areas as tabs - replaces the
 *  stacked last declaration and stays bounded. */
export const NarrowFallback: Story = {
  render: () => <Workspace withFallback />,
};
