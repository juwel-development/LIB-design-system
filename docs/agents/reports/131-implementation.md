# Ticket #131 implementation

Implemented a public `Callout` with warning (default), info, success and error leading-edge bars,
optional accessible group naming, and consumer-owned content and arrangement. No four-sided box,
fill, tab stop, keyboard handler or live announcement is added. Status meaning must appear in text
or a named Icon; this is documented in the component contract and Storybook. Box stays unchanged.

The new theme roles `--callout-mark-width` and `--space-callout-inset` are declared in all three
generated token stylesheets. The first must be positive and the second nonnegative. The existing
status colours supply the bar, which uses CanvasText in forced colours. The public barrel exports
the component, and CONTEXT and ADR 0011 record its role and rationale.

Verification:

- TDD: named-group test failed before implementation; unnamed/empty naming tests then failed before
  the passive branch was added; token tests failed before the new roles were declared.
- Public DOM tests cover naming, passive semantics across all four tones, content/control order,
  focus, action emission, disabled controls and a consumer-named Icon.
- `npm run build`, `npm run lint`, `npm run typecheck`, and `npm test` pass: 56 files, 1,304 tests.
- `npm run build-storybook` passes; stories cover all tones in light/dark, an interactive Response
  composition with primary/outlined answers, a named Icon, narrow holder, RTL and theme overrides.
- Orca browser: light warning is rgb(180,83,9), dark warning rgb(251,191,36); the transparent block
  has a 4px leading border and zero other borders. RTL moves it to the right. Token overrides
  produce an 8px mark and 32px inset. Narrow story has equal client/scroll widths of 252px.
- Browser keyboard: Enter on Accept records Accepted; Tab reaches Decline; Space records Declined.
- Built CSS includes the forced-colours CanvasText rule. Orca's media emulation command returned
  success but matchMedia remained false, so actual forced-colours rendering was not browser-verified.
- Build emits existing CSS placeholder warnings for `var(…)`; tests emit the existing jsdom
  navigation diagnostic. Neither fails its command.

Sources: complete #131 and its comments, consumer #233 and comments, linked #203 and #157, CONTEXT,
the four repository standards, implementation/TDD skills and relevant ADRs. Required example
components are present; there is no missing dependency or silently omitted integration example.

Outstanding: release publication is explicitly deferred to the human push/release. No version bump,
publish, push, merge, issue closure or Done transition was performed. A fresh reviewer owns code
review; actual OS forced-colours inspection remains a validation limitation.
