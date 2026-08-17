# Coding standard

How we write TypeScript. Companion to the [architecture standard](./architecture.md): that one
says *where* code lives, this one says *how* it reads. Component authoring has its own, stricter
standard on top of this one — see [design-system-components.md](./design-system-components.md).

## The stance

1. **Immutable by default** — produce new data, don't mutate.
2. **Behaviour lives in a named thing** — a component, a module-scope function, or a class where
   there is genuinely state to own. No logic inlined into a JSX attribute beyond a one-liner.
3. **Composed, not inherited** — small single-responsibility units wired together. The only
   `extends` allowed is a custom error on `Error`.

This package is React and data: today its behaviour is components, pure render helpers, and the
palette. **Classes are for state with invariants to protect**, not a default wrapper around a
function — a `static`-only class holding two pure helpers is worse than the two functions.

## Linting and formatting

Biome does both.

```bash
npm run lint      # biome check .        — the gate; the pre-commit hook runs it
npm run lint:fix  # biome check --write .
```

`noConsole` is an **error**: a library never writes to a consumer's console. `src/tokens.css` is
excluded because it is generated.

## Interfaces and types

- **`interface` = behaviour** (a role like `IClock`) — with one exception below.
- **Props are the exception**: a component's props type is an `interface` named
  `I<Component>Props`, exported alongside the component. It is a data shape, and it is the one
  data shape that has to be part of the public API.
- **Interfaces are prefixed `I`** — `IClock`, not `Clock`. The name still reads as a capability.
- **Enums are prefixed `E`** — `EDirection`, not `Direction`.
- **Consumers own boundary interfaces** — a consumer declares the interface for what it needs and
  uses only that.
- **`type` is file-local** — a helper inside one file, never exported — except a public data shape
  the API must name (`PaletteTokens`), which is exported from `src/index.ts` like any other API.
- **One export per file**, named after it — plus its props interface where it has one. **No
  barrels** except `src/index.ts`.
- **Interfaces and enums that are not props live in their own files**, named after them
  (`IClock.ts`, `EDirection.ts`).
- **Typing is explicit and enforced** — no implicit `any`; public APIs are annotated.
  `noUncheckedIndexedAccess` is on: an index read is `T | undefined` and must be narrowed.
- **Avoid `any` and `unknown`** — use a precise type. `unknown` only at a genuine untrusted
  boundary, narrowed immediately.
- **`verbatimModuleSyntax` is on** — a type-only import says `import type`.

## Immutability

- Data doesn't change once created; a change makes a new value.
- **Add, don't overwrite** — collections are immutable; operations return new ones.
- Mutation lives only inside the one unit that owns that state.

## Naming

Names replace comments.

