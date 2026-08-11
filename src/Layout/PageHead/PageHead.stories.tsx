import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHead } from './PageHead';

const meta: Meta<typeof PageHead> = {
  title: 'Layout/PageHead',
  component: PageHead,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The full head: title, a lede standfirst at a slightly wider measure, and a muted intro at the
 *  reading measure. One scale event, then small print. */
export const Default: Story = {
  render: () => (
    <PageHead
      title={'A practice built around the long read'}
      lede={
        'We make things that reward attention: interfaces that stay legible at the fifth screen, not just the first.'
      }
      intro={
        'Founded in 2019. Based wherever the work is. No borrowed proof, no testimonials - just the pages themselves.'
      }
    />
  ),
};

/** Title and lede only. Omitting the intro renders no third paragraph. */
export const NoIntro: Story = {
  render: () => (
    <PageHead
      title={'Work'}
      lede={'Selected projects, each one a page you can read end to end.'}
    />
  ),
};

/** A bare title. The head is still full-bleed over the band and the gutter. */
export const TitleOnly: Story = {
  render: () => <PageHead title={'Contact'} />,
};

/** The head above the first section of the page: it spans the full content width - opting out of the
 *  index column - while its gutter lines up with the inset `Section` below. */
export const AboveSections: Story = {
  render: () => (
    <>
      <PageHead
        title={'About the studio'}
        lede={
          'We design for the long read, and the second screen and the fifth.'
        }
        intro={
          'A short standfirst, muted, at the reading measure below the lede.'
        }
      />
      <Section>
        <h2>What we do</h2>
        <p>
          This section's gutter lines up with the head's horizontal padding.
        </p>
      </Section>
    </>
  ),
};
