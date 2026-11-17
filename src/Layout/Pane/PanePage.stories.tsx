import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Cluster,
  ColumnLayout,
  H1,
  H2,
  Header,
  Input,
  P,
  Pane,
  Screen,
  ScrollContainer,
  Shell,
  Stack,
  Stepper,
} from 'index';
import { type CSSProperties, useEffect, useState } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof Pane.Root> = {
  title: 'Layout/Pane Page',
  component: Pane.Root,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Choose frame="page" when the bounded area is the page content itself. It keeps Pane's allocation and scroll ownership, with no border or box inset. Only a present Foot draws a rule, using the existing rule colour and one-pixel structural thickness. Slot gaps, including Screen's compact gap, remain; the same gap separates the rule from Foot content. The default frame="panel" keeps the existing enclosure. Switching frames preserves DOM, focus and form state. See StableSetup for Shell + Screen + Stepper + a page Pane with three filled columns and bottom acts. The composition uses Stepper's existing default presentation; its inline presentation belongs to #182. Whole-screen inventory fit and product visual fidelity remain consumer-owned.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
const entries = Array.from({ length: 60 }, (_, index) => `Entry ${index + 1}`);

const PageFrame = () => {
  const [isLong, setIsLong] = useState(false);
  const [hasFoot, setHasFoot] = useState(true);
  const [grow$] = useState(() => new Subject<void>());
  const [foot$] = useState(() => new Subject<void>());
  useEffect(() => {
    const grow = grow$.subscribe(() => setIsLong((value) => !value));
    const foot = foot$.subscribe(() => setHasFoot((value) => !value));
    return () => {
      grow.unsubscribe();
      foot.unsubscribe();
    };
  }, [grow$, foot$]);
  return (
    <Shell bar={undefined} ariaLabel="Workspace body">
      <Pane.Root frame="page" testId="page">
        <Pane.Head testId="head">
          <H2>Available entries</H2>
          <Button onClick$={grow$}>Change body length</Button>
          <Button onClick$={foot$}>Toggle foot</Button>
        </Pane.Head>
        <Pane.Body ariaLabel="Entries" testId="body">
          <Stack>
            {entries.slice(0, isLong ? 60 : 1).map((entry) => (
              <Input key={entry} label={entry} name={entry} />
            ))}
          </Stack>
        </Pane.Body>
        {hasFoot && (
          <Pane.Foot placement="bottom" testId="foot">
            <Button>Confirm</Button>
          </Pane.Foot>
        )}
      </Pane.Root>
    </Shell>
  );
};

const checkPageEdges = async (root: HTMLElement) => {
  const style = getComputedStyle(root);
  for (const edge of ['Top', 'Right', 'Bottom', 'Left'] as const) {
    await expect(style[`border${edge}Width`]).toBe('0px');
    await expect(style[`padding${edge}`]).toBe('0px');
  }
  const box = root.getBoundingClientRect();
  await expect(root.clientWidth).toBeCloseTo(box.width, 0);
  await expect(root.clientHeight).toBeCloseTo(box.height, 0);
};

export const PageFrameGeometry: Story = {
  render: () => <PageFrame />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId('page');
    await checkPageEdges(root);
    const foot = canvas.getByTestId('foot');
    const style = getComputedStyle(foot);
    await expect(style.borderTopWidth).toBe('1px');
    const rule = canvasElement.ownerDocument.createElement('span');
    rule.style.color = getComputedStyle(root).getPropertyValue('--color-rule');
    await expect(style.borderTopColor).toBe(rule.style.color);
    const bottom = root.getBoundingClientRect().bottom;
    const footTop = foot.getBoundingClientRect().top;
    const headTop = canvas.getByTestId('head').getBoundingClientRect().top;
    await expect(foot.getBoundingClientRect().bottom).toBe(bottom);
    await expect(canvas.queryByRole('group', { name: 'Entries' })).toBeNull();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change body length' }),
    );
    const body = await canvas.findByRole('group', { name: 'Entries' });
    await expect(body).toHaveAttribute('tabindex', '0');
    await expect(foot.getBoundingClientRect().top).toBe(footTop);
    await expect(foot.getBoundingClientRect().bottom).toBe(bottom);
    await userEvent.tab();
    await userEvent.tab();
    await expect(body).toHaveFocus();
    await expect(body.matches(':focus-visible')).toBe(true);
    await expect(getComputedStyle(body).outlineStyle).toBe('solid');
    await expect(
      Number.parseFloat(getComputedStyle(body).outlineWidth),
    ).toBeGreaterThan(0);
    const last = canvas.getByRole('textbox', { name: 'Entry 60' });
    last.focus();
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await expect(last).toHaveFocus();
    await expect(last.matches(':focus-visible')).toBe(true);
    const ring =
      Number.parseFloat(getComputedStyle(last).outlineWidth) +
      Number.parseFloat(getComputedStyle(last).outlineOffset);
    await expect(
      last.getBoundingClientRect().bottom + ring,
    ).toBeLessThanOrEqual(body.getBoundingClientRect().bottom + 1);
    await expect(body.scrollTop).toBeGreaterThan(0);
    await expect(canvas.getByTestId('head').getBoundingClientRect().top).toBe(
      headTop,
    );
    await expect(foot.getBoundingClientRect().top).toBe(footTop);
    await expect(root.scrollTop).toBe(0);
    await expect(
      canvas.queryByRole('group', { name: 'Workspace body' }),
    ).toBeNull();
    await expect(canvasElement.ownerDocument.scrollingElement?.scrollTop).toBe(
      0,
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change body length' }),
    );
    await waitFor(() =>
      expect(canvas.queryByRole('group', { name: 'Entries' })).toBeNull(),
    );
    await expect(foot.getBoundingClientRect().top).toBe(footTop);
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle foot' }));
    await expect(canvas.queryByTestId('foot')).toBeNull();
    await checkPageEdges(root);
    for (const child of root.children) {
      await expect(getComputedStyle(child).borderTopWidth).toBe('0px');
      await expect(getComputedStyle(child).borderBottomWidth).toBe('0px');
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle foot' }));
    await expect(canvas.getByTestId('foot').getBoundingClientRect().top).toBe(
      footTop,
    );
  },
};

