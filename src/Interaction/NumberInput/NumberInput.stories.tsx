import { Button } from 'Interaction/Button/Button';
import { Tabs } from 'Interaction/Tabs/Tabs';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { NumberInput } from './NumberInput';

const meta: Meta<typeof NumberInput> = {
  title: 'Interaction/NumberInput',
  component: NumberInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A text control with a decimal keyboard hint for typed amounts and thresholds. The entered text is kept exactly as typed - blank, `0`, `-`, `1.`, `1,5`, `1.5` and pasted content stay distinct - and emitted as a string on every user edit. The consumer parses the whole string, decides what is blank, unfinished, invalid or an accepted finite number, chooses its decimal convention and words every message. `defaultValue` initialises on mount only; native form reset restores it silently, `reset$` empties the live node silently. Neither touches consumer-owned saved state. The device chooses the actual keyboard: a decimal separator and digits are requested, a minus key or the exclusion of other characters is not promised.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    required: {
      control: { type: 'boolean' },
      description:
        'Presence only: the form rejects an empty field, never a non-numeric one',
    },
    optionalLabel: {
      control: { type: 'text' },
      description:
        'The marker a non-required field carries, worded by the consuming app; left out, no marker renders',
    },
    invalid: {
      control: { type: 'boolean' },
      description:
        "The consumer's verdict on the text; maps to aria-invalid and reveals the error message",
    },
    disabled: { control: { type: 'boolean' } },
    defaultValue: {
      description:
        'Initial text only; remount the field to restore other saved text',
    },
    onInput$: { control: false },
    reset$: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Blank is the optional filter's own state - "no limit" - and the field never turns it into zero.
export const Empty: Story = {
  args: {
    label: 'Maximum price',
    name: 'maxPrice',
    placeholder: 'No limit',
    hint: 'Leave blank for no limit',
  },
};

export const Zero: Story = {
  args: {
    label: 'Maximum price',
    name: 'maxPrice',
    defaultValue: '0',
    hint: 'Blank means no limit; 0 means free songs only',
  },
};

export const Decimal: Story = {
  args: {
    label: 'Maximum commission',
    name: 'maxCommission',
    defaultValue: '12.5',
    hint: 'Percent of the sale',
  },
};

export const CommaDecimal: Story = {
  args: {
    label: 'Höchstprovision',
    name: 'maxCommission',
    defaultValue: '12,5',
    hint: 'Prozent vom Verkaufspreis',
  },
};

// A field mid-edit: `1.` is neither a number nor an error yet, and the control keeps it so the
// consumer can decide to wait rather than complain.
export const Incomplete: Story = {
  args: {
    label: 'Maximum commission',
    name: 'maxCommission',
    defaultValue: '1.',
    hint: 'Percent of the sale',
  },
};

export const InvalidPasted: Story = {
  args: {
    label: 'Maximum price',
    name: 'maxPrice',
    defaultValue: '12abc',
    invalid: true,
    errorMessage: 'Enter an amount such as 12.50',
  },
};

export const Required: Story = {
  args: {
    label: 'Song count',
    name: 'songCount',
    required: true,
    hint: 'Songs requested per month',
  },
};

export const Optional: Story = {
  args: {
    label: 'Minimum quality',
    name: 'minQuality',
    optionalLabel: 'optional',
  },
};

export const OptionalInAnotherLanguage: Story = {
  args: {
    label: 'Mindestqualität',
    name: 'minQuality',
    optionalLabel: 'freiwillig',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Maximum price',
    name: 'maxPrice',
    defaultValue: '250',
    disabled: true,
  },
};

// The consumer's saved-state loop: onInput$ feeds the saved text, Clear empties the live node in
// place (focus survives) and clears the saved text with it, and returning to the tab remounts the
// field from what was saved. NumberInput restores nothing by itself.
const ClearAndRestoreExample: FunctionComponent = () => {
  const [active, setActive] = useState('filters');
  const [savedPrice, setSavedPrice] = useState('250');
  const [onSelect$] = useState(() => new Subject<string>());
  const [priceInput$] = useState(() => new Subject<string>());
  const [priceReset$] = useState(() => new Subject<void>());
  const [clear$] = useState(() => new Subject<void>());
  useEffect(() => {
    const subscriptions = [
      onSelect$.subscribe(setActive),
      priceInput$.subscribe(setSavedPrice),
      clear$.subscribe(() => {
        setSavedPrice('');
        priceReset$.next();
      }),
    ];
    return () => {
      for (const subscription of subscriptions) {
        subscription.unsubscribe();
      }
    };
  }, [onSelect$, priceInput$, priceReset$, clear$]);
  return (
    <div style={{ width: '20rem' }}>
      <Tabs.Root active={active} onSelect$={onSelect$} label={'Songs'}>
        <Tabs.List>
          <Tabs.Tab value={'filters'}>Filters</Tabs.Tab>
          <Tabs.Tab value={'results'}>Results</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value={'filters'}>
          <div className={'flex flex-col items-start gap-[var(--space-stack)]'}>
            <NumberInput
              label={'Maximum price'}
              name={'maxPrice'}
              placeholder={'No limit'}
              defaultValue={savedPrice}
              onInput$={priceInput$}
              reset$={priceReset$}
            />
            <Button variant={'secondary'} onClick$={clear$}>
              Clear
            </Button>
          </div>
        </Tabs.Panel>
        <Tabs.Panel value={'results'}>
          {savedPrice === ''
            ? 'Showing every song, with no price limit.'
            : `Showing songs priced up to ${savedPrice}.`}
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  );
};

export const ClearAndRestore: Story = {
  render: () => <ClearAndRestoreExample />,
};

// Two different clears side by side: the native reset button returns the form to its default
// text, reset$ empties the field. Neither emits on onInput$ and neither touches saved state.
const nativeResetVersusReset$ = new Subject<void>();

export const NativeResetVersusReset: Story = {
  args: {
    label: 'Maximum price',
    name: 'maxPrice',
    defaultValue: '250',
    reset$: nativeResetVersusReset$,
  },
  render: (args) => (
    <form
      className={'flex flex-col items-start gap-[var(--space-stack)]'}
      onSubmit={(event) => event.preventDefault()}
    >
      <NumberInput {...args} />
      <div className={'flex gap-[var(--space-stack)]'}>
        <Button variant={'secondary'} type={'reset'}>
          Restore default
        </Button>
        <Button variant={'secondary'} onClick$={nativeResetVersusReset$}>
          Empty
        </Button>
      </div>
    </form>
  ),
};

// What a consumer's parser looks like. Each outcome is a distinct state the app words itself; the
// whole string is matched before conversion, so `12abc` is rejected instead of read as 12, and the
// finite check catches text the pattern admits but a number cannot hold (four hundred digits).
type Reading =
  | { kind: 'blank' }
  | { kind: 'unfinished' }
  | { kind: 'accepted'; amount: number }
  | { kind: 'rejected' };

const readAmount = (
  text: string,
  complete: RegExp,
  unfinished: RegExp,
  toNumber: (text: string) => number,
): Reading => {
  if (text === '') {
    return { kind: 'blank' };
  }
  if (complete.test(text)) {
    const amount = toNumber(text);
    return Number.isFinite(amount)
      ? { kind: 'accepted', amount }
      : { kind: 'rejected' };
  }
  return unfinished.test(text) ? { kind: 'unfinished' } : { kind: 'rejected' };
};

interface IParsingExampleProps {
  label: string;
  hint: string;
  complete: RegExp;
  unfinished: RegExp;
  toNumber: (text: string) => number;
  errorMessage: string;
  describe: (reading: Reading) => string;
}

const ParsingExample: FunctionComponent<IParsingExampleProps> = ({
  label,
  hint,
  complete,
  unfinished,
  toNumber,
  errorMessage,
  describe,
}) => {
  const [text, setText] = useState('');
  const [onInput$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onInput$.subscribe(setText);
    return () => subscription.unsubscribe();
  }, [onInput$]);
  const reading = readAmount(text, complete, unfinished, toNumber);
  return (
    <div
      className={'flex flex-col gap-[var(--space-stack)]'}
      style={{ width: '20rem' }}
    >
      <NumberInput
        label={label}
        name={'maxPrice'}
        hint={hint}
        invalid={reading.kind === 'rejected'}
        errorMessage={errorMessage}
        onInput$={onInput$}
      />
      <output className={'font-secondary text-body text-foreground'}>
        {describe(reading)}
      </output>
    </div>
  );
};

