import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, P, Pane, Stack, Stepper } from 'index';
import { type FunctionComponent, useEffect, useState } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';

const meta: Meta<typeof Stepper.Root> = {
  title: 'Interaction/Stepper',
  component: Stepper.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Compose Root, one List of Step controls, and one Panel per stable value. Arrays and fragments are supported in List; put Step directly in it, without wrapper components or host elements. Numbering follows rendered order. Label, valueText and optional statusContent are consumer wording; slot content must be noninteractive. Status content is visible and contributes the accessible description. Without it no spoken done/open/blocked status is promised. Selection uses tab/tabpanel semantics independently of status.

Root observes active$ and emits requests through onSelect$. The consumer must supply a valid identity; before the current input first emits, no selection or panel is invented. Source replacement clears the previous selection until an emission. Subscriptions are torn down on replacement and unmount; streams are never completed or written to. Left/Right automatically requests the adjacent step with wraparound; blocked and done steps remain selectable. Requests do not change the display until the input responds.

Only active panel content mounts. Persist form state in consumer-owned RxJS and supply it again on remount. There is no validation, navigation policy, Next button or state cache.

Root fills a definite parent height. List and Panels must be direct DOM children of Root and a height-accepting child such as Pane must be directly inside Panel. List remains visible; Panel passes the remaining height without scrolling. The fixed row and Pane's fixed content must fit and leave usable body space. An unsized parent grows naturally. No height or style prop is needed.

The provisional narrow layout keeps one connected row: text wraps to its longest word, then the row scrolls without clipping text or widening the page. Focus reveals each step. Future research will reconsider Stepper-specific responsive alternatives. A check, ordinal number or blocked mark distinguishes status; the underline distinguishes selection independently, including forced colours. Test with your platform's forced-colours mode.

Theme tokens: --step-marker-size (2em, enough for the marker text), --step-inset-inline (1em), --step-inset-block (0.5em), --step-connector-thickness (1px) and --step-selection-thickness (2px). Insets must be nonnegative and thicknesses positive. Existing space-stack, label/small typography, secondary family, surface, foreground, border, radius-control and shared focus-ring roles complete the presentation.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

const SessionField: FunctionComponent<{
  session$: BehaviorSubject<string>;
}> = ({ session$ }) => (
  <Input
    label="Session name"
    name="session"
    defaultValue={session$.value}
    onInput$={session$}
  />
);

const Booking: FunctionComponent = () => {
  const [active$] = useState(() => new BehaviorSubject('songs'));
  const [onSelect$] = useState(() => new Subject<string>());
  const [session$] = useState(() => new BehaviorSubject('Evening session'));
  useEffect(() => {
    const subscription = onSelect$.subscribe((value) => active$.next(value));
    return () => subscription.unsubscribe();
  }, [active$, onSelect$]);
  return (
    <Stepper.Root
      active$={active$}
      onSelect$={onSelect$}
      label="Recording booking"
      testId="stepper"
    >
      <Stepper.List testId="step-row">
        <Stepper.Step
          value="songs"
          label="Songs"
          status="done"
          valueText="2 Songs"
          statusContent="Complete"
        />
        <Stepper.Step
          value="dates"
          label="Dates"
          status="open"
          valueText="20 Apr · 4 days"
        />
        <Stepper.Step
          value="studio"
          label="Studio"
          status="done"
          valueText="Abbey Road Studio"
          statusContent="Complete"
        />
        <Stepper.Step
          value="producer"
          label="Producer"
          status="open"
          valueText="No Producer"
        />
        <Stepper.Step
          value="bill"
          label="Bill"
          status="blocked"
          valueText="$1,104"
          statusContent="Confirm dates first"
        />
      </Stepper.List>
      <Stepper.Panel value="songs">
        <Pane.Root name="Songs pane">
          <Pane.Head>
            <SessionField session$={session$} />
          </Pane.Head>
          <Pane.Body ariaLabel="Song choices">
            <Stack>
              {Array.from(
                { length: 30 },
                (_, index) => `Song ${index + 1}: recording notes`,
              ).map((song) => (
                <P key={song}>{song}</P>
              ))}
            </Stack>
          </Pane.Body>
          <Pane.Foot>
            <P>2 songs selected</P>
          </Pane.Foot>
        </Pane.Root>
      </Stepper.Panel>
      <Stepper.Panel value="dates">
        <P>Choose and confirm your recording dates.</P>
      </Stepper.Panel>
      <Stepper.Panel value="studio">
        <P>Abbey Road Studio remains complete when revisited.</P>
      </Stepper.Panel>
      <Stepper.Panel value="producer">
        <P>No producer is required.</P>
      </Stepper.Panel>
      <Stepper.Panel value="bill">
        <P>Confirm dates before paying. You can still view the bill.</P>
      </Stepper.Panel>
    </Stepper.Root>
  );
};

export const FiveSteps: Story = {
  render: () => (
    <div style={{ width: '1280px', maxWidth: '100%', height: '600px' }}>
      <Booking />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The holder is 1280px wide when space permits, capped by the canvas width. Storybook padding reduces that width in a 1280px viewport. The parent is 600px high; only Pane.Body scrolls.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = await canvas.findByRole('textbox', { name: 'Session name' });
    await userEvent.clear(field);
    await userEvent.type(field, 'Saved booking');
    await userEvent.click(canvas.getByRole('tab', { name: 'Bill $1,104' }));
    await expect(canvas.queryByRole('textbox')).toBeNull();
    await expect(
      canvas.getByRole('tab', { name: 'Bill $1,104' }),
    ).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(canvas.getByRole('tab', { name: 'Songs 2 Songs' }));
    await expect(canvas.getByRole('textbox')).toHaveValue('Saved booking');
    const root = canvas.getByTestId('stepper');
    await expect(root.getBoundingClientRect().height).toBe(600);
    await expect(root.scrollHeight).toBe(root.clientHeight);
    const panel = canvas.getByRole('tabpanel');
    await expect(panel.scrollHeight).toBe(panel.clientHeight);
    const body = canvas.getByRole('group', { name: 'Song choices' });
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await expect(body.getBoundingClientRect().bottom).toBeLessThan(
      root.getBoundingClientRect().bottom,
    );
  },
};
export const Narrow: Story = {
  render: () => (
    <div style={{ width: '320px', maxWidth: '100%', height: '600px' }}>
      <Booking />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('textbox', { name: 'Session name' });
    const row = canvas.getByRole('tablist');
    await expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
    await userEvent.click(canvas.getByRole('tab', { name: 'Songs 2 Songs' }));
    await userEvent.keyboard('{ArrowLeft}');
    const bill = canvas.getByRole('tab', { name: 'Bill $1,104' });
    await expect(bill).toHaveFocus();
    await expect(bill.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      row.getBoundingClientRect().left,
    );
    await expect(bill.getBoundingClientRect().right).toBeLessThanOrEqual(
      row.getBoundingClientRect().right,
    );
    await expect(
      canvasElement.ownerDocument.documentElement.scrollWidth,
    ).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
  },
};
export const NaturalHeight: Story = {
  render: () => <Booking />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId('stepper');
    const finalSong = await canvas.findByText('Song 30: recording notes');
    await expect(finalSong.getBoundingClientRect().bottom).toBeLessThan(
      root.getBoundingClientRect().bottom,
    );
    await expect(root.scrollHeight).toBe(root.clientHeight);
    await expect(
      canvas.queryByRole('group', { name: 'Song choices' }),
    ).toBeNull();
  },
};
export const ForcedColours: Story = {
  ...FiveSteps,
  play: async (context) => {
    await FiveSteps.play?.(context);
    const canvas = within(context.canvasElement);
    const selected = canvas.getByRole('tab', { selected: true });
    const unselected = canvas.getByRole('tab', { name: 'Bill $1,104' });
    if (window.matchMedia('(forced-colors: active)').matches) {
      await expect(getComputedStyle(unselected).borderBottomWidth).toBe('0px');
      await expect(getComputedStyle(selected).borderBottomWidth).not.toBe(
        '0px',
      );
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enable forced colours in the browser or operating system. Check the done checkmark, open ordinal and blocked mark remain distinct, and selected underline and keyboard outline remain visible independently.',
      },
    },
  },
};
