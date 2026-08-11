import type { Meta, StoryObj } from '@storybook/react-vite';
import { P } from './P';

const meta: Meta<typeof P> = {
  title: 'Display/Typography/P',
  component: P,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'radio' },
      options: ['foreground', 'muted'],
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
