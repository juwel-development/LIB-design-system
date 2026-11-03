import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  H2,
  Header,
  P,
  Pane,
  ScrollContainer,
  Shell,
  Stack,
} from 'index';
import { expect, waitFor, within } from 'storybook/test';

const meta: Meta<typeof Pane.Root> = {
  title: 'Layout/Pane',
  component: Pane.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Pane takes its parent's allocated height, with a content-height Head and Foot and a shrinking Body. All three slots are optional; compose at most one of each in Head, Body, Foot order. Short body content does not stretch: the foot follows it and any spare room belongs to the root. In an unsized or stacked parent, the pane takes its content height and the enclosing page or Shell body scrolls.

The root paints the Box surface, foreground, border and inset roles. An optional non-empty name makes it an accessible group. Body requires a consumer-written ariaLabel and becomes a named keyboard stop only when overflowing (or while retaining focus). Native focus reveals body controls without moving a correctly bounded page; the shared focus ring has reserved room.

Body defaults to scrollOwner="body". Set scrollOwner="child" for one child that accepts an allocated height and owns scrolling: Body then contributes no overflow, group, tab stop or content wrapper. The child supplies its own accessible name and focus treatment; Body's ariaLabel is unused in that mode. No child identity is inspected. Do not put a bounded Table inside the default scrolling body: use child ownership so the Table's own wrapper scrolls both axes and retains its header.

Pending integrations: bounded Table #142 is not available, so its example and sticky-header verification remain outstanding. The ColumnLayout FillingPanes and StackedFillingColumns stories demonstrate two panes sharing an allocated height and releasing it when stacked (#145). ChildOwnedScroll demonstrates the existing ScrollContainer contract only; it does not stand in for the pending Table acceptance example. Release publication is deferred to the human release workflow.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
const entries = Array.from({ length: 60 }, (_, index) => index + 1);
const bar = <Header status="Workspace" action={<Button>Run</Button>} />;
const Entries = () => (
  <Stack>
    {entries.map((entry) => (
      <Button key={entry} variant="plain">
        Entry {entry}
      </Button>
    ))}
  </Stack>
);

const checkLongBody = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const body = await canvas.findByRole('group', { name: 'Entries' });
  const head = canvas.getByRole('heading', { name: 'Available entries' });
  const foot = canvas.getByRole('button', { name: 'Confirm' });
  const headTop = head.getBoundingClientRect().top;
  const footTop = foot.getBoundingClientRect().top;
  canvas.getByRole('button', { name: 'Entry 60' }).focus();
  await expect(body.scrollTop).toBeGreaterThan(0);
  await expect(head.getBoundingClientRect().top).toBe(headTop);
  await expect(foot.getBoundingClientRect().top).toBe(footTop);
  await expect(foot.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    window.innerHeight,
  );
  await expect(
    canvas.queryByRole('group', { name: 'Workspace body' }),
  ).toBeNull();
  await expect(canvasElement.ownerDocument.scrollingElement?.scrollTop).toBe(0);
};

export const LongBody: Story = {
  render: () => (
    <Shell bar={bar} ariaLabel="Workspace body">
      <Pane.Root name="Choice">
        <Pane.Head>
          <H2>Available entries</H2>
        </Pane.Head>
        <Pane.Body ariaLabel="Entries">
          <Entries />
        </Pane.Body>
        <Pane.Foot>
          <Button>Confirm</Button>
        </Pane.Foot>
      </Pane.Root>
    </Shell>
  ),
  play: checkLongBody,
};

