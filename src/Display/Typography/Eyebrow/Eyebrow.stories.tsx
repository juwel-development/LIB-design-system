import type { Meta, StoryObj } from '@storybook/react-vite';
import { Eyebrow } from './Eyebrow';

const meta: Meta<typeof Eyebrow> = {
  title: 'Display/Typography/Eyebrow',
  component: Eyebrow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'radio' },
      options: ['foreground', 'muted'],
      description: 'Which text-colour role the eyebrow reads',
    },
    children: {
      control: { type: 'text' },
      description: 'The eyebrow text',
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
    children: 'Case studies',
  },
};

export const Foreground: Story = {
  args: {
    children: 'Case studies',
    color: 'foreground',
  },
};
