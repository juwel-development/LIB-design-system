import { Cluster } from 'Arrangement/Cluster/Cluster';
import { Brandmark } from 'Display/Brandmark/Brandmark';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import { Link } from 'Interaction/Link/Link';
import { Section } from 'Layout/Section/Section';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Header } from './Header';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The shell's top edge, in one of two mutually exclusive modes. The props type is a union of the two
shapes, so a call that mixes them does not compile.

**Navigation bar** — the default, and what every existing caller renders unchanged: \`standing\` (the
consumer's own anchor), the nav links as \`children\`, \`navName\` once a page has a second nav. The
links sit inside a single \`<nav>\`; a readout or a button never goes there, because the nav is a
navigation landmark and announces its contents as navigation.

**Status/action bar** — for a product whose shell reports and acts rather than navigates, the Label
Manager's Top bar among them (#125): \`status\` at the start edge, first in reading order; \`action\`
at the end edge, last in reading and keyboard order. Neither slot is a landmark: each is a plain
\`div\` with no role, no name and no live region, and no \`<nav>\` renders at all. There is no standing
link in this bar; a date or a mark that must show belongs in \`status\`. An omitted or withheld slot
(\`{ready && <Button/>}\`) renders no box and reserves no space.

**Layout** — the two slots share one line while both fit, the control flush with the end content edge.
Below that width the control drops below the readout and keeps its edge; the readout then takes the
whole line and wraps inside it, unbroken wording included, so the bar never widens the page. Gaps are
\`--space-region\` along a line and \`--space-stack\` between lines; the inset is \`--gutter\`. The break
is CSS alone, so a width change keeps descendant state and focus.

**The consumer owns** the wording and type role of what fills a slot (a bare string reads at the
label role; a \`P\`, a \`Note\` or a \`Button\` wears its own), whether a changing readout is announced
(wrap your own live region inside \`status\`), and whether the control is available (pass it disabled,
or withhold it). Header adds no live region, no announcement and no game behaviour.
`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    edge: {
      control: { type: 'radio' },
      options: ['none', 'rule'],
      description: 'Whether the shell draws a bottom hairline',
    },
    standing: {
      control: false,
      description:
        'Navigation bar: the standing link, supplied whole by the consumer',
    },
    children: {
      control: false,
      description: 'Navigation bar: the nav links, inside the single `<nav>`',
    },
    navName: {
      control: false,
      description:
        'Navigation bar: names the nav once a page has more than one',
    },
    status: {
      control: false,
      description:
        'Status/action bar: the readout at the start edge, in a plain box',
    },
    action: {
      control: false,
      description:
        'Status/action bar: the control at the end edge, in a plain box',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Geometry read the way a viewer sees it. The content edges are the header's box minus its inset, so
// "flush with the content edge" is a number a play function can hold to half a pixel.
const contentEdges = (header: HTMLElement) => {
  const box = header.getBoundingClientRect();
  const style = getComputedStyle(header);
  return {
    start: box.left + Number.parseFloat(style.paddingLeft),
    end: box.right - Number.parseFloat(style.paddingRight),
  };
};

const shareALine = (first: Element, second: Element): boolean => {
  const a = first.getBoundingClientRect();
  const b = second.getBoundingClientRect();
  return a.top < b.bottom && b.top < a.bottom;
};

const overflowsNothing = (header: HTMLElement): boolean =>
  header.scrollWidth <= header.clientWidth &&
  document.documentElement.scrollWidth <= document.documentElement.clientWidth;

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
 *  the foreground colour every other item only reaches on hover - Header applies it from `aria-current`.
 *  The play function pins the arrangement #125 left alone: two children, the nav flush with the end
 *  content edge, on one line that never wraps as a whole. */
export const Default: Story = {
  render: () => <Header standing={standing}>{nav}</Header>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('banner');
    const navigation = canvas.getByRole('navigation');
    await expect(header.children).toHaveLength(2);
    await expect(header.lastElementChild).toBe(navigation);
    await expect(getComputedStyle(header).flexWrap).toBe('nowrap');
    await expect(
      Math.abs(
        navigation.getBoundingClientRect().right - contentEdges(header).end,
      ),
    ).toBeLessThanOrEqual(0.5);
    await expect(
      shareALine(
        canvas.getByRole('link', { name: 'JuweL Development' }),
        navigation,
      ),
    ).toBe(true);
  },
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

// The consumer's context group: date and Balance, composed by the caller in a Cluster. The matter wears
// its own type roles; the slot around it adds none.
const readout = (
  <Cluster gap={'stack'}>
    <P>Monday, 3 October 2026</P>
    <Note color={'muted'}>09:00</Note>
    <P testId={'balance'}>{'Balance: $1,250,000'}</P>
  </Cluster>
);

const continueAction = (
  <Button variant={'primary'} testId={'continue'}>
    Continue
  </Button>
);

const slotOf = (element: HTMLElement): HTMLElement => {
  const slot = element.closest('header > div');
  if (!(slot instanceof HTMLElement)) {
    throw new Error('The matter is not inside a Header slot');
  }
  return slot;
};

/** A bar that only reports: the date and Balance in `status`, nothing else. No `<nav>` renders, the
 *  readout starts at the start content edge with no standing slot reserved before it, and the slot
 *  around it is a plain box - no landmark, no live region. */
export const StatusOnly: Story = {
  render: () => <Header status={readout} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('banner');
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(header.children).toHaveLength(1);
    const slot = slotOf(canvas.getByTestId('balance'));
    await expect(
      Math.abs(slot.getBoundingClientRect().left - contentEdges(header).start),
    ).toBeLessThanOrEqual(0.5);
    await expect(slot).not.toHaveAttribute('role');
    await expect(slot).not.toHaveAttribute('aria-live');
  },
};

