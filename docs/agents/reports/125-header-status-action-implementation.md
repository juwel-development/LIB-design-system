# Header status and action slots: implementation evidence (#125)

Date: 2026-10-03. Implemented by an Orca worker (Claude) on branch `feature/ticket-125`, cut from
local `main` at `3739997` (package 3.9.1). Source of truth: issue #125 as filed (it carries no
comments and no agent brief), read against the consumer specification
[g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195) and the consumer's
current `ClockBar`, which puts its Balance line and Continue button inside Header's `children` -
that is, inside the navigation landmark. Nothing was pushed, merged, published or versioned; the
final `/code-review` and the release stay with the coordinator. Implementation and publication are
recorded separately: this report is the implementation record, and no release version exists yet.

## What shipped

- `Header` gains two optional slots, `status?: ReactNode` and `action?: ReactNode`, beside the
  existing `standing`, `navName`, `children`, `edge` and `testId`. No prop was removed, renamed or
  made required; no token was added, removed or renamed; the theme contract is untouched.
- DOM order, which is reading and keyboard order: standing, status, nav, action. Each new slot is a
  plain `div` with no role, no name and no live region, and neither is ever inside the `<nav>`.
  Omitting a slot renders no wrapper for it.
- The `<nav>` renders only when `children` are given. A bar of standing, status and action declares
  no empty navigation landmark. This is the one observable change for an existing caller, and only
  for a `Header` rendered with no `children`, which used to emit an empty `<nav>`; no existing test,
  story or known consumer renders that.
- Opposite-edge alignment is one auto margin on the end group - the action, or the nav when there is
  no action - instead of `justify-between` on the bar. A bar of standing and nav renders exactly as
  before (nav flush with the content edge, measured below); a status slot stays beside the standing
  one; a lone action sits at the far edge; a nav beside an action sits with the matter before it.
- Responsive wrapping with the layout tokens: slots are gapped with `--space-region` along the line.
  A bar holding a status or action slot may break into lines, gapped with `--space-stack` between
  lines (Cluster's rule for a wrapped row, ADR 0008). A bar of standing and nav never breaks and goes
  on absorbing narrowing inside the nav, as documented before. That wrap is a recipe variant read off
  the filled slots, not a prop: `IHeaderProps` omits it from `VariantProps<typeof header>`, because
  the component already knows the answer.
- The standing slot and the action slot never shrink; the status slot shrinks and wraps its own
  contents, and a long unbreakable token overflows the slot rather than widening the page.
- Stories added to `Header.stories.tsx`: StatusOnly, ActionOnly, StatusAndAction (the consumer's Top
  bar), WithNav (all four slots), LongLabels (German wording, several readouts, a disabled long
  action) and NarrowDesktop (the bar held at 48rem).
- `CONTEXT.md` gains **Status slot** and **Action slot** under Page. No ADR changes: the choice
  carries no token and ADR 0008's structural test applies as written.

## Test evidence

Ten tests were added to `Header.spec.tsx` (23 in the file, 863 in the suite). The first seven were
written red against the unchanged component and turned green by the slots; the end-edge and
wrapping tests were reworked together with the second implementation pass after the first browser
measurement showed the nav floating between status and action (two auto margins on one line) and
the status slot squeezed into a 51px column at 800px. They assert on roles, containment, DOM order,
focus and operability; the two class-string pins follow the file's existing practice of naming the
tokens jsdom cannot lay out:

- the two-slot bar still renders exactly a standing slot and a nav, nav last;
- status matter is in the banner and outside the navigation landmark;
- the action is in the banner, outside the nav, clickable and focusable;
- no `<nav>` at all without children; the nav stays, named, when children, status and action are
  all given;
- the slots carry no role, no `aria-live`, no `aria-label`; no `status` or `group` role appears;
- DOM order standing, status, nav, action, and the focusable sequence matches it;
- no wrapper for an omitted slot;
- `gap-x-[var(--space-region)]`, no `justify-between`, `ms-auto` on the action and on the nav only
  without an action;
- no `flex-wrap` on the two-slot bar; `flex-wrap gap-y-[var(--space-stack)]` once a status or action
  is present;
- the sticky/fixed and `dark:` sweeps now cover both new slots.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 153 files checked |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 47 files, 863 tests (23 Header) |
| `npm run build` | Passed; `status`/`action` in `dist/types/Layout/Header/Header.d.ts`, `breaks` absent from `IHeaderProps` |
| `npm run build-storybook` | Passed; 14 Header stories indexed |

## Browser evidence

Measured in headless Google Chrome via Playwright (scratchpad install, own context) against the
static Storybook build served on port 6125, reading `getBoundingClientRect`, computed styles,
`document.scrollWidth` and the focused element after each Tab. "Content edge" is the header's box
minus `--gutter`. Screenshots were taken per story and width and kept in the scratchpad.

| Story @ width | Result |
| --- | --- |
| Default @1280 | Unchanged: `flex-wrap: nowrap`, nav right edge 1216 = content edge, one nav |
| Default @390 | Unchanged: nav stays beside the standing slot and wraps its links (58.5px tall), no overflow |
| StatusOnly @1280 | No `<nav>` in the document; status left edge 370.8 = standing right 351.3 + 19.5 gap |
| ActionOnly @1280 | No nav; action right edge 1216 = content edge; first Tab lands on Continue with a 3px solid outline |
| StatusAndAction @1280 and @1024 | One line; status beside standing; action flush with the content edge (1216 / 972.8); no nav; no overflow |
| WithNav @1280 | Order standing, status, nav, action on one line; action at 1216; Tab order JuweL Development, Work, Studio, Contact, Sign out |
| LongLabels @1280 | Status (714px) beside the date; action dropped to line two, right edge 1216 |
| LongLabels @1024 and @800 | Three lines: date, status, action; action right edge 972.8 / 760; `scrollWidth` = `clientWidth` |
| NarrowDesktop (48rem frame) | Three lines; action right edge 704 = frame content edge; no overflow |

At every width `document.scrollWidth` equalled `clientWidth` and the header's own `scrollWidth`
equalled its `clientWidth`: the bar never produced horizontal scroll. Baseline alignment held on
every line (`align-items: baseline`).

## Compatibility

- Additive: two optional props; every existing call compiles and renders the same markup, with one
  exception stated above (a `Header` with no `children` no longer emits an empty `<nav>`).
- No token, palette or theme-interface change; `PaletteTokens` is untouched.
- The barrel still exports `Header` only; `IHeaderProps` stays in its module.
- Commit marker: `feat(header)`, minor release when published.

## Limitations and what was not done

- The consumer's `ClockBar` was not changed; moving its Balance and Continue into `status` and
  `action` and dropping `children` is the consumer's step once a release exists.
- The live-region question is deliberately left with the consumer: Header neither announces nor
  suppresses a changing readout.
- A bar that both navigates and acts places the nav with the matter before it rather than at the
  edge beside the action. That is a new composition, not a change to any existing one.
- No release was published and no version was recorded in #195.
