import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Checklist,
  Cluster,
  Collection,
  ColumnLayout,
  DefinitionList,
  Eyebrow,
  H1,
  H2,
  H3,
  Header,
  Input,
  Meter,
  Note,
  P,
  Pane,
  Prose,
  Screen,
  Select,
  Shell,
  Sidebar,
  Slider,
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
  title: 'Layout/Screen Console Spacing',
  component: Screen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Screen's optional \`spacing="compact"\` selects the compact console spacing treatment: less vertical air around Screen's content and beneath its heading, and a smaller inset and smaller Head/Body/Foot gaps for every Pane inside it - beside a Sidebar, in ColumnLayout columns, under ColumnLayout.Alternatives and in filling Tabs alike. Omitted, or \`"comfortable"\`, renders exactly as before. Pane has no selector of its own: a Pane outside a compact Screen, a Pane in another Screen and a Pane in a Dialog keep the default treatment.

The treatment changes only those enclosure positions. The horizontal gutter, typography, control dimensions, focus rings, Shell, Sidebar and Tabs, and every descendant's own spacing - Stack, Box, fields, Checklist, DefinitionList and Table densities - are unchanged. Pane bodies keep their scroll ownership and short bodies their content height, and Screen's whole-content fallback still releases the bounds when fixed content and a usable body no longer fit; with compact spacing that happens at a smaller height.

The compact positions are three theme tokens: \`--space-screen-region-compact\` (Screen's vertical padding and heading gap, default 0.5em), \`--space-pane-inset-compact\` (default 0.5em) and \`--space-pane-slot-compact\` (default 0.25em). Re-pointing them leaves \`--space-region\`, \`--space-box-inset\` and \`--space-stack\` untouched for everything else. Screen's padding and heading gap and Pane's inset never fall below the focus ring's room, whatever the theme sets.

Switch the treatment with *Compact spacing* in the bar: mounted controls, focus, typed values and the selected tab survive the change. The two fixtures below are **representative reconstructions** of two reported consumer compositions (Release planning and Employment Negotiation from issue #158), with this library's components and invented wording of similar length. They are not the application's screens and do not establish that an application fits; \`scripts/browser/console-spacing.mjs\` records their default and compact geometry at 1280×720 and 1920×1080 in English and German.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
type Spacing = 'comfortable' | 'compact';

const SpacingSwitch: FunctionComponent<{
  spacing: Spacing;
  onChange: (spacing: Spacing) => void;
}> = ({ spacing, onChange }) => (
  <button
    type="button"
    aria-pressed={spacing === 'compact'}
    onClick={() => onChange(spacing === 'compact' ? 'comfortable' : 'compact')}
  >
    Compact spacing
  </button>
);

// Consumer theme: 24rem work areas and a 1:1 fact allocation, as the Release planning report.
const planningTheme = {
  '--planning-area-min-width': '24rem',
  '--planning-term-min-width': '9rem',
  '--planning-description-min-width': '9rem',
} as CSSProperties;

const planningCopy = {
  en: {
    workspace: 'Label workspace',
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
    back: 'Back to releases',
    heading: 'Release planning',
    areas: 'Work areas',
    pool: 'Recording pool',
    poolCount: (count: number) => `${count} recordings available`,
    poolList: 'Available recordings',
    title: (index: number) => `Midnight Avenue (take ${index})`,
    position: (index: number, count: number) =>
      `Recording ${index} of ${count}`,
    facts: [
      ['Song quality', 'Very good (82)'],
      ['Recording quality', 'Good (71)'],
      ['Length', '3:42'],
      ['Genre', 'Synth pop'],
      ['Producer', 'Ana Carter'],
      ['Completed', 'Week 14, 1984'],
      ['Cover', 'Original'],
    ],
    place: (side: string) => `Place on Side ${side}`,
    sides: 'Sides',
    medium: 'Medium',
    media: ['12-inch LP', '7-inch single'],
    choose: 'Choose a medium',
    mediumFacts: 'Two sides, up to 22:00 each',
    sideTime: (side: string) => `Side ${side}: 14:05 of 22:00`,
    sideLabel: (side: string) => `Side ${side} running time`,
    album: 'Album total: 28:10 of 44:00',
    albumLabel: 'Album running time',
    placed: 'Placed recordings',
    placedRow: (index: number) => `Side A, track ${index}: Night Shift`,
    release: 'Release',
    releaseTitle: 'Release title',
    hint: 'Shown on the cover and in every chart entry.',
    rulesHeading: 'Rules',
    rulesList: 'Release rules',
    rules: [
      'Every side holds at least one recording.',
      'No side runs longer than its medium allows.',
      'The album keeps within the total running time.',
      'Each recording is placed only once.',
      'The release has a title.',
      'At least one single candidate is placed on Side A.',
    ],
    rulesNote: 'Rules are checked again when you complete the release.',
    met: '4 of 6 rules met',
    complete: 'Complete release',
  },
  de: {
    workspace: 'Arbeitsbereich des Labels',
    body: 'Arbeitsbereich',
    sections: 'Bereiche',
    entries: [
      'Veröffentlichungen',
      'Aufnahmen',
      'Künstler',
      'Verträge',
      'Tantiemen',
      'Einstellungen',
    ],
    back: 'Zurück zu den Veröffentlichungen',
    heading: 'Veröffentlichungsplanung',
    areas: 'Arbeitsbereiche',
    pool: 'Aufnahmepool',
    poolCount: (count: number) => `${count} Aufnahmen verfügbar`,
    poolList: 'Verfügbare Aufnahmen',
    title: (index: number) => `Midnight Avenue (Aufnahme ${index})`,
    position: (index: number, count: number) =>
      `Aufnahme ${index} von ${count}`,
    facts: [
      ['Songqualität', 'Sehr gut (82)'],
      ['Aufnahmequalität', 'Gut (71)'],
      ['Länge', '3:42'],
      ['Genre', 'Synthiepop'],
      ['Produzentin', 'Ana Carter'],
      ['Fertiggestellt', 'Woche 14, 1984'],
      ['Cover', 'Original'],
    ],
    place: (side: string) => `Auf Seite ${side} platzieren`,
    sides: 'Seiten',
    medium: 'Tonträger',
    media: ['Langspielplatte (30 cm)', 'Single (17 cm)'],
    choose: 'Tonträger auswählen',
    mediumFacts: 'Zwei Seiten, jeweils bis zu 22:00',
    sideTime: (side: string) => `Seite ${side}: 14:05 von 22:00`,
    sideLabel: (side: string) => `Laufzeit der Seite ${side}`,
    album: 'Album gesamt: 28:10 von 44:00',
    albumLabel: 'Laufzeit des Albums',
    placed: 'Platzierte Aufnahmen',
    placedRow: (index: number) => `Seite A, Titel ${index}: Night Shift`,
    release: 'Veröffentlichung',
    releaseTitle: 'Titel der Veröffentlichung',
    hint: 'Erscheint auf dem Cover und in jedem Charteintrag.',
    rulesHeading: 'Regeln',
    rulesList: 'Veröffentlichungsregeln',
    rules: [
      'Jede Seite enthält mindestens eine Aufnahme.',
      'Keine Seite ist länger, als ihr Tonträger erlaubt.',
      'Das Album bleibt innerhalb der Gesamtlaufzeit.',
      'Jede Aufnahme ist nur einmal platziert.',
      'Die Veröffentlichung hat einen Titel.',
      'Mindestens ein Singlekandidat liegt auf Seite A.',
    ],
    rulesNote:
      'Die Regeln werden beim Abschließen der Veröffentlichung erneut geprüft.',
    met: '4 von 6 Regeln erfüllt',
    complete: 'Veröffentlichung abschließen',
  },
};

const ReleasePlanning: FunctionComponent<{
  language?: 'en' | 'de';
  spacing?: Spacing;
}> = ({ language = 'en', spacing: initialSpacing = 'comfortable' }) => {
  const copy = planningCopy[language];
  const [spacing, setSpacing] = useState<Spacing>(initialSpacing);
  const [active, setActive] = useState('pool');
  const [channels] = useState(() => ({
    select$: new Subject<string>(),
    navigate$: new Subject<string>(),
    medium$: new Subject<string>(),
    title$: new Subject<string>(),
  }));
  useEffect(() => {
    const subscription = channels.select$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [channels]);
  const count = 12;
  const entries = Array.from({ length: count }, (_, index) => index + 1);
  const pool = (
    <Pane.Root name={copy.pool}>
      <Pane.Head testId="pool-head">
        <Stack>
          <H2>{copy.pool}</H2>
          <Note>{copy.poolCount(count)}</Note>
        </Stack>
      </Pane.Head>
      <Pane.Body ariaLabel={copy.poolList} testId="pool-body">
        <Collection.Root>
          {entries.map((index) => (
            <Collection.Item key={index}>
              <Stack>
                <P>{copy.title(index)}</P>
                <P>{copy.position(index, count)}</P>
                <DefinitionList.Root
                  density="compact"
                  termColumn={{
                    weight: 1,
                    minWidth: '--planning-term-min-width',
                  }}
                  descriptionColumn={{
                    weight: 1,
                    minWidth: '--planning-description-min-width',
                  }}
                >
                  {copy.facts.map(([term, description]) => (
                    <DefinitionList.Item key={term}>
                      <DefinitionList.Term>{term}</DefinitionList.Term>
                      <DefinitionList.Description>
                        {description}
                      </DefinitionList.Description>
                    </DefinitionList.Item>
                  ))}
                </DefinitionList.Root>
                <Cluster>
                  <Button variant="secondary">{copy.place('A')}</Button>
                  <Button variant="secondary">{copy.place('B')}</Button>
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
          <H3>{copy.medium}</H3>
          <Select.Root
            label={copy.medium}
            name="medium"
            placeholder={copy.choose}
            defaultValue="lp"
            onChange$={channels.medium$}
          >
            <Select.Option value="lp">{copy.media[0] ?? ''}</Select.Option>
            <Select.Option value="single">{copy.media[1] ?? ''}</Select.Option>
          </Select.Root>
          <P>{copy.mediumFacts}</P>
          {['A', 'B'].map((side) => (
            <Stack key={side}>
              <Note>{copy.sideTime(side)}</Note>
              <Meter
                label={copy.sideLabel(side)}
                value={14}
                max={22}
                valueText="14:05 / 22:00"
              />
            </Stack>
          ))}
          <Note>{copy.album}</Note>
          <Meter
            label={copy.albumLabel}
            value={28}
            max={44}
            valueText="28:10 / 44:00"
          />
        </Stack>
      </Pane.Head>
      <Pane.Body ariaLabel={copy.placed} testId="sides-body">
        <Stack>
          {entries.map((index) => (
            <P key={index}>{copy.placedRow(index)}</P>
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
            label={copy.releaseTitle}
            name="title"
            hint={copy.hint}
            defaultValue="Night Drive"
            onInput$={channels.title$}
          />
        </Stack>
      </Pane.Head>
      <Pane.Body ariaLabel={copy.rulesList} testId="release-body">
        <Stack>
          <H3>{copy.rulesHeading}</H3>
          <Checklist.Root>
            {copy.rules.map((rule) => (
              <Checklist.Item key={rule}>{rule}</Checklist.Item>
            ))}
          </Checklist.Root>
          <Note>{copy.rulesNote}</Note>
        </Stack>
      </Pane.Body>
      <Pane.Foot testId="release-foot">
        <Cluster justify="between">
          <P>{copy.met}</P>
          <Button>{copy.complete}</Button>
        </Cluster>
      </Pane.Foot>
    </Pane.Root>
  );
  const column = (key: string, children: ReactNode) => (
    <ColumnLayout.Column
      key={key}
      weight={1}
      minWidth="--planning-area-min-width"
    >
      {children}
    </ColumnLayout.Column>
  );
  return (
    <div style={planningTheme}>
      <Shell
        testId="shell"
        ariaLabel={copy.body}
        bar={
          <Header
            status={copy.workspace}
            action={<SpacingSwitch spacing={spacing} onChange={setSpacing} />}
          />
        }
      >
        <Sidebar.Root
          fill
          active="releases"
          label={copy.sections}
          onSelect$={channels.navigate$}
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
            <Screen
              spacing={spacing}
              heading={
                <Cluster>
                  <Button variant="ghost">{copy.back}</Button>
                  <H1>{copy.heading}</H1>
                </Cluster>
              }
            >
              <ColumnLayout.Alternatives fill>
                <ColumnLayout.Root fill testId="three-areas">
                  {column('pool', pool)}
                  {column('sides', sides)}
                  {column('release', release)}
                </ColumnLayout.Root>
                <ColumnLayout.Root fill testId="grouped-areas">
                  {column(
                    'group',
                    <Tabs.Root
                      fill
                      active={active}
                      onSelect$={channels.select$}
                      label={copy.areas}
                    >
                      <Tabs.List>
                        <Tabs.Tab value="pool">{copy.pool}</Tabs.Tab>
                        <Tabs.Tab value="release">{copy.release}</Tabs.Tab>
                      </Tabs.List>
                      <Tabs.Panel value="pool">{pool}</Tabs.Panel>
                      <Tabs.Panel value="release">{release}</Tabs.Panel>
                    </Tabs.Root>,
                  )}
                  {column('sides', sides)}
                </ColumnLayout.Root>
              </ColumnLayout.Alternatives>
            </Screen>
          </Sidebar.Content>
        </Sidebar.Root>
      </Shell>
    </div>
  );
};

const negotiationTheme = {
  '--negotiation-column-min-width': '20rem',
} as CSSProperties;

const negotiationCopy = {
  en: {
    workspace: 'Label workspace',
    body: 'Negotiation',
    heading: 'Employment negotiation with Ana Carter',
    consequence: 'Leaving ends this negotiation for the rest of the year.',
    leave: 'Leave',
    candidate: 'Candidate',
    facts: [
      'Songwriter, 7 years of experience',
      'Current employer: none',
      'Expects a long-term commitment',
      'Patience: running low after two rounds',
    ],
    offer: 'The offer',
    askLabel: 'Latest ask',
    ask: '$1,450 per week',
    yoursLabel: 'Your offer',
    yours: '$1,200 per week',
    salary: 'Weekly salary',
    terms: 'Offer terms',
    gap: 'You are $250 below the latest ask.',
    risk: 'Another offer this low may end the negotiation.',
    commitment:
      'Presenting commits this salary for the whole contract period if accepted.',
    cancellation:
      'Accepting cancels the commission currently running with this writer.',
    present: 'Present Offer',
    round: 'Round 2',
  },
  de: {
    workspace: 'Arbeitsbereich des Labels',
    body: 'Verhandlung',
    heading: 'Anstellungsverhandlung mit Ana Carter',
    consequence:
      'Wenn Sie die Verhandlung verlassen, endet sie für den Rest des Jahres.',
    leave: 'Verlassen',
    candidate: 'Kandidatin',
    facts: [
      'Songschreiberin, 7 Jahre Erfahrung',
      'Aktueller Arbeitgeber: keiner',
      'Erwartet eine langfristige Bindung',
      'Geduld: nach zwei Runden knapp',
    ],
    offer: 'Das Angebot',
    askLabel: 'Letzte Forderung',
    ask: '1.450 $ pro Woche',
    yoursLabel: 'Ihr Angebot',
    yours: '1.200 $ pro Woche',
    salary: 'Wochengehalt',
    terms: 'Angebotsbedingungen',
    gap: 'Sie liegen 250 $ unter der letzten Forderung.',
    risk: 'Ein weiteres so niedriges Angebot kann die Verhandlung beenden.',
    commitment:
      'Mit dem Vorlegen verpflichten Sie sich bei Annahme für die gesamte Vertragslaufzeit auf dieses Gehalt.',
    cancellation:
      'Die Annahme storniert den Auftrag, der derzeit mit dieser Songschreiberin läuft.',
    present: 'Angebot vorlegen',
    round: 'Runde 2',
  },
};

const EmploymentNegotiation: FunctionComponent<{
  language?: 'en' | 'de';
  spacing?: Spacing;
}> = ({ language = 'en', spacing: initialSpacing = 'comfortable' }) => {
  const copy = negotiationCopy[language];
  const [spacing, setSpacing] = useState<Spacing>(initialSpacing);
  const [salary$] = useState(() => new Subject<number>());
  return (
    <div style={negotiationTheme}>
      <Shell
        testId="shell"
        ariaLabel={copy.body}
        bar={
          <Header
            status={copy.workspace}
            action={<SpacingSwitch spacing={spacing} onChange={setSpacing} />}
          />
        }
      >
        <Screen
          spacing={spacing}
          heading={
            <Cluster justify="between">
              <H1>{copy.heading}</H1>
              <Cluster gap="stack">
                <P>{copy.consequence}</P>
                <Button variant="ghost">{copy.leave}</Button>
              </Cluster>
            </Cluster>
          }
        >
          <ColumnLayout.Root fill>
            <ColumnLayout.Column
              weight={1}
              minWidth="--negotiation-column-min-width"
            >
              <Pane.Root name={copy.candidate}>
                <Pane.Head>
                  <H2>{copy.candidate}</H2>
                </Pane.Head>
                <Pane.Body ariaLabel={copy.candidate}>
                  <Stack>
                    {copy.facts.map((fact) => (
                      <P key={fact}>{fact}</P>
                    ))}
                  </Stack>
                </Pane.Body>
              </Pane.Root>
            </ColumnLayout.Column>
            <ColumnLayout.Column
              weight={1}
              minWidth="--negotiation-column-min-width"
            >
              <Pane.Root name={copy.offer}>
                <Pane.Head testId="offer-head">
                  <Stack>
                    <H2>{copy.offer}</H2>
                    <Stack direction="split">
                      <Stack>
                        <Eyebrow>{copy.askLabel}</Eyebrow>
                        <Prose.Lede>{copy.ask}</Prose.Lede>
                      </Stack>
                      <Stack>
                        <Eyebrow>{copy.yoursLabel}</Eyebrow>
                        <Prose.Lede>{copy.yours}</Prose.Lede>
                      </Stack>
                    </Stack>
                  </Stack>
                </Pane.Head>
                <Pane.Body ariaLabel={copy.terms} testId="offer-body">
                  <Stack>
                    <Slider
                      label={copy.salary}
                      min={800}
                      max={2000}
                      step={10}
                      value={1200}
                      onInput$={salary$}
                    />
                    <P>{copy.gap}</P>
                    <P>{copy.risk}</P>
                    <P>{copy.commitment}</P>
                    <P>{copy.cancellation}</P>
                  </Stack>
                </Pane.Body>
                <Pane.Foot testId="offer-foot">
                  <Cluster gap="stack">
                    <Button>{copy.present}</Button>
                    <Note>{copy.round}</Note>
                  </Cluster>
                </Pane.Foot>
              </Pane.Root>
            </ColumnLayout.Column>
          </ColumnLayout.Root>
        </Screen>
      </Shell>
    </div>
  );
};

/** Release planning (#311), representative: fact-heavy pool entries, the sides and a rules
 *  checklist with its pinned Complete action. */
export const ReleasePlanningEnglish: Story = {
  render: () => <ReleasePlanning />,
};
export const ReleasePlanningGerman: Story = {
  render: () => <ReleasePlanning language="de" />,
};
/** Employment Negotiation (#320), representative worst state: both optional lines present. */
export const EmploymentNegotiationEnglish: Story = {
  render: () => <EmploymentNegotiation />,
};
export const EmploymentNegotiationGerman: Story = {
  render: () => <EmploymentNegotiation language="de" />,
};
