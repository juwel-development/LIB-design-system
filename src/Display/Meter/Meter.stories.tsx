import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '../../Arrangement/Stack/Stack';
import { Note } from '../Typography/Note/Note';
import { Meter } from './Meter';

const meta: Meta<typeof Meter> = {
  title: 'Display/Meter',
  component: Meter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The default neutral treatment: the filled share in `meterFill`, the capacity in `meterTrack`
 *  behind a persistent one-pixel `rule` line. No wording, no readout - the label is accessible-only. */
export const Neutral: Story = {
  args: {
    value: 62,
    max: 100,
    label: 'Patience',
  },
};

/** The depletion treatment walks the fill linearly through OKLab from `meterFill` at the maximum
 *  to `error` at the minimum - no threshold, so the colour moves as continuously as the level. */
export const DepletingAcrossTheScale: Story = {
  render: () => (
    <Stack gap={'stack'}>
      {[100, 80, 60, 40, 20, 5].map((value) => (
        <Meter
          key={value}
          value={value}
          max={100}
          treatment={'depleting'}
          label={`Patience at ${value} of 100`}
        />
      ))}
    </Stack>
  ),
};

/** Both endpoints render: a full meter and an empty one are levels, not error states. */
export const Endpoints: Story = {
  render: () => (
    <Stack gap={'stack'}>
      <Meter value={100} max={100} label={'Full'} />
      <Meter value={0} max={100} label={'Empty'} />
      <Meter
        value={100}
        max={100}
        treatment={'depleting'}
        label={'Full, depleting'}
      />
      <Meter
        value={0}
        max={100}
        treatment={'depleting'}
        label={'Empty, depleting'}
      />
    </Stack>
  ),
};

/** The share normalizes against the supplied bounds - here -20 dBm to 0 dBm - not against zero. */
export const NonZeroBounds: Story = {
  args: {
    value: -5,
    min: -20,
    max: 0,
    label: 'Signal strength',
  },
};

/** `valueText` replaces the bare numeric announcement with the consumer's wording - inspect the
 *  root's `aria-valuetext`. Nothing visible changes: the Meter still renders no text. */
export const WithValueText: Story = {
  args: {
    value: 20,
    max: 100,
    treatment: 'depleting',
    label: 'Patience',
    valueText: 'strained',
  },
};

/** Under RTL direction the fill begins at inline-start - the right edge - by block layout alone. */
export const RightToLeft: Story = {
  render: () => (
    <div dir={'rtl'}>
      <Meter value={62} max={100} label={'Patience'} />
    </div>
  ),
};

/** Depletion adds no wording of its own, so the consequence of nearing the minimum must be stated
 *  by surrounding content the consumer owns - colour alone is not the message. */
export const DepletingWithConsumerContext: Story = {
  render: () => (
    <Stack gap={'stack'}>
      <Meter
        value={15}
        max={100}
        treatment={'depleting'}
        label={'Patience'}
        valueText={'strained'}
      />
      <Note>
        Patience is nearly exhausted - the negotiation ends when it runs out.
      </Note>
    </Stack>
  ),
};
