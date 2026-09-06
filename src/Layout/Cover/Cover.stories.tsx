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

/** A menu screen the consumer composes - title, tagline and an action column - centred on both
 *  axes, with a quiet version line pinned to the bottom edge. The frame reaches the full viewport
 *  because nothing follows it: unlike a `Hero` inside a `Section`, a cover stands on its own and
 *  owns its own inset. The actions carry `measure="action"`, and reaching that bound does not
 *  depend on the title beside them: the column asks for the bound itself (#99). */
export const MenuScreen: Story = {
  render: () => (
    <Cover foot={<Note color={'muted'}>v3.1.0</Note>}>
      <Stack gap={'region'}>
        <H1>Labelmaker</H1>
        <P color={'muted'}>Every jar named, every batch found.</P>
        <Stack gap={'stack'} measure={'action'}>
          <Button variant={'primary'}>New label</Button>
          <Button variant={'secondary'}>Open archive</Button>
          <Button variant={'secondary'}>Settings</Button>
        </Stack>
      </Stack>
    </Cover>
  ),
};

/** The pairing the action column was filed for (#97, #99): a direct action stack in the slot,
 *  short labels, no widening sibling and no foot. The column reaches `--measure-action` because it
 *  requests that bound itself - the shrink-to-fit slot opens to hold it - and a viewport narrower
 *  than the bound caps the column at the available width instead of overflowing. */
export const ActionColumn: Story = {
  render: () => (
    <Cover>
      <Stack measure={'action'}>
        <Button variant={'primary'}>Start game</Button>
        <Button variant={'secondary'}>Back</Button>
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
 *  floor, never a ceiling, so the foot rides the frame's bottom edge below the overflowing slot -
 *  and the overflowing column is an action column, so the growth and the bound hold together. */
export const OverflowingSlot: Story = {
  render: () => (
    <Cover foot={<Note color={'muted'}>v3.1.0</Note>}>
      <Stack gap={'region'}>
        <H1>Every action at once</H1>
        <Stack gap={'stack'} measure={'action'}>
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
