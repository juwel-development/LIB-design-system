import { cva, type VariantProps } from 'class-variance-authority';
import {
  createContext,
  type FunctionComponent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { Subject } from 'rxjs';
import { DialogCompositionError } from './DialogCompositionError';
import { DialogNamingError } from './DialogNamingError';

// The layout classes ride the open: variant - a bare `flex` would defeat the UA's
// dialog:not([open]) hiding. Tailwind's preflight zeroes the UA's centering margins (m-auto
// restores them) and strips ::backdrop, so the Scrim colour and blur are declared here.
// overflow-hidden overrides the UA's `dialog { overflow: auto }` - only Content may scroll.
const dialogRoot = cva(
  [
    'open:flex open:flex-col m-auto p-0 overflow-hidden',
    'bg-surface text-foreground',
    'rounded-[var(--radius-dialog)] shadow-[var(--elevation-floating)]',
    'backdrop:bg-scrim backdrop:[backdrop-filter:blur(var(--scrim-blur))]',
  ].join(' '),
  {
    variants: {
      extent: {
        screen: [
          'w-[calc(100vw-2*var(--gutter))] max-w-none',
          'h-[calc(100dvh-2*var(--space-region))] max-h-none',
        ].join(' '),
        content: [
          'w-[32rem] max-w-[calc(100vw-2*var(--gutter))]',
          'max-h-[calc(100dvh-2*var(--space-region))]',
        ].join(' '),
      },
    },
    defaultVariants: { extent: 'screen' },
  },
);

// Title and Description form one header region: --space-region padding around it, --space-stack
// between the two. Each member carries its share of the padding on a wrapper at the dialog's
// inherited type size - never on the sized h1, whose em would inflate the inset. A Title
// followed by a Description hands the region's bottom padding to it.
const dialogTitle = cva(
  [
    'px-[var(--space-region)] pt-[var(--space-region)] pb-[var(--space-region)]',
    '[&:has(+[data-dialog-member=description])]:pb-0',
  ].join(' '),
);

const dialogDescription = cva(
  [
    'px-[var(--space-region)] pt-[var(--space-region)] pb-[var(--space-region)]',
    '[[data-dialog-member=title]+&]:mt-[var(--space-stack)] [[data-dialog-member=title]+&]:pt-0',
  ].join(' '),
);

// The one internally scrollable region: it grows into the screen extent's fixed height and
// shrinks when the emergency max-height binds, so the header and Actions stay fixed while only
// this scrolls. Its hairline exists only when a header region stands before it.
const dialogContent = cva(
  [
    'grow shrink min-h-0 overflow-y-auto',
    'px-[var(--space-region)] py-[var(--space-region)]',
    '[&:not(:first-child)]:border-t [&:not(:first-child)]:border-border',
  ].join(' '),
);

// An end-aligned row in consumer DOM order, wrapping on narrow screens without reversing. Its
// hairline exists only when Content stands directly before it - a header alone gets no divider.
const dialogActions = cva(
  [
    'flex flex-row flex-wrap items-center justify-end gap-[var(--space-stack)] shrink-0',
    'px-[var(--space-region)] pt-[var(--space-region)] pb-[var(--space-region)]',
    '[[data-dialog-member=content]+&]:border-t [[data-dialog-member=content]+&]:border-border',
  ].join(' '),
);

type NamePart = 'title' | 'description';

type DialogContract = {
  titleId: string;
  descriptionId: string;
  isLabelled: boolean;
  /** Title and Description announce themselves so Root writes `aria-labelledby` and
   *  `aria-describedby` only when the referenced element exists - an unresolved idref is an ARIA
   *  authoring error - because Root cannot inspect arbitrary children or fragments. */
  registerNamePart: (part: NamePart) => () => void;
};

const DialogContext = createContext<DialogContract | undefined>(undefined);

const useDialogContract = (member: string): DialogContract => {
  const contract = useContext(DialogContext);
  if (contract === undefined) {
    throw new DialogCompositionError(member);
  }
  return contract;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Presentation = {
  presented: RefObject<boolean>;
  opener: RefObject<HTMLElement | undefined>;
};

// Module-scope so the effect below can depend on the Subject instance alone: these reach only the
// refs handed to them, never a render's closure. Opening captures the focused opener and moves
// focus to the first focusable descendant - Cancel-first compositions therefore focus Cancel.
const openDialog = (
  dialog: HTMLDialogElement | undefined,
  { presented, opener }: Presentation,
): void => {
  if (dialog === undefined || dialog.open) {
    return;
  }
  // With nothing focused the browser reports `body` as active; capturing it would make closing
  // focus `body`, which the contract forbids - so only a real opener is worth restoring.
  const active = document.activeElement;
  opener.current =
    active instanceof HTMLElement && active !== document.body
      ? active
      : undefined;
  dialog.showModal();
  presented.current = true;
  dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
};

const closeDialog = (
  dialog: HTMLDialogElement | undefined,
  { presented }: Presentation,
): void => {
  presented.current = false;
  if (dialog?.open) {
    dialog.close();
  }
};

export interface IDialogRootProps extends VariantProps<typeof dialogRoot> {
  /** The composed regions, in the supported order: Title, Description, Content, Actions. */
  children: ReactNode;
  /** Emits on every dismissal - Escape and the Scrim. A consumer's own Cancel control emits its
   *  outcome itself; opening never emits, and neither does a consumer-emitted `false`. */
  onDismiss$: Subject<void>;
  /** Bidirectional visibility (docs/adr/0014): consumer booleans drive presentation without
   *  unmounting children, the Dialog emits only `false` after a dismissal, and a replaced Subject
   *  resets the Dialog to closed. Absent, the Dialog opens on mount and stays until unmounted. */
  showDialog$?: Subject<boolean>;
  /** Names an intentionally titleless Dialog. Exactly one naming source: never together with a
   *  visible `Dialog.Title`. */
  ariaLabel?: string;
  testId?: string;
}

export interface IDialogTitleProps {
  /** The Dialog's visible name. Text only; the consuming app words and translates it. */
  children: string;
  testId?: string;
}

export interface IDialogDescriptionProps {
  /** One concise line of phrasing content; block structure belongs in `Dialog.Content`. */
  children: ReactNode;
  testId?: string;
}

export interface IDialogContentProps {
  /** Arbitrary task content, composed and owned by the consumer. */
  children: ReactNode;
  testId?: string;
}

export interface IDialogActionsProps {
  /** Consumer-owned controls in consumer order; at least one explicit dismissal control. */
  children: ReactNode;
  testId?: string;
}

const DialogRoot: FunctionComponent<IDialogRootProps> = ({
  children,
  onDismiss$,
  showDialog$,
  extent,
  ariaLabel,
  testId,
}) => {
  const baseId = useId();
  const dialogRef = useRef<HTMLDialogElement | undefined>(undefined);
  // What the component believes about its own presentation. The close handler reads it to tell a
  // platform-initiated close (form method="dialog") - which must synchronize the Subject - from a
  // close the component performed itself, which must not re-emit.
  const presentedRef = useRef(false);
  const openerRef = useRef<HTMLElement | undefined>(undefined);
  // One stable bundle: the module-scope open/close reach only these refs, never a render closure.
  const [presentation] = useState<Presentation>(() => ({
    presented: presentedRef,
    opener: openerRef,
  }));
  const [nameParts, setNameParts] = useState({
    title: false,
    description: false,
  });
  const registerNamePart = useCallback((part: NamePart) => {
    setNameParts((current) => ({ ...current, [part]: true }));
    return () => setNameParts((current) => ({ ...current, [part]: false }));
  }, []);
  const contract: DialogContract = {
    titleId: `${baseId}title`,
    descriptionId: `${baseId}description`,
    isLabelled: ariaLabel !== undefined,
    registerNamePart,
  };

  // Escape and the Scrim: the dismissal notification first, then the visibility transition the
  // contract owns (docs/adr/0014). Without a Subject the notification is the consumer's signal to
  // unmount, and the presentation still ends deterministically.
  const dismiss = (): void => {
    onDismiss$.next();
    if (showDialog$ === undefined) {
      closeDialog(dialogRef.current, presentation);
    } else {
      showDialog$.next(false);
    }
  };

  // A backdrop click targets the dialog element itself, but so does a click on the surface's own
  // padding - only coordinates outside the box are the Scrim. Keyboard-synthesized clicks target
  // the operated control, so they never reach the target check.
  const dismissFromScrim = (event: MouseEvent<HTMLDialogElement>): void => {
    const dialog = dialogRef.current;
    if (dialog === undefined || event.target !== dialog || !dialog.open) {
      return;
    }
    const box = dialog.getBoundingClientRect();
    const onSurface =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (!onSurface) {
      dismiss();
    }
  };

  const synchronizeClose = (): void => {
    // The platform queues the close event as a task, so it can arrive after a new presentation
    // has already begun - a rapid false-then-true, or a replaced Subject emitting true at once.
    // An element that is open again marks the event stale: acting on it would emit `false` into
    // the new presentation, corrupt the state and steal its focus.
    if (dialogRef.current?.open) {
      return;
    }
    const wasPresented = presentedRef.current;
    presentedRef.current = false;
    const opener = openerRef.current;
    openerRef.current = undefined;
    // Restore only a still-connected, still-focusable opener; no body fallback and no invented
    // destination - a consumer whose confirmation removed the opener focuses its own target.
    if (
      opener?.isConnected &&
      (opener.matches(FOCUSABLE_SELECTOR) || opener.hasAttribute('tabindex'))
    ) {
      opener.focus();
    }
    if (wasPresented) {
      showDialog$?.next(false);
    }
  };

  // The one effect: mount-open when no Subject is supplied, otherwise observe the current Subject
  // instance. Replacing the instance tears the old subscription down and resets to closed
  // (docs/adr/0013 - the component owns teardown, the consumer owns the stream).
  useEffect(() => {
    if (showDialog$ === undefined) {
      openDialog(dialogRef.current, presentation);
      return () => closeDialog(dialogRef.current, presentation);
    }
    const subscription = showDialog$.subscribe((visible) => {
      if (visible) {
        openDialog(dialogRef.current, presentation);
      } else {
        closeDialog(dialogRef.current, presentation);
      }
    });
    return () => {
      subscription.unsubscribe();
      closeDialog(dialogRef.current, presentation);
    };
  }, [showDialog$, presentation]);

  // headingreset is set through the ref because React's DOM typings do not know the attribute
  // yet; it marks the h1 as the top heading of an independent task (docs/adr/0005). React hands
  // the callback `null` on detach; the boundary normalizes that to the standard's `undefined`.
  const attachDialog = (node: HTMLDialogElement | null): void => {
    dialogRef.current = node ?? undefined;
    node?.setAttribute('headingreset', '');
  };

  return (
    <DialogContext.Provider value={contract}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the Scrim is pointer-only by nature; the keyboard dismissal is Escape, which the platform reports as the cancel event handled by onCancel */}
      <dialog
        ref={attachDialog}
        className={dialogRoot({ extent })}
        aria-label={ariaLabel}
        aria-labelledby={
          ariaLabel === undefined && nameParts.title
            ? contract.titleId
            : undefined
        }
        aria-describedby={
          nameParts.description ? contract.descriptionId : undefined
        }
        onCancel={dismiss}
        onClick={dismissFromScrim}
        onClose={synchronizeClose}
        data-testid={testId}
      >
        {children}
      </dialog>
    </DialogContext.Provider>
  );
};

const DialogTitle: FunctionComponent<IDialogTitleProps> = ({
  children,
  testId,
}) => {
  const { titleId, isLabelled, registerNamePart } = useDialogContract('Title');
  useEffect(() => registerNamePart('title'), [registerNamePart]);
  if (isLabelled) {
    throw new DialogNamingError();
  }
  return (
    <div
      data-dialog-member={'title'}
      className={dialogTitle()}
      data-testid={testId}
    >
      {/* The independent Dialog h1 at its own type role - not the page's display role, and not a
          generic heading primitive (docs/adr/0004 and 0005, Amendments). */}
      <h1
        id={titleId}
        className={
          'font-primary text-dialog-title leading-dialog-title text-foreground'
        }
      >
        {children}
      </h1>
    </div>
  );
};

const DialogDescription: FunctionComponent<IDialogDescriptionProps> = ({
  children,
  testId,
}) => {
  const { descriptionId, registerNamePart } = useDialogContract('Description');
  useEffect(() => registerNamePart('description'), [registerNamePart]);
  return (
    <div
      data-dialog-member={'description'}
      className={dialogDescription()}
      data-testid={testId}
    >
      <p
        id={descriptionId}
        className={'font-primary text-body leading-body text-foreground'}
      >
        {children}
      </p>
    </div>
  );
};

const DialogContent: FunctionComponent<IDialogContentProps> = ({
  children,
  testId,
}) => {
  useDialogContract('Content');
  return (
    <div
      data-dialog-member={'content'}
      className={dialogContent()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

const DialogActions: FunctionComponent<IDialogActionsProps> = ({
  children,
  testId,
}) => {
  useDialogContract('Actions');
  return (
    <div
      data-dialog-member={'actions'}
      className={dialogActions()}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

/**
 * A temporary, always-named modal surface interrupting the page with one focused task, built on
 * the platform `<dialog>` and `showModal()`: the browser owns the top layer, background inertness
 * and the modal keyboard boundary; the consumer owns all wording, controls, outcomes and
 * replacement. Composed from five members: `Root` carries the contract, `Title` the visible name,
 * `Description` one connected line, `Content` the only scrollable region, `Actions` the controls.
 *
 * @Guarantees — enforced on every render
 * - Presents through `showModal()`/`close()` - no portal, focus trap or polyfill - so background
 *   content is unavailable and keyboard focus is contained by the platform contract.
 * - Names itself through exactly one source: a visible `Title` wired by `aria-labelledby`, or
 *   Root's `ariaLabel`; both at once throw. `Description` is wired by `aria-describedby` on its
 *   own, and arbitrary `Content` is never promoted to the accessible description.
 * - The `h1` in `Title` is the top heading of the Dialog's independent task - Root carries
 *   `headingreset` - at the `--text-dialog-title` role, independent of the page ladder.
 * - Without `showDialog$` it opens on mount and stays until unmounted. With it, it starts closed
 *   until the first emission, follows every boolean without unmounting children, and resets to
 *   closed when the Subject instance is replaced. It owns teardown of its subscription, emits only
 *   `false`, and never completes, validates or error-handles the consumer's stream.
 * - Escape and a Scrim interaction are dismissals: `onDismiss$.next()` first, then
 *   `showDialog$.next(false)` where that Subject exists. A consumer-emitted `false` hides without
 *   a dismissal; any other native close synchronizes the Subject to `false` and invents no outcome.
 * - On opening it captures the opener and moves focus to the first focusable descendant; when the
 *   presentation ends it restores focus to the opener only while that opener is still connected
 *   and focusable - no body fallback, no invented destination.
 * - `extent="screen"` (the default) fills the viewport minus the `--gutter` inline and
 *   `--space-region` block insets, header and Actions fixed, only `Content` scrolling.
 *   `extent="content"` holds a fixed 32rem capped to the viewport with content-driven height;
 *   `Content` scrolls only as the emergency fallback when fitting is physically impossible.
 * - Regions take `--space-region` padding with `--space-stack` between Title and Description and
 *   between Actions controls; hairlines separate header from `Content` and `Content` from
 *   `Actions` only where both neighbours exist. The surface reads `--radius-dialog`,
 *   `--elevation-floating`, `surface`/`foreground`/`border`, and the Scrim reads `--color-scrim`
 *   with the theme's optional `--scrim-blur`.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Direct children in the order `Title`, `Description`, `Content`, `Actions`, at most one of
 *   each; `Actions` is present and holds at least one explicit dismissal control, wired to the
 *   same dismissal and visibility transitions. Cancel-before-Confirm order puts initial focus on
 *   the least destructive action.
 * - Exactly one naming source is supplied - a `Title`, or `ariaLabel` for a deliberately
 *   titleless Dialog. Neither is optional together.
 * - When completing the task removes the opener, the consumer moves focus to its own stable
 *   destination after hiding the Dialog.
 * - One Dialog stands at a time: dismiss or unmount the current one before presenting another.
 * - Routine workflows that need modal scrolling belong on a page, not in `extent="content"`.
 *
 * @UXGuidelines
 * - Confirmation is explicit and consumer-owned: opening performs no action, dismissal reports
 *   cancellation and never confirmation, and the library ships no confirm/cancel controls.
 * - A warning confirmation composes its wording through the existing warning status tone and
 *   stays understandable without colour; Dialog has no warning state, `alertdialog` mode or
 *   action-disabling policy, and warning content may sit beside an enabled confirmation.
 * - All visible wording enters through the composition; the consuming app words and translates it.
 */
export const Dialog = {
  Root: DialogRoot,
  Title: DialogTitle,
  Description: DialogDescription,
  Content: DialogContent,
  Actions: DialogActions,
} as const;
