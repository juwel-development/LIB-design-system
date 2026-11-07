import { Table } from 'Display/Table/Table';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import { Pane } from 'Layout/Pane/Pane';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Subject, type Subscription } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog.Root> = {
  title: 'Layout/Dialog',
  component: Dialog.Root,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dialog.Content defaults to scrollOwner="body". Use scrollOwner="child" for one bounded child, including Pane.Root → Pane.Body scrollOwner="child" → Table.Root bounded with a fixed Pane.Foot summary. While fixed regions plus a complete table row and focus room fit, only Table scrolls and its header stays visible. If they cannot fit, the entire task scrolls in Dialog, Table releases its scroller and pinned header, and the background stays locked. Growing the available space restores the bounds without remounting content. Intermediate consumer wrappers still need to preserve height allocation. Bounded Summary demonstrates the 33-row compact confirmation in English and German; Display/Table retains direct bounded Dialog examples.',
      },
    },
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
  const endRequestFor = useCallback(
    (person: string): Subject<void> => {
      const existing = endRequests.get(person);
      if (existing !== undefined) {
        return existing;
      }
      const created = new Subject<void>();
      endRequests.set(person, created);
      return created;
    },
    [endRequests],
  );
  useEffect(
    () =>
      unsubscribeAll([
        ...staff.map((person) =>
          endRequestFor(person).subscribe(() => {
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
    [
      showDialog$,
      onDismiss$,
      cancel$,
      confirm$,
      endRequestFor,
      staff,
      candidate,
    ],
  );
  return (
    <>
      <h2 id={'staff-heading'} tabIndex={-1}>
        Staff
      </h2>
      {staff.map((person) => (
        <P key={person}>
          {person}{' '}
          <Button variant={'secondary'} onClick$={endRequestFor(person)}>
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

const recordingTitles = [
  'Harbour recording 08',
  'The long road home across the harbour after midnight',
  'The long road home across the harbour after midnight',
  ...Array.from(
    { length: 30 },
    (_, index) => `Harbour recording ${index + 11}`,
  ),
].map((title, position) => ({ id: `recording-${position}`, title }));

const summaryCopy = {
  en: {
    title: 'Leave the withdrawn Medium?',
    description:
      '10-inch LP was withdrawn: once this Release leaves it, it cannot be picked again.',
    list: 'Affected recordings',
    column: 'Recording title',
    warning: '33 Recordings will be unplaced.',
    cancel: 'Cancel',
    confirm: 'Leave Medium',
  },
  de: {
    title: 'Zurückgezogenes Medium verlassen?',
    description:
      'Die 10-Zoll-LP wurde zurückgezogen: Sobald diese Veröffentlichung sie verlässt, kann sie nicht erneut ausgewählt werden.',
    list: 'Betroffene Aufnahmen',
    column: 'Titel der Aufnahme',
    warning: '33 Aufnahmen werden nicht mehr zugeordnet sein.',
    cancel: 'Abbrechen',
    confirm: 'Medium verlassen',
  },
} as const;

const BoundedSummaryExample = ({
  language = 'en',
  extent = 'content',
  initialCount = 33,
  placement,
}: {
  language?: 'en' | 'de';
  extent?: 'content' | 'screen';
  initialCount?: number;
  placement?: 'bottom';
}) => {
  const [locale, setLocale] = useState(language);
  const [count, setCount] = useState(initialCount);
  const [lifecycle, setLifecycle] = useState(() => ({
    shown$: new Subject<boolean>(),
    dismissed$: new Subject<void>(),
  }));
  const [actions] = useState(() => ({
    open$: new Subject<void>(),
    cancel$: new Subject<void>(),
    confirm$: new Subject<void>(),
    translate$: new Subject<void>(),
    filter$: new Subject<void>(),
    replace$: new Subject<void>(),
  }));
  const [outcome, setOutcome] = useState('No outcome');
  const copy = summaryCopy[locale];
  useEffect(
    () =>
      unsubscribeAll([
        actions.open$.subscribe(() => lifecycle.shown$.next(true)),
        lifecycle.dismissed$.subscribe(() => setOutcome('Dismissed')),
        actions.cancel$.subscribe(() => {
          setOutcome('Cancelled');
          lifecycle.shown$.next(false);
        }),
        actions.confirm$.subscribe(() => {
          setOutcome('Confirmed');
          lifecycle.shown$.next(false);
        }),
        actions.translate$.subscribe(() =>
          setLocale((value) => (value === 'en' ? 'de' : 'en')),
        ),
        actions.filter$.subscribe(() =>
          setCount((value) => (value === 33 ? 2 : value === 2 ? 0 : 33)),
        ),
        actions.replace$.subscribe(() =>
          setLifecycle({
            shown$: new Subject<boolean>(),
            dismissed$: new Subject<void>(),
          }),
        ),
      ]),
    [actions, lifecycle],
  );
  return (
    <>
      <Button onClick$={actions.open$}>Review recordings</Button>
      <Button onClick$={actions.translate$}>Translate summary</Button>
      <Button onClick$={actions.filter$}>Change recordings</Button>
      <Button onClick$={actions.replace$}>Fresh lifecycle</Button>
      <P>{outcome}</P>
      <Dialog.Root
        extent={extent}
        onDismiss$={lifecycle.dismissed$}
        showDialog$={lifecycle.shown$}
      >
        <Dialog.Title>{copy.title}</Dialog.Title>
        <Dialog.Description>{copy.description}</Dialog.Description>
        <Dialog.Content scrollOwner="child" testId="summary-content">
          <Pane.Root testId="summary-pane">
            <Pane.Body scrollOwner="child" ariaLabel={copy.list}>
              <Table.Root
                bounded
                density="compact"
                caption={copy.list}
                columns={[{ weight: 1 }]}
              >
                <Table.Head>
                  <Table.Row>
                    <Table.HeaderCell scope="col">
                      {copy.column}
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {recordingTitles.slice(0, count).map(({ id, title }) => (
                    <Table.Row key={id}>
                      <Table.Cell>
                        <P>{title}</P>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Pane.Body>
            <Pane.Foot placement={placement} testId="summary-foot">
              <P color="warning">
                {count === 33 ? copy.warning : `${count} recordings`}
              </P>
            </Pane.Foot>
          </Pane.Root>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="secondary" onClick$={actions.cancel$}>
            {copy.cancel}
          </Button>
          <Button variant="destructive" onClick$={actions.confirm$}>
            {copy.confirm}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

export const BoundedSummary: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Open Review recordings, then reduce the viewport height: the fixed summary follows the titles above the actions while Table alone scrolls at sufficient height; at insufficient height the whole Dialog scrolls. Translate summary and Change recordings are consumer state controls exercised by the browser regression while open. Fresh lifecycle replaces both Subjects and closes the current presentation. No application CSS or additional public props are needed.',
      },
    },
  },
  render: () => <BoundedSummaryExample />,
};
export const BoundedSummaryGerman: Story = {
  render: () => <BoundedSummaryExample language="de" />,
};
export const BoundedSummaryScreen: Story = {
  render: () => <BoundedSummaryExample extent="screen" />,
};
export const BoundedSummaryShort: Story = {
  render: () => <BoundedSummaryExample initialCount={2} />,
};
export const BoundedSummaryEmpty: Story = {
  render: () => <BoundedSummaryExample initialCount={0} />,
};

// Dialog keeps its fallback ownership: a bottom foot takes only spare height inside the pane. A
// content-extent dialog has none, so the foot still follows the body by the slot gap.
const checkSummaryFootAtBottom =
  (spare: boolean) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Review recordings' }),
    );
    const dialog = await canvas.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    const pane = canvas.getByTestId('summary-pane');
    const style = getComputedStyle(pane);
    const innerBottom =
      pane.getBoundingClientRect().bottom -
      Number.parseFloat(style.borderBottomWidth) -
      Number.parseFloat(style.paddingBottom);
    const foot = canvas.getByTestId('summary-foot').getBoundingClientRect();
    await expect(Math.abs(foot.bottom - innerBottom)).toBeLessThanOrEqual(1);
    const bodyToFoot =
      foot.top - (pane.firstElementChild?.getBoundingClientRect().bottom ?? 0);
    const slotGap = Number.parseFloat(style.rowGap);
    if (spare) await expect(bodyToFoot).toBeGreaterThan(slotGap + 1);
    else await expect(Math.abs(bodyToFoot - slotGap)).toBeLessThanOrEqual(1);
    const box = dialog.getBoundingClientRect();
    for (const name of ['Cancel', 'Leave Medium']) {
      const action = within(dialog)
        .getByRole('button', { name })
        .getBoundingClientRect();
      await expect(action.bottom).toBeLessThanOrEqual(box.bottom + 1);
    }
  };

/** Foot placement="bottom" in the bounded summary: Table alone scrolls, the summary stays fixed. */
export const BoundedSummaryFootAtBottom: Story = {
  render: () => <BoundedSummaryExample placement="bottom" />,
  play: checkSummaryFootAtBottom(false),
};
/** Short content keeps the content-extent dialog's natural height; there is no spare height. */
export const BoundedSummaryShortFootAtBottom: Story = {
  render: () => <BoundedSummaryExample initialCount={2} placement="bottom" />,
  play: checkSummaryFootAtBottom(false),
};
/** Screen extent with short content: the screen-tall dialog's spare height sits above the foot.
 *  At insufficient height the whole dialog scrolls and the foot follows the table again. */
export const BoundedSummaryScreenShortFootAtBottom: Story = {
  render: () => (
    <BoundedSummaryExample
      extent="screen"
      initialCount={2}
      placement="bottom"
    />
  ),
  play: checkSummaryFootAtBottom(true),
};

const ReplacementExample = () => {
  const [channels] = useState(() => ({
    first$: new Subject<boolean>(),
    second$: new Subject<boolean>(),
    dismissed$: new Subject<void>(),
    open$: new Subject<void>(),
    next$: new Subject<void>(),
    previous$: new Subject<void>(),
    close$: new Subject<void>(),
  }));
  useEffect(
    () =>
      unsubscribeAll([
        channels.open$.subscribe(() => channels.first$.next(true)),
        channels.next$.subscribe(() => {
          channels.first$.next(false);
          channels.second$.next(true);
        }),
        channels.previous$.subscribe(() => {
          channels.second$.next(false);
          channels.first$.next(true);
        }),
        channels.close$.subscribe(() => {
          channels.first$.next(false);
          channels.second$.next(false);
        }),
      ]),
    [channels],
  );
  return (
    <>
      <Button onClick$={channels.open$}>Start task</Button>
      <Dialog.Root
        extent="content"
        showDialog$={channels.first$}
        onDismiss$={channels.dismissed$}
      >
        <Dialog.Title>First task</Dialog.Title>
        <Dialog.Actions>
          <Button onClick$={channels.next$}>Continue to next task</Button>
          <Button onClick$={channels.close$}>Close task</Button>
        </Dialog.Actions>
      </Dialog.Root>
      <Dialog.Root
        extent="content"
        showDialog$={channels.second$}
        onDismiss$={channels.dismissed$}
      >
        <Dialog.Title>Second task</Dialog.Title>
        <Dialog.Actions>
          <Button onClick$={channels.previous$}>Return to first task</Button>
          <Button onClick$={channels.close$}>Close task</Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

export const Replacement: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Each transition closes the current Dialog before presenting its replacement in the same turn. The document stays locked across either direction and restores its previous overflow after the final task closes.',
      },
    },
  },
  render: () => <ReplacementExample />,
};
