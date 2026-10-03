# Control boundary independent of the fill — an edge on a filled Button

> **Narrowed by the maintainer in the #119 triage — see [Amendments](#amendments).** The rejection
> now covers exactly what its title says: an edge on a *filled* Button. An opt-in unfilled variant
> that trades the fill for an edge is accepted and shipped as `variant="outlined"`.

A filled `Button` draws no boundary. Its fill is the only thing separating it from the surface, and
that fill answers to [SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast) directly — at least
3:1 against `surface`, hover included, as `primary`, `secondary` and now `error` publish. The library
ships no `controlBorder` edge on a filled control and no `bordered` prop. `controlBorder` remains
what its name says: the boundary of a control with **no fill of its own**, which means `Input` and
`TextArea`; the outlined Button's edge is `secondary`, not `controlBorder`, because it identifies the
action's role and not merely a control's extent.

## Why this is out of scope

**The cost falls on every consumer; the benefit falls on a few.** This is the whole argument and it
is worth stating first, because the request is otherwise well-evidenced. An always-on edge is not a
capability a theme opts into — it is a visual change to every button in every product using the
library, shipped so that a minority of brands with low-contrast fills can keep their colour. A
1px `controlBorder` edge around a saturated fill reads as a muddy ring; measured against the palette
after [#93](https://github.com/juwel-development/LIB-design-system/issues/93), `controlBorder` sits
at 1.06–1.65 against the fills it would be drawn on, so it does not resolve into a crisp edge either
— it is close enough in luminance to look like a smudge on the fill's rim rather than a deliberate
line. The library is not willing to make every product's primary action carry that.

**The alternative it would replace is not broken.** [#78](https://github.com/juwel-development/LIB-design-system/issues/78)
already answered SC 1.4.11 by constraining the fill, and the constraint is satisfied with margin by
every value the library ships — 5.70 / 7.10 / 5.93 / 7.56 in light and 4.22 / 6.56 / 4.36 / 6.44 in
dark. Nothing in the library's own palette needs rescuing. A second answer to a criterion that is
already discharged is the drift
[`focus-boundary-reinforcement.md`](./focus-boundary-reinforcement.md) argues against one criterion
over: two marks answering one question, where the second exists only for the cases the first handles
badly.

## The counter-evidence, recorded honestly

This rejection is a judgement about cost, not a finding that the request was wrong. Anyone
revisiting it should have the strongest version of the case:

**The fill constraint excludes most of the colour wheel.** Stock Tailwind 500-step hues against
white, against the 3:1 fill rule:

| | hues |
| --- | --- |
| pass | violet 4.23, red 3.76, blue 3.68, pink 3.53 |
| fail | sky 2.77, emerald 2.54, teal 2.49, cyan 2.43, green 2.28, amber 2.15, lime 1.98, yellow 1.92 |

Eight of twelve. So the library's answer to a brand built on amber, yellow, lime, green, teal or cyan
is that the colour cannot be a primary fill on a light ground — and the only remedy on offer is to
darken it until it is no longer the brand's colour. For a library whose stated purpose is one
component set carrying several brands, that is a real limitation and it should not be pretended
otherwise.

**A boundary would have discharged it completely.** SC 1.4.11 requires 3:1 for *"visual information
required to identify user interface components"*. A boundary at 3:1 **is** that information, and the
fill then owes the surface nothing. For the consumer that prompted this — `F-mix-your-tracks`, brand
amber `#e7a61c` on ground `#f5eee0` at 1.84:1 — `controlBorder` measures 4.12:1 on that ground, so an
edge would have identified the control, and with the dark ink [#93](https://github.com/juwel-development/LIB-design-system/issues/93)'s
constraint already directs them to adopt, the label reaches 9.48:1. That brand would have worked
completely and legally. It does not, and that is the cost being accepted here.

**Triage got as far as deleting the fill rule before reversing.** The reasoning had reached the point
of removing #78's constraint entirely, on the grounds that an unconditional boundary makes it
unnecessary — which would have left a *shorter* contract, not a more conditional one. That is
recorded because it is the shape the request should take if it ever returns: not "add a border prop"
but "the boundary identifies the control and the fill rule goes away."

## What the consumer does instead

Nothing the library provides. A product whose brand fill cannot clear 3:1 either picks a darker
value for the CTA, or draws its own edge against the rendered element:

```css
.request-form [type='submit'] {
  border: 1px solid var(--color-control-border);
}
```

This needs no `className` and no library support, so it is not blocked — but it is an override, the
consumer owns it, and the library is not calling it the sanctioned answer. Calling it that was
considered and declined: it would have been a way of declaring the gap closed without closing it.

## What would change this

**A second attesting consumer, with a different brand.** The case rests on one product today. A
second brand independently unable to use the primary CTA would move this from "one product's colour"
to "a class of brands the library refuses", which is a different argument than the one weighed here.

**An edge that is not ugly.** The aesthetic objection is specific, not general: a neutral
`controlBorder` line around a saturated fill. A construction that identifies the control without
drawing a neutral ring on the fill's rim — one that derives from the fill itself while still clearing
3:1 against the surface, say — would not be refused on this file's reasoning, because the reasoning is
about what every consumer's buttons would have to look like.

**A separate primitive rather than a change to `Button`.** The rejection is of an edge on the filled
`Button` every product already uses. An unfilled control that a low-contrast brand reaches for
*instead* imposes nothing on anyone else, and was noted in triage without being costed. It is a new
component question, not this one.

## What this rejection is not

It does not touch [#93](https://github.com/juwel-development/LIB-design-system/issues/93)'s ink
constraint, which is independent and landed separately: a fill owes 4.5:1 to the text drawn on it
whatever identifies the control's edge. Nor does it touch `controlBorder` on `Input` and `TextArea`,
where the border is the only boundary and is exactly right.

It also does not reach `--control-min-width`. The consumer's override sets `min-width: 0` alongside
its border, and that half is a separate complaint that has never been triaged.

## Prior requests

- [#91](https://github.com/juwel-development/LIB-design-system/issues/91) — "Button: a control
  boundary independent of the fill — route (b), deferred from #78"
- [#78](https://github.com/juwel-development/LIB-design-system/issues/78) — route (b) was the option
  that ticket deferred; triage scoped it to route (a) and it shipped as the fill constraint

## Amendments

**The rejection is narrowed to filled Buttons
([#119](https://github.com/juwel-development/LIB-design-system/issues/119), triage).** The original
text refused three things in one breath: an always-on edge on the filled Button, a `bordered` prop,
and "any variant that trades the fill for an outline". The maintainer kept the first two and
released the third. The reasoning above never reached it — every argument here is about what *every
consumer's* filled buttons would have to look like, and an opt-in variant imposes nothing on a
button that does not ask for it. *What would change this* already named the shape: "an unfilled
control that a low-contrast brand reaches for *instead* imposes nothing on anyone else". The brief
made it a `Button` variant rather than a separate primitive, because it is the same action in a
quieter register and shares the faced variants' inset, height and minimum width.

What stands, unchanged: a filled `Button` draws no edge, `controlBorder` is drawn only by controls
with no fill, and there is no `bordered` prop. The outlined variant's edge is drawn in `secondary`
and pairs with `secondary` text, so it reads as the quiet form of the filled secondary; it is not
the neutral `controlBorder` ring on a saturated fill that this file refuses. The focus contract is
untouched — [`focus-boundary-reinforcement.md`](./focus-boundary-reinforcement.md) still holds, and
the outlined edge does not change on focus.

The consumer override recorded under *What the consumer does instead* also set `min-width: 0`, and
that half is now triaged too: #119 keeps the shared floor on the four faced variants and lets it
yield to a holder narrower than it, so a button in a tight cell shrinks and wraps instead of
overflowing. No content-sizing prop was added for it.