/** A lone action: the control alone at the end content edge, with no empty status box before it and
 *  no nav around it - a button is not navigation. The first Tab lands on it and shows its own focus ring. */
export const ActionOnly: Story = {
  render: () => <Header action={continueAction} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('banner');
    const action = canvas.getByRole('button', { name: 'Continue' });
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(header.children).toHaveLength(1);
    await expect(
      Math.abs(action.getBoundingClientRect().right - contentEdges(header).end),
    ).toBeLessThanOrEqual(0.5);
    await userEvent.tab();
    await expect(action).toHaveFocus();
    await expect(getComputedStyle(action).outlineStyle).toBe('solid');
  },
};

/** The Label Manager's Top bar (#125): date and Balance at the start edge, Continue at the end edge,
 *  one line, no navigation landmark anywhere. Reading and keyboard order run readout, then control. */
export const StatusAndAction: Story = {
  render: () => <Header status={readout} action={continueAction} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('banner');
    const status = slotOf(canvas.getByTestId('balance'));
    const action = canvas.getByRole('button', { name: 'Continue' });
    const edges = contentEdges(header);
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(header.children).toHaveLength(2);
    await expect(header.firstElementChild).toBe(status);
    await expect(
      Math.abs(status.getBoundingClientRect().left - edges.start),
    ).toBeLessThanOrEqual(0.5);
    await expect(
      Math.abs(action.getBoundingClientRect().right - edges.end),
    ).toBeLessThanOrEqual(0.5);
    await expect(shareALine(status, action)).toBe(true);
    await userEvent.tab();
    await expect(action).toHaveFocus();
  },
};

const longReadout = (
  <Cluster gap={'stack'}>
    <P>Montag, 3. Oktober 2026</P>
    <Note color={'muted'}>09:00 Uhr</Note>
    <P>{'Kontostand: 1.250.000 $'}</P>
    <Note>{'Eine Antwort wird erwartet, bevor die Woche weitergeht'}</Note>
    <Note testId={'reference'}>
      {
        'Vorgang 3f9c1b7e2d8a4c6f0b5e9d1a7c3f2b8e4d6a0c9f1e7b3d5a2c8f4e6b0d9a1c7e3f9c1b7e2d8a4c6f0b5e9d1a7c3f2b8e4d6a'
      }
    </Note>
  </Cluster>
);

/** Long translated wording and one unbroken token in the readout, a long disabled label on the control.
 *  The Cluster wraps inside its slot while room remains; once the line is spent the control drops below
 *  the readout and keeps its end edge, and the readout takes the whole line - the unbroken token
 *  breaking inside it rather than widening the page. Nothing clips and the page gains no horizontal
 *  scroll, which the play function holds at the width the story is viewed at. */
export const LongLabels: Story = {
  render: () => (
    <Header
      status={longReadout}
      action={
        <Button variant={'primary'} disabled={true}>
          {'Weiter zur nächsten Woche'}
        </Button>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole('banner');
    const status = slotOf(canvas.getByTestId('reference'));
    const action = canvas.getByRole('button', {
      name: 'Weiter zur nächsten Woche',
    });
    await expect(overflowsNothing(header)).toBe(true);
    await expect(status.scrollWidth).toBeLessThanOrEqual(status.clientWidth);
    await expect(
      Math.abs(action.getBoundingClientRect().right - contentEdges(header).end),
    ).toBeLessThanOrEqual(0.5);
    await expect(action).toBeDisabled();
  },
};

/** The Top bar held at a narrow desktop width. Below the fit threshold the control drops below the
 *  readout and stays flush with the end content edge; the readout takes the line and its unbroken token
 *  wraps inside the slot. The play function then widens the frame and narrows it again with Continue
 *  focused: the same button is still there and still focused, because the break is CSS alone. The frame
 *  is story furniture; a product never fixes the width. */
export const NarrowDesktop: Story = {
  render: () => (
    <div data-testid={'frame'} style={{ width: '48rem', maxWidth: '100%' }}>
      <Header status={longReadout} action={continueAction} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId('frame');
    const header = canvas.getByRole('banner');
    const reference = canvas.getByTestId('reference');
    const status = slotOf(reference);
    const action = canvas.getByRole('button', { name: 'Continue' });
    const nextFrame = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

    await expect(overflowsNothing(header)).toBe(true);
    await expect(shareALine(status, action)).toBe(false);
    await expect(action.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      status.getBoundingClientRect().bottom,
    );
    await expect(
      Math.abs(action.getBoundingClientRect().right - contentEdges(header).end),
    ).toBeLessThanOrEqual(0.5);
    const range = document.createRange();
    range.selectNodeContents(reference);
    await expect(range.getClientRects().length).toBeGreaterThan(1);
    await expect(status.scrollWidth).toBeLessThanOrEqual(status.clientWidth);

    await userEvent.tab();
    await expect(action).toHaveFocus();
    frame.style.width = '100rem';
    await nextFrame();
    await expect(action.isConnected).toBe(true);
    await expect(action).toHaveFocus();
    frame.style.width = '48rem';
    await nextFrame();
    await expect(canvas.getByRole('button', { name: 'Continue' })).toBe(action);
    await expect(action).toHaveFocus();
    await expect(shareALine(status, action)).toBe(false);
  },
};
