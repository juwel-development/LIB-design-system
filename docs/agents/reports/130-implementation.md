# #130 implementation verification

Implemented `Button variant="link"`: the prose link ink and persistent underline on a native
button, inherited surrounding typography, zero inset/minimum width, native disabled behavior and
the existing shared focus-ring recipe. `Link` is unchanged. The public contract is documented in
Button TSDoc, Storybook and ADR 0006.

## Verification

- Red: the public `variant="link"` call and type assertion failed typecheck before implementation.
- Button tests: 111 passed, including public action emission, disabled suppression and closed props.
- Full suite: 54 files, 1,287 tests passed.
- Build, lint, typecheck and Storybook production build passed.
- Orca browser: `InlineAction` play assertions passed in light and dark themes (inherited face,
  size and line height; persistent underline; zero padding/minimum width; matching prose Link
  color, underline thickness and offset; disabled state).
- Orca browser: `NativeInlineActivation` play passed, with keyboard focus and one Subject emission
  each for Enter and Space.
- At a 240px viewport, no horizontal overflow: the long action label wrapped to two lines within
  the 208px paragraph, and shorter names remained in the text flow.
- Trusted-keyboard focus-ring appearance still needs manual verification: Storybook's simulated
  keyboard and Orca's WebKit key events did not trigger `:focus-visible`. The new variant uses
  Button's unchanged shared focus recipe; no replacement keyboard handler was introduced.

Non-failing tool output: generated CSS optimization warns about pre-existing `var(…)` placeholder
utilities; Storybook reports its existing missing MDX glob and bundle size warnings; the full suite
prints jsdom's navigation-not-implemented message.

## Outstanding

Release publication is explicitly deferred to the human push/release workflow: no version bump,
push or publication was performed. #128's letter role is absent in this worktree; ordinary Prose
examples are complete, but a letter-role integration example depends concretely on #128 landing.
The separate fresh reviewer owns code review and the In Review transition.
