---
status: accepted
---

# One radius token, for the corner every control shares

The library declares one non-colour radius token — `--radius-control`, defaulting to `0.5rem` — and
every control styles its corners from it, read from the **base** of the component's recipe so no
variant can disagree. It carries no value constraint. The token exists for the reason the motion
token does ([ADR 0001](./0001-motion-token-contract.md)): the value already lived in the component
as a hard-coded `rounded-lg`, and the component-authoring standard forbids a `className`
passthrough, so a consumer had no name to reach in and move it.

## Considered options

**A second token for structure** (`--radius-none: 0`, for frames, tables and sections), as the
originating issue proposed. Rejected, and recorded here as an explicit no. A token names a *role*
whose value a consumer may re-declare; `none` names its own value, so a consumer who sets
`--radius-none: 4px` holds a token whose name is a lie. Structure being square is a decision the
library makes and states in prose, not a token it exposes.

**A radius scale** (`sm` / `md` / `lg` / `xl`). Rejected. A scale invites each component to pick a
rung, which is how a library ends up with five corner radii and no rule about which one means what.
The only distinction that carries information is *is this thing a control, or is it structure?* —
one token, on the control side of that line.

**A default of `2px`,** the value the originating issue proposed for controls. Rejected. The issue's
own argument is that the component should not be the one deciding the corner, and that applies to the
library's default no less than to the component: shipping `2px` would be the library making the same
call, just in a different file. A product that wants a `2px` corner beside its hairline rules sets
`--radius-control: 2px` in its own theme. That is the contract working, not a gap in it.

**A hard `8px` default,** the pixel equivalent of today's `rounded-lg`. Rejected in favour of
`0.5rem`. They are not interchangeable: `rounded-lg` is `0.5rem`, which tracks the root font size, so
a hard `8px` would silently drop that scaling for anyone who has enlarged their browser text.
`0.5rem` is exactly what the component rendered before, so `primary` and `secondary` are unchanged.

**A published value constraint,** to match the two contracts before this one. Rejected, and the
absence is deliberate. The focus-ring and motion contracts publish numeric rules because a bad value
makes the component *incorrect* — a zero-width ring is no indicator, a sub-3:1 ring fails WCAG.
Radius has no such threshold: CSS ignores a negative value, clamps an oversized one to a pill, the
focus-ring outline takes radius-plus-offset and stays correct at every value, and nothing clips
because the component sets no `overflow`. A rule like "keep it under half the control height" would
be a recommendation dressed as a constraint, which the domain model forbids. The enforceable
constraint sits on the library instead: a control styles its corner from this token and never from a
`rounded-*` literal, checked by a source-scan test over every component.

## Consequences

**Radius joins motion and the focus-ring dimensions as a non-colour block.** It is emitted into
`:root` only, never into `@theme inline` — that block registers each declaration as a Tailwind
colour, so a radius token there would emit a bogus `--color-radius-control`. The palette module is
the wrong home for the same reason: it maps every entry into `@theme inline`.

**Base placement is mildly one-way.** With no class-merge utility and no `className` passthrough, a
`rounded-*` in the base cannot be cleanly overridden by a single variant later — two `rounded-*`
classes on one element leave CSS source order to pick the winner. If a future variant ever needs its
own corner, the correct move is to relocate radius into the variants map for *every* variant, never
to override it in one.

**`ghost` gains a corner it never had.** Its box is transparent, so the fill shows no difference;
the only visible change is its focus-ring outline going from square to rounded, which makes the ring
genuinely uniform across variants — what [ADR 0002](./0002-focus-ring-token-contract.md) intended.
This is a consequence, not a breaking change: nothing is removed, no prop changes, and the two
opaque variants render identically.

**The rule is enforced, not reviewed.** A source-scan test reads every component source and fails on
any `rounded-` occurrence that is not `rounded-[var(--radius-…)]`. biome cannot match a substring
inside a long class string, so this is the chosen mechanism rather than a lint rule; the
component-authoring standard's enforcement table records that.
