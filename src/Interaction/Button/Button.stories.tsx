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
      options: ['primary', 'secondary', 'ghost'],
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
