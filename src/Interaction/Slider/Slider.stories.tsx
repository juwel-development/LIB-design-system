import { P } from 'Display/Typography/P/P';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Interaction/Slider',
  component: Slider,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    min: {
      control: { type: 'number' },
      description: "The operating range's lower bound",
    },
    max: {
      control: { type: 'number' },
      description: "The operating range's upper bound",
    },
    step: {
      control: { type: 'number' },
      description: 'The increment a movement produces; 1 when left out',
    },
    value: {
      control: false,
      description:
        'The current value; the consumer holds it and passes it back in',
    },
    onInput$: {
      control: false,
      description:
        'Subject that emits the new value on every input; required, since the control is controlled and has no form-submission fallback',
    },
    label: {
      control: { type: 'text' },
      description: "The control's accessible name",
    },
    valueText: {
      control: { type: 'text' },
      description: "How the value is announced, in the consumer's wording",
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'The explicit non-operable state',
    },
    testId: {
      control: { type: 'text' },
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// The controlled wiring every consumer repeats: hold the value, subscribe it to the Subject, and
// render any figures beside the control yourself - the Slider displays nothing.
const ControlledExample: FunctionComponent = () => {
  const [wage, setWage] = useState(60);
  const [onInput$] = useState(() => new Subject<number>());
  useEffect(() => {
    const subscription = onInput$.subscribe(setWage);
    return () => subscription.unsubscribe();
  }, [onInput$]);
  return (
    <>
      <P>${wage} a week</P>
      <Slider
        min={20}
        max={300}
        step={5}
        value={wage}
        onInput$={onInput$}
        label={'Weekly Wage in $'}
        valueText={`$${wage} a week`}
      />
    </>
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
};

// Whole-step movement with no step named: the increment defaults to 1.
const DefaultStepExample: FunctionComponent = () => {
  const [level, setLevel] = useState(3);
  const [onInput$] = useState(() => new Subject<number>());
  useEffect(() => {
    const subscription = onInput$.subscribe(setLevel);
    return () => subscription.unsubscribe();
  }, [onInput$]);
  return (
    <Slider
      min={0}
      max={10}
      value={level}
      onInput$={onInput$}
      label={'Level'}
    />
  );
};

export const DefaultStep: Story = {
  render: () => <DefaultStepExample />,
};

// The explicit non-operable state: native disabled conduct, no emissions, and track and thumb
// painted in the disabled role. No wiring is needed - a disabled control emits nothing.
export const Disabled: Story = {
  args: {
    min: 20,
    max: 300,
    step: 5,
    value: 60,
    onInput$: new Subject<number>(),
    label: 'Weekly Wage in $',
    disabled: true,
  },
};
