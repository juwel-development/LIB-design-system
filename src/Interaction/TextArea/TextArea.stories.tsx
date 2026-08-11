import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
  title: 'Interaction/TextArea',
  component: TextArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
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
    label: 'Message',
    name: 'message',
    placeholder: 'Tell us what you need',
  },
};

export const Optional: Story = {
  args: {
    label: 'Notes',
    name: 'notes',
  },
};

export const Required: Story = {
  args: {
    label: 'Message',
    name: 'message',
    required: true,
  },
};

export const WithHint: Story = {
  args: {
    label: 'Message',
    name: 'message',
    hint: 'A few sentences is plenty',
  },
};

export const Invalid: Story = {
  args: {
    label: 'Message',
    name: 'message',
    invalid: true,
    errorMessage: 'This field is required',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Message',
    name: 'message',
    disabled: true,
    defaultValue: 'Sent already',
  },
};
