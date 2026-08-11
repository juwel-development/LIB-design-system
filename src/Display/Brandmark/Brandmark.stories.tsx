import type { Meta, StoryObj } from '@storybook/react-vite';
import { Brandmark } from './Brandmark';

const meta: Meta<typeof Brandmark> = {
  title: 'Display/Brandmark',
  component: Brandmark,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// An obviously generic placeholder - no real brand asset ships in this repo (issue #16). It stands
// in for the consumer's inline SVG so the naming and the cut are what the stories demonstrate.
const FullMark = () => (
  <svg viewBox={'0 0 160 40'} width={'160'} height={'40'} aria-hidden={'true'}>
    <rect
      x={'2'}
      y={'2'}
      width={'156'}
      height={'36'}
      fill={'none'}
      stroke={'currentColor'}
    />
    <text
      x={'80'}
      y={'27'}
      textAnchor={'middle'}
      fontFamily={'serif'}
      fontSize={'20'}
    >
      placeholder
    </text>
  </svg>
);

const CompactMark = () => (
  <svg viewBox={'0 0 40 40'} width={'40'} height={'40'} aria-hidden={'true'}>
    <rect
      x={'2'}
      y={'2'}
      width={'36'}
      height={'36'}
      fill={'none'}
      stroke={'currentColor'}
    />
    <text
      x={'20'}
      y={'27'}
      textAnchor={'middle'}
      fontFamily={'serif'}
      fontSize={'20'}
    >
      pl
    </text>
  </svg>
);

/** The full lockup, named. A named mark is announced once as its name and never through its SVG. */
export const Full: Story = {
  render: () => (
    <Brandmark name={'Placeholder'} cut={'full'}>
      <FullMark />
    </Brandmark>
  ),
};

/** The compact cut - a short crop for square and small slots - named the same way. */
export const Compact: Story = {
  render: () => (
    <Brandmark name={'Placeholder'} cut={'compact'}>
      <CompactMark />
    </Brandmark>
  ),
};

/**
 * A decorative mark with `name=""`: it leaves the accessibility tree entirely. Correct where the mark
 * sits beside the product name already set as text, so naming it would announce the same words twice.
 */
export const Decorative: Story = {
  render: () => (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <Brandmark name={''} cut={'compact'}>
        <CompactMark />
      </Brandmark>
      <span style={{ fontFamily: 'serif', fontSize: '1.25rem' }}>
        Placeholder
      </span>
    </span>
  ),
};

/**
 * The intended composition: the mark placed inside a link. Brandmark owns no anchor - the link is
 * written here, in the story, the way `Header` (#14) wraps the mark to make it a home link.
 */
export const InsideALink: Story = {
  render: () => (
    // biome-ignore lint/a11y/useValidAnchor: a placeholder home link for the composition demo.
    <a href={'#'}>
      <Brandmark name={'Placeholder, home'} cut={'full'}>
        <FullMark />
      </Brandmark>
    </a>
  ),
};
