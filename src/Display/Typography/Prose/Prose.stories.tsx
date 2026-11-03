import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Link } from 'index';
import type { CSSProperties } from 'react';
import { Subject } from 'rxjs';
import { Prose } from './Prose';

const meta: Meta<typeof Prose.Root> = {
  title: 'Display/Typography/Prose',
  component: Prose.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A lede, two body paragraphs - one muted - and a stepped-down tail, all capped at the measure. */
export const Default: Story = {
  render: () => (
    <Prose.Root>
      <Prose.Lede>
        A block of running text opens with a lede: larger, more tightly led, and
        set apart from the body that follows it.
      </Prose.Lede>
      <Prose.Body>
        The body carries the argument. It sits at the same body role as every
        other paragraph in the system, bounded here by the reading measure so
        the line length stays inside the band that reads comfortably. Nothing
        about the paragraph changes; the column around it is what holds the
        measure still.
      </Prose.Body>
      <Prose.Body color={'muted'}>
        A muted body paragraph steps back without leaving the reading column -
        an aside, a caveat, a source - while keeping the same size and leading
        as the copy around it.
      </Prose.Body>
      <Prose.Tail>
        A closing note, stepped down to the small role and muted: the last word
        of the block, quieter than the body it follows.
      </Prose.Tail>
    </Prose.Root>
  ),
};

/** `Body` can reinforce status that its wording already communicates. Selecting a tone adds no live
 *  announcement; `Lede` stays foreground and `Tail` stays muted because their colours are fixed. */
export const StatusTones: Story = {
  render: () => (
    <Prose.Root>
      <Prose.Lede>Status tones inside a reading column</Prose.Lede>
      <Prose.Body color={'success'}>
        Success: the changes were saved.
      </Prose.Body>
      <Prose.Body color={'warning'}>Warning: patience is low.</Prose.Body>
      <Prose.Body color={'error'}>
        Error: the changes could not be saved.
      </Prose.Body>
      <Prose.Body color={'info'}>
        Information: a new version is available.
      </Prose.Body>
      <Prose.Tail>The wording carries the status without colour.</Prose.Tail>
    </Prose.Root>
  ),
};

/** Inside a wider grid cell the column still caps at the measure - the cell does not widen it. */
export const InAWiderGridCell: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 60rem)',
        padding: '2rem',
      }}
    >
      <Prose.Root>
        <Prose.Lede>
          The grid cell is far wider than the reading measure, yet the column
          holds its width.
        </Prose.Lede>
        <Prose.Body>
          Because the measure lives on the block and not on the page, a wider
          container cannot stretch the line length past the reading band. This
          is the behaviour a story exists to show: the same block, dropped into
          a column with room to spill, stays bounded.
        </Prose.Body>
      </Prose.Root>
    </div>
  ),
};

const reply$ = new Subject<void>();

/** Select typography and measure together on Root. Use Body for every correspondence paragraph,
 * including salutation and signature. The consumer owns all wording; use Link for an address and
 * Button variant="link" for an action. Lede and Tail retain their ordinary roles even in a letter. */
export const Letter: Story = {
  render: () => (
    <div
      style={
        {
          '--font-primary': 'Georgia, serif',
          '--font-body': 'Arial, sans-serif',
        } as CSSProperties
      }
    >
      <Prose.Root variant="letter" testId="letter">
        <Prose.Body>Dear reader,</Prose.Body>
        <Prose.Body>
          Thank you for the care you bring to our community. This letter shares
          what we have learned and invites you to help decide what comes next.
          Each contribution gives us another way to understand the work we
          share.
        </Prose.Body>
        <Prose.Body>
          You can{' '}
          <Link href="#details">read the details of our next gathering</Link> or{' '}
          <Button variant="link" onClick$={reply$}>
            share your thoughts about the plans for our next gathering
          </Button>{' '}
          whenever you have a quiet moment.
        </Prose.Body>
        <Prose.Body color="muted">With gratitude, Alex</Prose.Body>
      </Prose.Root>
      <Prose.Root testId="ordinary">
        <Prose.Lede>Ordinary prose still opens with a lede.</Prose.Lede>
        <Prose.Body>
          Ordinary body copy uses the distinct body face, its own size and its
          existing reading measure.
        </Prose.Body>
        <Prose.Tail>A closing note keeps its small role.</Prose.Tail>
      </Prose.Root>
    </div>
  ),
};

/** The letter family falls back at the element, so a scoped primary override reaches it. An explicit
 * letter family wins independently. Size, leading and measure are separately themeable roles;
 * --measure-letter resolves in the letter's own type. No root-level --font-letter alias is declared. */
export const ScopedLetters: Story = {
  render: () => (
    <div
      style={
        {
          '--font-primary': 'Georgia, serif',
          '--font-body': 'Arial, sans-serif',
        } as CSSProperties
      }
    >
      <div style={{ '--font-primary': 'monospace' } as CSSProperties}>
        <Prose.Root variant="letter" testId="scoped-primary">
          <Prose.Body>A scoped primary face reaches this letter.</Prose.Body>
          <Prose.Lede>
            The lede still uses its body face and tighter leading.
          </Prose.Lede>
          <Prose.Tail>
            The tail still uses its body face and small size.
          </Prose.Tail>
          <Prose.Root testId="nested-ordinary">
            <Prose.Body>
              A nested ordinary root restores body typography.
            </Prose.Body>
          </Prose.Root>
        </Prose.Root>
      </div>
      <div
        style={
          {
            '--font-primary': 'monospace',
            '--font-letter': 'Georgia, serif',
            '--text-letter': '1.5rem',
            '--leading-letter': '2',
            '--measure-letter': '40ch',
          } as CSSProperties
        }
      >
        <Prose.Root variant="letter" testId="scoped-letter">
          <Prose.Body>
            This letter uses its explicit family, size, leading and measure
            overrides.
          </Prose.Body>
          <Prose.Body color="info">
            Information: every letter role remains independently themeable.
          </Prose.Body>
        </Prose.Root>
      </div>
    </div>
  ),
};

/** The same complete letter fits a narrow host; inline controls and links wrap within its text. */
export const NarrowLetter: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '18rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  render: Letter.render,
};
