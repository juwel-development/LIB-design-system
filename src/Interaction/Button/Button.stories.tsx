import { Icon } from 'Display/Icon/Icon';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Subject } from 'rxjs';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Interaction/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['primary', 'secondary', 'ghost', 'plain'],
      description: 'The visual style variant of the button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    children: {
      control: { type: 'text' },
      description: 'The button content',
    },
    testId: {
      control: { type: 'text' },
      description: 'Test ID for automated testing',
    },
    type: {
      control: { type: 'radio' },
      options: ['button', 'submit', 'reset'],
      description:
        "Native button type; use submit for a form's submitting button",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Create a shared click subject for the stories
const clickSubject = new Subject<void>();

// Default story
export const Default: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
    onClick$: clickSubject,
  },
};

// Primary variant
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    onClick$: clickSubject,
  },
};

// Secondary variant
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    onClick$: clickSubject,
  },
};

// Ghost variant
export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
    onClick$: clickSubject,
  },
};

// Disabled button
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'primary',
    disabled: true,
    onClick$: clickSubject,
  },
};

// Custom text button
export const CustomText: Story = {
  args: {
    children: '🚀 Launch',
    variant: 'primary',
    onClick$: clickSubject,
  },
};

// The button that submits a form
export const Submit: Story = {
  args: {
    children: 'Absenden',
    variant: 'primary',
    type: 'submit',
    onClick$: clickSubject,
  },
};

// Plain: an operable button in the typography of what surrounds it - no face, padding, corner or
// hover underline of its own. Only the focus ring marks it when it holds keyboard focus.
export const Plain: Story = {
  args: {
    children: 'Plain action',
    variant: 'plain',
    onClick$: clickSubject,
  },
};

/**
 * Inside running text the plain button takes the paragraph's face, size and colour. It moves to the
 * next line as one unit - browsers render a `button` as an inline block even when told `inline` -
 * and its own label wraps when it alone exceeds a line.
 */
export const PlainInProse: Story = {
  args: {
    children: 'show the full specification',
    variant: 'plain',
    onClick$: clickSubject,
  },
  render: (args) => (
    <p
      className={'font-primary text-body text-foreground'}
      style={{ maxWidth: '22rem' }}
    >
      The enclosure ships without the bracket; to compare both parts side by
      side, <Button {...args} /> and the table below will include every measured
      dimension at once.
    </p>
  ),
};

/** Inside a muted, tracked label the same button becomes a muted, tracked label with a sort icon. */
export const PlainInLabel: Story = {
  args: {
    variant: 'plain',
    onClick$: clickSubject,
  },
  render: (args) => (
    <p className={'font-secondary text-label text-muted tracking-label'}>
      <Button {...args}>
        Name <Icon name={'sort-ascending'} />
      </Button>
    </p>
  ),
};

/** Disabled: told apart by the `disabled` text tone, with native disabled semantics and no fill. */
export const PlainDisabled: Story = {
  args: {
    children: 'Plain action',
    variant: 'plain',
    disabled: true,
    onClick$: clickSubject,
  },
};

/** Icon-only: the plain button names itself through `ariaLabel` like any other variant. */
export const PlainIconOnly: Story = {
  args: {
    variant: 'plain',
    ariaLabel: 'Sort by name',
    onClick$: clickSubject,
  },
  render: (args) => (
    <Button {...args}>
      <Icon name={'sort'} />
    </Button>
  ),
};
