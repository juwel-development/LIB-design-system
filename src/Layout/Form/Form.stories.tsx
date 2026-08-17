import { Button } from 'Interaction/Button/Button';
import { Input } from 'Interaction/Input/Input';
import { Link } from 'Interaction/Link/Link';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from './Form';

const meta: Meta<typeof Form> = {
  title: 'Layout/Form',
  component: Form,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: { type: 'radio' },
      options: ['idle', 'sending', 'sent', 'failed'],
      description:
        'The page-owned form state; Form renders the one it is given',
    },
    method: {
      control: { type: 'radio' },
      options: ['get', 'post'],
      description: 'Passed straight to the form element',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const fields = (
  <>
    <Input label={'Name'} name={'name'} />
    <Input label={'Email'} name={'email'} variant={'email'} required={true} />
  </>
);

const actions = (
  <Button type={'submit'} variant={'primary'}>
    Subscribe
  </Button>
);

export const Idle: Story = {
  args: {
    action: '/subscribe',
    state: 'idle',
    note: 'We only email about releases.',
    children: fields,
    actions,
  },
};

/** The note takes inline content, so a privacy line with a Link in it stays inside the `<form>`
 *  rather than being rendered beside it. */
export const LinkedNote: Story = {
  args: {
    action: '/subscribe',
    state: 'idle',
    note: (
      <>
        We only email about releases — more in our{' '}
        <Link href={'/privacy'}>privacy notice</Link>.
      </>
    ),
    children: fields,
    actions,
  },
};

export const Sending: Story = {
  args: {
    action: '/subscribe',
    state: 'sending',
    note: 'We only email about releases.',
    children: fields,
    actions: (
      <Button type={'submit'} variant={'primary'} disabled={true}>
        Subscribing…
      </Button>
    ),
  },
};

export const Sent: Story = {
  args: {
    action: '/subscribe',
    state: 'sent',
    note: 'Thanks — check your inbox to confirm.',
    children: fields,
    actions,
  },
};

export const Failed: Story = {
  args: {
    action: '/subscribe',
    state: 'failed',
    note: 'Something went wrong. Please try again.',
    children: fields,
    actions,
  },
};
