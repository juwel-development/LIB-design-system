import { Link } from 'Interaction/Link/Link';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer } from './Footer';

const meta: Meta<typeof Footer> = {
  title: 'Layout/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    edge: {
      control: { type: 'radio' },
      options: ['rule', 'none'],
      description: 'Whether the footer draws its top hairline or none',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The default footer: the small muted type, the shell's air, the gutter, and the top hairline in the
 *  page's single rule weight. */
export const Default: Story = {
  args: {
    children: '© 2026 Juwel. All rights reserved.',
  },
};

/** `edge="none"` drops the top rule, for a page whose footer needs no visible separation. */
export const NoEdge: Story = {
  args: {
    edge: 'none',
    children: '© 2026 Juwel. All rights reserved.',
  },
};

/** A footer beneath two sections: its gutter aligns with the inset sections above it, and its top rule is
 *  the same hairline the section join draws. */
export const BeneathSections: Story = {
  render: () => (
    <>
      <Section>
        <h2>What we do</h2>
        <p>The first section takes no rule above it.</p>
      </Section>
      <Section>
        <h2>How it works</h2>
        <p>A join is drawn against the section before it.</p>
      </Section>
      <Footer>© 2026 Juwel. All rights reserved.</Footer>
    </>
  ),
};

/** The slot is opaque and holds whatever the consumer supplies. Here a `<nav>` of quiet links - which
 *  underline on hover in this placement - sits above a plain credit line, showing the small type suits
 *  both navigation and running text. The consumer names the nav; the footer does not wrap it. */
export const NavigationAndCredit: Story = {
  render: () => (
    <Footer>
      <nav aria-label={'Footer'}>
        <Link href={'/about'} treatment={'quiet'}>
          About
        </Link>{' '}
        ·{' '}
        <Link href={'/privacy'} treatment={'quiet'}>
          Privacy
        </Link>{' '}
        ·{' '}
        <Link href={'/contact'} treatment={'quiet'}>
          Contact
        </Link>
      </nav>
      <p>© 2026 Juwel · Made in Berlin</p>
    </Footer>
  ),
};
