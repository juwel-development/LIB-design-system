---
status: accepted
---

# One focus ring, drawn as an outline, with the contrast rule stated on the token

The library declares one focus ring — `--color-focus-ring`, `--focus-ring-width`,
`--focus-ring-offset` — used by every focusable primitive regardless of variant, and draws it with
CSS `outline` rather than a `box-shadow` ring. Each token carries a published constraint, because
the defect this replaces was not a badly chosen colour but a contract that never said what a correct
colour was.

## What went wrong before

`Button` set a different ring colour per variant, from `--color-primary-ring`,
`--color-secondary-ring` and `--color-ring`. Nothing constrained their contrast, and the library's
own light theme failed WCAG 2.2 SC 1.4.11 on all three: 2.72:1, 2.14:1 and 2.56:1 against
`surface`. The tint-of-the-brand pattern guaranteed it — `--color-primary-ring` `#a78bfa` is a
*lighter* step of `--color-primary` `#8b5cf6`, so on a light surface the ring was the least visible
thing on the control at the moment it had to be the most.

Four values with no stated rule is four chances to get it wrong. One value with a stated rule is
neither.

## Considered options

**Keeping the per-variant rings and constraining each.** Rejected. A focus ring communicates
keyboard position, not the importance of the control, so varying it by variant encodes a
distinction that does not exist. Constraining four values also leaves four ways to break the
contract where one is enough.

**Keeping the name `--color-ring` for the surviving token.** Rejected, despite being the least
breaking option. Its current meaning is "ring for surfaces that have no fill of their own"; after
the collapse it would mean "ring for everything". A consumer who tuned it for ghost buttons would
find it on primary fills with no error and no changelog entry naming their token. A rename that
breaks the build is kinder than a redefinition that does not.

**One literal value shared by both themes**, rather than a role with a value per theme. Rejected.
It is satisfiable only while the two surfaces sit far enough apart in luminance — true of `#ffffff`
and `#0f172a`, not true in general — and the contract would have had to publish that precondition.
A role with a per-theme value is always satisfiable, because each value answers only to its own
surface.

**Tailwind's `ring` with `ring-offset`.** Rejected, and this is the least obvious of these choices.
`ring` compiles to `box-shadow`, and `ring-offset` fakes its gap by painting a second shadow in the
offset colour — which puts a band of `surface` around every focused control, visible as a halo the
moment a control sits on anything that is not `surface`. `outline-offset` leaves the gap genuinely
transparent, so the real background shows through and there is no offset colour to theme.

Decisively: **`box-shadow` is suppressed entirely in forced-colors mode.** A box-shadow focus ring
does not get recoloured for Windows High Contrast users, it does not render — an SC 2.4.7 failure on
top of the contrast one. `outline` is retained and forced to the system highlight colour.

**Making the offset colour a fourth token**, so the painted band could follow a panel background.
Rejected as a consequence of the above: with a transparent gap there is no band to colour.

**Deleting the three old tokens outright.** Rejected in favour of a fallback, though the argument is
closer than it looks. These tokens are *inputs* — the consumer writes them and the library reads
them — so nothing can be aliased in the usual sense, and neither deleting nor deprecating produces
an error, because CSS variables never error. Both options are silent. The fallback
(`var(--color-ring, …)`) is the one mechanism that actually keeps a consumer's existing value
working, so it earns its keep despite carrying a non-conformant value forward for anyone whose
`--color-ring` was already failing. It is removed in the next major.

Only `--color-ring` is honoured. The two variant rings are dropped: honouring one would make a
single variant's colour the ring for every control, which is the defect this ADR exists to remove.

## Consequences

**The library must stop declaring the three old tokens while still reading one of them.** A
fallback only reaches its default when the variable is undeclared, so leaving `--color-ring:
#94a3b8` in the generated stylesheet would make `var(--color-ring, …)` resolve to the 2.56:1 value
forever and the fix would ship as a no-op. The palette holds the new value as a plain hex — which is
what the contrast test checks — and the renderer wraps that one declaration in the fallback.

**The ring is instant by construction rather than by exception.** ADR 0001 permits
`transition-colors` and nothing else, and Tailwind's colours group includes `outline-color` — so an
outline-drawn ring would fade in, and a focus ring that fades is briefly invisible. Rather than
carve an exception out of ADR 0001, `Button` sets `outline-color` at rest and toggles only
`outline-width` and `outline-style` on `focus-visible`. The colour never changes, so there is
nothing to animate and no rule for a later change to break. ADR 0001 records the hazard.

**The contract assumes controls sit on `surface`.** With a transparent gap the ring is adjacent to
whatever is really behind the control, so "≥ 3:1 against `surface`" is sufficient only while that
holds. The painted band appeared to guarantee more, but bought the guarantee with the halo and only
ever covered the ring's inner edge. The first primitive that paints its own background inherits this
question.

**The constraints are stated, not enforced.** The test in `Palette.spec.ts` computes the ratio for
both themes and fails below 3:1, which stops *the library* regressing its own palette. Nothing can
fail a consumer's build for choosing a bad value — that is why the constraint is published
numerically in the token's documentation rather than left to the test to imply.
