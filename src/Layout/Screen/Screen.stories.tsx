import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Box,
  Button,
  Cluster,
  ColumnLayout,
  Dialog,
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
import { expect, waitFor, within } from 'storybook/test';

const meta: Meta<typeof Screen> = {
  title: 'Layout/Screen',
  component: Screen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Screen supplies the page's one semantic main. Put the visible heading in its optional heading slot, or omit the slot and put it inside Pane.Head. Omitted, undefined, null and false reserve no heading wrapper or gap. Screen uses the existing gutter for horizontal inset and region spacing for vertical inset and heading separation. Optional \`spacing="compact"\` selects the compact console treatment for Screen's vertical inset and heading separation and for the inset and slot gaps of its Panes; omitted, or \`"comfortable"\`, renders exactly as before. *Layout/Screen Console Spacing* documents it with representative consumer fixtures.

Use Shell (console) → optional Sidebar.Root fill / Sidebar.Content → Screen → ColumnLayout.Root fill → ColumnLayout.Column → Pane.Root. These direct height-passing compositions need no application layout styles. Theme-named column widths in these examples are fixture choices; ColumnLayout's minimum-fit rule decides stacking, independently of Sidebar's 64rem transition. Screen has no viewport breakpoint.

When fixed content plus one complete text line or ordinary row/control with focus room cannot fit, Screen releases all panel bounds into the enclosing Shell body. It restores bounds when space returns without remounts or temporary probes. Screen adds no scrollport or tab stop. Short bodies stay natural height. A delegated bounded Table owns both axes and keeps its header visible while bounded; use Pane.Body scrollOwner="child".

The enclosing body must own scrolling and its bar must leave usable space. Intermediate wrappers must pass height; a filling Tabs row above a Pane counts against that Pane's room, and other height-consuming wrappers are outside the direct panel fit contract. Unbounded parents and stacked columns use natural height. Font enlargement, long translations or small windows can require whole-content scrolling; reference-size fit is not promised for arbitrary application content. The examples are representative library compositions, not actual consumer acceptance. Screen Roster adds a complete searchable/selectable roster Table with pagination, a 15–17rem consumer theme and English/German examples. Its measured fit and fallback are recorded separately; the longer German heading can require fallback at 1280×720. Screen Work Areas composes ColumnLayout.Alternatives inside Screen: three bounded panels where they fit, and two of them as tabs beside the third where they do not.

The Compact stories add a *Compact spacing* switch to the bar; their play functions measure the default, the compact treatment and the return to the identical default, and SpacingScope and CompactWithDialog show which Panes follow a compact Screen. HeadingAbove, HeadingInsidePanel, DelegatedTable and WithSidebar exercise both modes; use Toggle heading and Translate while editing Search to examine state retention. NarrowHolder demonstrates container-fit stacking on a wide viewport. The reproducible geometry/keyboard runners are scripts/browser/screen.mjs and, for the spacing treatment, scripts/browser/console-spacing.mjs; it uses headless Chromium through an ephemeral Playwright runner and tests the built stylesheet exports as well as source CSS.`,
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
  spacing: initialSpacing,
  switchable = false,
}: {
  inside?: boolean;
  table?: boolean;
  count?: number;
  sidebar?: boolean;
  narrow?: boolean;
  foot?: boolean;
  removable?: boolean;
  spacing?: 'comfortable' | 'compact';
  switchable?: boolean;
}) => {
  const [hasBody, setHasBody] = useState(true);
  const [spacing, setSpacing] = useState(initialSpacing);
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
            action={
              switchable ? (
                <Cluster>
                  <button
                    type="button"
                    aria-pressed={spacing === 'compact'}
                    onClick={() =>
                      setSpacing(
                        spacing === 'compact' ? 'comfortable' : 'compact',
                      )
                    }
                  >
                    Compact spacing
                  </button>
                  <Button>Account</Button>
                </Cluster>
              ) : (
                <Button>Account</Button>
              )
            }
          />
        }
      >
        {wrap(
          <Screen heading={hasHeading ? heading : undefined} spacing={spacing}>
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

const length = (value: string) => Number.parseFloat(value) || 0;
const rectangle = (element: Element) => element.getBoundingClientRect();
const ringRoom = () => {
  const root = getComputedStyle(document.documentElement);
  return (
    length(root.getPropertyValue('--focus-ring-width')) +
    length(root.getPropertyValue('--focus-ring-offset'))
  );
};
// Every computed length the treatment must leave alone: descendant gaps and paddings (Stack,
// Box, the body's focus-ring room, Table cells), control boxes and type.
const descendantSpacing = (pane: Element) =>
  Array.from(pane.querySelectorAll('*'), (element) => {
    const style = getComputedStyle(element);
    return [
      style.rowGap,
      style.columnGap,
      style.paddingTop,
      style.paddingRight,
      style.paddingBottom,
      style.paddingLeft,
      style.fontSize,
      style.lineHeight,
      style.outlineWidth,
      style.outlineOffset,
      element.matches('button, input, select, textarea')
        ? `${rectangle(element).height}`
        : '',
    ].join(' ');
  });
const measureConsole = (main: Element) => {
  const style = getComputedStyle(main);
  const header = main.querySelector(':scope > header');
  const content = main.lastElementChild as Element;
  const panes = Array.from(
    main.querySelectorAll('[data-pane-body]'),
    (body) => body.parentElement as Element,
  ).filter((pane) => !pane.closest('dialog'));
  return {
    block: [length(style.paddingTop), length(style.paddingBottom)],
    gutter: [length(style.paddingLeft), length(style.paddingRight)],
    headingGap: header ? rectangle(content).top - rectangle(header).bottom : 0,
    released: main.querySelector('[data-screen-unusable]') !== null,
    panes: panes.map((pane) => {
      const paneStyle = getComputedStyle(pane);
      const slots = Array.from(pane.children);
      const body = pane.querySelector(':scope > [data-pane-body]') as Element;
      const scroller = body.querySelector(':scope > div:has(> table)') ?? body;
      return {
        inset: [
          paneStyle.paddingTop,
          paneStyle.paddingRight,
          paneStyle.paddingBottom,
          paneStyle.paddingLeft,
        ].map(length),
        gaps: slots
          .slice(1)
          .map(
            (slot, index) =>
              rectangle(slot).top - rectangle(slots[index] as Element).bottom,
          ),
        body: rectangle(body).height,
        overflowing: scroller.scrollHeight > scroller.clientHeight + 1,
        descendants: descendantSpacing(pane),
      };
    }),
  };
};
type ConsoleMeasurement = ReturnType<typeof measureConsole>;
const frames = async () => {
  for (let frame = 0; frame < 3; frame++)
    await new Promise(requestAnimationFrame);
};
const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0);
const expectCompact = async (
  comfortable: ConsoleMeasurement,
  compact: ConsoleMeasurement,
) => {
  const room = ringRoom();
  await expect(compact.gutter).toEqual(comfortable.gutter);
  for (const [index, value] of compact.block.entries()) {
    await expect(value).toBeLessThan(comfortable.block[index] as number);
    await expect(value).toBeGreaterThanOrEqual(room);
  }
  if (comfortable.headingGap > 0) {
    await expect(compact.headingGap).toBeLessThan(comfortable.headingGap);
    await expect(compact.headingGap).toBeCloseTo(compact.block[0] as number, 1);
  } else await expect(compact.headingGap).toBe(0);
  for (const [index, pane] of compact.panes.entries()) {
    const before = comfortable.panes[index] as (typeof compact.panes)[number];
    for (const [side, inset] of pane.inset.entries()) {
      await expect(inset).toBeLessThan(before.inset[side] as number);
      await expect(inset).toBeGreaterThanOrEqual(room);
    }
    for (const [slot, gap] of pane.gaps.entries())
      await expect(gap).toBeLessThan(before.gaps[slot] as number);
    await expect(pane.descendants).toEqual(before.descendants);
    // A bound body gains exactly the room the enclosures gave up above and below it; a short
    // body keeps its content height and the foot follows it.
    if (!comfortable.released && !compact.released && pane.overflowing) {
      const recovered =
        sum(comfortable.block) -
        sum(compact.block) +
        comfortable.headingGap -
        compact.headingGap +
        (before.inset[0] as number) -
        (pane.inset[0] as number) +
        (before.inset[2] as number) -
        (pane.inset[2] as number) +
        sum(before.gaps) -
        sum(pane.gaps);
      await expect(recovered).toBeGreaterThan(0);
      await expect(pane.body - before.body).toBeCloseTo(recovered, 0);
    }
    if (!before.overflowing && !pane.overflowing)
      await expect(pane.body).toBeCloseTo(before.body, 1);
  }
};
// Switches the treatment through the story's own control, without moving focus, and proves the
// change, the return to the identical default and that the focused field survives both.
const checkConsoleSpacing = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const main = canvas.getByRole('main');
  const toggle = canvas.getByRole('button', { name: 'Compact spacing' });
  const field = canvas.getByRole('textbox', {
    name: 'Search',
  }) as HTMLInputElement;
  field.focus();
  field.value = 'retained text';
  field.setSelectionRange(2, 6);
  await frames();
  const comfortable = measureConsole(main);
  toggle.click();
  await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'));
  await frames();
  await expectCompact(comfortable, measureConsole(main));
  toggle.click();
  await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
  await frames();
  const restored = measureConsole(main);
  await expect(restored.block).toEqual(comfortable.block);
  await expect(restored.headingGap).toBeCloseTo(comfortable.headingGap, 1);
  for (const [index, pane] of restored.panes.entries()) {
    const before = comfortable.panes[index] as (typeof restored.panes)[number];
    await expect(pane.inset).toEqual(before.inset);
    await expect(pane.body).toBeCloseTo(before.body, 1);
  }
  await expect(canvas.getByRole('textbox', { name: 'Search' })).toBe(field);
  await expect(field).toHaveFocus();
  await expect(field.value).toBe('retained text');
  await expect([field.selectionStart, field.selectionEnd]).toEqual([2, 6]);
};

