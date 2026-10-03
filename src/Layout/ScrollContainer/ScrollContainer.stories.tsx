import { Button } from 'Interaction/Button/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollContainer } from './ScrollContainer';

const meta: Meta<typeof ScrollContainer> = {
  title: 'Layout/ScrollContainer',
  component: ScrollContainer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    axis: {
      control: { type: 'radio' },
      options: ['both', 'horizontal', 'vertical'],
      description:
        'Which axes may scroll; overflow on a disabled axis is clipped',
    },
    ariaLabel: {
      control: { type: 'text' },
      description: "The group's accessible name while it can be scrolled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const paragraphNames = Array.from(
  { length: 12 },
  (_, index) => `Paragraph ${index + 1}`,
);

const paragraphs = paragraphNames.map((name) => (
  <p key={name} className={'font-primary text-body text-foreground'}>
    {name}. Running text wraps normally inside the container, whatever axis is
    enabled: the container never asks its content to stop wrapping, it only
    makes what still overflows reachable.
  </p>
));

const actionNames = Array.from(
  { length: 10 },
  (_, index) => `Action ${index + 1}`,
);

const wideLine = (
  <pre className={'font-primary text-body text-foreground'}>
    {'A line that cannot wrap: '}
    {Array.from({ length: 24 }, (_, index) => `column-${index + 1}`).join(
      '   ',
    )}
  </pre>
);

/**
 * The parent allocates the height; the container scrolls what overflows it vertically and clips
 * nothing horizontally because nothing overflows there. Tab reaches the container; the arrow keys
 * and Page keys scroll it; the focus ring marks it.
 */
export const VerticalInSizedParent: Story = {
  args: { axis: 'vertical', ariaLabel: 'Specification' },
  render: (args) => (
    <div style={{ height: '14rem' }}>
      <ScrollContainer {...args}>
        <div className={'flex flex-col gap-3'}>{paragraphs}</div>
      </ScrollContainer>
    </div>
  ),
};

/** Wide, unwrappable content under a narrow parent: horizontal only; a tall column would be clipped. */
export const HorizontalWideContent: Story = {
  args: { axis: 'horizontal', ariaLabel: 'Column list' },
  render: (args) => (
    <div style={{ maxWidth: '28rem' }}>
      <ScrollContainer {...args}>{wideLine}</ScrollContainer>
    </div>
  ),
};

/**
 * One container inside another, each owning one axis: the outer scrolls vertically within its
 * parent's height, the inner scrolls a line that cannot wrap horizontally within the outer's width.
 * Neither duplicates the other's axis, so Tab meets two stops with two names and the arrow keys
 * scroll whichever holds focus. The outer is `vertical`, so its content box takes the outer's width
 * and the inner's overflow stays the inner's - the same shape as a Table inside it.
 */
export const NestedHorizontalInsideVertical: Story = {
  args: { axis: 'vertical', ariaLabel: 'Specification' },
  render: (args) => (
    <div style={{ height: '14rem', maxWidth: '28rem' }}>
      <ScrollContainer {...args}>
        <div className={'flex flex-col gap-3'}>
          {paragraphs.slice(0, 2)}
          <ScrollContainer axis={'horizontal'} ariaLabel={'Column list'}>
            {wideLine}
          </ScrollContainer>
          {paragraphs.slice(2)}
        </div>
      </ScrollContainer>
    </div>
  ),
};

/** Both axes, the default: a bounded box with content overflowing in both directions. */
export const BothAxes: Story = {
  args: { ariaLabel: 'Specification' },
  render: (args) => (
    <div style={{ height: '12rem', maxWidth: '28rem' }}>
      <ScrollContainer {...args}>
        <div className={'flex flex-col gap-3'}>
          {wideLine}
          {paragraphs}
        </div>
      </ScrollContainer>
    </div>
  ),
};

/**
 * Nothing overflows: the container is a plain wrapper with no tab stop and no group, so a page
 * gains nothing to tab through when the content happens to fit.
 */
export const NoOverflow: Story = {
  args: { ariaLabel: 'Specification' },
  render: (args) => (
    <div style={{ height: '14rem' }}>
      <ScrollContainer {...args}>
        <p className={'font-primary text-body text-foreground'}>
          Three lines of text fit comfortably, so this container adds nothing.
        </p>
      </ScrollContainer>
    </div>
  ),
};

/**
 * Overflow on the disabled axis is clipped, not scrolled - so a consumer must give the content a
 * layout that fits that axis. Clipping is never a way to hide essential content or controls.
 */
export const DisabledAxisClips: Story = {
  args: { axis: 'vertical', ariaLabel: 'Specification' },
  render: (args) => (
    <div style={{ height: '10rem', maxWidth: '28rem' }}>
      <ScrollContainer {...args}>
        <div className={'flex flex-col gap-3'}>
          {wideLine}
          {paragraphs.slice(0, 4)}
        </div>
      </ScrollContainer>
    </div>
  ),
};

/**
 * Interactive content: controls inside keep their own keys and the browser's tab order; the
 * container never traps focus. Tab from the container into the first button, on through the rest,
 * and out the far side.
 */
export const InteractiveContent: Story = {
  args: { axis: 'vertical', ariaLabel: 'Actions' },
  render: (args) => (
    <div style={{ height: '10rem' }}>
      <ScrollContainer {...args}>
        <div className={'flex flex-col items-start gap-3'}>
          {actionNames.map((name) => (
            <Button key={name} variant={'secondary'}>
              {name}
            </Button>
          ))}
        </div>
      </ScrollContainer>
    </div>
  ),
};

/**
 * The required parent layout in a flex column: the heading keeps its height and the wrapper around
 * the container takes the rest with `flex: 1 1 0; min-height: 0` - without the `min-height`, a flex
 * item refuses to shrink below its content and nothing would scroll.
 */
export const FlexColumnParent: Story = {
  args: { axis: 'vertical', ariaLabel: 'Specification' },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '16rem' }}>
      <p className={'pb-3 font-secondary text-label text-muted tracking-label'}>
        Specification
      </p>
      <div style={{ flex: '1 1 0', minHeight: 0 }}>
        <ScrollContainer {...args}>
          <div className={'flex flex-col gap-3'}>{paragraphs}</div>
        </ScrollContainer>
      </div>
    </div>
  ),
};

/** The same in a grid: an `auto 1fr` row pair, with `min-height: 0` on the `1fr` cell. */
export const GridParent: Story = {
  args: { axis: 'vertical', ariaLabel: 'Specification' },
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        height: '16rem',
      }}
    >
      <p className={'pb-3 font-secondary text-label text-muted tracking-label'}>
        Specification
      </p>
      <div style={{ minHeight: 0 }}>
        <ScrollContainer {...args}>
          <div className={'flex flex-col gap-3'}>{paragraphs}</div>
        </ScrollContainer>
      </div>
    </div>
  ),
};

/**
 * Under a parent with no finite bound the container invents none: it grows with its content like
 * any block, and never scrolls. That is the parent's choice, not a defect.
 */
export const UnboundedParent: Story = {
  args: { axis: 'vertical', ariaLabel: 'Specification' },
  render: (args) => (
    <ScrollContainer {...args}>
      <div className={'flex flex-col gap-3'}>{paragraphs.slice(0, 4)}</div>
    </ScrollContainer>
  ),
};
