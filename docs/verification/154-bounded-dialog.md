# #154 bounded confirmation — 2026-11-05

Authority: the complete issue and every comment fetched through `gh issue view 154 -R juwel-development/LIB-design-system --json title,body,comments,url` and paginated REST comments. The [approved Agent Brief](https://github.com/juwel-development/LIB-design-system/issues/154#issuecomment-6661819370) governs the insufficient-space exception. Read CONTEXT.md, all four files in docs/agents/standards, and the relevant page composition, structural-choice and Dialog lifecycle ADRs.

## Implementation and boundaries

The supported composition is unchanged: content-extent Dialog → child-owned Content → Pane → child-owned Body → bounded Table, with a fixed Pane.Foot summary and Dialog.Actions. Pane's delegated Body now supplies a shrinking flex allocation, so the Table receives the available height through the nested composition.

Dialog measures fixed content and the table's caption/header plus a complete wrapped row and focus room at the current width. Insufficient space releases the whole task into Dialog's scroll region; Content and the table wrapper cease scrolling, the table header becomes static, and growing space restores the bounded arrangement. Measurement never temporarily re-bounds fallback content or remounts children. Dialog inspects semantic table DOM and owns its private fallback styling; there are no new sibling-component imports or extensions of the Screen/Pane allocation exception.

A private inherited CSS flag lets Table release its scroll semantics while the enclosing Dialog owns overflow. A focused wrapper retains tabindex=-1 until blur: Chromium otherwise drops focus when tabindex is removed. This is absent from the public token/prop contract. Dialog scroll padding reserves the complete focus ring during native reveal, including at the fallback edges. Native dialog presentation, dismissal and Subject transport remain intact. While presented, document overflow is locked, then its previous inline value and priority are restored on close, Subject replacement or unmount.

No public components, props, extents, widths, tokens, barrel exports or consumer application files changed. The compact width remains 32rem. The new stories use 33 stable identities, including the two duplicate-title rows, and consumer-owned EN/DE wording. The German fixture is library verification wording, not a claim to have run the separate Label Manager application or installed consumer theme.

## Reproduce

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run build-storybook
python3 -m http.server 6015 --directory storybook-static
# Separate shell after the server is ready; no build runs during browser verification:
DIALOG_STORYBOOK_URL=http://localhost:6015 npm exec --yes --package=playwright -- node scripts/browser/dialog.mjs
SCREEN_STORYBOOK_URL=http://localhost:6015 npm exec --yes --package=playwright -- node scripts/browser/screen.mjs
SCREEN_STORYBOOK_URL=http://localhost:6015 npm exec --yes --package=playwright -- node scripts/browser/work-areas.mjs
SCREEN_STORYBOOK_URL=http://localhost:6014 npm exec --yes --package=playwright -- node scripts/browser/roster.mjs
# Final Screen and Work Areas runs used built Storybook on 6015; Roster used development Storybook on 6014.
```

The browser driver remains ephemeral, matching the existing scripts/browser runners; it adds no package dependency. The composed browser seam is prescribed by the brief. jsdom covers lifecycle and semantic behavior, not geometry.

## Release and adoption

`npm view @juwel-development/design-system version` returned **4.1.0** during this implementation. This correction is local and unpublished. Adopt only after the maintainer publishes a release containing this commit, then identify that actual published version; no future version is claimed here. The fix commit carries the consumer NOTE required by the release conventions.

## Results

- `npm run lint`, `npm run typecheck`, `npm run test` (65 files, 1,491 tests), `npm run build`, and `npm run build-storybook` pass. Focused Dialog/Pane/Table run: 126 tests pass. Node 26.13.0; ephemeral Playwright 1.64.1, Chromium, 100% zoom.
- The browser script verifies only the public composition and observable DOM geometry/keyboard behavior. It uses built, isolated published CSS from `styles.css`, `styles.light.css` and `styles.dark.css` after removing Storybook stylesheet links, in EN and DE. Light and dark shipped themes are covered.
- All four viewport cases below use **bounded/Table-only mode**, including 1024×720 and 800×720. No dialog, Content or document scroll region, offset or horizontal overflow appears for the reported wrapping single-column content. The count follows the list directly above Actions; header and fixed regions remain visible together. Table alone accepts residual overflow.

| Locale | Viewport | Dialog x / y / w / h (CSS px) | Table client / scroll height |
| --- | --- | --- | --- |
| EN | 1920×1080 | 704 / 24 / 512 / 1032 | 627 / 1264 |
| DE | 1920×1080 | 704 / 24 / 512 / 1032 | 599 / 1264 |
| EN | 1280×720 | 384 / 24 / 512 / 672 | 267 / 1264 |
| DE | 1280×720 | 384 / 24 / 512 / 672 | 239 / 1264 |
| EN | 1024×720 | 256 / 24 / 512 / 672 | 267 / 1264 |
| DE | 1024×720 | 256 / 24 / 512 / 672 | 239 / 1264 |
| EN | 800×720 | 144 / 24 / 512 / 672 | 267 / 1264 |
| DE | 800×720 | 144 / 24 / 512 / 672 | 239 / 1264 |

- At **1280×300**, the 512×252 Dialog is the sole vertical scroll region; Table expands to 1264px with visible overflow, no separate scroll range and a static header. EN whole-task scroll height is 1670px; DE is 1697px. Keyboard PageUp reaches title/description, PageDown reaches the final row, count and final action. The background stays at offset zero even with a deliberately 2000px-tall document and wheel input over the scrim.
- Native Shift+Tab reaches the named overflowing Table, PageDown reaches row 40 while only Table's offset changes, and Tab reaches Cancel and Confirm. The 3px focus outline plus 2px offset remains inside the scroll clip during fallback reveal. A focused Table keeps the same active element through fallback with tabindex=-1, and restores its overflowing tab stop on growth. Short tables remove the stop after blur; empty tables keep their accessible caption/header.
- Three shrink/grow cycles per locale and stylesheet retain the same table identity, both duplicate-title rows and their order. The height sweep (650, 600, 590, 580, 560, 540, 520, 480, 400, 300, then 720) proves each bounded state still holds the header, a complete row and focus room; other states use whole-dialog fallback. Further observation finds no fallback-marker oscillation. The threshold follows current translated content, never a viewport-name breakpoint.
- While open, translation, 33→2→0→33 rows and 24px root typography trigger fresh allocation without stale bounds or lost content. Restoring typography/height restores bounded mode. Native Escape, scrim dismissal, Cancel and Confirm produce their separate outcomes; focus restores to the opener. Reopening and replacement through fresh lifecycle Subjects are exercised. Unit coverage additionally checks restoring pre-existing `overflow: clip !important` on close, replacement and unmount.
- Direct Dialog→Table in both extents, nested screen-extent Dialog, body-owned Dialog.Content, standalone Pane→Table and the existing Screen, Work Areas and Roster browser suites pass. Short/empty content remains naturally sized. No browser exceptions occur in the complete dialog matrix.

## Evidence and remaining work

Local artifacts are under `/tmp/ticket-154-evidence/`: `geometry.json` (197 checkpoints), `browser.log`, `styles*.png` (bounded viewports plus fallback start/end screenshots), `screen-final.log`, `work-areas-final.log`, `roster.log`, `focused-tests.log`, `tests.log`, `lint.log`, `typecheck.log`, `build.log` and `storybook-build.log`. Red runs preserve the original missing bound, missing whole-dialog fallback, background-scroll leak and clipped focus-ring reproductions. These are local artifacts, not uploaded attachments.

Independent review results follow below; publication belongs to the coordinator. The separate consuming application and its private theme/catalog were not changed or run; this report establishes the library's approved matrix with its shipped themes. Firefox/WebKit were not part of this Chromium matrix. No implementation acceptance gap remains after the recorded checks pass; release identification and consumer adoption remain after publication.

## Independent review — 2026-11-05

Pinned `git merge-base main HEAD` to **36ad968bcc08efcd9328e36d033d0dc869478cd8** and reviewed `git diff 36ad968bcc08efcd9328e36d033d0dc869478cd8...HEAD`, initially containing implementation commit **07ac047f77adaa8f2d25e5986fa1dee47b95d438**. Two parallel Codex reviewers assessed Standards and Spec independently. Both read the complete issue and approved Agent Brief; the Standards review covered all four files in `docs/agents/standards/`. The parent also assessed acceptance and ran the browser checks independently. Fallow's review brief informed inspection; its tooling advisories were not treated as confirmed defects.

### Standards

**0 confirmed findings, including no baseline smells requiring changes.** The closed public API, token styling, consumer wording, Subject ownership, component-local imports and release NOTE conform. The brief explicitly authorizes the composed browser regression seam. A second Standards pass cleared the replacement fix described below.

### Spec

**1 P1 finding, resolved: document scroll locking during sequential Dialog replacement.** The brief requires “Keep the background locked and preserve native modality” and preserving lifecycle behavior. Closing the current Dialog before opening a separately mounted replacement in the same synchronous turn obeyed the one-at-a-time precondition, but observer delivery could let the replacement save `hidden` before the previous Dialog restored the original overflow. That unlocked the open replacement and could leave the page permanently locked after closing.

The lock now owns one original overflow snapshot per document and retains it across pending observer handoffs. Closing the final presentation restores the original value and priority. No public API or simultaneous-dialog support was added. A regression test first failed through the public Subjects; actual Chromium then independently failed on the original hook with `auto !== hidden`. Both pass after the fix. The second Spec pass found no remaining gap in the fix.

`Layout/Dialog/Replacement` demonstrates the supported transition in both mounting orders. The browser regression performs three round trips, verifies exactly one open native modal, attempts background wheel scrolling after every replacement, and verifies restoration of `overflow: auto !important` plus working document scrolling after the final close.

### Verification and limits

- Lint, typecheck, all **65 test files / 1,492 tests**, package build and static Storybook build pass. Both review agents cleared the final code changes.
- The original Chromium matrix passed independently before the review fix. After rebuilding, the expanded final matrix passes **204 checkpoints**, repeating the full EN/DE, three-stylesheet, four-viewport, insufficient-height, resize/content/lifecycle and integration checks with the replacement regression first. Screen, Work Areas and Roster browser acceptance also pass against that final static build. No builds run during these final browser suites.
- Separate visual inspection in Orca's embedded browser confirmed the German 1280×720 bounded presentation and 1280×300 whole-dialog fallback. In fallback the dialog is 252px high with 1697px scroll height, Table is 1264px high with no independent scroll range or tab stop, its header is static, and document overflow remains hidden.
- New local evidence is in **`/tmp/ticket-154-review/`**: `replacement-red.log`, `replacement-browser-red.log`, `replacement-green.log`, `dialog-browser-final.log`, `final-browser/geometry.json`, bounded/fallback PNGs, `*-browser-final.log`, and final lint/typecheck/test/build logs. Orca screenshots are preserved as `orca-*.png`. These paths are local artifacts, not uploaded attachments.
- The separate Label Manager application, its installed theme and paired German catalog were not run. Full Firefox/WebKit matrices remain unverified. The supported library acceptance matrix uses consumer-owned verification wording and shipped styles.
- The registry still reports **4.1.0**; these local fixes are unpublished. Coordinator owns landing, publication and consumer adoption against the actual resulting release. GitHub project status was left unchanged under the dispatch's prohibition on GitHub posting.

Review totals: **Standards 0 (none); Spec 1 (worst: replacement lock race), resolved; no remaining confirmed findings.**
