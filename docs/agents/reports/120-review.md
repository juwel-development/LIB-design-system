# #120 review: typography heading, body and control family roles

Date: 2026-10-03. Two-axis review (`.claude/skills/code-review/SKILL.md`) of `feature/ticket-120`
against the fixed merge-base with `main`, `3739997`, by an Orca worker (Claude). The spec is issue
#120 with the maintainer-approved Agent Brief in its triage comment, which supersedes the issue
body where they differ; the same brief is committed on `main` as
`docs/agents/reports/120-agent-brief.md` and is now carried on this branch. Standards sources:
`docs/agents/standards/{coding,architecture,testing,design-system-components}.md`, `CONTEXT.md`,
ADR 0004 and ADR 0005. Both axes ran as fresh parallel sub-agents over
`git diff 3739997...HEAD`; `npm run fallow:agent -- --base 3739997` reported only inherited
styling advisories. Confirmed findings were fixed on the branch and are recorded below with the
commit that fixed them. Nothing was pushed, merged, published or closed.

## Reviewed state

| Commit (before review) | Subject |
| --- | --- |
| `869029a` | feat(typography): add heading and control family roles (#120) |
| `ae609f5` | docs(typography): record #120 implementation and validation evidence |

The implementation report on that branch stated the issue "carries no comments and no local
brief". The brief existed (triage comment at 04:27Z) and the implementation had been built against
the issue body alone; the coordinator also relayed the maintainer's instruction that the brief is
authoritative and that the wrapper-scope limitation it recorded is a regression to fix.

## Standards

Reported by the Standards sub-agent, lightly cleaned. `[hard]` = documented-standard breach;
`[judgement]` = baseline smell or call.

1. **[hard] TSDoc line length, `H1`–`H6`** - coding.md "Comments" / repo prose wraps at ~100 chars.
   The rewritten `@Guarantees` bullet was one 173–187-char line in all six files.
2. **[hard] File-header budget, `FamilyRoles.stories.tsx`** - coding.md "a file header of at most
   6 lines". The header was 8 lines, three over 100 chars, and restated ADR 0004 "Where the default
   resolves" instead of citing it.
3. **[hard, pre-existing made worse] Block budget, `Button.tsx`** - the recipe comment was 10 lines
   at the merge-base and grew to 11 ("any other block at most 4"; over budget must be reduced).
4. **[hard] Test name claims what it does not test, `family-role-assignment.spec.ts`** -
   `'leaves no heading reading the content face'` checked only that `H1.tsx` was absent from the
   `font-primary` set; H2–H6 unchecked, PageHead/Dialog legitimately carried `font-primary`.
5. **[judgement, call: acceptable] Class-string assertions** - testing.md "never assert on the
   class string" against 171 such assertions at the merge-base and ADR 0004's own "they are what the
   specs pin"; jsdom loads no Tailwind, so a family role has no other observable. The repo has
   endorsed this for token roles.
6. **[judgement, weakest] `Select.spec` / `MultiSelect.spec` selector-substring assertions**
   (`'[&>label]:font-secondary'`) pin the child-selector implementation of a root recipe, with no
   precedent; `trigger().parentElement.parentElement` is a message chain.
7. **[judgement] `faceLiteral` regex** missed Tailwind v4 `font-(family-name:--x)`, `font-(--x)` and
   `[font-family:…]`, and flagged `font-[600]`, a weight ADR 0005 permits.
8. **[judgement] Duplicated Code** - `componentSources`/`carries`/`carrying` copied from
   `label-leading-optin.spec.ts`, dropping the load-bearing regex comment. Acceptable at two; extract
   on the third scan spec.
9. **[judgement] Duplicated Code, `H1`–`H6` specs** - the same 3-line comment six times.
10. **[judgement] Non-colocated story** - the only story outside a component directory; defensible
    as a cross-cutting theme demonstration; `Meta` typing and docs shape match siblings.

Clean: generated `tokens*.css` byte-consistent with `renderTokens.ts`; `src/index.ts` needs
nothing; CONTEXT.md term matches the code; ADR amendments in `## Amendments` form.

Standards: 10 findings, 4 hard. Worst: the test whose name claimed a guarantee it did not check (4).

## Spec

Reported by the Spec sub-agent against the brief, lightly cleaned. Each item quotes the brief.

1. **(a) `--font-body` not shipped - High.** "Introduce `--font-heading`, `--font-body` and
   `--font-control` as independently overridable theme family roles." Only heading and control
   were added; body was mapped onto `--font-primary`, and P, Prose, Checklist, DefinitionList, Table
   value cells, PageHead lede/intro and Dialog.Description still read `font-primary`.
2. **(a) Consumer-facing docs absent - High.** "Document role coverage, defaults, overrides and
   compatibility in consumer-facing docs." README untouched; its Theming section named no
   `font-*` token.
3. **(a) Font-feature constraint not reconciled - Medium.** "Font-feature requirements follow the
   effective family where features are used … do not leave them stated only against a legacy token
   whose override can now be bypassed." ADR 0004 still read "`--font-primary` must carry `tnum`".
4. **(a) Legacy-theme criterion not demonstrated by committed tests or story - Medium.** "Themes
   setting only primary and secondary families retain their previous computed font families. Verify
   this with actual differing families." The `ContentAndLabelsOnly` story set all four roles on a
   wrapper, so it did not exercise the fall-through; root-scope evidence existed only as prose.
5. **(a) Story lacks nested links/plain actions and several body elements - Medium.** "Include
   secondary text, nested links/plain actions and legacy themes." No `Link`, `Checklist`,
   `DefinitionList`; the plain Button (#114) does not exist on this branch.
6. **(c) Wrapper-vs-`:root` caveat is a real behavioural gap - Medium.** "Verify overrides in
   supported theme scopes." A theme re-pointing `--font-primary` on a wrapper no longer carried
   headings and controls; README's Theming already describes an ancestor-scoped `.dark`, so a scoped
   theme is a supported scope and this was a compatibility regression, not a limitation.
7. **(b) Face-literal ban - Low.** Not requested; harmless, additive guard. Kept.
8. **Release - pending, not a defect.** "Report implementation and release status separately."
   Correctly reported as outstanding.

Delivered correctly before review: heading role on H1–H6, PageHead title, Dialog.Title; control
role on Button and the five field controls; secondary assignments untouched; `Choices` on secondary;
no font prop; all three generated token files updated.

Spec: 8 findings, 2 high. Worst: the missing `--font-body` role (1), with the scoped-theme
regression (6) the one the maintainer singled out.

## Fixes applied

History note: the original feat commit `869029a` carried a `NOTE:` footer telling consumers that a
wrapper-scoped theme "must re-point all four family roles there". That statement describes the
regression this review removed, and a `NOTE:` publishes to the changelog, so the commit was
reworded (non-interactive rebase) to drop the footer before the fix commit was added. The branch
was never pushed; old SHAs remain in the reflog. Rebased: `869029a → 8a3f771`, `ae609f5 → 8f011a8`.

| Finding | Fix | Commit |
| --- | --- | --- |
| Spec 6 (scoped-theme regression), coordinator | The three roles are `@utility` rules carrying the fallback, `font-family: var(--font-heading, var(--font-primary))`, with **no value declared** for `--font-heading`, `--font-body`, `--font-control` anywhere, so the fallback resolves on the element reading it at any scope. The `@theme` block is byte-identical to the merge-base. `renderTokens.spec.ts` pins the utilities, their presence in all three stylesheets, and the absence of any declared value. | `5014974` |
| Spec 1 (`--font-body`) | `--font-body` added; `P`, `Prose` (lede/body/tail), `Checklist` items, `DefinitionList` term and description, `Table` value cells, `PageHead` lede and intro, `Dialog.Description` read `font-body`; no component reads `font-primary` directly. Per-component tests added (P, Prose, Checklist, DefinitionList, Table) and adjusted (PageHead, Dialog); the scan spec pins the body set and the empty primary set. | `5014974` |
| Spec 2 (consumer docs) | README "Typography family roles": coverage table, defaults, the three-line serif-headings theme, independent overrides, inherited `Link`/plain action, compatibility across scopes and entry points, `tnum`/`smcp`. | `5014974` |
| Spec 3 (`tnum` on the effective family) | ADR 0004 constraints: "the effective body face must carry `tnum`" with the reason; `renderTokens.ts` comment likewise. | `5014974` |
| Spec 4 (legacy theme demonstrated) | `LegacyTheme` story sets only `--font-primary` and `--font-secondary` on a wrapper; `SerifHeadings` now re-points the heading role alone, body and control following primary. Browser evidence below covers wrapper and `html` scopes with real differing families. | `5014974` |
| Spec 5 (story coverage) | Story adds a prose `Link` nested in `P` and in `Prose.Body`, a quiet-link nav, `DefinitionList`, `Checklist`, a long German field label with hint, and `BodyApart`. Plain Button: not on this branch (#114 open); recorded as a limitation. | `5014974` |
| ADR / glossary reconciliation | ADR 0004 amendment rewritten for three roles and the per-element fallback, recording the rejected `:root` value; ADR 0005 consequence updated; CONTEXT.md "Family role" names all five roles and the fallback. | `5014974` |
| Standards 1 | `H1`–`H6` TSDoc bullet wrapped at 100 chars. | `5014974` |
| Standards 2 | Story header cut to 5 lines citing ADR 0004. | `5014974` |
| Standards 3 | `Button.tsx` recipe comment reduced from 11 lines to 4, citing the four ADRs. | `5014974` |
| Standards 4 | Test replaced by `leaves no component reading the primary face directly` (`carrying('font-primary')` is `[]`) and a secondary-face guard; the per-level guarantee stays in `H1`–`H6` specs. | `5014974` |
| Standards 6 | Label-selector substring assertions dropped from `Select.spec` and `MultiSelect.spec`; the control-role assertion stays, and the label face is left to the story. | `5014974` |
| Standards 7 | `faceLiteral` now catches `font-[…]` (non-numeric), `font-(…)` and `[font-family:…]`, and lets `font-[600]` through; cases added. | `5014974` |
| Standards 8 | Regex comment restored on `carries`; duplication left at two per the call. | `5014974` |
| Standards 9 | `H2`–`H6` spec comments cite `H1.spec` in one line. | `5014974` |
| Standards 5, 10; Spec 7 | Accepted as-is (calls recorded above). | - |

The implementation report `120-typography-roles-implementation.md` was corrected to describe the
post-review branch and its provenance, and the approved brief was added to the branch from `main`
(`227eb68`, identical content).

## Acceptance evidence

Browser evidence: the chrome-devtools MCP profile was locked by another session, so Playwright 1.63
drove the installed Chrome headless at 1280px against `storybook dev` on port 6007 (then stopped)
and against the three stylesheet entry points compiled by Tailwind in a scratch harness. Scripts,
`evidence.json` and screenshots stayed in the scratchpad.

**Families per element and story** (first family of the computed stack; `apple` = the document's
inherited `-apple-system`, i.e. the library's own `inherit`):

| Element | LibraryDefaults | SerifHeadings | ControlsApart | BodyApart | LegacyTheme (wrapper, primary+secondary only) |
| --- | --- | --- | --- | --- | --- |
| PageHead h1, H2, H3 | apple | Georgia | Georgia | system-ui | Georgia |
| P, Prose lede/body/tail, nested prose links, dt, dd, checklist li, table value text and figures, PageHead lede and intro | apple | system-ui | system-ui | Georgia | Georgia |
| Input, Select, Buttons (primary, secondary, ghost) | apple | system-ui | ui-monospace | system-ui | Georgia |
| Eyebrow, quiet nav link, field labels, hint, caption, header cells (col and row), Note | apple | system-ui | system-ui | system-ui | system-ui |

**Root scope** (properties set on `html` over `LibraryDefaults`): primary Georgia + secondary Arial
alone moved every heading, paragraph, link-in-prose, dt, dd, checklist item, table figure, input,
select and button to Georgia and every label, eyebrow, nav link, header cell and note to Arial;
heading alone moved the three headings and nothing else; body alone moved the eight reading-matter
probes and nothing else; control alone moved input, select and button and nothing else; the Label
Manager shape (heading Georgia, primary and secondary Arial) gave serif headings over sans
everything else.

**Entry points** (`styles.css`, `styles.light.css`, `styles.dark.css`, each compiled and loaded):
identical results in all three - wrapper legacy theme: heading, body, control Georgia, secondary
Arial; wrapper roles: Georgia / Verdana / Courier New; legacy theme on `html`: Georgia ×3, Arial;
body override on `html`: body Verdana, heading and control Georgia. The emitted rules are
`.font-heading{font-family:var(--font-heading,var(--font-primary))}` and likewise for body and
control, with `--font-primary:inherit` and no `--font-heading:` declaration.

**Geometry, wrapping, clipping.** All thirty probed elements kept the same size, leading, tracking,
weight and box height across the five stories (page head 64px/70.4px, −1.28px tracking; H3 36px/
43.2px; body 17px/27.2px; label 17px/25.5px, weight 500; small 15px/22.5px; label role 13px/19.5px,
1.82px tracking; Input 43.5px, Select 40px, Button 41.5px tall). The long German label ran one line,
the long row header wrapped to two lines at 39px, the paragraph with its nested link two lines and
the prose body three, in every story; no element reported clipped overflow and the page's scroll
width stayed at 1280px.

**Focus.** Tab into the Input, the Select and the Button in `SerifHeadings` and `ControlsApart`:
`outline 3px solid rgb(71,85,105)`, offset 2px, on each, with the heights above unchanged.

**Dialog** under heading Georgia + primary Arial on `html`: open `h1` Georgia 36px/43.2px,
description Arial 17px/27.2px, both actions Arial, `headingreset` present.

**Checks** (post-fix, this worktree):

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 155 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 48 files, 938 tests (919 before review) |
| `npm run build` | Passed; `dist/index.css` carries the three fallback utilities |
| `npm run build-storybook` | Passed; `storybook-static` removed before committing |
| pre-commit hook on the fix commit | lint, typecheck, test all green |

**Brief criteria, item by item:**

- Changing heading family changes every listed heading without body, control or secondary text;
  DefinitionList terms stay body - **met** (root-scope `headingAlone`, `BodyApart`, dt probe).
- Body and control change independently; secondary and inherited text keep their behaviour -
  **met** (`bodyAlone`, `controlAlone`; quiet link, eyebrow, labels, note unchanged; prose links
  follow their paragraph).
- Themes setting only primary and secondary retain their computed families, verified with real
  families, in supported scopes and all entry points - **met** (LegacyTheme on a wrapper, legacy
  on `html`, three stylesheets).
- Size, leading, tracking, weight, semantics, names, interaction, focus preserved; no clipping -
  **met** (geometry table, focus, headingreset, 938 tests).
- Contract tests and a representative composition with serif headings, a distinct control example,
  secondary text, nested links, legacy themes - **met**; plain actions - **not verifiable** (#114).
- Computed families, multiline text, long translated labels, keyboard focus in a browser - **met**.
- Consumer-facing docs, ADR and glossary reconciled, font features on the effective family - **met**.
- Lint, typecheck, tests, library build, Storybook build - **met**.
- Publish and record the version in the consumer ticket - **pending** (below).

## Compatibility

Additive. No exported interface, prop, token name or default behaviour changes; the `@theme` block
is byte-identical to the merge-base; three new utility names are added and `--font-primary` is kept
declared and re-pointable. A one-face consumer renders as before; a two-face consumer theming on
`:root`, `html` or a wrapper renders as before, shown above with differing families rather than
inferred from the shipped `inherit`. No `NOTE:` footer, no breaking marker, no major release: the
branch's two `feat` commits publish a minor.

## Limitations

- Plain Button (#114) is not on this branch; its plain treatment must leave `font-control` out so a
  plain action inherits its heading or paragraph's face. `Button`'s face sits in its recipe base.
- The story's faces are generic stand-ins; the Label Manager's fonts were not copied in.
- Storybook's a11y addon was not run against the new story beyond the build.
- Browser checks used headless Chrome only.

## Pending publication

Implementation is complete on `feature/ticket-120` and unmerged. Release acceptance - publishing
through the normal process and recording the released version on
[juwel-dev/g-label-manager#195](https://github.com/juwel-dev/g-label-manager/issues/195) - is
deferred to the human publishing step. No version is claimed here. The issue was moved to
`In Review` on the board (the skill's step 6); `Done` belongs to whoever lands the work.
