# Review: #107 compound Dialog (feature/ticket-107, 8b88ddc…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 8b88ddc...HEAD` (one commit, `7869330`), with issue #107, the full Agent Brief, consumer
spec juwel-dev/g-label-manager#103, and ADRs 0012–0014 as spec sources. Findings were verified by
hand and fixed in `85b27cc`; native modal behaviour was verified in a real Chrome against the
running Storybook.

## Standards axis

Hard findings (documented standards):

1. **Comment budget** (coding.md: blocks ≤ 4 lines) — the `dialogRoot` block was 7 lines, the
   `dialogTitle` block 5. → **Fixed**: both reduced to 4 while keeping the load-bearing facts
   (UA `dialog:not([open])` hiding, preflight margin/backdrop resets, emergency max-height).
2. **Multi-statement JSX ref callback** (coding.md: no logic inlined in a JSX attribute beyond a
   one-liner) — the `<dialog ref={…}>` callback held two statements. → **Fixed**: named
   `attachDialog` at component scope.
3. **`as Subject<void>` casts** (coding.md: `noUncheckedIndexedAccess` reads must be narrowed) —
   `Dialog.stories.tsx` cast `endRequests.get(person)` twice. → **Fixed**: lazy `endRequestFor`
   helper (`useCallback`) that narrows and creates on demand; the render-time seeding loop is gone.
4. **`getByTestId` as the spec's handle** (testing.md judgement call) — kept as is: a closed
   `<dialog>` is display-none and unreachable by role, and half the suite asserts on closed
   dialogs; one uniform helper beats per-test branching.

Baseline smells (judgement calls): `FOCUSABLE` renamed to `FOCUSABLE_SELECTOR`; the duplicated
`PresentationRefs` assembly collapsed into one `useState`-held stable bundle shared by handlers
and effect. The repeated Subject wiring across stories is left deliberately — each story's
source is documentation of the consumer contract, and autodocs shows it per story. Dismissed
advisory tool findings: css-token-drift (arbitrary `var(--…)` utilities are the repo-wide idiom),
duplicate token blocks (generated files, pinned by `renderTokens.spec.ts`).

## Spec axis

Verified correct by tracing code: the full `showDialog$` Subject contract (closed until first
emission, follows booleans without unmounting, replacement resets to closed, teardown, never
completes), dismissal order (`onDismiss$.next()` then `showDialog$.next(false)`, never `true`),
silent consumer-emitted `false`, native-close synchronization via the `presentedRef` guard, Scrim
coordinate check, naming XOR throwing `DialogNamingError`, members rejecting use outside Root,
`headingreset` + own `h1`, both extent CSS contracts, conditional never-doubled dividers,
end-aligned wrapping Actions, and all five theme tokens at the exact agreed values in
`renderTokens.ts` and all three generated stylesheets. No scope creep (no animation, polyfill,
alertdialog, or per-Dialog escape hatches).

Findings:

1. **Body captured as opener** — with nothing focused at open, `document.body` was captured and
   re-focused on close; the brief forbids focusing `body`. → **Fixed**: `openDialog` captures only
   a non-`body` `HTMLElement`; regression test added.
2. **Dangling ARIA idrefs** — `aria-describedby` was written unconditionally and
   `aria-labelledby` whenever `ariaLabel` was absent, pointing at nothing when the member was
   absent (an authoring error audit tooling flags). → **Fixed**: Title/Description register their
   presence through the Dialog contract; Root writes each reference only while the referenced
   element exists. Regression test added; verified in-browser that both idrefs resolve when
   present and are absent when not.
3. **"Connected and focusable" restore condition** — only `isConnected` is checked. → **No code
   change**: `focus()` on a connected-but-unfocusable opener is a platform no-op, which is exactly
   the contract's no-fallback outcome; the comment now records this.
4. **No dedicated Subject-controlled / mount-open story** — all five stories use `showDialog$`,
   so Subject control is represented implicitly; mount-open mode is covered by tests and TSDoc
   only. Accepted as-is; noted for a possible docs follow-up.
5. **Released-version recording** (issue AC) — inherently post-merge; open follow-up before #107
   is closed.

## Native-browser verification (Chrome, real `showModal()` against Storybook dev)

- **Modal presentation**: `dialog.matches(':modal')` true; scrim veils the page in both extents.
- **Initial focus**: opens with focus on the first focusable descendant (Cancel in the
  Cancel-first composition).
- **Keyboard containment**: Tab cycles Cancel → Confirm → browser chrome → back into the dialog;
  background content never receives focus.
- **Background blocking**: a click directly over the background trigger cannot activate it — it
  lands on the backdrop and is treated as a Scrim dismissal.
