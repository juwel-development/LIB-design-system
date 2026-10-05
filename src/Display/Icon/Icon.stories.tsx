import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Icon } from './Icon';

const meta: Meta<typeof Icon> = {
  title: 'Display/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Draws one of six shapes, each named for what is drawn and never for a state or an action: \`sort\` (up and down arrows), \`sort-ascending\` (up), \`sort-descending\` (down), \`bin\`, \`bubble-exclamation\` (a speech bubble holding an exclamation mark) and \`bubble-tick\` (the same bubble holding a tick). The consumer picks the drawing that matches what it shows and owns what it means. Every drawing is sized in \`em\`, stroked in the colour of the text it sits in, and out of the tab order.

### Decorative by default

Without a \`label\` the icon is hidden from assistive technology, and the control or text beside it carries the meaning - a \`Button\` label or \`ariaLabel\`, a header cell's \`ariaSort\`. **An icon inside a named control stays unlabelled**: the quiet delete is a \`ghost\` \`Button\` with an \`ariaLabel\` and an unlabelled \`bin\` (see Interaction/Button), and a labelled icon there would be a second image saying the name again. The composed sortable header is shown under Display/Table.

### Status mark: when a label is required

A \`label\` is required exactly when the icon stands alone for an item's state and no text beside it says so - a compact list or table row with no room for the words. With a non-empty \`label\` the icon becomes a status mark: one image (\`role="img"\`) whose accessible name is the label, announced once, still no tab stop. **The label is the status.** The consumer writes it in the reader's language; the library words nothing, and an empty label leaves the icon hidden rather than exposing an image without a name. The two forms of one state take two drawings - \`bubble-exclamation\` and \`bubble-tick\` share an outline and differ by the mark inside - so the state is told apart by shape, in forced colours and in print as well. Nothing is announced when a mark changes form: a live region is the consumer's, where the change is an event.

### Tone

\`color\` selects \`muted\`, \`success\`, \`warning\`, \`error\` or \`info\`; absent, the glyph keeps the colour of the surrounding text. **The tone only reinforces the label**: it changes colour and nothing else - no role, no name, no announcement - so a mark must read correctly with the tone removed. Every selectable role holds at least 3:1 against \`surface\` in both shipped themes ([SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast)), pinned in \`Palette.spec.ts\`; a theme that re-points a role inherits that floor. Under forced colours the tone is dropped and every glyph is drawn in the user's text colour, which is why the shape has to carry the state. There is no size prop and no badge: the glyph is as large as the text it sits in.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: { type: 'radio' },
      options: [
        'sort',
        'sort-ascending',
        'sort-descending',
        'bin',
        'bubble-exclamation',
        'bubble-tick',
      ],
      description: 'Which drawing; a name selects a shape, never a state',
    },
    label: {
      control: { type: 'text' },
      description:
        'Accessible name that makes the icon a status mark; absent or empty, the icon stays hidden',
    },
    color: {
      control: { type: 'radio' },
      options: [undefined, 'muted', 'success', 'warning', 'error', 'info'],
      description:
        'Semantic tone; absent, the glyph takes the surrounding text colour',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The unsorted indicator: an up and a down arrow side by side. */
export const Sort: Story = {
  args: { name: 'sort' },
};

/** The ascending indicator: one up arrow. */
export const SortAscending: Story = {
  args: { name: 'sort-ascending' },
};

/** The descending indicator: one down arrow. */
export const SortDescending: Story = {
  args: { name: 'sort-descending' },
};

/** A bin: a lid with a handle over a tapered body with two ribs. */
export const Bin: Story = {
  args: { name: 'bin' },
};

/** A speech bubble holding an exclamation mark. */
export const BubbleExclamation: Story = {
  args: { name: 'bubble-exclamation' },
};

/** A speech bubble holding a tick: the same outline as `bubble-exclamation`, a different mark. */
export const BubbleTick: Story = {
  args: { name: 'bubble-tick' },
};

const threads = [
  { subject: 'Lieferung Donnerstag', replied: false },
  { subject: 'Rechnung 2291', replied: true },
  { subject: 'Rückfrage zum Angebot', replied: false },
  { subject: 'Termin im November', replied: true },
] as const;

/**
 * The status mark (#126): each row ends in an icon with a `label` and no visible text beside it.
 * "Wartet auf Antwort" is `bubble-exclamation` in the `warning` tone, "Beantwortet" is `bubble-tick`
 * in `muted` - two shapes, so the state survives without colour. The marks are images named by
 * their labels and add no tab stop; the play function checks both.
 */
export const StatusMark: Story = {
  args: { name: 'bubble-exclamation' },
  render: () => (
    <ul
      className={'font-secondary text-label text-foreground'}
      style={{ width: '16rem' }}
    >
      {threads.map(({ subject, replied }) => (
        <li
          key={subject}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingBlock: '0.25rem',
            borderBottom: '1px solid var(--color-rule)',
          }}
        >
          <span>{subject}</span>
          {replied ? (
            <Icon name={'bubble-tick'} label={'Beantwortet'} color={'muted'} />
          ) : (
            <Icon
              name={'bubble-exclamation'}
              label={'Wartet auf Antwort'}
              color={'warning'}
            />
          )}
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const waiting = canvas.getAllByRole('img', { name: 'Wartet auf Antwort' });
    const replied = canvas.getAllByRole('img', { name: 'Beantwortet' });
    await expect(waiting).toHaveLength(2);
    await expect(replied).toHaveLength(2);
    await expect(canvas.getAllByRole('img')).toHaveLength(4);
    // The tone reaches the strokes through the text colour, and the two tones resolve apart.
    const strokeOf = (mark: HTMLElement | undefined): string =>
      getComputedStyle(mark?.querySelector('path') as Element).stroke;
    await expect(strokeOf(waiting[0])).not.toBe(strokeOf(replied[0]));
    for (const mark of [...waiting, ...replied]) {
      await expect(mark.getBoundingClientRect().width).toBeGreaterThan(0);
    }
    await userEvent.tab();
    for (const mark of [...waiting, ...replied]) {
      await expect(mark).not.toHaveFocus();
    }
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

/**
 * Every tone on both bubbles at the label size, beside the untoned glyph that takes the text colour.
 * The tone changes colour only; without a `label` these stay decorative.
 */
export const Tones: Story = {
  args: { name: 'bubble-exclamation' },
  render: () => (
    <div
      className={'font-secondary text-label text-foreground'}
      style={{ display: 'grid', gap: '0.5rem' }}
    >
      {(
        [undefined, 'muted', 'success', 'warning', 'error', 'info'] as const
      ).map((color) => (
        <p key={color ?? 'text colour'}>
          <Icon name={'bubble-exclamation'} color={color} />{' '}
          <Icon name={'bubble-tick'} color={color} />{' '}
          <Icon name={'bin'} color={color} /> {color ?? 'text colour'}
        </p>
      ))}
    </div>
  ),
};

/**
 * Every drawing in one line of text, so the shapes can be told apart side by side and the glyph is
 * seen taking the size and colour of the text around it - the muted label role here, body text below.
 */
export const BesideText: Story = {
  args: { name: 'sort' },
  render: () => (
    <div className={'flex flex-col gap-4 text-foreground'}>
      <p className={'font-secondary text-label text-muted tracking-label'}>
        Unsorted <Icon name={'sort'} /> · Ascending{' '}
        <Icon name={'sort-ascending'} /> · Descending{' '}
        <Icon name={'sort-descending'} /> · Bin <Icon name={'bin'} /> ·
        Exclamation <Icon name={'bubble-exclamation'} /> · Tick{' '}
        <Icon name={'bubble-tick'} />
      </p>
      <p className={'font-primary text-body'}>
        Unsorted <Icon name={'sort'} /> · Ascending{' '}
        <Icon name={'sort-ascending'} /> · Descending{' '}
        <Icon name={'sort-descending'} /> · Bin <Icon name={'bin'} /> ·
        Exclamation <Icon name={'bubble-exclamation'} /> · Tick{' '}
        <Icon name={'bubble-tick'} />
      </p>
      <p className={'font-primary text-title'}>
        Title <Icon name={'sort-ascending'} /> <Icon name={'bin'} />{' '}
        <Icon name={'bubble-exclamation'} /> <Icon name={'bubble-tick'} />
      </p>
    </div>
  ),
};
