import { Link } from 'Interaction/Link/Link';
import { Footer } from 'Layout/Footer/Footer';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cluster } from './Cluster';

const meta: Meta<typeof Cluster> = {
  title: 'Arrangement/Cluster',
  component: Cluster,
  // Fullscreen, as the other arrangement is: Cluster takes no outer space of its own, so a padded
  // canvas would add inset it refuses to add, and a narrower one would move where the row wraps.
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    gap: {
      control: { type: 'radio' },
      options: ['stack', 'region'],
      description: 'Which space role separates items along a line',
    },
    justify: {
      control: { type: 'radio' },
      options: ['start', 'between'],
      description:
        'Whether the row runs from the start or distributes end to end',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The default: a wrapping row on `--space-region`, the gap between one group and the next, running
 *  from the start edge. */
export const Default: Story = {
  render: () => (
    <Cluster>
      <Link href={'/work'} treatment={'quiet'}>
        Work
      </Link>
      <Link href={'/studio'} treatment={'quiet'}>
        Studio
      </Link>
      <Link href={'/contact'} treatment={'quiet'}>
        Contact
      </Link>
    </Cluster>
  ),
};

/** `gap="stack"` is the sibling gap, for a row whose items belong together rather than one group
 *  beside the next. */
export const StackGap: Story = {
  render: () => (
    <Cluster gap={'stack'}>
      <Link href={'/terms'} treatment={'quiet'}>
        Terms
      </Link>
      <Link href={'/privacy'} treatment={'quiet'}>
        Privacy
      </Link>
      <Link href={'/imprint'} treatment={'quiet'}>
        Imprint
      </Link>
    </Cluster>
  ),
};

/** `justify="between"` distributes end to end - the row with a group at each end. It wants two
 *  groups: loose items pushed apart read as a gap in the middle rather than as a distribution. */
export const Distributed: Story = {
  render: () => (
    <Cluster justify={'between'}>
      <span>© 2026 Juwel</span>
      <Cluster gap={'stack'}>
        <Link href={'/terms'} treatment={'quiet'}>
          Terms
        </Link>
        <Link href={'/privacy'} treatment={'quiet'}>
          Privacy
        </Link>
      </Cluster>
    </Cluster>
  ),
};

/** Enough items to wrap. The gap between the wrapped lines is always the tighter sibling role, so
 *  the lines keep reading as one group; narrow the frame to see it. */
export const Wrapped: Story = {
  render: () => (
    <Cluster>
      <Link href={'/one'} treatment={'quiet'}>
        Long-form writing
      </Link>
      <Link href={'/two'} treatment={'quiet'}>
        Identity and brand systems
      </Link>
      <Link href={'/three'} treatment={'quiet'}>
        Editorial photography
      </Link>
      <Link href={'/four'} treatment={'quiet'}>
        Exhibition design
      </Link>
      <Link href={'/five'} treatment={'quiet'}>
        Type commissions
      </Link>
    </Cluster>
  ),
};

/** A `Cluster` inside a `Footer`, with the caller's own named `nav` around it: the footer owns the
 *  landmark, the type, the band and the gutter, and the cluster owns only the row and its gaps.
 *  That composition is why there is no nav, no landmark and no gutter prop here. */
export const InsideAFooter: Story = {
  render: () => (
    <Footer>
      <Cluster justify={'between'}>
        <span>© 2026 Juwel</span>
        <nav aria-label={'Footer'}>
          <Cluster gap={'stack'}>
            <Link href={'/terms'} treatment={'quiet'}>
              Terms
            </Link>
            <Link href={'/privacy'} treatment={'quiet'}>
              Privacy
            </Link>
            <Link href={'/imprint'} treatment={'quiet'}>
              Imprint
            </Link>
          </Cluster>
        </nav>
      </Cluster>
    </Footer>
  ),
};
