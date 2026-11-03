# Ticket 136 review and verification

Fixed merge-base: `335901ae50a0e193bbe09a6836a2531ae8e6e6d3` (main).
Reviewed implementation commit: `447fc33`.
Sources: full library #136 issue and comments; consumer g-label-manager #232 and comments;
CONTEXT.md and all four docs/agents/standards documents. Two parallel Codex reviewers
performed the Standards and Spec axes of `.claude/skills/code-review/SKILL.md`.

## Standards

Three findings, all fixed:

- Variant-name data-attribute assertions violated testing.md's observable-behaviour rule;
  removed those assertions while retaining public interaction and browser paint checks.
- A second Table describe violated the one-describe-per-component rule; consolidated it.
- New story queries used test IDs where accessible row names existed; changed to row roles.

No material baseline smell reported. Fallow review ran against the fixed merge-base;
its broad existing complexity/duplication and token-utility advisories did not identify a
further confirmed regression in this change.

## Spec

Two findings, both fixed with regression-first palette checks:

- Light error text on selectedSurface measured 4.302:1, below 4.5:1.
- The dark table rule on selectedSurface measured 2.958:1, below 3:1.

The dark selected surface is now #151e30. Light's existing error ink only just clears
4.5:1 on pure white, leaving no useful darker selected surface compatible with that ink.
The new optional semantic selectedError role therefore supplies the error ink/fill on
highlighted rows only, leaving the ordinary palette unchanged. Tests now cover all four
status inks, ordinary text, marker, rule, focus and selectedError/errorForeground contrast.
A status-text story demonstrates and checks the resolved error colour in either scheme.
The Spec reviewer rechecked the fixes and reported no remaining confirmed defect.

## Evidence and remaining acceptance

- Build, lint, typecheck, all 57 test files / 1,338 tests, token parity and Storybook build pass.
- New contrast regression tests failed for both original defects before the fixes and pass now.
- Orca browser ran the revised compact-allocation play in dark mode: selection moved to
  Kestrel and the selected background resolved to rgb(21, 30, 48).
- Status-text browser check resolves light ink to rgb(205, 45, 125), selected surface to
  rgb(248, 250, 252), and retains the 2px marker. Story play checks the shipped ink in both schemes.
- Existing Tailwind placeholder CSS warnings and Storybook chunk-size warnings are nonfatal.
- Forced-colour emulation command returned success, but matchMedia remained false: it did
  not activate. The retained border marker is the forced-colour mechanism; actual forced-colour
  browser verification remains a limitation, not a claimed pass.
- No missing component dependency for these examples. Consumer #232's other upstream needs
  are outside this ticket.
- Publication is outstanding and explicitly deferred to human push/release. No version bump,
  publication, push, merge, issue closure or Done transition occurred. GitHub status writing
  was skipped under the dispatch instruction against posting to GitHub.

Summary: Standards 3 findings fixed (test contracts); Spec 2 findings fixed (contrast).
