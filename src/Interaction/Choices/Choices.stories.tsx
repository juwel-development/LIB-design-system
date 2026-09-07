import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Choices } from './Choices';

const meta: Meta<typeof Choices.Root> = {
  title: 'Interaction/Choices',
  component: Choices.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
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
const ControlledExample: FunctionComponent = () => {
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
      <Choices.Choice
        value={'quiet'}
        description={'Nothing arrives unless something needs your attention.'}
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
const LongDescriptionsExample: FunctionComponent = () => {
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
      </Choices.Root>
    </div>
  );
};

export const LongDescriptions: Story = {
  render: () => <LongDescriptionsExample />,
};
