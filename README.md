# @juwel-development/design-system

Shared design system: semantic colour tokens and React components, used across the
JuweL Development projects.

## Install

```bash
npm install @juwel-development/design-system
```

`react`, `react-dom` and `rxjs` are peer dependencies - the consumer provides them.

## Integration

Import the prebuilt library stylesheet once in the consuming application; this route
does not require Tailwind in the host:

```ts
import '@juwel-development/design-system/styles.css';
```

The JavaScript bundle injects no CSS; consumers that relied on automatic injection
must add the import above. It starts with `"use client"` for React server-component
hosts, and `sideEffects: ["**/*.css"]` preserves explicit CSS imports during tree shaking.

For the tokens-only route, the host must provide Tailwind v4 and scan the component
sources to generate their utilities. `tailwindcss` is an optional peer dependency
because only this route requires it:

```css
@import "@juwel-development/design-system/tokens.css";
```

Component APIs, usage guidance, and interactive examples live in Storybook.
Run `npm run storybook` to browse them.

## Theming

Colour is addressed by **role**, never by shade - `bg-primary`, `text-muted`,
`border-border`. No component contains a `dark:` class: `src/tokens.css` declares one
complete set of values under `:root` and another under `.dark`, so toggling that class
on an ancestor re-points every token underneath it.

A product re-themes the whole system by supplying its own values for the same role
names, which is what lets one design system serve several brands.

### Consumer-owned artwork size tokens

Consumers can declare their own size token for Figure's artwork presentation:

```css
.catalog {
	--catalog-artwork-size: 64px;
}
```

```tsx
<div className="catalog">
  <Figure
    presentation="artwork"
    size="--catalog-artwork-size"
    src="/illustration.svg"
    alt="An illustrated compass"
    width={600}
    height={300}
  />
</div>;
```

Declare a **positive definite CSS length** on the image or an ancestor; the library
supplies no consumer token names or fallback sizes. See **Display/Figure/Artwork** in
Storybook for the full API contract, intrinsic versus display dimensions, crop-control
restrictions, wrapping compositions and live token updates.

### Single-theme builds

`styles.css` and `tokens.css` carry both colour sets, so a product that ships only one
theme still emits a `.dark` block it can never remove. Two opt-in exports carry a single
theme's values in `:root` with no `.dark` block and no `dark:` variant:

```tsx
// a light-only product
import '@juwel-development/design-system/styles.light.css';
// a dark-only product
import '@juwel-development/design-system/styles.dark.css';
```

The tokens-only equivalents are `tokens.light.css` and `tokens.dark.css`. All three
stylesheet variants are prebuilt CSS requiring no Tailwind in the host; the tokens-only
variants retain Tailwind v4 directives (`@theme`, `@utility`, `@custom-variant`,
`@property`) and require a Tailwind v4 host. All colour sets come from the same
generated palette.

In 4.0.0, `--color-ring` is no longer read; themes that set it must set
`--color-focus-ring` instead.

### Changing the palette

`src/Theme/Palette.ts` is the single source of truth. `src/tokens.css` and its
single-theme siblings `tokens.light.css` and `tokens.dark.css` are generated from it:

```bash
npm run build:tokens
```

The generated files are committed, and a test pins each to the palette - editing the
palette without regenerating fails the suite rather than shipping stale colours.

#### Migrating a custom palette to the `scrim` role

`PaletteTokens` includes the required `scrim` role. A consumer that constructs its own
palette object of this type must add a `scrim` colour - an `rgb(r g b / a)` value whose alpha is
part of the role, `rgb(15 23 42 / 0.5)` being the shipped default. Spreading `light`/`dark` and
overriding stays valid unchanged, and a theme that only overrides the generated
`--color-*` custom properties in CSS inherits the new default without any change.

## Development

```bash
npm run storybook      # component workbench on :6006, with a light/dark switcher
npm run test           # vitest
npm run lint           # biome (use lint:fix to apply)
npm run typecheck      # tsc
npm run build          # library bundle + type declarations
```

The jsdom 31 test environment requires Node `^22.22.2 || ^24.15.0 || >=26.0.0`.
CI tests those exact minimum versions as well as the latest releases on the
Node 22, 24 and 26 lines.

jsdom's `@napi-rs/canvas` peer is optional and is not installed: the test suite
does not use canvas APIs and passes without it.

### Fallow

`npm run fallow:agent -- --base <commit>` reviews changes against a fixed commit.
Fallow 3.43.2 moved its type-aware analysis into the separate `fallow-type-aware`
companion. The lockfile refresh in #174 preserves `package.json`, so that companion
is not installed: the configured type-aware pass warns and falls back to syntactic
analysis. To get checker-backed results without changing the manifest or lockfile,
run the matching pair with an explicit companion path (npm otherwise prefers the
project's local Fallow executable):

```bash
npm exec --package=fallow@3.43.2 --package=fallow-type-aware@3.43.2 -- \
  sh -c 'FALLOW_TYPE_AWARE_BIN="$(command -v fallow-type-aware)" fallow review --brief --base "$1"' -- <commit>
```

### Structure

Components are grouped by what they do, one folder each:

```
src/<Category>/<Component>/<Component>.tsx
                           <Component>.stories.tsx
                           <Component>.spec.tsx
```

`Category` is `Arrangement`, `Interaction`, `Display` or `Layout`. Imports inside `src` are written
from the source root (`Interaction/Button/Button`), not relatively.

## Releasing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) - the type
prefix decides the next version, so `fix:` is a patch, `feat:` a minor, and a
`BREAKING CHANGE:` footer a major. A `commit-msg` hook checks this locally and CI
checks it again on pull requests.

Merging to `main` runs semantic-release, which works out the version from those
messages, writes `CHANGELOG.md`, tags the commit, publishes to npm and opens a GitHub
release with the generated notes. No version number is set by hand.

### Publishing a note

A commit body can carry a `NOTE:` footer, which puts a **consumer-facing note** into
`CHANGELOG.md` under its own `NOTE` heading. The version is unaffected - a `fix:` with a
note is still a patch - so a note never has to be dressed up as a breaking change to get
published:

```
fix(section): give the section a positioning context

NOTE: An absolutely-positioned descendant of a `Section` that used to anchor to an outer
ancestor now anchors to the section instead - silently, with no error.
```

Write one when a change alters how a consumer's existing code behaves **without** being a
breaking change: nothing they wrote stops compiling, but what it does is different. A note
is not a second subject line and not a place for implementation detail - it says what a
consumer has to know, in their terms. A commit carrying a note reaches the changelog
whatever its type prefix, so even a `chore:` can publish one.

One commit may carry several notes. Two rules keep them intact, both of them the commit
parser's: put a **blank line between notes**, or one of them is silently dropped, and keep
any `(#issue)` reference **off the last line of a wrapped note**, or the note is cut short
there and the reference is filed against the commit instead. Each note is published
prefixed with the commit's scope, so a commit whose notes span several components reads
better with no scope at all.

A real breaking change still uses `BREAKING CHANGE:`, and still forces a major. The two
keywords are not interchangeable, and the reason a third one cannot simply be added is in
the [architecture standard](./docs/agents/standards/architecture.md#release).
