# Design-system component-authoring standard

How every component in `@juwel-development/design-system` must be authored. Companion to the
[coding standard](./coding.md): that one governs all TypeScript; this one governs the components
themselves. It is prose + illustrative snippets — no real primitive is embedded as the reference.
`Button`, `Input` and `TextArea` are all covered by the [machine enforcement](#enforcement-scope),
and there are no open [deviations](#known-deviations).

## The stance

A design-system component exposes a **closed, curated surface** and styles itself through a
single [CVA](https://cva.style) recipe. Nothing about how it looks or what host attributes it
carries is open for a consumer to override — the component's props are its whole contract, spoken
entirely in design-system vocabulary.

1. **Fully-closed prop surface** — every prop is named explicitly. No `HTMLAttributes<>`
   extension, no `...rest`, no `className`/`style` passthrough.
2. **Design-system vocabulary only** — props take tokens and variants (`gap="medium"`), never raw
   values (`gap={16}`, `#ff0000`).
3. **Closed roster** — a genuinely new need becomes a new design-system component, never an
   ad-hoc styled element in an app slice.
4. **CVA is the styling engine** — one `cva()` recipe per component; components are `const`.

## 1. The prop surface is fully closed

A component declares **exactly** the props its role needs and nothing more. There is no escape
hatch onto the underlying element.

- **No `HTMLAttributes<>` / `ButtonHTMLAttributes<>` / … extension.** Inheriting a host element's
  attribute bag is the opposite of a curated API — it reopens the entire DOM surface.
- **No `...rest` spread onto the element.** The old forwarding convention (spread a caller's
  attributes straight through) is retired.
- **No `className` or `style` prop.** Styling is the component's own responsibility, expressed
  through its variants — a consumer cannot inject classes or inline styles.
- **`testId` replaces the passthrough.** The one host attribute a caller legitimately needs — a
  stable e2e hook — is a named, explicit prop mapped to `data-testid`:

  ```tsx
  <button data-testid={testId} className={button({ variant, size })}>
  ```

- **`children` is explicit** where content is rendered, omitted where it is not. No
  `PropsWithChildren` helper.
- **Interaction props are RxJS `Subject`s, suffixed `$`** — the component calls `.next()` on one
  and never subscribes to it. This is the house convention (see the coding standard's
  [Asynchrony](./coding.md#asynchrony)); `rxjs` is a peer dependency for it. Each is named per
  role: a Button has `onClick$`, a purely presentational primitive has none.

  ```ts
  onClick$?: Subject<void>   // not onClick?: React.MouseEventHandler
  disabled?: boolean
  ```

- **Accessibility props are named, never spread** — `ariaLabel` mapped to `aria-label` for the
  icon-only case, not an open `aria-*` bag.

The principle governs, not a blessed fixed set: each component declares only what its role needs,
nothing speculative, no catch-all.

## 2. Props speak design-system vocabulary

Every value a prop accepts is a **token or a variant name**, defined once in the component's
recipe. A prop never takes a raw hex, a pixel number, or free-form CSS.

```tsx
<Stack gap="medium" />     // ✅ a spacing token
<Stack gap={16} />         // ❌ a raw literal
```

Because the variant values live in the recipe and the prop type is *derived from* the recipe (see
below), a raw value is a **TypeScript error**, not merely a convention. That derivation is the
real guard — see the [enforcement note](#enforcement-scope) on why biome cannot
express "is this a token?".

## 3. The roster is closed

The set of design-system components is a deliberate roster. When a slice needs something the
design system does not offer, the answer is to **add a component to the design system** — behind
the same closed, CVA-styled contract — not to hand-roll a styled `<div>` in the slice. A new
component is a design-system change, reviewed as one.

## 4. CVA is the styling engine

### One recipe per component

Exactly one `cva()` call per component: a base string, a `variants` map, and `defaultVariants`.
`compoundVariants` is reserved for genuine cross-variant cases. The old
`Record<Variant, string>` maps (a base/variant/size split assembled by hand) collapse into that
single recipe, and defaults move **out of the destructure and into `defaultVariants`** — the one
source the type also reads from.

```ts
import { cva, type VariantProps } from 'class-variance-authority'

const button = cva('inline-flex items-center justify-center rounded-md border font-medium', {
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground border-primary hover:opacity-90',
      secondary: 'bg-surface text-foreground border-border hover:border-muted',
    },
    size: {
      small: 'px-3 py-1 text-sm',
      medium: 'px-4 py-2 text-base',
    },
  },
  defaultVariants: { variant: 'primary', size: 'medium' },
})
```

Style with **semantic token utilities only** (`bg-surface`, `text-foreground`, …), never a raw
hex — that indirection is the whole point of the token layer: the same markup flips under `.dark`
because the utilities resolve to CSS variables the theme overrides.

### Props are derived, then intersected

The variant half of the props type is **derived** with `VariantProps<typeof recipe>` and
intersected with the hand-declared non-variant props. The design-system vocabulary is therefore
defined **exactly once** (in the recipe) and the type cannot drift from it. Deriving the variant
half does not violate "fully closed" — that rule is about no `...rest` and no `HTMLAttributes<>`,
which this does not reintroduce.

```ts
export interface IButtonProps extends VariantProps<typeof button> {
  children: React.ReactNode
  testId?: string
  onClick$?: Subject<void>
  disabled?: boolean
}
```

The props type is an **exported `interface` named `I<Component>Props`** (the coding standard's
[naming rule](./coding.md#naming)). It is exported from the component's **own module** so the
component, its spec and its stories can name it — not so it can be re-exported from the barrel.
See [The barrel carries components](#the-barrel-carries-components).

### No class-merge utility

**No `cn`, no `tailwind-merge`, no `clsx`.** With no `className` passthrough and no `...rest`, the
recipe is the only source of classes and `cva()` already composes base + variants — there is
nothing to merge and no conflicting-class problem to solve. Apply the recipe **straight to
`className`**:

```tsx
export const Button: FunctionComponent<IButtonProps> = ({
  variant,
  size,
  children,
  testId,
  onClick$,
  disabled,
}) => (
  <button
    type="button"
    className={button({ variant, size })}
    data-testid={testId}
    onClick={() => onClick$?.next()}
    disabled={disabled}
  >
    {children}
  </button>
)
```

A component that renders two elements simply applies each element's own recipe to its own
element — still no merge helper.

> Note that a component's own `className={recipe({ … })}` on the element it renders is
> legitimate and expected. The ban in §1 is on accepting a `className` **prop** from a consumer,
> not on the component setting its own class.

### Components are `const`

Every design-system component is a `const` arrow function (the coding standard's
functional-components rule; `const` is the design-system convention). The recipe is a
module-level `const` above it.

### The barrel carries components

`src/index.ts` is the package's only entry point — `package.json` declares no subpath exports, so
`dist/types/index.d.ts` is the whole published type surface. The barrel exports **the component,
never its props interface**:

```ts
export type { IFigureProps } from 'Display/Figure/Figure'   // ❌ not the barrel's job
export { Figure } from 'Display/Figure/Figure'              // ✅ one line per component
```

A consumer that needs to name the type of a prop it forwards **derives it from the component** —
`ComponentProps<typeof Figure>` — which reads the same contract without a second name to keep in
step. Re-exporting the interface adds a second public name for one thing, and the barrel is
already the place where per-component noise compounds fastest.

The non-component types the barrel does carry earn their line by being values a consumer
**constructs**, not props it passes: the theme contract (`PaletteTokens`) and behavioural unions
(`FormState`). A props interface is neither.

## Compound components

A few roles are not one element but a small set the consumer composes — a `Table` of `Root`, `Head`,
`Body`, `Footer`, `Row`, `HeaderCell` and `Cell`. Such a component ships as a **namespace**: one
roster entry, one directory, one module, exported from `src/index.ts` as a single `const` object
whose members are the sub-components (`export const Table = { Root, Cell, … } as const`). It is one
entry in the barrel, not seven.

The rules above still hold, per member:

- **One recipe per painting member.** A member that paints owns exactly one `cva()` recipe, like any
  primitive. A member that renders an **unstyled structural element** — a `thead`, a `tbody` — carries
  no recipe. A single member may style descendants it owns through its one recipe's selectors (a
  `Root` styling its `caption` and the row rules from the table wrapper) rather than reaching for a
  second recipe.
- **The namespace is one module talking to itself.** No member imports another primitive, and the
  members do not import each other across files — they are declared together in the one module. The
  [architecture standard's](./architecture.md) import test still passes: the directory could be
  deleted without touching another component.
- **Each member's props type is an `I<Namespace><Member>Props` interface** (`ITableRootProps`,
  `ITableCellProps`), declared under the same [props rule](#props-are-derived-then-intersected) as any
  other component's — the variant half derived from that member's recipe where it paints. Sibling
  structural passthroughs of the same shape may share one section props type. Every member declares
  its own `children`; **no `PropsWithChildren`**.

The prop surface stays fully closed at every member: no `className`, no `...rest`, no `HTMLAttributes<>`
— the machine enforcement in [§ Enforcement scope](#enforcement-scope) runs on each member's file
exactly as it does on a single-element primitive.

## Enforcement scope

`class-variance-authority` is a **runtime dependency** of `@juwel-development/design-system` — it
ships to consumers, not just to the build. The machine enforcement below is on for every component
in `src/`: there is **no exemption list and no grandfathering**, and a newly authored primitive is
enforced from its first commit. `npm run lint` runs it, and so does the `pre-commit` hook.

What is machine-enforced (in `biome.json`) versus reviewed:

| Rule | Enforcement |
|---|---|
| No `HTMLAttributes<>` / `*HTMLAttributes<>` extension | **biome** — `noRestrictedTypes` |
| No `{...rest}` spread onto a host element | **biome** — `no-jsx-spread.grit` plugin |
| No `className` / `style` **prop** on a props type | **biome** — `no-classname-style-prop.grit` plugin |
| No raw non-token prop values | **CVA variant types** + review — biome has no token model |
| Closed roster | review — biome cannot see the consumers |
| No props interface in the barrel | review — biome cannot tell a props type from a theme type |

The two grit plugins are scoped to `src/**/*.tsx` and skip `*.stories.tsx`, where a story
legitimately spreads args into the component under demonstration.

The last three rules are stated as checkable rules in the
[coding standard](./coding.md#design-system-components), surfaced through the `/code-review`
Standards axis.

## Known deviations

**None.**

`Button` used to extend `PropsWithChildren` against §1. That was settled in favour of the standard:
`IButtonProps` now declares `children?: ReactNode` itself, §1 keeps its clause, and every primitive
declares `children` explicitly. There is no exemption to inherit and nothing here for a new component
to copy.

Two things read as deviations against the source of this standard but are **not**: interaction
props are RxJS `Subject`s here (§1, deliberate — `rxjs` is a peer dependency for it), and the props
type is an exported `I…Props` interface rather than an inline `type`.
