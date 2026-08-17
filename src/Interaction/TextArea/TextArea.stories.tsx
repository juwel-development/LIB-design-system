import { Button } from 'Interaction/Button/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Subject } from 'rxjs';
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
      description: 'Maps to the HTML required attribute; hides the marker',
    },
    optionalLabel: {
      control: { type: 'text' },
      description:
        'The marker a non-required field carries, worded by the consuming app; left out, no marker renders and the library supplies no wording of its own',
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
    optionalLabel: 'optional',
  },
};

// The same field in a German app: the wording is the app's, so the marker changes language without
// the library holding a translation (issue #74).
export const OptionalInAnotherLanguage: Story = {
  args: {
    label: 'Notizen',
    name: 'notes',
    optionalLabel: 'freiwillig',
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

// A chat-composer pattern: Send empties the box in place, so focus and any in-flight IME
// composition survive where a `key` remount would drop them (issue #64).
const composerReset$ = new Subject<void>();

export const SendAndClear: Story = {
  args: {
    label: 'Message',
    name: 'message',
    placeholder: 'Type a message, then Send',
    reset$: composerReset$,
  },
  render: (args) => (
    <div className={'flex flex-col items-start gap-[var(--space-stack)]'}>
      <TextArea {...args} />
      <Button onClick$={composerReset$}>Send</Button>
    </div>
  ),
};
