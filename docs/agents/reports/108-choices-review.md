# Review: #108 Choices radio-choice rows (feature/ticket-108, 7ecfda6…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 7ecfda6...HEAD` (one commit, `a70cc3c`), with issue #108 as the spec source. Findings
were verified by hand against the code and the standards texts before any fix was applied.

## Standards axis

Hard findings (documented standards):

1. **Comment budget** (coding.md: blocks ≤ 4 lines) — the `choicesChoice` recipe block in
   `Choices.tsx` was 5 lines, and the `CHOICE_MARKER` block in `renderTokens.ts` was 5. →
   **Fixed**: both reduced to 4 while keeping the load-bearing facts (aria-checked-keyed paint,
   constant boundary thickness, `:root`-only placement, the > 0 and dot < size constraints).
   Comment-only change in `renderTokens.ts`; the rendered stylesheet is unchanged, so the
   `tokens*.css` pin holds without regeneration.

Everything else conforms: closed prop surface, one CVA recipe per painting member with descendant
spans styled by literal class strings (the Input precedent), `Subject`-based `onSelect$`, no
library text, one barrel line, `I<Namespace><Member>Props` naming, error class in its own file,
colocated spec/stories, behaviour-sentence tests querying by role, roving tabindex asserted via
attributes.

Baseline smells (judgement calls):

1. **Repeated switch shape** — `requestNeighbour`'s nested ternary mapping four arrow keys to a
   step (cyclomatic 10 per fallow) → **Fixed**: module-level `ARROW_STEP` lookup
   (`Record<string, 1 | -1>`, narrowed by `noUncheckedIndexedAccess`).
2. **Duplicated code vs Tabs** — `neighbourChoice` mirrors `neighbourTab`, differing in role
   strings. → **Left**: architecture.md forbids importing another component's internals and
   coding.md bans util buckets; a third roving-row component is the point at which the shared
   shape earns a home.
3. **Repeated controlled harness** in spec and both interactive stories → **Left deliberately**,
   the #107 disposition: each story's source documents the consumer wiring, and autodocs shows it
   per story.
4. **`data-choice-marker-dot`** as a test-only production attribute → **Kept**: the dot has no
   role or text, and its presence *is* the colour-independent selection cue under test.
5. **`mt-[0.3rem]` (rem) vs Checklist's `mt-[0.35em]`** optical seat → **Left**: judgement call
   both ways; the marker box is rem-sized, so a rem seat moves with the box, not the type.
   Dismissed advisory tool findings, per the #107 dispositions: css-token-drift on
   `size-[var(--choice-marker-*)]` (token-var utilities are the repo idiom), duplicate token
   blocks (generated files, pinned by `renderTokens.spec.ts`).
6. **`role={'radio'}` vs Tabs' `role="radio"`** — not actionable: the repo carries both styles
   (Meter, Collection, Brandmark brace theirs) and no standard or lint rule picks one.

## Spec axis

Verified correct by tracing code and tests: controlled value ownership (no self-selection, no
optimistic render, no fallback), click anywhere on a row including its text, exclusive
`aria-checked`, group and row ARIA naming and descriptions with collision-free ids, arrow-key
roving with wrap and selection-follows-focus, roving tabindex entering at the selected row, inert
blocking pointer and keyboard while keeping the marker and every description visible
(`disabled` plus an in-handler guard), wrapping via `min-w-0` at narrow widths, and the
`--choice-marker-*` tokens mirrored across `renderTokens.ts` and all three stylesheets. No scope
creep; no game text — stories use notification-cadence/report-depth copy with genuine long German
compounds.

Findings:

1. **Space/Enter activation untested** — arrows were tested but nothing proved the handler leaves
   the native activation keys alone. → **Fixed**: the leaves-other-keys test now asserts Space and
   Enter keydowns stay uncancelled (fireEvent returns `false` on `preventDefault`), which is the
   contract native keydown-to-click synthesis depends on. Clicking itself is covered by the click
   tests; jsdom does not synthesize the click, so the uncancelled event is the testable seam.
2. **Focus-*indication* untested** (only focus management is) → **No code change**: the only
   jsdom-visible assertion would be on the `focus-visible:outline` class string, which testing.md
   forbids ("Never assert on the class string… leave it to the story"). The a11y story surface
   carries it.
3. **"Documented examples of an active group, changed selection, and an inert group"** — the Spec
   sub-agent counted the examples as two stories; there are three (`Controlled`,
   `InertWithRetainedSelection`, `LongDescriptions`), with changed selection demonstrated live in
   `Controlled` (its comment names it "the changed-selection example in motion"). → **No change**.
4. **"Themed highlight" reading** — the highlight is the `controlBorder` → `foreground` boundary
   flip plus the marker dot, not a surface fill; the Tabs-marker treatment, documented in the
   recipe comment. Satisfies "not colour alone" (the dot is a shape cue). → **No change**; noted
   in case the consumer expected a filled highlight.
5. **Release AC** — "Publish a package release … and record the version on this request" is not
   done and is out of this review's scope: the branch sits after the 3.6.0 release commit,
   unreleased. Left to whoever lands the work.

## Outcome

Two hard standards findings and one spec test gap, all fixed in this commit; every other finding
verified as conforming, deliberately dispositioned, or out of scope. `npm run lint`,
`npm run typecheck`, and `npm run test` (773 tests, 43 files) are green after the fixes.
