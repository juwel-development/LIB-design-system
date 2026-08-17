import type { Meta, StoryObj } from '@storybook/react-vite';
import { H1 } from './H1';

const meta: Meta<typeof H1> = {
  title: 'Display/Typography/H1',
  component: H1,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'radio' },
      options: ['foreground', 'muted'],
      description: 'Which text-colour role the heading reads',
    },
    children: {
      control: { type: 'text' },
      description: 'The heading text',
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
    children: 'The quick brown fox',
  },
};

export const Muted: Story = {
  args: {
    children: 'The quick brown fox',
    color: 'muted',
  },
};

/** A lead longer than the display measure wraps rather than running on: the heading is bounded at
 *  `--measure-display`, 36ch against the reading column's 66ch, because bigger type wants fewer
 *  characters per line. The bound is the recipe's and holds under every colour - a hero's lead gets it
 *  by being an `H1`, which is why `Hero` leaves its own slot uncapped. */
export const AtTheDisplayMeasure: Story = {
  args: {
    children: 'A studio for the long read, not for the first glance at it.',
  },
};