- **No abbreviations** — full words. Only `id`, `url`, `min`, `max` allowed.
- **No noise words** — no `data`, `info`, `manager`, `helper`, `util`.
- Methods are verbs, classes/fields are nouns, booleans read as assertions (`isActive`).
- **Observable-valued props and fields end in `$`** — `onClick$`. See [Asynchrony](#asynchrony).

| Kind | Case | Example |
|---|---|---|
| Component | `PascalCase` | `Button` |
| Props interface | `I` + component + `Props` | `IButtonProps` |
| Other interface | `I` + `PascalCase` | `IClock` |
| Enum | `E` + `PascalCase` | `EDirection` |
| Function, field, local | `camelCase` | `renderTokens` |
| CVA recipe | `camelCase`, named for its component | `const button = cva(…)` |
| Global constant | `SCREAMING_SNAKE_CASE` | `GENERATED_HEADER` |
| Local constant | `camelCase` | `startingBudget` |
| File | matches its component, class, interface, or enum | `Button.tsx`, `IClock.ts` |
| Test / story | the component plus a suffix | `Button.spec.tsx`, `Button.stories.tsx` |

## Error handling

- **Throw for the impossible** — invariants, impossible states, programmer errors. Loud and early.
- **Return expected failure as data** — a normal outcome is not an exception.
- Errors are typed classes on `Error`.
- **Validate untrusted input at the boundary**; trust types inside.
- **Never swallow** — catch only to handle or rethrow with context.
- **A component does not report errors to the console** (`noConsole`); it renders the state, or the
  prop type makes the bad call impossible.

## Asynchrony

**RxJS Observables are the default** for anything async, streaming, or event-shaped — including
component interaction props. `rxjs` is a peer dependency for exactly this reason.

- **An interaction prop is a `Subject`, suffixed `$`** — `onClick$?: Subject<void>`, which the
  component calls `.next()` on. A consumer composes it with the rest of its streams instead of
  bridging a callback into them. This is a deliberate divergence from the React norm of a
  `MouseEventHandler` callback, and it is the convention here.
- The component **never subscribes to a prop it was handed** and never completes it — the
  subscriber owns teardown, and the owner of a `Subject` owns its lifetime.
- Observables and operators, not `.then()` chains.
- One-shot I/O may `await` internally but is exposed as an Observable across boundaries.

## Absence

- **`undefined`, never `null`.**
- Use `undefined` only when a value is **genuinely optional** (e.g. an optional React prop). If a
  value is needed, it's **required — never declared optional**.

## Comments

A comment is **load-bearing** or it goes. The test is to delete it: if a fact the code and the
docs cannot recover goes with it, keep it. Otherwise it was a second copy of something already
written down, and a second copy drifts.

- **Load-bearing means evidence** — the measurement behind a constant, the browser behaviour a
  workaround exists for, the alternative that was tried and abandoned. Facts nobody reading the
  code could derive. The note on `Button`'s recipe explaining why it carries no `dark:` classes is
  the shape to aim for.
- **Cite the standard, never restate it.** A rule that lives in `docs/agents/standards/` is named
  by file and section in one line, not re-explained in prose that will diverge from it.
- **Future work is a marker** — `// TODO(#43): …` on its own line, so it dies with the issue
  rather than rotting into prose.
- **Reach for the name first.** Where a comment would explain a member, rename the member.
- **TSDoc on the public surface is not a comment in this sense** — a `/** … */` on an exported
  component, prop, or token is API documentation, reaches the consumer's editor, and stays.

Budget, checked in review: a file header of at most 6 lines, any other block at most 4. Over
budget means the material must be reduced.

## Tests

- **Test-driven, always.** Write the failing test first, make it pass, then refactor
  (red → green → refactor). No production code without a failing test that demanded it.
- The full standard is [testing.md](./testing.md).

## Files

- **Group by feature, not by kind** — a component owns a directory; no `interfaces/`, `hooks/`, or
  `services/` bucket folders.
- **Tests and stories are colocated** with the component they cover, not in a parallel tree.
- **Imports are non-relative from `src`** — see the [architecture standard](./architecture.md).

## React

- **Functional components only**, declared as `const`.
- Components hold **display logic only** — anything with rules of its own lives in a function or
  class the component calls.
- **No hooks unless a component genuinely has local state or an effect.** Most primitives here are
  pure functions of their props and should stay that way.

## Design-system components

Every component follows the full [component-authoring standard](./design-system-components.md)
(closed prop surface, CVA styling, `const` components). Three of its rules are **review-checked**
because biome cannot express them; the rest are machine-enforced by `biome.json`.

- **No raw non-token prop values.** A prop takes a design-system token or variant name
  (`gap="medium"`), never a raw literal (`gap={16}`, `color="#ff0000"`). The real guard is the
  CVA variant types — the values live once in the recipe, so a raw value is a TypeScript error —
  but check it in review because biome has no token model. **Good:** `<Stack gap="medium" />`.
  **Bad:** `<Stack gap={16} />`.
- **Closed roster.** A new UI need becomes a **new component in this package** behind the same
  closed, CVA-styled contract — never a hand-rolled styled `<div>`/`<button>` in a consumer.
  Biome cannot see the consumers, so review catches ad-hoc styled elements there.
- **The barrel exports components, not props interfaces.** `src/index.ts` gets one line per
  component; `I<Component>Props` stays in the component's own module and a consumer derives it
  with `ComponentProps<typeof Component>`. **Good:** `export { Figure } from 'Display/Figure/Figure'`.
  **Bad:** an accompanying `export type { IFigureProps } from 'Display/Figure/Figure'`.
