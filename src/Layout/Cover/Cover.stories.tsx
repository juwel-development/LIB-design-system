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
  // Fullscreen, because the component's whole subject is the viewport: a padded canvas would add
  // inset the frame already owns and hide where the cover height falls.
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The centered slot alone: one column in the middle of the whole viewport, on both axes. */
export const Default: Story = {
  render: () => (
    <Cover>
      <Stack gap={'region'}>
        <H1>Center stage</H1>
        <P color={'muted'}>One axis, the whole screen.</P>
      </Stack>
    </Cover>
  ),
};

/** A menu screen: the slot holds an action column, the foot a quiet version line pinned to the
 *  bottom edge. The buttons stretch to the column with no prop of their own. */
export const MenuWithFoot: Story = {
  render: () => (
    <Cover foot={<Note color={'muted'}>v1.0.0</Note>}>
      <Stack gap={'region'}>
        <H1>Center stage</H1>
        <Stack measure={'action'}>
          <Button variant={'primary'}>New game</Button>
          <Button variant={'secondary'} disabled={true}>
            Load game
          </Button>
          <Button variant={'secondary'} disabled={true}>
            Settings
          </Button>
        </Stack>
      </Stack>
    </Cover>
  ),
};
