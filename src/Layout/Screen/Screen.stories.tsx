import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Cluster,
  ColumnLayout,
  Dialog,
  H1,
  H2,
  Header,
  Input,
  P,
  Pane,
  Screen,
  Shell,
  Sidebar,
  Stack,
  Stepper,
  Table,
  Tabs,
} from 'index';
import { type ReactNode, useEffect, useState } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';

const meta: Meta<typeof Screen> = {
  title: 'Layout/Screen',
  component: Screen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Screen is the active main inside a console Shell and Sidebar.Content. It replaces Section plus an unstyled main/heading Stack for bounded screens. Supply exactly one visible H1 and one height-accepting child. The optional heading slot places that H1 above the child. Omit heading (or pass undefined) when the H1 belongs inside a child Pane.Head: no separate heading wrapper, track or gap is rendered, while outer gutter and region inset remain. Other supplied ReactNode values, including null and empty fragments, retain their slot; they are not the omission API. Screen owns gutter inline, region inset and region gap; it adds no page-band join, scrollport or keyboard stop. Do not nest Screen inside another main or Pane.

The content receives the remaining allocation. If fixed content visibly overflows or a participating Pane/Table cannot retain a normal usable scrolling line, Screen releases it to natural height so the enclosing Shell can scroll. Screen measures its own wrappers and aggregates the private scroll-owner feasibility contract; children must propagate their visible overflow and support natural height when unsized. A child that clips its own fixed content conceals its need and cannot use this fallback. Fixed content must leave usable body room at the intended reference windows. Screen restores the allocation after resize or content changes; it preserves mounted children and never relocates focus. Bounded scroll offsets naturally clamp when the layout becomes unbounded.

ColumnLayout stacking="viewport" adds an exact 1280 CSS-pixel gate to the existing container-fit test. Default container behavior and Sidebar's independent 64rem policy are unchanged. Correspondence uses 18rem/20rem minima and 1:2 weights: its threshold is 54rem plus the gap, not 38rem. Browser zoom changes CSS viewport width; larger root text also changes rem minima. The fixtures exercise native frame dialogs, default body scrolling, delegated Table ownership, and real Tabs/Stepper anatomy. Run the retained scripts/check-screen.mjs against this Storybook for geometry and keyboard acceptance.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
const entries = Array.from({ length: 40 }, (_, index) => index + 1);
const Entries = ({ count }: { count: number }) => (
  <Stack>
    {entries.slice(0, count).map((entry) => (
      <Button key={entry}>Message {entry}</Button>
    ))}
  </Stack>
);
const Letter = ({ count }: { count: number }) => (
  <Stack>
    {entries.slice(0, count).map((entry) => (
      <P key={entry}>
        Agreement paragraph {entry}: the rights and obligations remain available
        for careful review.
      </P>
    ))}
  </Stack>
);
const LetterTable = ({ count }: { count: number }) => (
  <Table.Root bounded caption="Agreement rows" testId="table">
    <Table.Head>
      <Table.Row>
        <Table.HeaderCell scope="col">Entry</Table.HeaderCell>
        <Table.HeaderCell scope="col">Action</Table.HeaderCell>
      </Table.Row>
    </Table.Head>
    <Table.Body>
      {entries.slice(0, count).map((entry) => (
        <Table.Row key={entry}>
          <Table.Cell>Agreement {entry}</Table.Cell>
          <Table.Cell>
            <Button>Review {entry}</Button>
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table.Root>
);
const Panel = () => (
  <Pane.Root>
    <Pane.Head>
      <H2>Session choices</H2>
    </Pane.Head>
    <Pane.Body ariaLabel="Session choices" testId="panel-body">
      <Entries count={40} />
    </Pane.Body>
    <Pane.Foot>
      <Button>Save session</Button>
    </Pane.Foot>
  </Pane.Root>
);
const Views = ({ kind }: { kind: 'tabs' | 'stepper' }) => {
  const [active, setActive] = useState('first');
  const [active$] = useState(() => new BehaviorSubject('first'));
  const [select$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = select$.subscribe((value) => {
      setActive(value);
      active$.next(value);
    });
    return () => subscription.unsubscribe();
  }, [select$, active$]);
  return kind === 'tabs' ? (
    <Tabs.Root fill active={active} onSelect$={select$} label="Session views">
      <Tabs.List>
        <Tabs.Tab value="first">Choices</Tabs.Tab>
        <Tabs.Tab value="second">Confirmation</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="first">
        <Panel />
      </Tabs.Panel>
      <Tabs.Panel value="second">
        <Panel />
      </Tabs.Panel>
    </Tabs.Root>
  ) : (
    <Stepper.Root active$={active$} onSelect$={select$} label="Session booking">
      <Stepper.List>
        <Stepper.Step
          value="first"
          label="Choices"
          status="open"
          valueText="Select entries"
        />
        <Stepper.Step
          value="second"
          label="Confirmation"
          status="blocked"
          valueText="Review entries first"
        />
      </Stepper.List>
      <Stepper.Panel value="first">
        <Panel />
      </Stepper.Panel>
      <Stepper.Panel value="second">
        <Panel />
      </Stepper.Panel>
    </Stepper.Root>
  );
};
const Board = ({
  delegation = false,
  extent = 'screen',
  kind,
}: {
  delegation?: boolean;
  extent?: 'screen' | 'content';
  kind?: 'tabs' | 'stepper';
}) => {
  const [select$] = useState(() => new Subject<string>());
  const [visible$] = useState(() => new Subject<boolean>());
  const [open$] = useState(() => new Subject<void>());
  const [close$] = useState(() => new Subject<void>());
  const [translate$] = useState(() => new Subject<void>());
  const [content$] = useState(() => new Subject<void>());
  const [foot$] = useState(() => new Subject<void>());
  const [german, setGerman] = useState(false);
  const [count, setCount] = useState(40);
  const [foot, setFoot] = useState(true);
  useEffect(() => {
    const subscriptions = [
      open$.subscribe(() => visible$.next(true)),
      close$.subscribe(() => visible$.next(false)),
      translate$.subscribe(() => setGerman((value) => !value)),
      content$.subscribe(() =>
        setCount((value) => (value === 40 ? 1 : value === 1 ? 0 : 40)),
      ),
      foot$.subscribe(() => setFoot((value) => !value)),
    ];
    return () =>
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
  }, [open$, close$, visible$, translate$, content$, foot$]);
  const controls = (
    <Cluster>
      <Button onClick$={translate$}>Translate</Button>
      <Button onClick$={content$}>Content</Button>
      <Button onClick$={foot$}>Foot</Button>
    </Cluster>
  );
  const columns = (
    <ColumnLayout.Root fill stacking="viewport" testId="columns">
      <ColumnLayout.Column
        weight={1}
        minWidth="--screen-list-minimum"
        testId="list-column"
      >
        <Pane.Root testId="list-pane">
          <Pane.Head>
            <H2 testId="list-head">Available correspondence</H2>
          </Pane.Head>
          <Pane.Body ariaLabel="Correspondence" testId="list-body">
            <Entries count={count} />
          </Pane.Body>
        </Pane.Root>
      </ColumnLayout.Column>
      <ColumnLayout.Column
        weight={2}
        minWidth="--screen-letter-minimum"
        testId="letter-column"
      >
        <Pane.Root>
          <Pane.Head>
            <H2 testId="letter-head">Agreement details</H2>
          </Pane.Head>
          <Pane.Body
            ariaLabel="Letter"
            testId="letter-body"
            scrollOwner={delegation ? 'child' : 'body'}
          >
            {delegation ? (
              <LetterTable count={count} />
            ) : (
              <Letter count={count} />
            )}
          </Pane.Body>
          {foot && (
            <Pane.Foot testId="letter-foot">
              <Button onClick$={open$}>Review agreement</Button>
              <Button disabled>Awaiting the other party</Button>
            </Pane.Foot>
          )}
        </Pane.Root>
      </ColumnLayout.Column>
    </ColumnLayout.Root>
  );
  return (
    <Shell
      testId="shell"
      ariaLabel="Workspace body"
      modalScope="body"
      bar={
        <Header
          status={
            german
              ? 'Arbeitsbereich — Rechte, Zeitpläne und ausführliche Korrespondenz'
              : 'Workspace — rights, schedules and correspondence'
          }
          action={controls}
        />
      }
    >
      <style>{`:root { --screen-list-minimum: 18rem; --screen-letter-minimum: 20rem; }`}</style>
      <Sidebar.Root
        fill
        active="inbox"
        label="Workspace navigation"
        onSelect$={select$}
        testId="sidebar"
      >
        <Sidebar.Item entryKey="inbox">Correspondence</Sidebar.Item>
        <Sidebar.Item entryKey="roster">Roster and agreements</Sidebar.Item>
        <Sidebar.Content>
          <Screen
            heading={
              <H1 testId="heading">
                {kind
                  ? 'Recording session'
                  : german
                    ? 'Korrespondenz und ausstehende vertragliche Vereinbarungen'
                    : 'Correspondence and outstanding agreements'}
              </H1>
            }
          >
            {kind ? <Views kind={kind} /> : columns}
          </Screen>
        </Sidebar.Content>
      </Sidebar.Root>
      <Dialog.Root
        placement="frame"
        extent={extent}
        showDialog$={visible$}
        onDismiss$={close$}
      >
        <Dialog.Title>Review agreement</Dialog.Title>
        <Dialog.Description>
          All facts remain available before confirming.
        </Dialog.Description>
        <Dialog.Content>
          <P>Rights and payment terms remain unchanged.</P>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onClick$={close$}>Cancel review</Button>
          <Button onClick$={close$}>Confirm review</Button>
        </Dialog.Actions>
      </Dialog.Root>
    </Shell>
  );
};
export const Correspondence: Story = { render: () => <Board /> };
export const DelegatedTable: Story = { render: () => <Board delegation /> };
export const ContentDialog: Story = {
  render: () => <Board extent="content" />,
};
export const FillingTabs: Story = { render: () => <Board kind="tabs" /> };
export const BookingStepper: Story = { render: () => <Board kind="stepper" /> };
export const Unsized: Story = {
  render: () => (
    <Screen heading={<H1>Natural screen</H1>}>
      <Panel />
    </Screen>
  ),
};

const SmallColumns = ({
  viewport,
  children,
}: {
  viewport?: boolean;
  children?: ReactNode;
}) => (
  <ColumnLayout.Root
    fill
    stacking={viewport ? 'viewport' : 'container'}
    testId={viewport ? 'viewport' : 'container'}
  >
    <ColumnLayout.Column
      weight={1}
      minWidth="--small-minimum"
      maxWidth="--small-cap"
    >
      <P>First</P>
      {children}
    </ColumnLayout.Column>
    <ColumnLayout.Column weight={1} minWidth="--small-minimum">
      <P>Second</P>
    </ColumnLayout.Column>
  </ColumnLayout.Root>
);
/** Holder dimensions are test harness constraints; application fixtures above use only public layout. */
export const IndependentPolicies: Story = {
  render: () => (
    <>
      <style>{`:root { --small-minimum: 10rem; --small-cap: 12rem; }`}</style>
      <div style={{ height: '20rem', width: '40rem' }}>
        <SmallColumns viewport>
          <SmallColumns />
        </SmallColumns>
      </div>
      <div style={{ height: '20rem', width: '40rem' }}>
        <SmallColumns />
      </div>
      <div style={{ height: '20rem', width: '15rem' }}>
        <SmallColumns viewport />
      </div>
    </>
  ),
};

/** Isolated distributor harness: each scroll holder owns one independent Screen allocation. */
export const IndependentAllocations: Story = {
  render: () => (
    <div style={{ display: 'flex' }}>
      <div
        data-testid="short-holder"
        style={{ height: '12rem', width: '40rem', overflow: 'auto' }}
      >
        <Screen heading={<H1>First</H1>}>
          <Panel />
        </Screen>
      </div>
      <div
        data-testid="tall-holder"
        style={{ height: '45rem', width: '40rem', overflow: 'auto' }}
      >
        <Screen heading={<H1>Second</H1>}>
          <Panel />
        </Screen>
      </div>
    </div>
  ),
};

const MountedScreen = () => {
  const [mounted, setMounted] = useState(true);
  const [toggle$] = useState(() => new Subject<void>());
  useEffect(() => {
    const subscription = toggle$.subscribe(() => setMounted((value) => !value));
    return () => subscription.unsubscribe();
  }, [toggle$]);
  return (
    <Shell
      ariaLabel="Workspace body"
      testId="shell"
      bar={
        <Header
          status="Lifecycle fixture"
          action={<Button onClick$={toggle$}>Toggle screen</Button>}
        />
      }
    >
      {mounted ? (
        <Screen heading={<H1>Session</H1>}>
          <Panel />
        </Screen>
      ) : (
        <P>Screen unmounted</P>
      )}
    </Shell>
  );
};
export const MountLifecycle: Story = { render: () => <MountedScreen /> };

// Fixed before geometry validation; catalog provenance and the separate consumer gate are
// documented in this story. Keep the original Board translation as the oversized stress case.
const representativeCopy = {
  en: {
    status: 'Workspace — rights, schedules and correspondence',
    save: 'Save changes',
    navigation: 'Workspace navigation',
    list: 'All Messages',
    letter: 'Contract offer',
    sender: 'From Alex Morgan, Attorney at Law · 4 November 1950, 09:00',
    waiting: 'This Message needs a Response. It holds Game time.',
    accept: 'Accept offer',
    negotiate: 'Negotiate with this Artist',
    reason: 'Another negotiation is open.',
  },
  de: {
    status: 'Arbeitsbereich — Rechte, Zeitpläne und ausführliche Korrespondenz',
    save: 'Änderungen speichern',
    navigation: 'Arbeitsbereich-Navigation',
    list: 'Alle Nachrichten',
    letter: 'Vertragsangebot',
    sender: 'Von Alex Morgan, Rechtsanwalt · 4. November 1950, 09:00',
    waiting: 'Diese Nachricht braucht eine Antwort. Sie hält die Spielzeit an.',
    accept: 'Angebot annehmen',
    negotiate: 'Mit diesem Artist verhandeln',
    reason: 'Eine andere Verhandlung ist offen.',
  },
};
const Representative = ({ locale }: { locale: 'en' | 'de' }) => {
  const copy = representativeCopy[locale];
  const [select$] = useState(() => new Subject<string>());
  return (
    <Shell
      testId="shell"
      ariaLabel={copy.navigation}
      bar={
        <Header status={copy.status} action={<Button>{copy.save}</Button>} />
      }
    >
      <style>{`:root { --screen-list-minimum: 18rem; --screen-letter-minimum: 20rem; }`}</style>
      <Sidebar.Root
        fill
        active="messages"
        label={copy.navigation}
        onSelect$={select$}
      >
        <Sidebar.Item entryKey="messages">{copy.list}</Sidebar.Item>
        <Sidebar.Content>
          <Screen heading={<H1 testId="heading">Harbor Records</H1>}>
            <ColumnLayout.Root fill stacking="viewport" testId="columns">
              <ColumnLayout.Column
                weight={1}
                minWidth="--screen-list-minimum"
                testId="list-column"
              >
                <Pane.Root>
                  <Pane.Head>
                    <H2 testId="list-head">{copy.list}</H2>
                  </Pane.Head>
                  <Pane.Body ariaLabel={copy.list} testId="list-body">
                    <Entries count={40} />
                  </Pane.Body>
                </Pane.Root>
              </ColumnLayout.Column>
              <ColumnLayout.Column
                weight={2}
                minWidth="--screen-letter-minimum"
                testId="letter-column"
              >
                <Pane.Root>
                  <Pane.Head>
                    <H2 testId="letter-head">{copy.letter}</H2>
                    <P>{copy.sender}</P>
                  </Pane.Head>
                  <Pane.Body ariaLabel={copy.letter} testId="letter-body">
                    <Letter count={40} />
                  </Pane.Body>
                  <Pane.Foot testId="letter-foot">
                    <P>{copy.waiting}</P>
                    <Cluster>
                      <Button>{copy.accept}</Button>
                      <Button disabled>{copy.negotiate}</Button>
                    </Cluster>
                    <P>{copy.reason}</P>
                  </Pane.Foot>
                </Pane.Root>
              </ColumnLayout.Column>
            </ColumnLayout.Root>
          </Screen>
        </Sidebar.Content>
      </Sidebar.Root>
    </Shell>
  );
};
const representativeDescription = `Representative library reference-fit fixture, with fixed caller Label-name sample “Harbor Records” in both locales; this is not a maximum-name promise. List heading, waiting notice, negotiation label and disabled reason are verbatim from g-label-manager packages/translations/catalogs/{en,de}.json (hubFilterAll, hubResponseNeeded, hubMessageActionContractNegotiation, hubMessageActionNegotiationOpen). Sender text instantiates hubMessageFrom with Alex Morgan, the catalog Attorney at Law/Rechtsanwalt role and a fixed localized date/time. Contract offer/Vertragsangebot, Accept offer/Angebot annehmen, Save changes/Änderungen speichern and navigation/bar copy are representative library-authored role labels fixed before measurement. Long body content reuses the existing neutral library fixture. Actual Hub content, consumer theme, answer inventories and long player Label names remain a separate #236 gate. The Correspondence story's 277px German stress heading is unchanged and fallback-only.`;
export const RepresentativeEnglish: Story = {
  render: () => <Representative locale="en" />,
  parameters: { docs: { description: { story: representativeDescription } } },
};
export const RepresentativeGerman: Story = {
  render: () => <Representative locale="de" />,
  parameters: { docs: { description: { story: representativeDescription } } },
};

// Library-authored EN/DE copy and 15/17/20rem theme budgets fixed before measurements.
const rosterCopy = {
  en: {
    heading: 'Contracts',
    search: 'Search artists',
    count: '40 active contracts',
    artist: 'Artist',
    previous: 'Previous',
    next: 'Next',
    page: 'Page 1 of 4',
    detail: 'Recording agreement',
    status: 'Harbor Records — contracts',
    summary: 'Alex Morgan · Exclusive recording rights · 1950–1953',
    review: 'Review agreement',
    close: 'Cancel review',
    confirm: 'Confirm review',
    paragraph:
      'Recording rights, payment terms and delivery dates remain available for review.',
  },
  de: {
    heading: 'Verträge',
    search: 'Artists durchsuchen',
    count: '40 aktive Verträge',
    artist: 'Artist',
    previous: 'Zurück',
    next: 'Weiter',
    page: 'Seite 1 von 4',
    detail: 'Aufnahmevertrag',
    status: 'Harbor Records — Verträge',
    summary: 'Alex Morgan · Exklusive Aufnahmerechte · 1950–1953',
    review: 'Vertrag überprüfen',
    close: 'Prüfung abbrechen',
    confirm: 'Prüfung bestätigen',
    paragraph:
      'Aufnahmerechte, Zahlungsbedingungen und Liefertermine bleiben zur Prüfung verfügbar.',
  },
};
const RosterBoard = ({ locale }: { locale: 'en' | 'de' }) => {
  const [language, setLanguage] = useState(locale);
  const [separateHeading, setSeparateHeading] = useState(false);
  const [count, setCount] = useState(40);
  const [select$] = useState(() => new Subject<string>());
  const [translate$] = useState(() => new Subject<void>());
  const [heading$] = useState(() => new Subject<void>());
  const [content$] = useState(() => new Subject<void>());
  const [open$] = useState(() => new Subject<void>());
  const [close$] = useState(() => new Subject<void>());
  const [visible$] = useState(() => new Subject<boolean>());
  useEffect(() => {
    const subscriptions = [
      translate$.subscribe(() =>
        setLanguage((value) => (value === 'en' ? 'de' : 'en')),
      ),
      heading$.subscribe(() => setSeparateHeading((value) => !value)),
      content$.subscribe(() =>
        setCount((value) => (value === 40 ? 1 : value === 1 ? 0 : 40)),
      ),
      open$.subscribe(() => visible$.next(true)),
      close$.subscribe(() => visible$.next(false)),
    ];
    return () =>
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
  }, [translate$, heading$, content$, open$, close$, visible$]);
  const copy = rosterCopy[language];
  return (
    <Shell
      mode="console"
      modalScope="body"
      ariaLabel={copy.heading}
      testId="shell"
      bar={
        <Header
          status={copy.status}
          action={
            <Cluster>
              <Button onClick$={translate$}>Translate</Button>
              <Button onClick$={heading$}>Heading</Button>
              <Button onClick$={content$}>Content</Button>
            </Cluster>
          }
        />
      }
    >
      <Sidebar.Root
        fill
        active="contracts"
        label={copy.heading}
        onSelect$={select$}
      >
        <Sidebar.Item entryKey="contracts">{copy.heading}</Sidebar.Item>
        <Sidebar.Content>
          <Screen
            heading={
              separateHeading ? (
                <H1 testId="separate-heading">{copy.heading}</H1>
              ) : undefined
            }
          >
            <ColumnLayout.Root fill stacking="viewport" testId="roster-columns">
              <ColumnLayout.Column
                weight={1}
                minWidth="--screen-roster-minimum"
                maxWidth="--screen-roster-maximum"
                testId="roster-column"
              >
                <Pane.Root>
                  <Pane.Head testId="roster-head">
                    {separateHeading ? (
                      <H2>{copy.heading}</H2>
                    ) : (
                      <H1>{copy.heading}</H1>
                    )}
                    <Input
                      label={copy.search}
                      name="artist"
                      testId="roster-search"
                    />
                    <P testId="roster-count">{copy.count}</P>
                  </Pane.Head>
                  <Pane.Body
                    ariaLabel={copy.heading}
                    scrollOwner="child"
                    testId="roster-body"
                  >
                    <Table.Root
                      bounded
                      caption={copy.heading}
                      captionVisibility="hidden"
                      testId="roster-table"
                    >
                      <Table.Head>
                        <Table.Row>
                          <Table.HeaderCell scope="col">
                            {copy.artist}
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Head>
                      <Table.Body>
                        {entries.slice(0, count).map((entry) => (
                          <Table.Row key={entry}>
                            <Table.Cell>
                              <Button>Alex Morgan {entry}</Button>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Pane.Body>
                  <Pane.Foot testId="roster-foot">
                    <P>{copy.page}</P>
                    <Cluster>
                      <Button variant="ghost" disabled>
                        {copy.previous}
                      </Button>
                      <Button variant="ghost">{copy.next}</Button>
                    </Cluster>
                  </Pane.Foot>
                </Pane.Root>
              </ColumnLayout.Column>
              <ColumnLayout.Column
                weight={1}
                minWidth="--screen-detail-minimum"
                testId="detail-column"
              >
                <Pane.Root>
                  <Pane.Head testId="detail-head">
                    <H2>{copy.detail}</H2>
                    <P>{copy.summary}</P>
                  </Pane.Head>
                  <Pane.Body ariaLabel={copy.detail} testId="detail-body">
                    <Stack>
                      {entries.map((entry) => (
                        <P key={entry}>
                          {entry}. {copy.paragraph}
                        </P>
                      ))}
                      <Button testId="detail-last">{copy.review}</Button>
                    </Stack>
                  </Pane.Body>
                  <Pane.Foot testId="detail-foot">
                    <Button onClick$={open$}>{copy.review}</Button>
                  </Pane.Foot>
                </Pane.Root>
              </ColumnLayout.Column>
            </ColumnLayout.Root>
          </Screen>
        </Sidebar.Content>
      </Sidebar.Root>
      <Dialog.Root
        placement="frame"
        extent="screen"
        showDialog$={visible$}
        onDismiss$={close$}
      >
        <Dialog.Title>{copy.review}</Dialog.Title>
        <Dialog.Description>{copy.summary}</Dialog.Description>
        <Dialog.Content>
          <P>{copy.paragraph}</P>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onClick$={close$}>{copy.close}</Button>
          <Button onClick$={close$}>{copy.confirm}</Button>
        </Dialog.Actions>
      </Dialog.Root>
    </Shell>
  );
};
const rosterDescription = `Public child-only composition: Shell(console) → Sidebar.Root(fill).Content → Screen → ColumnLayout.Root(fill, stacking="viewport") → sibling Panes. The only visible H1 belongs inside Roster Pane.Head, aligned with detail Head. Search/count, bounded Table and pagination are real public components; pagination uses ghost buttons for secondary navigation, keeping the full labels without the primary-action minimum width; the detail body owns independent scrolling. Named Storybook theme roles provide roster minimum 15rem, maximum 17rem and detail minimum 20rem, with equal weights. All EN/DE text is representative library-authored copy fixed before geometry measurement, not consumer catalog or game acceptance. No consumer styling or offsets. Heading toggles insertion/removal without replacing the child; Translate and Content exercise locale and empty/short/long data. Short viewports and oversized fixed content must release to Shell scrolling, then restore when space returns. Reference fit only applies to this content/theme budget; actual #305 integration requires a reviewed published release and game validation.`;
export const RosterEnglish: Story = {
  render: () => <RosterBoard locale="en" />,
  parameters: { docs: { description: { story: rosterDescription } } },
};
export const RosterGerman: Story = {
  render: () => <RosterBoard locale="de" />,
  parameters: { docs: { description: { story: rosterDescription } } },
};
