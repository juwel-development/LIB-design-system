import { Stack } from 'Arrangement/Stack/Stack';
import { DefinitionList } from 'Display/DefinitionList/DefinitionList';
import { H3 } from 'Display/Typography/H3/H3';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Box } from './Box';

const meta: Meta<typeof Box> = {
  title: 'Display/Box',
  component: Box,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-foreground)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** An empty Box is still an enclosure: surface, border and padding, and no invented wording. */
export const Empty: Story = {
  args: {},
};

/** The shortest content the box will hold; it grows no taller than its padding and one line. */
export const Short: Story = {
  args: {
    children: <P>One fact.</P>,
  },
};

/** Long prose wraps inside the box and the box grows to hold it; nothing is clipped or scrolled. */
export const Long: Story = {
  args: {
    children: (
      <P>
        A longer passage of running text, held inside the box, wraps onto as
        many lines as it needs and the box grows with it. The box sets no height
        and no overflow of its own, so the text is never truncated and the
        reader never meets a scrollbar inside the group. Its width is the width
        the holder allocates, border and padding included, and it stays so
        however much is written here.
      </P>
    ),
  },
};

/** A narrow holder inside a wide viewport - the holder is story scaffolding. The box takes the
 *  holder's width, border and padding included, and an unbroken name wraps rather than widening or
 *  overflowing it. Viewport width cannot satisfy this check: the holder is 18rem wide regardless. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '18rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    name: 'Selected artist',
    children: (
      <Stack>
        <P>
          A longer passage remains readable as it wraps onto several lines in a
          narrow holder.
        </P>
        <P>Supercalifragilisticexpialidocious-and-then-some-unbroken-name</P>
      </Stack>
    ),
  },
};

/** A named box is an accessible group carrying that name; the name renders no heading, so the
 *  consumer supplies the visible one and keeps the two in step. */
export const Named: Story = {
  args: {
    name: 'Selected artist',
    children: (
      <Stack>
        <H3>Selected artist</H3>
        <P>
          The group above is named "Selected artist" to assistive technology.
        </P>
      </Stack>
    ),
  },
};

/** Without a name the box is an ordinary enclosure: no role, no label, no landmark, no focus stop. */
export const Unnamed: Story = {
  args: {
    children: <P>An ordinary enclosure with nothing announced about it.</P>,
  },
};

/** The consumer's own composition: a Stack arranging a heading and a list of facts. Box encloses,
 *  Stack arranges and sets the gaps, the heading and the facts are the consumer's. */
export const WithStackHeadingAndFacts: Story = {
  args: {
    name: 'Selected artist',
    children: (
      <Stack>
        <H3>Selected artist</H3>
        <DefinitionList.Root>
          <DefinitionList.Item>
            <DefinitionList.Term>Genre</DefinitionList.Term>
            <DefinitionList.Description>Electronic</DefinitionList.Description>
          </DefinitionList.Item>
          <DefinitionList.Item>
            <DefinitionList.Term>Reach</DefinitionList.Term>
            <DefinitionList.Description>Regional</DefinitionList.Description>
          </DefinitionList.Item>
          <DefinitionList.Item>
            <DefinitionList.Term>Advance asked</DefinitionList.Term>
            <DefinitionList.Description>Moderate</DefinitionList.Description>
          </DefinitionList.Item>
        </DefinitionList.Root>
        <Note color={'muted'}>
          Box sets no type role and no arrangement inside the group.
        </Note>
      </Stack>
    ),
  },
};

/** The theme chooses the inset. The wrapper here stands in for a consumer theme re-pointing
 *  `--space-box-inset`; the box reads the new value and its actual padding moves, with no prop and
 *  no component CSS override. */
export const InsetRePointedByTheme: Story = {
  decorators: [
    (Story) => (
      <div style={{ '--space-box-inset': '3em' } as CSSProperties}>
        <Story />
      </div>
    ),
  ],
  args: {
    children: <P>Three ems of inset on every side, chosen by the theme.</P>,
  },
};

export const EmptyDark: Story = { ...Empty, globals: { theme: 'dark' } };
export const ShortDark: Story = { ...Short, globals: { theme: 'dark' } };
export const LongDark: Story = { ...Long, globals: { theme: 'dark' } };
export const NarrowDark: Story = { ...Narrow, globals: { theme: 'dark' } };
export const NamedDark: Story = { ...Named, globals: { theme: 'dark' } };
export const UnnamedDark: Story = { ...Unnamed, globals: { theme: 'dark' } };
export const WithStackHeadingAndFactsDark: Story = {
  ...WithStackHeadingAndFacts,
  globals: { theme: 'dark' },
};
export const InsetRePointedByThemeDark: Story = {
  ...InsetRePointedByTheme,
  globals: { theme: 'dark' },
};
