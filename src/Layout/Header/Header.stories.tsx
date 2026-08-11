import { Link } from 'Interaction/Link/Link';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    edge: {
      control: { type: 'radio' },
      options: ['none', 'rule'],
      description: 'Whether the shell draws a bottom hairline',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const standing = (
  <Link treatment={'quiet'} href={'/'}>
    JuweL Development
  </Link>
);

const nav = (
  <>
    <Link treatment={'quiet'} href={'/work'} current={true}>
      Work
    </Link>
    <Link treatment={'quiet'} href={'/studio'}>
      Studio
    </Link>
    <Link treatment={'quiet'} href={'/contact'}>
      Contact
    </Link>
  </>
);

/** A place-name standing link and three quiet nav links, one of them current. The current item sits at
 *  the foreground colour every other item only reaches on hover - Header applies it from `aria-current`. */
export const Default: Story = {
  render: () => <Header standing={standing}>{nav}</Header>,
};

/** `edge="none"` drops the bottom rule - the direction whose rules are worked below the fold. */
export const NoEdge: Story = {
  render: () => (
    <Header edge={'none'} standing={standing}>
      {nav}
    </Header>
  ),
};

/** A named nav. Reach for `navName` once a page has a second navigation landmark - a footer nav will be
 *  the second - so a screen-reader user can tell the two apart. */
export const NamedNav: Story = {
  render: () => (
    <Header navName={'Primary'} standing={standing}>
      {nav}
    </Header>
  ),
};

/** The shell above two sections: its horizontal padding reads `--gutter`, so the bar aligns with every
 *  inset `Section` below it, and no rule is drawn above the first section. */
export const AboveSections: Story = {
  render: () => (
    <>
      <Header edge={'none'} standing={standing}>
        {nav}
      </Header>
      <Section>
        <h2>What we do</h2>
        <p>
          This section's gutter lines up with the header's horizontal padding.
        </p>
      </Section>
      <Section>
        <h2>How it works</h2>
        <p>
          The join appears here, between two sections, not beneath the header.
        </p>
      </Section>
    </>
  ),
};
