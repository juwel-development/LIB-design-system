import { Stack } from 'Arrangement/Stack/Stack';
import { H2 } from 'Display/Typography/H2/H2';
import { P } from 'Display/Typography/P/P';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';
import { Sidebar } from './Sidebar';

// The two desktop windows #122 checks either side of the 64rem switch: a broad one holding the side
// track, a narrow one taking the above-content arrangement. The phone preset stays for Stacked.
const desktopViewports = {
  broadDesktop: {
    name: 'Broad desktop (1440px)',
    styles: { width: '1440px', height: '900px' },
  },
  narrowDesktop: {
    name: 'Narrow desktop (800px)',
    styles: { width: '800px', height: '900px' },
  },
};

const meta: Meta<typeof Sidebar.Root> = {
  title: 'Layout/Sidebar',
  component: Sidebar.Root,
  parameters: {
    layout: 'padded',
    viewport: { options: { ...MINIMAL_VIEWPORTS, ...desktopViewports } },
    docs: {
      description: {
        component:
          'Compose Sidebar.Root with Sidebar.Item children - one text label each, in display order - and one Sidebar.Content. The application owns the active key and answers each `onSelect$` request by rerendering with a new `active`; an `inert` entry keeps its place but is muted, disabled and skipped by Tab. The arrangement follows the viewport: at and above 64rem the entries sit in a fixed 12rem track beside the content, sticky at the top of the scrolling area and capped to its height with their own vertical scrolling; below 64rem the whole list lies above the content in normal flow. One DOM serves both, so the nav landmark named by `label`, the plain non-submitting buttons, the Tab order, Enter and Space selection and the focus ring are the same at every width. Every label is rendered in full: a phrase wraps at its spaces and a word wider than the track breaks within itself, so a translated label is never truncated, never scrolls the nav sideways, and neither widens the track nor displaces the content. None of this needs consumer CSS.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const section$ = new Subject<string>();

// The static stories emit into their own unobserved Subject: autodocs mounts every story on one
// page, and sharing the Controlled story's Subject would let their entries drive its state.
const staticSection$ = new Subject<string>();

const range = (length: number) =>
  Array.from({ length }, (_, index) => index + 1);

const sections = [
  { entryKey: 'hub', name: 'Hub' },
  { entryKey: 'contracts', name: 'Contracts', inert: true },
  { entryKey: 'a-and-r', name: 'A&R' },
  { entryKey: 'staff', name: 'Staff' },
];

// The controlled loop a consumer writes: hold the active key, subscribe to the Subject, rerender.
// Sidebar itself owns none of this - it renders the key it is given and emits requests.
const ControlledSidebar: FunctionComponent = () => {
  const [active, setActive] = useState('staff');
  useEffect(() => {
    const subscription = section$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, []);
  const activeSection = sections.find((section) => section.entryKey === active);
  return (
    <Sidebar.Root active={active} label="Sections" onSelect$={section$}>
      {sections.map((section) => (
        <Sidebar.Item
          key={section.entryKey}
          entryKey={section.entryKey}
          inert={section.inert}
        >
          {section.name}
        </Sidebar.Item>
      ))}
      <Sidebar.Content>
        <Stack gap="stack">
          <H2>{activeSection?.name}</H2>
          <P>
            The active section&apos;s matter, supplied by the application.
            Select another entry to request it - Contracts is inert: listed,
            muted, and not selectable.
          </P>
        </Stack>
      </Sidebar.Content>
    </Sidebar.Root>
  );
};

/**
 * The controlled compound API: the application holds the active key, subscribes to `onSelect$`, and
 * rerenders with the selection. Resize the canvas across 64rem - above it a fixed 12rem nav track
 * beside the content, below it the whole list above the content in normal flow.
 */
export const Controlled: Story = {
  render: () => <ControlledSidebar />,
};

/** Active, usable and inert treatments side by side, statically - one entry active, one muted. */
export const ActiveAndInert: Story = {
  render: () => (
    <Sidebar.Root active="staff" label="Sections" onSelect$={staticSection$}>
      <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
      <Sidebar.Item entryKey="contracts" inert>
        Contracts
      </Sidebar.Item>
      <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
      <Sidebar.Content>
        <P>
          The active entry keeps a persistent underline; a usable entry raises
          one on hover; the inert entry is muted and disabled.
        </P>
      </Sidebar.Content>
    </Sidebar.Root>
  ),
};

/** Long labels wrap inside the fixed 12rem track rather than widening or truncating it. */
export const LongLabels: Story = {
  render: () => (
    <Sidebar.Root active="artists" label="Sections" onSelect$={staticSection$}>
      <Sidebar.Item entryKey="artists">
        Artists and repertoire coordination
      </Sidebar.Item>
      <Sidebar.Item entryKey="contracts">
        Contract negotiations with distribution partners
      </Sidebar.Item>
      <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
      <Sidebar.Content>
        <P>
          A label longer than the track wraps within it; the track keeps its
          12rem and the entries keep their order.
        </P>
      </Sidebar.Content>
    </Sidebar.Root>
  ),
};

/**
 * Long content beside a short nav. Scroll at a wide viewport: the nav sticks at the top of the
 * scrolling area and leaves with its frame, because its travel is bounded by Sidebar's own row.
 */
export const LongContent: Story = {
  render: () => (
    <Sidebar.Root active="staff" label="Sections" onSelect$={staticSection$}>
      <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
      <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
      <Sidebar.Content>
        <Stack gap="region">
          <H2>Staff</H2>
          {range(30).map((number) => (
            <P key={number}>
              Paragraph {number} of a long section, so the page scrolls far past
              the nav and the sticky behaviour has room to show.
            </P>
          ))}
        </Stack>
      </Sidebar.Content>
    </Sidebar.Root>
  ),
};

/**
 * More entries than a screen holds. At a wide viewport the nav caps itself to the viewport height
 * and scrolls its entries independently, so the last entry stays reachable by wheel and by Tab.
 */
export const OversizedNavigation: Story = {
  render: () => (
    <Sidebar.Root
      active="section-40"
      label="Sections"
      onSelect$={staticSection$}
    >
      {range(40).map((number) => (
        <Sidebar.Item key={number} entryKey={`section-${number}`}>
          {`Section ${number}`}
        </Sidebar.Item>
      ))}
      <Sidebar.Content>
        <Stack gap="region">
          <H2>Section 40</H2>
          {range(30).map((number) => (
            <P key={number}>
              Content long enough to scroll, paragraph {number} - the nav
              scroller and the page scroller stay independent.
            </P>
          ))}
        </Stack>
      </Sidebar.Content>
    </Sidebar.Root>
  ),
};

/**
 * A consumer-owned scrolling frame of fixed height. The nav sticks to the top of that scrolling
 * area - not the viewport - with no application top-bar offset baked in. The wrapper is the
 * consumer's own scroll container, so the story styles it inline the way an application would.
 */
export const HeightConstrainedFrame: Story = {
  render: () => (
    <div style={{ height: '24rem', overflowY: 'auto' }}>
      <Sidebar.Root active="staff" label="Sections" onSelect$={staticSection$}>
        <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
        <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
        <Sidebar.Content>
          <Stack gap="region">
            <H2>Staff</H2>
            {range(20).map((number) => (
              <P key={number}>
                Paragraph {number}, scrolling inside the fixed frame while the
                nav holds to the frame&apos;s top edge.
              </P>
            ))}
          </Stack>
        </Sidebar.Content>
      </Sidebar.Root>
    </div>
  ),
};

/**
 * An oversized list inside a resizable consumer scrollport. At lg, wheel over the nav or Tab
 * through its entries to reach Section 40; resizing the frame keeps the list capped to it.
 */
export const OversizedNavigationInFrame: Story = {
  render: () => (
    <div style={{ height: '24rem', overflowY: 'auto', resize: 'vertical' }}>
      <Sidebar.Root
        active="section-40"
        label="Sections"
        onSelect$={staticSection$}
      >
        {range(40).map((number) => (
          <Sidebar.Item key={number} entryKey={`section-${number}`}>
            {`Section ${number}`}
          </Sidebar.Item>
        ))}
        <Sidebar.Content>
          <Stack gap="region">
            <H2>Section 40</H2>
            {range(30).map((number) => (
              <P key={number}>
                Paragraph {number} of the section inside the resizable frame.
              </P>
            ))}
          </Stack>
        </Sidebar.Content>
      </Sidebar.Root>
    </div>
  ),
};

/**
 * Content wider than its track. The content column is `minmax(0,1fr)`, so a wide child overflows its
 * own track (scrolling where the consumer arranges it) and never pushes the 12rem nav away.
 */
export const WideContent: Story = {
  render: () => (
    <Sidebar.Root active="staff" label="Sections" onSelect$={staticSection$}>
      <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
      <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
      <Sidebar.Content>
        <Stack gap="stack">
          <H2>Staff</H2>
          <pre style={{ overflowX: 'auto' }}>
            {`one-unbroken-line-${'wide-'.repeat(60)}end`}
          </pre>
          <P>
            The wide line scrolls inside the content track; the nav track keeps
            its width beside it.
          </P>
        </Stack>
      </Sidebar.Content>
    </Sidebar.Root>
  ),
};

// The consumer's six sections (juwel-dev/g-label-manager#195) in German: short labels, a phrase that
// wraps at its spaces, and `Vertragsverhandlungsübersicht` - the unbroken word wider than the 12rem
// track that overflowed the nav before #122, kept as the regression input the brief names.
const translatedSections = [
  { entryKey: 'hub', name: 'Zentrale' },
  { entryKey: 'contracts', name: 'Vertragsverhandlungsübersicht' },
  { entryKey: 'songs', name: 'Songs' },
  { entryKey: 'a-and-r', name: 'A&R' },
  { entryKey: 'staff', name: 'Mitarbeiterinnen und Mitarbeiter' },
  { entryKey: 'market-research', name: 'Marktforschung' },
];

const TranslatedSidebar: FunctionComponent = () => (
  <Sidebar.Root active="contracts" label="Bereiche" onSelect$={staticSection$}>
    {translatedSections.map((section) => (
      <Sidebar.Item key={section.entryKey} entryKey={section.entryKey}>
        {section.name}
      </Sidebar.Item>
    ))}
    <Sidebar.Content>
      <Stack gap="stack">
        <H2>Vertragsverhandlungsübersicht</H2>
        <P>
          Every label is rendered in full: a phrase wraps at its spaces and a
          word wider than the track breaks within itself. Nothing is cut off,
          and neither the nav nor the page scrolls sideways.
        </P>
      </Stack>
    </Sidebar.Content>
  </Sidebar.Root>
);

// Measured in the browser, where jsdom cannot follow: every label's lines sit inside its entry, the
// nav and the page scroll nowhere sideways, the active entry keeps its current state and underline,
// and the first Tab lands on the first entry with its ring showing.
const expectLabelsReadable = async (canvasElement: HTMLElement) => {
  await document.fonts.ready;
  const canvas = within(canvasElement);
  const navigation = canvas.getByRole('navigation', { name: 'Bereiche' });
  for (const entry of canvas.getAllByRole('button')) {
    await expect(entry.scrollWidth).toBeLessThanOrEqual(entry.clientWidth);
    const bounds = entry.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(entry);
    for (const line of range.getClientRects()) {
      await expect(line.left).toBeGreaterThanOrEqual(bounds.left - 0.5);
      await expect(line.right).toBeLessThanOrEqual(bounds.right + 0.5);
    }
  }
  await expect(navigation.scrollWidth).toBeLessThanOrEqual(
    navigation.clientWidth,
  );
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  const active = canvas.getByRole('button', {
    name: 'Vertragsverhandlungsübersicht',
  });
  await expect(active).toHaveAttribute('aria-current', 'true');
  await expect(getComputedStyle(active).textDecorationLine).toContain(
    'underline',
  );
  await userEvent.tab();
  const first = canvas.getByRole('button', { name: 'Zentrale' });
  await expect(first).toHaveFocus();
  await expect(getComputedStyle(first).outlineStyle).toBe('solid');
};

const trackAndHeading = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  return {
    track: canvas
      .getByRole('navigation', { name: 'Bereiche' })
      .parentElement?.getBoundingClientRect(),
    heading: canvas.getByRole('heading', { level: 2 }).getBoundingClientRect(),
  };
};

/**
 * A broad desktop window, pinned at 1440px: the side arrangement. The German set wraps inside the
 * 12rem track - `Vertragsverhandlungsübersicht` breaks within the word - and the track keeps its width,
 * so the content beside it is not displaced and the nav gains no horizontal scrolling.
 */
export const TranslatedLabelsBroadDesktop: Story = {
  globals: { viewport: { value: 'broadDesktop', isRotated: false } },
  render: () => <TranslatedSidebar />,
  play: async ({ canvasElement }) => {
    await expectLabelsReadable(canvasElement);
    const { track, heading } = trackAndHeading(canvasElement);
    const rem = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    await expect(track?.width).toBeCloseTo(12 * rem, 0);
    await expect(heading.left).toBeGreaterThanOrEqual(track?.right ?? 0);
  },
};

/**
 * A narrow desktop window, pinned at 800px - below the 64rem switch: the above-content arrangement,
 * the same list in the same order above the content, every label still rendered in full.
 */
export const TranslatedLabelsNarrowDesktop: Story = {
  globals: { viewport: { value: 'narrowDesktop', isRotated: false } },
  render: () => <TranslatedSidebar />,
  play: async ({ canvasElement }) => {
    await expectLabelsReadable(canvasElement);
    const { track, heading } = trackAndHeading(canvasElement);
    await expect(heading.top).toBeGreaterThanOrEqual(track?.bottom ?? 0);
  },
};

/**
 * The narrow arrangement on a phone-sized canvas: the complete list lies above the content in normal
 * flow - no stickiness, no capped scroller, no drawer.
 */
export const Stacked: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  render: () => (
    <Sidebar.Root active="staff" label="Sections" onSelect$={staticSection$}>
      <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
      <Sidebar.Item entryKey="contracts" inert>
        Contracts
      </Sidebar.Item>
      <Sidebar.Item entryKey="staff">
        A deliberately long staff-management label for the narrow case
      </Sidebar.Item>
      <Sidebar.Content>
        <P>
          Below the breakpoint the tracks stack; that is all - the proposal
          rules out any burger or overlay mode.
        </P>
      </Sidebar.Content>
    </Sidebar.Root>
  ),
};
