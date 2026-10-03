import type { Meta, StoryObj } from '@storybook/react-vite';
import { Subject } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Interaction/Button',
  component: Button,
  // Block layout, not centered: the centered canvas is a content-sized flex item, and a holder sized
  // to its content gives the width floor nothing to yield to - the one holder where it does not apply.
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `One \`<button>\` in one of five closed variants. \`primary\` and \`secondary\` are the filled
actions, \`ghost\` is the padded text action with a hover underline and no minimum width, and two were
added for the game action roles under the approved
[#119](https://github.com/juwel-development/LIB-design-system/issues/119) brief:

- **\`outlined\`** is the quiet secondary: \`secondary\` text and a \`secondary\` edge on an unfilled
  surface, so it reads as the quiet form of the filled \`secondary\` beside a \`primary\`. Hover tints it
  with \`backing\` and keeps the edge; disabled takes the \`disabled\` edge and \`muted\` ink, with no
  fill. The edge gives its pixel back from the inset, so an outlined button is exactly a filled one's
  height. Filled buttons draw no edge, before or after this variant - see the reconciled boundary
  decision in \`.out-of-scope/control-boundary-independent-of-fill.md\`.
- **\`destructive\`** is an action that removes or ends something: filled with the \`error\` status
  tone, inked with \`errorForeground\`, stepping to \`errorHover\` on hover. It is a variant and not a
  tone prop - there is no destructive outlined or destructive ghost. The tone reinforces words and
  never replaces them: the label, or the \`ariaLabel\` of a symbol-only button, must say what the
  action does. The library carries no confirmation flow; that is the consumer's.

Every variant draws the one focus ring and nothing else on focus, carries native \`disabled\`, emits
nothing while disabled, and defaults to \`type="button"\`. Under forced colours the filled variants
draw a one-pixel boundary, because the platform forces their fill to \`ButtonFace\`, which can equal
the canvas; the outlined edge and the focus ring survive forced colours as they are.

### Token constraints the two variants add

Stated on the roles in \`src/Theme/Palette.ts\` and pinned by \`Palette.spec.ts\` in both shipped
themes; a consumer theme inherits the same obligations.

| Position | Roles | Floor |
| --- | --- | --- |
| outlined text and edge against the surface, at rest and on the \`backing\` hover tint | \`secondary\` vs \`surface\`, \`secondary\` vs \`backing\` | 4.5:1 (covers the edge's 3:1) |
| destructive fill against the surface, at rest and on hover | \`error\`, \`errorHover\` vs \`surface\` | 3:1 |
| destructive ink against its fill, at rest and on hover | \`errorForeground\` vs \`error\`, \`errorHover\` | 4.5:1 |

\`errorHover\` and \`errorForeground\` are optional in \`PaletteTokens\`, so a palette object written
before them keeps compiling; the shipped stylesheet declares \`--color-error-hover\` and
\`--color-error-foreground\` with defaults tuned for the shipped \`error\`, and a theme that re-points
\`error\` re-points those two with it. The dark \`secondary\` pair moved one ramp step lighter
(sky-500 and sky-400) so the outlined text clears 4.5:1 on the dark surface.

### Sizing and long labels

The four faced variants share one inset and the \`--control-min-width\` floor, so a row of them
aligns. The floor yields to the holder: a button in a column narrower than the minimum shrinks to
it instead of overflowing, and its label wraps. The floor is measured against the holder's width,
so a holder sized to its own content - an \`auto\` grid track, a table cell, an inline wrapper -
gives it nothing to yield to, and a button there takes its content width. In a single-line flex
row that cannot hold every button at its content width, each shrinks to the floor and wraps its
label; a row narrower than the floors it holds is a wrapping \`Cluster\`'s job.

A label wraps where the layout constrains it and nowhere else - in a wide row a short label renders
on one line exactly as before - and a word wider than its holder breaks inside the word rather than
running past the edge, so nothing is clipped and no horizontal scroll appears. Height grows with the
wrapped lines and the inset holds, so the hit area never shrinks. Content-sized actions in running
text are \`ghost\`, or \`plain\` where #114 has landed; \`Button\` adds no size or inline prop for them.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['primary', 'secondary', 'ghost', 'outlined', 'destructive'],
      description: 'The visual style variant of the button',
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
  'outlined',
  'destructive',
  'ghost',
] as const;

/** One of every variant, so a story can show them in a row with the same args. */
const everyVariant = (args: Story['args'], label?: string) =>
  variants.map((variant) => (
    <Button key={variant} {...args} variant={variant}>
      {label ?? variant}
    </Button>
  ));

/** A decorative icon a consumer composes with the label; it inherits the ink and scales with it. */
const TrashIcon = () => (
  <svg
    aria-hidden={'true'}
    width={'1em'}
    height={'1em'}
    viewBox={'0 0 16 16'}
    fill={'none'}
    stroke={'currentColor'}
    strokeWidth={'1.5'}
    style={{ flexShrink: 0 }}
  >
    <path d={'M2 4h12M6 4V2h4v2M4 4l1 10h6l1-10M6.5 7v4M9.5 7v4'} />
  </svg>
);

const holder = (width: string, display: 'grid' | 'flex' = 'grid') => ({
  width,
  display,
  gap: '0.5rem',
  outline: '1px dashed var(--color-rule)',
});

const longLabel = 'Schwerpunkt der Marktforschung festlegen und Bericht öffnen';

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

/** The quiet secondary (#119): `secondary` text and edge on an unfilled surface, for an action
 *  beside a primary one that must not compete with it. Hover tints it with `backing` and keeps the
 *  edge; disabled takes the disabled edge and muted ink, with no fill. */
export const Outlined: Story = {
  args: {
    children: 'Filter zurücksetzen',
    variant: 'outlined',
    onClick$: clickSubject,
  },
};

/** An action that removes or ends something (#119): filled with the `error` status tone, inked
 *  with `errorForeground`, stepping to `errorHover` on hover. The tone reinforces the words and
 *  never replaces them - the label says what the action does. */
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
    variant: 'destructive',
    ariaLabel: 'Eintrag entfernen',
    onClick$: clickSubject,
  },
  render: (args) => (
    <Button {...args}>
      <TrashIcon />
    </Button>
  ),
};

/** Text composed with an icon (#119): the consumer places the icon beside the label; it takes the
 *  variant's ink and scales with the type, and the label alone names the button. */
export const WithIcon: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button {...args} variant={'destructive'}>
        <TrashIcon />
        Vertrag beenden
      </Button>
      <Button {...args} variant={'outlined'}>
        <TrashIcon />
        Entwurf verwerfen
      </Button>
      <Button {...args} variant={'ghost'}>
        <TrashIcon />
        Entfernen
      </Button>
    </div>
  ),
};

/** The five variants side by side, so the quiet and destructive treatments read against primary
 *  and secondary (#119). The four faced ones share one height, inset and minimum width. */
export const ActionVariants: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {everyVariant(args)}
    </div>
  ),
};

/** Long translated labels in a holder narrower than the words (#119). The line breaks only where
 *  the layout constrains it, in balanced lines, and the button grows rather than overflowing;
 *  the same labels in a wide row render on one line exactly as before. */
export const LongLabels: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={holder('14rem')}>{everyVariant(args, longLabel)}</div>
  ),
};

/** A holder narrower than the control minimum width (#119): the floor yields to the holder, so
 *  every faced variant shrinks to 8rem and wraps, with no horizontal overflow. */
export const NarrowHolder: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={holder('8rem')}>
      {everyVariant(args, 'Alle Bedingungen bestätigen')}
    </div>
  ),
};

/** Two columns in a grid narrower than two control minimum widths (#119): each button shrinks to
 *  its column and wraps rather than widening the column or overflowing the grid. */
export const NarrowGrid: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={{ ...holder('16rem'), gridTemplateColumns: '1fr 1fr' }}>
      <Button {...args} variant={'outlined'}>
        Änderungen verwerfen
      </Button>
      <Button {...args} variant={'primary'} type={'submit'}>
        Alle Bedingungen bestätigen
      </Button>
      <Button {...args} variant={'destructive'}>
        <TrashIcon />
        Vertrag beenden
      </Button>
      <Button {...args} variant={'secondary'}>
        Später erinnern
      </Button>
    </div>
  ),
};

/** A single word wider than its holder (#119): it breaks inside the word rather than running past
 *  the edge, so the holder never overflows and the whole word stays on screen. */
export const LongUnbrokenWord: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div style={holder('9rem')}>
      {everyVariant(args, 'Marktforschungsschwerpunktfestlegung')}
    </div>
  ),
};

/** Long labels in a single-line actions row (#119): the row cannot hold both at their content
 *  width, so each shrinks to the shared floor and wraps its label inside it, and the row never
 *  overflows. A row narrower than two floors is a wrapping `Cluster`'s job. */
export const LongLabelsInActionsRow: Story = {
  args: { onClick$: clickSubject },
  render: (args) => (
    <div
      style={{
        ...holder('22rem', 'flex'),
        flexWrap: 'nowrap',
        gap: 'var(--space-stack)',
      }}
    >
      <Button {...args} variant={'outlined'}>
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
      {everyVariant(args)}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'primary' })).toHaveFocus();
  },
};

/** Every variant disabled (#119): the filled ones and ghost take the disabled fill; outlined
 *  follows Input, edge and ink going to the disabled tones with no fill. */
export const DisabledVariants: Story = {
  args: { onClick$: clickSubject, disabled: true },
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {everyVariant(args)}
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
