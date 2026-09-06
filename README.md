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

## Collection

`Collection` is a vertical group of freely composed items with internal hairlines and
open outer edges. The library owns spacing and separation; the consumer owns content,
arrangement and interaction.

```tsx
import { Collection, Link, Note, Stack } from '@juwel-development/design-system';

<Collection.Root>
  <Collection.Item>
    <Stack>
      <Link href={'/guide'}>Read the guide</Link>
      <Note color={'muted'}>Supporting information</Note>
    </Stack>
  </Collection.Item>
  <Collection.Item><Note>Freely composed content</Note></Collection.Item>
</Collection.Root>;
```

Both members accept only `children?: ReactNode` and `testId?: string`. Supply
`Collection.Item` children directly, through maps, or with conditional omissions.
The semantic list has no markers, horizontal indent, added focus stops or behavior.
An empty root renders no placeholder; a single item has no rule.

`--space-collection-item` names the vertical padding inside each item, defaulting to
`1em` above and below so it follows inherited type. This is a separate role from a
Stack's sibling gap or a Section's band: re-pointing it changes only Collection item
padding. It is declared in all three token stylesheets and accepts a nonnegative CSS
length. Hairlines use the existing `--color-border` role. There are no density,
padding or arrangement props; child components own their typography and wrapping.

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