export const EnglishParsing: Story = {
  render: () => (
    <ParsingExample
      label={'Maximum price'}
      hint={'Try blank, 0, 1., 12.50 and 12abc'}
      complete={/^-?\d+(\.\d+)?$/}
      unfinished={/^-?\d*\.?$/}
      toNumber={Number}
      errorMessage={'Enter an amount such as 12.50'}
      describe={(reading) => {
        switch (reading.kind) {
          case 'blank':
            return 'No price limit.';
          case 'unfinished':
            return 'Keep typing…';
          case 'accepted':
            return reading.amount === 0
              ? 'Free songs only.'
              : `Songs priced up to ${reading.amount}.`;
          case 'rejected':
            return 'That is not an amount we can use.';
        }
      }}
    />
  ),
};

// The same loop in a German app: the comma is the decimal separator, the wording is German, and
// the dot is rejected here because this consumer chose to - NumberInput has no opinion.
export const GermanParsing: Story = {
  render: () => (
    <ParsingExample
      label={'Höchstpreis'}
      hint={'Probieren Sie leer, 0, „1,“ sowie 12,50 und 12abc'}
      complete={/^-?\d+(,\d+)?$/}
      unfinished={/^-?\d*,?$/}
      toNumber={(text) => Number(text.replace(',', '.'))}
      errorMessage={'Geben Sie einen Betrag wie 12,50 ein'}
      describe={(reading) => {
        switch (reading.kind) {
          case 'blank':
            return 'Keine Preisgrenze.';
          case 'unfinished':
            return 'Weiter tippen…';
          case 'accepted':
            return reading.amount === 0
              ? 'Nur kostenlose Songs.'
              : `Songs bis ${reading.amount.toLocaleString('de-DE')}.`;
          case 'rejected':
            return 'Das ist kein Betrag, den wir verwenden können.';
        }
      }}
    />
  ),
};