export const ChildOwnedScroll: Story = {
  render: () => (
    <Shell bar={undefined} ariaLabel="Workspace body">
      <Pane.Root frame="page" testId="page">
        <Pane.Head>
          <H2>Available entries</H2>
        </Pane.Head>
        <Pane.Body
          scrollOwner="child"
          ariaLabel="Unused body name"
          testId="body"
        >
          <ScrollContainer ariaLabel="Entries" axis="vertical">
            <Stack>
              {entries.map((entry) => (
                <Button key={entry} variant="plain">
                  {entry}
                </Button>
              ))}
            </Stack>
          </ScrollContainer>
        </Pane.Body>
        <Pane.Foot placement="bottom" testId="foot">
          <Button>Confirm</Button>
        </Pane.Foot>
      </Pane.Root>
    </Shell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId('page');
    await checkPageEdges(root);
    const body = canvas.getByTestId('body');
    await expect(body).not.toHaveAttribute('tabindex');
    await expect(body).not.toHaveAttribute('role');
    await expect(getComputedStyle(body).overflow).toBe('visible');
    const scroll = await canvas.findByRole('group', { name: 'Entries' });
    await expect(scroll).toBe(body.firstElementChild);
    await expect(scroll).toHaveAttribute('tabindex', '0');
    const foot = canvas.getByTestId('foot');
    const footTop = foot.getBoundingClientRect().top;
    canvas.getByRole('button', { name: 'Entry 60' }).focus();
    await expect(scroll.scrollTop).toBeGreaterThan(0);
    await expect(body.scrollTop).toBe(0);
    await expect(foot.getBoundingClientRect().top).toBe(footTop);
    await expect(foot.getBoundingClientRect().bottom).toBe(
      root.getBoundingClientRect().bottom,
    );
    await expect(canvas.getAllByRole('group')).toHaveLength(1);
  },
};

const setupTheme = {
  '--setup-column-minimum': '12rem',
} as CSSProperties;

