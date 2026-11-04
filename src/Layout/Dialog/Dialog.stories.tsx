import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import { Header } from 'Layout/Header/Header';
import { Shell } from 'Layout/Shell/Shell';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Subject, type Subscription } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog.Root> = {
  title: 'Layout/Dialog',
  component: Dialog.Root,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Opt in with Shell modalScope="body" and a DOM-descendant Dialog.Root placement="frame". Both extents and the Scrim reserve the original bar, which stays visible but inert under native modality. Keep that DOM relationship while mounted; no portal, offset or consumer measurement is needed. Content extent remains 32rem. If fixed regions leave no useful Content space, the frame variant scrolls the whole task, including title and actions; this fallback does not guarantee no-scroll content fit. Dialog.Content defaults to scrollOwner="body". Use scrollOwner="child" for one bounded child, such as Table.Root bounded, which owns both scroll axes while title, description and actions stay fixed. Intermediate wrappers must preserve height allocation; fixed regions and a usable child viewport must fit the available space. See Display/Table → Bounded Dialog and Bounded Content Dialog for live compositions.',
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
    placement: {
      control: { type: 'radio' },
      options: ['viewport', 'frame'],
      description:
        'Frame requires an ancestor Shell modalScope="body"; omitted placement retains viewport behavior.',
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

const FrameExample: FunctionComponent<{
  extent?: 'screen' | 'content' | null;
  mode?: 'page' | 'console';
  german?: boolean;
  long?: boolean;
  placement?: 'frame' | 'viewport';
  farDown?: boolean;
  mountOpen?: boolean;
}> = ({
  extent,
  mode = 'page',
  german = false,
  long = false,
  placement = 'frame',
  farDown = false,
  mountOpen = false,
}) => {
  const [visible$] = useState(() => new Subject<boolean>());
  const [dismiss$] = useState(() => new Subject<void>());
  const [open$] = useState(() => new Subject<void>());
  const [cancel$] = useState(() => new Subject<void>());
  const [continue$] = useState(() => new Subject<void>());
  const [continued, setContinued] = useState(0);
  const [mounted, setMounted] = useState(true);
  useEffect(
    () =>
      unsubscribeAll([
        open$.subscribe(() => {
          setMounted(true);
          visible$.next(true);
        }),
        cancel$.subscribe(() => {
          setMounted(false);
          visible$.next(false);
        }),
        dismiss$.subscribe(() => setMounted(false)),
        continue$.subscribe(() => setContinued((value) => value + 1)),
      ]),
    [visible$, open$, cancel$, continue$, dismiss$],
  );
  return (
    <Shell
      mode={mode}
      modalScope="body"
      ariaLabel="Application"
      bar={
        <Header
          status={
            <span data-testid="readout">
              {german
                ? 'Mittwoch, 4. November 1950 · Kontostand 42.000,00 €'
                : 'Wednesday, 4 November 1950 · Balance €42,000.00'}
            </span>
          }
          action={<Button onClick$={continue$}>Continue {continued}</Button>}
        />
      }
    >
      <main>
        {farDown &&
          Array.from({ length: 60 }, (_, index) => `entry-${index + 1}`).map(
            (entry) => <P key={entry}>Earlier application content</P>,
          )}
        <Button onClick$={open$}>Open task</Button>
        <div>
          {(!mountOpen || mounted) && (
            <Dialog.Root
              placement={placement}
              extent={extent}
              onDismiss$={dismiss$}
              showDialog$={mountOpen ? undefined : visible$}
            >
              <Dialog.Title>
                {german
                  ? 'Auftrag für eine außergewöhnlich ausführliche Komposition bestätigen?'
                  : 'Review the proposed commission?'}
              </Dialog.Title>
              <Dialog.Description>
                {german
                  ? 'Alle Angaben bleiben vor der Bestätigung verfügbar.'
                  : 'All facts remain available before confirming.'}
              </Dialog.Description>
              <Dialog.Content>
                {Array.from(
                  { length: long ? 40 : 2 },
                  (_, index) => `fact-${index + 1}`,
                ).map((fact) => (
                  <P key={fact}>
                    {german
                      ? 'Die vollständigen Rechte und Zahlungsbedingungen bleiben erhalten.'
                      : 'The complete rights and payment terms remain available.'}
                  </P>
                ))}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onClick$={cancel$}>
                  {german ? 'Auftrag abbrechen' : 'Cancel task'}
                </Button>
                <Button onClick$={cancel$}>
                  {german ? 'Verbindlichen Auftrag bestätigen' : 'Confirm task'}
                </Button>
              </Dialog.Actions>
            </Dialog.Root>
          )}
        </div>
      </main>
    </Shell>
  );
};

const frameGeometry: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Open task' }));
  // Read immediately after opening, before any test focus can reveal clipped actions.
  const dialog = canvas.getByRole<HTMLDialogElement>('dialog');
  const surface = dialog.getBoundingClientRect();
  const bar = canvas.getByRole('banner').getBoundingClientRect();
  const readout = canvas.getByTestId('readout').getBoundingClientRect();
  const view = canvasElement.ownerDocument.defaultView;
  if (!view) throw new Error('Story requires a window');
  await expect(surface.top).toBeGreaterThanOrEqual(bar.bottom);
  await expect(surface.bottom).toBeLessThanOrEqual(view.innerHeight);
  await expect(readout.top).toBeGreaterThanOrEqual(0);
  await expect(readout.bottom).toBeLessThanOrEqual(bar.bottom);
  await expect(readout.right).toBeLessThanOrEqual(view.innerWidth);
  await expect(view.document.documentElement.scrollWidth).toBeLessThanOrEqual(
    view.innerWidth,
  );
  await expect(view.scrollY).toBe(0);
  await expect(dialog).toHaveAccessibleDescription(/available|verfügbar/);
  await expect(dialog.matches(':modal')).toBe(true);
  await expect(dialog.contains(view.document.activeElement)).toBe(true);
  const background = canvas.getByRole('button', { name: 'Continue 0' });
  background.focus();
  await expect(dialog.contains(view.document.activeElement)).toBe(true);
  if (dialog.scrollHeight > dialog.clientHeight + 1) {
    await expect(view.getComputedStyle(dialog).overflowY).toBe('auto');
  }
  await expect(
    Number.parseFloat(view.getComputedStyle(dialog, '::backdrop').top),
  ).toBeGreaterThanOrEqual(bar.bottom);
};

/** Both owners opt in. The original bar stays visible but native modality makes it inert.
 * Content remains 32rem; preserving the bar does not promise every task will fit without scrolling.
 * Ordinary wrappers may intervene; the dialog must remain a DOM descendant of the Shell.
 */
export const PersistentFrame: Story = {
  parameters: { layout: 'fullscreen' },
  args: { extent: 'screen' },
  render: (args) => <FrameExample extent={args.extent} />,
  play: frameGeometry,
};
export const PersistentFrameContent: Story = {
  ...PersistentFrame,
  args: { extent: 'content' },
};
export const PersistentFrameGermanConsole: Story = {
  ...PersistentFrame,
  render: (args) => <FrameExample extent={args.extent} mode="console" german />,
};
export const PersistentFrameLongTask: Story = {
  ...PersistentFrame,
  args: { extent: 'content' },
  render: (args) => <FrameExample extent={args.extent} german long />,
};
export const ViewportInFrame: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <FrameExample placement="viewport" />,
};

