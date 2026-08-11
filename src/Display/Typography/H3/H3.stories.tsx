import type { Meta, StoryObj } from '@storybook/react-vite';
import { H3 } from './H3';

const meta: Meta<typeof H3> = {
  title: 'Display/Typography/H3',
  component: H3,
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