/** Compact console spacing beside a Sidebar, heading above: switch it with *Compact spacing*. */
export const CompactSpacing: Story = {
  render: () => <Example sidebar switchable />,
  play: checkConsoleSpacing,
};
export const CompactDelegatedTable: Story = {
  render: () => <Example table switchable />,
  play: checkConsoleSpacing,
};
export const CompactHeadingInsidePanel: Story = {
  render: () => <Example inside switchable />,
  play: checkConsoleSpacing,
};
export const CompactWithoutFoot: Story = {
  render: () => <Example foot={false} switchable />,
  play: checkConsoleSpacing,
};
export const CompactShortContent: Story = {
  render: () => <Example count={1} switchable />,
  play: checkConsoleSpacing,
};
/** Starts compact, for the browser runner's fallback and restoration passes. */
export const CompactInitially: Story = {
  render: () => <Example spacing="compact" switchable />,
};

const ScopePane = ({ name }: { name: string }) => (
  <Pane.Root name={name}>
    <Pane.Body ariaLabel={`${name} body`}>
      <Box>
        <Stack>
          <P>Descendant content keeps its own spacing.</P>
          <Button>Act</Button>
        </Stack>
      </Box>
    </Pane.Body>
    <Pane.Foot>
      <Button>Confirm</Button>
    </Pane.Foot>
  </Pane.Root>
);
const scopeHolder: CSSProperties = { height: '16rem', flex: '1 1 0' };
/** Only Panes inside a compact Screen follow it: a default Screen beside it and a standalone
 *  Pane keep the default, and a theme re-points the compact positions without touching the
 *  generic roles their descendants read. Two mains appear only to compare them side by side. */
