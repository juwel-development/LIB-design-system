# Typography family roles implementation evidence (#120)

Date: 2026-10-03. Implemented by an Orca worker (Claude) on branch `feature/ticket-120`, cut from
local `main` at `3739997` (package 3.9.1), against issue #120 as filed - the issue carries no
comments and no local brief, so the closed-contract decisions below are the worker's, made within
ADR 0004's existing rules. Nothing was pushed, merged, published or versioned; review and release
stay with the coordinator. The consumer is [Label Manager #195](https://github.com/juwel-dev/g-label-manager/issues/195),
whose theme today sets `--font-primary` to a serif and `--font-secondary` to a sans on `:root`.

## What shipped

- **Two additive family roles** in the typography `@theme` block of `src/Theme/renderTokens.ts`,
  regenerated into `tokens.css`, `tokens.light.css` and `tokens.dark.css`:
  `--font-heading: var(--font-primary)` and `--font-control: var(--font-primary)`. The two
  original roles stay at `inherit`. No token was removed or renamed; `PaletteTokens` is untouched.
- **Headings read `font-heading`**: `H1`-`H6`, `PageHead`'s `h1` and `Dialog.Title`'s `h1`. Their
  size, leading, tracking, measure and colour recipes are unchanged.
- **Controls read `font-control`**: `Button` (base, every variant), and the control element of
  `Input`, `TextArea`, `NumberInput`, `Select` and `MultiSelect`. Labels, hints, errors, optional
  markers, chips and counts keep `font-secondary`; `Choices` is unchanged.
- **Mapping to the ticket's three roles**: heading = `--font-heading`; body = `--font-primary`;
  control = `--font-control`. The consumer sets heading to its serif and primary (and secondary)
  to its sans; control may be left to follow primary. No raw font value enters any prop, and no
  component gains a face prop.
- **Docs**: ADR 0004 gains an amendment recording the roles, their `var(--font-primary)` default,
  where that default resolves, and the rejected alternatives; ADR 0005's "headings and body copy
  share a face" consequence is amended; `CONTEXT.md` gains the **Family role** term; the TSDoc on
  every heading and `Button`'s recipe note name the role they read.
- **Story**: `src/Display/Typography/FamilyRoles.stories.tsx` renders one representative page
  (PageHead, Eyebrow, H2, H3, P, Prose, Note, Input, Select, Button, Table) under four themes:
  `LibraryDefaults`, `SerifHeadings` (the #195 shape), `ControlsApart` and `ContentAndLabelsOnly`.
  It is a cross-cutting story beside the Typography components rather than inside one, since its
  subject is the token contract shared by all of them.

## Test evidence

Written red before each slice, then green. Full suite: 48 files, 919 tests.

- `renderTokens.spec.ts`: the two roles are declared with `var(--font-primary)` defaults and the
  family set is exactly the four roles in order.
- `family-role-assignment.spec.ts` (new, the `label-leading-optin` shape): pins the eight sources
  reading `font-heading` and the six reading `font-control`, checks each heading source paints a
  heading element, and bans face literals (`font-sans|serif|mono`, `font-[`) in every component.
- `H1`-`H6`, `PageHead`, `Dialog`: the heading element carries the heading role and not the
  content role; PageHead's lede and intro and Dialog's description stay on the content role.
- `Button` (every variant), `Input`, `TextArea`, `NumberInput`, `Select`, `MultiSelect`: the
  control carries the control role; every naming part carries the secondary role.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 155 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 48 files, 919 tests |
| `npm run build` | Passed; `dist` CSS carries `--font-heading:var(--font-primary)`, `--font-control:var(--font-primary)`, `.font-heading{font-family:var(--font-heading)}` and `.font-control{…}` |
| `npm run build-storybook` | Passed; output deleted before committing |

## Browser evidence

The chrome-devtools MCP profile was locked by another session, so the dev Storybook on port 6007
was driven with Playwright against the installed Chrome (headless, 1280px wide), reading computed
styles and `getBoundingClientRect` off the story root. Screenshots and the scripts stayed in the
scratchpad.

Across `LibraryDefaults`, `SerifHeadings` and `ControlsApart` every measured size, line height,
letter-spacing and element height was identical; only `font-family` changed:

| Element | Defaults | SerifHeadings | ControlsApart | size / line |
| --- | --- | --- | --- | --- |
| PageHead h1, H2 | system | Georgia | Georgia | 64px / 70.4px, -1.28px tracking |
| H3 | system | Georgia | Georgia | 36px / 43.2px |
| Lede, body, Note, value cell | system | system-ui | system-ui | unchanged per role |
| Eyebrow, header cells, labels | system | system-ui | system-ui | 13px / 19.5px, 1.82px tracking |
| Input, Select, Button | system | system-ui | ui-monospace | 17px; heights 44 / 40 / 42px |

- Focus: tabbing to the Title input gave `outline: 3px solid rgb(71,85,105)` at `2px` offset and a
  44px box in all three stories - the ring and geometry do not move with the face.
- Wrapping: the long row header wrapped inside its cell at 39px in every story; page scroll width
  stayed at the 1280px viewport, so no horizontal overflow.
- Root-scoped following, on `LibraryDefaults` with properties set on `document.documentElement`
  the way a consumer theme does: re-pointing `--font-primary` alone moved h1, h2, paragraph, input
  and button to Georgia and left the label alone (the pre-#120 behaviour, preserved); adding
  `--font-heading` moved only h1 and h2; adding `--font-control` moved only input and button.
- Dialog (`OrdinaryConfirmation`, opened by its trigger): with `--font-heading` and
  `--font-primary` re-pointed on `:root`, the open dialog's `h1` took the heading face at
  36px / 43.2px, its description and both action buttons took the primary face, `headingreset` present.

## Limitations

- **Where the default resolves.** `var(--font-primary)` substitutes on `:root`, where the library
  declares it. A theme that re-points `--font-primary` on a wrapper element rather than `:root`
  does not carry `--font-heading` or `--font-control` with it and must re-point them there too.
  Observed in the browser (the first draft of `SerifHeadings` relied on following and the controls
  stayed on the page face), recorded in ADR 0004's amendment and in the story's note, and the
  reason every story states all four roles. The known consumer themes on `:root`.
- Faces in the story and the browser checks are generic stand-ins; the Label Manager's families
  were not copied in, per the ticket's boundary.
- The Storybook a11y addon was not run against the new story beyond the build.
- The acceptance item "publish a release and record its version in the consumer ticket" is not
  done and cannot be done here: no release was made and no version is claimed.

## Compatibility

Additive only. No exported interface gains a member, no required prop changes, no token is removed
or renamed, and the library still ships no face. A one-face consumer renders byte-for-byte as
before; a two-face consumer theming on `:root` keeps the headings and controls it had. Suggested
commit type: `feat` with a `NOTE:` footer stating the scope rule above, no breaking marker.
