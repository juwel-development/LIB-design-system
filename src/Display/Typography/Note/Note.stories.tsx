import { Link } from 'Interaction/Link/Link';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Note } from './Note';

const meta: Meta<typeof Note> = {
  title: 'Display/Typography/Note',
  component: Note,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: { type: 'radio' },
      options: ['foreground', 'muted'],
      description: 'Which text-colour role the annotation reads',
    },
    children: {
      control: { type: 'text' },
      description: 'The annotation. A node, so it can carry an inline link',
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
    children: 'We reply within two working days.',
  },
};

export const Muted: Story = {
  args: {
    children: 'We treat your data in confidence.',
    color: 'muted',
  },
};

export const WithLink: Story = {
  args: {
    color: 'muted',
    children: (
      <>
        We treat your data in confidence, see{' '}
        <Link href={'/privacy'}>our privacy notice</Link>.
      </>
    ),
  },
};
