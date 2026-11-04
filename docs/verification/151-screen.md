# #151 Screen implementation and validation

Authority: the approved final briefs of 2026-11-04,
[#151](https://github.com/juwel-development/LIB-design-system/issues/151#issuecomment-6637288592)
and [#152](https://github.com/juwel-development/LIB-design-system/issues/152#issuecomment-6637289232).
No withdrawn plan or previous result was used as acceptance evidence.

## Implementation

`Screen` exports exactly `heading?: ReactNode`, required `children: ReactNode`, and
`testId?: string`. It owns one main, the gutter, region inset/separation, and the remainder beneath
an optional heading. The content wrapper stays at the same React position across slot changes.
Omitted, undefined, null and false headings add no wrapper/track/gap; arbitrary components are not
inspected for emptiness.

The persistent remainder frame and growing content are separate boxes. Pane reads the frame through
one private context, measures its own fixed sections and usable body content, and marks a shortfall.
Screen's CSS releases the whole content height if any Pane cannot fit. Pane measures ordinary text,
controls and semantic table rows, reserving the body's actual focus inset and delegated table fixed
regions. Returning to a sufficient allocation removes the shortfall without temporary bounds,
clones, remounts, consumer measurements, a registration service, or a generic layout protocol.
Observers and listeners disconnect on unmount or allocation replacement. Standalone Pane has no
Screen measurement observer. ColumnLayout, Table, Shell and Sidebar production code are unchanged.

The narrow internal Screen/Pane dependency is documented in the architecture standard and ADR 0008;
it is not an added public API. Screen/Pane direct composition is the supported boundary. Additional
height-consuming wrappers need their own allocation contract. The enclosing Shell body owns fallback
scrolling; its bar must leave usable space. Natural-height release may clamp an old panel scroll
offset to zero, and restoration may clamp the enclosing scroll offset; node identity, focus and input
state survive, rather than promising unchanged offsets where no scroll range remains.

## Reproduction

```sh
npm run storybook -- --ci --port 6011
npm run build
npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen.mjs
```

The browser runner used Chromium 156.0.8078.4 (Playwright 1.64.1), without changing
package dependencies. If absent, install its browser with
`npm exec --yes --package=playwright@1.64.1 -- playwright install chromium`.
`SCREEN_STORYBOOK_URL` can select another local Storybook URL.

Fixture: `src/Layout/Screen/Screen.stories.tsx`; iframe IDs are `layout-screen--heading-above`,
`heading-inside-panel`, `delegated-table`, `with-sidebar`, `narrow-holder`, `short-content`,
`empty-content`, `without-foot`, and `unsized`. Fixture theme width tokens are 18rem/20rem with
1:2 weights (minimum-fit threshold 54rem plus the region gap), not library sizing defaults. NarrowHolder deliberately supplies a 40rem external holder.
The runner emits JSON geometry before its final PASS. It asserts actual DOM rectangles and scroll
ranges, not screenshots or jsdom layout, and never calls `scrollIntoView`.

Source-CSS coverage includes both heading modes, delegated Table, Sidebar, reference windows
1920×1080 and 1280×720, 1279×720, 1280×320, 800×720, and Sidebar's separate 1024/1023 boundary.
A narrow holder stacks at 1920px. A height sweep checks that a bounded body always holds an ordinary
control plus its actual focus inset. Repeated animation frames in fallback check that neither
shortfall markers nor the enclosing scroll range oscillate or collapse for measurement.

Keyboard checks use real Chromium PageDown, Tab and Shift+Tab. They check independent list/detail
scrolling while Shell/document remain still, visible focus outline, final-entry/pagination focus
reveal, delegated Table scrolling and pinned header, and no extra delegated-body tab stop.
Resize, heading insertion/removal, German-length fixed content, disabled explanation, wrapping bar,
and root-font enlargement to 24px exercise restoration and stable input identity/value/selection/focus.
Short/empty bodies and absent foot retain natural content height.

For each of `dist/styles.css`, `dist/styles.light.css`, and `dist/styles.dark.css`, the runner removes
both Vite-injected source stylesheets and inserts only that compiled library stylesheet. Storybook's
own preview visibility rules remain; otherwise its hidden error/loading panels would become visible
and invalidate the fixture. All three heading/table fixtures then repeat bounded → fallback → bounded
checks. This exercises delivered CSS independently of Storybook's source utility generation.

## Test-first evidence and validation

The first Screen semantic-main test failed because Screen did not exist, then passed after the
minimal component. The first browser allocation test failed at 1280×720: the list body was
1282px/1282px (client/scroll) and the footer bottom was 1702.67px. The allocation implementation made
it bounded. The next 1280×320 regression failed with a 0px body and 1282px content; Screen/Pane
fallback made the whole body reachable. These were fresh runs in this worktree.

The final unit seam covers main semantics/reading order, the actual inside-Pane heading composition,
all absent forms, custom-component non-inference, and focused input identity/value/text selection
across heading changes. Geometry and native keyboard acceptance belong to the browser seam.

Fresh Chromium measurements from the final 39-record browser run (CSS px; client/scroll heights):

| Fixture and window | List | Detail | Shell body |
| --- | ---: | ---: | ---: |
| Heading above, 1920×1080 | 577 / 1282 | 673 / 1410 | 999 / 999 |
| Heading above, 1280×720 | 229 / 1282 | 325 / 1410 | 639 / 639 |
| Heading inside, 1920×1080 | 469 / 1282 | 774 / 1410 | 999 / 999 |
| Heading inside, 1280×720 | 129 / 1282 | 418 / 1410 | 639 / 639 |
| With Sidebar, 1280×720 | 229 / 1282 | 325 / 2497 | 639 / 639 |
| Heading above, 1280×320 fallback | 1282 / 1282 | 1410 / 1410 | 239 / 1694 |

The delegated Table at 1280×720 has a 229px scrollport and 1658px content; its Pane body has
229px/229px, so the table alone scrolls. Reference cases assert simultaneous complete rectangles
for the heading, both heads and both actions before scrolling. All three delivered stylesheets pass
the same bounded/fallback/restoration checks for above-heading, inside-heading and delegated Table.

The ordinary control requires 34px including its actual inset. At 1280×540 the list still has
49.34px; at 1280×520 it releases to 1282px rather than accepting the approximately 29px remainder.
It restores to 229.34px at 720px height. Twelve successive settled frames preserve fallback
scrollTop=500 and its scroll range, with no shortfall-marker changes. Native keyboard focus has a
solid 3px outline. Native focus reveal reaches the last entry and pagination with Shell scrollTop
1455, while document scrollTop remains zero.

Completed checks: build (including check:build for all three stylesheets and JS delivery), standalone
built Screen export import, lint, typecheck, focused Screen unit suite (7 tests), Storybook production
build, and the complete browser acceptance runner. The final isolated `VITEST_MAX_WORKERS=1 npm test` passed all **64 files / 1,449 tests** in
181.15 seconds, with the repository's original five-second timeouts unchanged. The seven focused
Screen tests also pass. The normal pre-commit hook repeats lint, typecheck and the full suite with
the same worker limit; no hooks are bypassed.

The initial concurrent full-suite run had 16 five-second timeouts in 15 files. No assertions failed;
that run is not counted as passing. A subsequent single-worker run retained one timeout in unchanged
MultiSelect code while other validation was still running. Resource-related retries are recorded
explicitly, rather than weakening the tests or changing their configured timeout.

Local raw evidence retained for the reviewer:
`/tmp/screen-browser-final.log`, `/tmp/screen-build.log`, `/tmp/screen-storybook.log`,
`/tmp/screen-lint-final.log`, `/tmp/screen-typecheck-final.log`, `/tmp/screen-focused.log`,
and `/tmp/screen-tests-final.log`. Earlier timed-out runs are `/tmp/screen-tests.log` and
`/tmp/screen-tests-serial.log`.

## Limits and handoff

Only Chromium was exercised, with representative library fixtures. This is not a claim of actual
consumer geometry, every language/font, or cross-application validation. #152 still owns the deeper
bounded roster integration, 15–17rem roster theme, real selection/pagination scenarios and its
additional acceptance. A separate fresh reviewer must review this change; implementation intentionally
skipped the implement skill's review step. No consumer changes, GitHub writes, push, merge, release,
publication or issue closure were performed.
