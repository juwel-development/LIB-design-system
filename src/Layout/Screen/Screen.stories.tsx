import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  ColumnLayout,
  H1,
  H2,
  Header,
  P,
  Pane,
  Screen,
  Shell,
  Sidebar,
  Stack,
  Table,
} from 'index';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { Subject } from 'rxjs';

const meta: Meta<typeof Screen> = {
  title: 'Layout/Screen',
  component: Screen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Screen supplies the page's one semantic main. Put the visible heading in its optional heading slot, or omit the slot and put it inside Pane.Head. Omitted, undefined, null and false reserve no heading wrapper or gap. Screen uses the existing gutter for horizontal inset and region spacing for vertical inset and heading separation.

Use Shell (console) → optional Sidebar.Root fill / Sidebar.Content → Screen → ColumnLayout.Root fill → ColumnLayout.Column → Pane.Root. These direct height-passing compositions need no application layout styles. Theme-named column widths in these examples are fixture choices; ColumnLayout's minimum-fit rule decides stacking, independently of Sidebar's 64rem transition. Screen has no viewport breakpoint.

When fixed content plus one complete text line or ordinary row/control with focus room cannot fit, Screen releases all panel bounds into the enclosing Shell body. It restores bounds when space returns without remounts or temporary probes. Screen adds no scrollport or tab stop. Short bodies stay natural height. A delegated bounded Table owns both axes and keeps its header visible while bounded; use Pane.Body scrollOwner="child".

The enclosing body must own scrolling and its bar must leave usable space. Intermediate wrappers must pass height; a filling Tabs row above a Pane counts against that Pane's room, and other height-consuming wrappers are outside the direct panel fit contract. Unbounded parents and stacked columns use natural height. Font enlargement, long translations or small windows can require whole-content scrolling; reference-size fit is not promised for arbitrary application content. The examples are representative library compositions, not actual consumer acceptance. Screen Roster adds a complete searchable/selectable roster Table with pagination, a 15–17rem consumer theme and English/German examples. Its measured fit and fallback are recorded separately; the longer German heading can require fallback at 1280×720. Screen Work Areas composes ColumnLayout.Alternatives inside Screen: three bounded panels where they fit, and two of them as tabs beside the third where they do not.

HeadingAbove, HeadingInsidePanel, DelegatedTable and WithSidebar exercise both modes; use Toggle heading and Translate while editing Search to examine state retention. NarrowHolder demonstrates container-fit stacking on a wide viewport. The reproducible geometry/keyboard runner is scripts/browser/screen.mjs; it uses headless Chromium through an ephemeral Playwright runner and tests the built stylesheet exports as well as source CSS.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
const theme = {
  '--screen-list-minimum': '18rem',
  '--screen-detail-minimum': '20rem',
} as CSSProperties;
const entries = Array.from({ length: 40 }, (_, index) => index + 1);

const Example = ({
  inside = false,
  table = false,
  count = 40,
  sidebar = false,
  narrow = false,
  foot = true,
  removable = false,
}: {
  inside?: boolean;
  table?: boolean;
  count?: number;
  sidebar?: boolean;
  narrow?: boolean;
  foot?: boolean;
  removable?: boolean;
}) => {
  const [hasBody, setHasBody] = useState(true);
  const [hasHeading, setHasHeading] = useState(!inside);
  const [translated, setTranslated] = useState(false);
  const heading = (
    <H1>
      {translated
        ? 'Verfügbare Einträge und ausführliche Zusammenfassung'
        : 'Available entries'}
    </H1>
  );
  const selection$ = useState(() => new Subject<string>())[0];
  const wrap = (children: ReactNode) =>
    sidebar ? (
      <Sidebar.Root
        fill
        active="entries"
        label="Sections"
        onSelect$={selection$}
      >
        <Sidebar.Item entryKey="entries">Entries</Sidebar.Item>
        <Sidebar.Item entryKey="reports">Reports</Sidebar.Item>
        <Sidebar.Content>{children}</Sidebar.Content>
      </Sidebar.Root>
    ) : narrow ? (
      <div style={{ width: '40rem', maxWidth: '100%', height: '100%' }}>
        {children}
      </div>
    ) : (
      children
    );
  return (
    <div style={theme}>
      <Shell
        testId="shell"
        ariaLabel="Workspace body"
        bar={
          <Header
            status={
              translated
                ? 'Arbeitsbereich mit ausführlichem Bearbeitungsstatus und Informationen zur aktuellen Auswahl'
                : 'Workspace'
            }
            action={<Button>Account</Button>}
          />
        }
      >
        {wrap(
          <Screen heading={hasHeading ? heading : undefined}>
            <ColumnLayout.Root fill>
              <ColumnLayout.Column weight={1} minWidth="--screen-list-minimum">
                <Pane.Root name="List panel">
                  <Pane.Head testId="list-head">
                    <Stack>
                      {inside && heading}
                      <H2>Entries</H2>
                      <label>
                        Search <input aria-label="Search" defaultValue="" />
                      </label>
                      <button
                        type="button"
                        onClick={() => setHasHeading(!hasHeading)}
                      >
                        Toggle heading
                      </button>
                      <button
                        type="button"
                        onClick={() => setTranslated(!translated)}
                      >
                        Translate
                      </button>
                      {removable && (
                        <button
                          type="button"
                          onClick={() => setHasBody(!hasBody)}
                        >
                          Toggle body
                        </button>
                      )}
                      {translated && (
                        <>
                          <Button disabled>Auswahl nicht verfügbar</Button>
                          <P>
                            Wählen Sie zuerst einen vollständigen Eintrag für
                            diese Aktion.
                          </P>
                        </>
                      )}
                    </Stack>
                  </Pane.Head>
                  {hasBody && (
                    <Pane.Body
                      ariaLabel="Entries"
                      scrollOwner={table ? 'child' : 'body'}
                      testId="list-body"
                    >
                      {table ? (
                        <Table.Root bounded caption="Entries">
                          <Table.Head>
                            <Table.Row>
                              <Table.HeaderCell scope="col">
                                Entry
                              </Table.HeaderCell>
                            </Table.Row>
                          </Table.Head>
                          <Table.Body>
                            {entries.slice(0, count).map((entry) => (
                              <Table.Row key={entry}>
                                <Table.Cell>
                                  <Button variant="plain">Entry {entry}</Button>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      ) : (
                        <Stack>
                          {entries.slice(0, count).map((entry) => (
                            <Button key={entry} variant="plain">
                              Entry {entry}
                            </Button>
                          ))}
                        </Stack>
                      )}
                    </Pane.Body>
                  )}
                  {foot && (
                    <Pane.Foot testId="list-foot">
                      <Button>Next page</Button>
                    </Pane.Foot>
                  )}
                </Pane.Root>
              </ColumnLayout.Column>
              <ColumnLayout.Column
                weight={2}
                minWidth="--screen-detail-minimum"
              >
                <Pane.Root name="Detail panel">
                  <Pane.Head testId="detail-head">
                    <H2>
                      {translated
                        ? 'Zusammenfassung der ausgewählten Informationen'
                        : 'Selected entry'}
                    </H2>
                  </Pane.Head>
                  <Pane.Body ariaLabel="Details" testId="detail-body">
                    <Stack>
                      {entries.slice(0, count).map((entry) => (
                        <P key={entry}>
                          Detail paragraph {entry}: a representative passage
                          that wraps with the available width.
                        </P>
                      ))}
                    </Stack>
                  </Pane.Body>
                  <Pane.Foot testId="detail-foot">
                    <Button>Confirm selection</Button>
                  </Pane.Foot>
                </Pane.Root>
              </ColumnLayout.Column>
            </ColumnLayout.Root>
          </Screen>,
        )}
      </Shell>
    </div>
  );
};
export const HeadingAbove: Story = { render: () => <Example /> };
export const HeadingInsidePanel: Story = { render: () => <Example inside /> };
export const DelegatedTable: Story = { render: () => <Example table /> };
export const ShortContent: Story = { render: () => <Example count={1} /> };
export const EmptyContent: Story = { render: () => <Example count={0} /> };
export const Unsized: Story = {
  render: () => (
    <Screen heading={<H1>Natural page</H1>}>
      <Pane.Root>
        <Pane.Body ariaLabel="Content">
          <P>Natural content height.</P>
        </Pane.Body>
      </Pane.Root>
    </Screen>
  ),
};

export const WithSidebar: Story = { render: () => <Example sidebar /> };
export const NarrowHolder: Story = { render: () => <Example narrow /> };

export const WithoutFoot: Story = { render: () => <Example foot={false} /> };

export const OptionalBody: Story = { render: () => <Example removable /> };
