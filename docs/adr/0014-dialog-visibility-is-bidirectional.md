---
status: accepted
---

# Dialog visibility is a bidirectional state channel

When supplied, `showDialog$` is a consumer-owned `Subject<boolean>` that Dialog both observes and
updates: consumer emissions determine visibility, while Dialog emits only `false` when Escape or a
Scrim interaction dismisses it. Dialog owns its subscription teardown but never emits `true`,
completes the Subject or defines completion and error behavior. A one-way Observable plus a separate
dismissal command was rejected because the consumer would have to bridge the component's ordinary
close transition back into the same reactive state that already represents visibility.

Dismissal remains a distinct semantic event. Dialog first calls the required `onDismiss$.next()` and
then, when the visibility Subject exists, `showDialog$.next(false)`. A consumer-emitted `false` hides
the Dialog without producing a dismissal event. Without `showDialog$`, the notification is the
consumer's signal to unmount the otherwise mount-open Dialog.
