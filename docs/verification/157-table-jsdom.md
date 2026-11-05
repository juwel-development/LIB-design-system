# #157 Table compatibility with jsdom 29.1.1

Authority: [issue #157](https://github.com/juwel-development/LIB-design-system/issues/157),
its [independent triage verification](https://github.com/juwel-development/LIB-design-system/issues/157#issuecomment-6664609880),
and the implementation dispatch's explicit maintainer authorization. The historical no-dispatch
triage statement is superseded by that authorization. No GitHub posting or board changes were
performed by either worker. The independent review and its fresh evidence are recorded below.

## Diagnosis and correction

The issue's unchanged public reproduction fails against registry 4.2.0, whose gitHead is this
branch's baseline `ecc806205ee070a83fe572fdc57d63f4f5419ad1`. It mounts a content-note Table
after one userEvent click beneath 20 public Stack components and checks the cell's actual text.
Two initial runs failed the default 5,000 ms deadline, taking 9,860 and 9,411 ms for the test.

Ranked hypotheses were the unconditional inherited release-property read, repeated observer
measurements, and nested rendering/query cost. The first predicts that restricting the read to
bounded Tables makes this exact unbounded fixture pass without changing its composition or
observation. That is the only production change: `bounded &&` before the existing release read.
The missing private custom property's inherited resolution is expensive on jsdom 29.1.1;
unbounded overflow measurements do not need Dialog's bounded-release decision. They still measure
horizontal overflow and retain their normal focus and observer behavior. Bounded release,
restoration and focus-reveal paths retain their existing implementation.

This fixes the narrow library/runtime seam. It neither claims that all consumer CI failures had
this cause nor changes the consumer's source, packages, styles, domain fixtures or runner.

## Repeatable regression seam

`scripts/verify-table-jsdom.mjs` reads the unchanged fixture colocated at
`src/Display/Table/Table.jsdom29.spec.tsx.fixture`, creates a disposable standalone package, installs a specified
registry version or local package archive and runs the issue's exact test through the public
package entry point. It pins React/react-dom 19.3.1, Vitest 5.1.0, jsdom 29.1.1, Testing Library
React 16.3.3, user-event 14.6.8, Vite 8.3.5, plugin-react 6.2.1 and RxJS 7.8.2. Verification used
Node 26.13.0 and npm 11.20.0. The repository's normal jsdom 30.0.1 installation is untouched;
that suite alone cannot prevent a regression specific to 29.1.1. Run this compatibility check
when changing Table measurement behavior.

The Vitest configuration only selects the React plugin, jsdom and global lifecycle hooks for
Testing Library cleanup. It adds no stylesheet, computed-style mock, private-property value,
fake timer, timeout, retry, concurrency or runtime override. The 5,000 ms deadline stays in force.
The fixture SHA-256 is `5f11151804f1a2e0334ba1c2a5df08eec4fec67e58ae864cade8229971b6645a`:
both generated copies compare byte-for-byte with the issue. Their configuration is also identical,
and their lockfiles differ only in the root dependency pin and the design-system package record.
Both jsdom resolver files have SHA-256
`c07ce4083504534fac89947a329afc0545da5e3bf3e52e1a47393cf2924135cb`, matching triage.
Comparing the two installed packages' shipped source finds only the Table guard/comment change;
all three compiled stylesheets compare byte-for-byte unchanged.

From the repository root, with fresh output directories (the parent directory must exist):

```sh
mkdir -p /tmp/ticket-157-evidence
node scripts/verify-table-jsdom.mjs 4.2.0 /tmp/ticket-157-evidence/red
npm run build
npm pack --pack-destination /tmp/ticket-157-evidence
node scripts/verify-table-jsdom.mjs /tmp/ticket-157-evidence/juwel-development-design-system-4.2.0.tgz /tmp/ticket-157-evidence/green
```

The first command is expected to exit nonzero on the original timeout. The archive still carries
the checkout's 4.2.0 package version; it is a local corrected build, not a newly published release.
The harness rejects an existing explicit output directory: npm can otherwise retain a same-version
local tarball while changing the requested dependency back to the registry version, producing a
false green. Omitting the directory argument creates a fresh temporary directory automatically.
No installed consumer package is patched. Install time is separate from the test timings.

Recorded results (`runner-red.log`, `runner-green.log`, `green-serial.log`):

| Package / command | Result | Test duration | Entire Vitest run |
| --- | --- | --- | --- |
| Registry 4.2.0, first harness command above | FAIL: `Test timed out in 5000ms` | 8,503 ms | 10.44 s |
| Local archive, final harness command above | PASS | 2,950 ms | 7.58 s |
| Same local archive, serial repeat below | PASS | 332 ms | 2.44 s |

The serial repeat ran after the repository suite finished, before browser checks started:

```sh
cd /tmp/ticket-157-evidence/green
npm exec -- vitest run Table420Reproduction.test.tsx --reporter=verbose
```

The initial green overlapped repository checks; the serial result removes that competing work.
These timings are observations, not a new performance assertion or an acceptance deadline.

## Browser and repository gates

The composed checks reuse [#154's approved matrix](154-bounded-dialog.md) and existing browser
runners. The static Storybook build uses the corrected source; no build runs during browser checks.

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run build-storybook
python3 -m http.server 6157 --bind 127.0.0.1 --directory storybook-static
# Separate shell after the server is ready:
DIALOG_STORYBOOK_URL=http://127.0.0.1:6157 DIALOG_ARTIFACTS=/tmp/ticket-157-evidence/dialog npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/dialog.mjs
SCREEN_STORYBOOK_URL=http://127.0.0.1:6157 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen.mjs
SCREEN_STORYBOOK_URL=http://127.0.0.1:6157 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/work-areas.mjs
SCREEN_STORYBOOK_URL=http://127.0.0.1:6157 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/roster.mjs
```

Repository lint, typecheck, all **65 test files / 1,505 tests**, package build (including CSS/JS
delivery smoke checks) and static Storybook build pass. The focused Table/Dialog/Pane run passes
**127 tests**. No dependency manifest, lockfile, public export, prop, theme or consumer file changed.

The Chromium Dialog runner passes **204 checkpoints**, with no browser exceptions. It covers EN/DE
and isolated published `styles.css`, `styles.light.css` and `styles.dark.css` at 1920×1080,
1280×720, 1024×720 and 800×720, then insufficient-height fallback and restoration. The same
matrix exercises repeated shrink/grow, translated and short/empty/changing content, increased
typography, duplicate-row identity/order, bounded keyboard scrolling, focus preservation and reveal,
Escape/scrim dismissal, confirmation/cancellation, fresh Subjects and sequential Dialog replacement.
Direct Dialog/Table, nested screen extent, body-owned Content and standalone Pane/Table checks pass.

For example, the German 1280×720 default-stylesheet Dialog is 512×672, with a 239px Table viewport
scrolling 1,264px of content and `tabindex=0`; the Dialog has no scroll range. At 1280×300 the Dialog
is 512×252 with 1,697px of content, while Table's client/scroll heights are both 1,264px, overflow is
visible and its tab stop is absent. The entire task scrolls in Dialog, its background remains
locked, and growing the viewport restores bounded mode. The German bounded and fallback screenshots
were also inspected visually for the final rows, count, actions and complete focus ring.
The complete Screen, Work Areas and Roster browser runners also pass against that same static
build, including their delivered stylesheets, geometry, native keyboard and content-change checks.

Local evidence is retained under `/tmp/ticket-157-evidence/`: `published-420-red.log`,
`published-420-red-repeat.log`, `runner-red.log`, `runner-green.log`, `green-serial.log`,
`runtime-comparison.json`, `published-provenance.json`, `package-source-comparison.txt`,
both fresh harnesses (`red/`, `green/`), the local package archive,
`focused-tests.log`, `tests.log`, `lint.log`, `typecheck.log`, `build.log`, `pack.log`,
`storybook-build.log`, `dialog-browser.log`, `screen-browser.log`, `work-areas-browser.log`,
`roster-browser.log` and `dialog/geometry.json` plus screenshots.
These are local files, not uploaded attachments. The repo retains the runnable public fixture
beside Table; the `.fixture` extension keeps it outside the native suite's different jsdom runtime
without changing discovery or TypeScript configuration. The existing package exclusion for
`src/**/*.spec.*` also keeps it out of the published archive.

## Remaining ownership

The separate consumer application and its full normal CI remain downstream gates. Private consumer
themes/catalogs and Firefox/WebKit are outside the recorded Chromium/shipped-theme matrix.
Publication and adoption must identify the actual resulting release. This worker does not push,
merge, close the issue, publish, or self-review.

## Independent review — 2026-11-05

Pinned `git merge-base main HEAD` to **ecc806205ee070a83fe572fdc57d63f4f5419ad1** and
reviewed `git diff ecc806205ee070a83fe572fdc57d63f4f5419ad1...HEAD`, initially containing
implementation commit **3cb9f976ce6a8fcec66d96f22bff54d8c4d0c788**. Two parallel Codex
subagents independently reviewed Standards and Spec. Standards covered all four canonical files:
`coding.md`, `architecture.md`, `testing.md` and `design-system-components.md`. Spec covered the
complete issue and triage verification comment, with the later explicit "its ready now"
implementation authorization superseding historical no-dispatch language. No GitHub status was
changed because this dispatch prohibits GitHub posting.

### Standards

**1 low-priority finding, resolved; 0 remaining findings or actionable baseline smells.** The
regression fixture was embedded in a script, outside Table's directory, contrary to `coding.md`
Files and `testing.md` Location and naming. Its exact source now lives beside Table in
`Table.jsdom29.spec.tsx.fixture`; the runner reads it verbatim via `import.meta.url`. The extension
avoids accidentally running the foreign-runtime fixture under the native jsdom 30 suite, with no
discovery/configuration/dependency changes. Existing archive exclusions omit it. The Standards
reviewer inspected and cleared the concrete remedy.

### Spec

**0 confirmed findings.** The production guard is the minimum correction to the reproduced
unbounded measurement path. Both initial and observed measurements share it. Bounded release,
restoration, focus reveal and scroll ownership retain their implementation. No public API, theme,
consumer or dependency change was needed. The Spec reviewer also cleared the fixture extraction.

### Fresh independent runtime evidence

Fresh registry and archive harnesses ran sequentially using **Node 26.13.0 and npm 11.21.1**,
matching triage's tool versions. Both use jsdom **29.1.1** and the exact issue fixture (SHA-256
`5f11151804f1a2e0334ba1c2a5df08eec4fec67e58ae864cade8229971b6645a`). No repository
build/test jobs overlapped these test runs. Commands from the repository root:

```sh
mkdir -p /tmp/ticket-157-independent-review
npm exec --yes --package=npm@11.21.1 -- node scripts/verify-table-jsdom.mjs 4.2.0 /tmp/ticket-157-independent-review/red
npm run build
npm pack --pack-destination /tmp/ticket-157-independent-review
npm exec --yes --package=npm@11.21.1 -- node scripts/verify-table-jsdom.mjs /tmp/ticket-157-independent-review/juwel-development-design-system-4.2.0.tgz /tmp/ticket-157-independent-review/green
```

Registry 4.2.0 fails with `Test timed out in 5000ms`, test duration **7,832 ms**, entire run
**9.57 s**. The fresh local corrected archive passes, test duration **296 ms**, entire run
**2.03 s**. The archive retains version 4.2.0 and is unpublished. These are recorded observations,
not added timing thresholds. Fixture/config bytes match across runs; lockfiles differ only in
root/library records; all three shipped stylesheets match byte-for-byte. Installed source differs
only in `Display/Table/Table.tsx`; the archive still contains **165 files**, without the fixture.
Both jsdom resolver hashes match triage's `c07ce4083504534fac89947a329afc0545da5e3bf3e52e1a47393cf2924135cb`.
Registry metadata identifies the pinned base as 4.2.0's gitHead. Fresh local logs and comparisons
are retained under `/tmp/ticket-157-independent-review/`, separate from implementer evidence.

Fresh repository gates pass: `npm run lint`, `npm run typecheck`, `npm run test` (**65 files /
1,505 tests**), `npm run build` (including delivery smoke checks) and `npm run build-storybook`.
The browser runners use that completed static build, with no build running during browser checks:

```sh
python3 -m http.server 6257 --bind 127.0.0.1 --directory storybook-static
DIALOG_STORYBOOK_URL=http://127.0.0.1:6257 DIALOG_ARTIFACTS=/tmp/ticket-157-independent-review/dialog npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/dialog.mjs
SCREEN_STORYBOOK_URL=http://127.0.0.1:6257 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/screen.mjs
SCREEN_STORYBOOK_URL=http://127.0.0.1:6257 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/work-areas.mjs
SCREEN_STORYBOOK_URL=http://127.0.0.1:6257 npm exec --yes --package=playwright@1.64.1 -- node scripts/browser/roster.mjs
```

The complete Chromium Dialog runner passes **204 checkpoints**, with no browser exceptions. Its
EN/DE, three-stylesheet matrix covers four bounded viewports, insufficient-height fallback and
restoration, repeated resize/content changes, native keyboard scrolling, focus retention/reveal,
background locking, dismissal/actions and sequential Dialog replacement. Screen, Work Areas and
Roster also pass, including native keyboard scrolling, stable fallback ranges, focused-row identity
through release/restoration and pagination/filter restoration. Separate visual inspection confirmed the German 1280×720 bounded view and 1280×300
fallback: the former has a 239px Table viewport over 1,264px of content; the latter uses the
252px Dialog to scroll 1,697px, with Table expanded to 1,264px and no independent tab stop.
Final rows, warning, actions and the full focused action outline remain visible at the fallback
scroll end. Local screenshots and the complete geometry records are in `dialog/` beneath the
independent evidence directory.

The raw fixture preserves the issue's final blank line; Git's default whitespace check reports
only that intentional `blank-at-eof`. `git -c core.whitespace=-blank-at-eof diff --cached --check`
passes, and the issue/source/generated fixture hashes remain identical.

The first commit-hook rerun failed **3 default 5,000 ms deadlines / 1,502 passes** in otherwise
unchanged Link, H6 and Rule rendering tests (`commit.log`). None renders a Table. The earlier full
suite passed all 1,505 tests. A focused diagnostic invocation of those three unchanged files
passes **29 tests**, with no timeout/retry/concurrency/runtime overrides:

```sh
npm run test -- src/Interaction/Link/Link.spec.tsx src/Display/Typography/H6/H6.spec.tsx src/Display/Rule/Rule.spec.tsx
```

That failure is retained rather than attributed to Table or dismissed as proven machine load.
No source/configuration change or hook bypass addresses it; the normal commit gate is rerun in
full. `hook-failures-focused.log` retains the focused result. The public jsdom 29 red/green runs
completed before all repository/browser jobs and passed their original stated acceptance test
without reruns or concessions.

The subsequent unchanged commit-hook run passes lint, typecheck and **65 files / 1,505 tests**
again (**82.92 s** for Vitest; `commit-second.log`). Its later commit-message check rejected an
overlong body line; the message was wrapped and separately validated with commitlint. The next
normal attempt (`commit-final.log`) fails a different MultiSelect deadline, with **1,504 passes**;
the earlier three failures do not repeat. Required gates are retained. These alternating results
leave local native-suite timing stability unresolved; a passing run does not establish a cause
or waive the observed failures. Every attempt remains in the evidence directory.

The independent review does not establish Application adoption or normal downstream CI. The
reported broad consumer failure set remains unattributed; this fix addresses the reproduced
Table/runtime cost. Private consumer themes/catalogs, Firefox/WebKit, and subsequent published
release adoption remain separate gates. No consumer edits, push, merge, issue closure, release or
acceptance waiver occurred.

Review totals: **Standards 1 (worst: low-priority fixture location, resolved); Spec 0 (none);
no remaining confirmed findings.**