- **Escape**: emits dismissal ("Cancelled"), closes, restores focus to the opener.
- **Scrim vs surface**: a click on the dialog's own padding does not dismiss; a backdrop click does.
- **Trigger removed on confirmation**: cancel restores the row's trigger; confirm removes the row
  and the consumer's stable heading receives focus — the Dialog does not fight it.
- **Screen extent**: surface measured exactly viewport − 2·`--gutter` × viewport − 2·`--space-region`;
  header and Actions pinned while only Content scrolls; no horizontal page scroll.
- **Content extent**: fixed 32 rem; with over-tall content the surface caps at the viewport inset
  and only Content becomes scrollable (emergency fallback).
- **ARIA wiring after fix**: `aria-labelledby`/`aria-describedby` present and resolving with
  Title/Description, absent without them; titleless dialog names itself through `aria-label` alone.

## Checks

`biome check`, `tsc --noEmit`, `vitest run` (42 files, 745 tests), `vite build` + type emit, and
`storybook build` all pass after the fixes; the pre-commit hook re-ran lint, typecheck, and tests.

## Remaining limitations

- Release/version recording for the consumer (issue AC 9 / brief AC 10) happens after merge via
  semantic-release; not part of this branch.
- Focus-restore "focusable" condition relies on the platform no-op rather than an explicit check
  (documented in code); revisit only if a real consumer case surfaces.
- jsdom cannot represent modal containment; that gap is closed by the browser verification above,
  which is manual, not CI-repeatable.

## Follow-up: coordinator review dispositions

A second review pass (coordinator-owned Orca findings) was resolved on top of the above.

**Spec axis.**

- *Stale native close race* — confirmed critical and fixed. The platform queues the close event
  as a task, so `showDialog$.next(false)` immediately followed by `next(true)` (or replacing an
  open Subject and emitting `true` at once) let the stale event emit `false` into the new
  presentation, corrupt `presentedRef` and steal focus. The close fake now queues its event like
  the platform; two regression tests reproduce both shapes and failed against the unguarded code.
  The fix ignores a close event whose element is open again. A StrictMode mount-open test and the
  existing unmount-teardown and native-close-synchronization tests stay green, and the race was
  exercised in a real Chrome (same-task dismiss-and-reopen: the dialog stays open, modal, focused).
- *Restore only a connected, focusable opener* — fixed: the restore now also requires
  `matches(FOCUSABLE_SELECTOR)` or an explicit `tabindex`, with a covering test.
- *Optional description idref* — already fixed in `85b27cc` (presence registration).
- *Root native overflow* — confirmed and fixed: the UA sheet gives `dialog` `overflow: auto`, so
  the root itself could scroll. `overflow-hidden` now pins "only Content scrolls" at the root;
  verified in-browser (root `overflow-y: hidden`, not scrollable, Content still scrolls).
- *Missing name* stays caller responsibility per the documented contract; manual browser
  verification stands as documented — no validation or test infrastructure added.

**Standards axis** (validated against the repo's own rules).

- *CVA for Title/Description descendant paint* — rejected: design-system-components.md §4 says
  "exactly one `cva()` recipe per component", and static inner-element class strings are the
  repo-wide idiom (`Input.tsx:102`, `TextArea.tsx:93`); each Dialog member already owns its one
  recipe.
- *Named JSX ref callback* — already fixed in `85b27cc` (`attachDialog`).
- *Null boundary normalization* — confirmed and fixed: `openDialog`/`closeDialog` and the ref
  cell now speak `undefined` per coding.md § Absence; the React callback boundary normalizes the
  `null` React hands it.
- *Abbreviated names* — split: the `PresentationRefs` type is renamed `Presentation`; the
  `…Ref` variable suffix is kept as the established repo idiom (`controlRef`, `Input.tsx:84`)
  and React's own vocabulary (`useRef`/`RefObject`), not an abbreviation the standard targets.
- *Excessive prose comments* — largely fixed in `85b27cc`; this pass trimmed the one remaining
  over-budget block (renderTokens.ts radius comment, 5 lines → 4). Template-string comments that
  render into the generated stylesheets are shipped content pinned by `renderTokens.spec.ts`,
  and all sit within budget.
- *Role queries over `getByTestId`* — fixed where role can express the query: open dialogs are
  now reached with `getByRole('dialog')`; the testId helper remains only for closed dialogs,
  which are display-none and outside the accessibility tree, with the justification in the spec.

**Release decision.** The user requires a non-major release and accepts the required
`PaletteTokens.scrim` in the 3.x minor. Migration guidance was added to the `scrim` TSDoc (which
Storybook and editors surface) and README's palette section, and the docs commit carries a
consumer-facing `NOTE:` footer — no `BREAKING CHANGE` footer — so the changelog publishes the
migration without a major bump.
