import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { expect, fireEvent, within } from 'storybook/test';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Interaction/Slider',
  component: Slider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Slider is controlled: hold the value, subscribe it to `onInput$` and pass it back in. ' +
          'To show the current amount, pass `visibleValue` in your own wording ("$3,542", "34 %") ' +
          'with each new `value`; Slider formats nothing. The wording sits on the label row when ' +
          'both fit and wraps below the label when they do not, without truncating or widening its ' +
          'holder. The label stays the accessible name; the wording is announced once, through ' +
          '`aria-valuetext` - from `valueText` when you give one, otherwise from `visibleValue`.',
      },
    },
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
        'The consumer-owned value; off-range values render at the nearest bound without emitting until the thumb moves',
    },
    onInput$: {
      control: false,
      description:
        'Subject that emits the new value on every input; required, since the control is controlled and has no form-submission fallback',
    },
    label: {
      control: { type: 'text' },
      description:
        'Always rendered as a visible label associated with the control; doubles as its accessible name',
    },
    visibleValue: {
      control: { type: 'text' },
      description:
        "The current value shown beside the label, in the consumer's wording; never part of the accessible name",
    },
    valueText: {
      control: { type: 'text' },
      description:
        "How the value is announced, in the consumer's wording; falls back to visibleValue",
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
// pass back both the number and its wording.
const ControlledExample: FunctionComponent = () => {
  const [wage, setWage] = useState(60);
  const [onInput$] = useState(() => new Subject<number>());
  useEffect(() => {
    const subscription = onInput$.subscribe(setWage);
    return () => subscription.unsubscribe();
  }, [onInput$]);
  return (
    <Slider
      min={20}
      max={300}
      step={5}
      value={wage}
      onInput$={onInput$}
      label={'Weekly Wage in $'}
      visibleValue={`$${wage}`}
      valueText={`$${wage} a week`}
    />
  );
};

/** The shown "$60" and the announced "$60 a week" follow every passed-back value on the same
 *  control, while the accessible name stays "Weekly Wage in $". */
export const Controlled: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole('slider');
    await expect(control).toHaveAccessibleName('Weekly Wage in $');
    await expect(control).toHaveAttribute('aria-valuetext', '$60 a week');
    await expect(canvas.getByText('$60')).toBeVisible();
    fireEvent.input(control, { target: { value: '65' } });
    await expect(canvas.getByRole('slider')).toBe(control);
    await expect(control).toHaveValue('65');
    await expect(control).toHaveAccessibleName('Weekly Wage in $');
    await expect(control).toHaveAttribute('aria-valuetext', '$65 a week');
    await expect(canvas.getByText('$65')).toBeVisible();
  },
};

type ValueWording = {
  lang: 'en' | 'de';
  label: string;
  visibleValue: string;
};

const REFERENCE_WORDINGS: readonly ValueWording[] = [
  { lang: 'en', label: 'Weekly wage', visibleValue: '$3,542' },
  { lang: 'en', label: 'Discount', visibleValue: '34%' },
  { lang: 'de', label: 'Wochenlohn', visibleValue: '3.542 $' },
  { lang: 'de', label: 'Rabatt', visibleValue: '34 %' },
];

const REFERENCE_HOLDER_WIDTHS = [525, 845] as const;

// Each holder pairs a label-only Slider with the same Slider showing its value, so the play
// function can compare the two label blocks directly.
const ReferenceHolders: FunctionComponent = () => (
  <div style={{ display: 'grid', gap: '2rem' }}>
    {REFERENCE_HOLDER_WIDTHS.flatMap((width) =>
      REFERENCE_WORDINGS.map((wording) => (
        <div
          key={`${width}-${wording.visibleValue}`}
          lang={wording.lang}
          data-holder={width}
          style={{ display: 'grid', gap: '1rem', width }}
        >
          <Slider
            min={0}
            max={5000}
            value={3542}
            onInput$={new Subject<number>()}
            label={wording.label}
          />
          <Slider
            min={0}
            max={5000}
            value={3542}
            onInput$={new Subject<number>()}
            label={wording.label}
            visibleValue={wording.visibleValue}
          />
        </div>
      )),
    )}
  </div>
);

/** English and German currency and percentage wording at the 525px and 845px reference holders:
 *  where label and value fit one line, the block is exactly as tall as the label alone. */
export const VisibleValueBesideLabel: Story = {
  render: () => <ReferenceHolders />,
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    for (const holder of canvasElement.querySelectorAll('[data-holder]')) {
      const [labelOnly, withValue] = within(holder as HTMLElement).getAllByRole(
        'slider',
      );
      const labelOnlyBlock = labelOnly?.previousElementSibling;
      const withValueBlock = withValue?.previousElementSibling;
      if (!labelOnlyBlock || !withValueBlock) throw new Error('no label');
      await expect(withValueBlock.getBoundingClientRect().height).toBe(
        labelOnlyBlock.getBoundingClientRect().height,
      );
      await expect(withValue).toHaveAccessibleName(
        labelOnlyBlock.textContent ?? '',
      );
    }
  },
};

/** A narrow holder with long German wording: label and value wrap onto their own lines, nothing
 *  is clipped or ellipsised, and an unbreakable figure breaks instead of widening the holder. */
export const LongWordingWraps: Story = {
  render: () => (
    <div lang={'de'} data-holder={'narrow'} style={{ width: 200 }}>
      <Slider
        min={0}
        max={5000}
        value={3542}
        onInput$={new Subject<number>()}
        label={'Höchstbetrag des wöchentlichen Arbeitslohns'}
        visibleValue={
          '3.542.000.000.000.000.000.000.000 € pro Woche einschließlich Zuschlägen'
        }
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const holder = canvasElement.querySelector<HTMLElement>('[data-holder]');
    if (!holder) throw new Error('no holder');
    const value = within(holder).getByText(/pro Woche/);
    await expect(holder.getBoundingClientRect().width).toBe(200);
    await expect(holder.scrollWidth).toBeLessThanOrEqual(holder.clientWidth);
    await expect(value.getBoundingClientRect().right).toBeLessThanOrEqual(
      holder.getBoundingClientRect().right,
    );
    await expect(value.scrollHeight).toBeLessThanOrEqual(value.clientHeight);
    await expect(getComputedStyle(value).textOverflow).not.toBe('ellipsis');
    await expect(within(holder).getByRole('slider')).toHaveAccessibleName(
      'Höchstbetrag des wöchentlichen Arbeitslohns',
    );
  },
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
