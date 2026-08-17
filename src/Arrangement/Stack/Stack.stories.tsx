import { P } from 'Display/Typography/P/P';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from './Stack';

const meta: Meta<typeof Stack> = {
  title: 'Arrangement/Stack',
  component: Stack,
  // Fullscreen, as the other viewport-sensitive components are: Stack takes no outer space of its
  // own, so a padded canvas would add inset it refuses to add and move where 64rem falls under the
  // `split` story.
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    gap: {
      control: { type: 'radio' },
      options: ['stack', 'region'],
      description: 'Which space role separates the children',
    },
    measure: {
      control: { type: 'boolean' },
      description: 'Bounds the column to the reading measure',
    },
    direction: {
      control: { type: 'radio' },
      options: ['column', 'split'],
      description: 'Whether the column becomes a row on a wide viewport',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: a column on `--space-stack`, the gap between siblings inside one block, unbounded. */
export const Default: Story = {
  render: () => (
    <Stack>
      <P>The first block.</P>
      <P>The second block, a sibling of the first.</P>
      <P>The third.</P>
    </Stack>
  ),
};

/** `gap="region"` separates groups of blocks rather than blocks - a form's fields from its actions,
 *  a page's opening from what follows it. */
export const RegionGap: Story = {
  render: () => (
    <Stack gap={'region'}>
      <Stack>
        <P>One group's first block.</P>
        <P>Its second.</P>
      </Stack>
      <Stack>
        <P>The next group, a region away.</P>
        <P>Its second.</P>
      </Stack>
    </Stack>
  ),
};

/** `measure` bounds the column to the reading measure. Without it the column fills whatever holds it,
 *  which is what a stack of cards or controls wants. */
export const Measured: Story = {
  render: () => (
    <Stack measure>
      <P>
        Bounded at the reading measure, counted in characters rather than in
        length, so the count holds as the type size moves under it.
      </P>
      <P>
        A second paragraph, capped at the same width. The stack sets no
        font-size, so the measure keeps resolving against inherited body type.
      </P>
    </Stack>
  ),
};

/** `direction="split"` is the same column turning into a row at and above 64rem - the threshold the
 *  two-track components already use. Resize the frame past it to see the axis change. */
export const Split: Story = {
  render: () => (
    <Stack direction={'split'} gap={'region'}>
      <P>The first track. Below 64rem this sits above its sibling.</P>
      <P>The second track, beside the first on a wide viewport.</P>
    </Stack>
  ),
};

/** A `Stack` inside a `Section`: the section owns the band, the gutter and the join, and the stack
 *  owns only the column and its gap. That composition is why there is no gutter prop here. */
export const InsideASection: Story = {
  render: () => (
    <Section>
      <Stack gap={'region'} measure>
        <P>The section carries the vertical band and the gutter.</P>
        <P>
          The stack carries one axis and one gap, and no outer space at all.
        </P>
      </Stack>
    </Section>
  ),
};
