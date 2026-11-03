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
      <Note emphasis="regular">Read: Alex Morgan</Note>
      <Note emphasis="strong">Unread: Alex Morgan</Note>
    </>
  ),
};
