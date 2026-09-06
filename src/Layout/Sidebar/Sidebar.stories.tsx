import { Stack } from 'Arrangement/Stack/Stack';
import { H2 } from 'Display/Typography/H2/H2';
import { P } from 'Display/Typography/P/P';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Sidebar } from './Sidebar';

const meta: Meta<typeof Sidebar.Root> = {
  title: 'Layout/Sidebar',
  component: Sidebar.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const section$ = new Subject<string>();

const count = (length: number) =>
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
  const standing = sections.find((section) => section.entryKey === active);
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
          <H2>{standing?.name}</H2>
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

/** Active, usable and inert treatments side by side, statically - one entry standing, one muted. */
export const ActiveAndInert: Story = {
  render: () => (
    <Sidebar.Root active="staff" label="Sections" onSelect$={section$}>
      <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
      <Sidebar.Item entryKey="contracts" inert>
        Contracts
      </Sidebar.Item>
      <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
      <Sidebar.Content>
        <P>
          The standing entry keeps a persistent underline; a usable entry raises
          one on hover; the inert entry is muted and disabled.
        </P>
      </Sidebar.Content>
    </Sidebar.Root>
  ),
};

/** Long labels wrap inside the fixed 12rem track rather than widening or truncating it. */
export const LongLabels: Story = {
  render: () => (
    <Sidebar.Root active="artists" label="Sections" onSelect$={section$}>
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
    <Sidebar.Root active="staff" label="Sections" onSelect$={section$}>
      <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
      <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
      <Sidebar.Content>
        <Stack gap="region">
          <H2>Staff</H2>
          {count(30).map((number) => (
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
    <Sidebar.Root active="section-40" label="Sections" onSelect$={section$}>
      {count(40).map((number) => (
        <Sidebar.Item key={number} entryKey={`section-${number}`}>
          {`Section ${number}`}
        </Sidebar.Item>
      ))}
      <Sidebar.Content>
        <Stack gap="region">
          <H2>Section 40</H2>
          {count(30).map((number) => (
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
      <Sidebar.Root active="staff" label="Sections" onSelect$={section$}>
        <Sidebar.Item entryKey="hub">Hub</Sidebar.Item>
        <Sidebar.Item entryKey="staff">Staff</Sidebar.Item>
        <Sidebar.Content>
          <Stack gap="region">
            <H2>Staff</H2>
            {count(20).map((number) => (
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
 * Content wider than its track. The content column is `minmax(0,1fr)`, so a wide child overflows its
 * own track (scrolling where the consumer arranges it) and never pushes the 12rem nav away.
 */
export const WideContent: Story = {
  render: () => (
    <Sidebar.Root active="staff" label="Sections" onSelect$={section$}>
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

/**
 * The narrow arrangement. Set the canvas below 64rem: the complete list lies above the content in
 * normal flow - no stickiness, no capped scroller, no drawer.
 */
export const Stacked: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => (
    <Sidebar.Root active="staff" label="Sections" onSelect$={section$}>
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
