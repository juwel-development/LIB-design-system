# #155 current-section navigation — 2026-11-05

Authority: full issue and all comments fetched with `gh issue view 155 --repo
juwel-development/LIB-design-system --json title,body,comments` and `gh api --paginate
repos/juwel-development/LIB-design-system/issues/155/comments`. The latest approved
[Agent Brief](https://github.com/juwel-development/LIB-design-system/issues/155#issuecomment-6661823688)
supersedes #101's current-entry non-emission rule universally. The issue was already **In Progress**
when this worker started. Base: `36ad968bcc08efcd9328e36d033d0dc869478cd8`.

Read CONTEXT.md and all four files in docs/agents/standards. Applied the supplied
`/tmp/lib-design-system-155-triage-context.patch` in this worktree; its Sidebar definition is included
verbatim. No coordinator stash was changed.

## Change and boundaries

Sidebar's existing native click handler now emits the entry key for every non-inert activation,
including the current entry. There is one event handler, no custom keyboard handler and no new prop,
mode, transport, token, style, export or public type. The existing active key, named landmark,
text-only entries, Item/Content composition, disabled entries and non-submitting buttons remain.
The consumer owns the Subject and all navigation meaning, content, active state, draft disposal,
history, payment and focus policy. Emission alone changes neither current indication nor content.

Public TSDoc and Storybook explicitly record the superseded rule. Four new stories cover ordinary
and subordinate content in English and German. They use the same application handler for current
and other sections; it records the request, disposes the application's draft and chooses its active
key. In ordinary content a current request keeps the content node. In subordinate content it returns
to the containing section; reopening shows an empty draft. No payment action is attached.

The conventional feature commit carries a consumer `NOTE:` footer under the repository's existing
semantic-release conventions; CHANGELOG.md and package version remain release-owned.

## Commands and automated checks

```sh
npm test -- src/Layout/Sidebar/Sidebar.spec.tsx
npm run typecheck
npm run lint
npm test
npm run build
npm run build-storybook
npm run storybook -- --ci --port 6015
# After Storybook is ready, with no build running:
SIDEBAR_STORYBOOK_URL=http://localhost:6015 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/sidebar.mjs
git diff --check
npm view @juwel-development/design-system version time --json
```

The updated current-entry regression was run **before** the handler change: 14 tests passed and
one failed, receiving `[]` instead of `['staff']`. After the change all **18 Sidebar tests passed**.
These include once-only current/inactive Enter and Space requests, Tab skipping inert entries,
focus-only silence, controlled indication/content, render/rerender/active-key silence, Subject
replacement and consumer-owned lifetime after unmount, and the unrelated pre-existing contracts.
Native keyboard browser checks supplement jsdom's simulated keyboard behavior.

Final lint, typecheck, package build (including CSS/JS delivery smoke checks), Storybook build and
`git diff --check` passed. The full suite passed: **65 files, 1,493 tests**. The existing jsdom
`Not implemented: navigation to another Document` diagnostic did not fail a test. Storybook reported
its existing missing optional MDX glob, Node deprecation and large-chunk warnings; its build succeeded.

## Browser matrix and observed geometry

`scripts/browser/sidebar.mjs`: **28 cases passed**, Chromium **156.0.8078.4**, 16px root font.

| Surface | Languages | Themes / CSS | Windows | Cases |
| --- | --- | --- | --- | --- |
| Ordinary and subordinate stories | English, German | Source CSS, light and dark | 1023×720, 1024×720 | 16 |
| Subordinate stories | English, German | Each of dist/styles.css, styles.light.css, styles.dark.css | 800×900, 1440×900 | 12 |

The source matrix tests both sides of the exact 64rem layout breakpoint. Each of its 16 cases
checks native mouse, Enter and Space on the current entry, and each activation method on an inactive
entry: **96 once-only activations**. Each inactive request reaches the same handler and updates the
controlled current key. Disabled Songs receives a real forced mouse click without emission; Tab
from Contracts skips it and reaches Artists. Focus alone emits nothing. Current-entry requests
leave Contracts current with exactly one `aria-current="true"`, a persistent underline and the same
focused native button, including after the consumer rerenders or removes subordinate content.

Tab reaches Hub and then Contracts with a **solid 3px ring**; entry rectangles are identical before
and after focus. Every label's text rectangles fit inside its button, and neither the navigation nor
the document overflows horizontally. The dark source surface is `rgb(15, 23, 42)` and the light
surface is `rgb(255, 255, 255)`; the existing `.dark` theme mechanism is selected explicitly in the
isolated browser fixture. The German artist and staff phrases wrap inside the side track.

Representative CSS-pixel geometry (same arrangement in both languages/themes):

| Window | Navigation track | Content | Result |
| --- | --- | --- | --- |
| 1023×720 | left 16, right 1007, bottom 219; width 991 | left 16, top 243 | Stacked, 24px separation |
| 1024×720 | left 16, right 208; width 192 | left 232, top 16; width 776 | Beside, 12rem track, 24px separation |
| 800×900, delivered light CSS | left 16, right 784, bottom 219; width 768 | left 16, top 243 | Stacked |
| 1440×900, delivered dark CSS, German | left 16, right 208; width 192 | left 232, top 16; width 1192 | Beside |

Each delivered stylesheet is injected after removing the source component stylesheet; Storybook's
frame and ordinary theme-token surface rule remain. Those 12 cases separately prove current Enter
activation, draft disposal, accurate current indication, retained focus and fitting geometry.
The final run reported no page errors. Two representative focus screenshots were visually inspected.

An initial Orca embedded-browser attempt could move the active element using native Tab, but its
background document reported `document.hasFocus() === false` and could not display `:focus-visible`.
It was not counted as ring verification. The final matrix uses the repository's existing standalone
Playwright/Chromium browser-harness pattern and passes the ring assertion. A preliminary isolated
Storybook globals query did not apply the dark class; the final harness explicitly selects the
published `.dark` theme mechanism and verifies the resulting class and surface.

## Artifacts and release status

- `/tmp/lib-155-browser/results.json`: complete geometry, per-activation request sequences, focus,
  current indication and PASS records for all 28 final cases.
- `/tmp/lib-155-browser.log`: complete final browser run and PASS summary.
- `/tmp/lib-155-browser/`: 44 PNGs, focus and final-state images for each source case plus one per
  delivered-CSS case; representative files are `ordinary-german-dark-1024-focus.png` and
  `subordinate-english-light-1023-focus.png`.
- `/tmp/lib-155-issue.json`, `/tmp/lib-155-comments.json`: fetched authority, including all comments.
- `/tmp/lib-155-registry.json`: registry release evidence.

Registry verification during this work reports actual latest published **4.1.0**, which retains
current-entry silence. This implementation is **unpublished**; no future version is claimed.
Consumer adoption must wait for a published release containing #155, then identify that actual
version from npm and its changelog. No consumer Booking application was modified or rerun; the
English/German examples demonstrate the library boundary, not payment or application acceptance.

No implementation or check failures remained at the implementation handoff. The independent review
below was dispatched separately; landing and publication remain with the coordinator/maintainer.
The implementation worker did not self-dispatch review, push, merge, close the issue or publish.

## Independent review and fixes — 2026-11-05

Pinned review base: `36ad968bcc08efcd9328e36d033d0dc869478cd8`, captured with
`git merge-base main HEAD` before review. Reviewed implementation commit
`401ea133ddb0c723a0b64efce6d80731d7fb5323` using
`git diff 36ad968bcc08efcd9328e36d033d0dc869478cd8...HEAD`. Later changes to main did not move this
base. Authority was the full issue #155 and its approved Agent Brief comment
`https://github.com/juwel-development/LIB-design-system/issues/155#issuecomment-6661823688`.

Separate Codex subagents reviewed Standards and Spec in parallel, followed by independent browser
verification and resolution by the review worker. All four standards were read: `coding.md`,
`architecture.md`, `design-system-components.md` and `testing.md` in `docs/agents/standards/`.
`npm run fallow:agent -- --base 36ad968bcc08efcd9328e36d033d0dc869478cd8` informed reading order;
its inherited/heuristic warnings did not establish additional findings.

### Standards

**One low-severity documented violation, resolved; no actionable baseline smells.**
The new browser harness used abbreviated identifiers `nav` and `rect`, contrary to
`coding.md` → Naming: “No abbreviations — full words. Only `id`, `url`, `min`, `max` allowed.”
Renamed them throughout to `navigation` and `measureBounds`. The Standards reviewer independently
confirmed the resolution; the remaining `nav` strings are HTML selectors.

The closed compound API, semantic styling, Subject ownership, controlled state, behavioral tests
and consumer `NOTE:` footer conform to the reviewed standards. No production behavior changed
during review.

### Spec

**Pass — zero findings.** The implementation satisfies the approved universal current-entry request
semantics through one native click handler, preserving inert behavior, controlled current indication,
content and focus. English/German ordinary and subordinate stories demonstrate the same application
navigation handler and consumer-owned draft disposal. Public documentation explicitly supersedes
#101's silence rule; no new API, mode, route, payment or focus policy was introduced.

### Fresh verification and remaining boundaries

The review worker reran lint, typecheck, all **65 test files / 1,493 tests**, package build with
delivery checks, Storybook build and `git diff --check`: all passed. The only code edit was the
identifier rename, so no new behavior test was necessary. The existing jsdom navigation diagnostic
and Storybook optional MDX/deprecation/chunk warnings remain non-failing.

After all builds finished, the final renamed browser harness passed **28/28 cases** in Chromium
**156.0.8078.4**: **96 native source-CSS activations** across ordinary/subordinate content,
English/German, light/dark, and 1023/1024px widths, plus 12 delivered-CSS cases at 800/1440px.
It verified once-only current/inactive requests, inert click/Tab silence, current indication, retained
focus, draft disposal/reopening, a 3px keyboard ring without movement, wrapping and no horizontal
overflow. Representative German dark beside-content and English light stacked focus screenshots
were visually inspected. The final run reported no page errors.

A separate Orca embedded-browser interaction filled the German subordinate draft, focused
Verträge and pressed Enter: requests became exactly `contracts`, subordinate content disappeared,
the draft became `Kein Entwurf`, one current indication remained and focus stayed on a button.
Standalone Chromium supplies the complete native focus-ring matrix.

Fresh artifacts: `/tmp/lib-155-review-browser/results.json`, 44 PNGs in the same directory,
`/tmp/lib-155-review-browser.log`, `/tmp/lib-155-review-orca-state.json`,
`/tmp/lib-155-review-issue.json`, `/tmp/lib-155-review-registry.json`, and command logs matching
`/tmp/lib-155-review-{lint,typecheck,tests,build,build-storybook}.log`.

The registry still reports **4.1.0**; this capability remains unpublished. A release containing #155
must be identified before adoption, and the consumer's assembled Booking flow still needs its own
English/German rerun after adoption. No push, merge, issue/project mutation, close or release was
performed by this reviewer; the coordinator owns landing.

Review totals: Standards **1 found / 1 resolved / 0 remaining** (worst: low naming violation);
Spec **0 findings**.
