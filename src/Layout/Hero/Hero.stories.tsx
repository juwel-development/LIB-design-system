import { Brandmark } from 'Display/Brandmark/Brandmark';
import { H1 } from 'Display/Typography/H1/H1';
import { Link } from 'Interaction/Link/Link';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hero } from './Hero';

const meta: Meta<typeof Hero> = {
  title: 'Layout/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    place: {
      control: { type: 'radio' },
      options: ['start', 'center', 'between'],
      description: 'Where the opaque slot sits in the fold',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** `place="start"` pins the slot to the top of the fold - the minimum height without the centring. */
export const Start: Story = {
  render: () => (
    <Section bleed={'full'}>
      <Hero place={'start'}>
        <H1>The first screen earns attention or nothing does.</H1>
      </Hero>
    </Section>
  ),
};

/** `place="center"` (the default) centres the slot in the fold - the conventional hero. */
export const Center: Story = {
  render: () => (
    <Section bleed={'full'}>
      <Hero place={'center'}>
        <H1>The first screen earns attention or nothing does.</H1>
      </Hero>
    </Section>
  ),
};

/** `place="between"` spreads the slot across the fold, so a poster's foot lands on the bottom edge. */
export const Between: Story = {
  render: () => (
    <Section bleed={'full'}>
      <Hero place={'between'}>
        <H1>The first screen earns attention or nothing does.</H1>
        <Link href={'/work'} treatment={'label-link'}>
          See the work
        </Link>
      </Hero>
    </Section>
  ),
};

/** A poster hero the consumer composes - mark, lead and foot - inside a `Section bleed="full"`, above an
 *  ordinary `Section`. The fold stops short of the viewport by design, so the next section's join sits
 *  just inside the bottom edge and the page announces that it continues: the whole reason the fold height
 *  is `min(70vh, 40rem)` and never `100vh`. The lead is a plain `<H1>` the consumer places in the slot;
 *  `Hero` renders no heading of its own, and the display measure arrives with the heading rather than
 *  with the slot, which would cap the mark above it too. */
export const PosterAboveSection: Story = {
  render: () => (
    <>
      <Section bleed={'full'}>
        <Hero place={'between'}>
          <Brandmark name={'Juwel'} cut={'full'}>
            <svg viewBox={'0 0 120 32'} width={'120'} height={'32'}>
              <title>Juwel</title>
              <text x={'0'} y={'26'} fontSize={'28'} fill={'currentColor'}>
                Juwel
              </text>
            </svg>
          </Brandmark>
          <H1>A studio for the long read, not the first glance.</H1>
          <Link href={'/work'} treatment={'label-link'}>
            See the work
          </Link>
        </Hero>
      </Section>
      <Section>
        <h2>What we do</h2>
        <p>
          This section's join sits just inside the viewport, because the fold
          above it stops short of filling the screen.
        </p>
      </Section>
    </>
  ),
};