export const SpacingScope: Story = {
  parameters: {
    a11y: {
      config: { rules: [{ id: 'landmark-no-duplicate-main', enabled: false }] },
    },
  },
  render: () => (
    <Stack>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={scopeHolder}>
          <Screen heading={<H2>Default</H2>} testId="default-screen">
            <ScopePane name="Default pane" />
          </Screen>
        </div>
        <div style={scopeHolder}>
          <Screen
            heading={<H2>Compact</H2>}
            spacing="compact"
            testId="compact-screen"
          >
            <ScopePane name="Compact pane" />
          </Screen>
        </div>
        <div
          style={
            {
              ...scopeHolder,
              '--space-screen-region-compact': '0.75rem',
              '--space-pane-inset-compact': '0.75rem',
              '--space-pane-slot-compact': '0.375rem',
            } as CSSProperties
          }
        >
          <Screen
            heading={<H2>Themed</H2>}
            spacing="compact"
            testId="themed-screen"
          >
            <ScopePane name="Themed pane" />
          </Screen>
        </div>
      </div>
      <div style={{ height: '12rem' }}>
        <ScopePane name="Standalone pane" />
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pane = (name: string) =>
      measureConsole(
        canvas.getByRole('group', { name }).closest('main') ??
          canvas.getByRole('group', { name }).parentElement ??
          canvasElement,
      );
    const standalone = canvas.getByRole('group', { name: 'Standalone pane' });
    const standaloneStyle = getComputedStyle(standalone);
    const standaloneSlots = Array.from(standalone.children);
    const comfortable = pane('Default pane');
    const compact = pane('Compact pane');
    const themed = pane('Themed pane');
    await expectCompact(comfortable, compact);
    await expect(comfortable.panes[0]?.inset[0]).toBe(
      length(standaloneStyle.paddingTop),
    );
    await expect(comfortable.panes[0]?.gaps[0]).toBeCloseTo(
      rectangle(standaloneSlots[1] as Element).top -
        rectangle(standaloneSlots[0] as Element).bottom,
      1,
    );
    await expect(themed.block).toEqual([12, 12]);
    await expect(themed.headingGap).toBeCloseTo(12, 1);
    await expect(themed.panes[0]?.inset).toEqual([12, 12, 12, 12]);
    await expect(themed.panes[0]?.gaps[0]).toBeCloseTo(6, 1);
    await expect(themed.panes[0]?.descendants).toEqual(
      comfortable.panes[0]?.descendants,
    );
  },
};

