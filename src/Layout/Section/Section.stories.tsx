import type { Meta, StoryObj } from '@storybook/react-vite';
import { Section } from './Section';

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    bleed: {
      control: { type: 'radio' },
      options: ['inset', 'full'],
      description:
        'Whether the section sits inside the gutter or runs edge to edge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const filler = (heading: string, body: string) => (
  <>
    <h2>{heading}</h2>
    <p>{body}</p>
  </>
);

/** Three sections abutting. The join appears between them and not above the first, and there is no gap:
 *  the hairline is the separation. */
export const Abutting: Story = {
  render: () => (
    <>
      <Section>
        {filler('What we do', 'The first section takes no rule above it.')}
      </Section>
      <Section>
        {filler(
          'How it works',
          'A join is drawn against the section before it.',
        )}
      </Section>
      <Section>
        {filler(
          'What it costs',
          'And again here, with no gap on either side of the line.',
        )}
      </Section>
    </>
  ),
};

/** A `bleed="full"` section among inset ones: it drops the gutter and runs edge to edge while keeping the
 *  band, and joins the inset sections identically. */
export const FullBleedAmongInset: Story = {
  render: () => (
    <>
      <Section>
        {filler('Inset', 'This section sits inside the gutter.')}
      </Section>
      <Section bleed={'full'}>
        {filler('Full bleed', 'This one runs to the viewport edge.')}
      </Section>
      <Section>
        {filler(
          'Inset again',
          'Back inside the gutter, joined to the bleed above.',
        )}
      </Section>
    </>
  ),
};

/** A named section is promoted to a labelled region a screen-reader user can jump to. `name` must match
 *  the visible heading. */
export const Named: Story = {
  args: {
    name: 'Pricing',
    children: filler(
      'Pricing',
      'This section is exposed as a region named "Pricing".',
    ),
  },
};

/** The positioning context in use. The band below is the *consumer's* - the library ships no decoration -
 *  and it is absolutely positioned against the section, flush under the join above it. An abspos child's
 *  containing block is the padding box, so `top: 0` sits directly beneath the hairline and `left`/`right`
 *  reach the section's outer edges without having to back out of the gutter. It sits behind the reading
 *  type at `z-index: -1`, which resolves outside the section because the section makes no stacking context. */
export const AnchoredDecoration: Story = {
  render: () => (
    <>
      <Section>
        {filler('Before the join', 'An ordinary section above the hairline.')}
      </Section>
      <Section>
        <div
          aria-hidden={true}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '170px',
            zIndex: -1,
            background: 'linear-gradient(var(--color-backing), transparent)',
          }}
        />
        {filler(
          'Anchored to the join',
          'The band hangs off the join, positioned against the section rather than against a global override.',
        )}
      </Section>
    </>
  ),
};

/** A non-Section element before the first section: no rule is drawn on it, because the join keys off a
 *  preceding data-section sibling, not merely being after something. */
export const HeaderBeforeFirstSection: Story = {
  render: () => (
    <>
      <header style={{ padding: '1rem var(--gutter)' }}>
        A header, carrying no data-section.
      </header>
      <Section>
        {filler(
          'First section',
          'No rule is drawn above this one - the header is not a section.',
        )}
      </Section>
      <Section>
        {filler(
          'Second section',
          'The join appears here, between two sections.',
        )}
      </Section>
    </>
  ),
};
