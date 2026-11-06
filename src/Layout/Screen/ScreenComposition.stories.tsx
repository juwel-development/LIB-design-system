import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Box,
  Button,
  Choices,
  Cluster,
  ColumnLayout,
  DefinitionList,
  Eyebrow,
  H1,
  H2,
  Header,
  Meter,
  Note,
  P,
  Pane,
  Screen,
  Shell,
  Sidebar,
  Stack,
  Table,
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
  title: 'Layout/Screen Composition',
  component: Screen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Representative consoles for the four content-height compositions Screen supports beside and above bounded work areas (#159). Every fixture is composed from public components only; the areas, wording, tokens and grouping are this example application's.

**1 · A column head above bounded work areas** (*ContractDetail*, *HeadAbovePane*). \`ColumnLayout.Column head\` puts consumer content at content height above the column's one child, and a filled column passes what is left to that child: a Pane, \`ColumnLayout.Alternatives fill\` or \`Tabs.Root fill\`. The head spans its own column only, so the Roster beside it keeps its full height. In ContractDetail the example theme's \`--lane-minimum: 16rem\` mounts four lanes side by side at 1920×1080 and four tabs at 1280×720; each lane keeps its head and act in view and scrolls its own body.

**2 · A content-height Stack holding a Box and an unsized Pane** (*FocusColumn*) beside a bounded Pane with a delegated Table. The summary Pane takes its content height; neither it nor the Stack scrolls.

**3 · Content-only screens** (*ProfileOnly*, *TableOnly*, *TableOnlyWithoutHeading*). A content-height Stack or an unbounded Table is Screen's sole content, with or without Screen's heading. No Pane and no filling ColumnLayout are needed.

**4 · Content-height columns** (*ContentColumns*). A Stack with no Pane fills one column beside a bounded Pane; *End* replaces the Pane with a content-height result block, so both columns are content height.

**Fallback.** While everything fits, content-height regions stay in view and bounded bodies scroll on their own. When fixed content - a column head, a content-height column, the sole content - or a bounded area's usable body minimum no longer fits Screen's remainder, the whole content, Screen's heading included, takes its natural height and the Shell body scrolls it. Bounds return when room returns, with nothing remounted, refocused or measured by clipping. A long body that scrolls inside its bound is not itself a reason to release. *Longer head* adds fixed content in place to exercise the release and restoration; *Compact spacing* switches the Screen to #158's compact console treatment in place, so every composition can be compared with it; *Overflowing* fixtures carry content taller than the reference windows on purpose, to show the documented fallback rather than hide it.

\`scripts/browser/screen-composition.mjs\` records the geometry at 1920×1080 and 1280×720 in English and German, both themes and the built stylesheets. These fixtures establish library behavior for representative content, not any application's actual fit.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

const theme = {
  '--roster-minimum': '15rem',
  '--roster-maximum': '17rem',
  '--detail-minimum': '20rem',
  '--lane-minimum': '16rem',
  '--support-minimum': '18rem',
} as CSSProperties;

const english = {
  workspace: 'Label console',
  translate: 'EN / DE',
  longer: 'Longer head',
  compact: 'Compact spacing',
  body: 'Console body',
  sections: 'Sections',
  entries: ['Contracts', 'A&R', 'People', 'Markets'],
  contracts: 'Contracts',
  artists: (count: number) => `${count} artists under contract`,
  roster: 'Artists under contract',
  artist: 'Artist',
  status: 'Status',
  active: 'Active',
  page: (page: number) => `Page ${page} of 3`,
  previous: 'Previous page',
  next: 'Next page',
  name: 'Alex Morgan',
  facts:
    'Recording contract · 3 albums · 18 % royalty · runs until 2029 · advance recouped',
  extra:
    'Renegotiation window opens in 14 months; the option on a fourth album lapses unless exercised in writing.',
  lanes: 'Work areas',
  songs: 'Songs to record',
  sessions: 'Recording sessions',
  pool: 'Pool',
  releases: 'Releases',
  count: (count: number) => `${count} entries`,
  item: (lane: string, index: number) => `${lane} ${index}`,
  act: (lane: string) => `Add to ${lane.toLowerCase()}`,
  candidate: 'Candidate',
  role: 'Preferred role: Producer · Proficiency 72',
  demeanour: 'Patient, but expects a fair first offer.',
  patience: 'Patience',
  rounds: 'Rounds so far',
  round: 'Round',
  offer: 'Your offer',
  reply: 'Their reply',
  declined: 'Declined',
  terms: 'Offer',
  present: 'Present offer',
  prospects: 'Prospects',
  focus: 'Focus',
  focusStatus:
    'Scouting is running. The focus decides which prospects appear next.',
  focusLabel: 'Scouting focus',
  choices: [
    ['genre', 'Genre', 'Prospects whose public genre matches the label.'],
    ['reach', 'Reach', 'Prospects with the widest current audience.'],
  ] as readonly (readonly [string, string, string])[],
  summary: 'Current contract',
  back: 'Back to contracts',
  profile: 'Artist profile',
  kind: 'Kind',
  band: 'Band',
  genre: 'Public genre',
  genreValue: 'Synth pop',
  popularity: 'Popularity',
  members: 'Members',
  negotiate: 'Negotiate',
  research: 'Market research',
  markets: 'Markets',
  market: 'Market',
  population: 'Population',
  knowledge: 'Market knowledge',
  setFocus: 'Set focus',
  people: 'People',
  history: 'Song history',
  song: 'Song',
  written: 'Written',
  end: 'End',
  signed: 'Signed.',
  signedLine: 'The contract starts with the next season.',
  returnTo: 'Return',
};

const german: typeof english = {
  workspace: 'Konsole für die Labelverwaltung',
  translate: 'EN / DE',
  longer: 'Längerer Kopf',
  compact: 'Kompakter Abstand',
  body: 'Konsoleninhalt',
  sections: 'Bereiche',
  entries: ['Verträge', 'Talentsuche', 'Personen', 'Märkte'],
  contracts: 'Verträge',
  artists: (count: number) =>
    `${count} Künstlerinnen und Künstler unter Vertrag`,
  roster: 'Künstlerinnen und Künstler unter Vertrag',
  artist: 'Künstler',
  status: 'Status',
  active: 'Aktiv',
  page: (page: number) => `Seite ${page} von 3`,
  previous: 'Vorherige Seite',
  next: 'Nächste Seite',
  name: 'Alex Morgan',
  facts:
    'Plattenvertrag · 3 Alben · 18 % Lizenz · läuft bis 2029 · Vorschuss eingespielt',
  extra:
    'Das Fenster für Nachverhandlungen öffnet in 14 Monaten; die Option auf ein viertes Album verfällt ohne schriftliche Ausübung.',
  lanes: 'Arbeitsbereiche',
  songs: 'Aufzunehmende Lieder',
  sessions: 'Aufnahmetermine',
  pool: 'Vorrat',
  releases: 'Veröffentlichungen',
  count: (count: number) => `${count} Einträge`,
  item: (lane: string, index: number) => `${lane} ${index}`,
  act: (lane: string) => `${lane}: Eintrag hinzufügen`,
  candidate: 'Bewerbung',
  role: 'Bevorzugte Rolle: Produzent · Fertigkeit 72',
  demeanour: 'Geduldig, erwartet aber ein faires erstes Angebot.',
  patience: 'Geduld',
  rounds: 'Bisherige Runden',
  round: 'Runde',
  offer: 'Ihr Angebot',
  reply: 'Antwort',
  declined: 'Abgelehnt',
  terms: 'Angebot',
  present: 'Angebot vorlegen',
  prospects: 'Talente',
  focus: 'Schwerpunkt',
  focusStatus:
    'Die Talentsuche läuft. Der Schwerpunkt entscheidet, welche Talente als Nächstes erscheinen.',
  focusLabel: 'Schwerpunkt der Talentsuche',
  choices: [
    ['genre', 'Genre', 'Talente, deren öffentliches Genre zum Label passt.'],
    ['reach', 'Reichweite', 'Talente mit dem derzeit größten Publikum.'],
  ],
  summary: 'Laufender Vertrag',
  back: 'Zurück zu den Verträgen',
  profile: 'Künstlerprofil',
  kind: 'Art',
  band: 'Band',
  genre: 'Öffentliches Genre',
  genreValue: 'Synthie-Pop',
  popularity: 'Beliebtheit',
  members: 'Mitglieder',
  negotiate: 'Verhandeln',
  research: 'Marktforschung',
  markets: 'Märkte',
  market: 'Markt',
  population: 'Bevölkerung',
  knowledge: 'Marktkenntnis',
  setFocus: 'Schwerpunkt setzen',
  people: 'Personen',
  history: 'Liedverlauf',
  song: 'Lied',
  written: 'Geschrieben',
  end: 'Beenden',
  signed: 'Unterschrieben.',
  signedLine: 'Der Vertrag beginnt mit der nächsten Saison.',
  returnTo: 'Zurück',
};

type Copy = typeof english;

// One Subject per control, bridged to a state setter for as long as the fixture is mounted.
const useToggle = (initial: boolean): [boolean, Subject<void>] => {
  const [value, setValue] = useState(initial);
  const [toggle$] = useState(() => new Subject<void>());
  useEffect(() => {
    const subscription = toggle$.subscribe(() => setValue((was) => !was));
    return () => subscription.unsubscribe();
  }, [toggle$]);
  return [value, toggle$];
};

const Console: FunctionComponent<{
  copy: Copy;
  active: number;
  translate$: Subject<void>;
  actions?: ReactNode;
  heading?: ReactNode;
  children: ReactNode;
}> = ({ copy, active, translate$, actions, heading, children }) => {
  const [navigate$] = useState(() => new Subject<string>());
  // Every fixture can switch to #158's compact console treatment in place, nothing remounted.
  const [isCompact, compact$] = useToggle(false);
  return (
    <div style={theme}>
      <Shell
        testId="shell"
        ariaLabel={copy.body}
        bar={
          <Header
            status={copy.workspace}
            action={
              <Cluster>
                <Button variant="plain" onClick$={translate$}>
                  {copy.translate}
                </Button>
                <Button variant="plain" onClick$={compact$}>
                  {copy.compact}
                </Button>
                {actions}
              </Cluster>
            }
          />
        }
      >
        <Sidebar.Root
          fill
          active={String(active)}
          label={copy.sections}
          onSelect$={navigate$}
        >
          {copy.entries.map((entry, index) => (
            <Sidebar.Item key={entry} entryKey={String(index)}>
              {entry}
            </Sidebar.Item>
          ))}
          <Sidebar.Content>
            <Screen
              heading={heading}
              spacing={isCompact ? 'compact' : undefined}
            >
              {children}
            </Screen>
          </Sidebar.Content>
        </Sidebar.Root>
      </Shell>
    </div>
  );
};

const RosterPane: FunctionComponent<{ copy: Copy; heading: ReactNode }> = ({
  copy,
  heading,
}) => (
  <Pane.Root name={copy.roster}>
    <Pane.Head testId="roster-head">
      <Stack>
        {heading}
        <Note>{copy.artists(40)}</Note>
      </Stack>
    </Pane.Head>
    <Pane.Body ariaLabel={copy.roster} scrollOwner="child" testId="roster-body">
      <Table.Root
        bounded
        caption={copy.roster}
        captionVisibility="hidden"
        columns={[{ weight: 2 }, { weight: 1 }]}
      >
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell scope="col">{copy.artist}</Table.HeaderCell>
            <Table.HeaderCell scope="col">{copy.status}</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {Array.from({ length: 40 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixture rows have no identity but their place
            <Table.Row key={index}>
              <Table.Cell>
                <Button variant="plain">
                  {copy.name} {index + 1}
                </Button>
              </Table.Cell>
              <Table.Cell>{copy.active}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Pane.Body>
    <Pane.Foot testId="roster-foot">
      <Cluster>
        <Note>{copy.page(1)}</Note>
        <Button variant="plain" disabled>
          {copy.previous}
        </Button>
        <Button variant="plain">{copy.next}</Button>
      </Cluster>
    </Pane.Foot>
  </Pane.Root>
);

const Lane: FunctionComponent<{ copy: Copy; lane: string; id: string }> = ({
  copy,
  lane,
  id,
}) => (
  <Pane.Root name={lane}>
    <Pane.Head testId={`${id}-head`}>
      <Stack>
        <H2>{lane}</H2>
        <Note>{copy.count(30)}</Note>
      </Stack>
    </Pane.Head>
    <Pane.Body ariaLabel={lane} testId={`${id}-body`}>
      <Stack>
        {Array.from({ length: 30 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixture items have no identity but their place
          <P key={index}>{copy.item(lane, index + 1)}</P>
        ))}
      </Stack>
    </Pane.Body>
    <Pane.Foot testId={`${id}-foot`}>
      <Button variant="secondary">{copy.act(lane)}</Button>
    </Pane.Foot>
  </Pane.Root>
);

const ContractStrip: FunctionComponent<{ copy: Copy; longer: boolean }> = ({
  copy,
  longer,
}) => (
  <Stack testId="strip">
    <Cluster>
      <Button variant="plain">{copy.name}</Button>
      <P>{copy.facts}</P>
    </Cluster>
    {longer &&
      Array.from({ length: 8 }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: repeated fixture copy
        <P key={index}>{copy.extra}</P>
      ))}
  </Stack>
);

/** Case 1: a column head above four lanes, or four tabs, beside a bounded Roster. */
const ContractDetailFixture: FunctionComponent<{ translated: boolean }> = ({
  translated,
}) => {
  const [isGerman, translate$] = useToggle(translated);
  const [longer, longer$] = useToggle(false);
  const copy = isGerman ? german : english;
  const [active, setActive] = useState('songs');
  const [select$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = select$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [select$]);
  const lanes = [
    ['songs', copy.songs],
    ['sessions', copy.sessions],
    ['pool', copy.pool],
    ['releases', copy.releases],
  ] as const;
  return (
    <Console
      copy={copy}
      active={0}
      translate$={translate$}
      actions={
        <Button variant="plain" onClick$={longer$}>
          {copy.longer}
        </Button>
      }
    >
      <ColumnLayout.Root fill>
        <ColumnLayout.Column
          weight={1}
          minWidth="--roster-minimum"
          maxWidth="--roster-maximum"
          testId="roster-column"
        >
          <RosterPane copy={copy} heading={<H1>{copy.contracts}</H1>} />
        </ColumnLayout.Column>
        <ColumnLayout.Column
          weight={1}
          minWidth="--detail-minimum"
          head={<ContractStrip copy={copy} longer={longer} />}
          testId="detail-column"
        >
          <ColumnLayout.Alternatives fill testId="lanes">
            <ColumnLayout.Root fill testId="side-by-side">
              {lanes.map(([id, lane]) => (
                <ColumnLayout.Column
                  key={id}
                  weight={1}
                  minWidth="--lane-minimum"
                >
                  <Lane copy={copy} lane={lane} id={id} />
                </ColumnLayout.Column>
              ))}
            </ColumnLayout.Root>
            <ColumnLayout.Root fill testId="tabbed">
              <ColumnLayout.Column weight={1} minWidth="--lane-minimum">
                <Tabs.Root
                  fill
                  active={active}
                  onSelect$={select$}
                  label={copy.lanes}
                >
                  <Tabs.List>
                    {lanes.map(([id, lane]) => (
                      <Tabs.Tab key={id} value={id}>
                        {lane}
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                  {lanes.map(([id, lane]) => (
                    <Tabs.Panel key={id} value={id}>
                      <Lane copy={copy} lane={lane} id={id} />
                    </Tabs.Panel>
                  ))}
                </Tabs.Root>
              </ColumnLayout.Column>
            </ColumnLayout.Root>
          </ColumnLayout.Alternatives>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Console>
  );
};

/** Case 1 with one Pane: a candidate card above the rounds, beside the offer. */
const HeadAbovePaneFixture: FunctionComponent<{ translated: boolean }> = ({
  translated,
}) => {
  const [isGerman, translate$] = useToggle(translated);
  const [longer, longer$] = useToggle(false);
  const copy = isGerman ? german : english;
  return (
    <Console
      copy={copy}
      active={2}
      translate$={translate$}
      actions={
        <Button variant="plain" onClick$={longer$}>
          {copy.longer}
        </Button>
      }
      heading={<H1>{copy.people}</H1>}
    >
      <ColumnLayout.Root fill>
        <ColumnLayout.Column
          weight={1}
          minWidth="--support-minimum"
          head={
            <Stack testId="card">
              <H2>{copy.candidate}</H2>
              <P>{copy.name}</P>
              <P>{copy.role}</P>
              <P>{copy.demeanour}</P>
              {longer && <P>{copy.extra}</P>}
              <Meter label={copy.patience} value={6} max={10} />
            </Stack>
          }
          testId="candidate-column"
        >
          <Pane.Root name={copy.rounds}>
            <Pane.Head testId="rounds-head">
              <H2>{copy.rounds}</H2>
            </Pane.Head>
            <Pane.Body
              ariaLabel={copy.rounds}
              scrollOwner="child"
              testId="rounds-body"
            >
              <Table.Root
                bounded
                caption={copy.rounds}
                captionVisibility="hidden"
              >
                <Table.Head>
                  <Table.Row>
                    <Table.HeaderCell scope="col">
                      {copy.round}
                    </Table.HeaderCell>
                    <Table.HeaderCell scope="col">
                      {copy.offer}
                    </Table.HeaderCell>
                    <Table.HeaderCell scope="col">
                      {copy.reply}
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {Array.from({ length: 24 }, (_, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: rounds are identified by their place
                    <Table.Row key={index}>
                      <Table.Cell>{index + 1}</Table.Cell>
                      <Table.Cell>{40 + index} 000</Table.Cell>
                      <Table.Cell>{copy.declined}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Pane.Body>
          </Pane.Root>
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth="--support-minimum">
          <Pane.Root name={copy.terms}>
            <Pane.Head testId="offer-head">
              <H2>{copy.terms}</H2>
            </Pane.Head>
            <Pane.Body ariaLabel={copy.terms} testId="offer-body">
              <P>{copy.demeanour}</P>
            </Pane.Body>
            <Pane.Foot testId="offer-foot">
              <Button>{copy.present}</Button>
            </Pane.Foot>
          </Pane.Root>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Console>
  );
};

/** Case 2: a Stack of a Box and an unsized summary Pane beside a bounded Pane. */
const FocusColumnFixture: FunctionComponent<{ translated: boolean }> = ({
  translated,
}) => {
  const [isGerman, translate$] = useToggle(translated);
  const [longer, longer$] = useToggle(false);
  const copy = isGerman ? german : english;
  const [focus, setFocus] = useState('genre');
  const [focus$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = focus$.subscribe(setFocus);
    return () => subscription.unsubscribe();
  }, [focus$]);
  return (
    <Console
      copy={copy}
      active={1}
      translate$={translate$}
      actions={
        <Button variant="plain" onClick$={longer$}>
          {copy.longer}
        </Button>
      }
    >
      <ColumnLayout.Root fill>
        <ColumnLayout.Column weight={2} minWidth="--detail-minimum">
          <RosterPane copy={copy} heading={<H1>{copy.prospects}</H1>} />
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth="--support-minimum">
          <Stack testId="focus-column">
            <Box name={copy.focus}>
              <Stack>
                <H2>{copy.focus}</H2>
                <P>{copy.focusStatus}</P>
                <Choices.Root
                  label={copy.focusLabel}
                  selected={focus}
                  onSelect$={focus$}
                >
                  {copy.choices.map(([value, label, description]) => (
                    <Choices.Choice
                      key={value}
                      value={value}
                      description={description}
                    >
                      {label}
                    </Choices.Choice>
                  ))}
                </Choices.Root>
              </Stack>
            </Box>
            <Pane.Root name={copy.summary} testId="summary">
              <Pane.Head>
                <Stack>
                  <Eyebrow>{copy.summary}</Eyebrow>
                  <Button variant="plain">{copy.name}</Button>
                </Stack>
              </Pane.Head>
              <Pane.Body ariaLabel={copy.summary}>
                <P>{copy.facts}</P>
                {longer &&
                  Array.from({ length: 6 }, (_, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: repeated fixture copy
                    <P key={index}>{copy.extra}</P>
                  ))}
              </Pane.Body>
            </Pane.Root>
          </Stack>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Console>
  );
};

/** Case 3: a content-height profile as Screen's sole content. */
const ProfileOnlyFixture: FunctionComponent<{
  translated: boolean;
  withHeading: boolean;
  notes: number;
}> = ({ translated, withHeading, notes }) => {
  const [isGerman, translate$] = useToggle(translated);
  const copy = isGerman ? german : english;
  const title = (
    <Stack>
      <Eyebrow>{copy.profile}</Eyebrow>
      <H1>Neon Harbour</H1>
    </Stack>
  );
  return (
    <Console
      copy={copy}
      active={1}
      translate$={translate$}
      heading={withHeading ? title : undefined}
    >
      <Stack testId="profile">
        <Button variant="ghost">{copy.back}</Button>
        {!withHeading && title}
        <DefinitionList.Root>
          <DefinitionList.Item>
            <DefinitionList.Term>{copy.kind}</DefinitionList.Term>
            <DefinitionList.Description>{copy.band}</DefinitionList.Description>
          </DefinitionList.Item>
          <DefinitionList.Item>
            <DefinitionList.Term>{copy.genre}</DefinitionList.Term>
            <DefinitionList.Description>
              {copy.genreValue}
            </DefinitionList.Description>
          </DefinitionList.Item>
          <DefinitionList.Item>
            <DefinitionList.Term>{copy.popularity}</DefinitionList.Term>
            <DefinitionList.Description>72</DefinitionList.Description>
          </DefinitionList.Item>
          <DefinitionList.Item>
            <DefinitionList.Term>{copy.members}</DefinitionList.Term>
            <DefinitionList.Description>
              <Cluster>
                {Array.from({ length: 5 }, (_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: members are identified by their place
                  <Button key={index} variant="plain">
                    {copy.name} {index + 1}
                  </Button>
                ))}
              </Cluster>
            </DefinitionList.Description>
          </DefinitionList.Item>
        </DefinitionList.Root>
        {Array.from({ length: notes }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: repeated fixture copy
          <P key={index}>{copy.extra}</P>
        ))}
        <Cluster>
          <Button testId="negotiate">{copy.negotiate}</Button>
        </Cluster>
      </Stack>
    </Console>
  );
};

/** Case 3: an unbounded compact Table as Screen's sole content, with or without a heading. */
const TableOnlyFixture: FunctionComponent<{
  translated: boolean;
  withHeading?: boolean;
  rows: number;
}> = ({ translated, withHeading = true, rows }) => {
  const [isGerman, translate$] = useToggle(translated);
  const copy = isGerman ? german : english;
  return (
    <Console
      copy={copy}
      active={3}
      translate$={translate$}
      heading={
        withHeading ? (
          <Stack direction="split">
            <Stack>
              <Eyebrow>{copy.markets}</Eyebrow>
              <H1>{copy.research}</H1>
            </Stack>
            <Stack>
              <Eyebrow>{copy.focus}</Eyebrow>
              <P>{copy.focusStatus}</P>
            </Stack>
          </Stack>
        ) : undefined
      }
    >
      <Table.Root
        caption={copy.markets}
        density="compact"
        columns={[{ weight: 2 }, { weight: 1 }, { weight: 2 }, { weight: 1 }]}
        testId="markets"
      >
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell scope="col">{copy.market}</Table.HeaderCell>
            <Table.HeaderCell scope="col">{copy.population}</Table.HeaderCell>
            <Table.HeaderCell scope="col">{copy.knowledge}</Table.HeaderCell>
            <Table.HeaderCell scope="col">{copy.focus}</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {Array.from({ length: rows }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: markets are identified by their place
            <Table.Row key={index}>
              <Table.HeaderCell scope="row">
                <Button variant="plain">
                  {copy.market} {index + 1}
                </Button>
              </Table.HeaderCell>
              <Table.Cell>{(index + 2) * 3} M</Table.Cell>
              <Table.Cell>
                <Meter
                  label={copy.knowledge}
                  value={(index * 17) % 100}
                  max={100}
                />
              </Table.Cell>
              <Table.Cell>
                <Button variant="secondary">{copy.setFocus}</Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Console>
  );
};

/** Case 4: a content-height column beside a bounded Pane, or beside a content-height result. */
const ContentColumnsFixture: FunctionComponent<{ translated: boolean }> = ({
  translated,
}) => {
  const [isGerman, translate$] = useToggle(translated);
  const [ended, end$] = useToggle(false);
  const [longer, longer$] = useToggle(false);
  const copy = isGerman ? german : english;
  return (
    <Console
      copy={copy}
      active={2}
      translate$={translate$}
      actions={
        <Cluster>
          <Button variant="plain" onClick$={end$}>
            {copy.end}
          </Button>
          <Button variant="plain" onClick$={longer$}>
            {copy.longer}
          </Button>
        </Cluster>
      }
    >
      <ColumnLayout.Root fill>
        <ColumnLayout.Column weight={1} minWidth="--support-minimum">
          <Stack testId="facts">
            <Button variant="ghost">{copy.back}</Button>
            <H1>{copy.name}</H1>
            <P>{copy.role}</P>
            <P>{copy.facts}</P>
            {longer &&
              Array.from({ length: 10 }, (_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: repeated fixture copy
                <P key={index}>{copy.extra}</P>
              ))}
            <Cluster>
              <Button variant="secondary">{copy.negotiate}</Button>
            </Cluster>
          </Stack>
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth="--support-minimum">
          {ended ? (
            <Stack testId="result">
              <H2>{copy.signed}</H2>
              <P>{copy.signedLine}</P>
              <Cluster>
                <Button>{copy.returnTo}</Button>
              </Cluster>
            </Stack>
          ) : (
            <Pane.Root name={copy.history}>
              <Pane.Head testId="history-head">
                <H2>{copy.history}</H2>
              </Pane.Head>
              <Pane.Body
                ariaLabel={copy.history}
                scrollOwner="child"
                testId="history-body"
              >
                <Table.Root
                  bounded
                  caption={copy.history}
                  captionVisibility="hidden"
                >
                  <Table.Head>
                    <Table.Row>
                      <Table.HeaderCell scope="col">
                        {copy.song}
                      </Table.HeaderCell>
                      <Table.HeaderCell scope="col">
                        {copy.written}
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {Array.from({ length: 40 }, (_, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixture rows have no identity but their place
                      <Table.Row key={index}>
                        <Table.Cell>
                          <Button variant="plain">
                            {copy.song} {index + 1}
                          </Button>
                        </Table.Cell>
                        <Table.Cell>{1990 + index}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Pane.Body>
            </Pane.Root>
          )}
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Console>
  );
};

/** The column head over four lanes at 1920×1080, over four tabs at 1280×720. */
export const ContractDetail: Story = {
  render: () => <ContractDetailFixture translated={false} />,
};
export const ContractDetailGerman: Story = {
  render: () => <ContractDetailFixture translated />,
};
/** A content-height card above one bounded Pane with a delegated Table. */
export const HeadAbovePane: Story = {
  render: () => <HeadAbovePaneFixture translated={false} />,
};
export const HeadAbovePaneGerman: Story = {
  render: () => <HeadAbovePaneFixture translated />,
};
/** A Stack of a Box and an unsized summary Pane beside a bounded Pane. */
export const FocusColumn: Story = {
  render: () => <FocusColumnFixture translated={false} />,
};
export const FocusColumnGerman: Story = {
  render: () => <FocusColumnFixture translated />,
};
/** A content-height profile as the sole content, its title in the Stack. */
export const ProfileOnly: Story = {
  render: () => (
    <ProfileOnlyFixture translated={false} withHeading={false} notes={0} />
  ),
};
/** The same profile with its title in Screen's heading slot, in German. */
export const ProfileOnlyHeadingGerman: Story = {
  render: () => <ProfileOnlyFixture translated withHeading notes={0} />,
};
/** Fourteen added notes: taller than the reference windows, so the whole screen scrolls in the Shell body. */
export const ProfileOnlyOverflowing: Story = {
  render: () => (
    <ProfileOnlyFixture translated={false} withHeading notes={14} />
  ),
};
/** A heading strip above five compact markets, no Pane. */
export const TableOnly: Story = {
  render: () => <TableOnlyFixture translated={false} rows={5} />,
};
export const TableOnlyGerman: Story = {
  render: () => <TableOnlyFixture translated rows={5} />,
};
/** The same markets with no Screen heading: the Table alone is Screen's content. */
export const TableOnlyWithoutHeading: Story = {
  render: () => (
    <TableOnlyFixture translated={false} withHeading={false} rows={5} />
  ),
};
/** Twenty markets and no heading: the Table alone scrolls in the Shell body. */
export const TableOnlyWithoutHeadingOverflowing: Story = {
  render: () => (
    <TableOnlyFixture translated={false} withHeading={false} rows={20} />
  ),
};
/** Twenty markets: the heading and the table scroll together in the Shell body. */
export const TableOnlyOverflowing: Story = {
  render: () => <TableOnlyFixture translated={false} rows={20} />,
};
/** A content-height column beside a bounded Pane; End swaps the Pane for a result block. */
export const ContentColumns: Story = {
  render: () => <ContentColumnsFixture translated={false} />,
};
export const ContentColumnsGerman: Story = {
  render: () => <ContentColumnsFixture translated />,
};
