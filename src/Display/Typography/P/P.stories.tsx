import type { Meta, StoryObj } from '@storybook/react-vite';
import { P } from './P';

const meta: Meta<typeof P> = {
  title: 'Display/Typography/P',
  component: P,
  parameters: {
    docs: {
      description: {
        component:
          "### Typography status tones\n\nTypography whose colour is selectable accepts the general `success`, `warning`, `error`, and\n`info` status tones alongside `foreground` and `muted`. This includes `H1`–`H6`, `Eyebrow`, `P`,\n`Note`, and `Prose.Body`; fixed-colour members such as `Prose.Lede` and `Prose.Tail` remain fixed.\n\n```tsx\n<P color={'warning'}>Warning: patience is low and the offer gap is wide.</P>\n```\n\nA status tone reinforces status that the content already communicates: never use colour as the\nonly cue. Selecting one changes only the semantic text colour and does not add an ARIA role, live\nregion, icon, or wording. The caller remains responsible for announcement behavior when a changing\nstatus needs it.\n\nAll four palette roles must remain at least 4.5:1 against `surface` in every theme because they can\npaint normal-size and small text. They remain general roles rather than typography-only tokens, so\nconstraints from other carriers also apply; `error`, for example, remains Meter's depletion\nendpoint and must keep that complete path at least 3:1 against `meterTrack`.",
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    emphasis: {
      control: { type: 'radio' },
      options: ['regular', 'strong'],
      description:
        'Visual weight only: strong reads --font-weight-strong (default 700), preserving family, size and line height. Regular or omitted inherits the existing weight. Adds no importance semantics or announcement; state must also be communicated in words or an accessible name.',
    },
    truncate: {
      control: 'boolean',
      description:
        'One line with an inline-end ellipsis. Keep a route to the full text; do not truncate essential content or interactive descendants.',
    },
    color: {
      control: { type: 'radio' },
      options: ['foreground', 'muted', 'success', 'warning', 'error', 'info'],
      description: 'Which text-colour role the paragraph reads',
    },
    children: {
      control: { type: 'text' },
      description: 'The paragraph text',
    },
    testId: {
      control: { type: 'text' },
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children:
      'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
  },
};

export const Muted: Story = {
  args: {
    children:
      'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
    color: 'muted',
  },
};

/** Status tones reinforce meaning already present in the wording. They add no live announcement;
 *  the interaction that owns a changing status is responsible for announcing it when needed. */
export const StatusTones: Story = {
  render: () => (
    <>
      <P color={'success'}>Success: the changes were saved.</P>
      <P color={'warning'}>Warning: patience is low.</P>
      <P color={'error'}>Error: the changes could not be saved.</P>
      <P color={'info'}>Information: a new version is available.</P>
    </>
  ),
};

/** The fixture allocates width; truncation needs no consumer CSS. The Table stories show an
 *  operable item opening the full wording for sighted readers. */
export const Truncated: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Opt-in only: the full text stays accessible. Allocate width in the enclosing layout; this text does not size its holder. See Table / Truncated Text for a complete activation example. Never use truncation to hide essential content or links and controls.',
      },
    },
  },
  args: {
    truncate: true,
    children:
      'Alexandra Montgomery — international recording correspondence and forthcoming release plans',
  },
  render: (args) => (
    <div style={{ width: '18rem' }}>
      <P {...args} />
    </div>
  ),
};

export const Strong: Story = {
  args: {
    emphasis: 'strong',
    children: 'Unread: Alex Morgan',
  },
};

export const ReadAndUnread: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The consumer chooses emphasis and supplies the state wording. Weight changes alone; single-line text keeps the same line height. Wider glyphs can change wrapping in a constrained width.',
      },
    },
  },
  render: () => (
    <>
      <P emphasis="regular">Read: Alex Morgan</P>
      <P emphasis="strong">Unread: Alex Morgan</P>
    </>
  ),
};