const SetupPane = ({ count }: { count: number }) => (
  <Pane.Root frame="page" testId="page">
    <Pane.Head testId="pane-head">
      <P>Choose your session details.</P>
    </Pane.Head>
    <Pane.Body scrollOwner="child" ariaLabel="Unused body name">
      <ColumnLayout.Root fill testId="setup-columns">
        <ColumnLayout.Column
          weight={1}
          minWidth="--setup-column-minimum"
          testId="preview-column"
        >
          <ScrollContainer ariaLabel="Preview" axis="vertical">
            <Stack>
              <H2>Preview</H2>
              <Input label="Name" name="name" />
              <Button>Shuffle</Button>
            </Stack>
          </ScrollContainer>
        </ColumnLayout.Column>
        <ColumnLayout.Column
          weight={1}
          minWidth="--setup-column-minimum"
          testId="details-column"
        >
          <ScrollContainer ariaLabel="Details" axis="vertical">
            <Stack>
              <H2>Details</H2>
              {entries.slice(0, count).map((entry) => (
                <P key={entry}>{entry} detail</P>
              ))}
            </Stack>
          </ScrollContainer>
        </ColumnLayout.Column>
        <ColumnLayout.Column
          weight={2}
          minWidth="--setup-column-minimum"
          head={<H2>Gallery</H2>}
          testId="gallery-column"
        >
          <ScrollContainer ariaLabel="Gallery" axis="vertical">
            <Stack>
              {entries.slice(0, count).map((entry) => (
                <P key={entry}>{entry} artwork</P>
              ))}
            </Stack>
          </ScrollContainer>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Pane.Body>
    <Pane.Foot placement="bottom" testId="foot">
      <Cluster justify="between">
        <Button variant="ghost">Return</Button>
        <Button>Start</Button>
      </Cluster>
    </Pane.Foot>
  </Pane.Root>
);

const Setup = ({
  spacing = 'comfortable',
}: {
  spacing?: 'comfortable' | 'compact';
}) => {
  const [active$] = useState(() => new BehaviorSubject('label'));
  return (
    <div style={setupTheme}>
      <Shell
        bar={<Header status="Session workspace" />}
        ariaLabel="Workspace body"
      >
        <Screen spacing={spacing} heading={<H1>Session setup</H1>}>
          <Stepper.Root
            label="Setup steps"
            active$={active$}
            onSelect$={active$}
          >
            <Stepper.List testId="step-row">
              <Stepper.Step
                value="label"
                label="Label"
                status="open"
                valueText="Choose a name"
              />
              <Stepper.Step
                value="facts"
                label="Facts"
                status="open"
                valueText="Choose details"
              />
              <Stepper.Step
                value="look"
                label="Look"
                status="open"
                valueText="Choose artwork"
              />
            </Stepper.List>
            <Stepper.Panel value="label">
              <SetupPane count={1} />
            </Stepper.Panel>
            <Stepper.Panel value="facts">
              <SetupPane count={8} />
            </Stepper.Panel>
            <Stepper.Panel value="look">
              <SetupPane count={30} />
            </Stepper.Panel>
          </Stepper.Root>
        </Screen>
      </Shell>
    </div>
  );
};

