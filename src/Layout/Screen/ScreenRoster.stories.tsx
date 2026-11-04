import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Cluster,
  ColumnLayout,
  H1,
  H2,
  Header,
  Input,
  Note,
  P,
  Pane,
  Screen,
  Shell,
  Sidebar,
  Stack,
  Table,
} from 'index';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { BehaviorSubject, map, Subject } from 'rxjs';

const meta: Meta<typeof Screen> = {
  title: 'Layout/Screen Roster',
  component: Screen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A representative roster/detail board composed entirely from public components. Screen omits its separate heading; the roster Pane.Head supplies the one visible H1, search and result count. Pane.Body delegates both scroll axes to a bounded Table, followed by pagination in Pane.Foot. The detail owns a separate scrolling body. Reading order is roster head, rows, pagination, then detail.

The example theme declares a 15rem roster minimum, 17rem maximum and 20rem detail minimum. Equal weights let the uncapped detail receive the remaining width. These are consumer choices, not library presets. ColumnLayout stacks by proportional minimum fit in its container; no 1280px viewport switch applies. Sidebar has its independent 64rem transition.

Shell (console) → Sidebar.Root fill → Sidebar.Content → Screen → ColumnLayout.Root fill → ColumnLayout.Column → Pane.Root passes finite height without application layout CSS. Screen owns gutter and region inset; Pane owns box inset and section gaps. Shell owns whole-content fallback scrolling. Keep each height-passing component direct, and keep the Shell bar short enough to leave usable body space.

Long tables keep headers, search/count and pagination visible while fixed regions plus one complete row with focus room fit. Otherwise Screen releases the entire board; short and empty bodies retain natural height. Arbitrary translated content, enlarged text and small windows can require fallback even at a reference size. The consumer owns filtering, selection, pagination and all wording. Use the bar controls while editing search or selecting a row to examine stable state; Heading moves the H1 to Screen's optional slot without replacing the board.

English and German exercise long data; Short and Empty cover natural table height, and WrappedRegions adds deliberately oversized fixed copy. scripts/browser/roster.mjs records actual reference geometry, keyboard access, state retention and all three prebuilt stylesheets. These fixtures establish library behavior, not the application's actual content/theme fit or multi-application validation.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

const theme = {
  '--roster-minimum': '15rem',
  '--roster-maximum': '17rem',
  '--roster-detail-minimum': '20rem',
} as CSSProperties;
const entries = Array.from({ length: 40 }, (_, index) => index + 1);

const RosterEntry = ({
  entry,
  selection$,
  german,
}: {
  entry: number;
  selection$: BehaviorSubject<number>;
  german: boolean;
}) => {
  const [activate$] = useState(() => new Subject<void>());
  const isSelected$ = useMemo(
    () => selection$.pipe(map((selected) => selected === entry)),
    [selection$, entry],
  );
  useEffect(() => {
    const subscription = activate$.subscribe(() => selection$.next(entry));
    return () => subscription.unsubscribe();
  }, [activate$, selection$, entry]);
  return (
    <Table.Row
      onClick$={activate$}
      isSelected$={isSelected$}
      testId={`entry-${entry}`}
    >
      <Table.Cell>Alex Morgan {entry}</Table.Cell>
      <Table.Cell>{german ? 'In Bearbeitung' : 'In progress'}</Table.Cell>
    </Table.Row>
  );
};

const Roster = ({
  translated = false,
  count = 40,
  wrapped = false,
}: {
  translated?: boolean;
  count?: number;
  wrapped?: boolean;
}) => {
  const [german, setGerman] = useState(translated);
  const [above, setAbove] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(1);
  const [selection$] = useState(() => new BehaviorSubject(1));
  const [search$] = useState(() => new Subject<string>());
  const [translate$] = useState(() => new Subject<void>());
  const [heading$] = useState(() => new Subject<void>());
  const [next$] = useState(() => new Subject<void>());
  const [previous$] = useState(() => new Subject<void>());
  const [navigate$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscriptions = [
      selection$.subscribe(setSelected),
      search$.subscribe(setQuery),
      translate$.subscribe(() => setGerman((value) => !value)),
      heading$.subscribe(() => setAbove((value) => !value)),
      next$.subscribe(() => setPage((value) => value + 1)),
      previous$.subscribe(() => setPage((value) => value - 1)),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  }, [selection$, search$, translate$, heading$, next$, previous$]);
  const visible = entries
    .slice(0, count)
    .map((entry) => entry + (page - 1) * 40)
    .filter((entry) =>
      `Alex Morgan ${entry}`.toLowerCase().includes(query.toLowerCase()),
    );
  const heading = <H1>{german ? 'Verzeichnis' : 'Roster'}</H1>;
  return (
    <div style={theme}>
      <Shell
        testId="shell"
        ariaLabel="Workspace body"
        bar={
          <Header
            status={
              german
                ? 'Arbeitsbereich für die Verwaltung der ausgewählten Einträge'
                : 'Roster workspace'
            }
            action={
              <Cluster>
                <Button variant="plain" onClick$={translate$}>
                  EN / DE
                </Button>
                <Button variant="plain" onClick$={heading$}>
                  Heading
                </Button>
              </Cluster>
            }
          />
        }
      >
        <Sidebar.Root
          fill
          active="roster"
          label={german ? 'Bereiche' : 'Sections'}
          onSelect$={navigate$}
        >
          <Sidebar.Item entryKey="roster">
            {german ? 'Verzeichnis' : 'Roster'}
          </Sidebar.Item>
          <Sidebar.Content>
            <Screen heading={above ? heading : undefined}>
              <ColumnLayout.Root fill>
                <ColumnLayout.Column
                  weight={1}
                  minWidth="--roster-minimum"
                  maxWidth="--roster-maximum"
                  testId="roster-column"
                >
                  <Pane.Root name="Roster panel">
                    <Pane.Head testId="list-head">
                      <Stack>
                        {!above && heading}
                        <Input
                          label={
                            german ? 'Einträge durchsuchen' : 'Search entries'
                          }
                          name="search"
                          onInput$={search$}
                          testId="search"
                        />
                        <Note>
                          {visible.length}{' '}
                          {german ? 'Einträge gefunden' : 'entries found'}
                        </Note>
                        {wrapped && (
                          <P>
                            Bitte überprüfen Sie vor der Auswahl sämtliche
                            Angaben und die ausführlichen Bearbeitungshinweise
                            zu den verfügbaren Einträgen.
                          </P>
                        )}
                      </Stack>
                    </Pane.Head>
                    <Pane.Body
                      ariaLabel="Roster rows"
                      scrollOwner="child"
                      testId="list-body"
                    >
                      <Table.Root
                        bounded
                        caption={
                          german ? 'Verfügbare Einträge' : 'Available entries'
                        }
                        columns={[{ weight: 2 }, { weight: 1 }]}
                        selectionTreatment="highlight"
                      >
                        <Table.Head>
                          <Table.Row>
                            <Table.HeaderCell scope="col">
                              {german ? 'Vollständiger Name' : 'Full name'}
                            </Table.HeaderCell>
                            <Table.HeaderCell scope="col">
                              {german ? 'Bearbeitungsstatus' : 'Status'}
                            </Table.HeaderCell>
                          </Table.Row>
                        </Table.Head>
                        <Table.Body>
                          {visible.map((entry) => (
                            <RosterEntry
                              key={entry}
                              entry={entry}
                              selection$={selection$}
                              german={german}
                            />
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Pane.Body>
                    <Pane.Foot testId="list-foot">
                      <Stack>
                        <Note>
                          {german ? 'Seite' : 'Page'} {page} / 2
                        </Note>
                        <Cluster>
                          <Button
                            variant="plain"
                            disabled={page === 1}
                            onClick$={previous$}
                          >
                            {german ? 'Vorherige Seite' : 'Previous page'}
                          </Button>
                          <Button
                            variant="plain"
                            disabled={page === 2}
                            onClick$={next$}
                            testId="next-page"
                          >
                            {german ? 'Nächste Seite' : 'Next page'}
                          </Button>
                        </Cluster>
                      </Stack>
                    </Pane.Foot>
                  </Pane.Root>
                </ColumnLayout.Column>
                <ColumnLayout.Column
                  weight={1}
                  minWidth="--roster-detail-minimum"
                  testId="detail-column"
                >
                  <Pane.Root name="Detail panel">
                    <Pane.Head testId="detail-head">
                      <H2>
                        {german ? 'Ausgewählter Eintrag' : 'Selected entry'}:
                        Alex Morgan {selected}
                      </H2>
                    </Pane.Head>
                    <Pane.Body ariaLabel="Entry details" testId="detail-body">
                      <Stack>
                        {entries.map((entry) => (
                          <P key={entry}>
                            {german
                              ? 'Ausführliche Informationen zum ausgewählten Eintrag mit vollständigen Angaben zur weiteren Bearbeitung.'
                              : 'Detailed information about the selected entry, retaining the complete facts and instructions for further processing.'}{' '}
                            {entry}
                          </P>
                        ))}
                        <Button variant="plain">
                          {german
                            ? 'Letzte Detailaktion'
                            : 'Final detail action'}
                        </Button>
                      </Stack>
                    </Pane.Body>
                  </Pane.Root>
                </ColumnLayout.Column>
              </ColumnLayout.Root>
            </Screen>
          </Sidebar.Content>
        </Sidebar.Root>
      </Shell>
    </div>
  );
};

export const English: Story = { render: () => <Roster /> };
export const German: Story = { render: () => <Roster translated /> };
export const Short: Story = { render: () => <Roster count={1} /> };
export const Empty: Story = { render: () => <Roster count={0} /> };
export const WrappedRegions: Story = {
  render: () => <Roster translated wrapped />,
};
