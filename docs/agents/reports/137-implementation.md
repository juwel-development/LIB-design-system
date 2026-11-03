# #137 implementation

Implemented `Switch`, exported from the package entry point, for one immediate binary setting.
Its closed surface is `label`, `checked$: Observable<boolean>`, `onChange$: Subject<boolean>`,
`disabled`, and `testId`. The consumer owns state: activation requests the opposite of the displayed
value, and only an input emission changes that value. A new input starts off until it emits.
Subscription replacement and unmount release the component's subscription without completing streams.

The native button carries switch semantics, a stable visible accessible name, `aria-checked`,
Space/Enter activation, and the shared focus ring. It never submits a surrounding form. Thumb
position distinguishes states without colour or movement animation. System colours preserve the
track, thumb and disabled treatment in forced-colour mode. Two positive geometry tokens are
published through all three generated token stylesheets; other styling uses existing semantic roles.

The contract is documented in component TSDoc, Storybook and CONTEXT.md. Storybook includes a working
inline filter beside quantities in Cluster, off/on, disabled off/on, an unanswered request, a long
German label and RTL. All components needed by these examples already exist; there is no missing
component dependency. Choices remains the choice among described alternatives; a submitted binary
selection belongs to a checkbox in a Form (guidance, not a new checkbox implementation).

## Verification

- Red/green public-entry-point DOM tests drove the initial contract, controlled requests and disabled
  behavior. Six component tests cover initial/external values, unanswered requests, feedback,
  replacement of both streams, teardown, native semantics, visible name and consumer e2e hook.
- A token test first failed for missing geometry, then passed for all three stylesheet entry points.
- `npm run build`, `npm run lint`, `npm run typecheck`, and `npm test` passed: 59 files, 1360 tests.
- `npm run build-storybook` passed.
- Real Chrome checks against built Storybook passed: Tab reaches the switch once, Space/Enter toggle,
  the next Tab reaches the adjacent action, disabled is skipped, text and switch share one line,
  long text stays within a 240px viewport, RTL uses logical positioning, and dark/forced-colour
  thumb and boundary remain distinct from the track. Keyboard focus computed to the shared 3px ring.
- Build emitted existing CSS placeholder warnings involving `var(…)`; full tests emitted jsdom's
  existing navigation warning. Both commands exited successfully.

## Outstanding

The separate review is complete (see [137-review.md](137-review.md)). Release publication remains an explicitly unmet
acceptance item, deferred to the human push/release; no version bump or publication was performed.
