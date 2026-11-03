# #134 implementation

Added `Icon name="dot"`, a small filled circle in the existing 1em inline glyph box.
It uses currentColor for its fill, accepts the existing semantic color roles, and retains the
existing label/decorative and nonfocusable contracts. The six previous drawings remain outlined.
The public contract and Storybook document the requirement for a state name or second cue when
absence is the dot's other form; a standalone dot still requires a consumer-provided label.

Read #134 including its agent brief, the linked consumer issue juwel-dev/g-label-manager#232,
CONTEXT.md, the component/coding/architecture/testing standards, and ADR 0011.
The implementation follows the requested public Icon seam: tests import the package barrel.
The first new filled-dot test failed because the drawing did not exist, then passed after its addition.

## Verification

- `npm run build`: passed, including published declaration generation.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 57 files, 1,329 tests passed; Icon has 50 tests.
- `npm run build-storybook`: passed.
- Orca browser: UnreadDot play checks finished successfully, including first-line overlap and
  font-relative sizing; DotTones play checks finished in both light and dark themes.
- Browser measurements: the glyph box is 15px at the small role; the filled circle is 5.625px.
  Inherited muted and all five selectable tones resolve correctly; the circle has no outline.
- Visually inspected the dark tone examples. The new examples use Collection, Note and Stack
  through their existing public APIs, without consumer styling or missing component dependencies.
- Non-failing existing warnings: CSS optimizer placeholder `var(…)` utilities, jsdom document
  navigation, and Storybook chunk-size/missing MDX warnings.

## Remaining acceptance

Release publication is deliberately outstanding for the human push/release. No version was bumped,
release manufactured, branch pushed or merged, or issue closed/set Done. The separately dispatched
fresh reviewer owns code review. No other implementation acceptance criterion is outstanding.
