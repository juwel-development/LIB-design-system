import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  H2,
  Header,
  Input,
  P,
  ScrollContainer,
  Shell,
  Sidebar,
  Stack,
} from 'index';
import type { ReactNode } from 'react';
import { Subject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof Shell> = {
  title: 'Layout/Shell',
  component: Shell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        reference: {
          name: 'Reference 1920 × 1080',
          styles: { width: '1920px', height: '1080px' },
        },
        laptop: {
          name: 'Laptop 1280 × 720',
          styles: { width: '1280px', height: '720px' },
        },
        stacked: {
          name: 'Stacked 800 × 720',
          styles: { width: '800px', height: '720px' },
        },
        short: {
          name: 'Short window 1280 × 320',
          styles: { width: '1280px', height: '320px' },
        },
      },
    },
    docs: {
      description: {
        component: `Shell owns the viewport: place it at the viewport origin, with no outer margins, padding or siblings adding document extent. The bar takes its content height; CSS gives the body the rest, including when the bar wraps. The bar must leave usable body space.

Console is the default: bounded children scroll inside their own regions; the body scrolls only as a reachability fallback for fixed content that cannot fit. Page mode deliberately scrolls the body as a whole. Neither mode scrolls the document. The body becomes a named keyboard stop only when overflowing, and keeps that stop while focused.

Supply your own main landmark inside the body, excluding standing navigation. Intermediate semantic wrappers must preserve the allocation (the examples use display: contents on main). Shell adds no landmarks and does not style the document. Use Sidebar.Root fill for a console: at 64rem and above Content passes the allocated height through and navigation scrolls independently; below 64rem navigation stacks above content and the enclosing body scrolls. One DOM preserves state and focus through resizing. Sidebar fill also works in any independently bounded parent whose enclosing body owns fallback scrolling.

These examples use the existing ScrollContainer as the bounded panel. Fixed panel heads and feet, multiple filling columns and filling Tabs depend on the separate Pane, ColumnLayout and Tabs tickets; they are not simulated here.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
const select$ = new Subject<string>();
const entries = Array.from({ length: 60 }, (_, index) => index + 1);
const bar = (
  <Header status="Day 12 · Balance 42,000" action={<Button>Run</Button>} />
);

const Entries = () => (
  <Stack gap="stack">
    <H2>Entries</H2>
    <Input label="Draft" name="draft" defaultValue="Keep this draft" />
    {entries.map((entry) => (
      <Button key={entry} variant="plain">
        Entry {entry}
      </Button>
    ))}
  </Stack>
);

const Navigation = ({
  children,
  fill,
}: {
  children: ReactNode;
  fill?: boolean;
}) => (
  <Sidebar.Root
    fill={fill}
    active="section-1"
    label="Sections"
    onSelect$={select$}
  >
    {entries.map((entry) => (
      <Sidebar.Item
        key={entry}
        entryKey={`section-${entry}`}
      >{`Section ${entry}`}</Sidebar.Item>
    ))}
    <Sidebar.Content>{children}</Sidebar.Content>
  </Sidebar.Root>
);

const Console = ({ navigation = true }: { navigation?: boolean }) => {
  const content = (
    <main style={{ display: 'contents' }}>
      <ScrollContainer ariaLabel="Entries" axis="vertical">
        <Entries />
      </ScrollContainer>
    </main>
  );
  return (
    <Shell bar={bar} ariaLabel="Workspace" testId="shell">
      {navigation ? <Navigation fill>{content}</Navigation> : content}
    </Shell>
  );
};

const expectDocumentStill = async (canvasElement: HTMLElement) => {
  const document = canvasElement.ownerDocument;
  await expect(document.scrollingElement?.scrollTop).toBe(0);
  await expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(
    window.innerHeight,
  );
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
};

const checkConsole = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const panel = await canvas.findByRole('group', { name: 'Entries' });
  const banner = canvas.getByRole('banner');
  const top = banner.getBoundingClientRect().top;
  await expect(panel.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    window.innerHeight,
  );
  await expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
  await expect(canvas.queryByRole('group', { name: 'Workspace' })).toBeNull();
  canvas.getByRole('button', { name: 'Entry 60' }).focus();
  await expect(panel.scrollTop).toBeGreaterThan(0);
  await expect(banner.getBoundingClientRect().top).toBe(top);
  const navigation = canvas.queryByRole('navigation');
  if (navigation) {
    canvas.getByRole('button', { name: 'Section 60' }).focus();
    await expect(navigation.scrollTop).toBeGreaterThan(0);
    await expect(navigation.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      window.innerHeight,
    );
  }
  await expectDocumentStill(canvasElement);
};

export const ConsoleWithSidebar: Story = {
  globals: { viewport: { value: 'reference', isRotated: false } },
  render: () => <Console />,
  play: checkConsole,
};
export const ConsoleAtLaptop: Story = {
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => <Console />,
  play: checkConsole,
};
export const ConsoleWithoutSidebar: Story = {
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => <Console navigation={false} />,
  play: checkConsole,
};

const checkBodyScrolling = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const body = await canvas.findByRole('group', { name: 'Workspace' });
  const banner = canvas.getByRole('banner');
  const top = banner.getBoundingClientRect().top;
  await expect(body).toHaveAttribute('tabindex', '0');
  canvas.getByRole('button', { name: 'Entry 60' }).focus();
  await expect(body.scrollTop).toBeGreaterThan(0);
  await expect(banner.getBoundingClientRect().top).toBe(top);
  const navigation = canvas.queryByRole('navigation');
  if (navigation && window.innerWidth >= 1024) {
    await expect(navigation.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      banner.getBoundingClientRect().bottom,
    );
    canvas.getByRole('button', { name: 'Section 60' }).focus();
    await expect(navigation.scrollTop).toBeGreaterThan(0);
    await expect(navigation.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      window.innerHeight,
    );
  }
  await expectDocumentStill(canvasElement);
};
export const Page: Story = {
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => (
    <Shell mode="page" bar={bar} ariaLabel="Workspace">
      <Navigation>
        <main>
          <Entries />
        </main>
      </Navigation>
    </Shell>
  ),
  play: checkBodyScrolling,
};
export const Stacked: Story = {
  globals: { viewport: { value: 'stacked', isRotated: false } },
  render: () => <Console />,
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const navigation = canvas.getByRole('navigation');
    const heading = canvas.getByRole('heading', { name: 'Entries' });
    await expect(heading.getBoundingClientRect().top).toBeGreaterThan(
      navigation.getBoundingClientRect().bottom,
    );
    await checkBodyScrolling(context);
  },
};
export const ReachabilityFallback: Story = {
  globals: { viewport: { value: 'short', isRotated: false } },
  render: () => (
    <Shell bar={bar} ariaLabel="Workspace">
      <main>
        <Stack gap="stack">
          <H2>Fixed content</H2>
          <P>
            At reference sizes these fields fit. Short windows or enlarged text
            make the body scroll while the bar stays visible.
          </P>
          {[1, 2, 3, 4].map((field) => (
            <Input
              key={field}
              label={`Field ${field}`}
              name={`field-${field}`}
            />
          ))}
          <Button>Entry 60</Button>
        </Stack>
      </main>
    </Shell>
  ),
  play: checkBodyScrolling,
};

export const StandaloneSidebarFill: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The frame here represents an independently allocated parent, not another viewport layout API. No Shell or measured navigation bound is involved. Its enclosing scroller owns narrow-screen and short-frame fallback.',
      },
    },
  },
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => (
    <div style={{ height: '24rem', overflow: 'auto' }}>
      <Navigation fill>
        <main style={{ display: 'contents' }}>
          <ScrollContainer axis="vertical" ariaLabel="Entries">
            <Entries />
          </ScrollContainer>
        </main>
      </Navigation>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByRole('group', { name: 'Entries' });
    const navigation = canvas.getByRole('navigation');
    await expect(panel.clientHeight).toBeLessThanOrEqual(384);
    await expect(navigation.clientHeight).toBeLessThanOrEqual(384);
    canvas.getByRole('button', { name: 'Section 60' }).focus();
    await expect(navigation.scrollTop).toBeGreaterThan(0);
    canvas.getByRole('button', { name: 'Entry 60' }).focus();
    await expect(panel.scrollTop).toBeGreaterThan(0);
  },
};

export const WrappedBar: Story = {
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => (
    <Shell
      ariaLabel="Workspace"
      bar={
        <Header
          status={'A long translated status readout with facts that must remain visible. '.repeat(
            12,
          )}
          action={<Button>Run</Button>}
        />
      }
    >
      <main style={{ display: 'contents' }}>
        <ScrollContainer ariaLabel="Entries" axis="vertical">
          <Entries />
        </ScrollContainer>
      </main>
    </Shell>
  ),
  play: checkConsole,
};

export const KeyboardReachability: Story = {
  globals: { viewport: { value: 'laptop', isRotated: false } },
  render: () => <Console navigation={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const last = canvas.getByRole('button', { name: 'Entry 60' });
    canvas.getByRole('button', { name: 'Entry 59' }).focus();
    await userEvent.tab();
    await expect(last).toHaveFocus();
    await waitFor(() =>
      expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        window.innerHeight,
      ),
    );
    await expectDocumentStill(canvasElement);
  },
};
