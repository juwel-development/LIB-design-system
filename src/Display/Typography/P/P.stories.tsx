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
