# Architecture standard

The structure of the `@juwel-development/design-system` codebase: what the package is, how it is
laid out, which way dependencies point, and where each concern lives.

## What this package is

**One published npm package, and nothing else.** No monorepo, no workspaces, no app. It ships
React primitives and the token layer they are styled against, ESM-only, with `react`, `react-dom`,
and `rxjs` as **peers** so a consumer deduplicates them.

That shapes every rule below: there is no application here to hold the composition, so the package
must be composable from outside without knowing anything about who consumes it.

## Two rules

1. **One public entry point.** `src/index.ts` is the only barrel in the repository. What it
   re-exports is the package's API; everything else is internal, whatever the file tree suggests.
2. **Dependencies point one way:** components → `Theme`. A component reads the token layer; the
   token layer never reads a component, and no component imports another component's internals.

**The import test:** could this file be deleted without touching `src/index.ts`, and does it import
nothing from a sibling component? If either answer is no, look again.

## Layout

```
src/
  index.ts                     the one public entry point
  styles.css                   the stylesheet consumers import
  tokens.css                   GENERATED from Theme/Palette.ts — never hand-edited
  Theme/
    Palette.ts                 the single source of truth for every colour
    renderTokens.ts            renders the palette into the tokens.css text
  <Category>/                  a grouping of related components: Display/, Interaction/,
                               Layout/ (owns a page job), Arrangement/ (owns an arrangement
                               and nothing else — see ADR 0008)
    <Component>/
      <Component>.tsx          the component and its one CVA recipe
      <Component>.spec.tsx     its tests, colocated
      <Component>.stories.tsx  its Storybook stories
scripts/
  build-tokens.ts              writes src/tokens.css via renderTokens
```

- **A component owns a directory.** Implementation, tests, and stories sit together, named after
  the component. A component with no story is not finished.
- **Categories are roles, not kinds.** `Interaction/` holds things a user acts on. Add a category
  when a second primitive genuinely shares a role — never a `components/` or `common/` bucket.
- **`Theme/` is the foundation.** It imports nothing from the rest of `src`.

## Imports are non-relative from `src`

`tsconfig.json` maps `"*": ["./src/*"]`, so a module is addressed by its path under `src`:

```ts
import { Button } from 'Interaction/Button/Button';   // ✅
import { Button } from '../../Interaction/Button/Button';   // ❌
```

Three tools have to agree on that mapping and all three read the tsconfig: `vite.config.ts` and
`vitest.config.ts` through `resolve.tsconfigPaths`, and `tsc` directly. A new path alias goes in
the tsconfig and nowhere else. Relative imports inside a single component directory
(`./Button`) are fine — that is one module talking to itself.

## The token layer

The one generated artefact in the repository, and the reason a component carries no `dark:`
classes:

```
Theme/Palette.ts  →  Theme/renderTokens.ts  →  src/tokens.css  →  Tailwind utilities
```

1. **`Palette.ts` is the source of truth.** Every colour, exactly once, as a plain hex, in two
   complete sets (`light` and `dark`) of the same **role** names.
2. **`renderTokens.ts` renders**, and is shared by the build script and the test that pins
   `tokens.css` to it — so a palette edit that was never regenerated fails the suite instead of
   shipping stale colours. Run `npm run build:tokens` after touching the palette.
3. **`tokens.css` is generated.** Never hand-edit it; biome excludes it and its header says so.
4. **Components ask for a role**, never a shade or a hex: `bg-primary`, `text-muted`. The `.dark`
   class re-points the variables underneath, so one set of classes serves both themes.

A new colour is a new **role** in `PaletteTokens` with a value in both sets — not a one-off hex in
a component, and not a numeric ramp step.

## The build

| Command | What it produces |
|---|---|
| `npm run build:tokens` | `src/tokens.css` from the palette |
| `npm run build:components` | `dist/design-system.js` — vite library mode, ESM only |
| `npm run build:types` | `dist/types/` — `tsc --emitDeclarationOnly` |
| `npm run build` | components + types (**not** tokens; regenerate those deliberately) |

`vite-plugin-lib-inject-css` puts the CSS import in the bundle; peers stay `external` in
`rollupOptions` so React is never bundled. `package.json#files` ships `dist` **and** `src`, minus
specs and stories — so a consumer can read the source of what it imports.

## Release

Commits are [Conventional Commits](https://www.conventionalcommits.org), enforced by commitlint on
`commit-msg`; semantic-release derives the version and changelog from them. The `pre-commit` hook
runs `npm run lint`, `npm run typecheck`, and `npm run test` — a commit that would fail CI does not
get made. **A `feat:` or `fix:` commit publishes a version**, so scope commits accordingly.

### The `NOTE:` footer

A commit body may carry a `NOTE:` footer. Its text is published to `CHANGELOG.md` under its own
`NOTE` heading, and the release type stays exactly what the commit's type prefix says it is — a
`fix:` carrying a note is still a patch. Write one for a change that **alters how a consumer's
existing code behaves without being a breaking change**: nothing they wrote stops working, but what
it does is different, and they would want to know before they debugged it themselves. A note is not
a second changelog subject and not a place for implementation detail. Any commit carrying a note
reaches the changelog regardless of its type — a `chore:` with notes publishes them and still bumps
nothing, which is how the notes deferred by #84, #87 and #81 were cleared.

One commit may carry several notes, subject to two rules the commit parser imposes: **a blank line
between notes**, without which one of them is silently dropped, and **no `(#issue)` reference on the
last line of a wrapped note**, which would truncate the note there and file the reference against
the commit instead. Both are cheap to obey and neither fails loudly, which is why they are written
down. Each note is also published prefixed with its **commit's** scope, so a commit whose notes span
several components — the catch-up commit above spans three — is better left scopeless.

**The guard, which is the sharp edge of this design.** The commit analyser and the notes generator
parse every commit *independently*, each with its own parser options. `NOTE` is a keyword of the
notes generator only, and the analyser's default rules promote to major when a commit has *any*
parsed note at all — so the note publishes precisely *because* the analyser cannot see it. The
consequence runs both ways: **any keyword added to the notes generator is invisible to versioning
by construction.** A keyword that should affect the version must never be added there alone.
Concretely, do not add the hyphenated `BREAKING-CHANGE` spelling to the notes generator: it would
publish a breaking-change note while shipping a patch. If that spelling is ever wanted, it belongs
in *both* plugins' parser options or in neither. The commit analyser's entry in `.releaserc.js`
carries no options at all, and that is load-bearing rather than incidental.

**Why the config is JavaScript.** The notes generator's entry carries a `writerOpts.transform`,
which JSON cannot hold, so `.releaserc.json` became `.releaserc.js`. That transform is a wrapper
around the preset's own: the copy of `conventional-changelog-angular` the generator loads (8.3.1,
nested inside the plugin — the copy hoisted to the root belongs to commitlint) titles *every* note
`BREAKING CHANGES` unconditionally, so without the wrapper a `NOTE:` footer would publish under a
breaking-change heading on a patch release. Version 9 of that preset uppercases the keyword itself
instead, in a `noteTitle` the wrapper is a backport of. **So before deciding the wrapper is dead
code, check which version the generator resolves** — `npm ls conventional-changelog-angular` — it
is a no-op only once that copy is 9 or newer.

`release-notes.spec.ts` pins all of the above by running both plugins over commit messages: what a
note publishes, what it does *not* bump, and that a commit with no footer renders byte-for-byte
what it rendered before any of this existed.
