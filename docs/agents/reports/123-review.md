# #123 review: DefinitionList density and container-aware allocation

Date: 2026-10-03. Two-axis review (`.claude/skills/code-review/SKILL.md`) of `feature/ticket-123`
by an Orca worker (Claude), run twice: first against the branch as dispatched, at its fixed
merge-base with `main`, `3739997`; then against the corrected branch at its new merge-base,
`e92bf3e`, after `main` was merged in. The spec is issue #123 with the maintainer-approved Agent
Brief in its triage comment, which supersedes the issue body; the same brief is committed on `main`
as `docs/agents/reports/123-agent-brief.md` (`de7fd2a`), beside the maintainer's ADR 0008 amendment
and glossary entry. Standards sources: `docs/agents/standards/{coding,architecture,testing,
design-system-components}.md`, `CONTEXT.md`, ADR 0004, ADR 0005 and ADR 0008. Each pass ran both
axes as fresh parallel sub-agents over the three-dot diff; `npm run fallow:agent` reported only the
export change, inherited styling advisories and the pre-existing unexported props interfaces.
Confirmed findings were fixed on the branch and are recorded with the commit that fixed them.
Nothing was pushed, merged, published or closed; the issue's board status was not touched.

## Reviewed state

| Commit | Subject |
| --- | --- |
| `606aca3` (first pass, superseded) | feat(definition-list): add compact density with container-aware columns (#123) |
| `d9c005b` (first pass, superseded) | docs(definition-list): record the #123 implementation evidence |
| `c47535a` | Merge branch 'main' into feature/ticket-123 |
| `f312f0a` | feat(definition-list): allocate the columns per list and fit them to the container (#123) |
| `4726e82` | fix(definition-list): apply the #123 review's standards and spec findings |

The dispatched branch had been built from the issue body alone: its implementation report stated
the issue "carries no comments and no agent brief". The brief existed (triage comment at 04:59Z)
and had reached `main` with the maintainer's ADR amendment before this review began. The
coordinator relayed the maintainer's instruction that the brief is authoritative: per-list density
**and** consumer-chosen weights with theme-token minimums, container-fit stacking at **both**
densities, #120's family roles preserved, and component docs in Storybook rather than the README.
That made the first pass's Spec findings a rework rather than a patch; `main` was merged first so
the rework built on `ColumnLayout`, #120 and the docs convention. The comfortable default's column
behaviour changes as a result, which the brief calls intentional and the `NOTE:` footer on
`f312f0a` publishes.

## Standards

Reported by the Standards sub-agents, lightly cleaned. `[hard]` = documented-standard breach;
`[judgement]` = baseline smell or call. Pass 1 is the dispatched branch; pass 2 the corrected one.

### Pass 1 (`3739997...d9c005b`)

1. **[hard] Class-string assertions, `DefinitionList.spec.tsx`** - testing.md "Never assert on the
   class string": 47 lines of `toHaveClass('font-secondary')`, `@sm:grid-cols-…`, padding
   utilities. *Superseded by the rework; the new spec keeps token-reference assertions only (see
   pass 2).*
2. **[hard] Comment budget, `renderTokens.ts`** - the token block was 5 lines and restated ADR
   0008. *Fixed in `f312f0a` (4 lines, cites the ADR).*
3. **[hard] Default outside `defaultVariants`** - `density ?? 'comfortable'` beside four
   `defaultVariants` and a context default; *Duplicated Code*. *Gone in `f312f0a`: one recipe
   default, no context.*
4. **[hard] Fixture without overrides** - `renderSpecList(undefined, undefined, 'compact')` nine
   times; *Data Clumps*. *Fixed in `f312f0a`: an overrides object.*
5. **[judgement] `useContext` inside a JSX attribute** - no precedent. *Gone: density is applied by
   the Root recipe's `[&>div]` selector, as the standard's compound-component rule allows.*
6. **[hard] Docs accuracy, ADR 0008** - the branch's amendment said "the maintainer's specification
   accepted" a typography re-seat and a viewport-keyed comfortable, which the maintainer's own
   amendment (`de7fd2a`) contradicts. *Fixed in `f312f0a`/`4726e82`: the maintainer's paragraph
   stands verbatim, what shipped follows under its own heading.*
7. **[judgement] Repeated Switches + a `data-density` nobody read; `cva('')` with an empty base;
   `density: … | null` enshrined in a test title; README section against `main`'s Storybook
   convention; a raw `#94a3b8` in a story.** *All gone in `f312f0a`.*

### Pass 2 (`e92bf3e...4726e82`, reviewed at `f312f0a` plus the uncommitted evidence report)

1. **[hard] Utility-class pins in the spec** - `toHaveClass('@container')`, `'grid'`,
   `'wrap-break-word'`, and a trailing-`]` trick to assert a token's absence. *Fixed in `4726e82`:
   the pins are removed, absence is a word-boundary regex. Kept, as accepted deviations:
   token-reference assertions (`var(--space-definition-item)`, `--definition-threshold`,
   `gap-[var(--space-stack)]`), which follow the ColumnLayout precedent of asserting the custom
   property the stylesheet keys on, and the whole-`className` equality between densities, which
   asserts that nothing but the air changes rather than pinning a recipe; geometry is in the
   stories.*
2. **[hard] Fallback claim false** - the TSDoc and Storybook description said a browser without
   style queries "keeps the list stacked"; above the threshold the `dd` sat in the term track,
   squeezed. *Fixed in `4726e82`: the `dd` spans both tracks unless the query pins it, verified in
   Chrome with the pin forced off (description 464px wide below its terms); the docs now say the
   terms keep the term column's width.*
3. **[judgement] Naming** - `term`/`value` locals shadowing the `term` recipe, `checkColumn`,
   `Column` beside `ColumnLayout.Column`, `--definition-fit` reading inverted. *Fixed in `4726e82`:
   `termAllocation`/`descriptionAllocation`, `validateColumn`, `ColumnAllocation`,
   `--definition-shortfall`.*
4. **[judgement] `type ColumnAllocation` file-local but public through `termColumn`** - coding.md's
   exception names shapes the barrel exports. *Left local: a consumer derives it with
   `ComponentProps<typeof DefinitionList.Root>['termColumn']`, as the spec does, and the barrel
   carries components only; recorded here.*
5. **[judgement] Props interfaces unexported** (pre-existing, flagged in pass 1 too) -
   design-system-components.md "exported from the component's own module". *Fixed in `4726e82`.*
6. **[judgement] Duplicated Code across components** - `MinWidthToken`, `TOKEN_NAME`, the typed
   style object and the story helpers mirror ColumnLayout's. *Left: the architecture standard
   forbids cross-component imports and bucket modules; gathering them into `Theme/` would reopen
   ColumnLayout, outside this ticket. Recorded.*
7. **[judgement] `@property` in `src/styles.css`** - a component-specific registration in the
   shared stylesheet, no precedent. *Accepted: Tailwind has no utility for it and the style query
   needs a resolved length; noted in the ADR amendment in `4726e82`.*
8. **[judgement] Raw `460` in the Default play.** *Fixed in `4726e82`: the threshold is resolved
   from the list's own custom property.*
9. **[judgement] ADR amendment deleted the recorded #115 resizing direction.** *Fixed in `4726e82`
   (also a Spec finding).*
10. **Clean**: comment budgets, load-bearing token comment, story spreads, no raw colours, glossary
    form, the two-state switch literals (`1000000`, `100cqi`, `1px`, `100%`) with ColumnLayout
    precedent.

## Spec

Reported by the Spec sub-agents, lightly cleaned.

### Pass 1 (`3739997...d9c005b`)

1. **Missing: consumer allocation API** - brief: "Consumers choose term/value proportions once for
   the whole list … Follow ColumnLayout's positive relative weights and theme-token minimum-width
   vocabulary." The diff hard-coded `1fr 2fr`. *Fixed in `f312f0a`: `termColumn`/`descriptionColumn`.*
2. **Missing: minimums decide the switch** - brief: "Use the list's available content width, after
   its column gap, to determine whether both proportional shares satisfy their minimum readable
   widths." The diff switched on a fixed 24rem container query. *Fixed in `f312f0a`.*
3. **Missing: comfortable container-based** - brief: "Both densities use this container-based
   behavior … Replacing the viewport breakpoint with container adaptation is intentional in both
   density modes." *Fixed in `f312f0a`; published by the `NOTE:` footer.*
4. **Scope creep: compact changed typography** - brief: "without changing typography"; out of
   scope: "New typography variants". The compact term took the label role in the secondary family,
   against #120's "DefinitionList terms remain body-family content regardless of their size".
   *Removed in `f312f0a`.*
5. **Wrong: ADR 0008 and CONTEXT.md misstated what the maintainer accepted.** *Fixed in `f312f0a`
   and `4726e82`.*
6. **Partial: tests** - class assertions only, no empty list, no threshold boundaries, no theme
   minimums, no focus through resize; "DOM class assertions alone do not establish those
   guarantees". *Fixed in `f312f0a`: geometry play functions for each case.*
7. **Partial: docs location** - README section against `main`'s Storybook convention. *Fixed.*
8. **Wrong: `wrap-break-word` only at compact.** *Fixed: both densities.*

### Pass 2 (`e92bf3e...4726e82`, reviewed at `f312f0a`)

1. **Column gap changed from 3rem to `--space-region`** - brief: "Comfortable is the default and
   preserves current spacing." *Kept, as a recorded decision: that sentence governs density (the
   item air, which is preserved exactly), while the column arrangement is what the brief replaces;
   the former gap was a literal rung with no role, `ColumnLayout` separates its columns on the region
   role, and the `NOTE:` footer discloses the change. The coordinator can reverse it by one class
   if the maintainer reads the brief differently.*
2. **Partial: changed theme minimums at compact density** - brief: "including changed theme
   minimums … in both densities". *Fixed in `4726e82`: `ThemeMinimums` carries both densities.*
3. **Partial: `SingleItem` had no play function** - brief: "Cover multiple terms, one item and an
   empty list." *Fixed in `4726e82`.*
4. **Partial: undeclared-token behaviour undocumented** - brief: "invalid-configuration behavior
   consistently with ColumnLayout". *Fixed in `4726e82`: documented in the TSDoc and the Storybook
   description, verified in Chrome (the list stays stacked).*
5. **Evidence report said 27 tests; the spec has 22 `it` blocks.** *Both true at the time (`it.each`
   expands to 27 cases); the report now states blocks and cases, 22 and 25 after `4726e82`.*
6. **Scope creep: the ADR rewrite deleted the #115 "future interactive column resizing" paragraph
   and the maintainer's "accepted direction" sentence.** *Fixed in `4726e82`: both restored verbatim.*
7. **Confirmed in scope and correct**: threshold formula equals ColumnLayout's and uses the width
   after the gap; density is `[&>div]:py-[token]` only; no typography variants, no literal
   measurements beyond token defaults, no per-item allocation, no resizing, no Dialog sizing, no
   density elsewhere; `NOTE:` lines within 100 characters.

### Acceptance criteria (brief), after `4726e82`

| Criterion | Result | Evidence |
| --- | --- | --- |
| Omitted density = comfortable spacing; compact visibly reduces it; both coexist; theme tokens; no typography or control change | Pass | `Densities`, `Compact` (padding against a token probe; font properties equal) |
| Consumer proportions consistent across items; defaults, valid weights, minimum tokens, invalid configuration documented like ColumnLayout | Pass | `ConsumerAllocation`, `MultipleTerms`, spec's threshold/share/error tests, Storybook description |
| Narrow list stacks independently on a wide desktop; widths just above/below threshold at both densities incl. changed minimums; terms precede; whole list switches | Pass | `Threshold` (28rem/29rem), `ThemeMinimums` (both densities), `InSummaryPanel` |
| Long EN/DE phrases and unbroken values readable; no overlap, clipping, ellipsis, page overflow; multiple terms, one item, empty list | Pass | `LongValue`, `CompactLongValue`, `MultipleTerms`, `SingleItem`, `Empty` |
| dl/dt/dd semantics, type roles, hairlines, composed links/controls and focus through resizing; no new interaction | Pass | spec structure tests, `Keyboard`, `SingleItem` rules |
| Behavioural tests and stories for comfortable, compact, long-value, narrow-container; real browser geometry | Pass | all fourteen stories carry geometry play functions; Playwright readbacks in the implementation report |
| Consumer docs updated; lint, typecheck, tests, build, Storybook build, browser checks; coordinate with #120 | Pass | Storybook description; checks below; `font-body` kept on term and description |
| Publish and record the version in Label Manager #195 | Deferred | not a worker action; see Publication |

## Checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 178 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 54 files, 1192 tests (run by the pre-commit hook on `4726e82`) |
| `npm run build` | Passed |
| `npm run build-storybook` | Passed |
| Browser (Playwright, Chrome, 1400x900) | All fourteen `Display/DefinitionList` play functions pass; real Escape returns focus to the Dialog's opener; `.dark` re-points; 360px viewport stacks without overflow; undeclared token stays stacked; pin forced off gives a full-width description |

Not verified: Firefox and Safari (style-query support documented, fallback simulated in Chrome
only); the consumer's real page; screen-reader output.

## Compatibility

Additive API: `density`, `termColumn`, `descriptionColumn` on `Root`, all optional; the four props
interfaces are now exported from the module (not from the barrel); no member, prop or token removed
or renamed; `PaletteTokens` untouched; no breaking-change marker. One default-rendering change,
disclosed by the `NOTE:` footer: the comfortable list's columns now key on the list's width (one
region gap plus 27rem at the defaults) in a 1:2 split with the gap on `--space-region`, where they
keyed on a 64rem viewport with a fixed 16rem track and a 3rem gap. Two other visible consequences
of the brief's container rule are documented as caller obligations: the `dl` is an inline-size
container, so a shrink-to-fit holder gives it no width; and the two-column pin needs container style
queries (Chrome 111, Safari 18, Firefox 151), without which descriptions sit below their terms.

## Publication

Not published. Three `feat`/`fix` commits sit on `feature/ticket-123`; semantic-release will derive a
minor from `f312f0a` when `main` is published. Record that actual version in g-label-manager #195
after the fact. The issue stays open and its board status unchanged.

Sources for the browser-support statement: [web.dev, New to the web platform in May 2026](https://web.dev/blog/web-platform-05-2026),
[Bugzilla 1795622, style() container queries](https://bugzilla.mozilla.org/show_bug.cgi?id=1795622).

## Main integration follow-up

Preserved the original 3rem column gap as `--space-definition-column`, shared by
both densities. This supersedes the region-gap judgment above: default columns
fit at 30rem. The CSS property registration now ships in every generated token
entrypoint, including light and dark variants. Browser geometry checks passed
for all six stylesheet/token entrypoints at 479, 480, 481 and 600px, including
stacking, proportions, the 48px gap and overflow. The full 1,205-test suite passed.
