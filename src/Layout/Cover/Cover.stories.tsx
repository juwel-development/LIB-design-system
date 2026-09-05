import { Stack } from 'Arrangement/Stack/Stack';
import { H1 } from 'Display/Typography/H1/H1';
import { Note } from 'Display/Typography/Note/Note';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cover } from './Cover';

const meta: Meta<typeof Cover> = {
  title: 'Layout/Cover',
  component: Cover,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A menu screen the consumer composes - title, tagline and a stack of actions - centred on both
 *  axes, with a quiet version line pinned to the bottom edge. The frame reaches the full viewport
 *  because nothing follows it: unlike a `Hero` inside a `Section`, a cover stands on its own and
 *  owns its own inset. */
export const MenuScreen: Story = {
  render: () => (
    <Cover foot={<Note color={'muted'}>v3.1.0</Note>}>
      <Stack gap={'region'}>
        <H1>Labelmaker</H1>
        <P color={'muted'}>Every jar named, every batch found.</P>
        <Stack gap={'stack'}>
          <Button variant={'primary'}>New label</Button>
          <Button variant={'secondary'}>Open archive</Button>
          <Button variant={'secondary'}>Settings</Button>
        </Stack>
      </Stack>
    </Cover>
  ),
};

/** Without a foot nothing holds its place: the slot is the frame's only child, still centred in the
 *  middle of the whole leftover space - a splash or a sign-in that says one thing. */
export const WithoutFoot: Story = {
  render: () => (
    <Cover>
      <Stack gap={'region'}>
        <H1>Welcome back</H1>
        <Button variant={'primary'}>Sign in</Button>
      </Stack>
    </Cover>
  ),
};

/** Content longer than the viewport grows the frame rather than escaping it: the cover height is a
 *  floor, never a ceiling, so the foot rides the frame's bottom edge below the overflowing slot. */
export const OverflowingSlot: Story = {
  render: () => (
    <Cover foot={<Note color={'muted'}>v3.1.0</Note>}>
      <Stack gap={'region'}>
        <H1>Every action at once</H1>
        <Stack gap={'stack'}>
          {Array.from({ length: 24 }, (_, index) => `Action ${index + 1}`).map(
            (label) => (
              <Button key={label} variant={'secondary'}>
                {label}
              </Button>
            ),
          )}
        </Stack>
      </Stack>
    </Cover>
  ),
};
