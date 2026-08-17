# User Personas

Who `@juwel-development/design-system` is built for. These personas are the north star for
scope decisions — when a trade-off is unclear, it is resolved in favour of the primary persona,
then sanity-checked against the secondary. `/to-spec` references them **by name**.

> **Provisional.** These were written when the agent tooling was set up, inferred from the package
> itself rather than from research: the consumers are the applications in this workspace, and the
> package is a small, deliberately closed component library with a token layer. Correct them as
> soon as they are wrong — a spec written against a wrong persona argues for the wrong feature.

## Primary — Dana, the Product Developer Consuming the Library

> _"Give me the button, let it match the app's theme, and don't make me fight it."_

**The developer building a product screen who installs this package.** Dana is the north star:
every API decision is made for her first.

- **Who she is** — builds React features in one of the `juwel-development` applications. Knows
  Tailwind and TypeScript well; has no interest in becoming an expert in this library.
- **What she's chasing** (in priority order):
  1. **A primitive that just works** — imports `Button`, passes the props her editor suggests,
     gets something that looks right in light and dark without a single style decision.
  2. **No surprises on upgrade** — a minor version never silently changes how her screens look.
  3. **An answer to "can I do X?"** in Storybook, in under a minute, without reading source.
- **Goals** — ship a screen that looks native to the product; theme the whole app by supplying
  palette values rather than overriding components one at a time.
- **Frustrations** — component libraries whose escape hatches (`className`, `...rest`) mean every
  team styles the same button five ways; props that take raw pixels and hexes, so nothing is
  consistent; a variant that exists but is documented nowhere.
- **What this means for the API** — the closed prop surface is *for her*. A prop she cannot pass
  is a decision she does not have to make, and the reason her screens match everyone else's.

## Secondary — Tomas, the Design-System Maintainer

> _"One place to change it, one place to check it didn't break anything."_

**The person adding a primitive or moving the palette.** Works inside this repository.

- **Who he is** — owns the roster and the token layer; reviews requests from product teams.
- **Goals** — add a component without inventing a new pattern; re-theme by editing `Palette.ts`
  and regenerating; know from the suite that a change is safe to publish.
- **Frustrations** — a colour that turned out to be hardcoded in three components; a "small"
  prop addition that reopens the whole DOM surface; a standard nobody can check mechanically.
- **What this means for the API** — the token pipeline, the generated `tokens.css` pinned by a
  test, and the biome/grit enforcement exist for him.

## Considered, not served

- **A consumer wanting to restyle a primitive from outside.** Explicitly out of scope — that is
  what the closed surface refuses. The supported answer is a new variant in the recipe, or a new
  component on the roster.
- **Non-React consumers.** The package ships React components; the token stylesheet is usable on
  its own, but nothing else is designed for that.
