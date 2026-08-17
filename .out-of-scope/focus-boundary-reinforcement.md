# Focus boundary reinforcement — a second focus affordance on a control's own edge

The library does not reinforce a control's boundary on focus, and declares no token for doing so.
The focus ring is the only thing that changes when a primitive takes focus. A theme that wants a
focused control to read more strongly raises the *ring*, not the edge.

## Why this is out of scope

**The rule is a definition, not an inference.** `CONTEXT.md`'s **Focus ring** entry states it
outright:

> It is also the *only* thing that changes on focus: a boundary, fill and geometry hold still, so
> focus reads as a mark appearing rather than as the thing thickening.

This is worth being precise about, because the request that prompted the entry argued — correctly —
that [ADR 0002](../docs/adr/0002-focus-ring-token-contract.md) does not cover the case. ADR 0002 is
about the ring: one ring, one token set, drawn as an `outline`. "The border never changes on focus"
is a reasonable reading of its *spirit* and nothing more. But the rule does not rest on that reading.
It is stated as part of what the focus ring **is**, one level up in the domain model, and a proposal
to add a second focus affordance is a proposal to change that definition.

**A second affordance is the drift ADR 0002 exists to stop.** That ADR's finding was not that a
colour had been chosen badly but that *"four values with no stated rule is four chances to get it
wrong."* A focused control whose edge also changes has two marks answering one question, and the
second one is per-component by construction — a `Link` has no box to reinforce, so the affordance
could never be the one thing every focusable primitive shares. "One value with a stated rule" stops
being true the moment there are two.

**The lever already exists, and a theme reaching for a new token has usually not pulled it.** This
is the part worth keeping, and it generalises past the request that produced it.

The complaint is that a focused control's own edge is the weakest line in the group, so the eye reads
the ring as floating *near* the field rather than around it. But that ordering — ring stronger than
edge, separated by a transparent `--focus-ring-offset` gap — is the library's own, at nearly the same
ratio in both shipped themes:

| Theme | control border | focus ring | ring / border |
| ----- | -------------- | ---------- | ------------- |
| light (`#ffffff`) | 4.76:1 | 7.58:1 | 1.59 |
| dark (`#0f172a`) | 6.96:1 | 12.02:1 | 1.73 |
| the reporting theme (`#f5eee0`) | 3.04:1 | 4.75:1 | 1.56 |

The arrangement is identical. What differs is **absolute magnitude**: the library's own neutrals sit
1.6–2.3× above the [SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast) 3:1 floor, and the
reporting theme sat its whole set on it. So the diagnosis is not that the focus contract fails on a
low-contrast ground — it is that the theme's ring was under-powered for its ground.

Holding the resting border at 3.04:1, so the quiet edge the theme deliberately chose is untouched,
and darkening `--color-focus-ring` alone reaches the goal with no library change:

```
--color-focus-ring: #5f584b;   /* 6.10:1 on #f5eee0 — ring/border 2.01 */
--color-focus-ring: #564f43;   /* 7.01:1 on #f5eee0 — ring/border 2.31, library-light parity */
```

Raising `--color-control-border` instead also works, but it is the worse of the two moves: it changes
the resting appearance, and on this ground it cannot pass roughly 4.75:1 without out-weighing the
theme's own ring and making the edge the strongest line in the group — the reported problem,
inverted.

**The rule that generalises:** *the ring is what carries a focused control, so a ring must be raised
against its ground rather than left near the floor. A theme that sets its whole neutral set at 3:1
will read as a floating ring with nothing failing a check* — `Palette.spec.ts` asserts each token
against `surface` independently, and a theme at 3.04:1 and 4.75:1 passes every assertion the library
makes.

## What this rejection is not

It does not touch the **motion** half of the request that produced it. That half asked for a way to
say "instant on focus", because `Input` and `TextArea` ship
`transition-colors duration-[var(--motion-duration-color)]` and a focus indicator that fades in is an
[SC 2.4.7](https://www.w3.org/TR/WCAG22/#focus-visible) defect. There is no defect to fix: both
recipes use the same construction `Button` does — `outline-focus-ring` sets the colour **at rest**,
and only `focus-visible:outline` and `focus-visible:outline-[length:…]` toggle style and width. No
colour changes on focus, so `transition-colors` has nothing to animate and the ring is already
instant. That is [ADR 0001](../docs/adr/0001-motion-token-contract.md)'s structural discharge, and it
holds on the controls and not only on `Button`.

The fade the reporting consumer saw was its *own* border-colour change fading. It exists only as a
consequence of the affordance rejected above, and it goes away with it.

## What would change this

One thread was left genuinely open and is not settled by this rejection: whether the ring's published
constraint should be stated **relative to `--color-control-border`** rather than absolutely against
`surface`. The table above is the argument for it — every shipped theme holds the ring at roughly
1.6× its control edge, no document says so, and the theme that got into trouble is the one that
satisfied both absolute floors while collapsing the relationship between them. That would be a change
to ADR 0002's constraint, and it would make the finding above enforceable instead of merely recorded.
It is not a new token, so it does not reopen this file.

What *would* reopen it is a case where raising the ring is not available — a focusable primitive whose
ring cannot carry the job on some ground, argued from a site rather than from symmetry. The rejection
is of a second focus affordance, not of the observation that a low-contrast ground asks more of a
theme.

## Prior requests

- [#88](https://github.com/juwel-development/LIB-design-system/issues/88) — "Input/TextArea: no way to reinforce the control boundary on focus"
