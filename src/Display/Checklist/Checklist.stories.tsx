import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '../../Interaction/Link/Link';
import { Checklist } from './Checklist';

const meta: Meta<typeof Checklist.Root> = {
  title: 'Display/Checklist',
  component: Checklist.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A plain list: each item hairline-separated, marked by a short rule in the left indent. */
export const Plain: Story = {
  render: () => (
    <Checklist.Root>
      <Checklist.Item>Confirm the delivery window</Checklist.Item>
      <Checklist.Item>Check the packaging for damage</Checklist.Item>
      <Checklist.Item>Sign and return the receipt</Checklist.Item>
    </Checklist.Root>
  ),
};

/** An item can carry inline content, including a prose link. */
export const WithLink: Story = {
  render: () => (
    <Checklist.Root>
      <Checklist.Item>Confirm the delivery window</Checklist.Item>
      <Checklist.Item>
        Read the{' '}
        <Link href={'/handover'} treatment={'prose'}>
          handover note
        </Link>{' '}
        before you start
      </Checklist.Item>
      <Checklist.Item>Sign and return the receipt</Checklist.Item>
    </Checklist.Root>
  ),
};
