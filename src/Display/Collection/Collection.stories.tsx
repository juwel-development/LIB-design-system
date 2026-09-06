import { Cluster } from 'Arrangement/Cluster/Cluster';
import { Stack } from 'Arrangement/Stack/Stack';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import { Link } from 'Interaction/Link/Link';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collection } from './Collection';

const meta: Meta<typeof Collection.Root> = {
  title: 'Display/Collection',
  component: Collection.Root,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-foreground)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Content has no prescribed anatomy: the composed components own type, alignment and controls. */
export const Heterogeneous: Story = {
  render: () => (
    <Collection.Root>
      <Collection.Item>
        <P>A plain reading item, without a title or control.</P>
      </Collection.Item>
      <Collection.Item>
        <Cluster justify={'between'}>
          <Stack>
            <Link href={'#guide'} treatment={'quiet'}>
              Read the guide
            </Link>
            <Note color={'muted'}>An annotation composed beneath a link.</Note>
          </Stack>
          <Button variant={'secondary'}>Save for later</Button>
        </Cluster>
      </Collection.Item>
      <Collection.Item>
        <Note>A short annotation can be an entire item.</Note>
      </Collection.Item>
    </Collection.Root>
  ),
};

export const Empty: Story = {
  render: () => <Collection.Root />,
};

/** One item keeps its padding and has no hairline. */
export const Single: Story = {
  render: () => (
    <Collection.Root>
      <Collection.Item>
        <P>One freely composed item.</P>
      </Collection.Item>
    </Collection.Root>
  ),
};

/** Omissions at either end and between items produce no orphan rules. */
export const Multiple: Story = {
  render: () => (
    <Collection.Root>
      {false && <Collection.Item>Omitted first item</Collection.Item>}
      {[
        'First supplied item',
        'Second supplied item',
        'Third supplied item',
      ].map((label) => (
        <Collection.Item key={label}>
          <P>{label}</P>
        </Collection.Item>
      ))}
      {undefined}
      <Collection.Item>
        <P>Last supplied item</P>
      </Collection.Item>
      {false && <Collection.Item>Omitted last item</Collection.Item>}
    </Collection.Root>
  ),
};

/** The narrow holder is story scaffolding; Stack and Cluster own the content's wrapping. */
export const NarrowLongContent: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '18rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Collection.Root>
      <Collection.Item>
        <Stack>
          <P>
            A longer passage remains readable as it wraps onto several lines in
            a narrow container.
          </P>
          <Note color={'muted'}>
            Collection sets no type role or arrangement inside this item.
          </Note>
        </Stack>
      </Collection.Item>
      <Collection.Item>
        <Cluster justify={'between'}>
          <Link href={'#details'} treatment={'quiet'}>
            Explore the full collection of reference material
          </Link>
          <Button variant={'secondary'}>Save for later</Button>
        </Cluster>
      </Collection.Item>
      <Collection.Item>
        <P>The final item leaves the collection open at its foot.</P>
      </Collection.Item>
    </Collection.Root>
  ),
};

export const HeterogeneousDark: Story = {
  ...Heterogeneous,
  globals: { theme: 'dark' },
};
export const EmptyDark: Story = { ...Empty, globals: { theme: 'dark' } };
export const SingleDark: Story = { ...Single, globals: { theme: 'dark' } };
export const MultipleDark: Story = { ...Multiple, globals: { theme: 'dark' } };
export const NarrowLongContentDark: Story = {
  ...NarrowLongContent,
  globals: { theme: 'dark' },
};
