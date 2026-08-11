import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Form/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['text', 'email', 'url'],
      description: 'Selects the underlying input type',
    },
    required: {
      control: { type: 'boolean' },
      description:
        'Maps to the HTML required attribute; hides the "optional" marker',
    },
    invalid: {
      control: { type: 'boolean' },
      description: 'Maps to aria-invalid and reveals the error message',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the control is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email',
    name: 'email',
    variant: 'email',
    placeholder: 'you@example.com',
  },
};

export const Optional: Story = {
  args: {
    label: 'Company',
    name: 'company',
  },
};

export const Required: Story = {
  args: {
    label: 'Email',
    name: 'email',
    variant: 'email',
    required: true,
  },
};

export const WithHint: Story = {
  args: {
    label: 'Website',
    name: 'website',
    variant: 'url',
    hint: 'Include https://',
  },
};

export const Invalid: Story = {
  args: {
    label: 'Email',
    name: 'email',
    variant: 'email',
    invalid: true,
    errorMessage: 'Enter a valid email address',
    defaultValue: 'not-an-email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Email',
    name: 'email',
    variant: 'email',
    disabled: true,
    defaultValue: 'you@example.com',
  },
};
