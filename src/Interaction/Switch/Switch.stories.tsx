import { Cluster } from 'Arrangement/Cluster/Cluster';
import { Stack } from 'Arrangement/Stack/Stack';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Interaction/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `One immediate on/off setting, such as “Unread only”. Keep its visible label stable: assistive technology announces the name and checked state separately. Use Choices for a selection among described alternatives; use a checkbox in a Form for a selection applied on submission. Switch neither submits nor contributes a form value.

Supply checked$ (Observable<boolean>) and onChange$ (Subject<boolean>). It displays off until the current input first emits, including after replacement. Activation requests the opposite of the displayed value; ignoring a request leaves that value unchanged. The consumer owns what the setting does and every stream's lifetime, error and completion. Switch unsubscribes when its input changes or it unmounts and never completes streams.

Tab focuses the native button; Space and Enter activate it. Disabled removes it from keyboard navigation and prevents requests while retaining its state. The shared focus ring identifies focus independently of state. The thumb sits at the start for off and end for on (including RTL), without animation or reliance on colour. Forced colours use system colours for the track, thumb and disabled treatment.

The geometry tokens --switch-thumb-size (1rem) and --switch-track-inset (0.125rem) must both be positive lengths. Track width is twice the thumb size, plus inset and border. Existing radius-control, space-stack, body typography, secondary family, foreground, surface, controlBorder, disabled, muted and focus-ring roles supply the remaining treatment. Theme these roles rather than styling component internals. Short labels fit inline in Cluster; long translations wrap within the available width.`,
      },
    },
  },
  argTypes: {
    checked$: { control: false },
    onChange$: { control: false },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

const FilterExample: FunctionComponent = () => {
  const [checked$] = useState(() => new BehaviorSubject(false));
  const [onChange$] = useState(() => new Subject<boolean>());
  const [reset$] = useState(() => new Subject<void>());
  const [isUnreadOnly, setUnreadOnly] = useState(false);
  useEffect(() => {
    const changes = onChange$.subscribe((value) => checked$.next(value));
    const display = checked$.subscribe(setUnreadOnly);
    const reset = reset$.subscribe(() => checked$.next(false));
    return () => {
      changes.unsubscribe();
      display.unsubscribe();
      reset.unsubscribe();
    };
  }, [checked$, onChange$, reset$]);
  return (
    <Stack>
      <Cluster justify="between">
        <P>{isUnreadOnly ? '3 unread messages' : '12 messages, 3 unread'}</P>
        <Switch label="Unread only" checked$={checked$} onChange$={onChange$} />
      </Cluster>
      <Button variant="plain" onClick$={reset$}>
        Show all messages
      </Button>
    </Stack>
  );
};

export const InlineFilter: Story = { render: () => <FilterExample /> };
export const Off: Story = {
  args: {
    label: 'Unread only',
    checked$: new BehaviorSubject(false),
    onChange$: new Subject<boolean>(),
  },
};
export const On: Story = {
  args: {
    label: 'Unread only',
    checked$: new BehaviorSubject(true),
    onChange$: new Subject<boolean>(),
  },
};
export const DisabledOff: Story = { args: { ...Off.args, disabled: true } };
export const DisabledOn: Story = { args: { ...On.args, disabled: true } };
export const UnansweredRequest: Story = {
  args: { ...Off.args },
  parameters: {
    docs: {
      description: {
        story:
          'Requests have no consumer response here: repeated activation leaves the setting off.',
      },
    },
  },
};
export const LongLabel: Story = {
  args: {
    ...Off.args,
    label:
      'Nur ungelesene Nachrichten aus allen gespeicherten Unterhaltungen anzeigen',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '18rem' }}>
        <Story />
      </div>
    ),
  ],
};
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl">
      <FilterExample />
    </div>
  ),
};