export const ShortBody: Story = {
  render: () => (
    <Shell bar={bar} ariaLabel="Workspace body">
      <Pane.Root name="Choice">
        <Pane.Head>
          <H2>Available entries</H2>
        </Pane.Head>
        <Pane.Body ariaLabel="Entries" testId="body">
          <P>One entry is available.</P>
        </Pane.Body>
        <Pane.Foot testId="foot">
          <Button>Confirm</Button>
        </Pane.Foot>
      </Pane.Root>
    </Shell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('group', { name: 'Entries' })).toBeNull();
    const content = canvas
      .getByText('One entry is available.')
      .getBoundingClientRect();
    const body = canvas.getByTestId('body').getBoundingClientRect();
    const foot = canvas.getByTestId('foot').getBoundingClientRect();
    const ringRoom = Number.parseFloat(
      getComputedStyle(canvas.getByTestId('body').firstElementChild as Element)
        .paddingBottom,
    );
    await expect(body.bottom - content.bottom).toBeCloseTo(ringRoom, 0);
    await expect(foot.bottom).toBeLessThan(
      canvas.getByRole('group', { name: 'Choice' }).getBoundingClientRect()
        .bottom,
    );
  },
};

export const ChildOwnedScroll: Story = {
  render: () => (
    <Shell bar={bar} ariaLabel="Workspace body">
      <Pane.Root name="Choice">
        <Pane.Head>
          <H2>Available entries</H2>
        </Pane.Head>
        <Pane.Body scrollOwner="child" ariaLabel="Unused">
          <ScrollContainer ariaLabel="Entries" axis="vertical">
            <Entries />
          </ScrollContainer>
        </Pane.Body>
        <Pane.Foot>
          <Button>Confirm</Button>
        </Pane.Foot>
      </Pane.Root>
    </Shell>
  ),
  play: checkLongBody,
};

export const Stacked: Story = {
  render: () => (
    <Shell mode="page" bar={bar} ariaLabel="Workspace body">
      <Stack>
        <Pane.Root name="First pane">
          <Pane.Head>
            <H2>Available entries</H2>
          </Pane.Head>
          <Pane.Body ariaLabel="Entries">
            <Entries />
          </Pane.Body>
          <Pane.Foot>
            <Button>Confirm</Button>
          </Pane.Foot>
        </Pane.Root>
        <Pane.Root name="Second pane">
          <Pane.Body ariaLabel="Message">
            <P>A second short message.</P>
          </Pane.Body>
        </Pane.Root>
      </Stack>
    </Shell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const holder = await canvas.findByRole('group', { name: 'Workspace body' });
    await expect(canvas.queryByRole('group', { name: 'Entries' })).toBeNull();
    canvas.getByRole('button', { name: 'Confirm' }).focus();
    await expect(holder.scrollTop).toBeGreaterThan(0);
    await expect(canvasElement.ownerDocument.scrollingElement?.scrollTop).toBe(
      0,
    );
  },
};

export const DynamicContent: Story = {
  render: () => (
    <Shell bar={bar} ariaLabel="Workspace body">
      <Pane.Root name="Diagram">
        <Pane.Body ariaLabel="Diagram content" scrollOwner={null} testId="body">
          <svg width="100" height="40" role="img" aria-label="Growing diagram">
            <title>Growing diagram</title>
          </svg>
        </Pane.Body>
      </Pane.Root>
    </Shell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole('group', { name: 'Diagram content' }),
    ).toBeNull();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const diagram = canvas.getByRole('img', { name: 'Growing diagram' });
    diagram.setAttribute('width', String(window.innerWidth * 2));
    await waitFor(() =>
      expect(
        canvas.getByRole('group', { name: 'Diagram content' }),
      ).toHaveAttribute('tabindex', '0'),
    );
    const body = canvas.getByTestId('body');
    body.scrollLeft = 100;
    await expect(body.scrollLeft).toBeGreaterThan(0);
    diagram.setAttribute('width', '100');
    await waitFor(() =>
      expect(
        canvas.queryByRole('group', { name: 'Diagram content' }),
      ).toBeNull(),
    );
    await expect(
      canvasElement.ownerDocument.scrollingElement?.scrollWidth,
    ).toBe(window.innerWidth);
  },
};
