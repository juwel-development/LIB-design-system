import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './Link';

const meta: Meta<typeof Link> = {
  title: 'Interaction/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    treatment: {
      control: { type: 'radio' },
      options: ['prose', 'quiet', 'label-link', 'graphic'],
      description: 'Which of the four link treatments to render',
    },
    external: {
      control: { type: 'boolean' },
      description: 'Opens in a new tab and sets rel="noopener noreferrer"',
    },
    current: {
      control: { type: 'boolean' },
      description: 'Marks the link as the current page (aria-current="page")',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Prose: Story = {
  args: {
    href: '/pricing',
    treatment: 'prose',
    children: 'the pricing page',
  },
};

export const Quiet: Story = {
  args: {
    href: '/about',
    treatment: 'quiet',
    children: 'About',
  },
};

export const LabelLink: Story = {
  args: {
    href: '/tags/design',
    treatment: 'label-link',
    children: 'DESIGN',
  },
};

// The child is a mark, not text, so graphic is the only treatment that leaves it alone: no colour
// shift and no underline, at rest or on hover.
export const Graphic: Story = {
  args: {
    href: '/',
    treatment: 'graphic',
    children: (
      <svg
        width={'24'}
        height={'24'}
        viewBox={'0 0 24 24'}
        role={'img'}
        aria-label={'Home'}
      >
        <rect width={'24'} height={'24'} rx={'4'} fill={'currentColor'} />
      </svg>
    ),
  },
};

export const External: Story = {
  args: {
    href: 'https://example.com',
    treatment: 'quiet',
    external: true,
    children: 'Documentation',
  },
};

export const Current: Story = {
  args: {
    href: '/about',
    treatment: 'quiet',
    current: true,
    children: 'About',
  },
};

// All four treatments, so the prose underline, the quiet hover shift, the inherited label link and
// the untouched graphic mark can be compared side by side. Prose sits in running text because that is
// where its underline does its work.
const AllTreatments = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <p style={{ maxWidth: '32ch' }}>
      Running text with <Link href={'/pricing'}>a prose link</Link> that is told
      apart by its underline.
    </p>
    <nav style={{ display: 'flex', gap: '1rem' }}>
      <Link href={'/about'} treatment={'quiet'}>
        About
      </Link>
      <Link href={'/work'} treatment={'quiet'}>
        Work
      </Link>
      <Link href={'/contact'} treatment={'quiet'}>
        Contact
      </Link>
    </nav>
    <Link href={'/tags/design'} treatment={'label-link'}>
      DESIGN
    </Link>
    <Link href={'/'} treatment={'graphic'}>
      <svg
        width={'24'}
        height={'24'}
        viewBox={'0 0 24 24'}
        role={'img'}
        aria-label={'Home'}
      >
        <rect width={'24'} height={'24'} rx={'4'} fill={'currentColor'} />
      </svg>
    </Link>
  </div>
);

// Both themes at once: the second block re-points the tokens through the `.dark` class, so a reviewer
// sees every treatment under light and dark without touching the toolbar.
export const Treatments: Story = {
  render: () => <AllTreatments />,
};

export const BothThemes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem' }}>
        <AllTreatments />
      </div>
      <div
        className={'dark'}
        style={{ background: 'var(--color-surface)', padding: '1.5rem' }}
      >
        <AllTreatments />
      </div>
    </div>
  ),
};
