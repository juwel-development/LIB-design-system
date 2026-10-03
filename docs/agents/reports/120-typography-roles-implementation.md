# Typography family roles implementation evidence (#120)

Date: 2026-10-03. Implemented by an Orca worker (Claude) on branch `feature/ticket-120`, cut from
local `main` at `3739997` (package 3.9.1), against issue #120. The first implementation was built
against the issue body alone; the maintainer-approved Agent Brief
(`docs/agents/reports/120-agent-brief.md`, also the triage comment on the issue) is authoritative,
and the review recorded in `120-review.md` brought the branch into line with it. This report
describes the branch **after** that review; the earlier state is recorded there. Nothing was pushed,
merged, published or versioned; review and release stay with the coordinator. The consumer is
[Label Manager #195](https://github.com/juwel-dev/g-label-manager/issues/195), whose theme today
sets `--font-primary` to a serif and `--font-secondary` to a sans on `:root`.

## What shipped

- **Three additive family roles**, `--font-heading`, `--font-body` and `--font-control`, each a
  utility carrying a fallback to `--font-primary` (`@utility font-heading { font-family:
  var(--font-heading, var(--font-primary)); }` in `src/Theme/renderTokens.ts`), regenerated into
  `tokens.css`, `tokens.light.css` and `tokens.dark.css`. No value is declared for the three, so the
  fallback resolves on the element reading it and a theme at any scope - `:root`, `html` or a
  wrapper - reaches the text beneath it. The two original roles stay at `inherit` in `@theme`; no
  token was removed or renamed; `PaletteTokens` is untouched.
- **Headings read `font-heading`**: `H1`-`H6`, `PageHead`'s `h1` and `Dialog.Title`'s `h1`.
- **Reading matter reads `font-body`**: `P`, `Prose` (lede, body, tail), `Checklist` items,
  `DefinitionList` term and description, `Table` value cells, `PageHead`'s lede and intro,
  `Dialog.Description`. No component reads `font-primary` directly any more.
- **Controls read `font-control`**: `Button` (base, every variant), and the control element of
  `Input`, `TextArea`, `NumberInput`, `Select` and `MultiSelect`. Labels, hints, errors, optional
  markers, chips and counts keep `font-secondary`; `Choices` and `Link` are unchanged.
- **Mapping to the brief's three roles**: heading = `--font-heading`; body = `--font-body`;
  control = `--font-control`; each defaults to `--font-primary`. No raw font value enters any
  prop, and no component gains a face prop.
- **Docs**: ADR 0004's amendment records the three roles, the per-element fallback and why a
  `:root` value was rejected, moves the `tnum` constraint to the effective body face, and keeps the
  rejected alternatives; ADR 0005's "headings and body copy share a face" consequence is amended;
  `CONTEXT.md`'s **Family role** term names all five; `README.md` gains a consumer-facing
  "Typography family roles" section with coverage, defaults, overrides and compatibility.
- **Story**: `src/Display/Typography/FamilyRoles.stories.tsx` renders one representative page
  (PageHead, Eyebrow, H2, H3, P with a prose Link, a quiet-link nav, Input with a long German
  label and hint, Select, Button, Table, DefinitionList, Checklist, Prose with a Link, Note) under
  five wrapper-scoped themes: `LibraryDefaults`, `SerifHeadings` (the #195 shape: heading alone
  re-pointed), `ControlsApart`, `BodyApart` and `LegacyTheme` (primary and secondary only).

## Test evidence

Written red before each slice, then green. Full suite after review: 48 files, 938 tests.

- `renderTokens.spec.ts`: the `@theme` family set is exactly primary and secondary at `inherit`;
  each of the three roles is a utility with the primary fallback, emitted in all three stylesheets;
  no value is declared for any of the three.
- `family-role-assignment.spec.ts` (new, the `label-leading-optin` shape): pins the eight sources
  reading `font-heading`, the seven reading `font-body` and the six reading `font-control`, that
  none reads `font-primary`, and bans face literals (`font-sans|serif|mono`, `font-[…]`,
  `font-(…)`, `[font-family:…]`) in every component while letting a weight literal through.
- `H1`-`H6`, `PageHead`, `Dialog`: the heading element carries the heading role; PageHead's lede
  and intro and Dialog's description carry the body role.
- `P`, `Prose`, `Checklist`, `DefinitionList`, `Table`: the reading matter carries the body role
  (the term too), and a table note keeps the secondary role.
- `Button` (every variant), `Input`, `TextArea`, `NumberInput`, `Select`, `MultiSelect`: the
  control carries the control role; every naming part carries the secondary role.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 155 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 48 files, 938 tests |
| `npm run build` | Passed; `dist/index.css` carries `.font-heading{font-family:var(--font-heading,var(--font-primary))}`, `.font-body{…}` and `.font-control{…}`, and no `--font-heading:` declaration |
| `npm run build-storybook` | Passed; output deleted before committing |

## Browser evidence

The chrome-devtools MCP profile was locked by another session, so the dev Storybook on port 6007
was driven with Playwright against the installed Chrome (headless, 1280px wide), reading computed
styles and `getBoundingClientRect` off the story root; the single-theme entry points were compiled
with Tailwind in a scratch harness and read the same way. Scripts, JSON and screenshots stayed in
the scratchpad; the review report (`120-review.md`) carries the tables.

- **Families follow the roles, in both scopes.** On the five wrapper-scoped stories and on five
  themes set on `html`, every element took the face its role names: `SerifHeadings` (heading alone
  re-pointed) moved the page head, `H2`, `H3` and nothing else; `BodyApart` moved the paragraphs,
  the prose block, the definition term and description, the checklist and the table figures;
  `ControlsApart` moved the input, the select and the three buttons; `LegacyTheme` (primary serif
  and secondary sans only, on a wrapper) moved headings, reading matter and controls together and
  left the eyebrow, nav, labels, hint, caption, header cells and note on the sans - the pre-#120
  rendering, which the first draft's `:root`-resolved default had lost on a wrapper.
- **Geometry does not move with the face.** Across all five stories every one of thirty probed
  elements kept the same size, leading, tracking, weight and box height; the long German label
  stayed on one line at 25.5px, the long row header wrapped to two lines at 39px, the paragraph
  with its nested link ran two lines and the prose body three in every story; nothing clipped and
  the page's scroll width stayed at the 1280px viewport.
- **Focus.** Tabbing into the input, the select and the button in `SerifHeadings` and
  `ControlsApart` gave `outline: 3px solid rgb(71,85,105)` at `2px` offset on each, at 43.5, 40 and
  41.5px boxes - the ring and the geometry do not move with the face.
- **Dialog** (`OrdinaryConfirmation`, opened by its trigger) under `--font-heading` and
  `--font-primary` re-pointed on `html`: the open dialog's `h1` took Georgia at 36px / 43.2px, its
  description and both actions Arial, `headingreset` present.
- **Entry points.** `styles.css`, `styles.light.css` and `styles.dark.css`, each compiled and
  loaded in the browser: a wrapper-scoped legacy theme moved heading, body and control to Georgia
  and secondary to Arial; a wrapper setting the three roles gave Georgia / Verdana / Courier New;
  the same two themes on `html` gave the same result, and a body override on `html` moved the body
  alone.

## Limitations

- Faces in the story and the browser checks are generic stand-ins; the Label Manager's families
  were not copied in, per the ticket's boundary.
- A plain Button treatment (#114) does not exist on this branch, so "a plain action inside a
  heading or paragraph follows that context" is verified only for `Link`'s inheriting treatments;
  #114 inherits the rule, and `Button`'s control face sits in its recipe base, which that work
  must leave out of the plain treatment.
- The Storybook a11y addon was not run against the new story beyond the build.
- The acceptance item "publish a release and record its version in the consumer ticket" is not
  done and cannot be done here: no release was made and no version is claimed.

## Compatibility

Additive only. No exported interface gains a member, no required prop changes, no token is removed
or renamed, the `@theme` block is byte-identical to the one at the merge-base, and the library
still ships no face. A one-face consumer renders byte-for-byte as before; a two-face consumer
theming on `:root`, `html` or a wrapper keeps the headings, paragraphs and controls it had, as the
browser evidence above shows with real differing families. The feat commit carries no `NOTE:`
footer: nothing a consumer wrote behaves differently, so there is nothing to tell them before they
debug it.