/** A Dialog opened from inside a compact Screen is not one of its work areas: its Pane keeps
 *  the default inset and slot gaps. */
export const CompactWithDialog: Story = {
  render: () => {
    const [dismissed$] = useState(() => new Subject<void>());
    return (
      <div style={{ height: '100vh' }}>
        <Screen heading={<H1>Console</H1>} spacing="compact">
          <ScopePane name="Console pane" />
          <Dialog.Root onDismiss$={dismissed$}>
            <Dialog.Title>Review</Dialog.Title>
            <Dialog.Content>
              <ScopePane name="Dialog pane" />
            </Dialog.Content>
            <Dialog.Actions>
              <Button>Close</Button>
            </Dialog.Actions>
          </Dialog.Root>
        </Screen>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const dialogPane = await canvas.findByRole('group', {
      name: 'Dialog pane',
    });
    const consolePane = canvas.getByRole('group', { name: 'Console pane' });
    const probe = canvasElement.ownerDocument.createElement('div');
    probe.style.padding = 'var(--space-box-inset)';
    probe.style.rowGap = 'var(--space-stack)';
    dialogPane.append(probe);
    const boxInset = length(getComputedStyle(probe).paddingTop);
    const stack = length(getComputedStyle(probe).rowGap);
    probe.remove();
    await expect(length(getComputedStyle(dialogPane).paddingTop)).toBe(
      boxInset,
    );
    await expect(length(getComputedStyle(dialogPane).rowGap)).toBe(stack);
    await expect(length(getComputedStyle(consolePane).paddingTop)).toBeLessThan(
      boxInset,
    );
    await expect(length(getComputedStyle(consolePane).rowGap)).toBeLessThan(
      stack,
    );
  },
};
