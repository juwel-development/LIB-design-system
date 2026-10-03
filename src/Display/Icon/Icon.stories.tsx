import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';

const meta: Meta<typeof Icon> = {
  title: 'Display/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Draws one of three shapes - \`sort\` (up and down), \`sort-ascending\` (up) and \`sort-descending\` (down). It is hidden from assistive technology, adds no tab stop, and takes the size and colour of the text it sits in; the control or text beside it carries the meaning - a \`Button\` label, a header cell's \`ariaSort\`. A name selects a drawing, never a state or a behaviour: the consumer picks the icon that matches the order it currently displays. The composed header is shown under Display/Table.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: { type: 'radio' },
      options: ['sort', 'sort-ascending', 'sort-descending'],
      description: 'Which drawing; a name selects a shape, never a state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The unsorted indicator: an up and a down arrow side by side. */
export const Sort: Story = {
  args: { name: 'sort' },
};

/** The ascending indicator: one up arrow. */
export const SortAscending: Story = {
  args: { name: 'sort-ascending' },
};

/** The descending indicator: one down arrow. */
export const SortDescending: Story = {
  args: { name: 'sort-descending' },
};

/**
 * All three in one line of text, so the shapes can be told apart side by side and the glyph is seen
 * taking the size and colour of the text around it - the muted label role here, body text below.
 */
export const BesideText: Story = {
  args: { name: 'sort' },
  render: () => (
    <div className={'flex flex-col gap-4 text-foreground'}>
      <p className={'font-secondary text-label text-muted tracking-label'}>
        Unsorted <Icon name={'sort'} /> · Ascending{' '}
        <Icon name={'sort-ascending'} /> · Descending{' '}
        <Icon name={'sort-descending'} />
      </p>
      <p className={'font-primary text-body'}>
        Unsorted <Icon name={'sort'} /> · Ascending{' '}
        <Icon name={'sort-ascending'} /> · Descending{' '}
        <Icon name={'sort-descending'} />
      </p>
      <p className={'font-primary text-title'}>
        Title <Icon name={'sort-ascending'} />
      </p>
    </div>
  ),
};
