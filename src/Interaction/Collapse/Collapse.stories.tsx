import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Collapse,
  FieldRow,
  Input,
  Note,
  NumberInput,
  Select,
  Stack,
  Switch,
} from 'index';
import { type CSSProperties, useEffect, useState } from 'react';
import { BehaviorSubject, interval, Subject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const meta: Meta<typeof Collapse> = {
  title: 'Interaction/Collapse',
  component: Collapse,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `One named section the user expands and collapses through its persistent summary - for example the filters above a table, shown on demand.

\`\`\`tsx
<Collapse summary={t('filters', { active: 2 })}>
  <FieldRow.Root>…</FieldRow.Root>
</Collapse>
\`\`\`

**Props.** \`summary\` (required) is the consumer's visible wording and the control's whole accessible name; Collapse renders no text of its own. \`children\` is any content. \`defaultExpanded\` opens it on mount; it is read once, so a rerender - with the same or a changed value - never overrides what the user chose since. \`testId\` marks the disclosure. There is no controlled state, change output, class, style or size.

**Behavior.** A native disclosure: a pointer, Enter or Space on the summary toggles it, and the platform announces its name and expanded state. A visible indicator points sideways while collapsed and down while expanded, and the summary carries the shared focus ring. Collapsed by default. Instances are independent: there is no group or exclusive-open rule.

**Retained content.** Collapsed content takes no height and exposes no accessible content or tab stop, but stays mounted: its nodes, typed values, selections and subscriptions survive, and reopening shows the same content. This differs from Tabs, Stepper and Alternatives, which remove inactive views. Reopening restores no earlier focus; closing while focus is inside the content moves focus to the summary. A browser's find-in-page may open a collapsed section to show a match.

**Layout.** The summary wraps long wording inside its container beside the indicator, and content keeps its own type and control sizes. Collapse adds no bound, scrollport or animation: content grows with its height, and an enclosing layout keeps ownership of overflow. In a Screen's Pane head, expanding re-measures the pane and may trigger Screen's whole-content fallback; collapsing restores the bound (see *Interaction/Collapse Composition*).

**Consumer obligations.** Word the summary, including any active-filter count, and keep actions out of it - it is a label and toggle. Whether hidden filter values stay applied is yours. Content inside a collapsed section is still in its form: reveal it before focusing or validating a control in it.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

// The filter rows' minimum widths, which FieldRow requires its consumer to declare.
const filterTheme = {
  '--filter-name-min-width': '12rem',
  '--filter-genre-min-width': '10rem',
  '--filter-quality-min-width': '9rem',
} as CSSProperties;

const Filters = () => (
  <FieldRow.Root>
    <FieldRow.Field weight={2} minWidth="--filter-name-min-width">
      <Input name="name" label="Name contains" />
    </FieldRow.Field>
    <FieldRow.Field minWidth="--filter-genre-min-width">
      <Select.Root name="genre" label="Genre" placeholder="Any genre">
        <Select.Option value="jazz">Jazz</Select.Option>
        <Select.Option value="soul">Soul</Select.Option>
      </Select.Root>
    </FieldRow.Field>
    <FieldRow.Field minWidth="--filter-quality-min-width">
      <NumberInput name="quality" label="Minimum quality" />
    </FieldRow.Field>
  </FieldRow.Root>
);

const summaryOf = (canvasElement: HTMLElement, name: string) => {
  const summary = within(canvasElement).getByText(name).closest('summary');
  if (!summary) throw new Error(`No summary named ${name}`);
  return summary;
};

// Collapsed content has no box and no rendered control. Real Tab order is the runner's: user-event's
// tab() does not count a summary as tabbable.
const checkCollapsed = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const summary = summaryOf(canvasElement, 'Filters');
  // Chromium still answers a query on skipped content, so the contribution is the disclosure's.
  await expect(summary.parentElement?.getBoundingClientRect().height).toBe(
    summary.getBoundingClientRect().height,
  );
  for (const control of summary.parentElement?.querySelectorAll(
    'input, select, button',
  ) ?? [])
    await expect(control.checkVisibility()).toBe(false);
  summary.focus();
  await expect(getComputedStyle(summary).outlineStyle).toBe('solid');
};

export const Default: Story = {
  args: { summary: 'Filters', children: <Filters /> },
  render: (args) => (
    <Stack>
      <div style={filterTheme}>
        <Collapse {...args} />
      </div>
      <button type="button">After the filters</button>
    </Stack>
  ),
  play: checkCollapsed,
};

export const InitiallyExpanded: Story = {
  args: { summary: 'Filters', defaultExpanded: true, children: <Filters /> },
  render: (args) => (
    <div style={filterTheme}>
      <Collapse {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const summary = summaryOf(canvasElement, 'Filters');
    const name = within(canvasElement).getByLabelText('Name contains');
    await expect(name.checkVisibility()).toBe(true);
    await userEvent.click(summary);
    await expect(name.checkVisibility()).toBe(false);
    await userEvent.click(summary);
    await expect(name.checkVisibility()).toBe(true);
  },
};

/** Two instances, one starting open: each keeps its own state. */
export const IndependentInstances: Story = {
  render: () => (
    <Stack testId="instances">
      <Collapse summary="Filters">
        <Note>Name, genre and quality filters.</Note>
      </Collapse>
      <Collapse summary="Columns" defaultExpanded>
        <Note>Artist, genre and contract columns.</Note>
      </Collapse>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(summaryOf(canvasElement, 'Filters'));
    await expect(canvas.getByText(/^Name, genre/).checkVisibility()).toBe(true);
    await expect(canvas.getByText(/^Artist, genre/).checkVisibility()).toBe(
      true,
    );
    await userEvent.click(summaryOf(canvasElement, 'Columns'));
    await expect(canvas.getByText(/^Name, genre/).checkVisibility()).toBe(true);
    await expect(canvas.getByText(/^Artist, genre/).checkVisibility()).toBe(
      false,
    );
  },
};

const RetainedState = () => {
  const [channels] = useState(() => ({
    unreadOnly$: new BehaviorSubject(false),
    toggle$: new Subject<boolean>(),
  }));
  const [ticks, setTicks] = useState(0);
  const [mounts, setMounts] = useState(0);
  useEffect(() => {
    const subscription = channels.toggle$.subscribe((value) =>
      channels.unreadOnly$.next(value),
    );
    return () => subscription.unsubscribe();
  }, [channels]);
  useEffect(() => {
    setMounts((count) => count + 1);
    const subscription = interval(100).subscribe(() =>
      setTicks((count) => count + 1),
    );
    return () => subscription.unsubscribe();
  }, []);
  return (
    <Stack>
      <Input name="name" label="Name contains" />
      <Select.Root name="genre" label="Genre" placeholder="Any genre">
        <Select.Option value="jazz">Jazz</Select.Option>
        <Select.Option value="soul">Soul</Select.Option>
      </Select.Root>
      <Switch
        label="Unsigned artists only"
        checked$={channels.unreadOnly$}
        onChange$={channels.toggle$}
      />
      <Note testId="live" color="muted">
        {`Live updates: ${ticks}, mounts: ${mounts}`}
      </Note>
    </Stack>
  );
};

/** Typed values, a selection, a switch's stream and a live subscription survive collapsing. */
export const RetainedFieldState: Story = {
  args: {
    summary: 'Filters',
    defaultExpanded: true,
    children: <RetainedState />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = summaryOf(canvasElement, 'Filters');
    const name = canvas.getByLabelText('Name contains');
    const genre = canvas.getByLabelText('Genre');
    await userEvent.type(name, 'Ana');
    await userEvent.selectOptions(genre, 'soul');
    await userEvent.click(canvas.getByRole('switch'));
    await userEvent.click(name);
    await userEvent.click(summary);
    const content = summary.nextElementSibling;
    await expect(content?.contains(document.activeElement)).toBe(false);
    const live = canvas.getByTestId('live');
    const before = live.textContent;
    await new Promise((resolve) => setTimeout(resolve, 350));
    await userEvent.click(summary);
    await expect(name).not.toHaveFocus();
    await expect(canvas.getByLabelText('Name contains')).toBe(name);
    await expect(name).toHaveValue('Ana');
    await expect(genre).toHaveValue('soul');
    await expect(canvas.getByRole('switch')).toBeChecked();
    await expect(live.textContent).not.toBe(before);
    await expect(live).toHaveTextContent(/mounts: 1$/);
  },
};

const longWording = {
  en: 'Filters for the artist roster · 3 active: genre, minimum song quality and contract status',
  de: 'Filter für die Künstlerliste · 3 aktiv: Genre, Mindestqualität der Songs und Vertragsstatus',
  word: 'Vertragsverlängerungsbenachrichtigungseinstellungen',
};

// The summary wraps inside its holder: no text overflows, the indicator stays in view.
const checkWording = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const holders = within(canvasElement).getAllByTestId('holder');
  for (const holder of holders) {
    const summary = holder.querySelector('summary');
    if (!summary) throw new Error('No summary');
    const box = holder.getBoundingClientRect();
    const rect = summary.getBoundingClientRect();
    const indicator = getComputedStyle(summary, '::before');
    await expect(holder.scrollWidth).toBeLessThanOrEqual(holder.clientWidth);
    await expect(summary.scrollWidth).toBeLessThanOrEqual(summary.clientWidth);
    await expect(rect.left).toBeGreaterThanOrEqual(box.left - 0.5);
    await expect(rect.right).toBeLessThanOrEqual(box.right + 0.5);
    await expect(indicator.borderRightStyle).toBe('solid');
    await expect(Number.parseFloat(indicator.width)).toBeGreaterThan(0);
  }
  // The narrow German summary wraps onto several lines rather than clipping.
  const range = document.createRange();
  range.selectNodeContents(
    holders[1]?.querySelector('summary') ?? document.body,
  );
  await expect(range.getClientRects().length).toBeGreaterThan(1);
};

/** Long English and German wording and an unbreakable word at full width and in narrow holders. */
export const LongWording: Story = {
  render: () => (
    <Stack>
      {[
        ['full', longWording.en],
        ['16rem', longWording.de],
        ['10rem', longWording.word],
        ['16rem', longWording.en],
      ].map(([width, summary]) => (
        <div
          key={`${width}${summary}`}
          data-testid="holder"
          style={{ maxWidth: width === 'full' ? undefined : width }}
        >
          <Collapse summary={summary ?? ''} defaultExpanded={width === '16rem'}>
            <div style={filterTheme}>
              <Filters />
            </div>
          </Collapse>
        </div>
      ))}
    </Stack>
  ),
  play: async (context) => {
    await waitFor(() => checkWording(context));
  },
};
