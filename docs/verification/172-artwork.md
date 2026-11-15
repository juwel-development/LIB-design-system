# #172 Figure artwork — 2026-11-15

Authority: the latest [Agent Brief](https://github.com/juwel-development/LIB-design-system/issues/172#issuecomment-6900386783),
which supersedes the original fixed-size roster. Base: `be0effa`, including the approved
`CONTEXT.md`, ADR 0008 and `.out-of-scope/figure-width-role.md` amendments; all are preserved.
This is an implementation on `feature/ticket-172`, not a published capability or version.
The subsequent independent Codex review, fixes and fresh checks are recorded in
[172-review.md](172-review.md).

## Public contract

```tsx
<Figure presentation="artwork" size="--catalog-artwork-size"
  src="/illustration.svg" alt="An illustrated compass" width={600} height={300} />
```

The consumer declares `--catalog-artwork-size` on the image or an ancestor as a positive
definite CSS length. There are no library declarations, presets, computed-value validators
or invented fallback sizes. Both image dimensions bind directly to `var(<size>)`, so CSS
updates them live and any positive definite length can be used. This binding introduces
no reserved internal custom-property name that could collide with the consumer's name.

`ComponentProps<typeof Figure>` is a discriminated union: artwork requires a `--${string}`
size and excludes `ratio`/`focus`; framed Figure accepts those crop controls and excludes
size. Omission still selects framed behavior, with unchanged default markup, full width,
backing and cover fitting. No className/style passthrough was added. As with the existing
token-reference interfaces, malformed names throw a typed configuration error: the new
`FigureConfigurationError` is exported from the package entry point. Names are checked;
resolved values and declarations remain the caller's responsibility.

One image recipe selects the presentation. Artwork uses centered contain fitting, no
backing/frame/border/radius/mask, overrides preflight's maximum-width ceiling and cannot
flex-shrink. Caption and overlay wrappers size from the image's layout rather than
resolving its token again: a declaration on the image does not inherit upwards. Their
non-shrinking, start-aligned boxes avoid both holder expansion and flex cross-axis stretch.
The caption wraps below the square; the consumer's overlay remains unmodified in a
positioning context around the image. As before, the consumer positions its decoration
on its own element. Intrinsic width/height attributes, responsive delivery, priority,
decoding, alt (including empty alt), wrapper conditions and outermost testId are retained.

README documents the theme integration and consumer declaration. Storybook's
**Display/Figure/Artwork / Consumer Tokens** documents the full contract, with wrapping
rows, square/wide/tall transparent fixtures, caption/overlay examples and a live update.

## Tests and required checks

The public seams are the Figure props/DOM, its public error and the browser geometry/paint
specified by the brief. Type fixtures first failed on the absent presentation API and the
unexcluded crop controls. Seven malformed-name tests failed before validation was added.
The initial browser geometry was 640×320 where 32×32 was required. Later browser
regressions exposed a 1053px wrapper for an image-only token declaration and a 233.5px
stretched overlay context around a 128px image; both are fixed and covered by the runner.

The Figure spec passes **54 tests**, retaining all 39 existing tests and adding 15:
malformed names (including trailing line breaks), compile-time acceptance/rejection,
all four caption/overlay shapes, delivery/intrinsic/alt/test-hook preservation and retained
informative image identity when changing the selected token name. Geometry and painted
transparency are tested in the browser, not inferred from jsdom class strings.

| Command | Actual result | Local log |
| --- | --- | --- |
| `npm run lint` | Exit 0 | `/tmp/figure-172-lint.log` |
| `npm run typecheck` | Exit 0 | `/tmp/figure-172-typecheck.log` |
| `npm test -- src/Display/Figure/Figure.spec.tsx` | Exit 0; 54/54 | Terminal output |
| `npm test` | Exit 0; 66 files, 1575 tests | `/tmp/figure-172-tests.log` |
| `npm run build` | Exit 0; JS, three prebuilt stylesheets, declarations and delivery smoke checks | `/tmp/figure-172-build.log` |
| `npm run build-storybook` | Exit 0 | `/tmp/figure-172-build-storybook.log` |
| `node scripts/browser/figure-artwork.mjs` | Exit 0; 8 cases, 176 painted-pixel probes | `/tmp/figure-172-browser.log` |

The full suite emits an existing jsdom “navigation to another Document” diagnostic;
Storybook reports its existing missing-MDX/deprecation/build-size notices. Both commands
finish successfully. No nonzero final check remains.

## Real browser evidence

Reproduce with a running Orca desktop, Node, Python 3 and Pillow (11.3.0 used here):

```sh
npm run build
npm run storybook -- --ci --port 6172
node scripts/browser/figure-artwork.mjs
```

Optional `FIGURE_STORYBOOK_URL`, `FIGURE_EVIDENCE_DIR` and `ORCA_CLI_COMMAND` select the
server, evidence destination and session CLI. The runner drives only Orca's embedded
browser through the CLI; it does not launch an independent browser or another agent.
Runtime: macOS, embedded Chromium **150.0.7871.250**, 1100×1000 CSS-pixel viewport,
device scale 1. The final run was **2026-11-15 20:17:04–20:17:23 UTC**, with Storybook's
measured play finished successfully. No cross-engine claim is made.

Every case removes all Storybook styles and installs exactly one compiled stylesheet.
The raw result records its SHA-256, rule count and sole-stylesheet assertion. The host
cases use Vite/Tailwind to compile the matching source stylesheet, which imports the
exported token file and scans component sources, exercising the documented tokens route.

| Delivery | Themes checked | Result |
| --- | --- | --- |
| `styles.css` | light, dark | Pass |
| `styles.light.css` | light | Pass |
| `styles.dark.css` | dark | Pass |
| `tokens.css` + Tailwind host | light, dark | Pass |
| `tokens.light.css` + Tailwind host | light | Pass |
| `tokens.dark.css` + Tailwind host | dark | Pass |

In **every** delivery/theme case:

- Roomy and constrained flex rows measure exactly **32×32, 64×64, 128×128 and 93×93**.
  At 160px holder width, nowrap rows with 150px neighboring text and a 12px gap retain
  those extents under actual shrink pressure. The ordinary wrapping composition reflows
  the text. A 900px holder never expands the image. A deliberately insufficient 16px
  holder also preserves the extents; this checks fixed sizing, not a promise of fitting
  or avoiding overflow in an insufficient holder.
- The live token changes **64→117→64px**, preserving the same image DOM node. Changing
  the root font **16→28px** leaves 117px and all four selected pixel extents unchanged.
  The Storybook play separately clicks its React control, checks 117px and node identity,
  then restores 64px.
- Bare, captioned, overlay and caption-plus-overlay images all remain **128×128**.
  Their outermost elements also remain 128px wide under a nowrap 160px holder. Overlays
  have exactly the image's x/y/width/height, retain `aria-hidden` and their own absolute
  positioning. Captions have positive height, fit horizontally and start below the image;
  visual inspection confirms readable text on the light/dark theme surface. There is
  exactly one outermost hook and no invented image name. A second check declares the
  token **only on each image**, removes the ancestor declaration and uses ordinary block
  layout: all wrappers and overlay widths remain 128px.
- All images finish `decode()` with nonzero natural dimensions. Square 200×200, wide
  300×150 and tall 150×300 sources are loaded. Artwork has contain fitting, 50%/50%
  positioning, transparent computed backing, zero border/radius, no clip or mask and
  flex-shrink 0. The framed comparison remains **240×240**, cover/top and backed.
- **22 screenshot pixel probes per case** verify four red artboard-edge marks on each
  of the four wrapper examples (16 probes), transparent center openings and unpainted
  spare space around non-square sources (6 probes). A cover crop, shifted fitting or
  backing fails these painted-pixel checks. Pillow reads the PNG's embedded ICC profile
  into sRGB before comparing pixels; saved screenshots are unmodified.

Visual evidence, inspected directly: [light artwork](172-artwork/light.png) and
[dark artwork](172-artwork/dark.png). These show the four intact source edges, proportions,
checkerboard through transparent centers and contain margins, captions below the square,
unmodified overlay outlines, and the backed/default comparison.

Additional local artifacts in `/tmp/figure-172-browser/`:

- `results.json`: actual geometry, source dimensions, CSS/paint checks, token/holder/font
  changes, retained-node result and image-only-token wrapper measurements for all 8 cases.
- `commands.json`: Orca command results, including the initial accessibility snapshot.
- `styles-css-light.png`, `styles-css-dark.png`, `styles-light-css-light.png`,
  `styles-dark-css-dark.png`: prebuilt delivery screenshots.
- `tokens-css-Tailwind-host-light.png`, `tokens-css-Tailwind-host-dark.png`,
  `tokens-light-css-Tailwind-host-light.png`, `tokens-dark-css-Tailwind-host-dark.png`:
  token-route screenshots.
- `gallery.png`, `constrained.png`: overview and constrained composition screenshots.

One earlier optional `full-screenshot` attempt failed with Orca's “Unable to determine
full-page screenshot bounds”; the runner now captures viewport overviews and completes
with exit 0. This does not replace or suppress any geometry or pixel assertion.

## Remaining workflow

Independent Codex review and its fixes are complete; see [172-review.md](172-review.md).
Landing and normal release publication remain with the coordinator/maintainer.
No push, merge, release, version change or consumer-repository
edit was performed. The actual released version must be recorded after publication;
this implementation does not claim one.
