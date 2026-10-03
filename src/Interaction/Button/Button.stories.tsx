import { Input } from 'Interaction/Input/Input';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Subject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Interaction/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['primary', 'secondary', 'ghost', 'outline', 'destructive'],
      description: 'The visual style variant of the button',
    },
    inline: {
      control: { type: 'boolean' },
      description:
        'Sizes a faced button to its content with the field inset, dropping the control minimum width - for an action in a table cell or beside a field',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    children: {
      control: { type: 'text' },
      description: 'The button content',
    },
    testId: {
      control: { type: 'text' },
      description: 'Test ID for automated testing',
    },
    type: {
      control: { type: 'radio' },
      options: ['button', 'submit', 'reset'],
      description:
        "Native button type; use submit for a form's submitting button",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Create a shared click subject for the stories
const clickSubject = new Subject<void>();

const variants = [
  'primary',
  'secondary',
  'outline',
  'destructive',
  'ghost',
] as const;

// Default story
export const Default: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
    onClick$: clickSubject,
  },
};

// Primary variant
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    onClick$: clickSubject,
  },
};

// Secondary variant
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    onClick$: clickSubject,
  },
};

// Ghost variant
export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
    onClick$: clickSubject,
  },
};

/** The quiet secondary (#119): an unfilled control identified by its `controlBorder` edge, the
 *  way Input is, for an action that should not compete with the primary one beside it. Hover tints
 *  it with `backing`; disabled takes the disabled edge and muted ink, with no fill. */
export const Outline: Story = {
  args: {
    children: 'Filter zurücksetzen',
    variant: 'outline',
    onClick$: clickSubject,
  },
};

/** An action that removes or ends something (#119): outlined in the `error` status tone and filled
 *  with it on hover, carrying `surface` as ink. The tone reinforces the words and never replaces
 *  them - the label says what the action does. */
export const Destructive: Story = {
  args: {
    children: 'Vertrag beenden',
    variant: 'destructive',
    onClick$: clickSubject,
  },
};

/** A symbol-only destructive action still says what it does: `ariaLabel` names it for assistive
 *  technology, and the symbol is the visible cue the colour reinforces (#119). */
export const DestructiveSymbolOnly: Story = {
  args: {
    children: '✕',
    variant: 'destructive',
    inline: true,
    ariaLabel: 'Remove entry',
    onClick$: clickSubject,
  },
};

/** The two action variants side by side with the filled ones, so the quiet and destructive tones
 *  read against primary and secondary (#119). */
export const ActionVariants: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

/** `inline` drops the control minimum width and takes the field inset (#119). The top row shows
 *  the floored buttons, the bottom row the same four sized to their content - what an action in a
 *  table cell or at the end of a filter row takes. ghost never had a floor, so it is unchanged. */
export const Inline: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {variants.map((variant) => (
          <Button key={variant} {...args} variant={variant}>
            Öffnen
          </Button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {variants.map((variant) => (
          <Button key={variant} {...args} variant={variant} inline={true}>
            Öffnen
          </Button>
        ))}
      </div>
    </div>
  ),
};

/** An inline outline action beside a field: the unfilled control's edge sits outside its inset,
 *  as Input's does, so the two share one height and one inset (#119). */
export const InlineBesideField: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
      <Input label={'Name'} name={'name'} />
      <Button {...args} variant={'outline'} inline={true}>
        Suchen
      </Button>
      <Button {...args} variant={'destructive'} inline={true}>
        Zurücksetzen
      </Button>
    </div>
  ),
};

/** Long translated labels in a holder narrower than the words (#119). The line breaks only where
 *  the layout constrains it, in balanced lines, and the button grows rather than overflowing;
 *  the same labels in a wide row render on one line exactly as before. The break falls between
 *  words only: one word wider than the holder is wording to shorten, as everywhere in the library. */
export const LongLabels: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div
      style={{
        width: '14rem',
        display: 'grid',
        gap: '0.5rem',
        outline: '1px dashed var(--color-rule)',
      }}
    >
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          Schwerpunkt der Marktforschung festlegen und Bericht öffnen
        </Button>
      ))}
    </div>
  ),
};

export const LongLabelsInActionsRow: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div
      style={{
        width: '22rem',
        display: 'flex',
        flexDirection: 'row',
        gap: 'var(--space-stack)',
        outline: '1px dashed var(--color-rule)',
      }}
    >
      <Button {...args} variant={'outline'}>
        Änderungen verwerfen und zurück
      </Button>
      <Button {...args} variant={'primary'} type={'submit'}>
        Alle Bedingungen jetzt bestätigen
      </Button>
    </div>
  ),
};

/** Every variant holds the one focus ring (#119): the play function tabs onto the first button, so
 *  the ring is on screen; press Tab to walk it across the rest. */
export const KeyboardFocus: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'primary' })).toHaveFocus();
  },
};

/** Every variant disabled (#119): the filled ones and ghost keep the disabled fill they shipped
 *  with; outline and destructive follow Input, edge and ink going to the disabled tones. */
export const DisabledVariants: Story = {
  args: { onClick$: clickSubject, disabled: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

// Disabled button
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'primary',
    disabled: true,
    onClick$: clickSubject,
  },
};

// Custom text button
export const CustomText: Story = {
  args: {
    children: '🚀 Launch',
    variant: 'primary',
    onClick$: clickSubject,
  },
};

// The button that submits a form
export const Submit: Story = {
  args: {
    children: 'Absenden',
    variant: 'primary',
    type: 'submit',
    onClick$: clickSubject,
  },
};
