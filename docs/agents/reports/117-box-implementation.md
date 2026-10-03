# Box implementation evidence

Date: 2026-10-03. Implemented by Claude Fable 5.1 as an Orca worker for
[#117](https://github.com/juwel-development/LIB-design-system/issues/117) against the approved
Agent Brief in the issue's triage comment, on branch `feature/ticket-117` cut from local `main` at
`3739997` (package 3.9.1). Nothing was pushed, merged, released or moved past **In Progress** on
the board; the `/code-review` step is a separate dispatch. The consumer context is
[g-label-manager #195](https://github.com/juwel-dev/g-label-manager/issues/195).

## Contract

The public barrel exports one roster entry, `Box`, under `src/Display/Box/`. Its props are
`children?: ReactNode`, `name?: string` and `testId?: string` - the closed interface the brief
names, with no `className`, `style`, host attribute bag, polymorphic element, size, width,
height or padding prop, heading slot or built-in Stack behaviour.

It renders one `div` from one variant-less CVA recipe: `surface`, `foreground` and a one-pixel
`border` hairline, inset on all four sides by the new `--space-box-inset` role, `min-width: 0` so a
flex or grid holder can shrink it, and `overflow-wrap: anywhere` (MultiSelect's idiom) so an
unbroken name breaks inside it. It sets no radius, shadow, height, width, max-width or overflow:
square corners and no shadow are the absence of those utilities, not literal resets, so the control
radius and the floating elevation stay with their own roles (ADR 0003, ADR 0012). With `name` it
carries `role="group"` and `aria-label`; without, it carries neither. The named branch keeps a
`div` with a justified `biome-ignore` rather than the `fieldset` the lint rule suggests, for the
reason MultiSelect recorded: a fieldset brings the UA's `min-inline-size: min-content`, which would
stop the box shrinking in a narrow holder, plus legend naming and a form-disabling model.

The consumer documentation is the [README section](../../../README.md#box) and the TSDoc on the
component. `CONTEXT.md`'s **Box** entry predates the work and matches what was built.

## Token contract

`--space-box-inset: 1em` is declared in `:root` of all three generated stylesheets
(`tokens.css`, `tokens.light.css`, `tokens.dark.css`), outside every `@theme` block, rendered from
a new `BOX_INSET` block in `src/Theme/renderTokens.ts` beside Collection's item padding. The
outputs were regenerated with `npm run build:tokens` and the pinning test in `Palette.spec.ts`
passes. The role is a nonnegative CSS length in `em`, so it tracks inherited type.

**Compatibility.** `PaletteTokens` gained no member: the inset is a CSS custom property with a
shipped default, so a consumer constructing its own palette object, spreading `light`/`dark`, or
overriding only `--color-*` properties in CSS compiles and renders unchanged. No existing
component, prop, token or default moved. The release type is a minor (`feat:`) with no breaking
marker.

## Test evidence

Every production slice followed a failing test. `Box.spec.tsx` was written first and failed on
the missing module; the `--space-box-inset` test in `renderTokens.spec.ts` failed on the missing
token; then the token block, the component and the barrel line were added and both went green.

`Box.spec.tsx` (10 tests) covers: the barrel export; children rendered unmodified and in order;
a named box found by `getByRole('group', { name })` with no heading rendered from the name; an
unnamed box with no `role`, `aria-label` or `aria-labelledby` and no `group` or `region` in the
tree; an empty box as an empty DOM element; no `tabindex` and `tabIndex === -1` named or not;
an `Input` and a `Button` inside a named box focusing, changing and emitting into their `Subject`
while a click on the box itself emits nothing; `testId` mapped to `data-testid` and absent
otherwise; the recipe reading `var(--space-box-inset)` (the one class assertion, pinning the token
contract because jsdom resolves no stylesheet - the rendered inset is measured below); and no
`dark:` class anywhere.

## Checks

| Check | Result |
|---|---|
| `npm run lint` | clean, 156 files |
| `npm run typecheck` | clean |
| `npm test` | 48 files, 866 tests passed |
| `npm run build` | components and types built |
| `npm run build-storybook` | built to `storybook-static` |

## Browser evidence

Measured in Chrome (DevTools MCP) against the static Storybook build served on `127.0.0.1:6117`,
viewport 1400×900, through `getBoundingClientRect` and `getComputedStyle` on the rendered box -
never through class assertions. The narrow holder is an 18rem story decorator inside the wide
viewport, so viewport-based behaviour cannot satisfy the check.

| Story | Holder | Box width | Height | Padding | Border | Radius | Shadow | Overflow |
|---|---|---|---|---|---|---|---|---|
| Narrow (light) | 288px | 288px | 205.1px | 16px ×4 | 1px solid `#e2e8f0` | 0 | none | `scrollWidth ≤ clientWidth` |
| Narrow (dark) | 288px | 288px | 205.1px | 16px ×4 | 1px solid `#334155` | 0 | none | same |
| Empty (light / dark) | 968px | 968px | 34px | 16px ×4 | 1px | 0 | none | same |
| Short | 968px | 968px | 61.2px | 16px ×4 | 1px | 0 | none | same |
| Long (light / dark) | 968px | 968px | 142.8px | 16px ×4 | 1px | 0 | none | same, 4 wrapped lines |
| Stack + heading + facts (dark) | 968px | 968px | 470.1px | 16px ×4 | 1px | 0 | none | same |
| Inset re-pointed to `3em` (light / dark) | 968px | 968px | 125.2px | **48px ×4** | 1px | 0 | none | same |

Findings: the box edge never leaves its holder (`fits` true for every story, border and padding
inside the allocated width); the unbroken name in the narrow story wraps onto three lines and its
line boxes stay inside the padding edge; height is content-driven (34px empty → 61px one line →
143px four lines → 470px with the facts); surface, text and border resolve to the light and dark
palette values under the `.dark` class; `border-radius` is `0px` and `box-shadow` is `none` in
both themes; and the computed `--space-box-inset` reads `3em` under the override wrapper with the
padding moving to 48px while every other value stays put - no prop and no component CSS override.
The named stories expose `role="group"` with `aria-label="Selected artist"`, the unnamed ones
expose no role; no story adds a `tabindex`.

## Limitations

- The inset override is demonstrated by a story decorator setting the custom property on a
  wrapper, standing in for a consumer theme; a consumer's own stylesheet does the same thing.
- `overflow-wrap: anywhere` is inherited by descendants that do not set their own; content with
  its own sizing or overflow contract keeps that responsibility, as the README states.
- Publication is deferred to the normal release process; the released version is not known here
  and has not been recorded in consumer #195.
