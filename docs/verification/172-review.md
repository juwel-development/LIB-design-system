# #172 independent Codex review — 2026-11-15

Reviewed implementation commit `ae3b09b` against the pinned merge-base of `main` and `HEAD`,
`be0effae1683a81a5ff2e89c95cbd61149951507`, using
`git diff be0effae1683a81a5ff2e89c95cbd61149951507...HEAD`.
Authority: the latest [Agent Brief](https://github.com/juwel-development/LIB-design-system/issues/172#issuecomment-6900386783)
and the approved #172 amendment to ADR 0008. The ADR, glossary and narrowed rejection
record are preserved. Two separate Codex agents reviewed Standards and Spec in parallel;
the review owner independently checked the built API and reran browser acceptance.

## Standards

Three confirmed findings, all resolved:

1. README duplicated detailed component API and behavior, contrary to
   `architecture.md` / Layout. Reduced it to consumer token integration and a Storybook
   pointer; Storybook retains the complete contract and examples.
2. `IFigureProps` needs a discriminated union to require artwork sizing and exclude
   crop controls, while the documented rule required an interface. Recorded the narrow
   Figure exception in `coding.md` and `design-system-components.md`, preserving the
   spec's typed restrictions. Removed unnecessary branch-interface exports; both stories
   now derive their presentation props from `ComponentProps<typeof Figure>`.
3. The expanded positioning-context comment exceeded `coding.md`'s four-line budget.
   Reduced it to three lines, preserving the measured image-only-token explanation.

The Standards agent rereviewed the fixes and confirmed all three resolved with no new
finding. No additional smell-baseline finding was justified. The public configuration
error follows the existing error-export exception; no props enter the package barrel.

## Spec

Zero confirmed implementation findings. The independent Spec agent inspected the latest
brief, implementation, tests, stories, raw original browser measurements and both images.
It confirmed all implementation acceptance criteria and identified one optional evidence
improvement: measure text reflow explicitly instead of relying on its screenshot.

Added reflow geometry assertions to the browser runner: at 640px the neighboring text
starts beside the 128px image; at 220px it starts below the image with a 12px gap. Text
has positive height and no horizontal overflow. Also measured positive definite token
values `2.5rem`, `7.25em`, `calc(50px + 9px)` and `10vw`, producing square extents
40, 116, 59 and 110px respectively at the recorded viewport and 16px inherited font.
The expressions are consumer CSS declarations; the prop still accepts a token name only.

## Built API and default compatibility

Checked the built JavaScript with React server rendering against Figure transpiled from
the pinned base. All **3,528 omitted-presentation markup comparisons match byte for byte**:
caption absent/empty/present; overlay absent/null/false/true/zero/text/element; all six
ratio states and seven focus states including null/undefined; priority; responsive delivery.
This also covers empty alt, wrapper placement and the outermost test hook. Default styling
and delivery behavior remain covered by the retained Figure tests and browser comparison.

The built bundle renders artwork with intrinsic width/height, a token-bound square,
contain/center fitting, lazy loading and async decoding. A malformed name throws the
configuration error imported from the built package's public entry point.

Compiled a consumer fixture against `dist/types/index.d.ts`, deriving props from the
exported Figure. Three valid forms passed (artwork, omitted presentation, explicit framed).
Ten `@ts-expect-error` cases were all required: absent artwork size, number, raw length,
expression, crop ratio, crop focus, default-presentation size, style, className and absent
alt. The public error class was constructible. The compiler reported zero diagnostics.
Actual output: `/tmp/figure-172-review-api.log`.

## Checks

| Command | Actual result | Log |
| --- | --- | --- |
| `npm run fallow:agent -- --base be0effae1683a81a5ff2e89c95cbd61149951507` | Exit 0; advisory findings inspected, public error export intended | Initial review terminal output |
| `npm run lint` | Exit 0 | `/tmp/figure-172-review-lint.log` |
| `npm run typecheck` | Exit 0 | `/tmp/figure-172-review-typecheck.log` |
| `npm test` | Exit 0; 66 files, 1575 tests | `/tmp/figure-172-review-tests.log` |
| Focused Figure tests, independently run by both review agents | Exit 0; 54/54, retaining 39 prior tests | Review agents' terminal output |
| `npm run build` | Exit 0; JS, all three compiled stylesheets, declarations and delivery checks | `/tmp/figure-172-review-build.log` |
| `npm run build-storybook` | Exit 0 | `/tmp/figure-172-review-storybook.log` |
| `FIGURE_EVIDENCE_DIR=/tmp/figure-172-review-browser node scripts/browser/figure-artwork.mjs` | Exit 0; 8 delivery/theme cases, 176 pixel probes | `/tmp/figure-172-review-browser.log` |
| `git diff --check` | Exit 0 | Review terminal output |

The full suite retains its existing jsdom navigation diagnostic. Storybook retains its
missing-MDX/deprecation/chunk-size notices; neither causes a failed check. Making the
branch interfaces local initially exposed a story import during typecheck; both stories
were corrected to derive props, then the complete check sequence passed.

## Browser evidence and acceptance coverage

Fresh Orca embedded Chromium execution uses a 1100×1000 viewport at scale 1. The committed
[measurement summary](172-review.json) records the runtime, start/end times, stylesheet
hashes, reflow measurements and extra length cases. Complete raw commands, geometry and
eight screenshots are in `/tmp/figure-172-review-browser/`.

All eight cases pass: `styles.css` light/dark, `styles.light.css` light,
`styles.dark.css` dark, and the matching three token exports compiled by the Tailwind host
(both themes for `tokens.css`). Each removes Storybook styles and installs exactly one
stylesheet, so source styling cannot hide a broken compiled delivery.

| Acceptance requirement | Independently verified evidence |
| --- | --- |
| Existing default contracts | 3,528 identical markup comparisons; retained tests; loaded 240px backed cover/top browser comparison |
| Closed token API and malformed names | Built declaration fixture, public error smoke check, 54 Figure tests |
| Declaration responsibility and unresolved tokens | Storybook documents positive definite lengths, no value validator or invented fallback; production binds directly to `var(size)` |
| 32/64/128px in roomy and constrained flex layouts | Exact square dimensions; 160px nowrap holder with 150px neighbor supplies shrink pressure; 900px holder never expands images |
| Fourth value, live update, node identity and root font | 93px fourth token; live 64→117→64px without replacing image; 16→28px root leaves pixel extents unchanged; four additional CSS lengths |
| Complete source, transparency and delivery themes | Loaded 200×200, 300×150, 150×300 sources; contain/center and transparent backing; four edge pixels per wrapper plus center/spare-space paint probes, 176 total |
| Caption and overlay wrappers | All four shapes stay 128px under flex pressure and image-only token declaration; captions below, readable and within width; overlays match image rectangles and retain consumer attributes |
| Alt and outermost hook | Empty alt for decorative images; informative alt unchanged; no invented label/title; one outermost hook; DOM tests check unchanged consumer overlay markup |
| Documentation and reflow | Full Storybook declaration/usage/intrinsic distinction/crop restrictions; fresh measured text reflow and inspected light/dark screenshots |
| Required checks and decision records | Green results above; approved ADR, glossary and rejection amendment preserved |
| Publication | Deferred to coordinator; no release or containing-version claim |

Viewed the fresh [light](172-artwork/light.png) and [dark](172-artwork/dark.png) captures:
all source edges remain visible, checkerboard shows through centers and contain margins,
captions remain readable and overlays align with the square. Fresh files have the same
SHA-256 hashes as these committed captures, recorded in the measurement summary.
No cross-engine claim is made.

Standards: 3 findings resolved; the props-contract exception was the largest standards
issue. Spec: 0 confirmed findings; the reflow measurement gap was strengthened.
Coordinator landing and normal publication remain; no pushes, merges, releases, consumer
changes or version changes were performed by this review.
