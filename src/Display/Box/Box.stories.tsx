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
  parameters: {
    docs: {
      description: {
        component:
          "`Box` is a bounded content group: a semantic surface, a hairline border and an inner inset,\nwith square corners and no shadow. The consumer owns the content, any heading and the\ninternal arrangement - a `Stack` inside the `Box` arranges and sets the gaps; the `Box` only\nencloses.\n\n```tsx\nimport { Box, DefinitionList, H3, Stack } from '@juwel-development/design-system';\n\n<Box name={'Selected artist'}>\n  <Stack>\n    <H3>Selected artist</H3>\n    <DefinitionList.Root>\n      <DefinitionList.Item>\n        <DefinitionList.Term>Genre</DefinitionList.Term>\n        <DefinitionList.Description>Electronic</DefinitionList.Description>\n      </DefinitionList.Item>\n    </DefinitionList.Root>\n  </Stack>\n</Box>;\n```\n\nThe props are `children?: ReactNode`, `name?: string` and `testId?: string`, nothing else:\nno size, width, height or padding prop, no heading slot, no `className`.\n\n**Accessible naming.** With a non-empty `name`, the box is an accessible group carrying that\nname. Without one - omitted or an empty string - the box is an ordinary enclosure: no role, no\nlabel, no landmark. A name renders no visible heading: supply the heading yourself and keep the\ntwo in step. In neither case does the box add a focus stop or listen for a key, so controls\ninside keep their ordinary keyboard behaviour.\n\n**Width, height and wrapping.** The box fills the width its holder allocates, border and\npadding included, grows with its content and shrinks inside a narrow holder. Long prose and\nunbroken names wrap inside it: it sets `overflow-wrap: anywhere`, which descendants inherit\nunless they set their own wrapping. It sets no height and hides no overflow. Content with its\nown sizing or overflow contract - a table, a figure, a code block - keeps that responsibility;\nthe box wraps text and never scrolls or clips on its behalf. An empty box is an empty\nenclosure with no empty-state wording: omit it rather than expecting one.\n\n**Theming.** Surface, text and border read the existing `surface`, `foreground` and `border`\ncolour roles. `--space-box-inset` names the inset on all four sides, defaulting to `1em` so it\nfollows inherited type. It is a separate role from a Stack's gap, a region's air or a\nSection's band: re-pointing it moves the actual padding of every `Box` and nothing else,\nwith no prop and no component CSS override. It is declared in all three token stylesheets\nand accepts a nonnegative CSS length. The box borrows neither the control radius nor the\nfloating elevation.",
      },
    },
    layout: 'padded',
  },
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
