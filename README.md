# @juwel-development/design-system

Shared design system: semantic colour tokens and React components, used across the
JuweL Development projects.

## Install

```bash
npm install @juwel-development/design-system
```

`react`, `react-dom` and `rxjs` are peer dependencies - the consumer provides them.

## Usage

```tsx
import { Button } from '@juwel-development/design-system';
import '@juwel-development/design-system/styles.css';
import { Subject } from 'rxjs';

const save$ = new Subject<void>();

<Button variant={'primary'} onClick$={save$}>Save</Button>;
```

Components take a `Subject` rather than a callback, so a click is an event stream the
consumer composes with the rest of its reactive code.

If the host already imports Tailwind and only wants the palette, take the tokens alone:

```css
@import "@juwel-development/design-system/tokens.css";
```

## Theming

Colour is addressed by **role**, never by shade - `bg-primary`, `text-muted`,
`border-border`. No component contains a `dark:` class: `src/tokens.css` declares one
complete set of values under `:root` and another under `.dark`, so toggling that class
on an ancestor re-points every token underneath it.

A product re-themes the whole system by supplying its own values for the same role
names, which is what lets one design system serve several brands.

### Changing the palette

`src/Theme/Palette.ts` is the single source of truth. `src/tokens.css` is generated
from it:

```bash
npm run build:tokens
```

The generated file is committed, and a test pins it to the palette - editing the
palette without regenerating fails the suite rather than shipping stale colours.

## Development

```bash
npm run storybook      # component workbench on :6006, with a light/dark switcher
npm run test           # vitest
npm run lint           # biome (use lint:fix to apply)
npm run typecheck      # tsc
npm run build          # library bundle + type declarations
```

### Structure

Components are grouped by what they do, one folder each:

```
src/<Category>/<Component>/<Component>.tsx
                           <Component>.stories.tsx
                           <Component>.spec.tsx
```

`Category` is `Interaction`, `Display` or `Layout`. Imports inside `src` are written
from the source root (`Interaction/Button/Button`), not relatively.

## Releasing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) - the type
prefix decides the next version, so `fix:` is a patch, `feat:` a minor, and a
`BREAKING CHANGE:` footer a major. A `commit-msg` hook checks this locally and CI
checks it again on pull requests.

Merging to `main` runs semantic-release, which works out the version from those
messages, writes `CHANGELOG.md`, tags the commit, publishes to npm and opens a GitHub
release with the generated notes. No version number is set by hand.
