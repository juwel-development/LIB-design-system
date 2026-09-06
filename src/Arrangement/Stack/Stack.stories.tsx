import { Table } from 'Display/Table/Table';
import { H1 } from 'Display/Typography/H1/H1';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import { Cover } from 'Layout/Cover/Cover';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
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
      control: { type: 'radio' },
      options: [false, true, 'action'],
      description:
        'Bounds the column: the reading measure for text, the action column for controls',
    },
    align: {
      control: { type: 'radio' },
      options: [undefined, 'start', 'center'],
      description:
        'Inherited text alignment within each text block; omission inherits, start resets in LTR and RTL. Does not place or resize children.',
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

/** `measure="action"` bounds the column to the action column - the width a stack of full-width
 *  controls fills, so they read as one unit and their labels align. The buttons carry no prop for
 *  it: a flex column stretches its children, and the stack asks for the bound as its own width -
 *  so even a shrink-to-fit frame like `Cover`'s slot opens to hold it, instead of shrinking the
 *  column to its widest label (#99). */
export const ActionColumn: Story = {
  render: () => (
    <Stack measure={'action'}>
      <Button>Start a new label</Button>
      <Button variant={'secondary'}>Open an existing one</Button>
      <Button variant={'secondary'}>Import from file</Button>
      <Button variant={'ghost'}>Settings</Button>
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

/** Text centres within its own block, independently of box placement. Resize below the action
 *  bound to see both roles wrap; words wider than their block are outside this guarantee. */
export const CenteredText: Story = {
  args: { align: 'center' },
  render: (args) => (
    <Cover>
      <Stack measure={'action'} align={args.align}>
        <H1>A place for every jar</H1>
        <Note>Every jar named, every shelf ready for the next season.</Note>
        <Button>Start a label</Button>
      </Stack>
    </Cover>
  ),
  play: async ({ canvasElement, args }) => {
    if (args.align !== 'center') return;
    await document.fonts.ready;
    for (const block of canvasElement.querySelectorAll('h1, p')) {
      const rectangle = block.getBoundingClientRect();
      const axis = (rectangle.left + rectangle.right) / 2;
      const range = document.createRange();
      range.selectNodeContents(block);
      for (const line of range.getClientRects()) {
        await expect(
          Math.abs((line.left + line.right) / 2 - axis),
        ).toBeLessThanOrEqual(0.1);
      }
    }
  },
};

/** Omitted alignment inherits through nested Stacks. A start reset follows the document's
 *  direction; Table cells keep their own explicit alignment inside the centred group. */
export const InheritedAndReset: Story = {
  render: () => (
    <Stack align={'center'}>
      <Stack>
        <Note>Inherited centre</Note>
      </Stack>
      <div dir={'ltr'}>
        <Stack align={'start'}>
          <Note>Logical start in LTR</Note>
        </Stack>
      </div>
      <div dir={'rtl'}>
        <Stack align={'start'}>
          <Note>بداية السطر</Note>
        </Stack>
      </div>
      <Table.Root caption={'Alignment owned by cells'}>
        <Table.Body>
          <Table.Row>
            <Table.Cell align={'right'}>Explicit right</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      getComputedStyle(canvas.getByText('Inherited centre')).textAlign,
    ).toBe('center');
    const leftToRight = getComputedStyle(
      canvas.getByText('Logical start in LTR'),
    );
    await expect(leftToRight.textAlign).toBe('start');
    await expect(leftToRight.direction).toBe('ltr');
    const rightToLeft = getComputedStyle(canvas.getByText('بداية السطر'));
    await expect(rightToLeft.textAlign).toBe('start');
    await expect(rightToLeft.direction).toBe('rtl');
    await expect(getComputedStyle(canvas.getByRole('cell')).textAlign).toBe(
      'right',
    );
  },
};

/** Alignment applies within each track even after split becomes a row. The action columns
 *  keep their own bounds and placement; their text need not share the outer Stack's axis. */
export const AlignedTracks: Story = {
  args: { align: 'center', direction: 'split', gap: 'region' },
  render: (args) => (
    <Stack {...args}>
      <Stack measure={'action'}>
        <Note>One track with a short annotation.</Note>
      </Stack>
      <Stack measure={'action'}>
        <Note>
          Another track with a longer annotation that can wrap over several
          lines.
        </Note>
      </Stack>
    </Stack>
  ),
};
