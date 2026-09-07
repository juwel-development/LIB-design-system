import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FunctionComponent, useEffect, useState } from 'react';
import { Subject, type Subscription } from 'rxjs';
import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog.Root> = {
  title: 'Layout/Dialog',
  component: Dialog.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onDismiss$: {
      control: false,
      description:
        'Emits on every dismissal - Escape and the Scrim; never on opening, never on a consumer-emitted false',
    },
    showDialog$: {
      control: false,
      description:
        'Bidirectional visibility Subject: consumer booleans drive presentation, the Dialog emits only false after a dismissal. Absent, the Dialog opens on mount',
    },
    extent: {
      control: { type: 'radio' },
      options: ['screen', 'content'],
      description:
        'What bounds the surface: screen claims the viewport for a larger workflow, content gives one compact task a defined width',
    },
    ariaLabel: {
      control: { type: 'text' },
      description:
        'Names an intentionally titleless Dialog - exactly one naming source, never together with Dialog.Title',
    },
    testId: {
      control: { type: 'text' },
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const unsubscribeAll = (subscriptions: Subscription[]) => () => {
  for (const subscription of subscriptions) {
    subscription.unsubscribe();
  }
};

// The wiring every confirming consumer repeats: a trigger opens through the Subject, the required
// dismissal stream reports cancellation, and the consumer-owned Cancel control is wired to the
// same dismissal and visibility transitions Escape and the Scrim take. Confirmation stays
// entirely the consumer's: it acts, then hides - it never touches onDismiss$.
const ConfirmationExample: FunctionComponent = () => {
  const [showDialog$] = useState(() => new Subject<boolean>());
  const [onDismiss$] = useState(() => new Subject<void>());
  const [open$] = useState(() => new Subject<void>());
  const [cancel$] = useState(() => new Subject<void>());
  const [confirm$] = useState(() => new Subject<void>());
  const [outcome, setOutcome] = useState('No outcome yet');
  useEffect(
    () =>
      unsubscribeAll([
        open$.subscribe(() => showDialog$.next(true)),
        onDismiss$.subscribe(() => setOutcome('Cancelled')),
        cancel$.subscribe(() => {
          onDismiss$.next();
          showDialog$.next(false);
        }),
        confirm$.subscribe(() => {
          setOutcome('Employment ended');
          showDialog$.next(false);
        }),
      ]),
    [showDialog$, onDismiss$, open$, cancel$, confirm$],
  );
  return (
    <>
      <Button onClick$={open$}>End employment…</Button>
      <P color={'muted'}>{outcome}</P>
      <Dialog.Root
        onDismiss$={onDismiss$}
        showDialog$={showDialog$}
        extent={'content'}
      >
        <Dialog.Title>End employment?</Dialog.Title>
        <Dialog.Description>
          Riley Chen leaves the staff and returns to the candidates.
        </Dialog.Description>
        <Dialog.Content>
          <P>The final wage share of $12 is due immediately.</P>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant={'secondary'} onClick$={cancel$}>
            Cancel
          </Button>
          <Button onClick$={confirm$}>End employment</Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

export const OrdinaryConfirmation: Story = {
  render: () => <ConfirmationExample />,
};

// A warning confirmation in German: the warning composes through the existing warning status tone
// and stays understandable without colour, and it coexists with an *enabled* confirmation in the
// same Dialog - no second dialog, no disabled action, no library warning state.
const WarningExample: FunctionComponent = () => {
  const [showDialog$] = useState(() => new Subject<boolean>());
  const [onDismiss$] = useState(() => new Subject<void>());
  const [open$] = useState(() => new Subject<void>());
  const [cancel$] = useState(() => new Subject<void>());
  const [confirm$] = useState(() => new Subject<void>());
  useEffect(
    () =>
      unsubscribeAll([
        open$.subscribe(() => showDialog$.next(true)),
        cancel$.subscribe(() => {
          onDismiss$.next();
          showDialog$.next(false);
        }),
        confirm$.subscribe(() => showDialog$.next(false)),
      ]),
    [showDialog$, onDismiss$, open$, cancel$, confirm$],
  );
  return (
    <>
      <Button onClick$={open$}>Anstellung beenden…</Button>
      <Dialog.Root
        onDismiss$={onDismiss$}
        showDialog$={showDialog$}
        extent={'content'}
      >
        <Dialog.Title>Anstellung beenden?</Dialog.Title>
        <Dialog.Description>
          Kim Weber verlässt das Team und kehrt zu den Kandidaten zurück.
        </Dialog.Description>
        <Dialog.Content>
          <P color={'warning'}>
            Warnung: Der letzte Lohnanteil von 9&nbsp;$ übersteigt das Guthaben.
            Die Bestätigung beendet das Spiel.
          </P>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant={'secondary'} onClick$={cancel$}>
            Abbrechen
          </Button>
          <Button onClick$={confirm$}>Anstellung beenden</Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

export const WarningConfirmation: Story = {
  render: () => <WarningExample />,
};

// An intentionally titleless Dialog: ariaLabel is the one naming source, so assistive technology
// still announces the task while nothing visible repeats what the content already says.
const TitlelessExample: FunctionComponent = () => {
  const [showDialog$] = useState(() => new Subject<boolean>());
  const [onDismiss$] = useState(() => new Subject<void>());
  const [open$] = useState(() => new Subject<void>());
  const [close$] = useState(() => new Subject<void>());
  useEffect(
    () =>
      unsubscribeAll([
        open$.subscribe(() => showDialog$.next(true)),
        close$.subscribe(() => {
          onDismiss$.next();
          showDialog$.next(false);
        }),
      ]),
    [showDialog$, onDismiss$, open$, close$],
  );
  return (
    <>
      <Button onClick$={open$}>Show keyboard shortcuts</Button>
      <Dialog.Root
        onDismiss$={onDismiss$}
        showDialog$={showDialog$}
        ariaLabel={'Keyboard shortcuts'}
        extent={'content'}
      >
        <Dialog.Content>
          <P>Press Space to run and Escape to leave any dialog.</P>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant={'secondary'} onClick$={close$}>
            Close
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

export const TitlelessNaming: Story = {
  render: () => <TitlelessExample />,
};

// The default screen extent under long translated content: the surface takes the viewport minus
// the gutter and region insets, the header and Actions stay fixed, and only Dialog.Content
// scrolls. The paragraphs are the consumer's; so is every word.
const LongContentExample: FunctionComponent = () => {
  const [showDialog$] = useState(() => new Subject<boolean>());
  const [onDismiss$] = useState(() => new Subject<void>());
  const [open$] = useState(() => new Subject<void>());
  const [cancel$] = useState(() => new Subject<void>());
  const [confirm$] = useState(() => new Subject<void>());
  useEffect(
    () =>
      unsubscribeAll([
        open$.subscribe(() => showDialog$.next(true)),
        cancel$.subscribe(() => {
          onDismiss$.next();
          showDialog$.next(false);
        }),
        confirm$.subscribe(() => showDialog$.next(false)),
      ]),
    [showDialog$, onDismiss$, open$, cancel$, confirm$],
  );
  return (
    <>
      <Button onClick$={open$}>Review the contract…</Button>
      <Dialog.Root onDismiss$={onDismiss$} showDialog$={showDialog$}>
        <Dialog.Title>Review the employment contract</Dialog.Title>
        <Dialog.Description>
          Read every clause before you accept - Der Vertrag gilt ab sofort.
        </Dialog.Description>
        <Dialog.Content>
          {Array.from({ length: 24 }, (_, index) => `Clause ${index + 1}`).map(
            (clause) => (
              <P key={clause}>
                {clause}: Die wöchentliche Vergütung richtet sich nach der
                vereinbarten Lohnsumme und wird anteilig für angefangene Wochen
                berechnet. The weekly wage follows the agreed sum and is settled
                proportionally for started weeks.
              </P>
            ),
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant={'secondary'} onClick$={cancel$}>
            Decline
          </Button>
          <Button onClick$={confirm$}>Accept</Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

export const LongContent: Story = {
  render: () => <LongContentExample />,
};

// Confirmation removes the trigger: each row owns an End control, and after confirming, the row
// is gone - so the consumer moves focus to its own stable destination, the list heading. The
// Dialog restores the opener only on cancellation, where the opener still exists.
const TriggerRemovedExample: FunctionComponent = () => {
  const [showDialog$] = useState(() => new Subject<boolean>());
  const [onDismiss$] = useState(() => new Subject<void>());
  const [cancel$] = useState(() => new Subject<void>());
  const [confirm$] = useState(() => new Subject<void>());
  const [endRequests] = useState(() => new Map<string, Subject<void>>());
  const [staff, setStaff] = useState(['Riley Chen', 'Kim Weber', 'Alex Roy']);
  const [candidate, setCandidate] = useState<string | undefined>(undefined);
  for (const person of staff) {
    if (!endRequests.has(person)) {
      endRequests.set(person, new Subject<void>());
    }
  }
  useEffect(
    () =>
      unsubscribeAll([
        ...staff.map((person) =>
          (endRequests.get(person) as Subject<void>).subscribe(() => {
            setCandidate(person);
            showDialog$.next(true);
          }),
        ),
        cancel$.subscribe(() => {
          onDismiss$.next();
          showDialog$.next(false);
        }),
        confirm$.subscribe(() => {
          setStaff((current) => current.filter((name) => name !== candidate));
          showDialog$.next(false);
          // The confirmed row is gone with its trigger, so the consumer focuses its own stable
          // destination; the Dialog invents no fallback.
          document.getElementById('staff-heading')?.focus();
        }),
      ]),
    [showDialog$, onDismiss$, cancel$, confirm$, endRequests, staff, candidate],
  );
  return (
    <>
      <h2 id={'staff-heading'} tabIndex={-1}>
        Staff
      </h2>
      {staff.map((person) => (
        <P key={person}>
          {person}{' '}
          <Button
            variant={'secondary'}
            onClick$={endRequests.get(person) as Subject<void>}
          >
            End employment…
          </Button>
        </P>
      ))}
      <Dialog.Root
        onDismiss$={onDismiss$}
        showDialog$={showDialog$}
        extent={'content'}
      >
        <Dialog.Title>End employment?</Dialog.Title>
        <Dialog.Description>
          {candidate} leaves the staff and returns to the candidates.
        </Dialog.Description>
        <Dialog.Actions>
          <Button variant={'secondary'} onClick$={cancel$}>
            Cancel
          </Button>
          <Button onClick$={confirm$}>End employment</Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

export const TriggerRemovedOnConfirmation: Story = {
  render: () => <TriggerRemovedExample />,
};
