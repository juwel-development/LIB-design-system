import { Cluster } from 'Arrangement/Cluster/Cluster';
import { Brandmark } from 'Display/Brandmark/Brandmark';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
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

const mark = (
  <Link treatment={'graphic'} href={'/'}>
    <Brandmark name={'JuweL Development'} cut={'compact'}>
      {/* An obviously generic placeholder, as in Brandmark's own stories - no brand asset ships here
          (issue #16). It stands in for the consumer's inline SVG, drawn shorter than the slot's floors
          so what the story shows is the floor holding rather than the drawing setting the height. */}
      <svg
        viewBox={'0 0 96 12'}
        width={'96'}
        height={'12'}
        aria-hidden={'true'}
      >
        <rect
          x={'1'}
          y={'1'}
          width={'94'}
          height={'10'}
          fill={'none'}
          stroke={'currentColor'}
        />
      </svg>
    </Brandmark>
  </Link>
);

/** The two standing routes a product actually ships, stacked: a place name on one page and a mark on
 *  another. Both sit inside the slot's floors - the nav's line box in height, `--standing-min-width` in
 *  width - so the two bars are the same height and navigating between the routes moves nothing. A mark
 *  that should *fill* the slot rather than sit inside it is the caller's opt-in; see `@CallerMustEnsure`. */
export const StandingRoutes: Story = {
  render: () => (
    <>
      <Header standing={standing}>{nav}</Header>
      <Header standing={mark}>{nav}</Header>
    </>
  ),
};

/** The `@CallerMustEnsure` fill rule, above the place-name route it has to match. A consumer's mark is
 *  commonly a `viewBox`-only SVG: it has no intrinsic width to fill from, and `width: 100%` cannot
 *  resolve against the slot's indefinite basis, so telling it to fill that way renders it at its
 *  intrinsic width and the bar jumps between routes - measured at 300px against the place name's 120,
 *  which is 26px of header height. A definite width on the wrapping element - the same token the slot is
 *  floored at, so the two move together when a theme re-points it - is what makes the mark fill the
 *  slot, and the two bars then measure the same height exactly.
 *
 *  Drawn short enough that its line box still fits the height floor: a mark whose ratio makes it taller
 *  than the floor at the floor's width grows the bar instead, which is the floor yielding as designed.
 *  Caller markup by necessity - `Link` and `Brandmark` take no `style`, which is the closed prop surface
 *  working as intended. */
export const FillingMark: Story = {
  render: () => (
    <>
      <Header
        standing={
          <a href={'/'} style={{ width: 'var(--standing-min-width)' }}>
            <svg
              viewBox={'0 0 300 30'}
              style={{ width: '100%', height: 'auto' }}
              aria-label={'JuweL Development'}
              role={'img'}
            >
              <rect
                x={'1'}
                y={'1'}
                width={'298'}
                height={'28'}
                fill={'none'}
                stroke={'currentColor'}
              />
            </svg>
          </a>
        }
      >
        {nav}
      </Header>
      <Header standing={standing}>{nav}</Header>
    </>
  ),
};

/** A standing name wider than the width floor. The floor is a floor: the slot grows to the name, which
 *  stays on one line rather than being clamped back and wrapped. */
export const LongStandingName: Story = {
  render: () => (
    <Header
      standing={
        <Link treatment={'quiet'} href={'/'}>
          {'JuweL Development and Partners'}
        </Link>
      }
    >
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

const date = (
  <Cluster gap={'stack'}>
    <P>Monday, 3 October 2026</P>
    <Note color={'muted'}>09:00</Note>
  </Cluster>
);

const balance = <P testId={'balance'}>{'Balance: $1,250,000'}</P>;

const continueAction = (
  <Button variant={'primary'} testId={'continue'}>
    Continue
  </Button>
);

/** A bar that reports and does not navigate: a date in the standing slot, a Balance in `status` beside
 *  it, and no `children`, so no `<nav>` renders at all. The status slot is a plain box - no landmark, no
 *  live region - and the matter inside it wears its own type roles. */
export const StatusOnly: Story = {
  render: () => <Header standing={date} status={balance} />,
};

/** A lone action: nothing between the standing slot and the far edge, where the action's own auto
 *  margin puts it. Not inside a nav - a button is not navigation - and with no `children` there is no
 *  nav to be inside. */
export const ActionOnly: Story = {
  render: () => <Header standing={date} action={continueAction} />,
};

/** The consumer's Top bar (#125): status on the left beside the standing date, Continue at the far right,
 *  no navigation landmark anywhere. Reading and keyboard order run left to right - date, Balance, Continue -
 *  and the Continue button keeps its own focus ring; tab into the story to see it. */
export const StatusAndAction: Story = {
  render: () => (
    <Header standing={date} status={balance} action={continueAction} />
  ),
};

/** All four slots at once, for a page that both navigates and acts. The status slot stays beside the
 *  standing one, the nav sits with the matter before it, and the action alone takes the far edge - one
 *  auto margin, because two on a line would float the nav halfway across. Reading order is standing,
 *  status, nav, action. */
export const WithNav: Story = {
  render: () => (
    <Header
      navName={'Primary'}
      standing={standing}
      status={<P>{'Signed in as Alex'}</P>}
      action={<Button variant={'secondary'}>Sign out</Button>}
    >
      {nav}
    </Header>
  ),
};

/** Several readouts and a note in one status slot, composed by the caller in a `Cluster` - the library
 *  arranges nothing inside a slot. Long translated wording: the Cluster wraps inside its slot while
 *  room remains, and once the line is spent the bar breaks - whole slots drop in reading order - while
 *  the action keeps its edge and its label, which never wraps. */
export const LongLabels: Story = {
  render: () => (
    <Header
      standing={
        <Cluster gap={'stack'}>
          <P>Montag, 3. Oktober 2026</P>
          <Note color={'muted'}>09:00 Uhr</Note>
        </Cluster>
      }
      status={
        <Cluster gap={'stack'}>
          <P>{'Kontostand: 1.250.000 $'}</P>
          <Note>
            {'Eine Antwort wird erwartet, bevor die Woche weitergeht'}
          </Note>
        </Cluster>
      }
      action={
        <Button variant={'primary'} disabled={true}>
          {'Weiter zur nächsten Woche'}
        </Button>
      }
    />
  ),
};

/** The same bar held at a narrow desktop width. The standing slot and the action keep their width;
 *  what no longer fits on the first line drops to the next, gapped with `--space-stack`, and Continue
 *  stays flush with the bar's content edge on whichever line it lands - its right edge is the header's
 *  right edge minus the gutter. Nothing overflows and the page gains no horizontal scroll. The frame is
 *  story furniture; a product never fixes the width. */
export const NarrowDesktop: Story = {
  render: () => (
    <div style={{ width: '48rem', maxWidth: '100%' }}>
      <Header
        standing={date}
        status={
          <Cluster gap={'stack'}>
            <P>{'Kontostand: 1.250.000 $'}</P>
            <Note>{'Eine Antwort wird erwartet'}</Note>
          </Cluster>
        }
        action={continueAction}
      />
    </div>
  ),
};
