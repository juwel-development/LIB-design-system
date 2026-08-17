import { Button } from 'Interaction/Button/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Subject } from 'rxjs';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Interaction/Input',
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
    optionalLabel: 'optional',
  },
};

// The same field in a German app: the wording is the app's, so the marker changes language without
// the library holding a translation (issue #74).
export const OptionalInAnotherLanguage: Story = {
  args: {
    label: 'Firma',
    name: 'company',
    optionalLabel: 'freiwillig',
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

// A search-and-add pattern: Add empties the field in place, so focus and any in-flight IME
// composition survive where a `key` remount would drop them (issue #64).
const entryReset$ = new Subject<void>();

export const SendAndClear: Story = {
  args: {
    label: 'Tag',
    name: 'tag',
    placeholder: 'Type a tag, then Add',
    reset$: entryReset$,
  },
  render: (args) => (
    <div className={'flex flex-col items-start gap-[var(--space-stack)]'}>
      <Input {...args} />
      <Button onClick$={entryReset$}>Add</Button>
    </div>
  ),
};