const checkSetup = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const anchors = () =>
    [
      canvas.getByRole('heading', { name: 'Session setup' }),
      canvas.getByTestId('step-row'),
      canvas.getByRole('button', { name: 'Return' }),
      canvas.getByRole('button', { name: 'Start' }),
    ].map((element) => {
      const box = element.getBoundingClientRect();
      return [box.x, box.y, box.width, box.height];
    });
  const initial = anchors();
  for (const name of [
    'Facts Choose details',
    'Look Choose artwork',
    'Label Choose a name',
  ]) {
    await userEvent.click(canvas.getByRole('tab', { name }));
    await waitFor(() => expect(anchors()).toEqual(initial));
    const root = canvas.getByTestId('page');
    await checkPageEdges(root);
    await expect(root).not.toHaveAttribute('data-screen-unusable');
    await expect(
      canvas.getByTestId('foot').getBoundingClientRect().bottom,
    ).toBe(root.getBoundingClientRect().bottom);
    const columns = ['preview-column', 'details-column', 'gallery-column'].map(
      (id) => canvas.getByTestId(id).getBoundingClientRect(),
    );
    await expect(columns[0]?.top).toBe(columns[1]?.top);
    await expect(columns[1]?.top).toBe(columns[2]?.top);
    await expect(columns[0]?.height).toBeCloseTo(columns[1]?.height ?? 0, 0);
    await expect(columns[1]?.height).toBeCloseTo(columns[2]?.height ?? 0, 0);
    await expect(columns[2]?.width ?? 0).toBeCloseTo(
      2 * (columns[0]?.width ?? 0),
      0,
    );
    await expect(columns[0]?.height ?? 0).toBeGreaterThan(100);
  }
  await expect(
    canvas.queryByRole('group', { name: 'Workspace body' }),
  ).toBeNull();
  await expect(canvasElement.ownerDocument.scrollingElement?.scrollTop).toBe(0);
};

export const StableSetup: Story = {
  render: () => <Setup />,
  play: checkSetup,
};
export const CompactSetup: Story = {
  render: () => <Setup spacing="compact" />,
  play: async (context) => {
    await checkSetup(context);
    const canvas = within(context.canvasElement);
    const root = canvas.getByTestId('page');
    const gap = Number.parseFloat(getComputedStyle(root).rowGap);
    const expected =
      Number.parseFloat(
        getComputedStyle(root).getPropertyValue('--space-pane-slot-compact'),
      ) * Number.parseFloat(getComputedStyle(root).fontSize);
    await expect(gap).toBe(expected);
    const head = canvas.getByTestId('pane-head').getBoundingClientRect();
    const body = root
      .querySelector('[data-pane-body]')
      ?.getBoundingClientRect();
    await expect((body?.top ?? 0) - head.bottom).toBeCloseTo(gap, 0);
    await expect(
      Number.parseFloat(
        getComputedStyle(canvas.getByTestId('foot')).paddingTop,
      ),
    ).toBe(gap);
  },
};

export const ScreenFallback: Story = {
  render: () => (
    <div data-testid="allocation" style={{ height: '600px', overflow: 'auto' }}>
      <Screen heading={<H1>Session setup</H1>}>
        <Pane.Root frame="page" testId="page">
          <Pane.Head>
            <H2>Session details</H2>
          </Pane.Head>
          <Pane.Body ariaLabel="Details">
            <Input label="Name" name="name" />
          </Pane.Body>
          <Pane.Foot placement="bottom" testId="foot">
            <Button>Start</Button>
          </Pane.Foot>
        </Pane.Root>
      </Screen>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const allocation = canvas.getByTestId('allocation');
    const root = canvas.getByTestId('page');
    const input = canvas.getByRole('textbox', { name: 'Name' });
    const foot = canvas.getByTestId('foot');
    await userEvent.type(input, 'Night Drive');
    (input as HTMLInputElement).setSelectionRange(2, 6);
    await expect(root).not.toHaveAttribute('data-screen-unusable');
    allocation.style.height = '120px';
    await waitFor(() => expect(root).toHaveAttribute('data-screen-unusable'));
    await expect(allocation.scrollHeight).toBeGreaterThan(
      allocation.clientHeight,
    );
    await waitFor(() =>
      expect(canvas.queryByRole('group', { name: 'Details' })).toBeNull(),
    );
    foot.scrollIntoView({ block: 'end' });
    await expect(foot.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      allocation.getBoundingClientRect().bottom + 1,
    );
    allocation.style.height = '600px';
    await waitFor(() =>
      expect(root).not.toHaveAttribute('data-screen-unusable'),
    );
    await expect(canvas.getByRole('textbox', { name: 'Name' })).toBe(input);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('Night Drive');
    await expect([
      (input as HTMLInputElement).selectionStart,
      (input as HTMLInputElement).selectionEnd,
    ]).toEqual([2, 6]);
    await expect(foot.getBoundingClientRect().bottom).toBe(
      root.getBoundingClientRect().bottom,
    );
    await checkPageEdges(root);
  },
};