export const PersistentFrameFarDownOpener: Story = {
  ...PersistentFrame,
  render: () => <FrameExample farDown />,
};
export const PersistentFrameMountOpen: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <FrameExample mountOpen />,
};

export const PersistentFrameChangingBar: Story = {
  ...PersistentFrame,
  play: async (context) => {
    await frameGeometry(context);
    const canvas = within(context.canvasElement);
    const dialog = canvas.getByRole<HTMLDialogElement>('dialog');
    const readout = canvas.getByTestId('readout');
    const original = readout.textContent;
    const bar = canvas.getByRole('banner');
    const initialHeight = bar.getBoundingClientRect().height;
    const view = context.canvasElement.ownerDocument.defaultView;
    if (!view) throw new Error('Story requires a window');
    // Same-turn content change and opening must not rely on a later ResizeObserver delivery.
    dialog.close();
    await new Promise<void>((resolve) => view.setTimeout(resolve));
    readout.textContent = `${original} `.repeat(12);
    canvas.getByRole('button', { name: 'Open task' }).click();
    await expect(bar.getBoundingClientRect().height).toBeGreaterThan(
      initialHeight,
    );
    await expect(dialog.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      bar.getBoundingClientRect().bottom,
    );
    readout.textContent = original;
    await new Promise<void>((resolve) =>
      view.requestAnimationFrame(() =>
        view.requestAnimationFrame(() => resolve()),
      ),
    );
    await expect(bar.getBoundingClientRect().height).toBe(initialHeight);
    await expect(dialog.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      bar.getBoundingClientRect().bottom,
    );
    await expect(dialog.scrollTop).toBe(0);
  },
};
