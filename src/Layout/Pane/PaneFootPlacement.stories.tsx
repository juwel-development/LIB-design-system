import type { IPaneFootProps } from 'Layout/Pane/Pane';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Checklist,
  Cluster,
  Collection,
  ColumnLayout,
  H1,
  H2,
  H3,
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
import { expect, within } from 'storybook/test';

const meta: Meta<typeof Pane.Foot> = {
  title: 'Layout/Pane Foot Placement',
  component: Pane.Foot,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `\`Pane.Foot placement="bottom"\` keeps a bounded pane's foot at the pane's physical inner bottom even when the body is short, so a final task action can sit in the inner bottom-right corner. Omitted, or \`"after-body"\`, keeps the default: short body content keeps its height, the foot follows it, and spare height stays in the root below the foot.

With \`"bottom"\` the spare height moves above the foot. The body keeps its content height: a short body gains no overflow, no named group and no keyboard stop. An overflowing body scrolls exactly as before - the default body as the one named scroll owner, or with \`scrollOwner="child"\` the child (a ScrollContainer, a bounded Table with its pinned header) - while Head and Foot stay in view. Placement does not change scroll ownership, the foot's horizontal arrangement or the theme's inset, gaps and focus-ring room, and it works under comfortable and compact Screen spacing alike.

Precedence: placement only distributes spare height. An unsized or stacked pane grows with its content and the foot follows the body. When the fixed regions and a usable body no longer fit, Screen's whole-content fallback (and Dialog's whole-task fallback) take over unchanged: everything stays reachable in the enclosing scroll, and the bound and the bottom placement return with the room. Switching placement keeps every mounted node, focus, typed value and selection.

The placement positions the foot's box. For the action itself to meet the corner, compose the foot so the action is its lowest, last box - for example a \`Cluster justify="between"\` with a one-line heading and count group first and the Button last, as below. The consumer owns the foot's wording, grouping and action behavior.

The Release planning stories are a **representative reconstruction** of the Label Manager composition reported in issue #168 - Shell, Sidebar fill, Screen, ColumnLayout.Alternatives with three columns or filling Tabs beside the Sides - built from this library's components with that application's English and German wording. They are not the application's screen and do not establish that it fits; \`scripts/browser/foot-placement.mjs\` records their geometry at 1920×1080 and 1280×720, narrower widths and short heights.

Theme prerequisite: the holder applies that application's theme values - its 24rem work-area minimum, \`--space-region: 1rem\` and its type scale and families. The bottom edge does not depend on them: the action meets the inner bottom at both reference windows under every theme measured. The right edge does. With the library's default type scale the German foot no longer fits one line, its Cluster wraps and Complete starts the second line at the left (about 250-285px from the right edge). With that application's type scale, the foot fits in every measured family (Avenir Next/Georgia, Trebuchet MS/Times New Roman, generic sans-serif/serif). Whether the consumer's own screen fits is for the consumer to measure. Use *Foot at bottom* and *Compact spacing* in the bar to switch either treatment on the mounted screen.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
type Language = 'en' | 'de';
type Placement = NonNullable<IPaneFootProps['placement']>;
type Spacing = 'comfortable' | 'compact';

// The reporting consumer's theme (g-label-manager packages/theme/theme.css on feature/ticket-311):
// its 24rem work-area minimum, type and region space. With the default tokens the German foot
// needs 489px of a 488px foot at 1920x1080, so its Cluster wraps.
const planningTheme = {
  '--planning-area-min-width': '24rem',
  '--space-band': '1.5rem',
  '--space-region': '1rem',
  '--space-definition-item-compact': '0.25rem',
  '--font-heading': 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  '--font-body':
    '"Avenir Next", Futura, "Century Gothic", "Trebuchet MS", sans-serif',
  '--font-control':
    '"Avenir Next", Futura, "Century Gothic", "Trebuchet MS", sans-serif',
  '--text-display': 'clamp(2rem, 1.5rem + 1vw, 2.5rem)',
  '--leading-display': '1.15',
  '--text-title': 'clamp(1.5rem, 1.25rem + 0.5vw, 1.75rem)',
  '--leading-title': '1.2',
  '--text-subtitle': 'clamp(1.25rem, 1.125rem + 0.25vw, 1.375rem)',
} as CSSProperties;

const copy = {
  en: {
    workspace: 'Label workspace',
    body: 'Workspace body',
    sections: 'Game sections',
    entries: ['Hub', 'Contracts', 'Songs', 'A&R', 'Staff', 'Market Research'],
    back: 'Back to Ana Carter',
    heading: 'Plan Single 1.2 for Ana Carter',
    areas: 'Plan Single 1.2 for Ana Carter',
    pool: 'Eligible Recordings',
    poolCount: '3 Recordings',
    recordings: ['Night Shift', 'Midnight Avenue', 'Paper Moon'],
    quality: 'Song quality',
    place: (title: string, side: string) => `Place ${title} on Side ${side}`,
    sides: 'Sides',
    medium: 'Medium',
    media: ['7-inch single', '12-inch maxi single'],
    choose: 'Pick a Medium',
    side: (side: string) => `Side ${side}`,
    sideTime: (side: string) => `Side ${side}: 3:42 of 4:30 · 0:48 left`,
    sideLabel: (side: string) => `Running time of Side ${side}`,
    sideEmpty: 'No Recording placed.',
    remove: (title: string) => `Remove ${title}`,
    release: 'The Release',
    title: 'Release title',
    hint: "The game proposes the lead Song's name until you type your own.",
    rules: 'Rules',
    checks: [
      ['A Medium is picked', 'met'],
      ['Exactly two Recordings, the first the lead', 'met'],
      ['One Recording per Side, the lead on Side A', 'met'],
      ['Every Side within its capacity', 'met'],
      ['A title is given', 'not met'],
    ],
    note: 'A Complete Release is fixed for good: no change, and no Message is sent.',
    count: '4 of 5 rules met',
    complete: 'Complete the Release',
  },
  de: {
    workspace: 'Arbeitsbereich des Labels',
    body: 'Arbeitsbereich',
    sections: 'Spielbereiche',
    entries: ['Hub', 'Verträge', 'Songs', 'A&R', 'Personal', 'Marktforschung'],
    back: 'Zurück zu Ana Carter',
    heading: 'Single 1.2 für Ana Carter planen',
    areas: 'Single 1.2 für Ana Carter planen',
    pool: 'Geeignete Aufnahmen',
    poolCount: '3 Aufnahmen',
    recordings: ['Night Shift', 'Midnight Avenue', 'Paper Moon'],
    quality: 'Song-Qualität',
    place: (title: string, side: string) =>
      `${title} auf Seite ${side} platzieren`,
    sides: 'Seiten',
    medium: 'Medium',
    media: ['7-Zoll-Single', '12-Zoll-Maxisingle'],
    choose: 'Medium wählen',
    side: (side: string) => `Seite ${side}`,
    sideTime: (side: string) => `Seite ${side}: 3:42 von 4:30 · 0:48 frei`,
    sideLabel: (side: string) => `Laufzeit von Seite ${side}`,
    sideEmpty: 'Keine Aufnahme platziert.',
    remove: (title: string) => `${title} entfernen`,
    release: 'Das Release',
    title: 'Release-Titel',
    hint: 'Das Spiel schlägt den Namen des Lead-Songs vor, bis du deinen eigenen eingibst.',
    rules: 'Regeln',
    checks: [
      ['Ein Medium ist gewählt', 'erfüllt'],
      ['Genau zwei Aufnahmen, die erste als Lead', 'erfüllt'],
      ['Eine Aufnahme je Seite, der Lead auf Seite A', 'erfüllt'],
      ['Jede Seite innerhalb ihrer Kapazität', 'erfüllt'],
      ['Ein Titel ist vergeben', 'nicht erfüllt'],
    ],
    note: 'Ein fertiges Release ist endgültig festgelegt: keine Änderung, und es wird keine Nachricht gesendet.',
    count: '4 von 5 Regeln erfüllt',
    complete: 'Release abschließen',
  },
};

const PressedToggle: FunctionComponent<{
  isPressed: boolean;
  onToggle: () => void;
  children: string;
}> = ({ isPressed, onToggle, children }) => (
  <button type="button" aria-pressed={isPressed} onClick={onToggle}>
    {children}
  </button>
);

const ReleasePlanning: FunctionComponent<{
  language?: Language;
  placement?: Placement;
  spacing?: Spacing;
}> = ({
  language = 'en',
  placement: initialPlacement = 'bottom',
  spacing: initialSpacing = 'compact',
}) => {
  const text = copy[language];
  const [placement, setPlacement] = useState<Placement>(initialPlacement);
  const [spacing, setSpacing] = useState<Spacing>(initialSpacing);
  const [active, setActive] = useState('pool');
  const [channels] = useState(() => ({
    select$: new Subject<string>(),
    navigate$: new Subject<string>(),
    medium$: new Subject<string>(),
    title$: new Subject<string>(),
    complete$: new Subject<void>(),
  }));
  // Counted so the browser runner can prove one press emits exactly once.
  const [completions, setCompletions] = useState(0);
  useEffect(() => {
    const subscription = channels.select$.subscribe(setActive);
    subscription.add(
      channels.complete$.subscribe(() => setCompletions((count) => count + 1)),
    );
    return () => subscription.unsubscribe();
  }, [channels]);
  const [lead, second, third] = text.recordings;
  const pool = (
    <Pane.Root name={text.pool}>
      <Pane.Head>
        <H2>{text.pool}</H2>
        <Note color="muted">{text.poolCount}</Note>
      </Pane.Head>
      <Pane.Body ariaLabel={text.pool} testId="pool-body">
        <Collection.Root>
          {text.recordings.map((title) => (
            <Collection.Item key={title}>
              <Stack gap="stack">
                <Cluster gap="stack">
                  <P>{title}</P>
                  <P>3:42</P>
                  <P>{`${text.quality}: 82`}</P>
                </Cluster>
                <Cluster gap="stack">
                  <Button variant="secondary">{text.place(title, 'A')}</Button>
                  <Button variant="secondary">{text.place(title, 'B')}</Button>
                </Cluster>
              </Stack>
            </Collection.Item>
          ))}
        </Collection.Root>
      </Pane.Body>
    </Pane.Root>
  );
  const sides = (
    <Pane.Root name={text.sides}>
      <Pane.Head>
        <H2>{text.sides}</H2>
        <Select.Root
          label={text.medium}
          name="medium"
          placeholder={text.choose}
          defaultValue="single"
          onChange$={channels.medium$}
        >
          <Select.Option value="single">{text.media[0] ?? ''}</Select.Option>
          <Select.Option value="maxi">{text.media[1] ?? ''}</Select.Option>
        </Select.Root>
        {['A', 'B'].map((side) => (
          <Stack key={side} gap="stack" testId={`running-time-${side}`}>
            <Note color="muted">{text.sideTime(side)}</Note>
            <Meter
              label={text.sideLabel(side)}
              value={222}
              max={270}
              valueText={text.sideTime(side)}
            />
          </Stack>
        ))}
      </Pane.Head>
      <Pane.Body ariaLabel={text.sides} testId="sides-body">
        <Stack gap="region">
          {[
            ['A', lead],
            ['B', second],
          ].map(([side = '', title = '']) => (
            <Stack key={side} gap="stack">
              <H3>{text.side(side)}</H3>
              <Collection.Root>
                <Collection.Item>
                  <Cluster gap="stack">
                    <P>1.</P>
                    <P>{title}</P>
                    <P>3:42</P>
                    <Button variant="ghost">{text.remove(title)}</Button>
                  </Cluster>
                </Collection.Item>
              </Collection.Root>
            </Stack>
          ))}
          <P>{`${third ?? ''}: ${text.sideEmpty}`}</P>
        </Stack>
      </Pane.Body>
    </Pane.Root>
  );
  const release = (
    <Pane.Root name={text.release} testId="release-pane">
      <Pane.Head>
        <H2>{text.release}</H2>
        <Input
          label={text.title}
          name="releaseTitle"
          hint={text.hint}
          defaultValue=""
          placeholder={lead}
          onInput$={channels.title$}
        />
      </Pane.Head>
      <Pane.Body ariaLabel={text.rules} testId="release-rules">
        <Stack gap="stack">
          <Checklist.Root>
            {text.checks.map(([rule, status]) => (
              <Checklist.Item key={rule}>
                <span>{`${rule} · ${status}`}</span>
              </Checklist.Item>
            ))}
          </Checklist.Root>
          <Note color="muted" testId="release-note">
            {text.note}
          </Note>
        </Stack>
      </Pane.Body>
      <Pane.Foot placement={placement} testId="release-foot">
        <Cluster gap="stack" justify="between">
          <Cluster gap="stack">
            <H3>{text.rules}</H3>
            <P testId="release-count">{text.count}</P>
          </Cluster>
          <Button onClick$={channels.complete$} testId="release-complete">
            {text.complete}
          </Button>
        </Cluster>
      </Pane.Foot>
    </Pane.Root>
  );
  const column = (key: string, weight: number, children: ReactNode) => (
    <ColumnLayout.Column
      key={key}
      weight={weight}
      minWidth="--planning-area-min-width"
    >
      {children}
    </ColumnLayout.Column>
  );
  return (
    <div style={planningTheme} data-completions={completions}>
      <Shell
        testId="shell"
        ariaLabel={text.body}
        bar={
          <Header
            status={text.workspace}
            action={
              <Cluster gap="stack">
                <PressedToggle
                  isPressed={placement === 'bottom'}
                  onToggle={() =>
                    setPlacement(
                      placement === 'bottom' ? 'after-body' : 'bottom',
                    )
                  }
                >
                  Foot at bottom
                </PressedToggle>
                <PressedToggle
                  isPressed={spacing === 'compact'}
                  onToggle={() =>
                    setSpacing(
                      spacing === 'compact' ? 'comfortable' : 'compact',
                    )
                  }
                >
                  Compact spacing
                </PressedToggle>
              </Cluster>
            }
          />
        }
      >
        <Sidebar.Root
          fill
          active="contracts"
          label={text.sections}
          onSelect$={channels.navigate$}
        >
          {text.entries.map((entry, index) => (
            <Sidebar.Item
              key={entry}
              entryKey={index === 1 ? 'contracts' : entry}
            >
              {entry}
            </Sidebar.Item>
          ))}
          <Sidebar.Content>
            <Screen
              spacing={spacing}
              heading={
                <Cluster gap="stack">
                  <Button variant="ghost">{text.back}</Button>
                  <H1>{text.heading}</H1>
                </Cluster>
              }
            >
              <ColumnLayout.Alternatives fill>
                <ColumnLayout.Root fill testId="three-columns">
                  {column('pool', 1, pool)}
                  {column('sides', 1, sides)}
                  {column('release', 1, release)}
                </ColumnLayout.Root>
                <ColumnLayout.Root fill testId="tabbed-columns">
                  {column(
                    'pool-and-release',
                    6,
                    <Tabs.Root
                      fill
                      active={active}
                      onSelect$={channels.select$}
                      label={text.areas}
                    >
                      <Tabs.List>
                        <Tabs.Tab value="pool">{text.pool}</Tabs.Tab>
                        <Tabs.Tab value="release">{text.release}</Tabs.Tab>
                      </Tabs.List>
                      <Tabs.Panel value="pool">{pool}</Tabs.Panel>
                      <Tabs.Panel value="release">{release}</Tabs.Panel>
                    </Tabs.Root>,
                  )}
                  {column('sides', 5, sides)}
                </ColumnLayout.Root>
              </ColumnLayout.Alternatives>
            </Screen>
          </Sidebar.Content>
        </Sidebar.Root>
      </Shell>
    </div>
  );
};

// While Screen keeps its bound, Complete's own box meets the release pane's inner corner.
const checkComplete = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const tab = canvas.queryByRole('tab', { name: /Release$/ });
  if (tab) tab.click();
  const action = await canvas.findByTestId('release-complete');
  await expect(canvas.getAllByTestId('release-complete')).toHaveLength(1);
  const root = canvas.getByTestId('release-pane');
  // The corner holds only while Screen keeps its bound; the runner asserts that bound per size.
  if (root.hasAttribute('data-screen-unusable')) return;
  const style = getComputedStyle(root);
  const box = root.getBoundingClientRect();
  const rect = action.getBoundingClientRect();
  const length = (value: string) => Number.parseFloat(value);
  await expect(
    Math.abs(
      box.bottom -
        length(style.borderBottomWidth) -
        length(style.paddingBottom) -
        rect.bottom,
    ),
  ).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(
      box.right -
        length(style.borderRightWidth) -
        length(style.paddingRight) -
        rect.right,
    ),
  ).toBeLessThanOrEqual(1);
};

/** Release planning (#168), compact spacing, foot at the bottom. */
export const ReleasePlanningEnglish: Story = {
  render: () => <ReleasePlanning />,
  play: checkComplete,
};
export const ReleasePlanningGerman: Story = {
  render: () => <ReleasePlanning language="de" />,
  play: checkComplete,
};
/** The same screen under comfortable spacing. */
export const ReleasePlanningComfortable: Story = {
  render: () => <ReleasePlanning spacing="comfortable" />,
  play: checkComplete,
};
export const ReleasePlanningComfortableGerman: Story = {
  render: () => <ReleasePlanning language="de" spacing="comfortable" />,
  play: checkComplete,
};
/** Placement omitted: the default, the foot follows the short rules body. */
export const ReleasePlanningDefaultPlacement: Story = {
  render: () => <ReleasePlanning placement="after-body" />,
};
