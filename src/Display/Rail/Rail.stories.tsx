import { H2 } from 'Display/Typography/H2/H2';
import { Prose } from 'Display/Typography/Prose/Prose';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rail } from './Rail';

const meta: Meta<typeof Rail.Root> = {
  title: 'Display/Rail',
  component: Rail.Root,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default: a numbered index filed beside its section. Resize the canvas across 64rem to see the
 * switch - above it the index is a sticky column, below it a filed heading over the text. It is a media
 * query, not a prop.
 */
export const Numbered: Story = {
  render: () => (
    <Section>
      <Rail.Root>
        <Rail.Index number="02">Work</Rail.Index>
        <Rail.Content>
          <Prose.Root>
            <H2>Work</H2>
            <Prose.Body>
              The index files this section without heading it: a numeral and the
              section&apos;s name, set beside the matter rather than above it.
            </Prose.Body>
          </Prose.Root>
        </Rail.Content>
      </Rail.Root>
    </Section>
  ),
};

/** The same rail with `number` omitted - the index renders its name alone, with no empty numeral. */
export const Unnumbered: Story = {
  render: () => (
    <Section>
      <Rail.Root>
        <Rail.Index>Colophon</Rail.Index>
        <Rail.Content>
          <Prose.Root>
            <H2>Colophon</H2>
            <Prose.Body>
              An index numeral is a brand decision the consumer writes; a
              section that carries none files under its name alone.
            </Prose.Body>
          </Prose.Root>
        </Rail.Content>
      </Rail.Root>
    </Section>
  ),
};

/**
 * Three consecutive filed sections. Scroll the canvas at a wide viewport: each index sticks beside its
 * own section and leaves with it, because `position: sticky` holds only for the height of its row.
 */
export const Scrolling: Story = {
  render: () => (
    <>
      {[
        { number: '02', name: 'Work' },
        { number: '03', name: 'Studio' },
        { number: '04', name: 'Contact' },
      ].map((entry) => (
        <Section key={entry.number}>
          <Rail.Root>
            <Rail.Index number={entry.number}>{entry.name}</Rail.Index>
            <Rail.Content>
              <Prose.Root>
                <H2>{entry.name}</H2>
                {['first', 'second', 'third', 'fourth', 'fifth', 'sixth'].map(
                  (line) => (
                    <Prose.Body key={line}>
                      A tall section, so the index has a full row to stick
                      within before it hands off to the next - the {line} line
                      of many.
                    </Prose.Body>
                  ),
                )}
              </Prose.Root>
            </Rail.Content>
          </Rail.Root>
        </Section>
      ))}
    </>
  ),
};

/**
 * The narrow-screen collapse. Set the canvas below 64rem: the index lies down above the content as a
 * filed heading, keeping no column of its own and costing no horizontal room.
 */
export const Collapsed: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => (
    <Section>
      <Rail.Root>
        <Rail.Index number="02">Work</Rail.Index>
        <Rail.Content>
          <Prose.Root>
            <H2>Work</H2>
            <Prose.Body>
              Below 64rem the index is a heading above the text by design:
              keeping the column would take ~40% of a 390px screen to file a
              section that is already on screen.
            </Prose.Body>
          </Prose.Root>
        </Rail.Content>
      </Rail.Root>
    </Section>
  ),
};
