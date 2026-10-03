# @juwel-development/design-system

Shared design system: semantic colour tokens and React components, used across the
JuweL Development projects.

## Install

```bash
npm install @juwel-development/design-system
```

`react`, `react-dom` and `rxjs` are peer dependencies - the consumer provides them.

## Integration

Import the library stylesheet once in the consuming application:

```ts
import '@juwel-development/design-system/styles.css';
```

If the host already imports Tailwind and only needs the tokens:

```css
@import "@juwel-development/design-system/tokens.css";
```

Component APIs, usage guidance, and interactive examples live in Storybook.
Run `npm run storybook` to browse them.

## DefinitionList

`DefinitionList` is a typeset list of terms and their descriptions whose rules are the
layout. `Root` renders the `dl`, `Item` the grouping `div`, `Term` a `dt` and
`Description` a `dd`; the consumer composes the four and owns every word.

```tsx
import { DefinitionList } from '@juwel-development/design-system';

<DefinitionList.Root density={'compact'}>
  <DefinitionList.Item>
    <DefinitionList.Term>Genre</DefinitionList.Term>
    <DefinitionList.Description>Folk</DefinitionList.Description>
  </DefinitionList.Item>
  <DefinitionList.Item>
    <DefinitionList.Term>Royalty</DefinitionList.Term>
    <DefinitionList.Description>12 %</DefinitionList.Description>
  </DefinitionList.Item>
</DefinitionList.Root>;
```

`Root` takes `density?: 'comfortable' | 'compact'` beside `children` and `testId`; the other
members take only `children` (and `testId` on `Item`). The resolved density is stated on the
`dl` as `data-density`.

- **`comfortable`** (the default) is unchanged: terms at the subtitle role, descriptions body and
  muted, capped at `--measure`, and two columns with a fixed term track from a 64rem *viewport*
  upward. It is the glossary treatment.
- **`compact`** is the fact-list treatment for short labelled values in a panel or a content
  Dialog. Terms take the label role in the secondary family, muted, as a Table labels a column;
  descriptions take the small role, foreground, with tabular figures, still capped at `--measure`,
  and wrap an unbroken value inside their column. Its two proportional (1:2) columns key on the
  width of the list's own *container*: a single column with the term above its value below a 24rem
  container, two baseline-aligned columns from there upward, whatever the viewport is doing.

Density here changes typography, which Table's does not: Table's type is already at the small
role, so its compact varies padding alone, while a comfortable term's subtitle role is itself the
room compact removes. Choose by what the list holds, never by how much air a page wants.

A compact list sizes from its holder, so give it one with a definite inline size: a block, a grid
track, a Dialog's content region. In a shrink-to-fit frame that sizes from its content, an
inline-size container contributes no width of its own.

`--space-definition-item` (`1.5rem`) and `--space-definition-item-compact` (`0.5rem`) name the
vertical padding inside an item at each density, in rem like Table's cell padding. Both are
declared in all three token stylesheets and accept a nonnegative CSS length; re-pointing one moves
only that treatment. Hairlines use the existing `--color-border` role, column gaps the existing
`--space-stack` and `--space-region` roles. There is no size, measure or column prop.

## Theming

Colour is addressed by **role**, never by shade - `bg-primary`, `text-muted`,
`border-border`. No component contains a `dark:` class: `src/tokens.css` declares one
complete set of values under `:root` and another under `.dark`, so toggling that class
on an ancestor re-points every token underneath it.

A product re-themes the whole system by supplying its own values for the same role
names, which is what lets one design system serve several brands.

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
variants are generated from the same palette, so they cannot drift.

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
