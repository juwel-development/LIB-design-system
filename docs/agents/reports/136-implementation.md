# #136 — opt-in Table selected surface

Implemented `Table.Root selectionTreatment="highlight"`; omission and `marker` retain the
3.11.0 treatment. Highlight reads the new optional `PaletteTokens.selectedSurface` role,
declared in all three generated stylesheets. The existing selection marker, focus outline,
ARIA state and stream ownership remain unchanged. Child combinators prevent an outer
Table's treatment from selecting rows in a nested Table.

The public contract and Storybook document the surface contrast constraints. Palette tests
measure foreground, muted and link at 4.5:1, and focusRing at 3:1, against both shipped
selected surfaces (foreground also supplies the marker). Other consumer-composed inks,
including status tones, require contrast checks against this surface as documented; the
component does not recolour arbitrary descendants.

Verification:

- Test-first failures for the missing palette role and public root treatment, then passing
  targeted tests and typecheck.
- Full suite: 57 files, 1,338 tests passed.
- Build, lint, typecheck, generated-token parity and Storybook build passed.
- Orca browser ran the HighlightedSelection play function in light mode and
  HighlightedCompactAllocation in dark mode, without console errors. Computed selected
  backgrounds were rgb(248, 250, 252) and rgb(23, 32, 51), respectively; other rows were
  transparent. The selected marker remained 2px. Play assertions cover hover persistence,
  keyboard activation, focus retention and moving the highlight.
- Forced-colour visibility retains the existing border marker; forced-colour emulation was
  not run. No new forced-colour overrides or background-dependent cue were introduced.
- Builds report existing Tailwind placeholder `var(…)` CSS warnings; they succeed.

No missing component dependency was needed for these examples. The full consumer Message
screen and its unrelated upstream tickets are outside #136. The separate fresh reviewer
owns code review. Release publication remains an outstanding acceptance criterion, explicitly
deferred to the human push/release; no version bump or release was made. No GitHub writes
were made, per the dispatch instruction against posting there.
