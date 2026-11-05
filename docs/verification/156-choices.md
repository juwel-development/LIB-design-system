# Choices wrapping arrangement (#156)

Implemented against [the approved brief](https://github.com/juwel-development/LIB-design-system/issues/156#issuecomment-6662303623), including the full issue and its comment history fetched with `gh issue view 156 --json body,comments`. Starting commit: `36ad968bcc08efcd9328e36d033d0dc869478cd8`. Read CONTEXT.md and all four files in docs/agents/standards before implementation. No AGENTS.md was found in the worktree or ancestor directories.

## Public behavior

`Choices.Root arrangement="wrapping"` opts into content-sized choices that flow onto further lines. The default remains `vertical`, with full-width choices. Both use the existing marker, selected boundary and focus ring. No equal-width mode, new token, per-choice availability, arbitrary content or style override was added.

`Choices.Choice description` is optional in both arrangements. Missing and empty descriptions produce no description element or accessible-description association. Supplied descriptions stay visible and associated. Unbroken names and descriptions wrap inside their choice. Controlled selection, stable values, direct radio children (including arrays/fragments), declared-order arrow movement, selected-choice silence, non-submitting native buttons and group-level inert behavior are retained.

The exact maintainer Choices glossary definition from `/tmp/lib-design-system-156-triage-context.patch` is included in CONTEXT.md. Choice row now names its description as optional. The existing Sidebar glossary was retained. No coordinator stash was accessed, and no merge or rebase was performed.

Stories document caller obligations and the public composition. `ChoicesFilter.stories.tsx` uses only the public entry point:

```
Shell → Sidebar.Root fill → Sidebar.Content → Screen heading
  → Tabs.Root fill → Tabs.Panel → Pane.Root
    → Pane.Head → Stack
      → Choices.Root arrangement="wrapping" → five direct Choice children
      → Cluster → FieldRow (search/Clear), count
    → Pane.Body scrollOwner="child" → bounded Table
```

The consumer in this fixture answers selection requests and filters the same table; Clear restores all four roles. All EN/DE wording is caller content. Separate Choices stories show vertical label-only, wrapping descriptions, inert, narrow, long translated/unbroken text and unanswered selection requests inside a form.

## Regression-first evidence

The first new DOM test failed because an omitted description still left `aria-describedby` pointing to a rendered empty description. It passed after the optional-description implementation. The reference-head browser assertion then failed before the arrangement implementation: five tops were 259.390625, 310.890625, 362.390625, 413.890625 and 465.390625px, all widths 892px; group height was 249.5px. The new arrangement makes this same public composition pass.

The DOM suite now has 28 passing tests, including both arrangements' omitted descriptions and inert interaction, controlled requests with arrays/fragments and an independent second group, plus the existing selection, marker, description-ID, keyboard and non-emitting-render checks. Geometry is checked in Chromium, never inferred from jsdom or class strings.

## Reference head geometry

The upstream recorded Application allocations in `/tmp/316-staff-allocation-{en,de}.json` assign the group **892px**, from x=302 to x=1194 at 1280×720, inside a 926px Pane after Shell/Sidebar/Screen allocation and Pane insets. The documented story reproduces that actual available width through the same library composition; it is not a viewport-wide isolated Choices fixture. The Application's recorded group top was 277.8125px; this fixture's shorter surrounding heading/bar content puts it at 259.390625px. This is evidence of fit at the actual head allocation, not an assertion that the entire prepared Application or its remaining allocation investigation has been validated.

CSS pixels, 16px root, Chromium 156.0.8078.4; source CSS, combined CSS in both themes and each dedicated stylesheet produce the same geometry:

| Locale at 1280×720 | Group x / width / height | Choice widths in declared order | Choice tops | Search/Clear/count top |
| --- | --- | --- | --- | --- |
| EN | 302 / 892 / 43.5 | 75.578125, 90.125, 187.078125, 149.65625, 127.46875 | all 259.390625 | 310.890625 |
| DE | 302 / 892 / 43.5 | 85.03125, 90.125, 180.21875, 149.65625, 136.296875 | all 259.390625 | 310.890625 |

English's row occupies 661.90625px including gaps; German's 673.328125px. Both leave unused trailing space rather than distributing it to the choices. The second logical head row is 77px high and starts 8px below Choices. There is exactly one checked option with a visible marker and foreground boundary. Omitted descriptions have no `aria-describedby`.

At 800×720, Sidebar stacks and leaves 676px for the group: both locales still fit one line. At 320×720, the group has 228px, four visual lines and 198px height; its first two options share a line and the remaining options each occupy a later line. No choice or text overflows its group and document width stays 320px. Long translated and unbroken names/descriptions are also checked at 320px in both arrangements, with no ellipsis, clipping or document-wide horizontal overflow.

## Browser coverage and reproduction

```sh
npm run build
npm run build-storybook
npm run storybook -- --ci --port 6026
# After both builds finish; keep sources/build output stable while checking:
CHOICES_STORYBOOK_URL=http://localhost:6026 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/choices.mjs
npm run lint
npm run typecheck
npx vitest run src/Interaction/Choices/Choices.spec.tsx
VITEST_MAX_WORKERS=1 npm test
```

The ephemeral Playwright package changes no repository dependencies. The runner closes Chromium in `finally`. It checks source light/dark, `dist/styles.css` light/dark, `dist/styles.light.css` and `dist/styles.dark.css`. For delivered CSS it removes source stylesheet tags, verifies their absence, then supplies only the chosen built stylesheet plus Storybook's host surface/foreground paint (no component overrides). It waits for the theme class and color transitions before asserting appearance or saving screenshots; the requested palette is asserted, not assumed from the URL.

The runner emits 97 JSON records followed by `PASS Choices browser acceptance`:

- 12 reference allocations and 24 smaller-window allocations (EN/DE, six stylesheet/theme combinations), retaining selection through 1280→800→320→1280 resizing.
- 12 keyboard sequences: native Tab enters the selected choice from the panel, Down/Right advance in declared order, Up/Left reverse, both ends wrap, and movement crosses visual lines. After resizing and controlled updates, Tab leaves for search and Shift+Tab returns to the selected choice.
- Every resulting focused choice has the shared solid outline and its complete bounds plus ring inside the viewport. The measured ring width is 3px plus 2px offset. Native focus reveals wrapped choices without scripted `scrollIntoView`.
- 24 long-text checks in vertical/wrapping arrangements at wide/narrow windows, including German compound names and unbroken descriptions, plus six vertical label-only defaults.
- 12 inert groups retain exactly one checked choice while every radio is disabled, has tabindex -1 and is skipped by native Tab. DOM tests additionally verify that inert pointer/keyboard dispatch emits nothing.
- Six native activation sequences inside a form: one arrow request, then Enter, Space and click each add exactly one request while the pinned selection remains unchanged. Click/Enter/Space on the selected choice add none. Request total is four; submission total stays zero. No render causes a request.
- No uncaught browser errors. Visible marker, transparent choice background and selected foreground boundary are checked alongside geometry. Controlled filtering and Clear change the same table.

Earlier harness runs exposed an extra legitimate Tab stop on Tabs.Panel, the fact that 800px still fits after Sidebar stacking, and asynchronous theme/color transitions. The final runner accounts for these public behaviors and asserts the actual active theme. Those earlier runs are not acceptance passes.

Current-run evidence: `/tmp/lib156-browser.log`, `/tmp/lib156-browser/{english,german}-{light,dark}-1280.png` and corresponding `-320-focus.png` screenshots. Geometry and focus results are reproducible from the committed script; this report retains the measurements even if temporary artifacts are removed.

## Checks and release boundary

- Focused Choices tests: 28 passed.
- Full suite: 65 files / 1,496 tests passed, unchanged timeouts; the existing jsdom document-navigation notice remains non-failing.
- Lint and typecheck passed.
- Package build passed, including all three stylesheet delivery smoke checks and the CSS-free JavaScript entry check.
- Storybook production build passed with its existing chunk-size advisory.
- Browser acceptance passed across both active themes and all three delivered stylesheet exports.
- `git diff --check` passed. The normal commit hook repeats lint, typecheck and the full suite; no hook is bypassed.

On 2026-11-05 `npm view @juwel-development/design-system version dist-tags --json` reports **4.1.0** / latest **4.1.0**. This implementation is unreleased and 4.1.0 lacks this API. A conventional `feat(choices)` commit supplies release notes through semantic-release; no version number is preassigned and CHANGELOG.md remains release-generated. Consumer adoption requires an actually published release containing #156.

The separately dispatched fresh reviewer owns code-review; this worker did not create reviewers or helper agents. Remaining limits are actual consumer adoption/full Application validation, other browser engines and assistive-technology testing, plus release after review. No consumer source, coordinator stash, dependency/version, push, merge, issue closure or publication is part of this change. At workflow startup the implementation script moved #156 to In Progress; no further tracker writes or external posts were made.
