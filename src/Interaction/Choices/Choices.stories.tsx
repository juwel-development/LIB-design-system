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
  },
  tags: ['autodocs'],
  argTypes: {
    arrangement: {
      control: { type: 'select' },
      options: ['vertical', 'wrapping'],
      description:
        'Full-width vertical rows (default), or content-sized choices flowing onto further lines',
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
