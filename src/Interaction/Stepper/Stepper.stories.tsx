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

List defaults to presentation="stacked": markers above centred text with connectors. Opt into presentation="inline" for a few steps in a wide row with less height: markers sit beside the first label line, text is start-aligned, and there are no connectors. Both keep equal step shares. The active inline step additionally paints selected-surface; the bottom bar remains the non-colour selection cue in both presentations. Changing presentation preserves every node, focus and selection. There is no breakpoint switch.

The provisional narrow layout keeps one horizontal row: text wraps to its longest word, then the row scrolls without clipping text or widening the page. Focus reveals each step. Future research will reconsider Stepper-specific responsive alternatives. A check, ordinal number or blocked mark distinguishes status; the underline distinguishes selection independently, including forced colours. Test with your platform's forced-colours mode.

Theme tokens: --step-marker-size (2em, enough for the marker text), --step-inset-inline (1em), --step-inset-block (0.5em), --step-connector-thickness (1px) and --step-selection-thickness (2px). Insets must be nonnegative and thicknesses positive. Existing space-stack, label/small typography, secondary family, surface, selected-surface (inline active fill), foreground, border, radius-control and shared focus-ring roles complete the presentation.`,
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

const Setup: FunctionComponent<{
  presentation?: 'stacked' | 'inline';
  longText?: boolean;
}> = ({ presentation, longText }) => {
  const [active$] = useState(() => new BehaviorSubject('look'));
  const [onSelect$] = useState(() => new Subject<string>());
  const [requests, setRequests] = useState<string[]>([]);
  useEffect(() => {
    const subscription = onSelect$.subscribe((value) => {
      setRequests((previous) => [...previous, value]);
      active$.next(value);
    });
    return () => subscription.unsubscribe();
  }, [active$, onSelect$]);
  return (
    <>
      <Stepper.Root active$={active$} onSelect$={onSelect$} label="Label setup">
        <Stepper.List presentation={presentation}>
          <Stepper.Step
            value="label"
            label={
              longText
                ? 'Your independent record label / Dein unabhängiges Plattenlabel'
                : 'Your Label'
            }
            status="done"
            valueText={
              longText
                ? 'Label name and home market / Name und Heimatmarkt'
                : 'Label name · Home Market'
            }
          />
          <Stepper.Step
            value="facts"
            label={
              longText
                ? 'Your manager’s personal facts / Persönliche Angaben der Spielleitung'
                : 'Manager’s facts'
            }
            status="done"
            valueText={
              longText
                ? 'Name, gender and date of birth / Name, Geschlecht und Geburtsdatum'
                : 'Name · Gender · Birth date'
            }
          />
          <Stepper.Step
            value="look"
            label={
              longText
                ? 'Your manager’s individual appearance / Das Erscheinungsbild der Spielleitung'
                : 'Manager’s look'
            }
            status="open"
            valueText={
              longText
                ? 'Compose the complete appearance / Vollständiges Erscheinungsbild zusammenstellen'
                : 'Compose your face'
            }
            statusContent={
              longText ? 'Choose every detail / Wähle jedes Detail' : undefined
            }
          />
        </Stepper.List>
        <Stepper.Panel value="label">
          <P>Choose your label.</P>
        </Stepper.Panel>
        <Stepper.Panel value="facts">
          <P>Describe your manager.</P>
        </Stepper.Panel>
        <Stepper.Panel value="look">
          <P>Compose your manager.</P>
        </Stepper.Panel>
      </Stepper.Root>
      <output aria-label="Requested steps">{requests.join(',')}</output>
    </>
  );
};

const measureInline = async (row: HTMLElement): Promise<void> => {
  const tabs = within(row).getAllByRole('tab');
  const widths = tabs.map((tab) => tab.getBoundingClientRect().width);
  await expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
  for (const tab of tabs) {
    const marker = tab.querySelector('[aria-hidden]');
    const [labelId, valueId] = (
      tab.getAttribute('aria-labelledby') ?? ''
    ).split(' ');
    const label = row.ownerDocument.getElementById(labelId ?? '');
    const value = row.ownerDocument.getElementById(valueId ?? '');
    if (!marker || !label || !value)
      throw new Error('Expected step marker, label and value');
    const markerBox = marker.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    const lineHeight = Number.parseFloat(getComputedStyle(label).lineHeight);
    await expect(markerBox.right).toBeLessThan(labelBox.left);
    await expect(
      Math.abs(
        markerBox.top + markerBox.height / 2 - labelBox.top - lineHeight / 2,
      ),
    ).toBeLessThan(1);
    await expect(value.getBoundingClientRect().left).toBe(labelBox.left);
    await expect(getComputedStyle(tab).textAlign).toBe('start');
    const descriptionId = tab.getAttribute('aria-describedby');
    if (descriptionId) {
      const description = row.ownerDocument.getElementById(descriptionId);
      await expect(description?.getBoundingClientRect().left).toBe(
        labelBox.left,
      );
    }
    const connector = getComputedStyle(tab, '::after');
    await expect(
      connector.display === 'none' || connector.content === 'none',
    ).toBe(true);
  }
};

const exerciseInlineKeyboard = async (
  row: HTMLElement,
  canvasElement: HTMLElement,
): Promise<void> => {
  const canvas = within(canvasElement);
  const tabs = within(row).getAllByRole('tab');
  const active = within(row).getByRole('tab', { selected: true });
  const sizes = tabs.map((tab) => ({
    width: tab.getBoundingClientRect().width,
    height: tab.getBoundingClientRect().height,
  }));
  const document = canvasElement.ownerDocument;
  (document.activeElement as HTMLElement | null)?.blur();
  await userEvent.tab();
  await expect(active).toHaveFocus();
  await expect(active.matches(':focus-visible')).toBe(true);
  await expect(getComputedStyle(active).outlineStyle).toBe('solid');
  await expect(
    Number.parseFloat(getComputedStyle(active).outlineWidth),
  ).toBeGreaterThan(0);
  for (const key of [
    '{ArrowRight}',
    '{ArrowLeft}',
    '{ArrowLeft}',
    '{ArrowLeft}',
    '{ArrowLeft}',
  ]) {
    await userEvent.keyboard(key);
    for (const [index, tab] of tabs.entries()) {
      await expect(tab.getBoundingClientRect().width).toBe(sizes[index]?.width);
      await expect(tab.getBoundingClientRect().height).toBe(
        sizes[index]?.height,
      );
      const style = getComputedStyle(tab);
      if (tab.getAttribute('aria-selected') === 'true') {
        await expect(
          Number.parseFloat(style.borderBottomWidth),
        ).toBeGreaterThan(0);
        await expect(style.borderBottomColor).not.toBe('rgba(0, 0, 0, 0)');
        if (!window.matchMedia('(forced-colors: active)').matches) {
          const probe = document.createElement('span');
          probe.style.backgroundColor = 'var(--color-selected-surface)';
          row.append(probe);
          await expect(style.backgroundColor).toBe(
            getComputedStyle(probe).backgroundColor,
          );
          probe.remove();
        }
      } else if (!window.matchMedia('(forced-colors: active)').matches) {
        await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      }
    }
    const focused = within(row).getByRole('tab', { selected: true });
    await expect(focused).toHaveFocus();
    await expect(focused.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      row.getBoundingClientRect().left,
    );
    await expect(focused.getBoundingClientRect().right).toBeLessThanOrEqual(
      row.getBoundingClientRect().right,
    );
  }
  await expect(tabs[2]).toHaveFocus();
  await expect(
    canvas.getByRole('status', { name: 'Requested steps' }),
  ).toHaveTextContent('label,look,facts,label,look');
};

export const SetupPresentations: Story = {
  render: () => (
    <Stack>
      <section aria-label="Stacked setup">
        <Setup />
      </section>
      <section aria-label="Inline setup">
        <Setup presentation="inline" />
      </section>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stacked = within(
      canvas.getByRole('region', { name: 'Stacked setup' }),
    ).getByRole('tablist');
    const inlineRegion = canvas.getByRole('region', { name: 'Inline setup' });
    const inline = within(inlineRegion).getByRole('tablist');
    await measureInline(inline);
    await expect(inline.getBoundingClientRect().height).toBeLessThan(
      stacked.getBoundingClientRect().height,
    );
    const selected = within(stacked).getByRole('tab', { selected: true });
    await expect(
      Number.parseFloat(getComputedStyle(selected).borderBottomWidth),
    ).toBeGreaterThan(0);
    // Start before the inline row so tab() exercises keyboard modality and the active entry.
    selected.focus();
    await userEvent.tab();
    await userEvent.tab();
    await expect(
      within(inline).getByRole('tab', { selected: true }),
    ).toHaveFocus();
    canvasElement.dataset.stepperMeasurements = JSON.stringify({
      stackedHeight: stacked.getBoundingClientRect().height,
      inlineHeight: inline.getBoundingClientRect().height,
    });
  },
};

export const InlineNarrow: Story = {
  render: () => (
    <div style={{ width: '684px', maxWidth: '100%' }}>
      <Setup presentation="inline" longText />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('tablist');
    await measureInline(row);
    for (const tab of within(row).getAllByRole('tab')) {
      const [labelId, valueId] = (
        tab.getAttribute('aria-labelledby') ?? ''
      ).split(' ');
      for (const id of [labelId, valueId]) {
        const text = canvasElement.ownerDocument.getElementById(id ?? '');
        if (!text) throw new Error('Expected complete step text');
        await expect(text.getBoundingClientRect().height).toBeGreaterThan(
          Number.parseFloat(getComputedStyle(text).lineHeight),
        );
        await expect(text.scrollWidth).toBeLessThanOrEqual(
          text.clientWidth + 1,
        );
      }
    }
    await expect(row.scrollWidth).toBe(row.clientWidth);
    await exerciseInlineKeyboard(row, canvasElement);
    await expect(
      canvasElement.ownerDocument.documentElement.scrollWidth,
    ).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
    canvasElement.dataset.stepperMeasurements = JSON.stringify({
      rowWidth: row.clientWidth,
      scrollWidth: row.scrollWidth,
      height: row.getBoundingClientRect().height,
    });
  },
};

export const InlineOverflow: Story = {
  render: () => (
    <div style={{ width: '320px', maxWidth: '100%' }}>
      <Setup presentation="inline" longText />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('tablist');
    await expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
    await exerciseInlineKeyboard(row, canvasElement);
    const active = within(row).getByRole('tab', { selected: true });
    await expect(active.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      row.getBoundingClientRect().left,
    );
    await expect(active.getBoundingClientRect().right).toBeLessThanOrEqual(
      row.getBoundingClientRect().right,
    );
    await expect(
      canvasElement.ownerDocument.documentElement.scrollWidth,
    ).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
    canvasElement.dataset.stepperMeasurements = JSON.stringify({
      rowWidth: row.clientWidth,
      scrollWidth: row.scrollWidth,
    });
  },
};
