import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

/** Which of the four states the page has put the form in. Owned by the page, never by Form: the
 *  component renders the state it is given and never decides which one it is in. */
export type FormState = 'idle' | 'sending' | 'sent' | 'failed';

// The one recipe, and it paints the note only (issue #6): `state` selects the note's tone - muted
// while the form stands, success on the outcome, error on the failure. Region selection is the
// NOTE_ROLE map below, not classes, so this axis never grows a layout job. Colours are semantic
// tokens re-pointed by `.dark`, so no variant carries a `dark:` class.
const form = cva('text-sm', {
  variants: {
    state: {
      idle: 'text-muted',
      sending: 'text-muted',
      sent: 'text-success',
      failed: 'text-error',
    },
  },
  defaultVariants: { state: 'idle' },
});

// The note's ARIA role: a settled outcome is a status region, a failure an alert; while the form
// still stands the note is plain prose and carries none.
const NOTE_ROLE: Partial<Record<FormState, 'status' | 'alert'>> = {
  sent: 'status',
  failed: 'alert',
};

interface IFormProps {
  /** Where the submission goes. Passed straight to the form element; Form makes no decision about it. */
  action: string;
  method?: 'get' | 'post';
  state?: FormState;
  /** The fields. */
  children?: ReactNode;
  /** The actions row - the consumer supplies its own submit Button. */
  actions?: ReactNode;
  /** Standing note in `idle`/`sending`; the outcome message in `sent`/`failed`. */
  note?: string;
  testId?: string;
}

/**
 * The container around a set of fields: fields, an actions row, a note. It renders a real `<form>`
 * carrying `action` and `method`, so a native submission works with no JavaScript, and it renders
 * the `state` it is given without ever owning a submission, a transport or validation timing - both
 * a server-rendered driver and a hydrated island express every state through the same props.
 *
 * `sent` drops the fields and actions so a completed submission cannot be resubmitted, while the
 * `<form>` itself is retained in every state so the DOM shape is stable across a runtime change.
 *
 * The note's text is always the consumer's; Form chooses only its element and ARIA role. `sent` is
 * the outcome message, so a `sent` with no `note` is a programmer error and throws.
 */
export const Form: FunctionComponent<IFormProps> = ({
  action,
  method = 'post',
  state = 'idle',
  children,
  actions,
  note,
  testId,
}) => {
  if (state === 'sent' && !note) {
    throw new Error(
      'Form in the `sent` state must be given a `note` - it is the outcome message.',
    );
  }

  const showFields = state !== 'sent';
  const noteRole = NOTE_ROLE[state];

  return (
    <form
      action={action}
      method={method}
      aria-busy={state === 'sending' || undefined}
      data-testid={testId}
      className={
        'flex max-w-[var(--measure)] flex-col gap-[var(--space-region)]'
      }
    >
      {showFields && (
        <div className={'flex flex-col gap-[var(--space-stack)]'}>
          {children}
        </div>
      )}
      {/* Not pinned against Stack (#75) as the two columns above are: the actions row runs along the
          other axis, which is Cluster's arrangement (#76) and not a stack with a different gap. */}
      {showFields && actions && (
        <div className={'flex flex-row gap-[var(--space-stack)]'}>
          {actions}
        </div>
      )}
      {note && (
        <p role={noteRole} className={form({ state })}>
          {note}
        </p>
      )}
    </form>
  );
};
