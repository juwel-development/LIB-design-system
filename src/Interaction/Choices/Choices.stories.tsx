import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Note } from 'index';
import {
  type ComponentProps,
  type FormEvent,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { Choices } from './Choices';

const meta: Meta<typeof Choices.Root> = {
  title: 'Interaction/Choices',
  component: Choices.Root,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Choices is a controlled single selection. Compose direct DOM children (arrays/fragments supported) from stable, unique Choice values; selected must name a supplied value. onSelect$ requests that value; only a consumer render changes selection. Rendering, selecting the current choice and ignored requests never invent selection. Inert keeps the selection and wording visible, disables every choice and skips the group in Tab order.

Choice children accept a plain string or rich ReactNode: visible text naming the option, optionally with decorative, non-interactive phrasing content valid inside a button. Do not nest links, buttons, inputs or focusable content. Decorative images need alt="" and other decoration aria-hidden="true"; the library cannot infer that. Without name the visible label's accessible text names the choice. Set Choice name="No beard" for a visible dash (–): name is the option's accessible name, separate from Root.label (the group's name) and the visible label. The optional description remains an accessible description.

Figure presentation="artwork" without caption **and without overlay** renders a bare img, so it is valid phrasing content and the intended decorative image source. Its size prop names a consumer-declared positive definite length token; it centers and contains the whole artboard, preserving transparency and proportions. Caption creates a figure and overlay creates a div, so omit both inside Choice. Put image then name text in the rich label. A tile shows the image centred at the tile's content top, the marker in the tile's top inline-end corner and the name as a centred caption across the tile's full content width beneath. The image row reserves a marker-wide gutter on both sides, so the marker never covers the art: fixed artwork must fit the content width less two marker widths. A text-only tile (including a named dash) shows the marker in the same corner above its name, in the same gallery column.

Tile names are set at the small type role and hyphenate by the lang in effect: set lang on the page or an ancestor, or a long German compound can only break at an arbitrary letter. A word breaks anywhere only when no hyphenation point fits. Choices never truncates or clamps a name; shortening is the consumer's decision. A label element that shortens itself (for example an inline-block with its own ellipsis) stays within the name cell, and a visibly shortened label must still name the option in full through name. Tiles/Consumer Workload shows the full #184 gallery workload at 48px art in five columns, in English and German.

arrangement="vertical" (default) keeps full-width rows; "wrapping" keeps content-sized rows; "columns" shares equal-width columns of those same rows, marker beside label with no extra height; "tiles" shares equal-width image columns. Only columns makes the unselected row boundary transparent: its marker keeps the controlBorder box, and selection shows the marker dot and foreground boundary. Boundary thickness and box dimensions stay the same. Other arrangements retain their controlBorder boundary.

Columns read **--choice-column-min-width** (default 12rem); tiles read the independent **--choice-tile-min-width** (default 9rem). Both are consumer-themable positive definite CSS lengths. For example :root { --choice-column-min-width: 14rem; --choice-tile-min-width: 11rem; } changes each group's column count independently without consumer CSS selectors, a CSS/class prop, or a column-count setting. A group narrower than its minimum fits one column. The container decides column count (ADR 0008). Fixed artwork must fit the tile's content width, including below the minimum; Choices does not shrink or crop it. Long and unbroken names wrap, never truncate; outside tiles they keep the body role and wrap anywhere, without hyphenation.

Every arrangement keeps the marker as a non-colour selection cue, aria-checked, unchanged selection geometry and the shared focus-visible ring. Tab enters at the selected choice. Down/Right advance and Up/Left retreat in declared order with wraparound, including across visual rows; activation follows focus. Subjects and all wording/translation, eligible choices and image updates remain consumer-owned. Columns/Consumer Workload combines 13 categories in two columns and 14 Hairstyle tiles with a named dash, long English/German names and independent token changes. The Tiles/Full Inventory story demonstrates inventories of 14, 11, 7, 5 and 6, translated long names, named dash choices, live art and theme token updates.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    arrangement: {
      control: { type: 'select' },
      options: ['vertical', 'wrapping', 'columns', 'tiles'],
      description:
        'Full-width rows (default), content-sized wrapping rows, equal-column quiet rows, or image tiles',
    },
    selected: {
      control: false,
      description:
        'The key of the selected choice; the consumer owns it and answers selection requests',
    },
    onSelect$: {
      control: false,
      description:
        'Subject that emits a choice key on click or arrow keys; the selected row emits nothing',
    },
    label: {
      control: { type: 'text' },
      description: "The radio group's accessible name",
    },
    inert: {
      control: { type: 'boolean' },
      description:
        'Keeps the selection and every description visible but permits no selection change',
    },
    testId: {
      control: { type: 'text' },
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// The controlled wiring every consumer repeats: hold the selected key, subscribe it to the
// Subject, and pass it back in. Choices itself never selects - clicking a row or arrowing
// through the group is answered here, which is the changed-selection example in motion.
const ControlledExample = ({
  arrangement,
  inert,
  labelOnly = false,
}: {
  arrangement?: ComponentProps<typeof Choices.Root>['arrangement'];
  inert?: boolean;
  labelOnly?: boolean;
}) => {
  const [selected, setSelected] = useState('daily');
  const [onSelect$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe(setSelected);
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  return (
    <Choices.Root
      selected={selected}
      onSelect$={onSelect$}
      label={'Notification cadence'}
      arrangement={arrangement}
      inert={inert}
    >
      <Choices.Choice
        value={'daily'}
        description={
          labelOnly
            ? undefined
            : 'A short digest every morning, quiet the rest of the day.'
        }
      >
        Daily digest
      </Choices.Choice>
      <Choices.Choice
        value={'weekly'}
        description={
          labelOnly ? undefined : 'One summary at the start of the week.'
        }
      >
        Weekly summary
      </Choices.Choice>
      <Choices.Choice
        value={'quiet'}
        description={
          labelOnly
            ? undefined
            : 'Nothing arrives unless something needs your attention.'
        }
      >
        Quiet
      </Choices.Choice>
    </Choices.Root>
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
};

// An inert group with a retained selection: the marker, highlight and every description stay
// visible, but no pointer or keyboard input changes the selection and Tab passes the group by.
// All wording is the caller's - here a subscription the viewer may not change mid-term.
export const InertWithRetainedSelection: Story = {
  render: () => (
    <Choices.Root
      selected={'weekly'}
      onSelect$={new Subject<string>()}
      label={'Notification cadence'}
      inert
    >
      <Choices.Choice
        value={'daily'}
        description={'A short digest every morning, quiet the rest of the day.'}
      >
        Daily digest
      </Choices.Choice>
      <Choices.Choice
        value={'weekly'}
        description={'One summary at the start of the week.'}
      >
        Weekly summary
      </Choices.Choice>
    </Choices.Root>
  ),
};

// Long descriptions in a narrow column, at English and German lengths: names and descriptions
// wrap instead of overflowing or truncating. The German rows carry the compound-heavy strings
// translation actually produces - caller-supplied content, like every word here.
const LongDescriptionsExample = ({
  arrangement,
}: {
  arrangement?: ComponentProps<typeof Choices.Root>['arrangement'];
}) => {
  const [selected, setSelected] = useState('summary');
  const [onSelect$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = onSelect$.subscribe(setSelected);
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  return (
    <div style={{ maxWidth: '20rem' }}>
      <Choices.Root
        selected={selected}
        onSelect$={onSelect$}
        label={'Report depth'}
        arrangement={arrangement}
      >
        <Choices.Choice
          value={'summary'}
          description={
            'A single page covering the headline figures, with every supporting table left out so the reader can decide in one sitting whether the quarter needs a closer look.'
          }
        >
          Condensed summary for a first reading
        </Choices.Choice>
        <Choices.Choice
          value={'complete'}
          description={
            'Der vollständige Bericht einschließlich sämtlicher Anlagen, Einzelaufstellungen und Prüfungsvermerke der Wirtschaftsprüfungsgesellschaft, gedacht für die abschließende Durchsicht durch die Fachabteilung.'
          }
        >
          Vollständiger Geschäftsbericht mit Anlagenverzeichnis
        </Choices.Choice>
        <Choices.Choice
          value="unbroken"
          description="Wirtschaftsprüfungsgesellschaftsberichterstattungsanforderungen"
        >
          Donaudampfschifffahrtsgesellschaftskapitänsanwärterauswahl
        </Choices.Choice>
      </Choices.Root>
    </div>
  );
};

export const LongDescriptions: Story = {
  render: () => <LongDescriptionsExample />,
};

export const VerticalLabelOnly: Story = {
  render: () => <ControlledExample labelOnly />,
};

export const WrappingDescriptions: Story = {
  render: () => <ControlledExample arrangement="wrapping" />,
};

export const WrappingInert: Story = {
  render: () => <ControlledExample arrangement="wrapping" inert />,
};

export const WrappingLongText: Story = {
  render: () => <LongDescriptionsExample arrangement="wrapping" />,
};

export const NarrowWrapping: Story = {
  render: () => (
    <div style={{ maxWidth: '20rem' }}>
      <ControlledExample arrangement="wrapping" labelOnly />
    </div>
  ),
};

const NativeActivationExample = () => {
  const [onSelect$] = useState(() => new Subject<string>());
  const [requests, setRequests] = useState(0);
  const [submissions, setSubmissions] = useState(0);
  useEffect(() => {
    const subscription = onSelect$.subscribe(() =>
      setRequests((count) => count + 1),
    );
    return () => subscription.unsubscribe();
  }, [onSelect$]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissions((count) => count + 1);
  };
  return (
    <form onSubmit={submit}>
      <Button variant="plain">Before choices</Button>
      <Choices.Root
        arrangement="wrapping"
        label="Unanswered requests"
        selected="daily"
        onSelect$={onSelect$}
      >
        <Choices.Choice value="daily">Daily digest</Choices.Choice>
        <Choices.Choice value="weekly">Weekly summary</Choices.Choice>
      </Choices.Root>
      <Button variant="plain">After choices</Button>
      <Note>{`Requests: ${requests}; submissions: ${submissions}`}</Note>
    </form>
  );
};

export const UnansweredRequests: Story = {
  render: () => <NativeActivationExample />,
};
