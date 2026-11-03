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
    truncate: {
      control: 'boolean',
      description:
        'One line with an inline-end ellipsis. Keep a route to the full text; do not truncate essential content or interactive descendants.',
    },
    color: {
      control: { type: 'radio' },
      options: ['foreground', 'muted', 'success', 'warning', 'error', 'info'],
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
      <Note {...args} />
    </div>
  ),
};
