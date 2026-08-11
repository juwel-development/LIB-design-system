import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prose } from './Prose';

const meta: Meta<typeof Prose.Root> = {
  title: 'Display/Typography/Prose',
  component: Prose.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A lede, two body paragraphs - one muted - and a stepped-down tail, all capped at the measure. */
export const Default: Story = {
  render: () => (
    <Prose.Root>
      <Prose.Lede>
        A block of running text opens with a lede: larger, more tightly led, and
        set apart from the body that follows it.
      </Prose.Lede>
      <Prose.Body>
        The body carries the argument. It sits at the same body role as every
        other paragraph in the system, bounded here by the reading measure so
        the line length stays inside the band that reads comfortably. Nothing
        about the paragraph changes; the column around it is what holds the
        measure still.
      </Prose.Body>
      <Prose.Body color={'muted'}>
        A muted body paragraph steps back without leaving the reading column -
        an aside, a caveat, a source - while keeping the same size and leading
        as the copy around it.
      </Prose.Body>
      <Prose.Tail>
        A closing note, stepped down to the small role and muted: the last word
        of the block, quieter than the body it follows.
      </Prose.Tail>
    </Prose.Root>
  ),
};

/** Inside a wider grid cell the column still caps at the measure - the cell does not widen it. */
export const InAWiderGridCell: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 60rem)',
        padding: '2rem',
      }}
    >
      <Prose.Root>
        <Prose.Lede>
          The grid cell is far wider than the reading measure, yet the column
          holds its width.
        </Prose.Lede>
        <Prose.Body>
          Because the measure lives on the block and not on the page, a wider
          container cannot stretch the line length past the reading band. This
          is the behaviour a story exists to show: the same block, dropped into
          a column with room to spill, stays bounded.
        </Prose.Body>
      </Prose.Root>
    </div>
  ),
};
