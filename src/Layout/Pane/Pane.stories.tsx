import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  ColumnLayout,
  H2,
  Header,
  P,
  Pane,
  ScrollContainer,
  Shell,
  Stack,
  Stepper,
  Table,
} from 'index';
import { type CSSProperties, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';

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

Body defaults to scrollOwner="body". Set scrollOwner="child" for one child that accepts an allocated height and owns scrolling: Body then contributes no overflow, group, tab stop or content wrapper. The child supplies its own accessible name and focus treatment; Body's ariaLabel is unused in that mode. No child identity is inspected. Child mode supplies a shrinking flex allocation, including inside a content-extent Dialog. Dialog can hold this Pane with a fixed Foot summary: it owns whole-dialog fallback when a readable Table viewport cannot fit and restores bounds when space returns. Do not put a bounded Table inside the default scrolling body: use child ownership so the Table's own wrapper scrolls both axes and retains its header.

BoundedTable demonstrates the Table as the sole scroll owner with pinned Pane head/foot and Table header. SteppedBoundedTable passes the same allocation through a Stepper panel inside filled, capped columns. The ColumnLayout FillingPanes and StackedFillingColumns stories demonstrate two panes sharing an allocated height and releasing it when stacked (#145). ChildOwnedScroll demonstrates delegation to ScrollContainer for ordinary content. Release publication is deferred to the human release workflow.`,
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

const RosterPane = () => (
  <Pane.Root name="Roster pane">
    <Pane.Head>
      <H2>Available artists</H2>
    </Pane.Head>
    <Pane.Body
      scrollOwner="child"
      ariaLabel="Unused body name"
      testId="table-body"
    >
      <Table.Root
        bounded
        caption="Artist roster"
        columns={[{ weight: 2 }, { weight: 1 }]}
      >
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell scope="col">Artist</Table.HeaderCell>
            <Table.HeaderCell scope="col">Action</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {entries.map((entry) => (
            <Table.Row key={entry}>
              <Table.HeaderCell scope="row">Artist {entry}</Table.HeaderCell>
              <Table.Cell>
                <Button variant="plain">Open artist {entry}</Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Pane.Body>
    <Pane.Foot>
      <Button>Confirm roster</Button>
    </Pane.Foot>
  </Pane.Root>
);

const checkBoundedTable = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const wrapper = await canvas.findByRole('group', { name: 'Artist roster' });
  const head = canvas.getByRole('heading', { name: 'Available artists' });
  const foot = canvas.getByRole('button', { name: 'Confirm roster' });
  const header = canvas.getByRole('columnheader', { name: 'Artist' });
  const headTop = head.getBoundingClientRect().top;
  const footTop = foot.getBoundingClientRect().top;
  const last = canvas.getByRole('button', { name: 'Open artist 60' });
  last.focus();
  await waitFor(() => expect(wrapper.scrollTop).toBeGreaterThan(0));
  await userEvent.tab({ shift: true });
  await userEvent.tab();
  await expect(last).toHaveFocus();
  await expect(last.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    header.getBoundingClientRect().bottom,
  );
  await expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    wrapper.getBoundingClientRect().bottom,
  );
  const pinnedTop =
    wrapper.getBoundingClientRect().top +
    wrapper.clientTop +
    Number.parseFloat(getComputedStyle(wrapper).paddingTop);
  await expect(header.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    pinnedTop,
  );
  await expect(header.getBoundingClientRect().top).toBeLessThanOrEqual(
    pinnedTop + 1,
  );
  await expect(head.getBoundingClientRect().top).toBe(headTop);
  await expect(foot.getBoundingClientRect().top).toBe(footTop);
  await expect(foot.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    window.innerHeight,
  );
  await expect(
    canvas.queryByRole('group', { name: 'Unused body name' }),
  ).toBeNull();
  await expect(
    canvas.queryByRole('group', { name: 'Workspace body' }),
  ).toBeNull();
  await expect(canvas.getByTestId('table-body')).not.toHaveAttribute(
    'tabindex',
  );
  await expect(canvasElement.ownerDocument.scrollingElement?.scrollTop).toBe(0);
  await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBe(
    window.innerWidth,
  );
  const ancestors = [];
  for (
    let element = wrapper.parentElement;
    element;
    element = element.parentElement
  )
    ancestors.push(element);
  for (const element of ancestors)
    await expect(element.scrollHeight).toBeLessThanOrEqual(
      element.clientHeight + 1,
    );
};

export const BoundedTable: Story = {
  render: () => (
    <Shell bar={bar} ariaLabel="Workspace body">
      <RosterPane />
    </Shell>
  ),
  play: checkBoundedTable,
};

const SteppedRoster = () => {
  const [active$] = useState(() => new BehaviorSubject('artists'));
  return (
    <div
      style={
        {
          '--roster-minimum': '24rem',
          '--roster-maximum': '60rem',
          '--summary-minimum': '12rem',
          '--summary-maximum': '20rem',
          height: '100dvh',
        } as CSSProperties
      }
    >
      <Shell bar={bar} ariaLabel="Workspace body">
        <ColumnLayout.Root fill gap="stack">
          <ColumnLayout.Column
            weight={3}
            minWidth="--roster-minimum"
            maxWidth="--roster-maximum"
            testId="roster-column"
          >
            <Stepper.Root
              label="Roster planning"
              active$={active$}
              onSelect$={active$}
            >
              <Stepper.List>
                <Stepper.Step
                  value="artists"
                  label="Artists"
                  status="open"
                  valueText="60 available"
                />
                <Stepper.Step
                  value="review"
                  label="Review"
                  status="blocked"
                  valueText="Confirm artists first"
                />
              </Stepper.List>
              <Stepper.Panel value="artists">
                <RosterPane />
              </Stepper.Panel>
              <Stepper.Panel value="review">
                <P>Choose the artists before confirming this plan.</P>
              </Stepper.Panel>
            </Stepper.Root>
          </ColumnLayout.Column>
          <ColumnLayout.Column
            weight={1}
            minWidth="--summary-minimum"
            maxWidth="--summary-maximum"
          >
            <Pane.Root name="Summary">
              <Pane.Body ariaLabel="Plan summary">
                <P>Review the available artists and confirm your roster.</P>
              </Pane.Body>
            </Pane.Root>
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </Shell>
    </div>
  );
};

export const SteppedBoundedTable: Story = {
  render: () => <SteppedRoster />,
  play: async (context) => {
    await checkBoundedTable(context);
    const canvas = within(context.canvasElement);
    await expect(
      canvas.getByTestId('roster-column').getBoundingClientRect().width,
    ).toBeLessThanOrEqual(960);
    await userEvent.click(
      canvas.getByRole('tab', { name: 'Review Confirm artists first' }),
    );
    await expect(canvas.queryByRole('table')).toBeNull();
    await userEvent.keyboard('{ArrowLeft}');
    await canvas.findByRole('table', { name: 'Artist roster' });
    await checkBoundedTable(context);
  },
};
