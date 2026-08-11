---
status: accepted
---

# The library declares one motion token, for the motion it performs itself

The library performs exactly one motion — a colour transition between two states of a component —
so its motion contract is a single token, `--motion-duration-color`, which the library re-points to
`0ms` under `prefers-reduced-motion`. Motion gets a token rather than a documented constant because
the component-authoring standard forbids a `className` passthrough: without a name, a consumer who
wants no motion has no way to reach in and say so.

## Considered options

**Re-pointing Tailwind's `--default-transition-duration` / `--default-transition-timing-function`**
instead of declaring our own. Rejected. It lets a component write a bare `transition-colors`, which
is genuinely tidier, but those variables are the global default for every `transition` utility in
the compiled stylesheet — a consumer importing our stylesheet would find every transition in *their*
application silently running at our speed, and our reduced-motion rule zeroing animations we never
performed.

**A page-transition token** (`--motion-duration-page`), as originally proposed. Rejected: the
library ships primitives, not a router, so a cross-document transition is motion the *consumer*
performs. Declaring it here forces a choice between governing motion we don't perform and shipping a
motion token we decline to make accessible.

**An easing token** (`--motion-ease-color`). Rejected: easing describes how a rate of change is
distributed, and over 150ms across a small hue step there is no perceptible rate to distribute.
Omitting the `ease-` utility falls back to Tailwind's default curve at no cost.

**Leaving `prefers-reduced-motion` to the consumer**, on the grounds that a colour cross-fade has no
vestibular cost and the setting exists for movement. True, and not worth acting on — zeroing a
colour fade costs the viewer nothing, and a shared library should make the accessible thing the
default rather than something every consumer must remember.

**A four-property transition allowlist** (`color`, `background-color`, `border-color`,
`text-decoration-color`) as the rule forbidding `transition-all`. Replaced by "`transition-colors`
is the only permitted transition utility". Tailwind's group is our four plus `outline-color`,
`fill`, `stroke` and gradient stops — all paint, no geometry — so it draws the same line while being
machine-enforceable, and it already includes properties the hand-written list had missed.

## Consequences

The value `150ms` is identical to Tailwind's own default, so the token changes nothing visually. Its
entire purpose is to *have a name* that a consumer theme and the reduced-motion query can reach — it
is not redundant, and should not be deleted as dead weight.

Because the token is not a colour, it cannot be carried by the palette module or mapped into
`@theme inline`, and the generated stylesheet's renderer had to grow a second, non-colour block to
emit it. That block is the shape any future non-colour token contract — radius, focus-ring
dimensions — will extend.

The library zeroes only the motion it performs. It deliberately ships no blanket
`transition-duration` reset, so a consumer's own animations remain the consumer's business.
